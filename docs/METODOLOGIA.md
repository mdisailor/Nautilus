# NAUTILUS — Metodologia di Calcolo (METODOLOGIA.md)

Documento tecnico-scientifico sulle logiche di calcolo, fonti e assunzioni.
Aggiornato: 2026-07-01

---

## 1. Fonti dati e loro limiti

### Open-Meteo (OM)
- Modello: best_match, prevalentemente IFS/ECMWF a ~9km di risoluzione
- Aggiornamento: ogni ora
- Limite principale: sottostima sistematica della velocità del vento offshore nel Mediterraneo, dipendente dal fetch (distanza di mare aperto percorsa dal vento). A 50km dalla costa l'errore quadratico può arrivare al 40%, scende al 25% a 200km (Zecchetto et al. 2014, Cavaleri et al. 2024)
- Nel Tirreno settentrionale: tutte le stazioni sono entro ~250km di costa — siamo sempre nella zona di massimo errore per OM

### AROME via Open-Meteo MeteoFrance
- Modello: AROME, risoluzione ~2.5km
- Aggiornamento: ogni 6 ore
- Vantaggio principale: risolve meglio i canali stretti (Piombino, Bonifacio) e le isole piccole (Gorgona, Montecristo)
- Limite: copre principalmente territorio francese e mar Tirreno nord-occidentale; qualità degradata verso sud e est
- Risultato empirico NAUTILUS: AROME migliore sulle isole piccole (Gorgona, Montecristo, Capraia), OM migliore su costa, Elba, Canale Piombino (dato 16-9 su 25 stazioni, giugno 2026)

### Stazioni reali
- Fonti: MeteoNetwork API, CFR Toscana, Windfinder /report/, Meteosystem
- Limite: stazioni amatoriali o semi-professionali, possibili errori di calibrazione, sensori mal orientati, dati stantii
- Stazioni problematiche note: Vada (direzione sistematicamente opposta alle vicine), Bonifacio/Cap Pertusato (aggiornamento irregolare, valori spesso fissi per ore)

---

## 2. Raccolta dati (bias_samples)

### Struttura di ogni campione
```json
{
  "ts": "2026-06-19T08:11:02.960Z",
  "station": {
    "wind_kt": 1.8,
    "gust_kt": 2.7,
    "direction": 32,
    "direction_txt": "NNE",
    "source": "mnw_web",
    "obs_time": "2026-06-19T09:00:20+02:00"
  },
  "om": {
    "wind_kt": 2.5,
    "gust_kt": 5.8,
    "direction": 32,
    "pressure_mb": 1019.0
  },
  "arome": {
    "wind_kt": 5.7,
    "gust_kt": 11.1,
    "direction": 72
  },
  "delta": { "wind_kt": -0.7 },
  "delta_arome": { "wind_kt": -3.9 }
}
```

### Convenzioni
- `delta = stazione - modello` (negativo = modello sovrastima)
- `obs_time` presente solo per stazioni Windfinder (campo `dtl` nel JSON embedded); usato per anti-duplicato
- Max 100 campioni per stazione in Redis (rotazione FIFO)
- Frequenza raccolta: ogni 30 minuti (cron-job.org)

---

## 3. Metriche di valutazione

### MAE (Mean Absolute Error)
```
MAE = media(|stazione_i - modello_i|) per i = 1..n
```
Misura l'errore medio assoluto. Non si annulla con errori opposti — se il modello sbaglia sempre di 3kt ma a volte in eccesso e a volte in difetto, il bias è 0 ma MAE è 3. È la misura più onesta dell'accuratezza operativa.

### Bias (mean signed error)
```
bias = media(stazione_i - modello_i)
```
Indica se il modello tende sistematicamente a sovrastimare (bias negativo) o sottostimare (bias positivo). Utile per la correzione additiva nelle previsioni AI.

### RMSE (non ancora implementato)
```
RMSE = sqrt(media((stazione_i - modello_i)^2))
```
Penalizza maggiormente gli errori grandi rispetto al MAE. Da aggiungere in una versione futura di mae.html.

---

## 4. Sistema di previsioni AI

### Flusso
1. `action=predict` chiama Open-Meteo per le prossime 12 ore (H+1, H+3, H+6, H+9, H+12)
2. Legge lo storico bias della stazione collegata (`bias_station` in ZONES)
3. Calcola il bias medio (`mean_delta_wind`) come correzione
4. Costruisce un prompt per Claude Sonnet con: dati OM, bias storico, storico vento recente (`predict_history`), casi simili passati
5. Claude genera la previsione testuale con valori corretti
6. Il risultato viene salvato in `predict_history:<zona>` con `slot: morning/afternoon`

### Backfill actuals
- Il cron `backfill_actuals` (7 volte/giorno) confronta le previsioni passate con i dati OM reali delle ore successive
- Popola `actual_3h`, `actual_6h`, `actual_12h` nei record di `predict_history`
- Queste colonne alimentano le metriche di accuratezza in stats.html
- Opera su tutte le zone con `enabled:true` e `bias_station` definita in ZONES

---

## 5. Stratificazione dell'errore (pianificata)

### Variabili di stratificazione identificate
Le seguenti variabili sono già presenti nei `bias_samples` e permettono di segmentare l'analisi MAE:

| Variabile | Campo sorgente | Segmentazione |
|---|---|---|
| Fascia velocità | `om.wind_kt` | basso <8kt, medio 8-15kt, alto >15kt |
| Settore sinottico | `om.direction` | N (315-45°), E (45-135°), S (135-225°), W (225-315°) |
| Ora del giorno | `ts` | notte 0-6, mattina 6-12, pomeriggio 12-18, sera 18-24 |

### Motivazione scientifica
La letteratura (Huang et al. 2026, Cavaleri et al. 2024) mostra che l'errore dei modelli NWP varia sistematicamente per fascia di velocità e settore di vento. Nel Mediterraneo il bias dipende fortemente dal fetch (distanza dalla costa nella direzione del vento) — un vento da Nord su Gorgona ha fetch lunghissimo dalla Corsica, mentre lo stesso vento da Est su Livorno trova la terraferma dopo pochi km.

### Analisi matriciale (da implementare)
Costruire una matrice MAE per ogni stazione: righe = fasce di velocità, colonne = settori di vento, cella = MAE OM / MAE AROME. Permetterebbe di identificare condizioni specifiche dove un modello è sistematicamente migliore dell'altro.

---

## 6. Griglia ibrida (pianificata)

### Obiettivo
Produrre un campo di vento attuale corretto che combini il campo di sfondo OM/AROME con le osservazioni reali delle stazioni, risultando in una mappa più accurata rispetto al solo modello grezzo.

### Metodo: Optimal Interpolation (OI)
Fonte: Gandin 1963; implementazione operativa: Hieta et al. 2025 (FMI, riduzione RMSE 24-29%)

Il metodo OI combina un campo di background NWP con osservazioni puntuali:
```
campo_corretto(x) = campo_NWP(x) + K(x) * (osservazione - campo_NWP(stazione))
```
Dove K(x) è il peso di ogni osservazione nel punto x, funzione della distanza e dell'incertezza relativa tra modello e osservazione.

### Ponderazione con Kriging
Invece di una funzione di peso semplice basata sulla distanza, Kriging stima la covarianza spaziale dell'errore del modello e usa questa struttura per calcolare pesi ottimali. Le stazioni con alta varianza storica (MAE alto, errori irregolari come Vada) contribuiscono meno; quelle con basso MAE e comportamento stabile (Bocca d'Arno CFR, Giglio Porto) pesano di più.

### Scelta del campo di background
- Zone costiere e Elba: OM (vince in 16/25 stazioni, dati giugno 2026)
- Isole piccole (Gorgona, Montecristo, Capraia): AROME (vince empiricamente)
- Zone senza stazione reale vicina: campo di background puro, nessuna correzione

### Dati necessari per implementazione
1. Griglia di punti regolare sul bbox 42-44N / 9-12E (da definire passo, es. 0.1°)
2. Fetch OM/AROME per tutti i punti della griglia (già parzialmente implementato con proxy Vercel)
3. Valore `bias_medio_recente` per ogni stazione (già in `bias_samples`)
4. Libreria di interpolazione spaziale (candidata: `@sakitam-gis/kriging`, MIT license)

---

## 7. Fonti scientifiche di riferimento

| Autori | Anno | Titolo sintetico | Rilevanza |
|---|---|---|---|
| Gandin | 1963 | Objective Analysis of Meteorological Fields | Base teorica OI |
| Zecchetto et al. | 2014 | ASCAT vs ECMWF Mediterranean | Bias costa, dipendenza dal fetch |
| Cavaleri et al. | 2024 | ECMWF/MetOffice offshore blowing winds | ~10 celle di griglia dalla costa come soglia critica |
| Hieta et al. | 2025 | ML post-processing FMI (Gridpp+OI) | Metodo operativo OI, -24-29% RMSE |
| Huang et al. | 2026 | LightGBM wind correction NWP | Stratificazione per fascia velocità, -20-40% RMSE |
| Qiu et al. | 2025 | NWP 2km vs ERA5 offshore | NWP lower mean bias but higher absolute error |
| arxiv 2512.03606 | 2025 | Transformer observation-driven correction marine winds | -45% errore GFS a 1h, migliore lungo coste |


---

## OI v2 — Architettura attuale (aggiornato 2026-06-30)

### Logica applyOI — sostituzione progressiva

La versione precedente calcolava un bias (stazione - OM) e lo sommava a OM via IDW. La versione attuale sostituisce OM direttamente con il valore stazione in modo progressivo basato sulla distanza.

**Peso stazione**: `w = (1 - d/OI_MAX_DIST_KM)² × reliability`
- A 0km: w=1.0 (stazione comanda completamente)
- A 20km: w=0.25 × reliability
- A 40km: w=0.0 (fuori raggio)
- `OI_MAX_DIST_KM = 60`

**Normalizzazione**: `rawSumW` cappato a 1.0 → `stationInfluence = min(1.0, rawSumW)`, `omInfluence = 1 - stationInfluence`. Garantisce che `totalW` sia sempre 1.0 evitando valori fuori range con più stazioni vicine.

**Interpolazione velocità**: `finalSpeed = Σ(st.speed × w × scale) + om.speed × omInfluence`

**Interpolazione direzione**: via componenti U/V per evitare problemi con la media circolare.
- `U = -speed × sin(dir)`, `V = -speed × cos(dir)` (convenzione meteo)
- `finalDir = atan2(-finalU, -finalV)` convertito in gradi 0-360
- Nessun cap direzione — la stazione comanda

**Stazioni escluse globalmente**: `OI_EXCLUDED = { bonifacio_mnw, vada_mnw }` — stazioni con dati non rappresentativi del mare aperto.

**Logica diretta** (rimossa nella v2): non più usata — sostituita dal sistema di pesi con `min_weight` nelle grid_rules.

---

### grid_rules — Regole per cella

Struttura Redis (chiave: `grid_rules`): oggetto JSON con una entry per ogni cella che necessita regole specifiche.

**Formato chiave**: `lat.toFixed(2) + "_" + lon.toFixed(2)` — ATTENZIONE: usare sempre due decimali (es. `"43.00_10.65"` non `"43.0_10.65"`).

**Campi disponibili per cella**:
```json
{
  "allowed_stations": ["svincenzo_porto"],  // whitelist: solo queste stazioni
  "excluded_stations": ["follonica"],        // blacklist: escludi queste
  "min_weight": 0.95,                        // peso minimo garantito indipendentemente dalla distanza
  "base_model": "arome",                     // campo base (non ancora implementato, prossimo step)
  "reason": "descrizione"
}
```

**Logica min_weight**: se `rawSumW < min_weight`, i pesi vengono scalati proporzionalmente per garantire che l'influenza totale delle stazioni sia almeno `min_weight`. Permette a stazioni lontane (15-20km) di comandare quasi completamente se necessario.

**Inizializzazione**: `action=grid_rules_init&k=mdi` — scrive le regole di default in Redis.
**Lettura**: `action=grid_rules_get` — restituisce tutte le regole o una specifica con `?cell=43.00_10.65`.

**Regole attive** (10 totali, aggiornate 2026-06-30):
| Cella | Stazione | min_weight | Note |
|---|---|---|---|
| 43.25_10.65 | svincenzo_porto | 0.95 | San Vincenzo N/NE vs OM W/SW |
| 43.00_10.40 | svincenzo_porto | 0.95 | Cella più vicina a S.Vincenzo |
| 43.25_10.40 | svincenzo_porto | 0.90 | Zona S.Vincenzo |
| 43.00_10.65 | populonia_cfr | 0.90 | Populonia interna, direzione opposta a OM |
| 43.75_10.15 | viareggio_cfr | 0.80 | Viareggio CFR comanda costa |
| 44.00_10.15 | viareggio_cfr | 0.80 | Viareggio CFR zona nord |
| 43.50_9.90 | gorgona_cfr | 0.85 | Gorgona ✅ funziona |
| 43.00_9.90 | capraia_cfr | 0.85 | Capraia ✅ funziona |
| 43.00_9.65 | capraia_mnw | 0.70 | Capraia zona est |
| 42.75_10.65 | escludi follonica | — | Follonica bias anomalo |

---

### buildVectorField — Campo vettoriale flusso animato

**Problema risolto (v1.6.52)**: quando OI è attivo, le stazioni NON vengono aggiunte come sorgenti separate `nauSources`. Prima le stazioni con peso 10 sovrascrivevano il campo ignorando le correzioni OI già calcolate. Ora con OI ON il campo usa solo `activeGrid()` (che include già le correzioni OI) + le zone di previsione.

**Problema risolto (v1.6.53)**: a zoom alto (z11+) con passo griglia 0.25°, tutte le sorgenti OM cadevano fuori dal viewport con margine 50px. Fix: margine aumentato a 300px + fallback che garantisce sempre le 6 sorgenti più vicine al centro mappa indipendentemente dal viewport.

```javascript
// Quando OI è OFF: stazioni aggiunte come nauSources con peso 10
// Quando OI è ON: stazioni già incorporate in activeGrid() — non duplicare
if (!oiEnabled) {
  state.stationData.forEach(function(st){ ... nauSources.push(...) });
}
```

---

### Popup stazioni — Doppio fallback

Il popup delle stazioni MNW usa una strategia a due livelli:
1. **stations_snapshot** (Redis, veloce) — cerca per `st.key`, poi con varianti senza `_cfr`/`_mnw`
2. **bias_history** (fallback) — se stations_snapshot non trova dato valido, scorre fino a 10 campioni per trovare il primo con `station.wind_kt` non null

Causa del problema originale: `bias_history&limit=1` restituiva l'ultimo campione che poteva avere `station.wind_kt=null` (scraping fallito). Fix: limit=5 e loop di ricerca primo valido.

---

### Export griglia Excel (📊 XLS)

4 fogli: 1-OM, 2-OI (ON/OFF nel nome), 3-Delta, 4-Stazioni.
- **Foglio 3-Delta**: lat, lon, OM kt, OI kt, Δkt, OM dir°, OI dir°, Δdir° (circolare corretto), stazione più vicina entro 28km, distanza, ST kt, ST dir°
- **ATTENZIONE**: la colonna "Stazione" mostra la stazione geograficamente più vicina, NON quella usata da OI tramite grid_rules. Per celle con grid_rules la stazione usata può essere diversa da quella mostrata.
- Timestamp nel nome foglio usa `.` invece di `:` (es. `17.05` non `17:05`) per compatibilità Excel.


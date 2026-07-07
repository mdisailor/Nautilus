# NAUTILUS — Metodologia di Calcolo (METODOLOGIA.md)

Documento tecnico-scientifico sulle logiche di calcolo, fonti e assunzioni.
Aggiornato: 2026-07-06

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
- Fonti: CFR Toscana (solo vento — pagina `type=anemo`), MeteoNetwork API, Windfinder /report/, Meteosystem
- **Solo vento è misurato da CFR**: la rete CFR non ha una pagina pubblica di pressione (`type=baro`/`type=mareo` non esistono come le pagine anemo/termo). Da luglio 2026 abbiamo scoperto e agganciato anche `type=termo` (temperatura reale, 17 stazioni su 18 CFR condividono il codice con un termometro nello stesso cabinet)
- Pressione reale disponibile solo su `pressure_mnw` (poche stazioni MeteoNetwork); altrove resta il valore del modello OM
- Ricerca pressione conclusa luglio 2026: nessuna rete barometrica pubblica aggiuntiva trovata (CFR, LaMMA, SIR Mareografia — solo 3 boe note e non scrapabili — tutte verificate senza esito)
- Limite: stazioni amatoriali o semi-professionali, possibili errori di calibrazione, sensori mal orientati, dati stantii
- Stazioni problematiche note: Vada e Bonifacio (dati non rappresentativi, esclusi dall'OI), Livorno CFR (in realtà un mareografo, non un vero anemometro — da rinominare)

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
    "temp_air_real": 24.5,
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
- `delta = stazione - modello` (negativo = modello sovrastima). **Questa convenzione di segno è la fonte dei due bug corretti a luglio 2026 (vedi sezione 9) — va sempre verificata con un esempio numerico concreto prima di scrivere qualunque formula di correzione che la usi.**
- `obs_time` presente solo per stazioni Windfinder (campo `dtl` nel JSON embedded); usato per anti-duplicato
- Max 100 campioni per stazione in Redis (rotazione FIFO)
- Frequenza raccolta: ogni 30 minuti (cron-job.org)
- `temp_air_real`: aggiunta luglio 2026, dalla pagina termometrica CFR, non ancora usata nel calcolo (solo raccolta)

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

## 4. Tre sistemi distinti — da non confondere

NAUTILUS ha tre accumulatori di dati indipendenti, con scopi e chiavi Redis diverse. È importante non confonderli (causa di equivoci passati):

| Sistema | Chiave Redis | Cosa confronta | Usato da |
|---|---|---|---|
| Previsione AI + correzione | `predict_history:zona`, `predict_bias:zona`, `bias:zona` | Previsione testuale AI vs reale misurato dopo N ore | stats.html, il prompt di previsione stesso |
| Confronto grezzo modelli | `bias_samples:stazione` | Stazione vs OM vs AROME, ogni 30 min, nessuna correzione applicata | mae.html |
| Punteggio modelli | `model_score:stazione` | Riepilogo calcolato da bias_samples: quale modello vince per condizione | score.html |

Il secondo e terzo sistema sono **osservazione pura, mai corretta** — non possono avere bug di segno perché non applicano nessuna formula di correzione, solo registrano cosa è successo. Il primo sistema invece **applica attivamente una correzione**, ed è quindi l'unico dove un errore di segno può esistere e propagarsi (vedi sezione 9).

---

## 5. Motore di previsione AI — i livelli di calcolo in dettaglio

Quando si genera una previsione (`action=predict`), l'AI (Claude Sonnet) non parte mai da zero: riceve un prompt strutturato su livelli, dal più concreto al più raffinato. Ogni livello è indipendente dagli altri — se un livello manca (es. storico correzioni appena azzerato), gli altri restano comunque disponibili.

### Livello 1 — Stazione reale in tempo reale (ground truth)
Se disponibile e recente (non stantia), il dato misurato in questo momento dalla stazione collegata alla zona (`bias_station` in `ZONES`). È il dato più autorevole quando esiste, indipendentemente da tutto il resto.

### Livello 2 — Previsione Open-Meteo (H+1/3/6/9/12)
Il modello meteo di base, sempre disponibile, fetchato ad ogni chiamata.

### Livello 3 — Storico di 14 giorni (`snap:zona:timestamp`)
Accumulato in continuo ogni 30 minuti, indipendentemente dal sistema di previsione/correzione. Da qui si calcolano:
- **Trend di pressione attuale**: confronto tra gli ultimi 3 campioni (calo rapido / calo / stabile / rialzo / rialzo rapido)
- **Media e massimo vento nelle ultime 24h**
- **Casi simili storici** (`similar_cases`): si cercano nei 14 giorni i momenti passati con lo stesso trend di pressione di adesso, e si mostra all'AI cosa ha fatto realmente il vento 6 ore dopo in quei casi — è un meccanismo di ragionamento per analogia (case-based), distinto dalla correzione bias e da essa indipendente

### Livello 4 — Correzione bias (`predict_bias:zona`)
Solo se ci sono almeno 5 previsioni verificate per un dato orizzonte, si inietta un'istruzione esplicita di correzione: *"il vento reale è stato in media X kn diverso dal previsto per questo orizzonte, applica: previsione_corretta = OM + bias"*. È un raffinamento aggiuntivo sopra i livelli 1-3, non un prerequisito — la sua assenza (es. dopo un reset) non impedisce una previsione sensata, solo toglie l'ultimo aggiustamento fine.

### Backfill actuals
Il cron `backfill_actuals` confronta periodicamente le previsioni passate con i dati reali delle ore successive, popolando `actual_1h/3h/6h/9h/12h` in `predict_history`. Questi valori alimentano sia la correzione del Livello 4 sia le metriche di accuratezza in stats.html. Opera su tutte le zone con `enabled:true` e `bias_station` definita in `ZONES` — **il nome in `bias_station` deve coincidere esattamente con la chiave sotto cui i dati reali vengono salvati in `bias_samples`, altrimenti il confronto fallisce silenziosamente** (causa di un bug reale trovato e corretto a luglio 2026, vedi sezione 9).

---

## 6. Stratificazione dell'errore (pianificata)

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

## 7. Griglia ibrida OI — vedi sezione dedicata "OI v2" più sotto per l'architettura corrente (matrice a zone, luglio 2026)

### Obiettivo
Produrre un campo di vento attuale corretto che combini il campo di sfondo OM/AROME con le osservazioni reali delle stazioni, risultando in una mappa più accurata rispetto al solo modello grezzo.

### Metodo teorico di riferimento: Optimal Interpolation (OI)
Fonte: Gandin 1963; implementazione operativa: Hieta et al. 2025 (FMI, riduzione RMSE 24-29%)
```
campo_corretto(x) = campo_NWP(x) + K(x) * (osservazione - campo_NWP(stazione))
```
L'implementazione attuale (v2, luglio 2026) ha sostituito questo schema con la sostituzione progressiva per distanza + matrice a zone esclusiva — vedi sezione "OI v2" più sotto per i dettagli aggiornati.

---

## 8. Fonti scientifiche di riferimento

| Autori | Anno | Titolo sintetico | Rilevanza |
|---|---|---|---|
| Gandin | 1963 | Objective Analysis of Meteorological Fields | Base teorica OI |
| Zecchetto et al. | 2014 | ASCAT vs ECMWF Mediterranean | Bias costa, dipendenza dal fetch |
| Cavaleri et al. | 2024 | ECMWF/MetOffice offshore blowing winds | ~10 celle di griglia dalla costa come soglia critica |
| Hieta et al. | 2025 | ML post-processing FMI (Gridpp+OI) | Metodo operativo OI, -24-29% RMSE |
| Huang et al. | 2026 | LightGBM wind correction NWP | Stratificazione per fascia velocità, -20-40% RMSE |
| Qiu et al. | 2025 | NWP 2km vs ERA5 offshore | NWP lower mean bias but higher absolute error |
| arxiv 2512.03606 | 2025 | Transformer observation-driven correction marine winds | -45% errore GFS a 1h, migliore lungo coste |
| Pathak et al. (PMC10272189) | 2023 | Adaptive Bias Correction subseasonal forecasting | Il bias calcolato su storico è per natura in ritardo rispetto a un meteo non-stazionario — va aggiornato/pesato sul recente, non su tutta la storia indiscriminatamente |
| Sweeney et al. | 2013 | Reducing wind speed forecast errors — post-processing combo | MOS/bias-correction semplice perde efficacia quando il bias del modello cambia bruscamente (es. aggiornamento versione modello) |
| PMC8153314 (FOCUSED) | — | Short-term wind forecast correction, traffic control | Una correzione bias può *peggiorare* l'accuratezza nel 18.21% dei casi, soprattutto dopo cambi bruschi o raffiche forti dopo calma prolungata — verificato empiricamente anche in NAUTILUS (bug di segno, luglio 2026) |
| MDPI 13(7):150 | 2025 | Bias correction NCEP CFSv2, Shanxi | Pattern noto: sovrastima sistematica ai venti bassi, sottostima ai venti forti — da verificare se presente anche nei nostri dati stratificati |
| Zhang & Graf (arxiv 2508.09932) | 2025 | Mathematical errors in LLM reasoning | Gli LLM commettono errori aritmetici misurabili anche su calcoli semplici — motivo per cui una correzione numerica critica non dovrebbe mai dipendere solo da un'istruzione testuale a un LLM, ma essere anche verificata/applicata in codice deterministico dove possibile |

---

## OI v2 — Architettura attuale (aggiornata 2026-07-04)

### Matrice a zone (sostituisce il blend a raggio libero)
Dal 3 luglio 2026, ogni cella di griglia appartiene a **una sola zona** (quella con centro più vicino tra le `ZONES` con `bias_station` configurata), letta dinamicamente da `action=zones` (fonte unica, non più duplicata in `mappa.html`). Solo la stazione di quella zona può contribuire di default — questo elimina la cancellazione vettoriale tra stazioni di zone diverse con direzioni opposte (es. Alberese/Casotto Pescatori) e le contaminazioni a lungo raggio viste con Barcaggio, Orbetello, Follonica.

Le `grid_rules` restano attive come **override esplicito** per i casi noti dove serve più di una stazione insieme (es. Populonia+Venturina, Viareggio+Bocca d'Arno) o per escluderne una (es. Follonica su una cella specifica).

**Attenzione — alias di naming**: alcune zone hanno un `bias_station` (usato dal backend previsioni/backfill) che non coincide con la chiave della stazione nella lista OI di `mappa.html` (es. zona `alberese` → `bias_station: 'alberese'`, ma la stazione OI si chiama `alberese_mnw`). Un alias dedicato (`ZONE_STATION_ALIAS` in `mappa.html`) traduce i nomi solo per la matrice a zone — **non cambiare mai il valore di `bias_station` in `ZONES` per farlo coincidere con `mappa.html`: romperebbe il collegamento con `bias_samples`/`backfill_actuals`** (bug reale successo e corretto il 5 luglio 2026).

### Peso stazione e pavimento di dominanza locale
`w = max((1 - d/60)², pavimento_locale) × tetto_di_fiducia`
- Pavimento locale: entro 15km il peso non scende mai sotto 0.8 (lineare fino a 1.0 a 0km) — necessario perché la griglia è fissa a 0.25° (~25-28km) e le stazioni reali non cadono mai esattamente su un punto griglia
- Tetto di fiducia manuale (`STATION_TRUST_CAP`): limite massimo di influenza per stazioni verificate come meno rappresentative (es. Livorno CFR e Capraia CFR, limitate al 50%, perché fonti esterne più affidabili — Livornometeo/Capraiameteo — sono da maggio 2026 a pagamento e non più accessibili)
- **Rimossa la reliability basata su MAE storico vs OM**: puniva proprio le stazioni con l'effetto orografico più forte e più vero (San Vincenzo, Populonia). Nella vista diretta il dato di stazione è sempre considerato vero, il peso è solo funzione della distanza (+ i due meccanismi sopra)

### Boost del flusso animato proporzionale
Il campo vettoriale animato (`buildVectorField`) applica un boost proporzionale a `oi_station_weight` (calcolato da `applyOI`), non più solo alle celle con una `grid_rule` esplicita — prima una cella corretta dalla matrice a zone ma senza regola manuale veniva "annacquata" nel campo IDW del flusso visivo dai punti OM vicini non corretti.

### Stazioni escluse globalmente
`OI_EXCLUDED = { bonifacio_mnw, vada_mnw }` — dati non rappresentativi del mare aperto.

---

### grid_rules — Regole per cella

Struttura Redis (chiave: `grid_rules`): oggetto JSON con una entry per ogni cella che necessita regole specifiche.

**Formato chiave**: `lat.toFixed(2) + "_" + lon.toFixed(2)` — ATTENZIONE: usare sempre due decimali (es. `"43.00_10.65"` non `"43.0_10.65"`).

**Campi disponibili per cella**:
```json
{
  "allowed_stations": ["svincenzo_porto"],
  "excluded_stations": ["follonica"],
  "min_weight": 0.95,
  "reason": "descrizione"
}
```

**Inizializzazione**: `action=grid_rules_init&k=mdi`.
**Lettura**: `action=grid_rules_get`.

**Regole attive** (10 totali, aggiornate 2026-07-03/04):
| Cella | Stazione | min_weight | Note |
|---|---|---|---|
| 43.25_10.65 | svincenzo_porto | 0.95 | San Vincenzo N/NE vs OM W/SW |
| 43.00_10.40 | svincenzo_porto | 0.95 | Cella più vicina a S.Vincenzo |
| 43.25_10.40 | svincenzo_porto | 0.90 | Zona S.Vincenzo |
| 43.00_10.65 | populonia_cfr + venturina | 0.90 | Aggiornata dopo fix coordinate (Venturina ora più vicina) |
| 43.75_10.15 | viareggio_cfr + bocca_arno_cfr | 0.80 | Include Bocca d'Arno, più vicina di Viareggio |
| 44.00_10.15 | viareggio_cfr + bocca_arno_cfr | 0.80 | Zona nord costa |
| 43.50_9.90 | gorgona_cfr | 0.85 | Gorgona |
| 43.00_9.90 | capraia_cfr | 0.85 | Capraia |
| 43.00_9.65 | capraia_mnw | 0.70 | Capraia zona est |
| 42.75_10.65 | escludi follonica | — | Follonica bias anomalo su questa cella |

---

## 9. Limiti noti, bug storici e come continuiamo a cercarli

### Case study: due bug di segno indipendenti (luglio 2026)
A luglio 2026, monitorando il trend MAE settimanale su Bocca d'Arno, si è notato un **peggioramento** invece di un miglioramento nel tempo — anomalo per un sistema di correzione che dovrebbe auto-affinarsi. L'indagine ha trovato:
1. Il prompt di correzione AI diceva esplicitamente "sottrai il bias da OM" con un esempio aritmetico sbagliato (`8-(-3)` scritto come `5`, quando in realtà fa `11`) — con bias negativo (sovrastima), l'istruzione spingeva l'AI ad aumentare la previsione invece di abbassarla.
2. La stessa inversione di segno era presente, indipendentemente, nella funzione deterministica `applyBias()` (`forecast - bias` invece di `forecast + bias`), attiva automaticamente per ogni zona con ≥10 campioni storici — probabilmente attiva da mesi.
3. Una migrazione automatica legacy resuscitava silenziosamente lo storico vecchio ogni volta che `predict_history` veniva svuotato intenzionalmente, vanificando il reset.

Questo è esattamente il tipo di fallimento descritto in letteratura (Zhang & Graf 2025; PMC8153314): un LLM può fallire un'istruzione aritmetica esplicita nel testo, e una correzione bias mal implementata può peggiorare l'accuratezza invece di migliorarla, specialmente con bias negativo persistente. **Lezione operativa**: ogni formula di correzione con un segno (bias, delta, offset) va sempre verificata con un esempio numerico concreto scritto a mano prima di fidarsi del codice o del testo del prompt.

### Rischi noti dalla letteratura, da monitorare nei nostri dati
- **Non-stazionarietà**: un bias calcolato su tutto lo storico insegue un bersaglio che nel frattempo si è spostato (stagione, pattern meteo diversi). Oggi `predict_bias` usa tutto lo storico cumulato — da valutare una finestra mobile (es. ultime 2-3 settimane) se il trend continua a essere instabile dopo il reset di luglio 2026.
- **Overestimation ai venti bassi / underestimation ai venti forti**: pattern documentato in letteratura per sistemi di bias-correction simili — da verificare stratificando i nostri dati per fascia di velocità (sezione 6, non ancora implementata).
- **Degrado dopo cambi bruschi**: una correzione bias può peggiorare l'accuratezza subito dopo un cambio repentino di condizioni (fronte, raffica improvvisa dopo calma) — da tenere d'occhio nei casi di errore più grandi.
- **Affidabilità dell'LLM sull'aritmetica**: qualunque istruzione di correzione che richieda un calcolo esplicito nel testo del prompt va considerata a rischio di errore silenzioso — dove possibile, la correzione va applicata in codice deterministico e verificata, non lasciata al solo giudizio testuale del modello.

### Metodo per la revisione esterna
Oltre alla ricerca di letteratura fatta per questa sezione, il modo più efficace per trovare punti deboli non ancora visti è:
1. Portare questo documento (o la sezione rilevante) a un'altra istanza AI/altro modello, chiedendo esplicitamente una critica tecnica mirata ("cosa in questa metodologia potrebbe fallire silenziosamente, in base a letteratura nota su bias-correction e NWP post-processing")
2. Ripetere periodicamente le ricerche di letteratura (sezione 8) — il campo del post-processing meteo con ML/LLM si muove rapidamente
3. Verificare ogni nuova formula con segno (bias, delta, correzione) con un esempio numerico scritto a mano, prima di fidarsi del codice

---

## OI v2 (dettagli tecnici invariati rispetto a luglio 2026, vedi sopra)

### buildVectorField — Campo vettoriale flusso animato

**Problema risolto (v1.6.52)**: quando OI è attivo, le stazioni NON vengono aggiunte come sorgenti separate `nauSources`. Prima le stazioni con peso 10 sovrascrivevano il campo ignorando le correzioni OI già calcolate. Ora con OI ON il campo usa solo `activeGrid()` (che include già le correzioni OI) + le zone di previsione.

**Problema risolto (v1.6.53)**: a zoom alto (z11+) con passo griglia 0.25°, tutte le sorgenti OM cadevano fuori dal viewport con margine 50px. Fix: margine aumentato a 300px + fallback che garantisce sempre le 6 sorgenti più vicine al centro mappa indipendentemente dal viewport.

**Problema risolto (v1.6.61, luglio 2026)**: il boost del flusso animato dipendeva solo dalla presenza di una `grid_rule` esplicita — con la matrice a zone (che corregge senza bisogno di una regola scritta a mano), il flusso visivo ignorava correzioni reali già presenti nella griglia numerica. Ora il boost è proporzionale a `oi_station_weight`.

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
- **ATTENZIONE**: la colonna "Stazione" mostra la stazione geograficamente più vicina, NON necessariamente quella usata da OI tramite grid_rules o matrice a zone. Per celle con override la stazione usata può essere diversa da quella mostrata.
- Timestamp nel nome foglio usa `.` invece di `:` (es. `17.05` non `17:05`) per compatibilità Excel.

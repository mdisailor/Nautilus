# NAUTILUS — Metodologia di Calcolo (METODOLOGIA.md)

Documento tecnico-scientifico sulle logiche di calcolo, fonti e assunzioni.
Versione documento: v1.8 — Aggiornato: 2026-08-12 (sezione 14 estesa con l'analisi completa su 25 zone: AROME vince in 9/25 stazioni non solo Alberese, anomalia bias=MAE su Orbetello/Bonifacio, conferma dati reali del fix forte_marmi, canale_piombino confermato il bias peggiore del sistema + scoperta che tsc228 è tornata a trasmettere)

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
- Stazioni problematiche note: Vada e Bonifacio (dati non rappresentativi, esclusi dall'OI)
- **Livorno — risolto il 13 luglio 2026.** `livorno_cfr` (codice CFR `TOS01005981`) è un **mareografo**: misura la marea, non il vento. In `bias_samples:livorno_cfr` il campo `station` è **sempre null** — la zona non ha mai avuto una verifica reale, e fino ai fix di luglio i suoi "confronti buoni" in stats erano previsioni verificate contro OM (autoconferma). Sostituito da **`livorno_porto`**: stazione Windfinder `windfinder.com/report/porto-di-livorno` (spot `it2005`), 43.5525N 10.3014E, quota zero, sul porto — aggiunta a `scrape_web2` e promossa a `bias_station` della zona `livorno` (engine v2.14.5). Da tenere sotto osservazione: segna meno di altri siti online, probabilmente perché poco esposta dentro il bacino portuale; da valutare con vento forte (alternativa futura: boa Meloria)
- **Quercianella = Calignaia**: sono la stessa stazione fisica (43.465N 10.347E, 40m slm su tetto, MeteoNetwork `tsc265`), due nomi diversi. Non è un'alternativa per Livorno Porto: è ~9 km più a sud e in collina, esposizione diversa
- **Fallback di naming: mai usarli.** Il popup mappa cercava il dato con `st.key.replace('_cfr','')` — così il marker "Livorno Porto CFR", non trovando dati propri, mostrava il dato di Quercianella spacciandolo per suo. Rimosso il 12 luglio (mappa v1.6.85): ogni stazione mostra solo il proprio dato reale, o dice "nessun dato".

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

### Riduzione a vento di superficie (fattore quota) — audit A2, 11 luglio 2026
Le stazioni in quota (Gorgona 230m, Giglio Castello 470m, Montecristo 85m, ecc.) misurano un vento fisicamente più forte di quello a livello del mare. Per renderlo confrontabile con il vento di superficie previsto dai modelli, `backfill_actuals` applica un **fattore di riduzione a gradini** in base alla quota della stazione:

| Quota | Fattore |
|---|---|
| ≤ 15 m | 1.00 |
| 16–100 m | 0.85 |
| 101–200 m | 0.65 |
| > 200 m | 0.45 |

**IMPORTANTE (correzione audit 11 luglio)**: questo è una **trasformazione fisica** (riduzione a superficie), NON un peso di affidabilità. Prima dell'audit era ambiguo e non documentato — l'`actual` salvato era il valore già ridotto, quindi MAE/bias/trend erano calcolati su un dato scalato senza che fosse dichiarato da nessuna parte. Dopo il fix:
- l'`actual_hN` resta il valore ridotto (per confronto omogeneo col modello di superficie);
- accanto viene salvato **`actual_hN_raw`** (la misura grezza non trasformata) e **`actual_quota_factor`** (il fattore applicato), così la scelta è reversibile e verificabile;
- lo stesso fattore è applicato coerentemente alle osservazioni recenti nel prompt situazione (`trendWeight`).

Miglioramento futuro possibile: sostituire i quattro gradini con un profilo logaritmico del vento (legge di parete), fisicamente più corretto.

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
| Previsione AI + correzione | `predict_history:zona`, `predict_bias:zona` | Previsione testuale AI vs reale misurato dopo N ore | stats.html, il prompt di previsione stesso |
| Confronto grezzo modelli | `bias_samples:stazione` | Stazione vs OM vs AROME, ogni 30 min, nessuna correzione applicata | mae.html |
| Punteggio modelli | `model_score:stazione` | Riepilogo calcolato da bias_samples: quale modello vince per condizione | score.html |

Il secondo e terzo sistema sono **osservazione pura, mai corretta** — non possono avere bug di segno perché non applicano nessuna formula di correzione, solo registrano cosa è successo. Il primo sistema invece **applica attivamente una correzione**, ed è quindi l'unico dove un errore di segno può esistere e propagarsi (vedi sezione 9).

### Sistema legacy `bias:zona` — RITIRATO l'11 luglio 2026 (audit A1)
Esisteva un quarto sistema, `bias:zona`, alimentato da `verifyForecasts`/`verifySituazione` e applicato al forecast deterministico da `applyBias()` in `calcZone`. L'audit dell'11 luglio ha scoperto che era **strutturalmente contaminato**: usava come "actual" il valore Open-Meteo dell'ora corrente (`currentData.wind_speed`), non il dato reale della stazione. Quindi misurava l'errore delle previsioni AI *rispetto a OM* — non rispetto alla realtà — e poi applicava questa deviazione come correzione a un prodotto diverso (il forecast deterministico). Un sistema il cui scopo dichiarato è ancorare tutto alle stazioni reali stava invece insegnando a convergere verso OM.

Dopo il fix: `verifyForecasts`/`verifySituazione` prendono l'actual dalla stazione reale (`bias_samples`, campione ≤45 min, valore grezzo); se non c'è un dato reale recente la verifica si salta (mai più ripiego su OM). Rimossa la chiamata `applyBias()` e la riga "BIAS STORICO (i modelli tendono a…)" dal prompt situazione. I record `verify:`/`sit_verify:` ora includono `actual_source` per tracciabilità. Il sistema `predict_bias` (con actuals da stazione) supersede completamente il vecchio `bias:zona`.

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
Solo se ci sono almeno 5 previsioni verificate per un dato orizzonte, si applica una correzione additiva per orizzonte: `previsione_corretta = previsione_grezza + bias`, dove `bias = media(actual − forecast)`.

**Dall'11 luglio 2026 (audit B1+B2) la correzione è cambiata in due modi importanti:**
- **È deterministica, applicata dal motore, non dall'LLM** (B2): dopo che l'AI ha prodotto la previsione, il codice estrae i `forecast_hN`, applica `max(0, raw + mean)` in JavaScript (verificabile a mano), salva `forecast_hN_raw` accanto al corretto e marca `bias_corrected:true`. Il prompt riceve solo un contesto *qualitativo* ("tendi a sovrastimare di ~Xkn a H+6 — NON applicare correzioni numeriche"), mai un'istruzione aritmetica. È l'applicazione diretta della lezione della sezione 9: togliere l'aritmetica dall'LLM elimina alla radice la classe di bug di segno trovata a luglio.
- **Misura solo i record `source:'predict'`** (B1): prima `predict_bias` calcolava gli errori sull'unione di due prodotti diversi (`action=predict`, formato rigido, Sonnet; e `action=situazione`, testo discorsivo, Haiku), ma applicava la correzione a uno solo. Ora i record situazione sono esclusi dal calcolo: il circuito corregge lo stesso prodotto che misura. Poiché la verifica misura il *valore corretto salvato*, il bias futuro è il residuo della previsione finale — circuito chiuso e coerente.

È un raffinamento aggiuntivo sopra i livelli 1-3, non un prerequisito — la sua assenza (es. dopo un reset) non impedisce una previsione sensata, solo toglie l'ultimo aggiustamento fine.

### Casi simili (`similar_cases`) — orizzonte corretto l'11 luglio 2026 (audit B3)
Il livello 3 cerca nei 14 giorni i momenti passati con lo stesso trend di pressione e mostra all'AI cosa ha fatto il vento "6 ore dopo". Prima dell'audit questo era calcolato per *indice* nell'array di snapshot (`slice(si, si+6)`), ma con snapshot ogni 30 minuti sei posizioni coprono solo ~3 ore — quindi l'analogia "a 6h" descriveva in realtà ~3h (errore di un fattore 2). Ora il vento "6 ore dopo" si cerca per **timestamp** (target +6h, tolleranza ±45 min), non per indice.

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

### Osservazione: le previsioni non decadono con la distanza — nel regime osservato (15 luglio 2026)

Primi dati reali post-reset (Bocca d'Arno, 20 previsioni verificate, `action=forecast_stats`):

| Orizzonte | +1h | +3h | +6h | +9h | +12h |
|---|---|---|---|---|---|
| MAE (kn) | 1.3 | 1.5 | 1.2 | 1.1 | **0.9** |
| std | 1.5 | 1.8 | 1.5 | 1.3 | **1.1** |

Controintuitivo ma coerente: **l'errore a +12h è più basso e più costante che a +1h.** Spiegazione: con vento debole e stabile gli orizzonti brevi inseguono fluttuazioni istantanee (raffiche, momenti di calma), quelli lunghi colgono la media della giornata, più prevedibile. **Vale solo per questo regime**: il decadimento vero emergerà con vento forte o instabile — finché quelle condizioni non entrano nel campione, la curva resta ottimista. Cruscotto: `/decadimento.html`.

### Osservazione: mattina vs pomeriggio sono due problemi diversi (15 luglio 2026)

Separando i record per `slot`, le previsioni del **pomeriggio risultano più accurate** di quelle del mattino. Duplice spiegazione:
1. **Fisica**: la previsione del mattino deve indovinare *se e quando parte* la brezza (innesco incerto: gradiente termico, nuvolosità, sincronia col sinottico); quella del pomeriggio la brezza ce l'ha già davanti, misurata, e deve solo dire quando cala — estrapolazione di qualcosa in corso
2. **Compito più facile**: le previsioni del pomeriggio a +6/+12h cadono su ore serali/notturne, quando il vento converge verso valori bassi e simili tra loro

**Conseguenza per il motore**: il flag di affidabilità non può essere funzione del solo orizzonte. La stessa distanza (+9h) può essere affidabile se calcolata alle 13 e non affidabile se calcolata alle 7 → il giudizio è per **orizzonte × slot** (e, quando arriverà il vento, presumibilmente × fascia di intensità).

**Ricaduta sull'algoritmo (da valutare)**: il campo `slot` è salvato su ogni record ma **non entra nel prompt** — la previsione non sa se è mattina o pomeriggio. Inoltre i casi storici simili sono selezionati per *stessa tendenza barica*, **senza filtrare per ora del giorno**: una previsione delle 7 può ricevere casi accaduti alle 16, cioè un regime opposto. Due interventi possibili: (1) filtrare i casi simili per slot — cambia i *dati*, più solido, ma dimezza i casi disponibili e con lo storico attuale rischia di azzerarli; (2) dichiarare lo slot nel prompt — cambia le *istruzioni*, più debole. Prerequisito per entrambi: verificare quanti casi simili vengono trovati oggi in media.

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

### Principio: solo dati reali, mai un valore travestito da un altro (12 luglio 2026)

Regola: **le statistiche usano esclusivamente dati reali di stazione; la visualizzazione mostra sempre un numero, ma se è modello lo scrive in rosso.** Il modello non è "falso" — è una previsione legittima; il problema è mescolarlo alle osservazioni o mostrarlo come se fosse una misura.

Attuazione:
- `cron_snap` scrive comunque il vento OM nei campi principali (serve per la visualizzazione) marcandolo `wind_source:'om'`; `scrape_cfr` sovrascrive col dato reale e marca `wind_source:'cfr'` — il dato reale ha sempre la precedenza
- **Statistiche e backfill accettano solo `wind_source==='cfr'`.** Chiusi tre punti dove un valore OM poteva entrare come *actual*: backfill dagli snapshot, `enrichWithActuals`, e il bias LAMMA (che usava `snap.wind_speed || 0`, trasformando un dato assente in un "vento reale" di 0)
- Le pagine colorano di **rosso** il vento quando `wind_source==='om'` (mappa: popup con "(modello)"; app: matrice storica e bussole)
- `action=history` restituisce gli snapshot veri, non più solo `bias_samples`: altrimenti il campo `wind_source` non arriva alle pagine e il rosso non può comparire

Corollario (Livorno, sezione 1): una zona il cui `bias_station` non produce vento reale **non si verifica più** — stats resta vuoto. È corretto: meglio nessun campione che un campione contro il modello. Vale la pena controllare periodicamente quali zone hanno un `bias_station` che di fatto non fornisce anemometria.

### Fallback taciti: la classe di bug da cercare

I bug più insidiosi trovati finora non erano errori di calcolo ma **ripieghi silenziosi** che producevano un risultato plausibile:
- verifica previsioni contro OM invece che contro la stazione (audit A1) → MAE ottimo e privo di significato
- `.replace('_cfr','')` nel popup mappa → il dato di Quercianella mostrato come "Livorno Porto"
- `getNowRome` fuori scope (audit A6) → IFS sempre `null`, in silenzio, per mesi
- `|| 0`, `|| 15`, `|| 1013` → un dato mancante diventa un valore che sembra misurato

Regola pratica: **ogni `||` con un valore di comodo su un campo che rappresenta la realtà è un sospetto.** Restano da valutare uno a uno i default finti superstiti su `temp_air` (15), `humidity` (70), `pressure` (1013).

### Race condition fra due scritture sullo stesso elemento (14-15 luglio 2026)

La bussola singola restava rossa (OM) anche con stazioni che avevano il dato reale: il percorso meteo scriveva il fallback OM **mentre** la fetch del dato reale era ancora in volo (`scCfrLoaded` era ancora `false`). Le stazioni veloci vincevano la corsa, le lente no — sintomo diagnostico: *alcune* verdi, altre no. Correzioni: (1) la bussola singola legge il dato **già salvato** via `bias_history` (istantaneo) invece di `station_refresh` (scraping live, 2-3s); (2) il fallback OM parte solo a ricerca **terminata** senza risultato. Lezione: quando due percorsi asincroni scrivono lo stesso elemento, il flag "ho finito" non basta — serve anche "sto ancora lavorando".

### Dato di fonte esterna sospetto: non manipolarlo (Capraia, 25 luglio 2026 — aperto)

Il popup OM per Capraia ha mostrato **pressione 978.0 hPa** (implausibile nel Mediterraneo estivo, dove la norma è ~1013) e una **direzione del vento opposta** sia al flusso regionale circostante sia all'avviso marittimo ufficiale (vento da ovest/224° tutto il giorno). Le stazioni reali di Capraia concordano col punto OM — quindi non è un disallineamento fra fonti diverse nel nostro disegno — ma entrambi discordano dall'avviso marittimo.

Ipotesi formulata e **non applicata**: Open-Meteo, senza il parametro `elevation` esplicito, potrebbe usare la propria stima di quota per quelle coordinate (Capraia ha il Monte Arco, ~450 m) e calcolare pressione e vento come in quota anziché a livello mare. I 35 hPa di scarto corrisponderebbero a circa 280 m.

**Decisione di metodo (M):** questi sono dati che ci vengono passati da una fonte esterna. Non vanno manipolati o forzati per farli sembrare plausibili — sarebbe la stessa bugia (falsare un dato) che si è lavorato per eliminare. Il modo corretto di trattarli, se si vuole fare qualcosa, è **segnalarli come sospetti**, non correggerli silenziosamente. Nessuna modifica applicata.

**Nota di processo:** su questo caso era stata scritta una modifica a `engine.js` (`elevation=0`) e preparato uno zip *prima* di condividere il ragionamento e *senza* verificarla con un test reale. Da evitare: esporre l'ipotesi e concordare l'intervento prima di scrivere codice, a maggior ragione quando riguarda dati di fonti esterne.

### Bug cache: una sola fetch scoperta su tutta la mappa (22 luglio 2026)

Il popup di un marker mostrava uno snapshot vecchio di ore (21:10 del giorno prima) **anche quando sul server esisteva già un dato più recente** — verificato: alle 09:18 il giro delle 09:10 era già stato scritto. Poi, senza alcun intervento, il popup si è aggiornato da solo.

Prima diagnosi (sbagliata, scartata): cron esterno fermo. Smentita dal fatto che il dato fresco *esisteva già* sul server nel momento in cui il popup mostrava quello vecchio.

Causa reale: `fetchZoneData` in `mappa.html` (la funzione che alimenta i popup marker via `action=history&hours=1`) era **l'unica chiamata di tutta la mappa senza `{cache:'no-store'}`** — griglia, stazioni, matrici e zone lo avevano già. Il browser poteva quindi servire una risposta in cache finché non si invalidava da sola. Corretto in mappa v1.6.87.

**Regola operativa**: quando si aggiunge una nuova `fetch` alla mappa o all'app, verificare che abbia `cache:'no-store'` come le altre. È facile lasciarne scoperta una, e il sintomo (dato vecchio mostrato come fresco) è indistinguibile a occhio da un problema di raccolta dati.

### Principio: "dati assenti", non tasto nascosto né ripiego geografico (19-20 luglio 2026)

Quando una stazione reale smette di trasmettere, due tentazioni sono entrambe sbagliate e vanno evitate su **qualunque** stazione, non solo sul caso che le ha fatte emergere:

1. **Non sostituire la stazione con un'altra vicina per tappare il buco.** Un dato reale di un altro posto, spacciato per quello che manca, è la stessa bugia del fallback `.replace('_cfr')` che mostrava Quercianella come Livorno Porto (rimosso il 12 luglio, sezione 1). Il ripiego geografico resta un ripiego anche quando il dato sostituto è vero.
2. **Non nascondere il tasto/la voce.** La stazione esiste, sta solo tacendo in questo momento — farla sparire nasconde un'informazione utile (che è muta) dietro un'assenza indistinguibile da "non esiste".

Comportamento corretto, adottato in `biasLoadHistory` (app, opzione A già in uso per Livorno Porto dal 12/07): la voce **resta sempre visibile**. Se ci sono campioni recenti (≤90 min) mostra il dato; altrimenti cerca l'ultimo campione valido anche vecchio e lo mostra con la sua **età** ("6 kn NW · 54h fa", in rosso, con nota "fermo da... — non usato nei calcoli"); solo se nessun campione valido esiste nemmeno in profondità scrive "dati assenti". Il dato vecchio **non entra mai nei calcoli** (le verifiche previsioni scartano oltre i 45 min, sezione già in vigore) — la visualizzazione e il calcolo hanno soglie diverse e indipendenti, di proposito: quello che è "troppo vecchio per calcolare" può restare "abbastanza informativo per monitorare".

Limite pratico: `bias_samples` ruota (FIFO). Il cap di lettura (`bias_history`) è stato alzato da 100 a 300 campioni (engine v2.14.8) per ritrovare dati fermi da alcuni giorni — ma oltre quella profondità il dato esce comunque dalla memoria, e a quel punto "dati assenti" torna corretto e definitivo: non ha senso inseguire dati sempre più vecchi.

### Case study: stazione MeteoNetwork online ma senza vento — Piombino/tsc228 (19-20 luglio 2026)

La zona `canale_piombino` è sparita da "Stazioni reali vs OM". Diagnosi in tre passi, a mostrare il percorso perché è ripetibile su altre stazioni MeteoNetwork:

1. `action=bias_history&station=canale_piombino` → tutti i campioni recenti con `station:null`. Solo OM/AROME.
2. `action=mnw_test` → la stazione (`tsc228`) risponde `status:200, ok:true` ma **senza i campi `wind_speed`/`wind_dir`**. Non è una licenza revocata (quella dà errore, com'era già documentato per `tsc265` Livorno e `tsc508` Viareggio) — è online e trasmette altre grandezze, ma non più il vento. Stesso identico sintomo trovato su `tsc578` (Capraia): da verificare se ha lo stesso problema.
3. **Confermato dalla fonte**: sulla Livemap pubblica di meteonetwork.it, la stazione di Populonia (tsc539, vicina fisicamente a tsc228) mostra solo temperatura (26.6°) e il dato vento sul sito risultava fermo al 16/07 mentre si era già al 20/07.

Conclusione: nessun bug nostro. Il sistema si comporta correttamente mostrando "dati assenti" (dopo il fix del punto precedente, con l'ultimo dato + età). Il canale di Piombino resta scoperto in attesa che il sensore torni a trasmettere — fuori dal nostro controllo, da verificare periodicamente con `action=mnw_test`.

### Populonia come bias_station del canale di Piombino: due difetti distinti (20 luglio 2026, DA CORREGGERE)

Emerso mentre si diagnosticava Piombino: la zona `canale_piombino` ha `bias_station: 'populonia_cfr'` (righe ~29, ~2167, ~2170, ~2330, ~2601 di engine.js) usata per previsioni/verifica — **stazione diversa** da `tsc228` (quella della bussola/vento attuale). Due problemi indipendenti:

1. **Populonia non può rappresentare il canale.** È sul promontorio a quota **164m**, a sud del golfo di Baratti — non il livello del mare del canale, né come intensità né come direzione. Non va corretta con un fattore di quota (rapporto instabile con direzione/stabilità): va **staccata** come `bias_station` della zona. Finché `tsc228` (quota 8m, nel punto giusto) non torna a trasmettere, il canale resta onestamente senza verifica reale — meglio che una verifica contro un punto non rappresentativo.
2. **La posizione usata (lat 42.987731, lon 10.537734) è geograficamente sbagliata**, verificato sulla Livemap ufficiale meteonetwork.it: la stazione compare troppo a **est** (verso Baratti/entroterra), mentre Populonia paese è sul promontorio a ovest (~lon 10.49). Una stazione deve stare nel punto dove è fisicamente, e i suoi dati devono valere per quel punto — non per una posizione spostata. Coordinata corretta da leggere sulla scheda ufficiale: `meteonetwork.eu/it/weather-station/tsc539-stazione-meteorologica-di-populonia`. Da chiarire nel farlo: la nostra stazione si chiama `populonia_cfr` (codice CFR `TOS03002300`) ma l'URL salvata punta a `tsc539` (MeteoNetwork) — verificare se sono la stessa stazione fisica con due codici o due stazioni diverse prima di correggere la coordinata.

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

Questo metodo è stato applicato con successo l'11 luglio 2026 (vedi sezione 10).

---

## 9-bis. Analisi del peggioramento di accuratezza (25 luglio 2026)

Osservazione di M: "più passa il tempo e accumuliamo dati, più peggiorano le previsioni". Verificata sui dati reali (export XLS di Capraia, Viareggio, Barcaggio).

**Errore metodologico da non ripetere**: il primo confronto W29→W30 è stato fatto guardando **solo l'orizzonte H+6**, che per coincidenza era piatto su due zone su tre (1.8→1.8, 3.1→3.1) — da cui una conclusione errata di "stabilità". Guardando **tutti e cinque** gli orizzonti il quadro si ribalta: la media peggiora su tutte e tre le zone (Capraia +9%, Viareggio +13%, Barcaggio +25%), con 3-4 orizzonti su 5 in peggioramento ciascuna. **Mai giudicare un trend su un singolo orizzonte.**

**Il peggioramento è reale**: su Viareggio, escludendo l'anomalia isolata, l'errore medio giornaliero sale da ~2.0 kn (11-18 luglio) a ~3.0 kn (19-25 luglio).

**Outlier da isolare**: il 17/07 ore 13:16 ha un errore medio di 11.3 kn, quasi 4× la norma, causato da un salto della previsione OM stessa da un ciclo all'altro (+9 kn in poche ore: da 4.3 a 13.3) — un falso allarme di vento forte poi non materializzato. Quel singolo evento da solo gonfia la media della sua settimana: va escluso o segnalato quando si valuta un trend, altrimenti si scambia un episodio per un degrado strutturale.

**Ipotesi pressione: verificata e scartata.** Con i dati disponibili (`action=history`, 136 ore effettive), né la variazione di pressione a 3h né il livello assoluto correlano con l'errore in modo significativo (-0.29 e -0.11 su 6-7 punti). Nel periodo la pressione scendeva **lentamente e costantemente** (1017.9 → 1010.1 hPa in 9 giorni), non a scatti: non c'erano sbalzi rapidi da incolpare. Non escluso che serva più storico, ma con quello disponibile la pressione non è la spiegazione.

**Conclusione operativa.** Nello stesso periodo il vento reale medio è salito (da ~4.6 a ~6.3 kn, con punte di 12-13 kn). `applyBias()` applica un **unico bias medio storico per zona/orizzonte**, senza stratificazione per condizione corrente: la correzione resta quindi tarata sul regime più calmo in cui è stata appresa e non si adatta quando le condizioni si muovono — indipendentemente da quale sia il segnale scatenante esatto. Questo **rafforza il TODO già in coda**: il giudizio di affidabilità e la correzione vanno stratificati non solo per orizzonte × slot, ma anche per **fascia di intensità/variabilità del vento**.

**Limite tecnico emerso**: `action=history` tronca lo storico (il 25/07 restituiva 136 ore anche chiedendone 240). Da risolvere prima di poter fare analisi su finestre più lunghe.

---

## 9-ter. Bug naming, pattern mattina/pomeriggio quantificato, e due correzioni testate e scartate (31 luglio – 1 agosto 2026)

Analisi ripresa con lo strumento `export.html` (estrae `forecast_stats`+`predict_history`+`mae_compare`+`bias_matrix`+`model_score`+`decadimento_by_slot` per tutte le zone in un colpo solo).

### Bug naming: bias_station non combaciava con la chiave reale (forte_marmi, casotto_gr)

`ZONES.forte_marmi.bias_station` valeva `'forte_marmi'` (== chiave zona) invece di `'forte_dei_marmi'` (la chiave reale scritta da `scrape_cfr`); stesso difetto su `casotto_gr` (`'casotto_pesc'` invece di `'casotto_pescatori'`). Risultato: `bias_samples:forte_marmi` era sempre vuota, quindi `forecast_stats`/`backfill_actuals` cadevano nel ramo di fallback su `snap:` (match esatto sullo slot da 30 min, senza tolleranza — meno preciso del match a finestra sui `bias_samples` dedicati). **Non era un bug isolato**: le stesse tre action diagnostiche (`mae_compare`, `bias_matrix`, `score_get`) condividono liste di stazioni hardcoded che **mancano ancora** `populonia_cfr`, `livorno_porto`, `viareggio_cfr` — per queste tre, la pipeline di correzione della zona è corretta (il `bias_station` combacia), ma i tre cruscotti diagnostici non li mostrano. Fix del naming vero e proprio: engine v2.14.10, mappa v1.6.88 (allineata anche la chiave locale `MNW_LIVE`/`GRID_EXTRA_POINTS` e la grid_rule `excluded_stations`).

**Lezione**: quando una chiave-stazione appare in più punti del codice (ZONES, CFR_STATIONS, liste hardcoded dei cruscotti, alias in mappa.html), verificarne la coerenza in **tutti** i punti prima di correggerne uno solo — un fix parziale può rompere un punto che oggi funziona per coincidenza (caso mappa.html, dove `key` locale combaciava già col vecchio valore sbagliato).

### Pattern mattina/pomeriggio: quantificato per orizzonte, non più solo qualitativo

Confermando e affinando l'osservazione del 15/07 (sezione 6): il vantaggio non è "il pomeriggio è più accurato" in generale, è un **incrocio per orizzonte**. Media cross-zona (20 zone, n≥5 per cella):

| Orizzonte | MAE mattina | MAE pomeriggio |
|---|---|---|
| H+1 | 1.66 | 2.50 (mattina vince) |
| H+3 | 2.31 | 2.59 (mattina, leggero) |
| H+6 | 2.58 | 2.64 (pareggio) |
| H+9 | 2.80 | 2.36 (pomeriggio vince) |
| H+12 | 2.68 | 2.16 (pomeriggio, netto) |

Spiegazione fisica coerente: la previsione delle 07:15 a +1h descrive una mattina ancora calma (facile), a +9/+12h deve aver indovinato l'innesco della brezza pomeridiana (difficile). La previsione delle 13:15 a +1h cade nel pieno della brezza, spesso in transizione (difficile), a +9/+12h descrive la sera calma (facile).

### Due correzioni più sofisticate testate con backtest rigoroso e SCARTATE

Il pattern sopra aveva suggerito due possibili interventi sulla correzione. Entrambi testati con un backtest vero (leave-one-out: stimare il bias sui campioni precedenti, verificare sul più recente, ripetuto su più punti per zona) — non solo un confronto a due punti nel tempo.

**Split del bias per slot (mattina/pomeriggio)**: il gap di **MAE** tra slot è grande a H+1 (0.84kn) ma il gap di **bias medio** (quello che una correzione additiva può davvero aggiustare) è quasi nullo li' (0.16kn) — il gap di MAE a H+1 è quasi tutto dispersione/rumore campionario, non un errore sistematico correggibile. Dove il bias medio differisce davvero (H+3: 0.63kn, H+9: 0.55kn) il beneficio potenziale è modesto. **Non implementato.**

**Decadimento esponenziale del bias (λ=0.85, già in coda in roadmap "dopo 20-30 campioni")**: la soglia campioni era stata raggiunta (n=15-29/zona), quindi testato. Risultato del backtest: media pesata per recency **leggermente peggiore** della media semplice attuale (errore residuo 2.57kn vs 2.52kn su 160 test, su 20 zone). Vince solo in 7 zone su 20. Anche finestre fisse più corte (ultimi 8/10/12/15 campioni, senza pesatura) sono **tutte peggiori** della media su tutto lo storico disponibile. **Non implementato.**

**Conclusione**: a n=15-30 campioni per zona il sistema è limitato dalla **varianza**, non dal bias — qualunque tentativo di "restringere la memoria" per essere più reattivi alla realtà che cambia peggiora le cose, perché il rumore statistico di un campione piccolo pesa più del guadagno di reattività. Vale lo stesso principio già scritto per la stratificazione da vento forte (Fase 6 roadmap: "non costruirlo ora, sintetizzerebbe rumore") — esteso qui a **qualunque** raffinamento della correzione, non solo quello. Non riprovare finché lo storico per zona non è sostanzialmente più ampio.

---

## 10. Audit incrociato codice ↔ metodologia (11 luglio 2026)

Un audit tecnico esterno (modello Fable, su engine v2.13.57, mappa v1.6.82, index v5.7.27 e questa metodologia) ha confermato che l'**architettura è corretta e va proseguita** — nessun cambio di strada, il design a livelli è adatto alla scala del progetto. Ha però individuato che il *circuito di apprendimento* (misura errore → correzione) era incoerente in più punti di giunzione: in ciascuno, il sistema misurava una cosa e ne correggeva un'altra. Finché non sistemati, i trend MAE non misuravano ciò che si credeva.

**Correzioni applicate (engine v2.14.0, mappa v1.6.83):**
- **A1** — Ritirato il circuito legacy `bias:zona` che verificava contro OM invece che contro le stazioni (vedi sezione 4).
- **A2** — Reso trasparente il fattore quota sugli actuals: documentato come riduzione a superficie, con valore grezzo salvato accanto (vedi sezione 2).
- **A3** — Rimossa la chiamata a `generateSituazioneForZone`, funzione mai definita che faceva rispondere 500 al cron a ogni run. Le schede situazione restano on-demand via `action=situazione`; le schede da cron non sono mai state generate finora (bug silenzioso). Un eventuale ripristino richiede un refactoring dedicato.
- **A4** — Unificata la convenzione oraria sulle chiavi `snap:` (alcuni lettori usavano ora Roma su chiavi scritte in UTC, sfasando gli actual di 2h in ora legale).
- **A5** — Provenienza per campo negli snapshot: `wind_source` ('cfr'|'om'), il dato reale CFR è sempre salvato in campi dedicati a prescindere dall'ordine di scrittura, `obs_source='cfr'` solo se il vento CFR è davvero atterrato.
- **A6** (trovato durante i fix) — `getNowRome` era definita dentro un handler ma chiamata da `fetchECMWF` (scope modulo): ReferenceError silenziato dal try/catch, **i dati IFS ECMWF erano sempre null da sempre**. Spostata a scope modulo.
- **B1+B2** — Correzione bias ora deterministica (fuori dall'LLM) e misurata solo sui record `source:'predict'` (vedi sezione 5).
- **B3** — Casi simili: orizzonte "6h" ora cercato per timestamp, prima era ~3h per errore di indicizzazione (vedi sezione 5).
- **C1** — `action=agent`: INCR atomico, rate limit per-IP oltre al globale, fail-closed, cap payload. Il refactoring a template server-side resta TODO.
- **C2** — `temp_water` non ha più il default finto di 15°C: è `null` senza Stormglass, e delta aria-acqua/rischio nebbia si saltano invece di calcolarsi su un dato inventato.
- **C3** — Slot morning/afternoon via `Intl` con `Europe/Rome` (era UTC+2 fisso, sbagliato in ora solare), sia in engine sia in mappa.
- **C4** — `verifySituazione` estrae il vento previsto dalla sezione EVOLUZIONE ATTESA (prima prendeva la prima occorrenza "Xkn", spesso il vento attuale).
- **C5** — `predict_history` con cap per-source (30 predict + 30 situazione), così le schede non espellono le previsioni verificate prima del backfill.

**Nota sui dati storici**: non serve un reset completo (il baseline del 4 luglio resta valido), ma i `predict_bias` accumulati prima del fix contengono actual pesati (A2) e i `verify:` contengono actual OM (A1) — si ripuliranno da soli col backfill sui nuovi record, che ora salvano anche il grezzo. Per qualche giorno dopo il deploy le correzioni useranno un mix di dati vecchi e nuovi.

**Il paradosso positivo** (nota dell'audit): i bug di segno di luglio erano stati trovati guardando un trend MAE anomalo. Con A1/A2 attivi quel "termometro" era parzialmente falsato — sistemarli per primi è ciò che permette di continuare a trovare tutto il resto con lo stesso metodo.

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

---

## 11. Pagine e URL del sistema (aggiornato 1 agosto 2026)

Base: `https://nautilus-red.vercel.app/` — tutti i file `.html` stanno nella **radice** del repo (`github.com/mdisailor/Nautilus`), l'engine in `api/engine.js`.

### Pagine

| URL | Cosa fa | Versione |
|---|---|---|
| `/` | App principale: schede previsione, situazione, bussole (3 zone + singola per località), matrice storica, stazioni reali vs OM (stazioni mute mostrano ultimo dato + età) | v5.7.39 |
| `/mappa.html` | Mappa vento (produzione): griglia OI, flusso, marker stazioni reali | v1.6.88 |
| `/mappa2.html` | **Nuovo, sperimentale** — fork di mappa.html per confronto affiancato. Sfondo colorato continuo (bilineare) al posto dei vecchi cerchi, solo 2 tasti (FLOW, OI). mappa.html originale non toccato | v1.2 |
| `/previsioni.html` | **Nuovo** — mappa vento **futuro**, non solo presente. Bottoni a ore intere assolute, due orologi separati (OM sempre da adesso, nostra previsione dall'ultimo predict), sfondo colorato bilineare, FLOW, export XLS orario completo | v3.0 |
| `/export.html` | **Nuovo, diagnostico** — un tasto estrae `forecast_stats`+`predict_history`+`mae_compare`+`bias_matrix`+`model_score`+`decadimento_by_slot` per tutte le zone in un unico JSON, da incollare in chat per analisi | v1.3 |
| `/index2.html` | **Cruscotto**: indice di tutti gli strumenti + stato engine live (versione, zone attive, ora server) | v1.2 |
| `/diag.html` | **Diagnostica strutturata** per zona: stato engine, continuità raccolta dati, IFS/wind_source, con semafori e spiegazioni (invece del JSON grezzo) | v1.3 |
| `/stats.html` | Previsioni AI vs reale per orizzonte, trend MAE | — |
| `/mae.html` | Confronto errore OM vs AROME per stazione (dati grezzi, nessuna correzione) | — |
| `/Score.html` | Quale modello vince per condizione (velocità/settore). **Nota: S maiuscola nel nome file** | — |
| `/simulator.html` | Come nasce il valore mappa per i 3 punti pilota, export XLS | v1.9 |
| `/climatologia.html` | Distribuzione fasce e settori per zona, dal dato reale | v1.4 |
| `/decadimento.html` | **Decadimento previsioni**: MAE per orizzonte (+1h…+12h) con banda di dispersione (±std), semaforo affidabilità, confronto **mattina vs pomeriggio**, export XLS | v1.2 |

### URL diagnostiche (api/engine)

Le pagine `index2.html` e `diag.html` incapsulano le più usate; queste restano per il controllo diretto.

| URL | Cosa restituisce |
|---|---|
| `?action=ping` | Stato engine, **versione** (la home la legge e la mostra), zone attive, ora server Roma |
| `?action=zones` | Elenco completo zone con `key`, `name`, `lat`, `lon`, `bias_station`. **Fonte unica** per popolare le tendine (non duplicare gli elenchi a mano nelle pagine) |
| `?action=ifs_check&zone=X` | Ultimi 8 snapshot con solo i campi rilevanti: `ifs_*`, `wind_source`, `wave_height`. Creata l'11 luglio per verificare il deploy dell'audit (A5/A6) senza export enormi |
| `?action=history&zone=X&hours=6` | Serie storica vento della zona. Dal 12 luglio preferisce gli **snapshot veri** (portano `wind_source`, necessario per il rosso OM nelle pagine); `bias_samples` resta fallback se <3 snapshot |
| `?action=bias_history&station=X&limit=N` | Campioni **già salvati** di una stazione (station/om/arome/delta). Lettura **istantanea**: è la fonte usata da `triple_wind` e, dal 14 luglio, dalla bussola singola. Cap a **300** campioni (alzato da 100 il 20/07, engine v2.14.8) per ritrovare l'ultimo dato reale di una stazione muta anche se vecchio di giorni |
| `?action=station_refresh&station=X&k=mdi` | Scraping **dal vivo** di una stazione (2-3s per alcune). Risposta: `{ok, data:{station:"<nome>", wind_kt, dir_deg, ...}}` — attenzione, `data.station` è una **stringa**, non un oggetto |
| `?action=forecast_stats&zone=X&k=mdi` | `current_bias` per orizzonte (n, mean, mae, std) + `weekly_mae` + `trend`. Alimenta `/decadimento.html` |
| `?action=predict_history&zone=X&k=mdi` | Record previsioni grezzi. Ogni item è `{prediction:{generated_at, slot, forecast_hN...}, actual_3h, actual_6h, actual_12h}` — **il record è annidato in `.prediction`, gli actual stanno al livello sopra** |
| `?action=scrape_web2&station=X&k=mdi` | Forza lo scrape di una stazione web (Windfinder/Meteosystem) e mostra il campione estratto |
| `?action=mnw_test&k=mdi` | Interroga direttamente l'API MeteoNetwork per le stazioni configurate: `status`/`ok` (connessione) + `wind_speed`/`wind_dir` se presenti. Distingue "licenza revocata" (errore) da "online ma senza vento" (200 ok, campi assenti) — usata il 19-20/07 per diagnosticare Piombino/tsc228. **Aggiornamento 12/8**: tsc228 (Piombino) ha ripreso a rispondere con vento reale, tsc578 (Capraia) resta muta |
| `?action=triple_wind&zones=a,b,c` | Vento reale (o OM di ripiego) per le zone indicate. Legge `bias_samples` → veloce |
| `?action=grid_rules_get` · `?action=grid_rules_init&k=mdi` | Lettura / inizializzazione regole griglia |
| `?action=archive_check&station=X&zone=Y` | **Nuovo (12/8)** — sola lettura. Confronta finestra fissa (`bias_samples`/`predict_history`) e archivio persistente (`bias_archive`/`predict_archive`) fianco a fianco: lunghezza e data più vecchia di entrambi. Incapsulata nel tasto "Controlla archivio" di `index2.html` |
| `?action=archive_backfill&k=mdi` | **Nuovo (12/8), una tantum** — unisce dentro `predict_archive` tutto quello già presente in `predict_history` (confronto per `generated_at`, non duplica). Serviva a salvare il pregresso di mesi prima che uscisse dalla finestra fissa di 30 senza mai essere stato archiviato. Già eseguita una volta il 12/8 |
| `?action=diag` | Test connessione Redis (non mostra snapshot) |

### Principio: la versione va sempre esposta in testata, a video

Ogni pagina (cruscotto o app) deve mostrare il numero di versione **a schermo**, non solo nel commento del codice sorgente. È l'unico modo pratico per verificare se un deploy è andato a buon fine senza dover aprire il file su github.dev: si cambia la versione, si guarda la pagina, e se il numero non coincide il deploy non è (ancora) andato a buon fine — oppure è stato dimenticato uno dei punti dell'aggiornamento multi-punto elencati sotto. Vale anche per pagine nuove create ad hoc (es. `export.html`): un solo punto in meno rispetto alle pagine esistenti, ma **mai zero**.

### Convenzioni di versione — da rispettare a ogni rilascio

Il numero versione va aggiornato in **tutti** i punti, non solo nell'header, altrimenti a video resta la versione vecchia anche dopo il deploy.

- **engine.js** (4 punti): header riga 1 · risposta `action=ping` campo `v:'...'` (**la home legge questo**) · stringa `engine:'nautilus-engine vX.Y.Z'` a fondo file · commento di chiusura
- **index.html** (4 punti): header riga 3 · riga ~603 (versione a video, home) · riga ~2014 (versione a video, diagnostica) · commento di chiusura
- **mappa.html** (5 punti): header riga 1 · `<title>` (~riga 11) · nav `span#nav-ver` (~riga 240) · footer `div#footer` (~riga 306) · commento identificativo (~riga 310). **Non toccare** i commenti `fix v1.6.82` sparsi nel codice: sono storici, documentano quando fu fatta una modifica
- **pagine cruscotto** (3 punti): commento riga 1 · `<title>` · versione a video nell'header

### Nomi file: versione progressiva obbligatoria

Il numero di versione non va solo *dentro* il file, va anche **nel nome del file**, così si distingue a colpo d'occhio dalla cartella senza doverlo aprire. Vale per tutti i deliverable e per la documentazione:

| Tipo | Formato | Esempio |
|---|---|---|
| Documenti `.md` | `NOME-vX.Y.md` | `METODOLOGIA-v1.8.md` |
| Engine | `engine-vXYYZZ.zip` | `engine-v21409.zip` (= v2.14.9) |
| App | `index-vXYZZ.zip` | `index-v5739.zip` (= v5.7.39) |
| Mappa | `mappa-vXYZZ.zip` | `mappa-v1687.zip` (= v1.6.87) |
| Cruscotti | `nome-vXY.zip` | `decadimento-v12.zip` (= v1.2) |

**Due regole che ne discendono:**

1. **Il numero nel nome del file deve coincidere con quello dentro il file.** Se non combaciano, dopo il deploy si guarda la versione a video e non si sa più quale build sia effettivamente in produzione.
2. **Un numero di versione non si riusa mai**, nemmeno se la build corrispondente è stata scartata prima del deploy. Caso reale (luglio 2026): una `v2.14.7` fu preparata e poi buttata; la modifica successiva è stata numerata **v2.14.8** e non ha riutilizzato il .7, proprio per non avere due build diverse con lo stesso nome nella cronologia.

---

## 12. Architettura dei costi AI (27 luglio 2026)

Quali parti del sistema chiamano davvero l'API Anthropic, e quali no. Utile per sapere dove si spende prima di intervenire.

| Componente | Chiama l'AI? | Note |
|---|---|---|
| `action=predict` | **Sì** | Genera i numeri di previsione (`forecast_h1…h12`) che finiscono in `predict_history` e alimentano stats/decadimento. **Spesa utile**: l'output è esattamente il dato che si verifica |
| `action=situazione` | **No** (dal 27/07, engine v2.14.9) | Prima generava 200-300 parole per zona, 2 volte al giorno. Ora salva un record minimale con i dati e gli alert **già calcolati in JS** (rotazione, caduta pressione, divergenza quota/superficie) |
| "Briefing operativo" (`generateBriefingText`) | **No** | JavaScript puro, template deterministico. Non è mai costato nulla |
| `action=agent` | Sì | Su richiesta esplicita dell'utente |

**Modelli usati** (non Opus): Haiku 4.5 sempre in un punto, e Haiku/Sonnet a seconda del parametro `fast` negli altri due.

### Testo descrittivo: dove è stato tagliato e come riattivarlo

Due tagli distinti, fatti in momenti diversi, entrambi per ridurre i token di output (che costano ~5× l'input):

1. **In `predict`** (fatto prima, ~metà luglio): nel system prompt le righe che chiedevano `CONFIDENZA`, `PATTERN` e `CONSIGLIO` sono **commentate**, con nota esplicita nel codice `// SEZIONE DESCRITTIVA COMMENTATA - riattivarla quando serve`. Presenti in entrambi i prompt (normale e `fast`). L'AI restituisce quindi solo le righe `H+N: X kn da DIR` + raffica + onda. **È il motivo per cui la sezione "Previsione Locale AI" nell'app appare senza testo discorsivo** pur avendo i numeri regolarmente. Per riattivare: togliere i `//` da quelle righe in `systemPrompt` e `systemPromptFast`; il campo che l'app legge (`data.prediction`) è già in uso e funzionante.
2. **In `situazione`** (27/07, engine v2.14.9): blocco `if (req.query.skip_ai !== '0')` subito dopo il calcolo di `alertsSit` — esce prima della chiamata Anthropic salvando comunque il record in KV. Per riattivare: rimuovere il blocco, oppure chiamare l'azione con `skip_ai=0` per test puntuali.

**Verificato prima di tagliare** (perché il taglio non rompesse la catena dati): `situazione_get` continua ad aggiornarsi (niente testo vecchio congelato), `predict_history`/stats non perdono l'aggancio, e l'app non mostra errori — le sezioni testuali vuote semplicemente non vengono renderizzate, grazie ai controlli `if (secSituazione)` già presenti.

### Ordine di grandezza della spesa

Stima per 26 zone × 2 chiamate/giorno, prompt ~2200 token input e ~350 output: circa **$18/mese** con Sonnet 4.6. Il taglio del testo di `situazione` elimina una delle due voci; il taglio già attivo su `predict` ha ridotto l'output da ~300 a ~80 parole.

Sul cambio modello: Sonnet 5 costa $2/$10 per MTok solo fino al **31 agosto 2026**, poi passa a $3/$15 — cioè uguale a Sonnet 4.6. Considerando che il tokenizer di Sonnet 5 può produrre 1.0-1.35× più token per lo stesso testo, **dopo quella data resterebbe leggermente più caro** di 4.6 a parità di prompt. Per ora la leva usata è stata tagliare il testo, non cambiare modello.

---

## 13. Sfondo colorato continuo (stile Windy) — interpolazione bilineare (1 agosto 2026)

Tecnica sviluppata su `previsioni.html`, poi portata anche su `mappa2.html`. Utile riferimento se altre pagine avranno bisogno dello stesso tipo di visualizzazione.

### Il problema: tre tentativi falliti prima di cambiare approccio

Il primo istinto — un campo colorato costruito con **IDW (Inverse Distance Weighting)** su punti sparsi, come già fa `buildVectorField` per il flusso animato — non ha mai funzionato bene per un colore di sfondo, in tre iterazioni successive:

1. **Punti pesati + decadimento quadratico con stop netto**: creava "isole" colorate intorno a ogni singola sorgente (specialmente le zone, poche e a peso alto), con salti netti al bordo dell'area di influenza — esattamente il difetto dei vecchi cerchi (`createRadialGradient`) che si voleva sostituire.
2. **Decadimento più dolce (quasi lineare)**: risolveva le isole ma **ogni cella finiva per mediare su quasi tutti i ~400 punti griglia** — risultato quasi uniforme ovunque, la variazione locale del vento spariva.
3. **Via di mezzo (quadratico con ammorbidimento piccolo)**: ancora isole visibili, perché il problema non era il singolo parametro — è strutturale: mescolare poche sorgenti a peso alto (zone/stazioni) con centinaia di sorgenti a peso normale (griglia OM) in un unico campo IDW produce sempre punti "caldi" isolati, qualunque decadimento si scelga.

### La soluzione: interpolazione bilineare sulla griglia OM, non IDW su punti sparsi

La griglia OM è **già regolare** (passo fisso 0.25°, non punti sparsi a caso). Una griglia regolare si interpola con la bilineare classica — matematicamente continua per costruzione, senza pesi né blur necessari per nascondere giunture:

1. Si ricostruisce la struttura 2D `[latIdx][lonIdx]` della griglia dai punti restituiti da `action=grid` (che arrivano in ordine, lat esterno/lon interno)
2. Per ogni pixel dell'area visibile, si converte in lat/lon (`map.containerPointToLatLng`), si trovano i 4 punti griglia che lo circondano, e si interpola linearmente prima lungo lon poi lungo lat (bilineare standard)
3. **Le zone/stazioni non entrano nel colore di sfondo** — restano solo nelle frecce (che già funzionavano bene). È la differenza chiave rispetto ai tentativi IDW: niente sorgenti a peso alto sparse, niente isole possibili per costruzione

Un blur leggero (4px) resta utile solo per smussare i pixel della griglia di disegno (6-8px), non per nascondere isole — differenza concettuale importante da questo punto in poi.

### Un limite da ricordare: dipendenza dall'ordine e completezza dei punti

La ricostruzione riga/colonna assume che `action=grid` restituisca **tutti** i punti richiesti, nello stesso ordine della richiesta. Se anche un solo punto venisse scartato (l'action ha un `.filter(p => p !== null)` che lo farebbe in caso di errore su quel punto specifico), l'allineamento righe/colonne si romperebbe silenziosamente. Non blindato per ora — se lo sfondo colorato mostrasse un giorno un pattern strano mentre le frecce sembrano normali, è il primo sospetto da controllare.

Su `mappa2.html`, che ha punti extra non regolari (`GRID_EXTRA_POINTS`, dedicati a singole stazioni), la ricostruzione filtra questi punti tramite il flag `isStationPoint` (già esistente per altri scopi) prima di costruire la griglia regolare.

### Parametri correnti

| Parametro | previsioni.html | mappa2.html |
|---|---|---|
| Risoluzione cella disegno | 8px | 8px |
| Blur CSS | 4px | 4px |
| Opacità canvas | 0.4 (allineata a mappa2 il 12/8) | 0.4 |
| Legato a un tasto? | No, sempre attivo (FLOW controlla solo le particelle) | Sì, insieme a FLOW (comportamento diverso, deciso esplicitamente il 1/8) |
| Tetto di zoom | Nessuno | Nessuno (tolto in mappa2 v1.2, ereditato dal vecchio metodo più costoso, non più necessario) |

Entrambe hanno anche un tasto **GRID** (12/8): nasconde solo la griglia OM generica di sfondo — le frecce delle zone/stazioni reali restano sempre visibili, il flusso animato non cambia (usa comunque tutti i dati della griglia per il calcolo, il tasto tocca solo il disegno).

---

## 14. Segnali emersi dall'analisi dati reali (12 agosto 2026) — verificati, alcuni ancora da agire

Prima parte: analisi dei 3 punti pilota (`simulator.html`). Seconda parte: estesa a tutte le 25 zone attive con `export.html` (`forecast_stats`+`mae_compare`+`bias_matrix`), lo stesso giorno.

### Possibile pattern: AROME meglio di OM al pomeriggio nel settore W, OM meglio al mattino

Sulla "matrice celle" di tutti e 3 i punti pilota (Gorgona, Bocca d'Arno, Viareggio), lo stesso disegno si ripete con campioni non minuscoli (17-60):

| Punto | Cella | N | Vince | MAE OM | MAE AROME |
|---|---|---|---|---|---|
| Gorgona | mattina, debole, S | 8 | AROME | 1.98 | 0.43 |
| Gorgona | mattina, debole, W | 17 | AROME | 3.35 | 2.05 |
| Bocca d'Arno | pomeriggio, debole, W | 37 | AROME | 1.83 | 1.61 |
| Viareggio | pomeriggio, debole, W | 35 | AROME | 2.60 | 1.99 |
| Viareggio | mattina, debole, W | 18 | OM | 2.68 | 3.28 |

Nel settore **W** (libeccio/ponente) al **pomeriggio**, AROME batte OM in modo netto e ripetuto su tre punti indipendenti. Al mattino, spesso è l'opposto. **Confermato più ampio** dall'estrazione completa (`mae_compare` su 25 stazioni): AROME vince a livello globale (non solo per cella) in **9 stazioni su 25** — Alberese, Gorgona CFR, Montecristo, Orbetello, Venturina, Barcaggio, Luri, Svincenzo Porto, Capraia Monte — non solo Alberese come documentato finora (sezione Roadmap "Alberese: AROME come base_model" era scritta troppo ristretta).

**Disegno condiviso per farlo diventare un vero selettore dinamico** (non ancora scritto): far leggere `action=predict` la matrice `model_score`/`bias_matrix` al momento del calcolo (nessuna cache separata da "far aggiornare" — legge sempre l'ultima disponibile, già così per come sono strutturate le due action); per gli orizzonti futuri, classificare la cella con la previsione OM stessa (unico dato disponibile in anticipo, stesso principio già usato altrove); soglia più prudente della semplice correzione bias, n≥10-15 non n≥5, perché cambiare modello è un intervento più grande che aggiustare un numero.

**Perché non è stato scritto ora — lezione di metodo, non solo su questo caso**: `bias_samples` (la fonte di `model_score`) copre solo **~2 giorni**. Una cella con n=37 in quella finestra è quasi certamente **un solo episodio di vento** campionato ogni 30 minuti (es. un pomeriggio intero di libeccio), non 37 situazioni meteo diverse. Un n alto non implica diversità di regime — implica solo tanti campioni, che possono venire tutti dallo stesso evento. Scegliere il modello su quella base rischierebbe di decidere sulla base di un giorno, non di un pattern stagionale vero. **Riprendere solo quando `bias_archive`** (nuovo, sezione seguente e CLAUDE.md) avrà accumulato settimane con giorni/regimi genuinamente diversi — verificare le statistiche allora, non ora.

### Possibile sospetto: bias di Livorno pesa a lunga distanza su altre zone

Nel "dettaglio OI" dei punti pilota, la stazione `livorno` contribuisce sia a Gorgona (38km) sia a Bocca d'Arno (25km) con un bias di **+7.8 kt** e peso 0.37 — non trascurabile a quella distanza. Livorno Porto era già segnata come "da tenere sotto osservazione, sembra poco esposta" (sezione 5); un bias così ampio, che pesa su zone diverse a decine di km, merita una verifica — non è detto sia un errore (una stazione poco esposta può avere legittimamente un bias grande), ma è un sospetto concreto da controllare, non solo un'ipotesi.

### Anomalia statistica netta: Orbetello e Bonifacio Cap Pertusato

In `mae_compare` (100 campioni ciascuna), `bias_om` coincide **esattamente** con `mae_om`:

| Stazione | mae_om | bias_om | reliability_weight |
|---|---|---|---|
| Orbetello | 5.41 | 5.41 | 0.16 |
| Bonifacio Cap Pertusato | 3.48 | −3.48 | 0.22 |

Bias = MAE significa che, su 100 campioni, l'errore ha **sempre lo stesso segno**, senza mai un'eccezione. Un bias vero (una stazione sistematicamente esposta in modo diverso da OM) oscilla comunque giorno per giorno — non è tipico che coincida esattamente con l'errore assoluto medio. È più probabile un problema di dati: coordinate, quota, o cella OM associata sbagliata. Il valore di Orbetello (5.41 kt) è inoltre il più alto di tutto il sistema, quasi doppio del successivo. Il sistema stesso lo segnala già indirettamente: `reliability_weight` è il più basso tra tutte le stazioni controllate — nessuno l'aveva ancora notato prima di questa analisi. **Da verificare (coordinate/quota) prima di qualunque altra azione su queste due zone.**

### Confermato con dati reali: il fix di naming di forte_marmi ha funzionato

Il MAE settimanale di Forte dei Marmi crolla da **4.6 kt** (settimana del 27/7, prima del fix) a **1.5 kt** (settimana successiva, dopo il fix del 31/7, engine v2.14.10) — esattamente in coincidenza temporale. Non è una scoperta di problema, è una controprova positiva: il fix ha funzionato come previsto, si vede nei numeri veri.

### Confermato con dati reali: `canale_piombino` (zona) ha il bias peggiore e più persistente di tutte le 25

Il bias è negativo su **tutti** gli orizzonti verificati, senza oscillare: H+1 −1.2, H+3 −1.6, H+6 −2.1, H+9 −2.1, H+12 −1.8 — la previsione sovrastima sempre, coerente con l'ipotesi di sempre (Populonia, 164m, riferimento sbagliato per un canale a livello mare). Prima quantificazione numerica di un sospetto qualitativo di settimane.

**Sviluppo dello stesso giorno**: verificata via `action=mnw_test` (due controlli distanziati) che la stazione MNW `tsc228` (porto di Piombino, quota 8m — il riferimento giusto) **è tornata a trasmettere vento reale**, dopo settimane documentate come muta. `tsc578` (Capraia) resta muta, invariata. Ipotesi aperta: sostituire `populonia_cfr` con `canale_piombino` come `bias_station` della zona — **aspettare la conferma di stabilità su 1-2 giorni** prima di agire, non decidere su un singolo test (le stazioni MNW hanno già dato segnali di vita passeggeri in questo progetto).

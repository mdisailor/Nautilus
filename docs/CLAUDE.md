# NAUTILUS — Contesto Sessione (CLAUDE.md)


## PUNTO DI RIPRESA — 2026-08-12

**Versioni in produzione**: engine **v2.14.17** · index **v5.7.39** · mappa **v1.6.88** · previsioni **v3.2** · mappa2 **v1.3** · index2 **v1.4**

### Fase attuale: archivio persistente costruito e in fase di riempimento, due sospetti concreti dai dati reali da verificare

Costruito (9-12/8) l'**archivio persistente** che mancava da sempre: `bias_archive`/`predict_archive`, tetto molto più alto delle vecchie finestre fisse (`bias_samples` tetto 100 = ~2gg, `predict_history` tetto 30 = ~15gg). Prerequisito esplicito prima di poter mai stratificare per regime di vento (Fase 6) — senza questo, un cambio di regime che rientra nella calma dopo pochi giorni non sarebbe mai stato visibile tutto insieme, si perdeva per sempre.

**Bug trovato e corretto durante la costruzione**: `bias_archive` era stato scritto solo in 1 dei 4 punti dove `bias_samples` viene scritto (`scrape_stations`, ~4 stazioni su 25) — per tutte le altre (quelle da `scrape_cfr`, `scrape_web`, `scrape_web2` — la maggioranza) l'archivio non si riempiva affatto, da quando introdotto. Corretto in v2.14.15, stesso pattern in tutti e 4 i punti ora. Fatto anche un recupero una tantum (`action=archive_backfill`, v2.14.16-17) per unire dentro `predict_archive` le ~30 previsioni per zona già accumulate nei mesi in `predict_history`, prima che uscissero dalla finestra fissa e si perdessero per sempre senza mai essere state salvate nell'archivio.

**Nuovo tasto in `index2.html`** ("Controlla archivio"): una tabella, conteggio e data più vecchia per bias/predict archivio, per zona — nessuna azione, sola lettura (`action=archive_check`, v2.14.14).

### Due sospetti concreti emersi dall'analisi dei dati reali (12/8, da `export.html` + export del simulatore)

1. **Orbetello e Bonifacio Cap Pertusato**: `bias_om` coincide **esattamente** con `mae_om` su 100 campioni — l'errore ha sempre lo stesso segno, mai un'eccezione. Non è la firma tipica di un bias vero (che oscilla), è più probabile un problema di dati (coordinate, quota, o cella OM sbagliata). `reliability_weight` già bassissimo (0.16 e 0.22) — il sistema stesso li segnala come poco affidabili, senza che nessuno l'avesse ancora notato.
2. **`canale_piombino` (stazione MNW tsc228, quella del porto) è tornata a trasmettere vento reale** (confermato 12/8 via `action=mnw_test`, due controlli distanziati, entrambi con dato valido: 9.0kn SSE). La documentazione precedente ("online ma senza campo vento") **è superata per questa stazione** — non per Capraia (tsc578), che resta muta come prima. Ipotesi aperta ma non ancora agita: `canale_piombino` (zona) ha il bias peggiore e più persistente di tutte le 25 zone (H+1 −1.2, H+6 −2.1, H+12 −1.8, sempre nella stessa direzione) — coerente con l'ipotesi di sempre che `populonia_cfr` (164m) sia il riferimento sbagliato. Se tsc228 resta stabile per 1-2 giorni, sostituirla come `bias_station` della zona è la correzione naturale — **da verificare la stabilità prima di agire**, le stazioni MNW hanno già dato segnali di vita passeggeri in passato.

### AROME come selettore dinamico per cella — disegnato, deliberatamente non ancora implementato

Dai dati emerge che AROME vince in **9 zone su 25** (non solo Alberese come documentato finora), e sui 3 punti pilota del simulatore un pattern si ripete con campioni non piccoli (17-60): AROME batte OM nel settore **W al pomeriggio**, OM vince al mattino. `model_score`/`bias_matrix` calcolano già questa matrice ogni ora — oggi è solo diagnostica, nessuna previsione la usa per scegliere.

**Il disegno** (condiviso, non scritto): far leggere `action=predict` la matrice fresca al momento del calcolo (nessun meccanismo speciale per "farla aggiornare da sola" — legge sempre l'ultima disponibile, per come è già strutturato); per gli orizzonti futuri, classificare la cella usando la previsione OM stessa (unico dato disponibile in anticipo); soglia minima più prudente di quella del bias semplice (n≥10-15, non n≥5) prima di fidarsi del verdetto di una cella.

**Deliberatamente rimandato**: `bias_samples`/`model_score` oggi vedono solo ~2 giorni di storico — una cella con n=37 in quella finestra è quasi certamente un solo episodio di vento campionato ogni 30 min, non 37 situazioni diverse. Implementarlo ora rischierebbe di scegliere il modello sulla base di **un giorno**, non di un pattern stagionale vero. **Promemoria esplicito**: riprendere in mano questa domanda quando `bias_archive` (appena costruito, parte da zero il 9/8) avrà accumulato settimane con giorni/regimi di vento genuinamente diversi — non prima. Verificare le statistiche allora, non ora.

### Lavoro sulle mappe (12/8)

- **`previsioni.html`** (v3.0→v3.2): opacità campo colorato allineata a `mappa2.html` (0.5→0.4); nuovo tasto **GRID** on/off (nasconde solo la griglia OM generica di sfondo, le frecce zona restano sempre visibili); rimossa la legenda in basso a sinistra
- **`mappa2.html`** (v1.2→v1.3): stesso tasto **GRID** on/off, stesso principio — nasconde la griglia generica, non i punti dedicati a stazioni reali né le zone
- Confermato con l'utente: con GRID off + FLOW on si vedono comunque le frecce doppie (zone/stazioni) + sfondo colorato + particelle — il tasto GRID tocca solo il disegno della griglia generica, non il flusso né il colore

### Principi consolidati (luglio-agosto 2026, valgono su tutto il sistema)

1. **Solo dati reali nelle statistiche.** Le verifiche usano esclusivamente `wind_source='cfr'` (o fonte reale); la visualizzazione mostra sempre un numero ma se è modello lo scrive in **rosso**. Mai un valore OM spacciato per osservazione.
2. **"Dati assenti", non tasto nascosto né ripiego geografico.** Quando una stazione tace: la voce **resta visibile**, mostra l'ultimo dato con la sua **età**, e quel dato **non entra nei calcoli**. Mai sostituire con una stazione vicina.
3. **I dati di fonti esterne non si manipolano.** Se un valore sembra implausibile, va **segnalato come sospetto**, non corretto silenziosamente per farlo sembrare plausibile.
4. **Esporre l'ipotesi e concordare prima di scrivere codice.** Vale soprattutto quando si tocca il trattamento di dati esterni o logiche di calcolo.
5. **Attenzione ai fallback taciti.** Ogni `||` con un valore di comodo su un campo che rappresenta la realtà è un sospetto.
6. **La versione va sempre esposta in testata, a video.**
7. **Un'ipotesi statistica va sempre verificata con un backtest vero**, non solo un confronto a due punti.
8. **Un numero grande non basta a dire "serve una correzione più sofisticata"** — se la finestra dietro quel numero è corta (giorni, non settimane/mesi), il numero può essere un solo episodio travestito da pattern. Verificare sempre la diversità temporale dietro un n alto, non solo il valore di n (lezione dal caso AROME-selettore, 12/8).

### Lavoro svolto in luglio 2026 (sintesi)

- **Audit incrociato (11/07)**: sei bug critici corretti (A1-A6), engine da v2.13.x a v2.14.0
- **Reset storico (04/07)**: `reset_history_all` su tutte le 26 zone — i dati di verifica partono da quella data
- **Livorno risolto (13/07)**: `livorno_cfr` era un **mareografo** → sostituito con **`livorno_porto`** (Windfinder, quota zero), promossa a `bias_station` della zona.
- **Bussole (14-15/07)**: risolta race condition per cui le bussole singole restavano rosse (OM) anche con stazioni vive.
- **Decadimento previsioni (15/07)**: nuovo cruscotto `decadimento.html`. Pattern mattina/pomeriggio scoperto, poi confermato e quantificato per orizzonte il 31/07.
- **Piombino/Capraia mute (19-20/07)**: `tsc228`/`tsc578` online ma senza campo vento all'epoca. **Aggiornamento 12/8: tsc228 (Piombino) è tornata a trasmettere, tsc578 (Capraia) resta muta** — vedi sopra.
- **Bug cache mappa (22/07)**: `fetchZoneData` senza `cache:'no-store'` → popup marker con snapshot vecchi. Risolto in mappa v1.6.87.
- **Analisi accuratezza (25/07)**: peggioramento reale confermato. Ipotesi pressione scartata.
- **Costi AI (27/07)**: `situazione` non chiama più l'AI dal v2.14.9.

### Lavoro svolto 31/07–01/08 2026 (sintesi)

- **Tool `export.html`**: un tasto estrae in un unico JSON `forecast_stats`+`predict_history`+`mae_compare`+`bias_matrix`+`model_score`+`decadimento_by_slot` per tutte le zone.
- **Bug naming risolto (engine v2.14.10, mappa v1.6.88)**: `bias_station` di `forte_marmi` e `casotto_gr` non combaciava con la chiave reale scritta da `scrape_cfr`. **Confermato funzionante il 12/8**: il MAE settimanale di Forte dei Marmi crolla da 4.6 a 1.5 kn esattamente in coincidenza con il fix.
- **Due tentativi di correzione avanzata testati e scartati** (backtest rigoroso): split bias mattina/pomeriggio e decadimento esponenziale del bias. **Non riprovare senza più storico** — principio poi riconfermato il 12/8 per il caso AROME-selettore (vedi sopra).
- **`previsioni.html`** e **`mappa2.html`** costruite, sfondo colorato bilineare (vedi METODOLOGIA sezione 13).

### Problemi aperti prioritari

| Problema | Stato |
|---|---|
| **Orbetello e Bonifacio Pertusato — verificare coordinate/quota** | Nuovo (12/8), priorità alta. Firma statistica anomala (bias=MAE esatto su 100 campioni), `reliability_weight` già basso (0.16/0.22) |
| **Canale di Piombino — valutare tsc228 come `bias_station` invece di Populonia** | Nuovo (12/8). tsc228 tornata a trasmettere vento reale, stabile su 2 controlli. **Aspettare 1-2 giorni di stabilità prima di agire** — non decidere su un singolo test |
| **AROME come selettore dinamico per cella (vento×settore×slot)** | Disegnato, deliberatamente **non implementato**. Aspettare che `bias_archive` (appena costruito) abbia settimane di giorni/regimi diversi, non i soli ~2gg di `bias_samples` — altrimenti si rischia di scegliere il modello su un solo episodio. **Promemoria: riverificare le statistiche quando l'archivio sarà più maturo, prima di scrivere codice** |
| **Populonia — coordinate sbagliate** | Ancora da fare, indipendente dal punto sopra. Usa lat 42.987731 lon 10.537734 ma risulta troppo a est rispetto alla Livemap ufficiale |
| **Liste hardcoded incomplete in `mae_compare`/`bias_matrix`/`score_get`** | Da fare (impatto solo diagnostico). Mancano `populonia_cfr`, `livorno_porto`, `viareggio_cfr` |
| **3 zone senza predict non documentate come escluse** | Da chiarire — probabile mancanza nell'elenco del cron su cron-job.org (esterno, non nel codice engine). `lido_camaiore`, `giglio_castello`, `quercianella` hanno `enabled:true` ma zero previsioni confermato con dati reali il 12/8. **Non fondamentale adesso, rivedere più avanti** |
| **Correzione `forecast_stats` trend con N=2** | Il calcolo del trend include settimane con solo 2 campioni, che falsano il giudizio |
| **`action=history` tronca lo storico** | Prerequisito per analisi su finestre lunghe |
| **Dato OM sospetto su Capraia** | Aperto, nessuna azione. Pressione 978 hPa e direzione opposta all'avviso marittimo |
| **`mappa2.html` vs `mappa.html`** | In prova. Se il confronto affiancato convince, decidere un passaggio esplicito per "promuovere" mappa2 — non per confusione tra i due file |

### Note operative sulla collaborazione

- **Gli allegati `document` da iPad arrivano vuoti** — il testo va **incollato direttamente in chat**, non allegato.
- **Sessioni lunghe**: la quota si consuma più in fretta con Opus e con conversazioni lunghe. Per sessioni di manutenzione conviene **Sonnet 5**; Opus per problemi diagnostici ambigui, in sessioni brevi e mirate.
- **Il filesystem di lavoro si resetta tra sessioni** — ricaricare engine, index, mappa, previsioni, mappa2, index2 correnti a ogni ripresa.
- **Verificare sempre un'ipotesi statistica con un backtest**, e verificare sempre la diversità temporale dietro un n alto, non solo il suo valore.
- **`web_fetch` non riesce a chiamare l'engine direttamente** (restrizione dell'ambiente: solo URL già apparsi in conversazione) — l'estrazione dati resta un giro di incolla-e-rispondi: M apre `export.html`/le action URL, incolla qui il risultato.

---

Documento di contesto persistente per sessioni di lavoro con Claude.
Aggiornato: 2026-08-12 | Versioni riferimento: engine v2.14.17 · index v5.7.39 · mappa v1.6.88 · previsioni v3.2 · mappa2 v1.3 · index2 v1.4


---

## Link raw GitHub (da leggere all'inizio di ogni sessione)

```
https://raw.githubusercontent.com/mdisailor/Nautilus/refs/heads/main/docs/CLAUDE.md
https://raw.githubusercontent.com/mdisailor/Nautilus/refs/heads/main/docs/METODOLOGIA.md
https://raw.githubusercontent.com/mdisailor/Nautilus/refs/heads/main/docs/ROADMAP.md
https://raw.githubusercontent.com/mdisailor/Nautilus/refs/heads/main/api/engine.js
https://raw.githubusercontent.com/mdisailor/Nautilus/refs/heads/main/index.html
https://raw.githubusercontent.com/mdisailor/Nautilus/refs/heads/main/mappa.html
```

**Istruzioni per Claude all'inizio sessione**: leggi prima i tre .md per il contesto, poi i file di codice solo se la sessione li tocca — index.html e engine.js sono grandi, consumano contesto, leggili solo se necessario.

> **Da decidere**: la convenzione "versione nel nome file" (`METODOLOGIA-v1.4.md`) è in tensione con questi link raw, che puntano a nomi fissi e si romperebbero a ogni nuova versione. Due opzioni: (a) tenere i nomi fissi su GitHub e usare la versione nel nome solo per gli zip di lavoro; (b) versionare anche su GitHub e aggiornare i link qui a ogni rilascio. **Non ancora deciso.**

---

## Stack tecnico

| Componente | Dettaglio |
|---|---|
| Hosting | Vercel (piano Hobby, maxDuration ~10s per funzione) |
| Database | Upstash Redis (KV) |
| Meteo primario | Open-Meteo (`/v1/forecast`, best_match ~9km) |
| Meteo secondario | Open-Meteo MeteoFrance (`/v1/meteofrance`, AROME 2.5km) |
| Stazioni reali | MeteoNetwork API (token Bearer), CFR Toscana (scraping HTML), Windfinder `/report/` (scraping JSON embedded), Meteosystem (scraping HTML) |
| AI | Anthropic Claude via API. **Solo `action=predict`** genera i numeri di previsione (Haiku 4.5 se `fast=1`, altrimenti Sonnet 4.6). `action=situazione` **non chiama più l'AI** dal 27/07 (engine v2.14.9). Il "Briefing operativo" (`generateBriefingText`) è JavaScript puro, non è mai costato nulla |
| Cron | cron-job.org (esterno) |
| IDE remoto | github.dev (VS Code browser, da iPad) |

---

## Versioni file in produzione

| File | Versione | Note |
|---|---|---|
| *(nota: i `.html` stanno nella **radice** del repo, non in `public/`)* | | |
| `api/engine.js` | **v2.14.17** | Engine principale. v2.14.13: archivio persistente `bias_archive`/`predict_archive`. v2.14.14: `action=archive_check` (sola lettura). v2.14.15: fix `bias_archive` mancava in 3/4 punti di scrittura. v2.14.16-17: `action=archive_backfill` (una tantum, fix auth k=mdi) |
| `index.html` | **v5.7.39** | App principale. Stazioni mute mostrano ultimo dato + età |
| `mappa.html` | **v1.6.88** | Mappa vento (produzione). Fix naming forte_marmi/casotto_gr (allineato al rename engine v2.14.10) |
| `mappa2.html` | **v1.3** | Sperimentale — fork di mappa.html per confronto affiancato. Sfondo colorato bilineare, solo 2 tasti (FLOW, OI) + nuovo tasto GRID on/off (12/8). mappa.html originale non toccato |
| `previsioni.html` | **v3.2** | Mappa vento futuro. Bottoni a ore intere, due orologi separati, FLOW, XLS, sfondo colorato bilineare (opacità 0.4, allineata a mappa2), tasto GRID on/off, legenda rimossa (12/8) |
| `export.html` | **v1.3** | Un tasto estrae `forecast_stats`+`predict_history`+`mae_compare`+`bias_matrix`+`model_score`+`decadimento_by_slot` per tutte le zone in un unico JSON |
| `index2.html` | **v1.4** | Cruscotto: indice strumenti + stato engine live + tasto "Controlla archivio" (12/8) + link mancanti a previsioni/mappa2/export aggiunti (12/8) |
| `diag.html` | v1.3 | Diagnostica strutturata per zona con semafori |
| `climatologia.html` | v1.4 | Distribuzione fasce e settori per zona |
| `decadimento.html` | v1.2 | MAE per orizzonte con banda dispersione + confronto mattina/pomeriggio |
| `public/stats.html` | v1.18 | Accuratezza previsioni AI |
| `public/mae.html` | v1.10 | Comparazione MAE OM vs AROME + osservazioni manuali |
| `public/score.html` | v1.6 | Cruscotto model score per condizione (strumento validazione temporaneo) |
| `public/simulator.html` | v1.8 | Simulatore decisioni — 3 punti pilota (Gorgona, Bocca Arno, Viareggio) |

---

## Zone attive

### Zone con predict/situazione AI (cron orario)
**26 zone attive** (`enabled: true` in engine.js). `reset_history_all` eseguito il 04/07/2026 su tutte: i dati di verifica partono da quella data.

Zone toscane: Livorno, Canale Piombino, Capraia, Elba Nord, Elba Sud, Giglio, Gorgona, Montecristo, Orbetello, Punta Ala, S.Vincenzo, Follonica, Capalbio, Alberese, Forte Marmi, Casotto GR, Venturina, Bocca d'Arno, Viareggio

Corsica: **Barcaggio** (Capo Corso) — predict attivo dal 2026-06-19

### Zone in osservazione senza predict
- **Bonifacio / Cap Pertusato** — dati stantii (Windfinder aggiorna raramente), direzione spesso fissa per ore
- **Vada** (Camping Tripesce, Meteosystem) — direzione sistematicamente opposta alle stazioni vicine, sospetto sensore mal orientato

---

## Cron attivi su cron-job.org

| Action | Orari / Frequenza | Note |
|---|---|---|
| `scrape_cfr` | ogni 30 min | CFR Toscana, tutte le stazioni |
| `scrape_stations` | ogni 30 min | MeteoNetwork API (Livorno, Piombino, Elba Nord, Viareggio) |
| `scrape_web` | ogni 30 min (:11, :41) | 6 stazioni MeteoNetwork web (sequenziale) |
| `scrape_web2` | ogni 30 min | Barcaggio + Bonifacio (Windfinder) + Vada (Meteosystem), parallelo |
| `predict` mattino ×20 | 07:15-07:34 | 19 zone toscane + Barcaggio, sequenziale |
| `predict` pomeriggio ×20 | 13:15-13:34 | Stesso ordine del mattino |
| `backfill_actuals` | 01:35 08:35 10:35 13:35 16:35 19:35 23:45 | 7 volte/giorno, copre tutti gli orizzonti mattina e pomeriggio |
| `compute_scores` | ogni ora :45 | Ricalcola matrix e matrix_by_station per tutte le 23 stazioni, copre tutti gli orizzonti mattina e pomeriggio |

---

## Struttura Redis (chiavi principali)

| Chiave | Contenuto |
|---|---|
| `bias_samples:<id>` | Array fino a 100 campioni (~2gg): `{ts, station, om, arome, delta, delta_arome}` |
| `bias_archive:<id>` | **Nuovo (9/8)** — stessa forma di `bias_samples`, tetto 3000 (~62gg). Scrittura in parallelo in tutti i 4 punti dove si scrive `bias_samples` |
| `predict_history:<zona>` | Storico previsioni AI con actual_Nh popolati a posteriori, tetto 30 (~15gg) |
| `predict_archive:<zona>` | **Nuovo (9/8)** — stessa forma di `predict_history`, tetto 1000 (~500gg). Sola scrittura oggi, nessuna action legge da qui per calcolare/correggere |
| `predict:<zona>:<slot>` | Ultima previsione per slot orario |
| `bias_stats:<id>` | Statistiche aggregate bias stazione (calcolate da biasComputeStations) |
| `snap:<zona>:<slot>` | Snapshot OM orari per wind history nelle previsioni |
| `grid_rules` | Regole per cella griglia OI: allowed_stations/excluded_stations/min_weight/base_model |

---

## Stazioni reali attive (bias_samples)

### MeteoNetwork API
`livorno`, `canale_piombino`, `elba_nord`, `viareggio`

### CFR Toscana (scraping)
`gorgona_cfr`, `capraia_cfr`, `giglio_porto`, `giglio_castello`, `montecristo`, `portoferraio_cfr`, `orbetello`, `svincenzo_porto`, `casotto_pescatori`, `venturina`, `forte_dei_marmi`, `lido_camaiore`, `bocca_arno_cfr`, `follonica`, `capalbio`

### MeteoNetwork Web (scraping)
`bocca_arno`, `capraia_w`, `populonia`, `portoferraio`, `alberese`, `luri`

### Windfinder /report/ (scraping JSON embedded)
`barcaggio`, `bonifacio_pertusato`, **`livorno_porto`** (spot `it2005`, dal 13/07 — `bias_station` della zona Livorno)

### Stazioni MUTE (online ma senza campo vento) — verificare con `action=mnw_test&k=mdi`
- **`tsc228`** (canale_piombino) — muta dal 17/07 circa
- **`tsc578`** (capraia_w) — stesso sintomo
Rispondono `status:200 ok:true` ma senza `wind_speed`/`wind_dir`. Non è licenza revocata (quella dà errore). Fuori dal nostro controllo: attendere che il sensore rientri.

### Meteosystem (scraping HTML)
`vada`

---

## Decisioni architetturali fisse

- **Nessun file parallelo** — tutto nell'engine esistente, nuove feature con suffisso `_v2` sulle action Redis
- **AROME già raccolto** — campo `arome` e `delta_arome` in tutti i `bias_samples` dal 16 giugno 2026
- **Windfinder usa `/report/` non `/windstatistics/`** — quella con statistiche annuali è stata usata erroneamente in precedenza, corretta il 18 giugno 2026
- **scrape_web e scrape_web2 separati** — MeteoNetwork (stesso dominio, sensibile al carico concorrente) separato da Windfinder/Meteosystem
- **Timeout fetch HTML**: 6s in scrape_web (MeteoNetwork), 8s in scrape_web2 (Windfinder/Meteosystem)
- **Anti-duplicato Windfinder** — campo `obs_time` da campo `dtl` nel JSON embedded; se coincide con l'ultimo campione, scarta senza salvare
- **OI (Optimal Interpolation) implementato** — mappa v1.6.55. Toggle ON/OFF. Raggio 60km, decadimento quadratico (1-d/60)² × reliability_weight. Sostituzione progressiva: stazione sostituisce OM con peso crescente al diminuire della distanza. grid_rules per celle specifiche: allowed_stations, excluded_stations, min_weight, base_model (non ancora implementato). Chiave Redis: grid_rules. Init: action=grid_rules_init&k=mdi. **Interpolazione direzione via vettori U/V normalizzati a modulo 1 (fix v1.6.54, 2026-07-01)** — il peso nominale (min_weight) si applica al peso puro, non più al vettore pesato per velocità; risolve bug per cui stazioni a vento debole perdevano il controllo della direzione nonostante min_weight alto. **Guard isNaN su frecce e campo vettoriale (fix v1.6.55, 2026-07-01)** — punti con dir/speed NaN vengono scartati invece di propagarsi per contagio a tutto il campo del flusso animato o apparire come frecce fantasma orientate a nord. Export griglia Excel: bottone 📊 XLS genera 4 fogli (OM, OI, Delta, Stazioni) per analisi pattern correzioni. Stazioni escluse globalmente: `bonifacio_mnw`, `vada_mnw`.
- **Osservazioni manuali** — mappa v1.6.32 + engine v2.13.28. Bottone arancione in ogni popup punto giallo. Form: velocità, direzione, pin (1-8 char), data/ora modificabile, nota. Salva in `obs_manual` Redis (max 200). Marker arancioni sulla mappa con colore per età. Pin non ancora validati — lista autorizzati da aggiungere in futuro con chiave `obs_pins_authorized` in Redis.

---

## Problemi aperti / in osservazione

- Vada e Bonifacio/Cap Pertusato: dati inaffidabili, in osservazione da >4 settimane. Decisione rinviata. **Aggiornamento 12/8**: `bonifacio_pertusato` mostra ora un'anomalia statistica concreta (bias esattamente = MAE su 100 campioni, `reliability_weight` 0.22) — vedi PUNTO DI RIPRESA
- **Orbetello — anomalia statistica nuova (12/8)**: bias esattamente = MAE su 100 campioni (5.41 kt, il valore più alto di tutto il sistema), `reliability_weight` 0.16 — sospetto concreto di coordinate/quota/cella OM sbagliate, da verificare prima di qualunque altra azione su questa zona
- **Populonia CFR**: è fisicamente a **164m sul promontorio** (non è un errore di codifica). Il problema è che **non può rappresentare il canale di Piombino** a livello mare: va staccata come `bias_station`, non corretta con un fattore di quota. In più le coordinate usate risultano spostate a est rispetto alla posizione reale. **Aggiornamento 12/8**: la stazione MNW `tsc228` (porto di Piombino, quota 8m — esattamente il riferimento giusto) è tornata a trasmettere vento reale, confermato stabile su 2 controlli distanziati. Ipotesi aperta: sostituirla come `bias_station` di `canale_piombino` al posto di Populonia — **aspettare 1-2 giorni di stabilità prima di agire**, non decidere su un singolo test. Il bias della zona è oggi il più persistente di tutte le 25 (H+1 −1.2, H+6 −2.1, H+12 −1.8, sempre stesso segno) — coerente con l'ipotesi
- Giglio, Montecristo, Gorgona: timeout `situazione` occasionale per fetch OWM/ICON lenti su isole remote
- Bias injection AI: non confermato che il modello applichi effettivamente la correzione nel prompt — da verificare con `predict_log` strutturato
- **Direzione OI instabile su celle con stazione a vento debole (<2kn)** — classe di problema, vedi PUNTO DI RIPRESA. Casi osservati: Viareggio, Populonia. Soluzione proposta ma rinviata (soglia minima vento).
- **Flusso animato non rispecchia le grid_rules puntuali** — limitazione strutturale, da trattare con Roadmap 5.1
- **AROME come selettore dinamico per cella (vento×settore×slot)** — disegnato il 12/8, deliberatamente non implementato. `model_score`/`bias_matrix` vedono solo ~2gg di storico (`bias_samples`): un n alto in quella finestra è probabilmente un solo episodio, non diversità di regime. **Promemoria: riverificare le statistiche quando `bias_archive` avrà settimane di dati, prima di scrivere codice**

---

## Bug aperti / problemi noti

| Bug | File | Stato | Note |
|---|---|---|---|
| Timeout `action=situazione` su isole remote | engine.txt | Aperto | Giglio, Montecristo, Gorgona: fetch lente causano timeout occasionale — fix: timeout esplicito 5-8s |
| Porto Pollo coordinata in mare | index.html + mappa.html | Aperto | Coordinata 41.2875052, 9.2243077 cade nello stretto invece che sulla spiaggia — errore fonte Google Maps |
| Bias injection AI non verificata per Barcaggio | engine.txt | Aperto | Non confermato che bias_station venga effettivamente applicata nel prompt per le nuove stazioni |
| `lamma_bias` non integrato in predict | engine.txt | Aperto | action=lamma_bias_get esiste come monitoring ma non iniettato nel prompt AI |
| Populonia quota 164m errata | engine.txt / index.html | Aperto — vedi anche ipotesi tsc228 (12/8) | È una stazione marina, dovrebbe essere 0m — badge rosso quota in UI. Possibile soluzione più a monte: sostituire come `bias_station` con tsc228, tornata a trasmettere — in verifica |
| Livorno CFR è un mareografo | — | ✅ Risolto 13/07 | Sostituito da `livorno_porto` (Windfinder `it2005`) come `bias_station` della zona |
| `bias_station` di forte_marmi/casotto_gr non combaciava con la chiave reale (`forte_marmi`→`forte_dei_marmi`, `casotto_pesc`→`casotto_pescatori`) | engine.txt / mappa.html | ✅ Risolto 31/07 (engine v2.14.10, mappa v1.6.88), **confermato con dati reali 12/8** | `bias_samples` per quelle 2 zone era vuoto, `forecast_stats`/`backfill_actuals` cadevano nel fallback meno preciso su `snap:`. Confermato funzionante: MAE settimanale di Forte dei Marmi crolla da 4.6 a 1.5 kn esattamente in coincidenza col fix |
| Orbetello e Bonifacio Pertusato — bias esattamente uguale a MAE su 100 campioni | engine.txt (dati, non codice) | Nuovo (12/8), da verificare | Errore sempre stesso segno, mai un'eccezione su 100 campioni — non tipico di bias vero. Sospetto: coordinate, quota, o cella OM sbagliata. `reliability_weight` già basso (0.16 e 0.22) |
| Liste hardcoded stazioni incomplete in `mae_compare`/`bias_matrix`/`score_get` | engine.txt | Aperto (31/07) | Mancano `populonia_cfr`, `livorno_porto`, `viareggio_cfr` — impatto solo diagnostico (quei 3 cruscotti mostrano dato assente/vecchio per queste stazioni), non tocca la correzione vera |
| `bias_station` di `quercianella` punta a `'livorno'` invece che alla propria stazione | engine.txt | Aperto, dormiente (31/07) | Quercianella non è nel cron predict quindi non ha effetto oggi — da correggere se la zona viene attivata |
| `action=debug_fs` da rimuovere | engine.txt | Aperto | Action di debug per Livorno, non serve in produzione — rischio sicurezza |
| Subtitle stats.html versione engine hardcoded | stats.html | Aperto | Da aggiornare manualmente ad ogni release engine |
| Mappa layer colore WebGL inguardabile oltre Z10 | mappa.html | Aperto | 5 fix pendenti: (1) viewport +400px per punti fuori schermo, (2) isNaN check punti (Marina di Pisa causa buchi), (3) kernel gaussiano invece IDW puro, (4) limite 60 punti vicini al centro, (5) texture size adattiva per zoom |
| Cron backfill 14:35 e 22:35 mancanti | cron-job.org | Aperto | H+1 pomeridiano (14:35) e H+9 pomeridiano (22:35) non ancora configurati |
| OI_EXCLUDED usava sid invece di key (bonifacio_pertusato/vada invece di bonifacio_mnw/vada_mnw) | mappa.html | ✅ Risolto v1.6.42 |
| Direzione OI pesata per velocità invece che per peso puro — stazioni a vento debole perdevano controllo direzione nonostante min_weight alto | mappa.html | ✅ Risolto v1.6.54 (2026-07-01) | Scoperto su cella 43.75_10.15 (Viareggio 0.8kn/157° non riusciva a spostare direzione da 221°→ora converge a 166°) |
| NaN in dir/speed causava frecce fantasma orientate a nord e contaminazione per contagio del flusso animato | mappa.html | ✅ Risolto v1.6.55 (2026-07-01) | Guard isNaN aggiunti in drawArrow e in tutte le sorgenti di buildVectorField |
| Direzione OI instabile su celle con stazione vento <2kn (rumore di lettura banderuola) | mappa.html | Aperto — in osservazione | Non è un bug del fix v1.6.54, è un limite di affidabilità del dato stazione. Soglia minima vento proposta, rinviata in attesa di più casi |
| Flusso animato non rispecchia le grid_rules puntuali (media d'area dilusice correzione singola cella) | mappa.html | Aperto — backlog | Da trattare insieme a Roadmap 5.1 (mappa animata Windy-style + evoluzione temporale) |
| Pin osservatori non validati | engine.txt | Aperto | obs_save accetta qualsiasi pin — aggiungere lista autorizzati in `obs_pins_authorized` Redis |
| Redis comandi: ~25-30K/giorno, limite 500K/mese. Monitorare su console.upstash.com. Non aggiungere cron pesanti senza verifica | — | In osservazione |
| punta_ala: zona previsione senza stazione reale vicina (<20km) — MAE non affidabile | engine | Aperto |
| Windfinder Barcaggio direzione fissa NNE 30-31° | bias_samples | In osservazione | Potrebbe essere effetto locale reale o problema sensore |
| **Sicurezza** — nuovo giro di audit | engine.txt | ⚠️ Pianificato | Sessione Fable ha identificato vulnerabilità (action=agent proxy aperto, action=debug_fs non autenticato, inconsistenza secret enforcement). Implementazioni parziali — da completare |
| `bias_archive` scriveva solo in 1 dei 4 punti dove `bias_samples` viene scritto | engine.txt | ✅ Risolto 12/8 (engine v2.14.15) | Introdotto in v2.14.13 ma aggiunto solo in `scrape_stations` (~4 stazioni su 25) — per tutte le altre (da `scrape_cfr`/`scrape_web`/`scrape_web2`, la maggioranza) l'archivio non si riempiva affatto. Stesso pattern in tutti e 4 i punti ora |

---

## Sistema adattivo — stato attuale

Il bias injection è attivo per le zone con n>=5 campioni verificati (actual popolati).

| Zona | Stato | Note |
|---|---|---|
| Capraia | Bias injection ATTIVO | MAE 5.1kn, bias -5.1kn, sovrastima sistematica ~3-5kn — effetti orografici isola non catturati da OM |
| Bocca d'Arno | Attivo, trend improving | Prima zona con dati completi, MAE H+6 in miglioramento |
| Livorno | Attivo (fallback snap) | tsc265 licenza revocata 28/04 → bias_samples vuoto, backfill usa snap:livorno:* |
| Barcaggio | Attivo da 2026-06-19 | Pochi campioni ancora, da monitorare |

**Decisioni sistema adattivo aperte:**
- Soglia attivazione bias: n>=5 (valutare aumento a 10 dopo 2-3 settimane)
- Metodo calcolo: media semplice su tutti i campioni — **confermato dopo backtest il 31/07**, non un default provvisorio
- **Decadimento esponenziale λ=0.85: testato con backtest rigoroso il 31/07 e SCARTATO** — leggermente peggiore della media semplice (errore medio 2.57kn vs 2.52kn su 160 test). Anche finestre fisse più corte (8/10/12/15 campioni) sono risultate tutte peggiori della media su tutto lo storico. Non riprovare senza molto più storico per zona (oggi n=15-30)
- **Split bias mattina/pomeriggio: testato e SCARTATO il 31/07** — il gap di MAE tra slot (grande a H+1, fino a 0.84kn) è quasi tutto dispersione, non bias medio correggibile (gap di bias reale solo 0.16kn a H+1); dove il bias medio differisce davvero (H+3: 0.63kn, H+9: 0.55kn) il beneficio è modesto. Pattern mattina/pomeriggio comunque confermato e utile per interpretare i dati, solo non per correggere
- Distinzione slot mattina/pomeriggio nel bias: **vedi sopra, scartata per ora**

---

## Regole architetturali

- **Backup esplicito** prima di modifiche complesse alla mappa
- **Una modifica alla volta**, testata prima di procedere
- **engine.txt**: zero caratteri non-ASCII, `node --check` obbligatorio prima del deploy
- **Zip**: directory pulita, un file per zip, `unzip -l` per verifica contenuto, nome file convenzione `nomefile-vXXXX.zip`
- **Eccezione — consolidamento dei tre .md**: quando si aggiornano insieme CLAUDE.md, METODOLOGIA.md e ROADMAP.md (fine sessione o momento di consolidamento), impacchettarli **insieme** in un solo zip con nome `mdGGMMAA.zip` (data del giorno, es. `md010826.zip` per il 1° agosto 2026) — invece dei tre zip separati. Comodo per caricare tutto in un colpo su github.dev
- **Versioning — punti da aggiornare insieme a ogni rilascio** (se se ne dimentica uno, a video resta la versione vecchia dopo il deploy):
  - `engine.js` (**4 punti**): header riga 1 · campo `v:'...'` nella risposta `action=ping` (**la home legge questo**) · stringa `engine:'nautilus-engine vX.Y.Z'` a fondo file · commento di chiusura
  - `index.html` (**4 punti**): header riga 3 · riga ~603 (a video, home) · riga ~2014 (a video, diagnostica) · commento di chiusura
  - `mappa.html` (**5 punti**): header riga 1 · `<title>` (~11) · `span#nav-ver` (~240) · footer `div#footer` (~306) · commento identificativo (~310). **Non toccare** i commenti `fix v1.6.82` sparsi nel codice: sono storici
  - `mappa2.html` (**5 punti**, stessa struttura di mappa.html): header riga 1 · `<title>` · `span#nav-ver` · footer `div#footer` · commento di chiusura
  - `previsioni.html` (**4 punti**): commento riga 1 · `<title>` · `span.ver` nell'header · commento di chiusura
  - pagine cruscotto (**3 punti**): commento riga 1 · `<title>` · versione a video nell'header
- **Versione nel nome del file**: obbligatoria e progressiva — `METODOLOGIA-v1.4.md`, `engine-v21409.zip`, `index-v5739.zip`, `mappa-v1687.zip`, `decadimento-v12.zip`. Il numero nel nome **deve coincidere** con quello dentro il file. Un numero **non si riusa mai**, nemmeno se la build è stata scartata prima del deploy (caso reale: v2.14.7 buttata → la successiva è stata numerata v2.14.8)
- **predict_history**: limite 30 voci, campo `slot` morning/afternoon
- **migrate_history**: solo se chiave non esiste (check EXISTS Redis) — non sovrascrive mai
- **forecast_stats**: non scrive mai in Redis, solo lettura
- **Nuove stazioni**: aggiornare in parallelo `swStations`/`scrape_web2`, `srAllStations` in station_refresh, `allStations` in biasLoadHistory, bottoni statici HTML in index.html (×2: Meteo + Engine)
- **Visualizzazioni**: vanno in moduli separati (stats.html, mae.html), non in index.html
- **Verifica post-fix**: dopo modifiche a logiche di calcolo (es. applyOI), confrontare vecchia/nuova logica con script di simulazione in console usando dati reali già caricati, prima del deploy — pattern usato con successo per il fix v1.6.54

---

## File da NON modificare senza contesto completo

- Blocco `ZONES` in engine.txt (righe ~23-210): definisce tutte le 23 zone con lat/lon/ports/bias_station
- Funzione `biasComputeStations`: lista fissa di 25 stazioni, aggiornare se si aggiungono stazioni
- Array `srAllStations` in `action=station_refresh`: lista fissa, aggiornare in parallelo a nuove stazioni
- Bottoni statici HTML in index.html righe ~1080-1120 e ~2110-2120: lista "Stazioni Reali vs OM" hardcoded
- Funzione `applyOI` in mappa.html: logica sensibile, testare sempre con script di confronto old/new su dati reali prima del deploy (vedi fix v1.6.54)
- **Interpolazione bilineare dello sfondo colorato** (`previsioni.html`, `mappa2.html`): assume che i punti griglia arrivino **tutti** (nessuno scartato da `action=grid`) per ricostruire correttamente righe/colonne della griglia regolare. In `mappa2.html` dipende anche dal flag `isStationPoint` (già esistente, impostato in `applyStationOverrideToExtraPoints`) per escludere i punti extra (`GRID_EXTRA_POINTS`) dalla griglia regolare — se quel flag cambia nome o smette di essere impostato, la bilineare si disallinea silenziosamente

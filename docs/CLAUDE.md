# NAUTILUS — Contesto Sessione (CLAUDE.md)


## PUNTO DI RIPRESA — 2026-07-27

**Versioni in produzione**: engine **v2.14.9** · index **v5.7.39** · mappa **v1.6.87**
**Pronto ma NON deployato**: engine **v2.14.9** (taglio chiamata AI su `action=situazione`)

### Fase attuale: raccolta dati e verifica numerica

Il progetto è in una fase in cui servono **numeri consistenti**, non testo descrittivo. Il testo AI è stato tagliato in entrambi i punti dove veniva generato (dettagli e istruzioni di riattivazione in METODOLOGIA sezione 12):
- `predict` → nel system prompt le righe `CONFIDENZA`/`PATTERN`/`CONSIGLIO` sono **commentate**; l'AI restituisce solo i numeri `H+N: X kn da DIR`. È il motivo per cui la sezione "Previsione Locale AI" nell'app appare senza testo pur avendo i numeri.
- `situazione` → dal 27/07 non chiama più l'AI (engine v2.14.9): salva un record minimale con dati e alert già calcolati in JS.

Da riattivare entrambi quando lo storico sarà maturo.

### Principi consolidati a luglio 2026 (valgono su tutto il sistema)

1. **Solo dati reali nelle statistiche.** Le verifiche usano esclusivamente `wind_source='cfr'` (o fonte reale); la visualizzazione mostra sempre un numero ma se è modello lo scrive in **rosso**. Mai un valore OM spacciato per osservazione.
2. **"Dati assenti", non tasto nascosto né ripiego geografico.** Quando una stazione tace: la voce **resta visibile**, mostra l'ultimo dato con la sua **età** ("6 kn NW · 54h fa"), e quel dato **non entra nei calcoli** (scartato oltre 45 min). Mai sostituire con una stazione vicina — il ripiego geografico è una bugia anche quando il dato sostituto è vero.
3. **I dati di fonti esterne non si manipolano.** Se un valore OM sembra implausibile (caso Capraia, pressione 978 hPa), va **segnalato come sospetto**, non corretto silenziosamente per farlo sembrare plausibile.
4. **Esporre l'ipotesi e concordare prima di scrivere codice.** Vale soprattutto quando si tocca il trattamento di dati esterni o logiche di calcolo. Non presentare modifiche già fatte come fatto compiuto.
5. **Attenzione ai fallback taciti.** Ogni `||` con un valore di comodo su un campo che rappresenta la realtà è un sospetto (`|| 0`, `|| 15`, `|| 1013`).

### Lavoro svolto in luglio 2026 (sintesi)

- **Audit incrociato (11/07)**: sei bug critici corretti (A1-A6), engine da v2.13.x a v2.14.0
- **Reset storico (04/07)**: `reset_history_all` su tutte le 26 zone — i dati di verifica partono da quella data
- **Livorno risolto (13/07)**: `livorno_cfr` era un **mareografo** (misura marea, non vento) → sostituito con **`livorno_porto`**, stazione Windfinder (spot `it2005`, 43.5525N 10.3014E, quota zero, source `mnw_web`), promossa a `bias_station` della zona. Da tenere sotto osservazione: segna meno di altri siti, forse poco esposta nel bacino portuale.
- **Quercianella = Calignaia**: stessa stazione fisica, due nomi (43.465/10.347, 40m, MNW `tsc265`). Non è alternativa per Livorno Porto.
- **Bussole (14-15/07)**: risolta race condition per cui le bussole singole restavano rosse (OM) anche con stazioni vive. Ora leggono il dato **già salvato** (`bias_history`, istantaneo) invece di `station_refresh` (scraping live 2-3s). `triple_wind` accetta **tutte** le fonti reali, non solo `cfr`.
- **Decadimento previsioni (15/07)**: nuovo cruscotto `decadimento.html`. Scoperta controintuitiva: in regime di bonaccia **la previsione non decade** con la distanza (MAE +12h più basso di +1h). Inoltre le previsioni del **pomeriggio sono più accurate** di quelle del mattino.
- **Piombino (19-20/07)**: `tsc228` (MeteoNetwork) risponde `200 ok` ma **senza campo vento** — stazione online che non trasmette più anemometria. Confermato dalla Livemap ufficiale. Stesso sintomo su `tsc578` (Capraia). Nessun bug nostro.
- **Bug cache mappa (22/07)**: `fetchZoneData` era l'unica fetch senza `cache:'no-store'` → i popup marker mostravano snapshot vecchi di ore. Risolto in mappa v1.6.87.
- **Analisi accuratezza (25/07)**: il peggioramento è **reale** (MAE Viareggio da ~2.0 a ~3.0 kn). Ipotesi pressione testata e **scartata**. Causa più probabile: `applyBias()` usa un unico bias medio storico, tarato su un regime calmo, che non si adatta quando il vento si fa più forte e variabile.
- **Costi AI (27/07)**: mappata l'architettura dei costi, tagliato il testo di `situazione`.

### Problemi aperti prioritari

| Problema | Stato |
|---|---|
| **Populonia — staccare dal canale di Piombino** | Da fare. È a quota 164m sul promontorio, non può rappresentare il vento del canale a livello mare. Va rimossa come `bias_station` di `canale_piombino`, **non corretta con fattore di quota** |
| **Populonia — coordinate sbagliate** | Da fare. Usa lat 42.987731 lon 10.537734 (righe engine ~29, ~2167, ~2170, ~2330, ~2601) ma risulta troppo a **est** rispetto alla Livemap ufficiale. Coordinata vera da `meteonetwork.eu/it/weather-station/tsc539-stazione-meteorologica-di-populonia`. Da chiarire: `populonia_cfr` ha codice CFR `TOS03002300` ma l'URL punta a `tsc539` (MNW) — stessa stazione o due diverse? |
| **tsc228 (Piombino) e tsc578 (Capraia) mute** | Attesa. Verificare periodicamente con `action=mnw_test&k=mdi`. Quando `tsc228` torna, valutare di farla `bias_station` del canale al posto di Populonia |
| **Bias non stratificato per condizione** | Rafforzato dall'analisi del 25/07. Serve giudizio di affidabilità per **orizzonte × slot × fascia di intensità del vento** |
| **`action=history` tronca lo storico** | Il 25/07 restituiva 136 ore anche chiedendone 240. Prerequisito per analisi su finestre lunghe e per il sistema di sintesi |
| **Dato OM sospetto su Capraia** | Aperto, nessuna azione. Pressione 978 hPa e direzione opposta all'avviso marittimo. Non manipolare |

### Note operative sulla collaborazione

- **Gli allegati `document` da iPad arrivano vuoti** — il testo va **incollato direttamente in chat**, non allegato. Vale per JSON diagnostici e output URL.
- **Sessioni lunghe**: la quota si consuma più in fretta con Opus e con conversazioni lunghe (ogni turno rielabora la cronologia). Per sessioni di manutenzione conviene **Sonnet 5**; Opus per problemi diagnostici ambigui, in sessioni brevi e mirate.
- **Il filesystem di lavoro si resetta tra sessioni** — ricaricare engine, index, mappa correnti a ogni ripresa.

---

Documento di contesto persistente per sessioni di lavoro con Claude.
Aggiornato: 2026-07-27 | Versioni riferimento: engine v2.14.8 · index v5.7.39 · mappa v1.6.87

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
| `api/engine.js` | **v2.14.8** | Engine principale. v2.14.9 pronta ma non deployata (taglio AI su `situazione`) |
| `index.html` | **v5.7.39** | App principale. Stazioni mute mostrano ultimo dato + età |
| `mappa.html` | **v1.6.87** | Mappa vento. Fix cache `fetchZoneData` (v1.6.87, 22/07) |
| `index2.html` | v1.2 | **Cruscotto**: indice strumenti + stato engine live |
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
| `bias_samples:<id>` | Array fino a 100 campioni: `{ts, station, om, arome, delta, delta_arome}` |
| `predict_history:<zona>` | Storico previsioni AI con actual_Nh popolati a posteriori |
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

- Vada e Bonifacio/Cap Pertusato: dati inaffidabili, in osservazione da >4 settimane. Decisione rinviata.
- **Populonia CFR**: è fisicamente a **164m sul promontorio** (non è un errore di codifica). Il problema è che **non può rappresentare il canale di Piombino** a livello mare: va staccata come `bias_station`, non corretta con un fattore di quota. In più le coordinate usate risultano spostate a est rispetto alla posizione reale — vedi PUNTO DI RIPRESA
- Giglio, Montecristo, Gorgona: timeout `situazione` occasionale per fetch OWM/ICON lenti su isole remote
- Bias injection AI: non confermato che il modello applichi effettivamente la correzione nel prompt — da verificare con `predict_log` strutturato
- **Direzione OI instabile su celle con stazione a vento debole (<2kn)** — classe di problema, vedi PUNTO DI RIPRESA. Casi osservati: Viareggio, Populonia. Soluzione proposta ma rinviata (soglia minima vento).
- **Flusso animato non rispecchia le grid_rules puntuali** — limitazione strutturale, da trattare con Roadmap 5.1

---

## Bug aperti / problemi noti

| Bug | File | Stato | Note |
|---|---|---|---|
| Timeout `action=situazione` su isole remote | engine.txt | Aperto | Giglio, Montecristo, Gorgona: fetch lente causano timeout occasionale — fix: timeout esplicito 5-8s |
| Porto Pollo coordinata in mare | index.html + mappa.html | Aperto | Coordinata 41.2875052, 9.2243077 cade nello stretto invece che sulla spiaggia — errore fonte Google Maps |
| Bias injection AI non verificata per Barcaggio | engine.txt | Aperto | Non confermato che bias_station venga effettivamente applicata nel prompt per le nuove stazioni |
| `lamma_bias` non integrato in predict | engine.txt | Aperto | action=lamma_bias_get esiste come monitoring ma non iniettato nel prompt AI |
| Populonia quota 164m errata | engine.txt / index.html | Aperto | È una stazione marina, dovrebbe essere 0m — badge rosso quota in UI |
| Livorno CFR è un mareografo | — | ✅ Risolto 13/07 | Sostituito da `livorno_porto` (Windfinder `it2005`) come `bias_station` della zona |
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
- Metodo calcolo: media semplice su tutti i campioni (no decadimento esponenziale per ora)
- Decadimento esponenziale λ=0.85: da valutare dopo 20-30 campioni per zona
- Distinzione slot mattina/pomeriggio nel bias: da valutare dopo accumulo dati

---

## Regole architetturali

- **Backup esplicito** prima di modifiche complesse alla mappa
- **Una modifica alla volta**, testata prima di procedere
- **engine.txt**: zero caratteri non-ASCII, `node --check` obbligatorio prima del deploy
- **Zip**: directory pulita, un file per zip, `unzip -l` per verifica contenuto, nome file convenzione `nomefile-vXXXX.zip`
- **Versioning — punti da aggiornare insieme a ogni rilascio** (se se ne dimentica uno, a video resta la versione vecchia dopo il deploy):
  - `engine.js` (**4 punti**): header riga 1 · campo `v:'...'` nella risposta `action=ping` (**la home legge questo**) · stringa `engine:'nautilus-engine vX.Y.Z'` a fondo file · commento di chiusura
  - `index.html` (**4 punti**): header riga 3 · riga ~603 (a video, home) · riga ~2014 (a video, diagnostica) · commento di chiusura
  - `mappa.html` (**5 punti**): header riga 1 · `<title>` (~11) · `span#nav-ver` (~240) · footer `div#footer` (~306) · commento identificativo (~310). **Non toccare** i commenti `fix v1.6.82` sparsi nel codice: sono storici
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

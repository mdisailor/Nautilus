# NAUTILUS — Contesto Sessione (CLAUDE.md)


## PUNTO DI RIPRESA — 2026-07-01

**Versioni in produzione**: engine v2.13.42, mappa v1.6.53

**grid_rules attive** (10 regole, inizializzare con `action=grid_rules_init&k=mdi`):
- San Vincenzo: 43.25_10.65, 43.00_10.40, 43.25_10.40 → solo svincenzo_porto
- Populonia: 43.00_10.65 → solo populonia_cfr
- Viareggio: 43.75_10.15, 44.00_10.15 → solo viareggio_cfr
- Gorgona: 43.50_9.90 → solo gorgona_cfr ✅ funziona
- Capraia: 43.00_9.90, 43.00_9.65 → capraia_cfr/mnw ✅ funziona
- Follonica: 42.75_10.65 → excluded_stations follonica

**Problema aperto urgente**: Bocca d'Arno (43.75_10.15) — la grid_rule assegna viareggio_cfr ma OI usa ancora bocca_arno_cfr come riferimento. Causa probabile: viareggio_cfr non ha dato valido in quel momento → contributions vuoto dopo filtro → OM puro. Verificare popup Viareggio CFR e aumentare min_weight se necessario.

**Prossimi passi immediati**:
1. Verificare Viareggio CFR dato valido e correggere Bocca d'Arno
2. Aggiungere esclusione canale_piombino per celle San Vincenzo
3. Risolvere punta_ala (zona senza stazione reale)
4. Raccogliere fogli Excel con vento più sostenuto (8-15kt)
5. Integrare AROME come campo base (base_model in grid_rules)


Documento di contesto persistente per sessioni di lavoro con Claude.
Aggiornato: 2026-06-29 | Versione riferimento: engine v2.13.33

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

---

## Stack tecnico

| Componente | Dettaglio |
|---|---|
| Hosting | Vercel (piano Hobby, maxDuration ~10s per funzione) |
| Database | Upstash Redis (KV) |
| Meteo primario | Open-Meteo (`/v1/forecast`, best_match ~9km) |
| Meteo secondario | Open-Meteo MeteoFrance (`/v1/meteofrance`, AROME 2.5km) |
| Stazioni reali | MeteoNetwork API (token Bearer), CFR Toscana (scraping HTML), Windfinder `/report/` (scraping JSON embedded), Meteosystem (scraping HTML) |
| AI | Anthropic Claude Sonnet (via API, `action=situazione` e `action=predict`) |
| Cron | cron-job.org (esterno) |
| IDE remoto | github.dev (VS Code browser, da iPad) |

---

## Versioni file in produzione

| File | Versione | Note |
|---|---|---|
| `api/engine.js` | v2.13.42 | Engine principale, tutte le action |
| `public/index.html` | v5.7.27 | App principale (meteo, engine, bias) |
| `public/mappa.html` | v1.6.53 | Mappa vento con stazioni e griglia |
| `public/stats.html` | v1.18 | Accuratezza previsioni AI |
| `public/mae.html` | v1.10 | Comparazione MAE OM vs AROME + osservazioni manuali |
| `public/score.html` | v1.6 | Cruscotto model score per condizione (strumento validazione temporaneo) |
| `public/simulator.html` | v1.8 | Simulatore decisioni — 3 punti pilota (Gorgona, Bocca Arno, Viareggio) |

---

## Zone attive

### Zone con predict/situazione AI (cron orario)
19 zone toscane storiche + Barcaggio = **20 zone totali**

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

---

## Stazioni reali attive (bias_samples)

### MeteoNetwork API
`livorno`, `canale_piombino`, `elba_nord`, `viareggio`

### CFR Toscana (scraping)
`gorgona_cfr`, `capraia_cfr`, `giglio_porto`, `giglio_castello`, `montecristo`, `portoferraio_cfr`, `orbetello`, `svincenzo_porto`, `casotto_pescatori`, `venturina`, `forte_dei_marmi`, `lido_camaiore`, `bocca_arno_cfr`, `follonica`, `capalbio`

### MeteoNetwork Web (scraping)
`bocca_arno`, `capraia_w`, `populonia`, `portoferraio`, `alberese`, `luri`

### Windfinder /report/ (scraping JSON embedded)
`barcaggio`, `bonifacio_pertusato`

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
- **OI (Optimal Interpolation) implementato** — mappa v1.6.34. Toggle ON/OFF. Raggio 60km, IDW 1/d² × reliability_weight. Bias storico stratificato da bias_matrix. Correzione velocità ±5kt, direzione via U/V cap ±30°. Logica diretta: punto griglia entro 5km da stazione usa valore stazione direttamente (Opzione A). Stazioni escluse: bonifacio_mnw, vada_mnw (fix bug chiavi errate in v1.6.42). Nuova logica sostituzione progressiva: stazione sostituisce OM con peso (1-d/40)² × reliability. grid_rules per celle specifiche: allowed_stations, excluded_stations, min_weight. Regole attive: San Vincenzo (43.00/43.25 area), Populonia, Viareggio, Follonica. Chiave Redis: grid_rules. Init: action=grid_rules_init&k=mdi. Logica diretta: punto griglia entro 5km usa valore stazione direttamente. Export griglia Excel: bottone 📊 XLS genera 4 fogli (OM, OI, Delta, Stazioni) per analisi pattern correzioni. Toggle ON/OFF bottone OI. Raggio 60km, IDW peso 1/d² × reliability_weight. Bias storico stratificato da `action=bias_matrix` (fascia velocità × settore × slot orario). Correzione velocità ±5kt cap. Correzione direzione via componenti U/V, cap ±30°. Stazioni escluse: `bonifacio_pertusato`, `vada`.
- **Osservazioni manuali** — mappa v1.6.32 + engine v2.13.28. Bottone arancione in ogni popup punto giallo. Form: velocità, direzione, pin (1-8 char), data/ora modificabile, nota. Salva in `obs_manual` Redis (max 200). Marker arancioni sulla mappa con colore per età. Pin non ancora validati — lista autorizzati da aggiungere in futuro con chiave `obs_pins_authorized` in Redis.

---

## Problemi aperti / in osservazione

- Vada e Bonifacio/Cap Pertusato: dati inaffidabili, in osservazione da >4 settimane. Decisione rinviata.
- Populonia CFR: altitudine codificata come 164m invece di 0m (stazione marina) — bias non affidabile per navigazione, badge rosso quota in UI
- Giglio, Montecristo, Gorgona: timeout `situazione` occasionale per fetch OWM/ICON lenti su isole remote
- Bias injection AI: non confermato che il modello applichi effettivamente la correzione nel prompt — da verificare con `predict_log` strutturato

---

## Bug aperti / problemi noti

| Bug | File | Stato | Note |
|---|---|---|---|
| Timeout `action=situazione` su isole remote | engine.txt | Aperto | Giglio, Montecristo, Gorgona: fetch lente causano timeout occasionale — fix: timeout esplicito 5-8s |
| Porto Pollo coordinata in mare | index.html + mappa.html | Aperto | Coordinata 41.2875052, 9.2243077 cade nello stretto invece che sulla spiaggia — errore fonte Google Maps |
| Bias injection AI non verificata per Barcaggio | engine.txt | Aperto | Non confermato che bias_station venga effettivamente applicata nel prompt per le nuove stazioni |
| `lamma_bias` non integrato in predict | engine.txt | Aperto | action=lamma_bias_get esiste come monitoring ma non iniettato nel prompt AI |
| Populonia quota 164m errata | engine.txt / index.html | Aperto | È una stazione marina, dovrebbe essere 0m — badge rosso quota in UI |
| Livorno CFR da rinominare | index.html | Aperto | È un mareografo, non una stazione vento — il nome inganna |
| `action=debug_fs` da rimuovere | engine.txt | Aperto | Action di debug per Livorno, non serve in produzione — rischio sicurezza |
| Subtitle stats.html versione engine hardcoded | stats.html | Aperto | Da aggiornare manualmente ad ogni release engine |
| Mappa layer colore WebGL inguardabile oltre Z10 | mappa.html | Aperto | 5 fix pendenti: (1) viewport +400px per punti fuori schermo, (2) isNaN check punti (Marina di Pisa causa buchi), (3) kernel gaussiano invece IDW puro, (4) limite 60 punti vicini al centro, (5) texture size adattiva per zoom |
| Cron backfill 14:35 e 22:35 mancanti | cron-job.org | Aperto | H+1 pomeridiano (14:35) e H+9 pomeridiano (22:35) non ancora configurati |
| OI_EXCLUDED usava sid invece di key (bonifacio_pertusato/vada invece di bonifacio_mnw/vada_mnw) | mappa.html | ✅ Risolto v1.6.42 |
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
- **Zip**: directory pulita, un file per zip, `unzip -l` per verifica contenuto
- **predict_history**: limite 30 voci, campo `slot` morning/afternoon
- **migrate_history**: solo se chiave non esiste (check EXISTS Redis) — non sovrascrive mai
- **forecast_stats**: non scrive mai in Redis, solo lettura
- **Nuove stazioni**: aggiornare in parallelo `swStations`/`scrape_web2`, `srAllStations` in station_refresh, `allStations` in biasLoadHistory, bottoni statici HTML in index.html (×2: Meteo + Engine)
- **Visualizzazioni**: vanno in moduli separati (stats.html, mae.html), non in index.html

---

## File da NON modificare senza contesto completo

- Blocco `ZONES` in engine.txt (righe ~23-210): definisce tutte le 23 zone con lat/lon/ports/bias_station
- Funzione `biasComputeStations`: lista fissa di 25 stazioni, aggiornare se si aggiungono stazioni
- Array `srAllStations` in `action=station_refresh`: lista fissa, aggiornare in parallelo a nuove stazioni
- Bottoni statici HTML in index.html righe ~1080-1120 e ~2110-2120: lista "Stazioni Reali vs OM" hardcoded

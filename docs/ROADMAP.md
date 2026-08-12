# NAUTILUS — Roadmap Attività (ROADMAP.md)

Scaletta ordinata con dipendenze, stato e decisioni aperte.
Aggiornato: 2026-08-12

---

## Legenda stato
- ✅ Completato
- 🔄 In corso / parziale
- ⏳ Pronto per iniziare (dipendenze soddisfatte)
- 🔒 Bloccato (dipendenze non soddisfatte)
- ❓ Decisione aperta

---

## Fase 1 — Raccolta dati e infrastruttura base ✅

| # | Attività | Stato | Note |
|---|---|---|---|
| 1.1 | Stack Vercel + Redis + Open-Meteo | ✅ | Operativo |
| 1.2 | 19 zone toscane con predict/situazione AI | ✅ | Cron orario attivo |
| 1.3 | CFR Toscana scraping (15 stazioni) | ✅ | scrape_cfr ogni 30min |
| 1.4 | MeteoNetwork API (4 stazioni) | ✅ | scrape_stations ogni 30min |
| 1.5 | MeteoNetwork Web scraping (6 stazioni) | ✅ | scrape_web ogni 30min, sequenziale |
| 1.6 | AROME raccolta parallela in bias_samples | ✅ | campo arome + delta_arome da 16 giu 2026 |
| 1.7 | backfill_actuals (7 cron/giorno) | ✅ | actual_3h/6h/12h in predict_history |
| 1.8 | Stazioni Corsica/Sardegna (Windfinder + Meteosystem) | ✅ | scrape_web2 ogni 30min, parallelo |
| 1.9 | Predict AI per Barcaggio | ✅ | Cron orario attivo dal 2026-06-19 |

---

## Fase 2 — Analisi qualità dati 🔄

| # | Attività | Stato | Note |
|---|---|---|---|
| 2.1 | Web app MAE compare (OM vs AROME per stazione) | ✅ | mae.html v1.10 deployata |
| 2.2 | Valutazione affidabilità Vada e Cap Pertusato | 🔄 | In osservazione da >4 settimane. Decisione rinviata |
| 2.3 | Stratificazione MAE per fascia velocità × settore | ⏳ **priorità alzata** | **Rafforzato dall'analisi del 25/07**: il peggioramento di accuratezza è coerente con un bias medio non stratificato, tarato su regime calmo. Serve prima più storico con vento sostenuto |
| 2.4 | MAE per ora del giorno | ✅ parziale | `decadimento.html` v1.2 confronta **mattina vs pomeriggio** per orizzonte. Scoperto: il pomeriggio è più accurato (la brezza è già misurata, non va indovinato l'innesco) |
| 2.5 | Trend MAE nel tempo (settimanale) | ✅ | `forecast_stats` restituisce `weekly_mae` + `trend`. **Attenzione**: il calcolo del trend include settimane con pochissimi campioni (N=2), che falsano il giudizio — da correggere |
| 2.6 | Decisione finale su Vada e Cap Pertusato | ❓ **scaduto** | Target era fine luglio 2026: **è ora di decidere** |
| 2.7 | Ricerca fonte alternativa per Bonifacio | ❓ | Météo-France verificata ma API con registrazione; Windfinder /report/ unica opzione trovata finora |

---

## Fase 2-bis — Qualità e onestà dei dati stazione (luglio 2026) 🔄

Emersa non come fase pianificata ma dal lavoro di audit. Ha prodotto i principi ora in METODOLOGIA sez. 9.

| # | Attività | Stato | Note |
|---|---|---|---|
| 2b.1 | Principio "solo dati reali" nelle statistiche | ✅ | Verifiche e backfill accettano solo `wind_source='cfr'`. Vento OM mostrato in **rosso** nelle UI |
| 2b.2 | Livorno: mareografo → stazione vera | ✅ | `livorno_cfr` misurava marea, non vento. Sostituito con `livorno_porto` (Windfinder `it2005`), engine v2.14.5 |
| 2b.3 | Principio "dati assenti" per stazioni mute | ✅ | La voce resta visibile con ultimo dato + età; mai nascondere il tasto, mai ripiego su stazione vicina. App v5.7.39 + engine v2.14.8 |
| 2b.4 | Fix race condition bussole singole | ✅ | Leggono il dato già salvato (`bias_history`) invece di scraping live. App v5.7.36-39 |
| 2b.5 | **Populonia: staccare da canale_piombino** | ⏳ **da fare** | Quota 164m sul promontorio, non rappresenta il canale a livello mare. Rimuovere come `bias_station`, **non** correggere con fattore di quota |
| 2b.6 | **Populonia: correggere coordinate** | ⏳ **da fare** | Posizione usata troppo a est rispetto alla Livemap ufficiale. Chiarire anche se `populonia_cfr` (CFR `TOS03002300`) e `tsc539` (MNW) sono la stessa stazione |
| 2b.7 | Stazioni mute `tsc228` / `tsc578` | 🔄 attesa | Online ma senza campo vento. Verificare con `action=mnw_test&k=mdi`. Quando `tsc228` torna: valutarla come `bias_station` del canale al posto di Populonia |
| 2b.8 | Dato OM sospetto su Capraia | ❓ aperto | Pressione 978 hPa e direzione opposta all'avviso marittimo. **Non manipolare** il dato: semmai segnalarlo come sospetto |

---

## Fase 3 — Griglia ibrida (vento attuale) 🔄

| # | Attività | Stato | Note |
|---|---|---|---|
| 3.1 | Definizione bbox e passo griglia | ✅ | 40-44.6N / 7.4-12.5E, passo 0.25° — operativo |
| 3.2 | Fetch OM/AROME per tutti i punti griglia | 🔄 | Proxy Vercel implementato per OM; AROME come base_model non ancora integrato |
| 3.3 | Scelta campo di background per zona | ⏳ | Dipende da 2.3: AROME su isole piccole, OM su costa. Campo `base_model` in grid_rules già previsto, non implementato. **Aggiornamento 12/8**: l'analisi su tutte le 25 stazioni mostra AROME vincente in 9/25 (non solo Alberese) — vedi Fase 6.8 per il disegno di un selettore dinamico invece di una scelta fissa per zona |
| 3.4 | Implementazione OI (Optimal Interpolation) | ✅ | mappa v1.6.42 — sostituzione progressiva per distanza, grid_rules per celle specifiche |
| 3.5 | Kriging con peso MAE stazione | ✅ | reliability_weight = 1/(1+MAE) nel peso IDW |
| 3.6 | Correzione direzione in OI | ✅ | Componenti U/V — **fix v1.6.54 (2026-07-01): vettori normalizzati a modulo 1, peso nominale puro invece di peso×velocità. Risolve bug per cui stazioni a vento debole perdevano il controllo della direzione nonostante min_weight alto** |
| 3.6b | Score system (compute_scores) | ✅ | engine v2.13.33 — matrix by_om + matrix_by_station, cron ogni ora :45 |
| 3.6c | Simulatore decisioni | ✅ | simulator.html v1.8 — 3 punti pilota, tabella 6 passaggi, griglie mattina+pomeriggio |
| 3.7 | Validazione griglia vs stazioni reali | 🔄 | In corso — 10 grid_rules attive e verificate coerenti (2026-07-01). Emerso pattern: direzione instabile su stazioni a vento <2kn (Viareggio, Populonia), soglia minima da tarare con più casi |
| 3.8 | Guard NaN su frecce/campo vettoriale | ✅ | mappa v1.6.55 (2026-07-01) — punto griglia con dir/speed NaN causava frecce fantasma orientate a nord e contaminazione per contagio del flusso animato vicino |
| 3.9 | Soglia minima vento per peso direzione OI | ❓ | Proposta ma rinviata — attendere più casi (Viareggio, Populonia già osservati) prima di tarare la soglia. Riferimento: soglia rotationMinWind=5 già usata in engine.js per lo stesso motivo |
| 3.10 | Coerenza flusso animato con grid_rules | ✅ | mappa v1.6.56 — boost peso 15 per celle con grid_rule nella IDW, decadimento naturale 1/d². Caso test San Vincenzo (N vs Ovest-Est): risolto |

---

## Fase 4 — Griglia previsioni (prototipo esterno costruito, integrazione OI ancora non iniziata) 🔒

| # | Attività | Stato | Note |
|---|---|---|---|
| 4.0 | Prototipo esterno: `previsioni.html` | ✅ fatto (1/8) | Griglia OM estesa a tutte le 12 ore future (`action=grid`, engine v2.14.11-12), bottoni a ore intere, nostra previsione (5 orizzonti) sovrapposta dove disponibile. **Non è ancora l'integrazione con l'OI** — è un livello più semplice, costruito apposta fuori da mappa.html per poter sperimentare senza rischio |
| 4.1 | Estensione **OI** (non solo OM) a H+3, H+6, H+12 | 🔒 | Dipende da Fase 3 completata. Il prototipo 4.0 non applica l'OI alle ore future, solo alla zona vs OM puro |
| 4.2 | Integrazione con predict_history come bias correttivo | 🔒 | Dipende da 4.1 |
| 4.3 | Validazione previsioni griglia vs predict AI per zona | 🔒 | Dipende da 4.2 |

**Analisi di fattibilità (25/07)** — l'architettura è quasi tutta presente (griglia OM, bias per zona, interpolazione spaziale). Punti chiariti:
- L'OI **non si può applicare a una previsione**: confronta OM con le stazioni *adesso*, ma alle 18 di stasera nessuna stazione ha ancora misurato. Quello che si può applicare è il **bias appreso** (statistico, dallo storico), interpolato sulla griglia futura.
- La fascia di condizione va scelta su **quello che OM prevede per quell'ora**, non sul vento attuale — la matrice esistente classifica già così.
- **Limiti da mettere in conto**: ~60% delle celle è vuoto (mancano dati con vento sostenuto); la verifica è possibile solo dove c'è una stazione; l'errore atteso è più alto della mappa del presente perché si interpola un'aspettativa statistica invece di un fatto misurato.
- Il pavimento di errore è la **dispersione irriducibile** (~1 kn in bonaccia, presumibilmente 2-3 kn con vento forte): correggendo il bias si scende *verso* la std, non sotto.

**Nota 1/8**: il modello "due orologi" del prototipo 4.0 (OM sempre relativo ad adesso, nostra previsione sempre relativa all'ultimo predict, i due non necessariamente sincronizzati) andrà ripensato quando si integra l'OI — l'OI oggi lavora solo sul presente, non ha un concetto di "due orologi".

---

## Fase 5 — Funzionalità future (backlog)

| # | Attività | Priorità | Note |
|---|---|---|---|
| 5.1 | Mappa vento animata (Windy-style, esri wind-js) + evoluzione temporale | ✅ fatto (1/8, affinato 12/8), parzialmente | Sfondo colorato continuo + flusso animato realizzati con tecnica diversa da quella pianificata (interpolazione bilineare sulla griglia regolare, non esri wind-js) — vedi METODOLOGIA sezione 13. Presente e funzionante su `previsioni.html` (con evoluzione oraria) e `mappa2.html` (solo presente, sperimentale). **12/8**: aggiunto tasto GRID on/off su entrambe (nasconde solo la griglia generica, non le frecce zona/stazione), opacità allineata tra le due pagine, tolta la legenda ridondante su previsioni.html. **Non ancora su `mappa.html` produzione** — decisione di "promozione" mappa2→mappa ancora da prendere |
| 5.2 | Bias adattivo per zona (predict_bias:zona in KV) | ✅ implementato | `predict_bias:zona` attivo, iniettato nel prompt. Due bug di segno corretti a luglio (prompt e `applyBias()` usavano `OM - bias` invece di `OM + bias`). **TODO residuo**: aggiungere gli ultimi 5 errori con contesto meteo al prompt |
| 5.3 | Clustering errori per condizione sinottica (A/B/C/D) | Media | KV: predict_errors:zona con 10 errori + contesto |
| 5.4 | Rete osservatori distribuiti (sailor network) | Bassa | Visione a lungo termine, richiede UI dedicata |
| 5.5 | Pubblicazione pubblica app | Bassa | Attendere validazione griglia e affidabilità dati |

---

## Fase 6 — Affidabilità stratificata e sintesi (nuova, luglio 2026) 🔒

Nasce da due scoperte di luglio: le previsioni non decadono come ci si aspettava, e l'accuratezza è peggiorata quando è cambiato il regime di vento. Entrambe indicano la stessa cosa: **un unico numero medio per zona non basta**.

| # | Attività | Stato | Note |
|---|---|---|---|
| 6.1 | Semaforo affidabilità basato su **dispersione**, non solo su N | ⏳ | Ogni cella (zona × fascia × settore) salva `{bias, n, std, reliable}`. Doppio uso: semaforo visivo per l'utente + flag letto dall'engine per **saltare la correzione** dove la cella è inaffidabile. Sostituisce il semaforo a solo conteggio oggi in `simulator.html` |
| 6.2 | Affidabilità per **orizzonte × slot** | ⏳ | Dati già disponibili (`decadimento.html` mostra il confronto mattina/pomeriggio). La stessa distanza può essere affidabile alle 13 e non alle 7 |
| 6.3 | Affidabilità per **fascia di intensità del vento** | 🔒 | Dipende da: più storico con vento sostenuto. È la dimensione mancante emersa dall'analisi del 25/07 |
| 6.4 | Filtrare i casi storici simili per **slot** nel prompt | ❓ | Oggi i casi sono scelti per *stessa tendenza barica* senza filtrare l'ora: una previsione delle 07 può ricevere casi delle 16. Due strade: (a) filtrare per slot — più solido ma dimezza i casi disponibili; (b) dichiarare lo slot nel prompt — più debole. Prima verificare quanti casi vengono trovati oggi in media |
| 6.5 | **Sistema di sintesi automatico** | 🔒 | *Non un altro cruscotto*: un controllo che gira col cron e dà un **verdetto secco**. Confronta settimana corrente vs precedente per ogni orizzonte su tutte le zone, **scarta gli outlier isolati** (es. il 17/07 con errore 4× la norma), incrocia col vento reale per distinguere "regime cambiato" da "errore non spiegato", ed esce con "tutto normale" oppure "Zona X orizzonte Y in peggioramento, da controllare". **Non costruirlo ora**: con un solo regime osservato sintetizzerebbe rumore |
| 6.6 | Archivio storico separato oltre la rotazione FIFO | ✅ **fatto (9-12/8)** | `bias_archive`/`predict_archive`, tetto molto più alto (3000/1000 invece di 100/30). Prerequisito per 6.1/6.3/6.5 e per il nuovo 6.8 — **oggi sola scrittura, nessuna action legge ancora da qui per calcolare/correggere** |
| 6.7 | Risolvere il limite di `action=history` | ⏳ **prerequisito** | Il 25/07 restituiva 136 ore anche chiedendone 240. Senza, non si possono fare analisi su finestre lunghe né alimentare 6.5 |
| 6.8 | **Selettore dinamico OM/AROME per cella** (vento×settore×slot) | 🔒 — disegnato (12/8), deliberatamente non scritto | `model_score`/`bias_matrix` calcolano già la matrice ogni ora, ma leggono solo `bias_samples` (~2gg): un n alto in quella finestra è quasi certamente un solo episodio di vento, non diversità di regime. Dati reali del 12/8 mostrano un pattern netto (AROME meglio pomeriggio+settore W, OM meglio mattina, su 3 punti pilota) e che AROME vince oggi in 9/25 stazioni — non solo Alberese. **Riprendere solo quando `bias_archive` (6.6) avrà settimane di giorni/regimi diversi**, verificando di nuovo le statistiche allora — stesso criterio di maturità di 6.5, non prima |

**Quando si capisce che lo storico è "maturo"**: non è una data. Due criteri insieme — (a) il bias calcolato smette di spostarsi molto aggiungendo nuovi campioni; (b) sono stati osservati **più regimi diversi**, idealmente un ciclo completo bonaccia → vento → bonaccia. Oggi il campione è quasi tutto di un solo regime, ed è per questo che i giudizi automatici sono prematuri. **`bias_archive`/`predict_archive` (6.6) sono lo strumento per verificarlo quando arriva il momento** — controllare la diversità di date/regimi lì dentro, non solo la lunghezza dell'array.

---

## Fase 7 — Costi AI 🔄

| # | Attività | Stato | Note |
|---|---|---|---|
| 7.1 | Taglio testo descrittivo in `predict` | ✅ | Righe `CONFIDENZA`/`PATTERN`/`CONSIGLIO` commentate nel system prompt. Output da ~300 a ~80 parole |
| 7.2 | Taglio chiamata AI in `situazione` | ✅ (v2.14.9, **da deployare**) | Salva record minimale con dati e alert già calcolati in JS. Zero costo su questa azione |
| 7.3 | Riattivare il testo quando la fase di raccolta è conclusa | ⏳ | Istruzioni precise in METODOLOGIA sez. 12 |
| 7.4 | Valutare cambio modello | ❓ | Sonnet 5 costa $2/$10 solo fino al **31/08/2026**, poi $3/$15 come Sonnet 4.6 — e col tokenizer più pesante resterebbe leggermente più caro a parità di prompt. Per ora la leva usata è stata tagliare il testo, non cambiare modello |

---

## Decisioni aperte

| ID | Decisione | Contesto | Target |
|---|---|---|---|
| D1 | Declassare Vada a punto giallo? | Direzione sistematicamente opposta a stazioni vicine, sospetto sensore mal orientato | ⚠️ **Target scaduto** (era fine luglio 2026) |
| D2 | Declassare Cap Pertusato a punto giallo? | Windfinder aggiorna raramente, valori fissi per ore, anti-duplicato obs_time attivo | ⚠️ **Target scaduto** (era fine luglio 2026) |
| D3 | Passo griglia per OI: 0.1° o 0.05°? | 0.1° (~11km) è più leggero su Vercel piano Hobby; 0.05° (~5km) più preciso ma rischio timeout. Nota: attualmente in produzione il passo è 0.25° | Da rivalutare |
| D4 | Libreria Kriging: @sakitam-gis/kriging o implementazione custom? | @sakitam-gis è MIT license ma non testata su Vercel Edge; custom più controllabile. Nota: attualmente in uso reliability_weight custom (1/(1+MAE)), non una vera libreria Kriging | Da rivalutare |
| D5 | Soglia minima vento per peso direzione OI (2026-07-01) | Sotto quale velocità stazione la direzione letta è troppo rumorosa per comandare al peso nominale pieno? Casi noti: Viareggio 0.8-1.2kn (Δdir -88°), Populonia 1.4kn (Δdir -103°) | Dopo aver raccolto altri 2-3 casi simili |
| D6 | Come aumentare il dettaglio della griglia? (2026-07-25) | Ridurre il passo globale (0.25°→0.125°) **quadruplica** i punti (~400→~1600) e in passato ha bloccato la mappa: `action=grid` fa **una sola** chiamata OM per batch di 100 coordinate, quindi il collo di bottiglia è il peso della singola risposta e il timeout Vercel. Alternativa già collaudata: **punti extra mirati** in `GRID_EXTRA_POINTS` (28 attivi, nessun problema). Terza via discussa: caricamento progressivo a partire dalla vista corrente o dal punto cliccato | Non urgente — valutare quando serve davvero più dettaglio |
| D7 | Quando riattivare il testo AI? | Tagliato in `predict` e `situazione` per la fase di raccolta dati. Riattivarlo costa (~$18/mese l'insieme, l'output pesa 5× l'input) | Quando lo storico sarà maturo (vedi criteri in Fase 6) |
| D8 | Versione nel nome file vs link raw GitHub | La convenzione `METODOLOGIA-v1.4.md` rompe i link raw fissi usati a inizio sessione. Opzioni: (a) nomi fissi su GitHub, versione solo negli zip di lavoro; (b) versionare anche su GitHub aggiornando i link in CLAUDE.md a ogni rilascio | Da decidere |
| D9 | Promuovere `mappa2.html` a sostituire `mappa.html`? (1/8) | mappa2 ha lo sfondo colorato bilineare (stile Windy) e un'interfaccia più semplice (2 tasti invece di 5). In prova affiancata dal 1/8, nessuna decisione presa. Se promossa, serve un passaggio esplicito (non una sovrascrittura silenziosa) — probabilmente rinominare i file e aggiornare tutti i riferimenti | Dopo un periodo d'uso reale |
| D10 | Sostituire `populonia_cfr` con `canale_piombino` (tsc228) come `bias_station` del canale? (12/8) | tsc228 tornata a trasmettere vento reale dopo settimane muta, confermato stabile su 2 controlli lo stesso giorno. `canale_piombino` (zona) ha oggi il bias peggiore e più persistente di tutte le 25 zone — coerente con l'ipotesi che Populonia (164m) sia il riferimento sbagliato | Dopo 1-2 giorni di stabilità confermata di tsc228 — non decidere su un singolo test |
| D11 | Verificare coordinate/quota di Orbetello e Bonifacio Cap Pertusato (12/8) | `bias_om` coincide esattamente con `mae_om` su 100 campioni per entrambe — firma statistica anomala (errore sempre stesso segno, mai un'eccezione), non tipica di un bias vero. `reliability_weight` già il più basso del sistema per entrambe (0.16 e 0.22) | Prossima sessione utile |

---

## Prossimi passi immediati (aggiornato 12/08/2026)

1. **Verificare stabilità di tsc228** (D10) — se resta stabile 1-2 giorni, sostituire `populonia_cfr` con `canale_piombino` come `bias_station` del canale di Piombino. È il caso più solido di tutti quelli aperti: ora ha sia la diagnosi qualitativa (164m, riferimento sbagliato) sia la controprova numerica (bias peggiore di tutte le 25 zone, sempre stesso segno) sia una stazione alternativa di quota corretta appena tornata viva
2. **Verificare coordinate/quota di Orbetello e Bonifacio Cap Pertusato** (D11) — priorità alta, prima di qualunque altra azione su queste due zone
3. **Non implementare ancora il selettore dinamico OM/AROME per cella** (Fase 6.8) — disegnato, deliberatamente rimandato finché `bias_archive` non avrà settimane di giorni/regimi diversi. **Promemoria esplicito da riverificare**: quando l'archivio sarà più maturo, controllare di nuovo le statistiche (non solo il numero di campioni, la diversità di date dietro quel numero) prima di scrivere codice
4. **Populonia — coordinate sbagliate** (indipendente dal punto 1) — usa lat 42.987731 lon 10.537734 ma risulta troppo a est rispetto alla Livemap ufficiale. Diventa meno urgente se D10 porta a staccare del tutto Populonia dal canale
5. **Aggiornare le liste hardcoded** in `mae_compare`/`bias_matrix`/`score_get` — mancano `populonia_cfr`, `livorno_porto`, `viareggio_cfr` (impatto solo diagnostico)
6. **Decidere su Vada e Cap Pertusato** (D1, D2) — il target era fine luglio, è scaduto
7. **Correggere il calcolo del trend in `forecast_stats`** — oggi include settimane con N=2 che falsano il verdetto "in peggioramento"
8. **Chiarire le 3 zone senza predict** (`lido_camaiore`, `giglio_castello`, `quercianella`) — probabile mancanza nell'elenco del cron su cron-job.org (esterno al codice engine), confermato con dati reali il 12/8. **Non fondamentale adesso**, rivedere più avanti
9. **Risolvere il limite di `action=history`** (6.7) — prerequisito per tutte le analisi su finestre lunghe
10. **Continuare la raccolta dati con vento sostenuto** — è la condizione che sblocca 6.1, 6.3, 6.5 e ora anche 6.8. **Non riprovare** split-bias per slot, decadimento esponenziale, o il selettore AROME dinamico finché lo storico non è molto più ampio
11. Audit sicurezza — giro completo ancora da chiudere
12. `punta_ala`: zona senza stazione reale entro 20km
13. **Decidere su `mappa2.html`** (D9) dopo un periodo d'uso reale affiancato a `mappa.html`

---

## Come caricare i documenti su GitHub

Dal browser su **github.dev** (iPad o desktop):

1. Apri `https://github.dev/<tuo-repo>`
2. Nel pannello file a sinistra, crea una cartella `docs/` se non esiste
3. Trascina i tre file .md nella cartella `docs/` oppure usa File → New File per crearli manualmente
4. Incolla il contenuto di ciascun file
5. Apri il pannello Source Control (icona branch a sinistra)
6. Scrivi un messaggio di commit tipo "Add CLAUDE.md, METODOLOGIA.md, ROADMAP.md"
7. Premi Commit & Push

In alternativa, da terminale locale:
```bash
git add docs/CLAUDE.md docs/METODOLOGIA.md docs/ROADMAP.md
git commit -m "Add project documentation"
git push
```

All'inizio di ogni sessione con Claude, carica i tre file e scrivi "Leggi questi documenti prima di iniziare".

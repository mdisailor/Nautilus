# NAUTILUS — Contesto Sessione (CLAUDE.md)


## PUNTO DI RIPRESA — 2026-09-17

**Versioni in produzione**: engine **v2.14.27** · index **v5.7.42** · mappa **v1.6.90** · mappa2 **v1.5** · previsioni **v3.6** · index2 **v1.4** · history-check **v1.0** · confronto-modelli **v1.5** · export **v1.4** · decadimento **v1.3**

### Fase attuale (17/9): la correzione Livorno propagata ovunque, due bug di lunga data trovati per strada, D20 costruito

**Obiettivo della giornata completato**: la correzione di riferimento Livornometeo (+4.2kn, D16) ora appare coerente in **tutti** i punti dove un utente guarda il vento di Livorno — bussola (singola e tripla) in `index.html`, marker sulla mappa in `mappa.html` e `mappa2.html` (5 punti diversi in ciascuna: popup principale, popup di ripiego, ripiego rate-limit, tasto Aggiorna, flusso particelle), e le frecce doppie in `previsioni.html` (qui **nessun codice necessario** — leggeva già `forecast_hN` da `predict_history`, già corretto lato server). Il dato grezzo Windfinder in `bias_samples` resta intatto ovunque, come deciso.

**Due bug indipendenti trovati e risolti, non collegati alla correzione Livorno in sé**:

1. **`station_refresh` non conosceva `livorno_porto`** (engine v2.14.27) — mancava dalla lista `srAllStations`, dava "Stazione non trovata" quando qualcosa provava a forzare un aggiornamento. `barcaggio`/`bonifacio_pertusato` c'erano già, solo Livorno mancava. Il parser Windfinder dentro `station_refresh` esisteva già (corretto per il bug m/s a fine agosto) — bastava la voce nella lista.
2. **Il bottone "Livorno Porto" in `index.html`** (v5.7.42) chiamava ancora l'id abbandonato `livorno_cfr` (residuo della migrazione di luglio, mai pulito) — indipendente dal punto 1: anche con `station_refresh` corretto, il bottone non arrivava nemmeno a chiamarlo con l'id giusto. Due bug distinti sulla stessa storia, non uno solo. Corretta anche `STATION_QUOTAS` (livorno_cfr→livorno_porto).

**D18 (cache) confermato funzionante in pratica**: il "solo 1 riga invece di 10" nel bottone Stazioni Reali vs OM, che sembrava un problema nuovo, si è rivelato proprio il bug di cache già corretto (v5.7.41) — cambiando browser il dato tornava giusto. Buona conferma indipendente che il fix funziona.

**D20 costruito, poi corretto dopo un test reale**: prima versione con un pallino colorato piccolo sul canvas — M l'ha trovato troppo piccolo e "mai rassicurante senza contesto". Riprogettato: marker Leaflet invisibile per zona (tocco/clic), popup con orario, dato, e il giudizio per intero (colore + testo), stesso stile dei popup di `mappa2.html`. Il bottone "ora" non mostra giudizio (è dato reale stazione, non una previsione — chiarito dopo che sembrava ambiguo).

**Bug mobile trovato e risolto durante il test di D20** (previsioni v3.6): toccare un secondo marker faceva sparire tutto il colore di sfondo e rendeva ogni marker non cliccabile, serviva riavviare la pagina. Causa: `resizeCanvas()` svuota il canvas del colore come effetto collaterale del ridimensionamento (comportamento del browser, non un bug nostro) ma il gestore "move" della mappa non lo ridipingeva mai — bastava l'autoPan di un popup (che sposta la mappa per farlo entrare in vista, molto più frequente su schermi piccoli) a scatenarlo. **Era un buco strutturale preesistente**, mai emerso prima perché i marker nuovi hanno reso molto più frequenti gli spostamenti automatici della mappa. Risolto ridipingendo il colore dopo ogni spostamento, e disattivando l'autoPan sui popup zona (non serve per un popup piccolo).

**Due scoperte a margine, chiuse per non riesaminarle per errore in futuro**:
- **Livornometeo/Capraiameteo sono passate a un servizio a pagamento (shipinfo.it) da maggio 2026, ma M ha confermato che l'accesso non è comunque disponibile** (già verificato prima, solo non documentato) — non è una strada percorribile, chiusa
- **`mappa.html`/`mappa2.html` usano anche una stazione separata `livorno_cfr`** (diversa da `livorno_porto`), nella griglia colorata di sfondo — già limitata da un giudizio di M di luglio (`STATION_TRUST_CAP`, peso 0.5). Non toccata oggi, questione distinta dalla correzione di riferimento
- **Viareggio ha lo stesso doppio ("Viareggio" MeteoNetwork vs "Viareggio CFR" ufficiale)** di Livorno, e M ha notato che "Viareggio" (non CFR) è posizionata all'ingresso del porto sulla mappa — stesso schema fisico di Livorno/Livornometeo. **Accantonato su richiesta esplicita di M**, non indagato — idea per il futuro, non una decisione presa

**Corretti anche 2 commenti di chiusura sbagliati**, trovati per caso mentre si lavorava su altro: `mappa.html` diceva ancora v1.6.82 da settimane (D15, ora chiuso), `mappa2.html` diceva perfino "MAPPA" invece di "MAPPA2" (mai notato prima).

---

### Retrospettiva (15-16/9): la correzione Livorno decisa e applicata

**Decisione presa (15/9)**: dopo aver scoperto che il giudizio "affidabile" di Livorno in `decadimento.html` era circolare, M ha deciso esplicitamente di agire subito piuttosto che aspettare ancora — *"per Livorno bisogna correggere e poi monitorare... la precisione si raggiunge a piccoli passi"*. Applicata una correzione di **+4.2 kn** (delta medio calcolato su 22 punti raccolti a mano in 4 episodi, range 0.8-7.6) alla previsione finale della zona `livorno` — solo lì, nessun'altra zona. Il dato grezzo Windfinder in `bias_samples` **non è mai stato toccato**, coerente col principio di non manipolare mai una fonte esterna — la correzione si applica solo su `forecast_h1`...`h12` in `action=predict`, con lo stesso meccanismo già esistente per la correzione bias (tracciata, loggata nel testo della previsione, campo `reference_corrected: true` esplicito).

**Confermato live il 16/9**: la previsione delle 07:15 di stamattina mostra la correzione applicata correttamente su tutti e 5 gli orizzonti (H+1: 2→2.2→6.4kn, ecc. — verificato a mano che l'aritmetica torni).

**Effetto collaterale prevedibile, non un bug**: `decadimento.html`/`forecast_stats` ora mostreranno Livorno **peggiorare**, non migliorare — perché confrontano `forecast_hN` (ora alzato verso Livornometeo) con `actual_hN` (dato reale Windfinder, mai alzato) — stesso problema circolare di prima, capovolto. Quegli strumenti restano validi per tutte le altre zone, ma non più adatti a giudicare Livorno. **L'unico modo corretto di monitorare la correzione resta `confronto-modelli.html`**, che confronta col termine di paragone vero.

### Emerso un problema di coerenza tra pagine — la correzione non arriva dappertutto

M ha notato che `index.html` mostrava ancora vecchi numeri, e `previsioni.html` non permette di giudicare se una previsione è "buona". Analizzato il codice:

**`index.html` — causa trovata, non ancora corretta**: legge già correttamente il campo strutturato `forecast_hN` (quello con la correzione), il testo grezzo è solo un ripiego. **Il problema vero è che nessuna delle ~6 chiamate `fetch` verso `predict_history`/`predict`/`bias_history`/`triple_wind` ha `cache:'no-store'`** — il browser può mostrare una risposta salvata in cache da prima di un deploy, anche se il server ora risponde già con il dato giusto. **Stesso identico bug già risolto una volta nella mappa il 22/7** (popup con snapshot vecchi), mai corretto qui. Spiega sia le previsioni orarie vecchie sia la bussola "vecchia" con un'unica causa.

**`previsioni.html` — la correzione non arriva affatto, per architettura**: quella pagina disegna la griglia vento leggendo OM+AROME+stazioni direttamente (un meccanismo diverso da `action=predict`), non passa mai dalla correzione applicata oggi. Nessun fix rapido — richiede prima decidere *se* e *come* la correzione di riferimento debba propagarsi anche lì (la griglia è per punti, non per "zona", concetto diverso da come è stata scritta la correzione oggi).

### Lavoro da fare, elencato per priorità (non ancora iniziato oltre l'analisi)

1. **Aggiungere `cache:'no-store'` a tutte le chiamate fetch di `index.html`** verso dati che cambiano nel tempo (`predict_history`, `predict`, `bias_history`, `triple_wind`) — fix meccanico, stesso pattern già usato altrove nel progetto, basso rischio
2. **Decidere come (o se) propagare la correzione di riferimento a `previsioni.html`** — richiede prima una scelta di disegno, non solo codice. Punto aperto, non ancora discusso a fondo
3. **Capire come mostrare in `previsioni.html` "quanto è valida" una previsione rispetto a prima** — richiesta esplicita di M, non ancora affrontata. Serve probabilmente esporre lì un'indicazione di affidabilità/età della previsione, oggi assente (solo frecce, nessun numero/contesto)
4. Tutto il resto già aperto in ROADMAP (D10-D17) resta invariato, vedi lì

---

### Retrospettiva (14-15/9): sistema per condividere report, e la scoperta della circolarità

**Costruito un sistema per condividere report senza copia-incolla manuale**: nuove action `note_save` (POST, salva un blocco di testo con un id a scelta), `note_get&id=X` (lettura pubblica, testo grezzo), `note_list`. Aggiunto un tasto **"Salva per Claude"** a `export.html` (v1.4) e **"Salva tutte le stazioni per Claude"** a `decadimento.html` (v1.3) — premono, calcolano/estraggono i dati come sempre, li salvano sul server, e mostrano un link. **Il link va scritto o incollato dall'utente stesso nel messaggio a Claude** (non basta che Claude lo suggerisca — restrizione tecnica dell'ambiente: si possono aprire solo URL forniti direttamente dalla persona). Verificato che funziona: Claude ha letto con successo sia l'estrazione completa di `export.html` sia quella di `decadimento.html` per tutte le 25 zone, senza che M dovesse incollare nulla.

**Il tetto di `note_save` è stato alzato due volte lo stesso giorno** (200KB → 1MB → 5MB) perché il JSON completo di `export.html` superava anche 1MB — verificato nel frattempo il vero limite Upstash (10MB/richiesta, 100MB/valore, molto più alto del previsto). Nessun rischio di ripetere l'incidente quota Redis di agosto: quel limite riguardava il *numero* di comandi al mese, non la dimensione di uno singolo.

**Scoperta importante, non ancora agita**: `decadimento.html` giudicava Livorno "affidabile" su tutti gli orizzonti (verde ovunque) — ma è emerso che il giudizio è **circolare** per le zone con `bias_station` su Windfinder: il motore corregge la previsione per assomigliare a quella fonte, poi `decadimento.html` verifica se la previsione assomiglia alla stessa fonte. Non misura l'accuratezza vera, misura quanto fedelmente il sistema replica la sua fonte di calibrazione — che sappiamo già essere sistematicamente più bassa di Livornometeo (il punto vero). **Solo 3 zone hanno questo problema**, confermato controllando `bias_station` per tutte le 26: `livorno` (→`livorno_porto`), `barcaggio` (→`barcaggio`), `bonifacio` (→`bonifacio_pertusato`) — tutte le altre ~22 zone usano fonti CFR/MeteoNetwork indipendenti, nessun rischio di questo tipo. **Barcaggio era già "rosso" nel giudizio** anche con questo limite — il problema lì è un altro, non ancora capito. Bonifacio ha `verified:0`, non genera ancora previsioni, il problema resta teorico per ora.

**Conferma positiva emersa dallo stesso export**: le 3 zone attivate il 26/8 (Lido di Camaiore, Giglio Castello, Quercianella) generano tutte previsioni regolarmente (`verified: 30`) — i 6 cron aggiunti allora funzionano.

**La domanda "come migliorare Livorno davvero"**: risolta il 15-16/9 — vedi sezione in cima, correzione +4.2kn applicata e confermata live.

---

### Retrospettiva (29/8-13/9): confronto manuale con Livornometeo — pattern consolidato su 4 episodi, correzione ancora non applicata

**Chiarimento importante emerso il 31/8, dopo un fraintendimento mio**: Livornometeo (imboccatura del porto) **è il punto di riferimento vero** per chi è in mare davanti a Livorno — non una stazione concorrente da ignorare. Windfinder/OM/AROME (quello che leggiamo) sono gli unici modi disponibili per **stimare** quel punto, dato che Livornometeo non ci dà accesso ai dati (`robots.txt` la blocca, email senza risposta). Lo scopo di questo lavoro è costruire, con abbastanza dati, una correzione per avvicinare la nostra stima a quel punto vero — non "far combaciare due stazioni diverse per il gusto di farlo".

**Costruito `confronto-modelli.html`** (v1.0→v1.5): tabella storico nostro/OM/AROME per le 3 stazioni Windfinder (letta da `bias_history`, nessun dato nuovo, solo visualizzazione). Include un generatore di prompt per delegare la lettura degli screenshot (Livornometeo + Windfinder stesso) a una chat separata con un modello più economico — evita di consumare immagini nella conversazione principale.

**Fix importante scoperto durante l'uso (v1.5)**: la tabella mostrava l'orario in cui il nostro cron aveva interrogato la pagina (`ts`), non l'orario vero dell'osservazione dichiarato da Windfinder (`obs_time`) — i due divergono sempre di 20-30 minuti. Su un grafico volatile, questo scarto da solo spiegava buona parte dei divari di velocità che sembravano sospetti nei primi confronti (es. 11.9 contro 6-7kn) — **non erano errori di dato, erano due istanti diversi confrontati con la stessa etichetta**. Dopo il fix, nostro e Windfinder mostrano lo stesso andamento in modo coerente.

**Le frecce di direzione di Windfinder si sono rivelate illeggibili dall'IA leggera**: in due confronti separati ha sempre letto NW, mentre sia io sia M, guardando lo stesso screenshot, leggevamo chiaramente SW — errore di lettura riproducibile, non un dato vero. **Quella colonna del confronto va ignorata**, tenuta nel prompt solo perché "sappiamo cosa guardare", non perché il dato sia affidabile.

**Deciso**: i punti raccolti finora restano **solo in documentazione**, non ancora nel DB — sono letture visive approssimative ("~10-11 kn"), qualità diversa dai dati automatici precisi di `bias_samples`. Se in futuro emergerà un fattore di correzione vero (dopo abbastanza punti, con vento vario, verificato con un confronto rigoroso — non prima), quello sì andrà scritto nel DB come singolo valore, non i punti grezzi.

**Il pattern è ora consolidato (4 episodi, 3 direzioni: SW/NE/NW) — resta il vento forte da coprire**: Livornometeo sistematicamente +3/+7kn sopra Windfinder, confermato su condizioni diverse, non più un sospetto da un solo giorno. **Ancora nessuna correzione applicata**, per due motivi specifici: manca un episodio di vento sostenuto/forte (tutto raccolto finora è debole-moderato, e l'effetto di riparo di una baia spesso cambia con l'intensità del vento), e non è stato fatto un backtest vero (stimare su una parte dei dati, verificare sull'altra) — stesso principio già applicato altrove in questo progetto, non aggirato per fretta neanche qui.

### Dati grezzi raccolti finora (da consultare quando si deciderà se/come correggere)

**29/8 mattina (05:00-08:41 circa)** — prima del fix orario, valori di velocità da prendere con più cautela per via del disallineamento poi corretto:

| Ora (nostra) | Nostro | OM | AROME | Livornometeo vel. | Livornometeo dir. |
|---|---|---|---|---|---|
| 06:11 | 10.1 | 12.8 | 23.6 | ~14 | SW ~210-220° |
| 06:41 | 8.7 | 12.2 | 21.2 | ~9-10 | SW ~215° |
| 07:11 | 4.3 (isolato/basso) | 12.0 | 21.2 | ~20-21 | SW ~215-220° |
| 07:41 | 11.1 | 12.7 | 21.1 | ~19-20 | SW ~235° |
| 08:02 | 9.3 | 12.6 | 22.1 | ~19 | SW ~240° |
| 08:41 | 8.7 | 13.5 | 17.6 | ~15-16 | SW ~220-230° |

**29/8 mattina tardi (08:41-11:11)** — stesso giorno, valore 4.3 ricomparso una seconda volta (09:11):

| Ora | Nostro | OM | AROME | Livornometeo vel. | Livornometeo dir. |
|---|---|---|---|---|---|
| 08:41 | 8.7 | 13.5 | 17.6 | ~8-9 | SW ~230-240° |
| 09:11 | 4.3 (isolato/basso, 2ª volta) | 14.4 | 17.6 | ~14-15 | SW ~225-230° |
| 09:41 | 9.7 | 14.8 | 18.0 | ~14-16 | SW ~230° |
| 10:11 | 11.9 | 14.7 | 18.0 | ~20-21 | SW ~230° |
| 10:41 | 8.9 | 14.3 | 16.4 | ~19-20 | SW ~235° |
| 11:11 | 8.9 | 13.8 | 16.4 | ~11-13 | SW ~230° |

**Verificato separatamente**: il grafico di Windfinder stesso mostra effettivamente un calo netto verso 4kn nella finestra delle 07:11 — il valore isolato sembra reale, presente anche nella fonte, non un artefatto della nostra lettura. Non verificato con la stessa certezza per il secondo caso (09:11).

**31/8 (11:41-14:11)** — dopo il fix orario (v1.5), include anche Windfinder letto dal grafico:

| Ora | Nostro | OM | AROME | Livornometeo vel. | Livornometeo dir. | Windfinder vel. (grafico) |
|---|---|---|---|---|---|---|
| 11:41 | 1.7 | 6.3 | 2.5 | ~2-3 | S ~195-200° | ~1.5-2 |
| 12:11 | 2.1 | 7.7 | 2.5 | ~5-6 | S/SW ~200-210° | ~2-3 |
| 12:41 | 4.7 | 8.1 | 3.8 | ~10 | SW ~225-230° | ~6-7 |
| 13:11 | 5.4 | 8.4 | 6.9 | ~13 | SW ~230° | ~8-9 (picco) |
| 13:41 | 9.1 | 9.0 | 9.1 | ~10-11 | SW ~225-230° | fuori intervallo |
| 14:11 | 6.2 | 10.0 | 9.1 | ~10-11 | SW ~230-235° | fuori intervallo |

**31/8 sera (18:41-21:11)** — vento calante, ancora SW:

| Ora | Nostro | OM | AROME | Livornometeo vel. | Livornometeo dir. | Windfinder vel. (grafico) |
|---|---|---|---|---|---|---|
| 18:41 | 5.8 | 9.7 | 11.2 | ~13 | SW ~230-235° | ~7 |
| 19:11 | 5.6 | 9.1 | 11.2 | ~11 | SW ~225° | ~7-8 |
| 19:41 | 7.6 | 8.7 | 10.2 | ~12-13 | SW ~225-230° | ~7 |
| 20:11 | 8.4 | 8.0 | 10.2 | ~14-15 | SW ~230° | ~7-7.5 |
| 20:41 | 7.2 | 7.6 | 8.8 | ~9-10 | SW ~220-225° | ~6-7 |
| 21:11 | 4.5 | 7.0 | 9.0 | ~10 | SW ~220° | ~5-6 |

**01/09 mattina (08:11-10:41)** — prima volta con vento da NE, non SW-W. Contiene anche una virata reale catturata da tre fonti indipendenti:

| Ora | Nostro | OM | AROME | Livornometeo vel. | Livornometeo dir. | Windfinder vel. (grafico) |
|---|---|---|---|---|---|---|
| 08:11 | 5.6 | 4.4 | 11.5 | ~9-10 | NE ~25-30° | ~2.5-2.7 |
| 08:41 | 6.8 | 4.4 | 9.5 | ~11-12 | NE ~30-35° | ~1.5-2 |
| 09:11 | 3.1 | 4.1 | 9.5 | ~8-9 | NE ~45-50° | ~2.5-2.9 |
| 09:41 | 5.2 | 4.1 | 8.7 | ~8 | NE ~45-50° | ~1.3 |
| 10:11 | 4.1 | 3.7 | 8.7 | ~4-5 (virata in corso) | virata verso NW ~270-300° | ~0.5-1 (minimo) |
| 10:41 | 1.6 | 2.2 | 9.3 | fuori intervallo | fuori intervallo | **1.6 kts, 295°/ONO — tooltip esatto, identico al nostro dato** |

**13/09 (15:11-17:41)** — vento da NW, il divario con Livornometeo più ampio visto finora:

| Ora | Nostro | OM | AROME | Livornometeo vel. | Livornometeo dir. | Windfinder vel. (grafico) |
|---|---|---|---|---|---|---|
| 15:11 | 8.4 | 6.9 | 8.4 | ~10-11 | NW ~285-290° | ~8.5-9 |
| 15:41 | 7.2 | 7.3 | 8.0 | ~11.5 | NW ~290-295° | ~6-6.5 |
| 16:11 | 7.2 | 7.2 | 7.7 | ~10.5 | NW ~285-290° | ~7-7.5 |
| 16:41 | 5.8 | 7.2 | 7.7 | ~10-11 | NW ~285-290° | ~6.5-7 |
| 17:11 | 5.8 | 7.1 | 7.7 | ~9.5-10 | NW ~290-300° | ~5.5-6 (tooltip esatto: 5.6/289° — quasi identico al nostro) |
| 17:41 | 6.2 | 6.9 | 7.7 | ~9.5-10 (coerente con lettura puntuale 9.6kt/293° alle 17:44) | NW ~290-295° | ~5.5-5.8 |

### Conclusione consolidata (4 episodi, 3 direzioni di vento diverse — non più provvisoria)

**Livornometeo legge sistematicamente più alto di Windfinder (quello che noi mostriamo)** — confermato su SW (29-31/8), NE (01/09) e NW (13/09), scarto tipico tra +3 e +7 nodi, mai il contrario. Coerente con l'ipotesi fisica (imboccatura esposta vs Windfinder riparato nel bacino). Questo è ora un fatto documentato, non più un sospetto da un solo episodio.

**Nostro dato fedele alla fonte Windfinder**: in due occasioni distinte (01/09 alle 10:41, 13/09 alle 17:11) un tooltip con numero esatto sul grafico Windfinder ha confermato il nostro dato **quasi alla cifra** — buona conferma indipendente che l'estrazione funziona bene, a prescindere da quanto Windfinder si avvicini a Livornometeo.

**Le frecce di direzione lette dall'IA leggera sono inaffidabili in un modo specifico**: su 4 episodi diversi (direzione vera SW, NW, NE, NW) ha risposto "NW" **tutte e 4 le volte** — sembra un'ancora fissa nella lettura di frecce piccole da screenshot, non una lettura reale che cambia con l'immagine. L'unica volta che ha azzeccato (13/09, dove la direzione vera era proprio NW) è coincidenza, non miglioramento — non cambia il giudizio sull'affidabilità di quella colonna. **I numeri con tooltip esatto restano invece affidabili**, vanno sempre preferiti quando presenti nello screenshot.

**Perché non applichiamo ancora una correzione**: lo scarto (+3/+7kn) non è così irregolare da sembrare rumore puro, ma (1) manca ancora un episodio di **vento sostenuto/forte** — tutto raccolto finora è debole-moderato, e l'effetto di un riparo spesso cambia con l'intensità del vento; (2) non è stato fatto un **backtest vero** (stimare su una parte dei dati, verificare sull'altra) — stesso principio già applicato altrove in questo progetto, mai aggirato per fretta.

---

### Retrospettiva (27-28/8): due bug esterni risolti (CARTO, Windfinder), un incidente di deploy da cui imparare

**CARTO ha reso obbligatoria una chiave API sulle mappe di sfondo** (cambiamento del fornitore, non nostro — segnalato da molti progetti indipendenti lo stesso giorno). Senza chiave, ogni tassello mostrava "API KEY REQUIRED" al posto della mappa. Richiesta una chiave gratuita (5 milioni di richieste/mese, non richiede partita IVA/tax ID per un privato — solo nome/telefono per il modulo, l'account CARTO "piattaforma completa" che si crea in parallelo ha un trial di 14 giorni ma è irrilevante, si usa solo la chiave basemap). Aggiunta come `?key=...` all'URL delle tile in `mappa.html`, `mappa2.html`, `previsioni.html` — una riga per file, nessun altro cambiamento.

**Bug Windfinder risolto — il vento era sottostimato quasi della metà per 3 stazioni**: `livorno_porto`, `barcaggio`, `bonifacio_pertusato` leggono da pagine Windfinder con un parser dedicato, in produzione dal 18 giugno. Il campo che leggevamo (`ws`) era sempre stato interpretato come nodi ma è risultato essere **m/s** — confermato con 3 confronti indipendenti in giorni diversi (rapporto sempre ~1.94, il fattore esatto di conversione). Corretto in v2.14.22 (`scrape_web2`, `station_refresh`) moltiplicando per 1.94384. **Lo storico già raccolto da giugno per queste 3 stazioni resta sbagliato** (sottostimato ~del 50%) — nessuna decisione ancora presa su se/come corregerlo retroattivamente in `bias_samples`/`bias_archive`.

Durante l'indagine, costruita una diagnostica dedicata (`action=windfinder_raw_check`, v2.14.20-21, sola lettura) — utile perché ha rivelato che la pagina Windfinder contiene un'intera tabella di valori (non un solo dato), e il parsing originale prendeva "il primo che capita" (un widget di esempio nella pagina, non l'osservazione vera) — un problema diverso e più sottile della semplice unità di misura, scoperto per caso durante la stessa indagine.

**Incidente di deploy, causa umana non tecnica**: durante un caricamento su GitHub, la sessione è scaduta e un incollaggio è finito nel file sbagliato (`api/engine.js` sovrascritto con contenuto HTML) — l'engine è crashato del tutto (500, `FUNCTION_INVOCATION_FAILED`) finché non è stato ricaricato il file giusto. **Lezione**: dopo ogni deploy, controllare `action=ping` per conferma, non dare per scontato che il caricamento sia andato a buon fine.

**Mio errore da correggere**: in un fix di `mappa.html`, ho aggiornato 4 dei 5 punti-versione ma scambiato il commento di chiusura vero (in fondo al file) con un commento intermedio — il file ha ancora `// Fine codice - NAUTILUS MAPPA v1.6.82` al fondo invece di v1.6.89. **Lasciato così su richiesta esplicita** (non urgente, solo un commento, nessun effetto sul funzionamento) — da sistemare al prossimo giro di modifiche a quel file, non dimenticare.

---

### Retrospettiva (26/8): incidente quota Redis

**Incidente**: il database Redis (Upstash, piano gratuito, tetto 500K comandi/mese) ha raggiunto il limite ed è stato **bloccato per un paio d'ore**. Causa radice trovata: `getWindHistory` (usata da `predict`, `situazione`, mappa) leggeva Redis con **una chiamata separata per ogni slot da 30 minuti** dello storico richiesto — per `action=predict` (14 giorni) sono **672 letture singole per ogni chiamata**, × 2 volte/giorno × ~20 zone. Da sola valeva la maggioranza delle 733.838 letture del mese.

**Corretto in v2.14.19**: sostituita con `kvMGet`, una chiamata batch sola per lo stesso identico dato (tecnica già usata altrove nel progetto — `situazione_get`, `backfill_actuals` — non nuova). Stesso identico risultato restituito a previsioni/situazioni/mappa, cambia solo come viene letto da Redis.

**Aggiunto un controllo di consistenza automatico**: ogni chiamata a `getWindHistory` confronta quanti dati si aspettava con quanti ne ha trovati, e salva l'esito in `history_check:<zona>` (verde/rosso, soglia 30%). Nuova pagina **`history-check.html`** (v1.0): un tasto, una tabella con semaforo per zona, estraibile per incollare in chat. **Segnato per il futuro, non ancora fatto: estendere questo tipo di controllo automatico ad altre parti del sistema, non solo `getWindHistory`.**

In più, `bias_archive` (introdotto il 9/8) è stato rallentato a ~1 scrittura/ora invece di ogni 30 min (v2.14.18) — contribuiva anch'esso, anche se in modo minore rispetto a `getWindHistory`.

**Passato al piano a consumo di Upstash** (Pay as You Go, $0.2/100K comandi) — costo reale minimo (~$0.05 nei primi minuti dopo lo sblocco). **Impostato un tetto di allarme a $20/mese** — non per il costo atteso (centesimi/mese), ma come rete di sicurezza contro un cron impazzito in futuro.

**Punto ancora aperto, da riguardare tra qualche giorno**: `history-check.html`, il 26/8, mostra quasi tutte le zone (richiesta a 336h/14gg) con solo **~20% degli slot attesi** trovati (es. 137 su 672) — un numero che si ripete troppo simile su zone indipendenti per essere casuale. **Barcaggio e Alberese mostrano invece 0 su 672 — zero assoluto**, diverso dal resto, da controllare a parte. La spiegazione "colpa del blocco Redis" **non regge**: il blocco è durato ~2 ore, il traffico del 23/8 era normale (~30K, in linea con altri giorni) — non spiega un buco di giorni. **Nessuna ipotesi solida ancora.** Da riprendere quando ci sono un paio di giorni di dati puliti, confrontando gli slot mancanti di una zona col ~20% con lo stesso periodo di una stazione che li ha tutti.

**6 nuovi cron aggiunti su cron-job.org** per le 3 zone che non generavano mai previsioni (`lido_camaiore`, `giglio_castello`, `quercianella` — note da settimane come `enabled:true` ma zero previsioni, causa probabile mancanza nell'elenco cron esterno). Aggiunti: `action=cron_snap&zones=<zona>&secret=...` + `action=predict&zone=<zona>&fast=1`, stesso formato e stessa pianificazione (07:15/13:15) degli altri job già esistenti (copiati da quelli di Viareggio). **Non serviva nessun cron di scraping nuovo**: le loro stazioni (`lido_camaiore`/`giglio_castello` in `scrape_cfr`; `livorno` per `quercianella` in `scrape_stations`) erano già coperte dai cron generali esistenti, che non prendono un parametro zona — i dati stazione arrivavano già, mancavano solo `cron_snap`+`predict` specifici per zona.

---

### Retrospettiva (9-12/8): archivio persistente costruito, due sospetti dai dati reali

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
9. **Non aggiungere scritture/letture Redis extra senza controllare il budget comandi prima.** Lezione diretta dell'incidente del 26/8: l'archivio persistente (9/8), per quanto utile, è stato aggiunto senza verificare il consumo Redis esistente, e ha contribuito a un blocco reale per quota superata. La causa principale era però più vecchia (`getWindHistory`, centinaia di letture singole per chiamata) — un problema strutturale presente da mesi, individuato solo quando il limite è stato raggiunto.
10. **Dopo ogni deploy, verificare con `action=ping` che la versione live sia davvero quella nuova — non darlo per scontato.** Lezione diretta dell'incidente di deploy del 27/8: una sessione GitHub scaduta ha fatto finire un incollaggio nel file sbagliato, mandando l'intero engine in crash (500) finché non è stato notato e corretto.
11. **Un'unità di misura mai verificata è un sospetto permanente, non un dettaglio.** Il bug Windfinder (m/s letto come nodi da giugno, corretto solo il 28/8) è rimasto per mesi perché il commento originale nel codice affermava "già in nodi, nessuna conversione necessaria" senza che nessuno l'avesse mai controllato con un confronto reale. Un'affermazione sull'unità di un dato esterno andrebbe sempre trattata come ipotesi da verificare, non come fatto acquisito.

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
| **Viareggio ha lo stesso doppio Livorno/Livornometeo?** | Idea emersa 17/9, **accantonata su richiesta esplicita di M** — non indagata. "Viareggio" (MeteoNetwork) è posizionata sulla mappa all'ingresso del porto, "Viareggio CFR" (quella usata come `bias_station` della zona) è quella più riparata — stesso schema fisico di Livorno/Livornometeo. Da riprendere se un giorno si vuole approfondire |
| **Giudizio "affidabile" di `decadimento.html` è circolare per 3 zone (Windfinder)** | Scoperto 15/9. `livorno`, `barcaggio`, `bonifacio` correggono la previsione con la stessa fonte con cui poi la verificano — il "verde" misura fedeltà alla fonte, non accuratezza vera. Tutte le altre ~22 zone usano fonti CFR/MeteoNetwork indipendenti, non hanno questo problema. Per Livorno, dal 16/9 ci si aspetta l'opposto — il giudizio peggiora per via della correzione di riferimento, effetto atteso non un bug |
| **Correzione verso Livornometeo (imboccatura porto, punto di riferimento vero)** | Pattern consolidato (29/8-13/09, 4 episodi, 3 direzioni: SW/NE/NW): LM sistematicamente +3/+7kn sopra Windfinder. **Applicata il 15-16/9** (+4.2kn, provvisoria) — vedi sopra. Manca ancora un episodio di vento forte per confermarla su quel regime, e un backtest formale. Dati grezzi in questo stesso file, sopra |
| **Storico Windfinder da giugno (livorno_porto/barcaggio/bonifacio_pertusato) sottostimato ~50%** | Nuovo (28/8). Bug risolto per i dati nuovi (v2.14.22), ma tutto lo storico già in `bias_samples`/`bias_archive` per queste 3 stazioni resta con l'errore. **Decidere se/come corregerlo retroattivamente, o accettare la perdita e ripartire puliti** |
| **Pattern ~20% slot trovati su richieste a 14 giorni in `history-check.html`** | Aperto dal 26/8, causa ancora ignota. Non spiegato dal blocco Redis (durato solo ~2 ore, non giorni). Riprendere con dati puliti, confrontando con una stazione che ha tutti gli slot |
| **Barcaggio e Alberese — 0 slot trovati su 672 in `history-check.html`** | Aperto dal 26/8, diverso dal pattern sopra (zero assoluto, non ~20%). Controllare con `action=snap_debug&zone=X&k=mdi` |
| **Orbetello e Bonifacio Pertusato — verificare coordinate/quota** | Aperto (12/8), priorità alta. Firma statistica anomala (bias=MAE esatto su 100 campioni), `reliability_weight` già basso (0.16/0.22). **Nota 28/8**: Bonifacio Pertusato usa lo stesso parser Windfinder appena corretto — riverificare questa anomalia con i dati puliti post-fix, potrebbe essere in parte spiegata dallo stesso bug unità di misura |
| **Canale di Piombino — valutare tsc228 come `bias_station` invece di Populonia** | Aperto (12/8). tsc228 tornata a trasmettere vento reale, stabile su 2 controlli il 12/8 — non ancora riverificato dopo. **Aspettare conferma di stabilità prima di agire** |
| **AROME come selettore dinamico per cella (vento×settore×slot)** | Disegnato, deliberatamente **non implementato**. Aspettare che `bias_archive` abbia settimane di giorni/regimi diversi. **Promemoria: riverificare le statistiche quando l'archivio sarà più maturo, prima di scrivere codice** |
| **Populonia — coordinate sbagliate** | Ancora da fare, indipendente dal punto tsc228 sopra |
| **Liste hardcoded incomplete in `mae_compare`/`bias_matrix`/`score_get`** | Da fare (impatto solo diagnostico). Mancano `populonia_cfr`, `livorno_porto`, `viareggio_cfr` |
| **Correzione `forecast_stats` trend con N=2** | Il calcolo del trend include settimane con solo 2 campioni, che falsano il giudizio |
| **`action=history` tronca lo storico** | Prerequisito per analisi su finestre lunghe |
| **Dato OM sospetto su Capraia** | Aperto, nessuna azione. Pressione 978 hPa e direzione opposta all'avviso marittimo |
| **`mappa2.html` vs `mappa.html`** | In prova. Se il confronto affiancato convince, decidere un passaggio esplicito per "promuovere" mappa2 — non per confusione tra i due file |
| **Sistema di monitoraggio esteso oltre `getWindHistory`** | Segnato per il futuro, non ora. Idea nata da `history-check.html` — varrebbe la pena estenderla ad altre parti del sistema, non solo questa funzione |

### Note operative sulla collaborazione

- **Gli allegati `document` da iPad arrivano vuoti** — il testo va **incollato direttamente in chat**, non allegato.
- **Sessioni lunghe**: la quota si consuma più in fretta con Opus e con conversazioni lunghe. Per sessioni di manutenzione conviene **Sonnet 5**; Opus per problemi diagnostici ambigui, in sessioni brevi e mirate.
- **Il filesystem di lavoro si può resettare durante la sessione, non solo tra sessioni** — successo più volte lo stesso giorno (26/8): un file caricato prima nella sessione non è detto resti disponibile più tardi, va tenuto pronto per ricaricarlo su richiesta. Non presumere che un file "già dato" sia ancora lì.
- **Verificare sempre un'ipotesi statistica con un backtest**, e verificare sempre la diversità temporale dietro un n alto, non solo il suo valore.
- **`web_fetch` non riesce a chiamare l'engine direttamente** (restrizione dell'ambiente: solo URL già apparsi in conversazione) — l'estrazione dati resta un giro di incolla-e-rispondi: M apre `export.html`/le action URL, incolla qui il risultato.
- **Controllare sempre il budget comandi Redis prima di aggiungere scritture/letture ricorrenti** — lezione diretta dell'incidente del 26/8 (vedi Principio 9).
- **Formati di archivio**: se M carica uno zip/archivio, preferire sempre `.zip` — altri formati (es. `.7z`) potrebbero non essere estraibili nell'ambiente di lavoro (mancano tool dedicati e non c'è accesso di rete per installarli).
- **Verificare sempre con precisione TUTTI i punti-versione dichiarati per un file (5 per mappa.html: riga 1, title, span a video, footer, commento di chiusura) — non fermarsi al primo controllo apparentemente riuscito.** Il 27/8 ho aggiornato solo 4 dei 5 punti di `mappa.html`, scambiando un commento intermedio per quello di chiusura reale (più avanti nel file). Contare sempre le occorrenze attese prima di dichiarare fatto un aggiornamento di versione.
- **Registrazioni a servizi esterni (API key, account)**: è normale che chiedano nome/telefono anche per servizi gratuiti (riduzione spam) — non è un segnale di allarme. Un "trial" o conto alla rovescia mostrato dopo la registrazione può riferirsi a una parte della piattaforma diversa da quella richiesta (caso CARTO, 27/8: trial 14gg sulla piattaforma Builder, irrilevante per la sola chiave basemap, gratuita e permanente).

---

Documento di contesto persistente per sessioni di lavoro con Claude.
Aggiornato: 2026-09-17 | Versioni riferimento: engine v2.14.27 · index v5.7.42 · mappa v1.6.90 · previsioni v3.6 · mappa2 v1.5 · index2 v1.4 · history-check v1.0 · confronto-modelli v1.5 · export v1.4 · decadimento v1.3


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
| `api/engine.js` | **v2.14.27** | Engine principale. v2.14.13-19: archivio persistente + ottimizzazione `getWindHistory`. v2.14.20-22: diagnostica Windfinder + fix bug unità di misura. v2.14.23-25 (14-15/9): sistema `note_save`/`note_get`/`note_list`. v2.14.26 (15-16/9): correzione di riferimento Livornometeo per la zona `livorno` (+4.2kn su `forecast_hN` finali, D16) — provvisoria, monitorare con `confronto-modelli.html`. **v2.14.27 (17/9)**: aggiunta `livorno_porto` a `srAllStations` (`station_refresh`) — mancava dalla lista, dava "Stazione non trovata" |
| `index.html` | **v5.7.42** | App principale. Stazioni mute mostrano ultimo dato + età. **v5.7.41 (17/9)**: `cache:'no-store'` su tutte le 27 chiamate fetch verso l'engine — risolve i dati vecchi mostrati dopo un deploy (stesso bug già risolto in mappa.html il 22/7). **v5.7.42 (17/9)**: bussola Livorno (singola e tripla) mostra il valore corretto invece del grezzo; corretto anche il bottone "Livorno Porto" che chiamava ancora l'id abbandonato `livorno_cfr` (residuo della migrazione di luglio) |
| `mappa.html` | **v1.6.90** | Mappa vento (produzione). **v1.6.90 (17/9)**: marker "Livorno Porto" mostra il valore corretto in 5 punti (popup principale, di ripiego, rate-limit, tasto Aggiorna, flusso particelle). Corretto anche il commento di chiusura (diceva ancora v1.6.82 da settimane) |
| `mappa2.html` | **v1.5** | Sperimentale — fork di mappa.html per confronto affiancato. Sfondo colorato bilineare, tasti FLOW/OI/GRID. **v1.5 (17/9)**: stessa correzione Livorno di mappa.html, stessi 5 punti. Corretto anche il commento di chiusura (diceva ancora "MAPPA v1.6.82", nome sbagliato oltre a versione vecchia) |
| `previsioni.html` | **v3.6** | Mappa vento futuro. Bottoni a ore intere, due orologi separati, FLOW/GRID, XLS, sfondo colorato bilineare. **v3.4-3.6 (17/9, D20)**: marker Leaflet invisibile per zona, tocco apre un popup con orario/dato/giudizio di affidabilità (stesso metodo di `decadimento.html`). La correzione Livorno era già propagata qui senza bisogno di codice (legge `forecast_hN` già corretto). **v3.6**: risolto un bug mobile — toccare un secondo marker faceva sparire il colore di sfondo e bloccava tutti i marker, causa un canvas che si svuotava al movimento della mappa senza mai ridipingersi |
| `export.html` | **v1.4** | Un tasto estrae `forecast_stats`+`predict_history`+`mae_compare`+`bias_matrix`+`model_score`+`decadimento_by_slot` per tutte le zone in un unico JSON. **v1.4 (15/9)**: tasto "Salva per Claude" (usa `note_save`) |
| `index2.html` | **v1.4** | Cruscotto: indice strumenti + stato engine live + tasto "Controlla archivio" + link a previsioni/mappa2/export |
| `history-check.html` | **v1.0** | Un tasto, una tabella con semaforo verde/rosso per zona: verifica se `getWindHistory` trova quanti dati si aspettava. Nato dall'incidente quota Redis del 26/8. Estraibile per incollare in chat |
| `confronto-modelli.html` | **v1.5** | Tabella storico nostro/OM/AROME per le 3 stazioni Windfinder, da confrontare a occhio con screenshot di Livornometeo (non leggibile in automatico). Genera un prompt autosufficiente per delegare la lettura degli screenshot a una chat separata. **v1.5**: usa `station.obs_time` invece di `ts` per l'etichetta oraria — evita disallineamenti di 20-30 min che falsavano il confronto |
| `diag.html` | v1.3 | Diagnostica strutturata per zona con semafori |
| `climatologia.html` | v1.4 | Distribuzione fasce e settori per zona |
| `decadimento.html` | **v1.3** | MAE per orizzonte con banda dispersione + confronto mattina/pomeriggio. **v1.3 (15/9)**: tasto "Salva tutte le stazioni per Claude" — scorre tutte le zone invece di una alla volta, salva con `note_save`. **Attenzione**: il giudizio "affidabile" è circolare per `livorno`/`barcaggio`/`bonifacio` (vedi Problemi aperti) |
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
| `predict` mattino ×23 | 07:15-07:34 | 19 zone toscane + Barcaggio + **lido_camaiore, giglio_castello, quercianella (nuovi, 26/8)**, sequenziale |
| `predict` pomeriggio ×23 | 13:15-13:34 | Stesso ordine del mattino |
| `cron_snap` per zona | ogni 30 min | **Aggiornato 26/8**: aggiunti anche per `lido_camaiore`, `giglio_castello`, `quercianella` (`action=cron_snap&zones=<zona>`) — prima mancavano, le altre ~20 zone li avevano già |
| `backfill_actuals` | 01:35 08:35 10:35 13:35 16:35 19:35 23:45 | 7 volte/giorno, copre tutti gli orizzonti mattina e pomeriggio |
| `compute_scores` | ogni ora :45 | Ricalcola matrix e matrix_by_station per tutte le 23 stazioni, copre tutti gli orizzonti mattina e pomeriggio |

---

## Struttura Redis (chiavi principali)

| Chiave | Contenuto |
|---|---|
| `bias_samples:<id>` | Array fino a 100 campioni (~2gg): `{ts, station, om, arome, delta, delta_arome}` |
| `bias_archive:<id>` | Stessa forma di `bias_samples`, tetto 3000 (~62gg). Scrittura in parallelo nei 4 punti dove si scrive `bias_samples` — **rallentata (26/8, v2.14.18) a ~1 scrittura/ora** (salta se l'ultimo campione ha meno di 50 minuti), contribuiva all'esaurimento quota Redis |
| `predict_history:<zona>` | Storico previsioni AI con actual_Nh popolati a posteriori, tetto 30 (~15gg) |
| `predict_archive:<zona>` | Stessa forma di `predict_history`, tetto 1000 (~500gg). Sola scrittura oggi, nessuna action legge da qui per calcolare/correggere |
| `predict:<zona>:<slot>` | Ultima previsione per slot orario |
| `bias_stats:<id>` | Statistiche aggregate bias stazione (calcolate da biasComputeStations) |
| `snap:<zona>:<slot>` | Snapshot OM orari per wind history nelle previsioni |
| `history_check:<zona>` | **Nuovo (26/8)** — ultimo esito del controllo di consistenza di `getWindHistory`: `{hours_requested, slots_expected, slots_found, ratio, ok, checked_at}`. Si autoaggiorna ad ogni chiamata, non è uno storico. Letto da `action=history_check_get` / `history-check.html` |
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
| Campo `ws`/`wg` Windfinder letto come nodi, era m/s (livorno_porto, barcaggio, bonifacio_pertusato) | engine.txt | ✅ Risolto 28/8 (engine v2.14.22) | In produzione dal 18 giugno senza mai essere verificato — vento sottostimato ~50%. Confermato con 3 confronti indipendenti (rapporto sempre ~1.94). Storico precedente al fix non corretto retroattivamente |
| `station_refresh` non include `livorno_porto` nel suo elenco stazioni | engine.txt | Noto (28/8), non urgente | Usare `scrape_web2&station=livorno_porto&k=mdi` per forzare un refresh di quella stazione specifica invece — quella action sì la copre |
| `bias_station` di forte_marmi/casotto_gr non combaciava con la chiave reale (`forte_marmi`→`forte_dei_marmi`, `casotto_pesc`→`casotto_pescatori`) | engine.txt / mappa.html | ✅ Risolto 31/07 (engine v2.14.10, mappa v1.6.88), **confermato con dati reali 12/8** | `bias_samples` per quelle 2 zone era vuoto, `forecast_stats`/`backfill_actuals` cadevano nel fallback meno preciso su `snap:`. Confermato funzionante: MAE settimanale di Forte dei Marmi crolla da 4.6 a 1.5 kn esattamente in coincidenza col fix |
| Orbetello e Bonifacio Pertusato — bias esattamente uguale a MAE su 100 campioni | engine.txt (dati, non codice) | Nuovo (12/8), da verificare | Errore sempre stesso segno, mai un'eccezione su 100 campioni — non tipico di bias vero. Sospetto: coordinate, quota, o cella OM sbagliata. `reliability_weight` già basso (0.16 e 0.22) |
| Liste hardcoded stazioni incomplete in `mae_compare`/`bias_matrix`/`score_get` | engine.txt | Aperto (31/07) | Mancano `populonia_cfr`, `livorno_porto`, `viareggio_cfr` — impatto solo diagnostico (quei 3 cruscotti mostrano dato assente/vecchio per queste stazioni), non tocca la correzione vera |
| `bias_station` di `quercianella` punta a `'livorno'` invece che alla propria stazione | engine.txt | ⚠️ Riattivato (26/8) — verificare | Era dormiente perché quercianella non era nel cron predict. **Dal 26/8 ha un cron predict dedicato** — questo bug ora ha effetto reale, non più solo teorico. Da correggere o confermare intenzionale |
| `getWindHistory` faceva N letture Redis separate invece di una batch | engine.txt | ✅ Risolto 26/8 (engine v2.14.19) | Fino a 672 letture singole per una sola chiamata `action=predict` (14gg × 2 slot/ora) — causa principale dell'esaurimento quota Redis mensile (avviso 12-25/8, sbloccato 25/8 passando a piano a consumo). Sostituito con `kvMGet`, una chiamata batch sola, stesso dato restituito |
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

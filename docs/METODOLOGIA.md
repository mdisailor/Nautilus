# NAUTILUS — Metodologia di Calcolo (METODOLOGIA.md)

Documento tecnico-scientifico sulle logiche di calcolo, fonti e assunzioni.
Versione documento: v3.9 — Aggiornato: 2026-11-24 (nuova sezione 33: i nomi con il #, la serie nascosta di Livornometeo, il giro dell'archivio del 23/11); 19/11 (nuova sezione 32: Livornometeo chiuso e la fotografia finale del modello di Livorno; il PDF della mappa di previsioni); 18/11 (nuova sezione 31: la fusione dell'osservato e la fase C dell'archivio); 16/11: sezione 30 (Livorno, il tetto sul fattore e il valore unico deciso dal motore); prima: 2026-11-13 (nuova sezione 29: l'archivio dei dati e quello che ha rivelato; la CHECKLIST ha cinque voci nuove: un dato scritto da due percorsi va controllato in entrambi, una tabella di copertura per zona subito dopo aver costruito un archivio, un archivio che copia da un deposito con un tetto deve accumulare e non riscrivere, l'ordine delle operazioni per strumenti esterni, e un nome sbagliato deve dirsi)

---

## CHECKLIST OPERATIVA — leggere prima di modificare o consegnare qualunque file

Non è la cronaca di un bug specifico (quella è nelle sezioni numerate sotto) — è l'elenco dei controlli da fare **sempre**, su ogni file, indipendentemente da cosa ha scatenato la modifica di oggi. Maturati a forza di errori reali ripetuti più volte in sessioni precedenti (17/9-17/10 2026), mai scritti prima come procedura, solo come racconto del singolo bug che li aveva causati.

**Prima di modificare un file:**
- Leggere la prima riga per confermare la versione caricata — non presumere di sapere cosa contiene da conversazioni precedenti
- Se due file sembrano simili (es. un fork come `mappa.html`/`mappa2.html`), verificarli riga per riga sul punto specifico da modificare, non presumerli identici solo perché "dovrebbero esserlo"
- Se una frase di M ammette due letture ("lasciamo la correzione", "il bottone"), **chiedere prima di costruire** e non presentare mai la propria lettura come una sua decisione (successo due volte il 19/10: bussola esclusa per errore, bottone che apriva il sito invece dell'elenco)
- **Se M chiede "è possibile / si può fare?", rispondere alla domanda (fattibilità, limiti, cosa servirebbe) e chiedere se partire: non scrivere codice.** Richiamo del 27/10 sulla matrice dalle stazioni: avevo costruito `field_test` quando M chiedeva solo se era una cosa sensata
- Un file dal nome strano (es. `vuoto.zip`): aprirlo e guardare cosa contiene, **senza commenti sospettosi**; se è uno scherzo M lo dice dopo (richiesta del 27/10)
- Per dati di posizione (coordinate di una stazione) cercare prima il **dato ufficiale** (qui scritto sul sito stesso) e chiederlo a M: le stime "al centro del paese" sbagliavano di 0.9-1.8 km, e a Livorno uno scambio di marker su una base sbagliata ha messo due stazioni 600 m al contrario
- Prima di spostare o aggiungere un marker sulla mappa, controllare cosa c'è già alle stesse coordinate (altri marker, cerchi di zona) e l'ordine di sovrapposizione: un marker coperto da un altro è invisibile e non toccabile (Livorno Porto/Windfinder sotto il cerchio di zona, 20/10)

**Durante la modifica:**
- Dopo 2 tentativi falliti nel capire una struttura sconosciuta (dati, HTML, comportamento di una pagina esterna), smettere di indovinare un terzo tentativo — costruire invece uno strumento diagnostico che mostri la struttura vera, poi agire su quello
- Quando si aggiunge una logica che richiede `await`/`async` dentro un ciclo su un array, verificare se è un `forEach` — non lo aspetta correttamente, va convertito in un `for` tradizionale
- Quando si rimuove o si disattiva codice, scrivere nel commento **il motivo**, non solo cosa è cambiato (preferenza esplicita di M)

**Prima di consegnare un file:**
- Validare la sintassi JavaScript (estrarre ogni blocco `<script>`, eseguire `node --check`) — sempre, anche per modifiche piccole
- Verificare che il commento di chiusura ("Fine codice") sia davvero sull'ultima riga del file (`wc -l` + `tail -1`) prima di aggiornarlo per numero di riga — più volte si è rivelato un commento vecchio, non alla fine vera del file
- Contare con `grep` tutti i punti dove compare il numero di versione (di solito 3-4: commento iniziale, `<title>`, un'etichetta a video, il commento di chiusura) prima di affermare che sono coerenti — non fidarsi a memoria
- Se il testo da inserire contiene apostrofi o virgolette (frequente in italiano), preferire uno script Python a `sed` — `sed` si è rotto più volte proprio su questo
- Verificare che ogni ID HTML referenziato in JavaScript (`getElementById`, `querySelector`) esista davvero nel markup, e viceversa — un conteggio incrociato con `grep` basta

**Quando si analizzano dati e si propone una formula o una soglia:**
- Con pochi punti dirlo apertamente e non scegliere sulla base di una forma che "sembra meglio": con 8 letture "×2" pareva battere il "+4.2", con 23 non c'era differenza
- Validare le forme adattate ai dati con "uno fuori" (adattare senza il punto da prevedere), non solo sui dati con cui sono state adattate
- Non definire le fasce sul valore che si vuole prevedere: gonfia l'effetto "sopra a vento debole, sotto a vento forte"
- Distinguere "il modello e la stazione non concordano" da "il modello sbaglia": un confronto tra due fonti misura il disaccordo, non chi ha ragione
- Prima di discutere cosa fa un componente (es. "AROME sulla mappa"), leggere nel codice cosa usa davvero: la mappa usava Open-Meteo standard, non AROME
- **Quando si corregge un valore a valle (es. un fattore sulla previsione), controllare chi lo rilegge a monte**: il bias delle previsioni confronta `forecast_hN` con la stazione, quindi riassorbiva la correzione (successo con il +4.2, dal 15/9). Soluzione: salvare anche il valore **prima** della correzione e fare i confronti in quella scala
- **Quando si cambia un modello dell'AI (o qualunque dipendenza esterna che restituisce dati), provare il percorso che ne elabora la risposta prima di consegnare**: end-to-end, con una risposta finta in tutti i formati possibili (blocco di ragionamento davanti al testo, solo ragionamento, errore del servizio, errore di rete), e dopo il deploy leggere **l'ultimo record scritto** (data e `model_used`). Il 9-10/10 il cambio da Haiku 4.5 a 5.5 ha fermato per 19 giorni il salvataggio delle previsioni (sezione 24)
- **Una regola di correzione si propone solo dopo la validazione un giorno fuori, misurando l'errore medio assoluto sulle singole ore, non il bias medio**: il bias di OM sotto i 7 kn si correggeva (+0.9 → −0.1 kn) ma l'errore sulle ore non scendeva (3.1 → 3.1-3.2). Ho proposto la regola prima del test: da evitare
- **Le fasce per una correzione si scelgono sul valore che il sistema conosce (il modello), non sull'osservato**, e nei risultati non si giudica con colonne selezionate sull'osservato (qui "ore deboli"): ogni rialzo vi viene punito per costruzione. Il test giusto e' la colonna su tutte le ore
- **Se un'analisi successiva rovescia una conclusione già data, dirlo per esteso e aggiornare i documenti**: le "calme sovrastimate dai modelli" (0.6 con fasce sull'osservato) sono diventate "calme sottostimate da OM" (1.4-1.7 con fasce sul modello), e poi "nessuna regola valida" al test finale
- **Quando un collaudo con dati finti dà un errore inatteso, controllare prima il collaudo, ma poi chiedersi se il codice e' fragile**: una firma sbagliata dell'aiuto di prova (`pts('25',...)`) ha prodotto orari non validi e l'engine ha risposto con un errore invece di scartarli; ho aggiunto la protezione in `lmSeriesBucket`
- **Prima di generalizzare da un campione, elencare come il sistema divide i casi e controllare un campione per gruppo**: il 28/10 ho scritto che il fermo delle previsioni era generale guardando Livorno e Viareggio, due zone dello stesso gruppo (13 con Haiku, 11 con Sonnet); il guasto toccava solo le 13
- **Prima di cambiare una regola condivisa, cercare nei commenti del codice le decisioni precedenti che la riguardano**: la regola "direzione con vento debole per tutte le stazioni" avrebbe riaperto il fix del 1/7 (Bocca d'Arno, Viareggio, dove la direzione con vento debole è vera). Si applica ai soli casi dimostrati, con un interruttore (`OI_DIR_WEAK_ALL`) per estenderla e un collaudo di invarianza per tutto il resto
- **Un'azione di sola lettura che segnala problemi deve restare leggibile da chi la usa**: il controllo di salute risponde 503 perché cron-job.org lo segni fallito, ma il mio strumento di lettura scarta le risposte di errore; serve un parametro `soft=1` che risponda 200 con lo stesso contenuto
- **Il primo giro di un controllo nuovo scopre la realtà della configurazione**: le zone attive senza previsioni per scelta (vada, bonifacio) avrebbero dato errore ogni 30 minuti. Si decide caso per caso e si scrive un elenco esplicito delle zone ignorate, con il motivo, visibile nella risposta; non si abbassa la soglia
- **La forma di una correzione segue dove i dati mostrano l'errore**: un tetto fisso di fiducia per Orbetello avrebbe tolto peso anche col vento forte, dove la stazione ha ragione; una rampa sulla velocità della stazione toglie peso solo alle calme
- **Non dare istruzioni operative (indirizzi, parametri) a memoria**: avevo dato a M il lavoro `cron_snap` con i parametri senza averli letti nel codice; li ho verificati dopo (erano giusti, ma per fortuna). Si leggono prima, e si dice cosa non è verificato
- **Un canale di avviso si prova con un guasto simulato prima di fidarsene**: l'email di errore di cron-job.org sembrava configurata (tutti i canali, un'email per ogni errore) e non e' mai arrivata, nemmeno nelle settimane del fermo di ottobre; l'ho scoperto solo facendo fallire apposta un lavoro verso un indirizzo inesistente. Un'impostazione giusta non e' un avviso che funziona
- **Quando un servizio esterno non garantisce l'avviso, farlo partire da chi conosce lo stato**: il motore sa gia' a ogni controllo se qualcosa e' rotto; manda il messaggio **sul passaggio di stato** (nuovo, cambiato, promemoria, ripristino) e non a ogni controllo, ricorda lo stato in un posto sicuro e tiene un registro dei cambi. Gli avvisi non gravi non mandano niente, o il segnale smette di significare qualcosa
- **Una frequenza dedotta dal codice va confrontata con un conteggio reale**: avevo scritto che le fotografie di zona erano ogni 30 minuti perche' il codice arrotonda la chiave alla mezz'ora; i lavori di M giravano ogni ora (315 punti dati in 13 giorni = 24 al giorno). Quello che il codice permette non e' quello che il sistema fa
- **Lo stato di un episodio non deve ereditare da quello precedente**: l'ora dell'ultimo avviso va azzerata a ogni cambio di stato; altrimenti, se il messaggio nuovo non parte, il sistema crede di aver gia' avvisato (per l'episodio di prima) e non riprova per 6 ore. L'ha trovato un collaudo con un Telegram finto che risponde male
- **Per rendere coerente un numero, prima elencare tutti i punti del codice che lo mostrano**: freccia, numero accanto alla freccia, popup di zona, popup di griglia, popup di stazione. Il 6/11 ne ho trovate tre incoerenze (zona di Livorno senza il fattore, click che apriva la cella e non la freccia, popup che leggevano un valore piu' fresco della freccia) solo perche' le ho cercate tutte
- **Dopo aver cambiato un'etichetta, controllare che il dato sotto sia quello che l'etichetta dice**: ho cambiato in "Punto stazione (dato vero)" il titolo di un popup il cui valore era quello di MODELLO della cella di una stazione; M l'ha visto cliccando in mezzo al mare
- **Un click libero non deve ereditare il significato di un elemento speciale**: le celle dei punti stazione valgono solo per la loro freccia; cliccando a 20 km da una stazione si deve ricevere una cella normale, non il valore della cella della stazione
- **Prima di attribuire una causa, controllare il dato; una causa non verificata si scrive come ipotesi**: avevo scritto che il punto di Gorgona "non aveva un dato vivo"; tre minuti di `bias_history` hanno mostrato letture fresche ogni 30 minuti e la causa era un'altra
- **Un dato scritto da due percorsi diversi va controllato in entrambi**: le fotografie di zona le scrivono `cron_snap` (14 giorni) e `scrape_cfr` (3 giorni), sulle stesse chiavi: chi scriveva per ultimo decideva la scadenza. Per quasi due mesi 16 zone su 17 hanno lavorato con il 20% della storia che la previsione chiedeva. Si trovano elencando **tutti i punti del codice che scrivono quella chiave**, con la loro scadenza
- **Dopo aver costruito un archivio, guardare subito la copertura per zona**: una tabella (ore, prima, ultima, ore mancanti) ha mostrato tre gruppi di zone con storie diverse, e due difetti (la scadenza di 3 giorni, il buco di scrittura per le zone che passano da `scrape_cfr`). L'archivio e' anche uno strumento di diagnosi
- **Una copia da un deposito con un tetto deve accumulare, non riscrivere**: Redis tiene solo gli ultimi 30.000 punti per stazione; se l'esportazione riscrivesse il file ogni volta, perderebbe i punti piu' vecchi. Lo script riparte dall'ultimo punto gia' nel file; il collaudo include il caso in cui Redis perde i primi punti
- **Per strumenti esterni, dare le operazioni nell'ordine in cui vanno fatte e dire cosa controllare**: il primo giro della GitHub Action e' fallito perche' il motore v2.14.51 non era ancora deployato; un percorso senza il punto iniziale (`github/` invece di `.github/`) faceva sparire la Action. Prima il deploy, poi il lancio; e il nome esatto dei file nascosti va detto
- **Un nome sbagliato deve dirsi, non essere ignorato in silenzio**: un lavoro con `zones=Livorno` non scriveva niente e non lo segnalava; ora la risposta contiene `unknown_zones`. Lo stesso principio del controllo di salute: l'assenza di un effetto non e' un segnale
- **Un costo costante o l'assenza di errori visibili non prova che il sistema produca**: controllare la **data dell'ultimo record scritto** per ogni uscita (previsioni, archivi, bias). Le chiamate all'AI venivano fatturate anche mentre le previsioni non venivano salvate
- **Un risultato "zero" di un report nuovo e' una scoperta, non un difetto da ritoccare**: `forecast_monitor` con 0 coppie su 150 orizzonti ha fatto trovare il fermo delle previsioni. Prima di toccare soglie e finestre, guardare i dati grezzi (qui: la data dell'ultima previsione)
- **Confrontare solo cose confrontabili, e dirlo**: un'osservazione fatta nell'istante (Windfinder) non e' commensurabile con una previsione (AROME): il confronto vale per la stima "adesso", non per le ore future. Un fattore ricavato sulle stesse ore su cui si valuta e' ottimista: dare anche la versione adattata un giorno fuori
- **Quando chiedo a M di rifare una chiamata, dargli un indirizzo con un parametro nuovo** (`&v=N`): con lo stesso indirizzo lo strumento puo' restituire la pagina letta prima. Una chiamata molto lenta (190 letture in fila, come `predict_debug`) va in timeout nello strumento: preferire controlli leggeri
- **Le dichiarazioni sul sistema ("questo lavoro non chiama l'AI", "i costi sono un buon segno") vanno controllate sull'effetto, non dedotte**: avevo scritto il contrario di quel che succedeva e non l'avevo verificato
- Confrontare i metodi **sullo stesso insieme di dati**: nel test `field_test` la "scala migliore" confrontava insiemi di ore diversi (la scala più stretta scartava i casi difficili) e dava una scelta sbagliata. Meglio il guadagno relativo sullo stesso insieme
- Usare **medie orarie** quando il valore istantaneo oscilla (Livornometeo ±3-6 kn con vento forte): la correlazione con Windfinder passa da 0.70 a 0.88. E validare **per giorno intero** (o per episodio), non per ora: le ore dello stesso evento non sono indipendenti
- Scartare in ingresso i dati che non sono misure: osservazione con orario **dopo** la cattura (righe di previsione), valori **identici** all'ora precedente (congelati). Controllarlo anche dove i dati si visualizzano o si usano (la mappa non lo fa)
- Se un test fallisce, dire se è colpa **del test o del codice** (3 volte su 3 il 27/10 era il test: un conto a mano sbagliato, un arrotondamento, un confronto tra numeri in virgola mobile)

**Quando si propaga una modifica su più file** (es. la stessa correzione su più pagine):
- Non presumere che la stessa modifica vada bene identica ovunque — leggere ogni file, verificare come legge/mostra il dato in questione, prima di copiare la stessa patch

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
| `/mappa2.html` | Fork di mappa.html per confronto affiancato. Sfondo colorato continuo (bilineare), tasti FLOW/OI/GRID. mappa.html originale non toccato | v1.3 |
| `/previsioni.html` | Mappa vento **futuro**, non solo presente. Bottoni a ore intere assolute, due orologi separati (OM sempre da adesso, nostra previsione dall'ultimo predict), sfondo colorato bilineare, tasti FLOW/GRID, export XLS orario completo | v3.2 |
| `/export.html` | Diagnostico — un tasto estrae `forecast_stats`+`predict_history`+`mae_compare`+`bias_matrix`+`model_score`+`decadimento_by_slot` per tutte le zone in un unico JSON, da incollare in chat per analisi | v1.3 |
| `/index2.html` | **Cruscotto**: indice di tutti gli strumenti + stato engine live + tasto "Controlla archivio" | v1.4 |
| `/history-check.html` | **Nuovo (26/8)** — un tasto, una tabella con semaforo verde/rosso per zona: verifica se `getWindHistory` trova quanti dati si aspettava. Nato dall'incidente quota Redis del 26/8 | v1.0 |
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
| `?action=archive_backfill&k=mdi` | **Una tantum** — unisce dentro `predict_archive` tutto quello già presente in `predict_history` (confronto per `generated_at`, non duplica). Serviva a salvare il pregresso di mesi prima che uscisse dalla finestra fissa di 30 senza mai essere stato archiviato. Già eseguita una volta il 12/8 |
| `?action=history_check_get` | **Sola lettura** — legge l'ultimo esito del controllo di consistenza scritto da `getWindHistory` per ogni zona (atteso vs trovato, verde/rosso). Una chiamata batch (`kvMGet`), non una per zona. Incapsulata nel tasto di `history-check.html` |
| `?action=windfinder_raw_check&station=X` | **Sola lettura, invariata apposta**. Mostra il valore grezzo (non convertito) letto dalla pagina Windfinder di una stazione (`livorno_porto`/`barcaggio`/`bonifacio_pertusato`), per confronto diretto col valore mostrato a video — usata per scoprire e confermare il bug m/s-vs-nodi risolto il 28/8 (sezione 16). Resta utile per futuri controlli simili, non applica mai la correzione |
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
| Documenti `.md` | `NOME-vX.Y.md` | `METODOLOGIA-v2.8.md` |
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

---

## 15. Incidente quota Redis e ottimizzazione `getWindHistory` (26 agosto 2026)

### Cosa è successo

Il database Redis (Upstash, piano gratuito, tetto 500.000 comandi/mese) ha raggiunto il limite ed è stato bloccato per un paio d'ore. Durante il blocco, ogni scrittura falliva silenziosamente (il codice ha sempre `try/catch` attorno a `kvSet`/`kvGet`, non crasha — semplicemente non salva nulla). Passato al piano a consumo (Pay as You Go, $0.2 ogni 100K comandi) per sbloccare subito — costo reale trascurabile (~$0.05 nei primi minuti).

### La causa: non l'ultima cosa aggiunta, ma la più vecchia e meno vistosa

Il sospetto naturale è stato prima l'archivio persistente (`bias_archive`, introdotto il 9/8, che raddoppia le scritture per ogni campione stazione) — ma il conto della console Upstash mostrava **733.838 letture contro 128.385 scritture**: le letture dominavano di 5.7 volte. L'archivio non spiegava questo squilibrio.

La causa vera era in `getWindHistory`, funzione presente da mesi, usata da `predict`, `situazione`, `history`, `calcZone`: per ricostruire lo storico vento di una zona, faceva **una chiamata Redis separata per ogni singolo slot da 30 minuti** dell'intervallo richiesto — non una lettura, tante quante le mezz'ore. Per `action=predict` (che chiede sempre le ultime 336 ore = 14 giorni), sono **672 letture singole per una sola chiamata**. Con `predict` che gira 2 volte/giorno per ~20 zone: **~27.000 letture al giorno da questa funzione sola**, che su un mese fanno oltre 800.000 — da sole abbastanza a spiegare quasi tutto lo sforamento, senza bisogno di tirare in ballo l'archivio.

### La correzione

Sostituito il ciclo di N chiamate `kvGet` separate con **una singola chiamata `kvMGet`** (già esistente nel codice, già usata altrove nel progetto — `situazione_get`, `backfill_actuals` — non una tecnica nuova da inventare). Stesso identico dato restituito, nello stesso ordine: cambia solo *come* viene letto da Redis, non *cosa* arriva a previsioni/situazioni/mappa. Una chiamata batch a N chiavi conta come **un solo comando** per Upstash, non N — è la ragione stessa per cui riduce il conteggio.

In parallelo, rallentata anche la scrittura di `bias_archive` (da ogni ciclo di scraping, ~ogni 30 min, a ~1 volta l'ora) — contributo minore rispetto a `getWindHistory`, ma coerente con lo stesso principio.

### Il controllo aggiunto per non ripetere l'errore alla cieca

Non basta ottimizzare una funzione e sperare che funzioni ancora uguale — serve un modo per **verificarlo con un dato, non a occhio**. Aggiunto un controllo di consistenza automatico dentro `getWindHistory` stessa: ogni chiamata confronta quanti slot si aspettava con quanti ne ha trovati davvero, e salva l'ultimo esito per zona (`history_check:<zona>`, non uno storico — si autoaggiorna). Nuova pagina `history-check.html`: un tasto, una tabella con pallino verde/rosso per zona, estraibile per incollare in chat — stesso principio di `export.html`, applicato alla verifica invece che all'analisi.

**Segnato per il futuro, non ancora fatto**: estendere questo tipo di controllo automatico ad altre parti del sistema, non solo `getWindHistory` — l'idea è nata da un incidente specifico ma la logica ("il sistema stesso segnala se sta trovando meno dati del previsto") è generale.

### Lezione di metodo

**Il problema più grande non era l'ultima cosa toccata** — era una funzione vecchia di mesi, mai riguardata perché "funzionava". L'incidente è arrivato non perché qualcosa si sia rotto quel giorno, ma perché un limite esterno (il tetto mensile Upstash) ha reso visibile un'inefficienza strutturale che il sistema si portava dietro da sempre, senza sintomi fino al giorno in cui il conto è arrivato tutto insieme. **Non aggiungere scritture/letture Redis extra senza controllare il budget comandi prima** — l'archivio persistente del 9/8, per quanto giustificato, è stato aggiunto senza quella verifica.

### Un secondo mistero emerso durante la verifica, non ancora risolto

`history-check.html`, il giorno del deploy, mostra quasi tutte le zone (a richiesta 336h) con solo **~20% degli slot attesi** trovati (es. 137 su 672) — un numero che si ripete troppo simile su zone indipendenti per essere casuale. **Barcaggio e Alberese mostrano invece 0 su 672**, diverso dal resto. La spiegazione "colpa del blocco Redis" non regge: il blocco è durato ~2 ore, il traffico del giorno prima (23/8) era nella norma — non spiega un buco di giorni. Nessuna ipotesi solida ancora formulata. Da riprendere quando ci sono un paio di giorni di dati puliti dopo il fix, confrontando gli slot mancanti di una zona col ~20% contro lo stesso periodo di una stazione che li ha tutti — stesso metodo di verifica per confronto già usato altrove in questo progetto (vedi sezione 9-ter, sezione 14).

---

## 16. Due bug esterni, un incidente di deploy (27-28 agosto 2026)

### CARTO rende obbligatoria la chiave API sulle basemap

Il 26/8 CARTO (fornitore dello sfondo cartografico "Voyager" usato da `mappa.html`, `mappa2.html`, `previsioni.html`) ha smesso di servire le sue mappe raster senza una chiave — cambiamento del fornitore esterno, non nostro (segnalato lo stesso giorno da molti progetti indipendenti). Senza chiave, ogni tassello mostra il testo "API KEY REQUIRED" al posto della mappa vera.

**Correzione**: chiave gratuita (5 milioni di richieste/mese, nessuna partita IVA richiesta per un privato), aggiunta come `?key=...` all'URL delle tile — una riga per pagina, tre pagine coinvolte.

**Nota per la memoria organizzativa**: registrandosi per la sola chiave basemap, CARTO crea comunque un account sulla piattaforma completa (Builder, analisi dati) con un **trial di 14 giorni** — irrilevante per il nostro uso, riguarda funzionalità che non useremo mai. La chiave basemap resta gratuita e permanente indipendentemente da quel trial. Non farsi allarmare dal conto alla rovescia mostrato nel pannello.

### Bug Windfinder: un'unità di misura mai verificata, per mesi

**Le tre stazioni coinvolte**: `livorno_porto`, `barcaggio`, `bonifacio_pertusato` — tutte lette dalla stessa pagina-tipo Windfinder (`scrape_web2`), stesso parser, in produzione dal 18 giugno.

**Come è stato scoperto**: durante un controllo di routine su Livorno Porto, il vento letto dal nostro sistema restava piatto e basso (2-4 kn) anche durante una notte in cui OM e AROME concordavano su un episodio di vento forte. Il sospetto iniziale era una media smussata o un valore congelato — nessuno dei due si è rivelato vero.

**Il percorso di verifica, passo per passo** (utile per il metodo, non solo per il risultato):
1. Costruita una diagnostica di sola lettura (`action=windfinder_raw_check`) per confrontare il valore letto dal nostro codice con quello mostrato a video su Windfinder, nello stesso istante
2. Primi confronti: rapporto vicino a **1.94** tra il valore mostrato a video e quello letto da noi — coincide quasi esattamente con il fattore di conversione **m/s → nodi** (1.94384)
3. **Un confronto è andato storto** (direzione diversa, rapporto diverso da 1.94) — invece di forzarlo a incastrarsi nell'ipotesi, è stato scartato come test non valido, e da lì è emerso un secondo problema, indipendente: la pagina Windfinder contiene un'**intera tabella di valori** (probabilmente uno storico/previsione oraria), non un dato singolo — e il parsing originale prendeva "il primo che capita" nella pagina, che si è rivelato essere un valore di esempio di un widget di conversione unità di misura, non l'osservazione vera
4. Tentata una correlazione automatica per orario (cercare tutti i timestamp nella pagina e il vento più vicino a ciascuno) — ha rivelato che nella pagina ce n'è **uno solo**, non tanti come ipotizzato: la struttura presunta era sbagliata
5. **Solo dopo 3 confronti indipendenti in giorni diversi**, tutti con lo stesso rapporto ~1.94, l'ipotesi originale (unità di misura) è stata considerata sufficientemente confermata da giustificare una correzione nel codice

**La correzione**: moltiplicare il campo `ws`/`wg` per 1.94384 in `scrape_web2` e `station_refresh` — il campo era sempre stato m/s, mai nodi come il commento originale (di giugno) affermava senza averlo mai verificato.

**Cosa NON è stato fatto**: lo storico già raccolto da giugno per queste 3 stazioni in `bias_samples`/`bias_archive` resta con l'errore (sottostimato di circa la metà). Nessuna decisione presa su una correzione retroattiva — punto aperto in ROADMAP.

### Lezione di metodo: un'ipotesi scartata per un confronto anomalo non va abbandonata, va isolata

Il punto 3 sopra è il passaggio più istruttivo: un singolo confronto che non torna **non falsifica automaticamente** un'ipotesi che altrove è già confermata con precisione — ma nemmeno va ignorato. Il modo corretto è stato chiedersi *perché* quel confronto specifico non tornava (risposta: non era comparabile, orari diversi, o un secondo problema strutturale non ancora scoperto) invece di scartare l'ipotesi originale o forzarla a spiegare anche il caso anomalo. In questo caso ha portato a scoprire un secondo problema reale (la tabella di valori multipli), non a invalidare il primo.

### Incidente di deploy — non tecnico, ma reale

Durante il caricamento del fix CARTO su GitHub, la sessione di login è scaduta; al rientro, un incollaggio pensato per `mappa.html` è finito nel file `api/engine.js`, sovrascrivendolo con contenuto HTML invece di codice. L'engine è andato in crash totale (500, `FUNCTION_INVOCATION_FAILED`) — non un bug di logica, un file sbagliato al posto giusto. **Lezione**: `action=ping` va controllato dopo *ogni* deploy, non solo quando qualcosa sembra già non funzionare — è l'unico modo per sapere con certezza che il file caricato sia quello giusto, senza fare affidamento sulla sensazione che "il caricamento è andato bene".

---

## 17. Confronto manuale con Livornometeo — obiettivo, metodo, e una lezione sul tempo (29 agosto - 13 settembre 2026)

### L'obiettivo, chiarito solo dopo un fraintendimento

Il primo istinto era trattare Livornometeo come "un'altra stazione da confrontare, tanto per curiosità". **Non è così**: Livornometeo (imboccatura del porto) è il punto di riferimento vero per chi è in mare davanti a Livorno — quello che chi naviga sente e vede. Windfinder (quello che leggiamo, più riparato nel bacino portuale) è solo un modo indiretto per **stimare** quel punto, dato che Livornometeo non è accessibile (`robots.txt` lo vieta, nessuna risposta alle email). Lo scopo finale, non ancora raggiunto, è calcolare un fattore di correzione per avvicinare la stima al punto vero — non far combaciare due stazioni indipendenti per il gusto di farlo.

### Il metodo: confronto manuale, delegato a una chat separata per non consumare immagini

Costruito `confronto-modelli.html` — tabella storico nostro/OM/AROME (da `bias_history`, nessun dato nuovo). Uno screenshot del grafico Livornometeo (letto da M o da Claude, mai in automatico) fornisce il termine di paragone. Per non appesantire la conversazione principale con troppe immagini in sequenza, un tasto genera un prompt autosufficiente da incollare in una chat separata (anche con un modello più economico): quella chat legge lo screenshot e produce un report testuale, che torna nella conversazione principale come testo, non come immagine.

**Lezione su come scrivere istruzioni per un'altra IA senza contesto condiviso**: il prompt generato deve essere completamente autosufficiente — specificare esplicitamente quali linee del grafico leggere (in un caso, "linea chiara = direzione, linea rossa = velocità" ha dovuto essere precisato perché altrimenti ambiguo), correggere equivoci noti in anticipo (un numero in un popup che sembra un grado ma è un id sequenziale), e vietare letture fuori dagli orari richiesti invece di lasciare libertà di interpretazione.

### Un bug scoperto durante l'uso: due orologi diversi con la stessa etichetta

I primi confronti mostravano divari di velocità enormi e sospetti tra noi e il grafico di Windfinder stesso (es. nostro 11.9kn contro il loro grafico a 6-7kn, sulla "stessa" ora) — abbastanza da far pensare a un bug di lettura serio. La causa vera: la tabella etichettava ogni riga con `ts` (quando il nostro cron aveva interrogato la pagina), non con `obs_time` (l'orario che Windfinder stessa dichiara per quell'osservazione) — i due campi divergono sempre di **20-30 minuti**. Su un grafico che cambia rapidamente, uno scarto di mezz'ora tra l'etichetta e il dato reale basta a far sembrare sbagliato un confronto che in realtà stava semplicemente guardando due istanti diversi. **Corretto in v1.5**: la tabella ora usa `obs_time`. Dopo il fix, nostro e Windfinder mostrano lo stesso andamento in modo coerente.

**Lezione generale**: quando un sistema salva più di un campo-orario per lo stesso evento (qui: quando l'abbiamo letto vs quando è successo davvero), va sempre chiarito esplicitamente quale dei due si sta usando per un confronto — un'etichetta sbagliata può produrre un falso allarme identico nella forma a un vero bug di dato, ma con una causa e una correzione completamente diverse.

### Un limite scoperto per esclusione, poi confermato con più forza: le frecce di direzione lette dall'IA leggera sono inaffidabili in un modo specifico

Nei primi due confronti, la lettura della direzione dalle frecce del grafico Windfinder aveva dato sempre lo stesso risultato (NW), mentre sia M sia Claude, guardando lo stesso screenshot, leggevano chiaramente SW, confermato anche da Livornometeo. **Esteso a 4 episodi (13/9)**: la direzione vera è cambiata — SW, poi NE, poi di nuovo NW — ma la lettura delle frecce ha detto **"NW" tutte e 4 le volte**, indipendentemente da quale fosse la direzione reale nello screenshot. Non è un errore casuale che a volte va bene: sembra un'ancora fissa nella lettura di piccoli elementi direzionali da un'immagine, che ignora il contenuto reale dell'immagine. L'unica volta che ha azzeccato (13/9, dove la direzione vera era per l'appunto NW) è coincidenza, non un segno di miglioramento. **Quella colonna resta nel prompt ma va sempre scartata.**

**Un'eccezione importante, distinta dalle frecce**: quando lo screenshot cattura un **tooltip con un numero esatto** (non solo la freccia), la lettura è risultata affidabile — in due occasioni (01/09 alle 10:41, 13/09 alle 17:11) un tooltip preciso sul grafico Windfinder ha confermato il nostro dato quasi alla cifra esatta. La distinzione da tenere: **numero con tooltip = fidarsi, freccia stimata a occhio = scartare sempre**, sono due affidabilità completamente diverse anche nello stesso screenshot.

### Stato attuale (13/9): pattern consolidato, correzione ancora non applicata

Su **4 episodi, in 3 direzioni di vento diverse (SW, NE, NW)**, Livornometeo legge sistematicamente più alto di Windfinder — scarto tipico +3/+7 nodi, mai il contrario. Non è più un'osservazione da un solo giorno: si è ripetuta cambiando condizioni, ed è ormai da trattare come un fatto documentato, coerente con l'ipotesi fisica (imboccatura esposta vs Windfinder riparato).

**Nonostante questo, nessuna correzione ancora applicata** — per due motivi specifici, non per prudenza generica:
1. **Manca un episodio di vento sostenuto/forte.** Tutto raccolto finora è debole-moderato. L'effetto di riparo di una baia spesso si riduce quando il vento supera un certo valore (gli ostacoli "si saturano") — un fattore tarato solo su vento leggero potrebbe sbagliare di grosso proprio quando conta di più (vento forte, dove un errore di stima pesa sulla sicurezza)
2. **Non è stato fatto un vero backtest.** Stimare un fattore sugli stessi punti che useremmo per verificarlo è l'errore già scartato altre volte in questo progetto (sezione 9-ter) — serve dividere i dati, stimare su una parte, controllare sull'altra

I dati grezzi restano in CLAUDE.md, organizzati per episodio. Deciso di non salvarli nel database insieme ai dati automatici: sono letture visive approssimative, qualità diversa dai campioni precisi di `bias_samples` — mescolarli comprometterebbe la distinzione tra le due qualità di dato, principio già seguito altrove nel progetto. Se in futuro emergerà un fattore di correzione verificato, quello sì andrà scritto nel DB come singolo valore calcolato, non i punti grezzi che hanno portato a calcolarlo.

---

## 18. Un giudizio "affidabile" può essere circolare senza sembrarlo (15 settembre 2026)

### Cosa è successo

`decadimento.html`, esteso a tutte le zone tramite il nuovo tasto "Salva tutte le stazioni per Claude", mostrava Livorno con giudizio **verde ("affidabile") su tutti e 5 gli orizzonti** — il record migliore di tutto il sistema insieme a Lido di Camaiore. Prima di accettarlo come una buona notizia, il dato è stato messo in discussione: *"Livorno credo che non sia attendibile in quanto Windfinder non è corretto"*.

### Perché il giudizio era circolare, non falso

Il motore corregge la previsione OM usando come riferimento `bias_station: 'livorno_porto'` (Windfinder). `decadimento.html` verifica quanto la previsione corretta si avvicina... allo stesso dato reale usato per correggerla. Il ciclo si chiude su se stesso: un punteggio alto dice solo *"il sistema replica fedelmente la fonte a cui è stato tarato"*, non *"il sistema rappresenta bene il vento vero di quella zona"*. Sono due affermazioni diverse, e la seconda richiederebbe un termine di paragone **indipendente** dalla correzione stessa — che qui non c'è (Livornometeo, il termine di paragone vero, resta inaccessibile in automatico).

Il problema è aggravato dal fatto che sappiamo già, dalla sezione 17, che questa specifica fonte (Windfinder/Livorno Porto) è sistematicamente più bassa del punto di riferimento vero — quindi il "verde" qui non è neutro, rischia di nascondere proprio l'errore che stiamo cercando di misurare altrove.

### Quanto è esteso il problema — controllato, non solo sospettato

Verificato leggendo `bias_station` per tutte le 26 zone in `engine.txt`: solo **3** usano una fonte Windfinder (`livorno`→`livorno_porto`, `barcaggio`→`barcaggio`, `bonifacio`→`bonifacio_pertusato`). Le altre ~22 usano CFR o MeteoNetwork, fonti indipendenti dal problema — il giudizio di `decadimento.html` resta valido per quelle. Interessante: **Barcaggio era già "rosso"** nel giudizio nonostante lo stesso problema di circolarità — il suo problema è quindi un altro, non ancora capito, aggravato ma non causato da questo.

### Lezione di metodo

**Uno strumento di verifica che usa (anche indirettamente) la stessa fonte usata per la correzione non sta misurando l'accuratezza — sta misurando l'autoconsistenza.** Le due cose sembrano identiche quando lo strumento dà un giudizio "buono", ed è proprio lì che l'errore passa inosservato più facilmente: un punteggio alto non genera il sospetto che un punteggio basso genererebbe. Vale la pena, per ogni nuovo controllo di qualità costruito in futuro, chiedersi esplicitamente: *la fonte con cui sto verificando è la stessa (o deriva dalla stessa) di quella con cui ho corretto?* — prima di fidarsi di un risultato positivo.

**Non è stata scritta nessuna correzione di codice per questo** — la scoperta cambia come *interpretare* un giudizio esistente, non richiede con urgenza un intervento. Il percorso per migliorare davvero l'accuratezza di Livorno resta quello già aperto con Livornometeo (sezione 17, D16) — non un fix nuovo e separato.

---

## 19. Propagare una correzione: due lezioni dal giro su bussola/mappa/previsioni (17 settembre 2026)

### Stesso sintomo, due bug completamente indipendenti

Dopo aver applicato la correzione di riferimento Livorno (+4.2kn) nell'engine, il bottone "Aggiorna" della stazione in `index.html` continuava a non funzionare. La prima ipotesi (e il primo fix, in `station_refresh`) era corretta ma **insufficiente**: `livorno_porto` mancava davvero dalla lista delle stazioni conosciute da quell'action. Ma dopo il deploy, il bottone continuava a non rispondere. La causa vera era un secondo bug, scollegato dal primo: il bottone nell'interfaccia chiamava ancora l'id abbandonato `livorno_cfr` — un residuo della migrazione di luglio (quando Livorno CFR, un mareografo, fu sostituita da Livorno Porto/Windfinder) mai ripulito dal codice del bottone, nonostante l'etichetta a video fosse già stata aggiornata allora.

**Lezione**: quando un fix non risolve il sintomo, non significa che il fix fosse sbagliato — può semplicemente non essere l'unica causa. Vale la pena verificare il fix isolatamente (qui: la action da riga di comando rispondeva correttamente) prima di concludere che l'ipotesi originale fosse falsa.

### Propagare una correzione non è mai "cercare lo stesso pattern ovunque" — ogni pagina va letta, non assunta

La stessa correzione (mostrare il valore Livorno aggiustato) ha richiesto risposte diverse in pagine diverse, scoperte solo leggendo il codice di ciascuna, non presumendole uguali:
- **`previsioni.html`**: zero codice necessario — leggeva già il campo corretto lato server
- **`mappa.html`**: 5 punti diversi (popup principale, di ripiego, rate-limit, tasto Aggiorna, particelle animate) — nessuno di questi collegato agli altri, ognuno con la propria copia della logica di visualizzazione
- **`mappa2.html`**: stessi 5 punti di `mappa.html` (fork quasi identico), ma verificati uno per uno anziché assunti identici — utile, perché il commento di chiusura del file si è rivelato diverso (un secondo bug di lunga data, mai notato: diceva "MAPPA" invece di "MAPPA2")

**Lezione**: "propagare una correzione" è un'attività di lettura del codice esistente, non di applicazione meccanica dello stesso pattern — ogni pagina/percorso va aperto e verificato, anche quando sembra ovvio che debba comportarsi come un'altra.

### Un effetto collaterale del browser, non un bug nostro, ma comunque nostra responsabilità gestirlo

Aggiungere marker interattivi a `previsioni.html` (per D20) ha esposto un bug preesistente e mai notato: ridimensionare un elemento `<canvas>` lo svuota sempre, anche quando le dimensioni non cambiano — è un comportamento del browser, non un errore di programmazione. Il codice di `previsioni.html` ridimensionava il canvas del colore di sfondo a ogni spostamento della mappa, ma non lo ridipingeva più. Prima dei marker, gli spostamenti della mappa erano relativamente rari (solo quando l'utente pan/zoomava attivamente); dopo, ogni tocco su un marker faceva spostare automaticamente la mappa per far entrare il popup in vista (comportamento di default di Leaflet), moltiplicando le occasioni in cui il bug si manifestava — da "raro, mai segnalato" a "capita al secondo tocco".

**Lezione**: una funzionalità nuova può rendere visibile un bug vecchio senza averlo causato — il fatto che il sintomo sia comparso "dopo" una modifica non implica che la modifica ne sia la causa diretta, vale la pena controllare se il nuovo codice ha solo reso più frequente un problema di innesco già presente.

---

## 20. Il primo episodio di vento forte mette in crisi la correzione fissa — e un innesco quasi circolare scoperto per tempo (8 ottobre 2026)

### Una correzione tarata su un regime non si estende automaticamente a un altro

La correzione di riferimento Livorno (+4.2kn) era stata calcolata su 22 punti raccolti con vento debole-moderato — esplicitamente provvisoria, con l'avviso scritto fin dall'inizio che mancava un episodio di vento sostenuto per confermarla. Il primo episodio vero (8/10) ha confermato esattamente il rischio previsto: lo scarto reale saliva a una media di ~15kn (non 4.2), e il rapporto tra i due non era nemmeno costante (1.6×-4× a seconda del momento) — scartando anche l'ipotesi più semplice di ripiego (un moltiplicatore fisso al posto di un addendo fisso).

**Non si tratta solo di un numero da aggiustare**: la stessa identica correzione automatica già esistente da mesi (`predict_bias`) è tarata sulla stessa fonte (Windfinder) che ora sappiamo attenuare il segnale proprio quando il vento sale — quindi il problema non è isolato al dato "live" mostrato in bussola/mappa, probabilmente riguarda anche le previsioni stesse generate per quella zona.

### Un innesco per un avviso rischiava la stessa circolarità già vista altrove

Proposto un avviso "vento forte, dati da verificare" per Livorno, con OM come innesco (sembrava un segnale indipendente dal problema che stiamo misurando). Controllando contro gli stessi dati dell'episodio appena raccolto, **OM si è rivelato soffrire dello stesso problema di sottostima nello stesso momento** — un avviso tarato su OM non sarebbe mai scattato proprio quando serviva di più. Stessa famiglia di errore già vista nella sezione 18 (uno strumento di verifica che condivide la fonte con quello che sta verificando non misura quello che sembra) — qui per fortuna **controllato prima di costruire**, non scoperto dopo.

**AROME è emerso, nello stesso episodio, come segnale preliminarmente più vicino alla realtà** (21-22kn calcolati dai dati raccolti, contro Livornometeo che segnava 25-30 nello stesso momento) — ma resta un solo episodio, non ancora una base per decidere con sicurezza.

### Lezione di metodo

**Prima di scegliere un innesco/segnale per qualcosa, controllarlo contro gli stessi dati che ha motivato la domanda** — non presumere che una fonte "diversa" sia automaticamente indipendente dal problema. OM sembrava un'alternativa ovvia a Windfinder, ma condivideva lo stesso punto cieco nello stesso momento. Il controllo è costato un confronto in più con dati già raccolti, non una nuova raccolta — un controllo economico che ha evitato di costruire uno strumento inutile.

**Deciso di non agire su un solo episodio**, né per la correzione né per l'avviso — stesso principio applicato in tutto questo progetto fin dall'inizio (split mattina/pomeriggio, decadimento esponenziale, il +4.2 stesso). Un episodio netto e chiaro resta comunque un solo punto dati.

---

## 21. "Chi visita il sito" conta più di "quanto è automatico lo script" — la distinzione che ha sbloccato Livornometeo (9-10 ottobre 2026)

### La domanda che sembrava la stessa di sempre, e non lo era

Per settimane, ogni proposta di leggere Livornometeo in automatico era stata rifiutata con lo stesso principio: il sito vieta esplicitamente l'accesso automatico (`robots.txt`), e questo non cambia a seconda della tecnica usata (testo o immagine, scraper semplice o un'IA che "guarda lo schermo" — anche quest'ultima, proposta e scartata il 9/10, resta comunque un programma che visita il sito senza una persona davanti allo schermo in quel momento).

M ha proposto una variante che sembrava la stessa cosa in superficie — "uno script che estrae dati premendo un tasto" — ma con un dettaglio decisivo mai messo a fuoco prima: **lui avrebbe già avuto il sito aperto, nel suo browser, come persona**. Lo script sarebbe girato *dopo*, sulla pagina già caricata per la sua visita — non una nuova richiesta al sito, nessuna "visita" che il sito stesso non avesse già concesso.

### La distinzione tecnica che separa i due casi

Il `robots.txt` regola **chi può chiedere la pagina al server** (nuove richieste HTTP — crawler, scraper, bot). Un **bookmarklet** (uno script eseguito nel browser, su una pagina già caricata da una visita umana) non fa nessuna richiesta nuova — legge solo quello che il browser ha già ricevuto. Stesso principio per cui "ispeziona elemento" o un lettore per non vedenti non violano nulla: leggono quello che è già arrivato sullo schermo della persona, non vanno a prenderlo da soli.

**La domanda giusta da farsi, generalizzabile oltre questo caso**: *la richiesta al server l'ha fatta una persona, in un momento in cui c'era davvero davanti allo schermo?* Se sì, qualunque script giri *dopo*, sulla pagina già lì, resta dalla parte giusta — indipendentemente da quanto sia automatizzata o sofisticata la lettura che segue (fino a includere un'IA capace di leggere un grafico). Se la richiesta stessa parte da un programma senza una persona a monte, nessuna tecnica di lettura successiva lo rende accettabile.

### Perché vale la pena scriverlo come principio, non solo come eccezione

Il rischio concreto era opposto a quello affrontato finora: non "cedere per comodità" (scartato subito, giustamente, nelle proposte precedenti), ma **continuare a rifiutare qualcosa di legittimo** per non aver distinto con abbastanza precisione *cosa* rendeva problematiche le proposte precedenti. Il principio corretto non era "mai nessuno script su Livornometeo" — era "mai uno script che visita il sito al posto di una persona". Una volta isolato il principio vero, la soluzione corretta (il bookmarklet) è diventata ovvia, e ha sbloccato un intero filone di lavoro (D24) che era rimasto fermo per settimane.

---

## 22. Poche letture, molte formule: cosa ha insegnato l'analisi della correzione Livorno (19-22 ottobre 2026)

### La storia in breve

Con 8 letture di Livornometeo accoppiate a Windfinder sembrava che un fattore proporzionale ("×2") battesse il "+4.2" fisso (errore 3.8 contro 4.1 kn, e 2.3 contro 3.3 sui sei casi "normali"). Con 23 letture e validazione "uno fuori" tutte le forme provate (additiva, proporzionale, mista) stanno intorno a 3.0 kn, il "+4.2" compreso: nessuna batte le altre in modo misurabile. La differenza vista con 8 punti era rumore, in gran parte dovuta a due letture che andavano nell'altra direzione. **Deciso di lasciare il +4.2** (D22) e di ripetere il test a ~60 letture.

### Lezioni

1. **Con pochi punti, ogni forma "sembra" meglio dell'altra.** Dichiarare il numero di punti accanto a ogni risultato e aspettare prima di cambiare la formula in produzione (stesso principio di sempre, già applicato al +4.2 stesso il 15/9).
2. **La validazione "uno fuori" costa poco e smonta le illusioni**: ogni forma adattata va provata sul punto che non ha visto. In questo caso ha reso tutte le forme equivalenti.
3. **Non definire le fasce sul valore da prevedere.** Le tabelle "per fascia di Livornometeo" che avevo mostrato (con vento debole il modello sopra, con vento forte sotto) hanno un artefatto: se le fasce sono scelte sul valore vero, l'errore sembra crescere con esso anche quando non è così. Vale per la mia frase "AROME comprime i valori". Le fasce vanno fatte su ciò che il sistema conosce davvero (il dato della stazione, il modello).
4. **Disaccordo non è errore.** Il report sulla direzione dei modelli (16.361 confronti, 23 stazioni) mostra quanto spesso modello e stazione non concordano (50% entro 45° sotto 4 kn), non chi ha ragione. In calma la direzione di una stazione può essere rumore quanto quella di un modello. Per decidere cose come il peso della direzione nell'OI serve un riferimento terzo, non un altro confronto a due.
5. **Il sapere di M sul posto vale più delle mie ipotesi sul codice.** Vada ha la direzione sbagliata sempre: io avevo pensato a un parser mai verificato, M ha detto che la stazione è interna e probabilmente coperta da alberi. La seconda spiegazione è fisicamente più plausibile; il sospetto sul parser resta in secondo piano. Per Cap Pertusato (troppo in alto, effetti della costa) i dati hanno poi mostrato esattamente "in certe condizioni": direzione sbagliata con vento debole-moderato, giusta col forte.
6. **Controllare cosa usa davvero un componente prima di discuterne.** M pensava che AROME alimentasse la mappa e che "lavorasse troppo ad alto livello": la mappa usa Open-Meteo standard su una griglia da 25 km, e AROME compare solo nei confronti statistici. Leggere il codice ha spostato la discussione dal modello sbagliato a quello giusto.
7. **Prima di toccare qualcosa, vedere cosa c'è già in quel posto.** Lo scambio dei marker non si vedeva perché il cerchio di zona stava esattamente sulle stesse coordinate e sopra. Un controllo sulle coordinate e sull'ordine di sovrapposizione avrebbe evitato due giri.
8. **Una frase ambigua si chiede, non si interpreta.** "Nella bussola lasciamo la correzione" e "il bottone" hanno avuto due letture: ho scelto una e l'ho presentata come decisione di M. Una domanda sarebbe costata una riga; l'errore due deploy.



---

## 23. Il circuito che annullava la correzione, e cosa dicono le stazioni da sole (22-27 ottobre 2026)

Lavoro di cinque giorni su Livorno e sulle altre tre stazioni manuali. Il risultato pratico è un fattore di correzione per direzione, ma le lezioni che restano sono sul **metodo**.

### Cosa è successo

1. **Con 36 ore di medie orarie il quadro cambia.** Il 22/10, con 23 letture singole, nessuna forma batteva il +4.2. Con le medie orarie delle serie (correlazione 0.88 con Windfinder invece di 0.70) il rapporto Livornometeo/Windfinder risulta proporzionale e diverso per direzione: ×2.2 da Sud-Sud-Ovest, ×1.6-1.7 da Ovest-Nord-Ovest, ×1.5 da Nord-Est/Est. Validato un giorno fuori: +4.2 → 4.1 kn (7.5 sulle ore forti), per direzione → 2.4 (3.4). **Non era una contraddizione con il 22/10: la risposta dipende dalla qualità del dato.** Il rumore del valore istantaneo nascondeva la struttura.
2. **Il circuito di bias.** Guardando dove la previsione viene riletta, si è visto che `backfill_actuals` calcola il bias come stazione meno `forecast_hN`, cioè la previsione finale, compreso il +4.2. Per Livorno la stazione è Windfinder: il sistema vedeva "troppo alto di 4.2" e imparava a toglierlo. Dal 15/9 la correzione è stata riassorbita dopo una trentina di previsioni (dedotto dal codice, non verificato sui dati reali). Corretto: i confronti usano la previsione **nella scala della stazione** (`forecast_hN_wf`, o `forecast_hN` meno l'offset per i vecchi record).
3. **Dati che non sono misure.** Sette campioni Windfinder con `obs_time` 79 minuti nel futuro (righe di previsione), stazioni con 5-19% di ore ripetute identiche (Follonica 19%). I conti li scartano; la mappa no.
4. **Cosa fanno le stazioni da sole.** Test "una fuori alla volta" su 21 stazioni e 30 giorni (`field_test`): l'interpolazione ricostruisce il vento di una stazione quasi come OM (5.33 contro 5.27 kn di errore del vettore), la correzione di OM con le stazioni vale −5% fino a circa 30 km, su AROME nulla. Solo il 17% dell'alto Tirreno è entro 15 km da una stazione. Quindi: una mappa estesa dalle sole stazioni non ha senso; modelli + stazioni come seconda opinione sì.

### Lezioni

1. **Quando si corregge a valle, cercare chi rilegge a monte.** Un valore salvato e usato sia per mostrare sia per misurare l'errore crea un circuito: la correzione sembra un errore e viene tolta. Si salva il valore prima della correzione e si confronta in quella scala.
2. **Prima di dire che una forma non regge, chiedersi se i dati sono abbastanza buoni per distinguerla.** Il 22/10 la conclusione era giusta *con quei dati*; con dati migliori è cambiata. Non rimproverarsi né difendere la prima conclusione: dirlo e aggiornarla.
3. **La mia previsione sul risultato del test era sbagliata in parte.** Mi aspettavo che l'interpolazione perdesse ovunque contro OM; tra 15 e 30 km invece vince (3.55 contro 4.10 kn). Dichiararlo quando i dati lo smentiscono, e non tenere la previsione.
4. **Un test da calibrare sui dati veri, non solo sugli scenari inventati.** I collaudi sintetici hanno trovato errori nei conti, ma non il difetto della scelta della scala (insiemi diversi): è saltato fuori solo leggendo il risultato reale. Leggere sempre un risultato vero prima di fidarsi di una sintesi come "la L migliore".
5. **I confronti si fanno sullo stesso insieme.** Se un parametro cambia quali ore entrano nel confronto, l'errore non è confrontabile.
6. **Il numero di eventi indipendenti conta più del numero di ore.** 36 ore sono tre episodi principali: i fattori per settore reggono nel test un giorno fuori, ma la prova più dura (prevedere il 25/10 senza averlo visto) sbaglia ancora di 4.4 kn. Si dice "provvisorio" e si continua a raccogliere.
7. **Contare la copertura prima di proporre una mappa.** Un calcolo di mezzo minuto (quanta parte del mare è entro 15/30/50 km da una stazione) risponde meglio di un ragionamento.
8. **Le domande si capiscono prima di rispondere con codice.** "Si può fare?" è una domanda; la costruzione del test di ricostruzione del campo non era richiesta. Il rischio è costruire la cosa sbagliata o far deployare per niente.
9. **Un nome strano non è un indizio.** Un file dal nome `vuoto.zip` era uno scherzo di M, con dentro i quattro file giusti: aprirlo e guardare era il comportamento giusto, i commenti sospettosi no.
10. **Le coordinate ufficiali battono le stime.** A Livorno la posizione dichiarata dal sito coincideva con il vecchio marker, non con quello messo il 19/10 su indicazione di M (che si basava sul porto in generale): 600 metri. Anche con decisioni prese in buona fede, un dato esterno nuovo può ribaltarle: dirlo con i numeri e lasciar decidere.


---

## 24. Le previsioni ferme per 19 giorni, per un mio cambio di modello non provato (28 ottobre 2026)

Una settimana di lavoro su Livorno e sulle stazioni manuali ha fatto emergere, per caso, che **dal 9-10 ottobre nessuna previsione veniva salvata** in nessuna zona. La causa era mia.

### Cosa e' successo

1. **Il cambio.** Nella v2.14.29 (9-10/10) ho sostituito Haiku 4.5 con Haiku 5.5 in `predict fast=1` e in `agent`. Non ho provato cosa restituiva `predict` con il modello nuovo.
2. **Il guasto.** `predict` leggeva `aiData.content[0].text`. Con Haiku 5.5 il primo blocco della risposta non e' di testo: `text` era `undefined`, e `text.match(...)` lanciava un'eccezione prima del salvataggio. Risposta del servizio: 500 in meno di 4 secondi, `Cannot read properties of undefined (reading 'match')`. Sonnet (senza `fast`) funzionava.
3. **Gli effetti.** Storico (`predict_history`), archivio (`predict_archive`) e bias fermi 19 giorni; i lavori di cron-job.org restavano programmati e fallivano; le chiamate all'AI venivano fatturate (circa 0.12 USD al giorno, **costante**: sembrava tutto in ordine).
4. **Come e' emerso.** Il nuovo `forecast_monitor` dava 0 coppie con 30 record e 1471 punti di serie; `predict_history` di Livorno e di Viareggio finiva il 9/10; il log di Bocca d'Arno mostrava il 500; una chiamata a mano con `fast=1` ha dato lo stesso messaggio.
5. **La correzione (v2.14.43).** Testo dal primo blocco di tipo `text`; `fast=1` prova Haiku 5.5 e poi Sonnet 4.6; se non c'e' testo non si salva niente (prima si salvava un record vuoto) e si risponde 502 con i dettagli; il record porta `model_used` e `ai_fallback`. Collaudata end-to-end e **riproduzione del guasto sulla versione precedente** (stesso messaggio). Verificata in produzione: `model_used: claude-haiku-5-5`, `ai_fallback: false`.

### Lezioni

1. **Un cambio di modello e' un cambio di contratto.** Il formato della risposta non e' una garanzia. Si prova il percorso che la elabora, con risposte finte in tutti i formati, e si controlla l'effetto dopo il deploy leggendo l'ultimo record scritto, non il codice di risposta di una chiamata.
2. **Le metriche di costo non sono segnali di salute.** Quel che costa non e' quel che viene salvato. Il segnale giusto e' la data dell'ultimo record di ogni uscita.
3. **Un guasto che sta in mezzo puo' durare a lungo se nessuno guarda l'uscita.** M non usava in quel periodo le parti dell'app che mostrano le previsioni, i lavori risultavano "programmati", e nessun controllo automatico confrontava la data dell'ultima previsione con adesso. Un controllo semplice (previsione piu' recente piu' vecchia di 12 ore = allarme) avrebbe segnalato il fermo il giorno dopo. Da valutare (D39).
4. **Non registrare quando manca il dato.** Salvare un record vuoto (`Errore risposta AI`) non e' meglio di non salvare: inquina lo storico. Ora un errore dell'AI non scrive niente e restituisce i dettagli.
5. **Ritorna una cosa utile: una risposta "zero" va indagata.** Il monitoraggio senza coppie e' stato piu' utile di qualunque numero.
6. **Dichiarare l'errore proprio, con i fatti.** Ho scritto a M che il cambio era mio, con la data, la causa, la durata e cosa non si recupera. Non e' una questione di tono: M deve sapere quali dati mancano per poter decidere.
7. **Il ripiego va dichiarato nel dato.** Il ripiego su Sonnet scrive `ai_fallback: true`, cosi' si vede se scatta spesso (e se Haiku 5.5 non basta) invece di nascondere il problema dietro un'uscita che sembra normale.
8. **Prove con strumenti di lettura.** Una chiamata uguale a una gia' fatta puo' tornare dalla memoria dello strumento: URL con parametro nuovo. Un'azione lenta va in timeout: usare controlli leggeri (qui, l'ultima previsione di un'altra zona) per restringere il problema.


---

## 25. La validazione che ha bocciato la regola candidata (28 ottobre 2026)

L'idea di partenza era una "mappa più estesa" corretta con i dati delle stazioni. In una giornata di lavoro siamo passati da un campo ricostruito dalle sole stazioni (`field_test`), a un salvataggio orario dei modelli sui punti delle quattro stazioni manuali, a tabelle orarie, a una **regola candidata** (OM sottostima il vento debole di circa 2 kn), alla **sua validazione**, che non ha retto.

### Cosa e' successo

1. **Salvataggio dei modelli e recupero del passato.** OM (`best_match`) e AROME (`arome_france`) sui punti ufficiali, ogni ora, agganciati a `scrape_web2`; passato dall'archivio (stessa versione AROME del salvataggio orario: la HD sarebbe stata un modello diverso). Quattro stazioni, 130-132 ore ciascuna.
2. **Tabelle orarie.** Con le fasce scelte sul valore osservato: Livorno anomalo, Capraia e Golfo Aranci ben rappresentate, Rosignano a meta' (Sud-Ovest forte sottostimato), AROME migliore di OM in tre stazioni su quattro.
3. **Fasce sul valore del modello.** Rovesciano un segno: le calme risultavano sovrastimate (0.6) con le fasce sull'osservato, e risultano sottostimate da OM (1.4-1.7) con le fasce sul modello. Provato con un modello fatto di solo rumore: le fasce sull'osservato danno una "sovrastima" apparente anche senza nessun difetto.
4. **Validazione un giorno fuori (289 ore, 6 giorni).** Nessuna correzione generale migliora l'errore su tutte le ore: OM 3.1 → 3.1-3.2, AROME 2.6 → 2.8-2.9. L'unico guadagno vero e' la correzione per stazione di Livorno su OM (5.0 → 3.5 kn), cioe' quello che gia' facevamo con Windfinder × fattore.

### Lezioni

1. **Il bias medio non e' l'errore.** Una correzione che toglie il bias medio puo' lasciare invariato l'errore sulle singole ore, se questo e' dominato da errori casuali (tempi, posizioni). Il bias si corregge con un fattore; l'errore casuale no. Valutare sempre l'errore medio assoluto.
2. **Una regola candidata non e' una regola.** L'ho presentata con tutte le cautele, ma prima di un test che la mettesse alla prova. Si propone dopo. E non e' una sconfitta: il test ha impedito di correggere qualcosa che peggiorava (AROME fino a −31% sulle ore forti).
3. **La scelta della variabile su cui si fanno le fasce cambia il risultato, e va fatta su quella che l'app conosce.** Fasce sull'osservato: effetto statistico (il modello sembra troppo alto con vento basso e troppo basso con vento forte). Fasce sul modello: ritorno verso la media, che fa parte della correzione ottimale. Chi legge i numeri deve sapere con quale delle due sono calcolati.
4. **Una colonna selezionata sull'osservato e' un trabocchetto anche nei test.** "Ore deboli" (osservato <6 kn) punisce ogni rialzo per costruzione, e faceva sembrare la correzione molto peggiore di quanto fosse. Il verdetto si legge sull'insieme di tutte le ore.
5. **Quando il test e' senza fuga di informazione lo si dimostra.** Un giorno con un comportamento che negli altri non c'e' (fattore 3): la correzione non puo' adattarsi, l'errore non scende. Senza una prova cosi', "un giorno fuori" resta una dichiarazione.
6. **Fermarsi e' una conclusione, con dei criteri per riaprire.** "Resta solo accumulare dati" non e' un "finito": si riapre con almeno 15 giorni, con serate e notti, con piu' episodi forti; lo strumento (`manual_hourly&station=all`) e' gia' pronto e la validazione e' in fondo alla risposta. Il criterio di successo e' scritto: errore su tutte le ore sotto quello grezzo, non solo il bias.
7. **Una sola chiamata per tutto.** `station=all` evita di far incollare quattro risposte lunghe: le richieste a M vanno ridotte al minimo.


---

## 26. Il 3 novembre 2026: controllo di salute, estensione del fermo, Orbetello e la mappa, archivio

Una giornata di lavori diversi, con tre cose che si tengono insieme: **vedere in tempo se qualcosa si rompe**, **non correggere più del necessario**, e **decidere cosa conservare in base a cosa il sistema rilegge**.

### Cosa e' successo

1. **Il controllo di salute** (`action=health`) e' nato dal fermo di ottobre: nessun controllo aveva visto che le previsioni non si salvavano. Controlla la data dell'ultima previsione di ogni zona rispetto all'ultimo giro dovuto (07:15 e 13:15, tolleranza 90 minuti), le fotografie di zona, il salvataggio orario dei modelli e il ripiego su Sonnet. Il primo giro reale ha trovato due cose vere (zone attive senza previsioni per scelta; Barcaggio e Alberese senza fotografie) e ha confermato che le previsioni sono guarite.
2. **L'estensione del fermo e' stata corretta**: dal dettaglio del controllo (modello usato per zona) e dallo storico di Orbetello si e' visto che il guasto toccava solo le 13 zone con Haiku 5.5, non tutte. Avevo generalizzato da due zone dello stesso gruppo.
3. **Orbetello e la mappa**: con le fasce di vento della stazione (`model_dir_report`) la sua direzione e' inaffidabile con vento debole (16% entro 45° da OM sotto i 4 kn) ma buona dal moderato in su. Una prima correzione della sola direzione (v1.15) non bastava, perche' la velocita' si spandeva con peso pieno; la seconda (v1.16) ha reso la fiducia una rampa sulla velocita' della stazione. Nel mezzo ho rinunciato a una regola generale, perche' avrebbe riaperto una decisione precedente.
4. **Archivio e statistiche**: si e' visto che tutto e' finestra mobile e che l'irripetibile e' poco (serie delle stazioni manuali, archivio delle stazioni, previsioni con verifica). Si e' deciso un archivio freddo e dei record compatti letti dal motore; la scheda mensile aspetta fino a quando il sistema potra' usarla.

### Lezioni

1. **Un campione rappresenta il gruppo da cui e' preso, non tutto.** Conoscere come il sistema divide i casi (due gruppi di zone con due modelli, due percorsi, due lavori) e' il primo passo di ogni verifica.
2. **I commenti del codice sono la memoria delle decisioni.** Prima di toccare una regola condivisa va letto cosa e' stato deciso e perche': stavolta mi ha evitato di rompere un fix di luglio.
3. **Una correzione e' una forma, non un numero.** Tetto fisso, rampa, soglia: la forma deve combaciare con dove l'errore e' dimostrato. Il collaudo giusto e' doppio: l'effetto voluto (il caso reale degli screenshot) e l'invarianza dove non deve cambiare niente (300 casi casuali identici al codice originale).
4. **Un segnale di salute vale solo se arriva a chi puo' agire.** Per questo la risposta e' 503 per cron-job.org e `soft=1` per chi legge con strumenti che scartano gli errori. E il primo giro va guardato con attenzione, perche' spesso racconta la configurazione vera.
5. **Si conserva in base a cosa e' irripetibile e a cosa il sistema rilegge.** Irripetibili: osservazioni locali e nostre previsioni. Riscaricabili: modelli e rianalisi. Un dato che nessuno rilegge e' utile solo come materia prima per una prova futura: costruire prima la prova, poi l'uso.
6. **Dire cosa non e' verificato.** Le istruzioni date a memoria (i parametri di un lavoro) vanno lette nel codice prima; e le ipotesi sulle cause (l'Argentario, un'altra copia del motore) vanno scritte come ipotesi finche' non c'e' un dato.


---

## 27. Il 4-6 novembre 2026: un avviso che arriva davvero

Il controllo di salute del 3/11 era pronto, ma da solo non basta: serve che qualcuno si accorga. Questa parte e' la storia di come si e' passati da un avviso "configurato" a uno che arriva.

### Cosa e' successo

1. **L'avviso di cron-job.org non arriva.** Il lavoro `health` e' stato creato il 4/11. Per provare l'avviso M ha fatto fallire apposta un lavoro verso un indirizzo inesistente: errore registrato, nessuna email. Le impostazioni erano giuste, il canale c'era, la posta di registrazione era arrivata, e non esiste un log delle esecuzioni. Nessuna email nemmeno in ottobre.
2. **L'avviso parte dal motore.** Telegram (bot creato da M con @BotFather, due variabili in Vercel: token di tipo Secret, chat di tipo Config). Solo sul passaggio di stato, con promemoria ogni 6 ore e messaggio di ripristino. Il messaggio di prova e' arrivato il 6/11.
3. **Il collaudo ha trovato un errore di logica**: l'ora dell'ultimo avviso ereditata dall'episodio precedente. E' stato corretto prima del deploy.
4. **Le fotografie di Barcaggio e Alberese** sono tornate con due lavori nuovi; nell'occasione e' emerso che i lavori `cron_snap` girano una volta all'ora, non ogni 30 minuti come avevo scritto.

### Lezioni

1. **Un'impostazione giusta non e' un avviso che funziona.** Si prova con un guasto simulato, e si controlla che il messaggio arrivi.
2. **L'avviso deve partire da chi sa.** Il motore conosce lo stato a ogni controllo: affidare la notifica a un servizio esterno di cui non si vede il log aggiunge un punto cieco.
3. **Un segnale che suona sempre non segnala niente.** Per questo i messaggi partono sul passaggio di stato e gli avvisi non gravi no; e per questo il punto esclamativo in app mostrera' solo gli errori.
4. **Un limite va detto.** Se l'intero progetto non risponde, il motore non puo' avvisare di se': per quel caso serve una seconda rete fuori dal motore (l'indicatore in app, o un controllo esterno).
5. **Le frequenze e i conteggi si controllano con i numeri reali**, non con quello che il codice consente.
6. **I segreti non passano in chat.** Il token e il segreto dei lavori si mettono solo nelle variabili di Vercel e negli indirizzi dei lavori; chi aiuta spiega dove va ogni cosa (tipo Secret o Config, quale variabile) senza mai vederlo.


---

## 28. Il 6 novembre 2026 (sera): un valore solo per punto

M ha fissato una regola per tutta l'app: **un numero sulla mappa e' o il dato vero, o quello ricalcolato, o (se non c'e' altro) quello del modello; e il popup di quel punto dice lo stesso numero.** Il lavoro e' stato rendere vera quella frase, e poi correggere due errori miei trovati da M.

### Cosa e' successo

1. **La regola.** M ha visto, accanto alle frecce di Livorno, 12 e 17, mentre il popup diceva 17.3. Dal codice: la freccia di zona usava lo snapshot senza il fattore, il punto stazione e i popup usavano la stima; il popup di griglia apriva la cella piu' vicina al click e non la freccia disegnata; i popup di stazione leggevano il valore al click e la freccia no.
2. **La soluzione.** Una funzione sola per il valore di zona (`zoneBest`), usata da freccia, numero, icona e popup; un popup di zona unico; la scelta della freccia disegnata per il popup di griglia; il riallineamento di freccia e numero quando un popup legge un dato piu' fresco; numeri bianchi (vero o ricalcolato) e azzurri (modello). Collaudo con le funzioni vere, confrontando il numero disegnato con quello del popup per ogni tipo di punto.
3. **Due errori miei nella prima versione**, trovati da M cliccando in mezzo al mare a destra di Gorgona: il popup diceva "Punto stazione (dato vero)" ma mostrava il valore di modello della cella del punto stazione; e quando ho cercato la causa ne ho scritta una (nessun dato vivo) che i dati hanno smentito: la stazione dava letture fresche.

### Lezioni

1. **Una regola di coerenza si realizza elencando tutti i punti del codice che mostrano quel dato**, non correggendo quello che si e' visto. Tre incoerenze su quattro erano in punti che non erano quello dello screenshot.
2. **Un'etichetta e' una promessa.** Cambiarla senza controllare il dato sotto e' piu' grave di non cambiarla: "dato vero" su un valore di modello e' un'informazione falsa dentro un'app che fa della precisione il suo scopo.
3. **I casi speciali non devono contagiare quelli generici.** Una cella costruita per far disegnare la freccia di una stazione non deve essere la risposta a un click libero in mare.
4. **Verificare prima di attribuire una causa.** Un'ipotesi plausibile (il dato non c'era) e' stata smentita da un controllo di tre minuti, e se non l'avessi scritta come fatto non sarebbe stato necessario correggerla.
5. **Il test deve contenere il caso che l'utente ha trovato.** Il click a destra di Gorgona e' ora un caso del collaudo (con dato vivo, senza dato vivo, senza celle normali), cosi' non puo' tornare in silenzio.


---

## 29. Il 10-13 novembre 2026: l'archivio dei dati, e quello che ha rivelato

Era partito come "salviamo quello che sta per scadere". E' diventato anche uno strumento di diagnosi.

### Cosa e' successo

1. **Fase A**: ogni ora di ogni zona lascia un record compatto (22 campi, circa 100 byte) in un hash Redis permanente, scritto dopo la fotografia e in `try/catch`, con un'azione per recuperare i 14 giorni ancora vivi. Il giro di recupero ha scritto 3.606 ore.
2. **La tabella di stato per zona ha mostrato tre gruppi**: 7 zone con 336 ore, 10 con 72 e 5 intermedie. Dal codice: `scrape_cfr` riscriveva le fotografie con scadenza di 3 giorni sopra quelle di 14 di `cron_snap`. La previsione chiede sempre 14 giorni: 16 zone su 17 ne avevano il 20%. La lista dei lavori `cron_snap` di M ha chiuso il quadro (10 zone senza lavoro, solo fotografia CFR, niente onde ne' IFS).
3. **Correzione**: 14 giorni per `scrape_cfr`, e il record orario anche da `scrape_cfr` senza sovrascrivere (un buco mio: le zone che passano da li' non venivano archiviate in tempo reale).
4. **Fase B**: esportazione settimanale su un repository privato di GitHub, che accumula le serie manuali (Redis ne tiene solo 30.000 per stazione). Primo giro riuscito il 13/11 con 27.829 punti in sicurezza.

### Lezioni

1. **Costruire un archivio e' anche costruire un osservatorio.** La prima tabella di copertura ha trovato un difetto vecchio di settimane che nessun controllo vedeva, perche' ogni singola fotografia era "presente".
2. **Il vero difetto era in un percorso che non c'entrava con l'archivio.** E' stato trovato perche' si e' cercato il perche' di una differenza tra zone invece di accettarla.
3. **Chi scrive per ultimo comanda.** Con due scrittori sulla stessa chiave, la regola (qui la scadenza) va decisa in un posto solo.
4. **Un archivio di accumulo non e' una copia.** Il tetto del deposito e' il motivo stesso dell'archivio: la copia deve aggiungere.
5. **Ho contato 21 campi e erano 22.** Una temperatura compare due volte (modello e stazione): prima di annunciare una lista di campi si conta sul codice, non a memoria.
6. **Le istruzioni per strumenti che non si vedono (GitHub, cron-job.org) vanno date come una lista di operazioni con l'esito atteso di ciascuna**, e con la domanda "cosa vedi?" quando non torna: il file senza il punto iniziale era invisibile dalla scheda Actions e l'unico indizio era una pagina d'ingresso.
7. **Il confronto con un modello nuovo e' una domanda di costo e di vincoli, non solo di potenza.** Fable 5.2 costa nove volte la nostra spesa e ha classificatori che bloccano proprio il controllo di sicurezza che si voleva fare: la scelta giusta per quel compito era un altro modello.

## 30. Livorno: il tetto sul fattore e il valore unico deciso dal motore (13-16 novembre 2026)

**Il sintomo.** M ha visto Livorno con 53 kn (fattore x2.2 a 240 gradi) mentre Livornometeo dava 25; poi 30,7 contro 10,4 in mappa2 e 32 contro 13 nell'index; la raffica risultava addirittura sotto il vento. Il fattore per direzione (x1.5 da est, x2.2 da sud-ovest) era stato stimato con venti deboli e moltiplicava senza limite.

**Il rapporto `lm_factor_report` (engine v2.14.52+).** Accoppia ogni osservazione di Windfinder (ora di *osservazione*, non di cattura) con la lettura di Livornometeo entro 20 minuti, e valuta le regole con la tecnica "un giorno fuori" (la regola si costruisce sugli altri giorni e si prova su quello tenuto fuori). 177 coppie. Errore medio un giorno fuori: regola attuale **3,01 kn**; con il tetto **2,48**; AROME da solo **2,80**; **media tra stima con tetto e AROME 2,20**; media solo da 8 kn in su **2,04** (da 10 kn: 2,06).

**Il tetto.** stima = min(vento Windfinder x fattore per direzione, 3,3 + 1,08 x vento Windfinder). La raffica si scala con lo stesso fattore e non scende mai sotto il vento. Vale per le previsioni convertite (`reference_method='fattore_per_direzione_con_tetto_v2.14.54'`) e per le tre pagine.

**La media.** Sotto gli 8 kn di stima la media con AROME peggiora (1,89 contro 2,76 kn), quindi sotto gli 8 si usa la sola stima. Da 8 in su la media con AROME e' la regola.

**Quanto invecchia una lettura vera.** Errore medio contro la lettura di Livornometeo successiva: 1,54 kn a 0 minuti, 2,07 a 15, 2,41 a 30, 2,88 a 60, 3,24 a 90. Con la media degli ultimi 10 minuti: 0,62 / 1,56 / 1,94 / 2,45 / 2,86. Per questo la lettura vera vale 30 minuti, poi la regola passa alla media.

**La regola `livorno_now` (engine v2.14.57, azione pubblica in sola lettura).** In ordine: (1) lettura Livornometeo di non piu' di 30 minuti: valore vero (`tipo: vero`); (2) campione Windfinder di non piu' di 90 minuti con AROME disponibile e stima da 8 kn: **media** tra stima e AROME (`fonte: windfinder_arome`, `tipo: ricalcolato`, con le due componenti); (3) stesso campione ma stima sotto 8 kn: la sola stima (`windfinder_stima`); (4) campione Windfinder piu' vecchio di 90 minuti, o assente: AROME (`tipo: modello`); (5) niente di tutto cio': il dato piu' recente con `vecchio: true`. **Open-Meteo non entra mai.** AROME arriva da Open-Meteo (`meteofrance_arome_france`, poi `_hd`), con cache di 10 minuti (`ln_arome`). L'eta' e' sempre quella dell'osservazione.

**La regola di M, che resta.** Il numero sulla mappa e' vero, ricalcolato o modello; il popup mostra lo stesso numero; numeri bianchi = vero o ricalcolato, azzurri = modello (nell'index il modello e' rosso).

**Le pagine (16/11).** index v5.7.49, mappa2 v1.20, previsioni v3.17 leggono tutte `livorno_now` e, se non risponde, tornano alla logica precedente. Nei popup: la media con le due componenti, il Windfinder grezzo con l'ora di osservazione, l'ultima lettura di Livornometeo con la sua eta', il motivo della scelta.

**Il difetto dell'index (non ancora corretto per le altre zone).** `triple_wind` ricade su Open-Meteo quando il campione Windfinder ha piu' di 2 ore, ma lo etichettava ancora "STIMA": da li' i 13 kn dell'index. Per Livorno non conta piu'; per Viareggio e Bocca d'Arno resta da sistemare. Inoltre la fusione dell'osservato CFR nei record orari (v2.14.52 come idea) non e' stata fatta.

**Un caso che nessuna regola copre (15/11).** Alle 15:42 UTC Livornometeo dava 26,1 kn (37 minuti prima) e subito dopo 9,6 "adesso": un calo di 16 kn. La regola dei 30 minuti avrebbe gia' scartato il 26,1; ma la risposta giusta resta scrivere sempre fonte ed eta'.

### Lezioni

1. **Un fattore stimato con venti deboli non si moltiplica senza limite con venti forti.** Ogni correzione moltiplicativa ha bisogno di un tetto, e un tetto si prova sui dati fuori campione.
2. **Una media di due stime sbagliate in modo diverso batte entrambe, ma non sempre:** sotto gli 8 kn peggiora. Si misura, non si presume.
3. **Un solo posto decide il valore.** Quando tre pagine ricalcolano lo stesso numero con regole proprie, prima o poi mostrano numeri diversi; il motore decide e le pagine mostrano.
4. **Un'etichetta e' una promessa.** "dato vero" su un valore di modello (Gorgona, v1.17) e "STIMA" su un valore Open-Meteo (index) hanno la stessa radice: l'etichetta viene dal percorso del codice, non dal dato. Prima di attribuire una causa si guardano i dati (la stazione di Gorgona aveva dati freschi).
5. **Non dire "letto" di cio' che non si e' letto.** Ho detto a M che un rapporto era stato letto quando non lo era; si dice cosa si e' letto e cosa no.

## 31. La fusione dell'osservato e la fase C dell'archivio (17-18 novembre 2026)

**Il difetto.** Nel record orario di una zona la fonte dell'osservato dipendeva da chi scriveva per ultimo: `cron_snap` riscriveva tutto con l'osservato di `openweathermap` anche se `scrape_cfr` aveva gia' scritto quello della stazione (visto il 13/11 su Orbetello, 07-09 UTC); `scrape_cfr`, che scrive con HSETNX, non poteva correggere. Il 17/11, prima del deploy, 5 ore su 7 erano `openweathermap`.

**La regola (v2.14.59).** Il gruppo dell'osservato (vento, direzione, raffica, pressione, temperatura reale, `obs_src`) si prende da UNA sola fonte, mai mescolato: vince quella con `obs_src='cfr'`; a parita' vince chi scrive e' il record completo; se il gruppo scelto non ha il vento e l'altro si', si usa l'altro. Gli altri campi: il completo vince dove ha un valore e lascia i vuoti, il povero riempie solo i vuoti. Il risultato non dipende dall'ordine di scrittura. Costo: un HGET in piu' solo quando serve. Limite: HGET e HSET non sono atomici, ma ogni HSET scrive il record intero. **Verifica: 17 ore consecutive `cfr` su Orbetello dopo il deploy.**

**Cio' che i dati hanno detto.** Il record orario con solo `scrape_cfr` (senza onda, ICON, IFS) compare quando `cron_snap` non e' arrivato in quell'ora: 3 ore su 24 su Orbetello. Le zone con ~370 ore di novembre e quelle con ~220 il 16/11 crescono entrambe di 24 al giorno (+48 in 47 ore il 18/11): i due gruppi dipendevano da quando sono partiti i lavori orari.

**La fase C.** `bias_archive` (campioni di stazione, scritti una volta e mai cambiati) si accumula con `after`; `predict_archive` (previsioni) si UNISCE per `generated_at` perche' i valori reali (`actual_*`) si aggiungono nei giorni dopo, e senza il testo dell'AI. L'elenco delle stazioni lo da' il motore con SCAN: la scansione ne ha trovate **34**, non le 27 scritte a mano nei documenti.

### Lezioni

1. **Quando due scrittori toccano lo stesso record, la regola di fusione va nello stesso posto per tutti e due**, e deve funzionare in qualunque ordine: farla solo in uno avrebbe lasciato il difetto nell'altro.
2. **Un elenco scritto a mano e' sempre piu' corto della realta'**: 27 contro 34. Se il sistema sa elencare da solo (SCAN), si lascia fare a lui.
3. **Un archivio che si accumula e un archivio che si aggiorna sono due cose diverse.** I campioni non cambiano, le previsioni si completano dopo: la copia deve unire, non solo aggiungere.
4. **Prima di correggere un difetto si legge il codice che lo avrebbe prodotto.** Avevo descritto male quello di `triple_wind`: l'etichetta sbagliata era solo di Livorno; i difetti veri erano altri due.

## 32. Livornometeo chiuso e la fotografia finale del modello di Livorno (18-19 novembre 2026)

**Il fatto.** Dal 18/11 Livornometeo chiede utente e password: resta solo una pagina di login. Il segnalibro con cui M passava le letture non puo' piu' funzionare. Altre volte il sito era stato chiuso dopo una richiesta di accesso di M, senza risposta; potrebbe riaprirsi. Le altre stazioni sono aperte. Non si cerca di aggirare il login. Il sistema non si rompe: senza una lettura fresca `livorno_now` passa alla media Windfinder+AROME (da 8 kn di stima) o alla sola stima; cambia l'etichetta, che non dice piu' "vero".

**La fotografia finale (`lm_factor_report`, 19/11).** 198 coppie (196 con AROME) su 27 giorni consecutivi, dal 23/10 al 18/11. Errore medio "un giorno fuori": regola in uso (media con tetto e AROME, da 8 kn in su) **2,19 kn** (2,04 il 13/11, con 177 coppie: le 21 nuove non la smentiscono); p90 4,56; sovrastime oltre 8 kn 0%; sottostime 2%; bias +0,74. Le altre: media con tetto e AROME sempre 2,34; solo tetto 2,78; AROME da solo 2,83 (sovrastime 5%); regola vecchia senza tetto 3,47 (sovrastime 10%, peggiore +24,8 kn).

**Dove regge e dove no.** Regge dove ci sono i dati: 103 coppie da NE e 29 da N (circa il 70%), errore intorno a 2 kn. Non e' confermabile per scirocco, libeccio e vento forte: da S 11 coppie con errore 7-8 kn, da SW 18 con 6 kn (rapporto lettura vera / Windfinder 1,7 da S e 2,1 da SW: qui la stazione automatica sottostima di piu'); E 8 coppie e NW 3 non valutabili. Sopra 14 kn solo 12 coppie, dove AROME da solo sbaglia meno della regola in uso (2,47 contro 2,97 kn): campione troppo piccolo per cambiare regola. Il rumore di una lettura manuale singola e' di 1,3 kn (p90 3,8). Le cifre vengono dalla lettura che lo strumento ha fatto del rapporto, non dal JSON integrale.

**Decisione.** Nessuna modifica alla regola. Se Livornometeo riaprisse, ripartire dalle fasce senza dati (sud, sud-ovest, vento forte) con `lm_factor_report&rows=1`.

**Il PDF della mappa (previsioni v3.19, 18/11).** Tasto PDF: una pagina A4 verticale con la mappa della fascia oraria selezionata, su tutta l'area della griglia modello (40.0-44.6 N, 7.4-12.5 E), con frecce, numeri dei nodi (sempre accesi: sulla carta non c'e' il tocco) e nome di ogni zona (la parte prima del trattino). In alto, grande e rosso, quando e' stato scaricato. Si disegna su un canvas fuori schermo con la STESSA `drawAll` della pagina (parametro facoltativo `T`: bersaglio alternativo), cosi' i valori sono identici a quelli a video; il JPEG entra in un PDF scritto a mano (`NautilusPdf`, senza librerie, con immagine DCTDecode). Si apre in una scheda aperta subito al tocco e riempita a fine lavoro: su Safari iPad il vecchio link con download caricava il PDF nella finestra di previsioni.

### Lezioni

1. **Non intendere una richiesta in modo piu' stretto del suo scopo.** M voleva le mappe che vede cliccando le fasce orarie; io avevo proposto una tabella e, approvata sulla carta, l'ho costruita. Un esempio con dati inventati e' servito a scoprirlo, ma una domanda sul tipo di immagine l'avrebbe evitato.
2. **"Tutta la mappa che trattiamo" e' l'estensione della griglia, non il rettangolo delle zone.** La prima versione tagliava Bonifacio e Capalbio.
3. **Una finestra va aperta nel gesto dell'utente.** Aperta dopo i calcoli, il browser la blocca; Safari carica il file nella pagina e la fa perdere.
4. **Un cambio di versione fatto con sostituzione globale riscrive anche la storia.** Il commento con la modifica di Livorno era diventato "3.19".
5. **Una nuova consegna ha sempre un nome nuovo**, anche per una correzione piccola (regola di M), e non si rimanda un file che M ha detto di non rifare.

## 33. I nomi con il #, la serie nascosta di Livornometeo e il giro dell'archivio del 23 novembre (19-24 novembre 2026)

**I nomi (19/11).** Le stazioni manuali si chiamano ora **LivornoPorto#**, **Capraia#**, **Rosignano#**, **Golfo Aranci#**: il # dice "dato passato da M" e non c'e' piu' nessun riferimento al sito di origine (decisione di M: "sganciamo i riferimenti"). Il punto esclamativo, che M aveva pensato per questo, e' libero per gli errori (D54). Cambiano solo le scritte e le coordinate (motore 2.14.62-63, index 5.7.52, mappa2 1.22-1.23, previsioni 3.20); gli id interni (`livornometeo_porto`, `capraiameteo`, `rosignanometeo`, `golfoaranci_lm`) restano, perche' contengono le serie salvate e l'archivio. Coordinate nuove (indicate da M): LivornoPorto# 43.549682, 10.292348 (anche zona Livorno e punto di mappa2); Capraia# 43.051164, 9.844352; Rosignano# 43.395842, 10.423860; Golfo Aranci# 40.996073, 9.621568. La stazione Windfinder "Livorno Porto" resta a 43.5525, 10.3014.

**Livornometeo risponde solo con il dato istantaneo (23/11).** Dal 18/11 il sito aveva un login; oggi risponde, ma M non vede nessun grafico ne' tabella. Lanciando il segnalibro per vedere che errore dava, e' arrivato invece "Serie inviata: 60 punti". In archivio ci sono 6526-6536 punti, con un buco dal 18/11 09:02 al 23/11 10:20 UTC. Su Firefox `typeof Highcharts` risponde `undefined` e la scheda Rete non mostra richieste con json: da dove escano i punti non e' chiaro (forse un errore del sito che lascia i dati nella pagina, forse nascosti di proposito). La serie si e' verificata sui valori: sono multipli di 0,87 kn (mph intere convertite), l'andamento e' plausibile (calma poi, alle 12:04-12:08 UTC, salto a 17 kn con vento che gira da 168 a 246 gradi) e l'istantaneo visto da M (18,2 kn da 251) coincide per direzione con l'ultimo punto (15,6 kn da 251, delle 14:12 UTC) e per velocita' sta nella variazione dei minuti vicini. La finestra e' di circa tre ore: per non avere buchi il segnalibro va lanciato almeno ogni tre ore. Da fare ancora: un secondo confronto con vento diverso e il confronto con la stazione CFR di Livorno. Se i dati sono nascosti di proposito il sito puo' smettere in qualsiasi momento: la fonte e' utile finche' dura.

**Il giro dell'archivio del 23/11.** Il giro programmato di lunedi' e' partito alle 17:21 italiane invece che alle 06:30, con 11 ore di ritardo (il 16/11 erano state 8): GitHub non garantisce l'ora dei lavori programmati. M aveva lanciato prima un giro a mano; `STATUS.json` del giro programmato ha `problemi: []`, "aggiunti questo giro" 0 quasi ovunque (1 campione per sette stazioni), previsioni e serie manuali gia' dentro, senza doppioni. Non serve un secondo giro programmato: il motore tiene al massimo 3000 campioni per stazione (circa uno ogni mezz'ora) e butta via i piu' vecchi, che sono gia' nel repository; si perderebbe qualcosa solo con piu' di 3000 campioni nuovi tra due esportazioni (oltre due mesi). Se un lunedi' non parte, si avvia dal pulsante "Run workflow".

**Le piccole correzioni (24/11).** Index 5.7.53: Golfo Aranci# nel gruppo Corsica / Sardegna e Vada in Toscana (tasti e righe). Mappa2 1.24: sottotitolo del popup solo "Stazione manuale"; il numero dei punti manuali segue il tasto Nodi; il punto di Capraia# (a ~300 m dalla zona) non finisce piu' sotto il cerchio della zona: se una zona sta a meno di 30 px, freccia e numero si spostano di lato con un filo che li collega al punto vero, e si ricalcola a ogni zoom.

### Lezioni

1. **Non descrivere come funziona uno strumento senza guardarlo.** Ho chiesto due volte a M di controllare un grafico "come sempre" che sul sito non c'era piu': avevo dato per scontato il funzionamento del segnalibro dalle note di ottobre. Si guarda cosa vede la persona, poi si decide.
2. **Un dato che arriva da una fonte che non si capisce si verifica sul valore, non sulla provenienza.** Unita' (mph intere), andamento e confronto con la lettura istantanea in due punti hanno dato la risposta senza sapere da dove venisse.
3. **Il tetto di un archivio si ragiona su cio' che si perde, non su cio' che si raggiunge.** Avevo detto che le stazioni erano vicine al tetto e a rischio; ma i campioni che il motore scarta sono gia' copiati. La differenza e' tra "il motore ricorda 3000 campioni" e "l'archivio conserva tutto".
4. **Un orario programmato su GitHub e' solo un'intenzione.** Il giro puo' partire con ore di ritardo; per i controlli conta cosa e' stato esportato, non quando.

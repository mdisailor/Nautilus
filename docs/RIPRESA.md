# RIPRESA.md — per riprendere NAUTILUS in una chat nuova (18/11/2026, sera)

Questo file non ripete i fatti (sono in CLAUDE.md, ROADMAP.md, METODOLOGIA.md). Dice **come lavorare con M** e **cosa fare esattamente** adesso e alla prossima tappa. Leggerlo per primo.

## 1. Come lavora M (e quindi come rispondergli)

- **Mai due consegne con lo stesso nome**: ogni zip o file nuovo, anche una correzione di una riga, ha un nome nuovo (es. `-r2`, `-b`). Se M dice 'non lo rifare', non si rimanda nulla: si dice cosa resta da correggere e lo si fa alla revisione successiva.

- Sviluppatore solo e velista in Toscana. Lavora **da iPad e iPhone**, con github.dev. Carica i file come **zip** (di solito l'allegato dall'iPhone arriva vuoto: chiedere di incollare il testo). Risponde in italiano; rispondere in italiano. Manda anche **screenshot**: guardarli con attenzione (versione, ora, zoom, contatori).
- **Un indirizzo alla volta, scritto come testo nel messaggio**: lo strumento di lettura apre solo gli URL che M scrive. Mai chiedere quattro URL insieme. **Ogni richiesta ha un parametro nuovo** (`&v=N`): con lo stesso indirizzo lo strumento puo' restituire la pagina gia' letta.
- **Lo strumento di lettura scarta le risposte di errore (5xx)**: per le azioni che rispondono 503 (come `health`) usare `&soft=1`, oppure far aprire l'indirizzo a M nel browser e incollare il testo.
- **"Si puo' fare?" e' una domanda.** Rispondere (fattibilita', limiti, cosa servirebbe) e chiedere se partire. Per richieste grosse M dice lui stesso **"prima di partire con il codice riparliamone"**: proporre un piano, fare le domande che servono (poche, con una raccomandazione), e partire solo dopo il suo "si" o "vai".
- **M valuta l'utilita'**: "lo facciamo solo se ha utilita', se poi il sistema li rilegge". Dire onestamente quando una cosa serve a noi e non al sistema, e proporre il passo piu' piccolo che lascia la porta aperta.
- M conosce il posto e corregge con osservazioni locali (es. "Orbetello non e' sulla costa", "Casotto dei Pescatori e' molto lontano"): verificarle sui dati, e dire quando i dati le confermano e quando no. Non e' un problema essere corretti; lo e' non dirlo.
- Non fare commenti sospettosi sui nomi dei file (es. `vuoto.zip` era uno scherzo, rivelato dopo): aprire e guardare.
- Nel codice, quando si toglie o si cambia qualcosa, **il commento dice il perche'**, non solo cosa.
- I file consegnati: zip in `/mnt/user-data/outputs/`, nome con la versione (es. `engine-v21447.zip`), e **sostituire** lo zip vecchio. Prima di consegnare: sintassi (`node --check`), collaudo con dati finti, regressioni dei collaudi precedenti, e dove serve un confronto con il codice originale su casi casuali.
- **I segreti non passano in chat** (token del bot, `CRON_SECRET`): spiegare dove va ogni cosa (variabili di Vercel: tipo Secret o Config; indirizzi dei lavori) senza mai vederli. M lavora anche da un **PC Windows**, a volte su reti che bloccano indirizzi (es. `api.telegram.org`): se un indirizzo non si apre, dirgli di aspettare una rete libera, senza fretta.
- M usa anche il **sito di GitHub** (repository privato `mdisailor/nautilus-archivio`, secrets, scheda Actions): dare le operazioni nell'ordine in cui vanno fatte, con l'esito atteso di ciascuna e il nome esatto dei file (**`.github/workflows/export.yml` comincia con un punto**: senza, la Action e' invisibile). Se M incolla l'esito di un passaggio, il registro utile e' quello del passaggio "Esporta dal motore", non di "Esito", che fallisce apposta.
- M cambia modello quando serve (questa sessione e' con Sonnet 5.5: "va molto bene"); il confronto con Fable 5.2 e' in CLAUDE.md (costi, classificatori cyber, raccomandazione Opus 5.5 per la sicurezza).
- Non ho strumenti per creare promemoria in questa chat: M li crea a mano (e i lavori di cron-job.org li crea lui, io do indirizzo e parametri verificati nel codice).
- M ha un limite d'uso: le chat lunghissime consumano la sessione. In chat nuova: leggere questi documenti, non riaprire il passato.

## 2. Dove siamo (13/11) in 12 righe

1. App NAUTILUS (nautilus-red.vercel.app). **Versioni**: engine **v2.14.51**; index v5.7.47; mappa2 **v1.18** (deployata e verificata da M); previsioni **v3.15**; la mappa di riferimento e' mappa2 (mappa.html e' ferma).
2. Quattro **stazioni manuali** (4 tocchi al giorno + tocco delle 10:05 di sola serie per Livorno e Rosignano + serale verso mezzanotte): Livornometeo, Capraia, Rosignano, Golfo Aranci. Capraia: aprire `livornometeo.it/capraiameteo/index_test.php`, non `capraiameteo.it`. Le serie sono al sicuro nel repository dell'archivio (27.829 punti al 13/11).
3. **Controllo di salute** (`action=health`) in linea; lavoro su cron-job.org ogni 30 minuti. **cron-job.org non manda le email di errore** (provato): l'**avviso parte dal motore su Telegram** (v2.14.48, bot `@Nautilus_avvisi_bot`, messaggio di prova arrivato; il messaggio rosso non e' mai stato provato con Telegram vero). Il controllo campiona anche l'archivio dei record orari (solo avviso).
4. **Archivio (10-13/11)**. **Record orari compatti** per zona: hash `zh:<zona>:<AAAA-MM>`, 22 campi, permanenti, scritti da `saveZoneSnapshot` (HSET) e da `scrape_cfr` (HSETNX); recupero dei 14 giorni fatto (3.606 ore). **Copia settimanale su GitHub**: Action `Esporta archivio`, **ogni lunedi' alle 05:30 UTC** (prossimo: 16/11); primo giro del 13/11 riuscito, `problemi` vuoto.
5. **Scoperta del 10/11**: `scrape_cfr` scriveva le fotografie con scadenza di **3 giorni** sopra i 14 di `cron_snap`: 16 zone su 17 collegate a una stazione CFR avevano il 20% della storia che la previsione chiede. **Corretto** (v2.14.50, 14 giorni): le finestre si riempiono in 14 giorni; **verifica il 14/11** (`dry=1` su Orbetello, oltre 72). **10 zone non hanno un lavoro `cron_snap`** (gorgona, orbetello, svincenzo, montecristo, bocca_arno, forte_marmi, casotto_gr, capalbio, follonica, venturina): niente onde, pressione, ICON, IFS: **proposta C fatta da M il 13/11 e verificata** (cinque lavori `cron_snap`, due zone ciascuno, ogni ora: onde, ICON e IFS pieni dal record delle 07 UTC).
6. **Fermo di ottobre**: toccava solo le 13 zone con Haiku 5.5; corretto in v2.14.43, verificato. Zone attive 26 (due ignorate dal controllo: vada e bonifacio); 13 con Haiku 5.5 (`fast=1`), 11 con Sonnet 4.6.
7. Livorno: Windfinder x fattore per direzione (provvisorio). Monitoraggio del 2/11 (35 coppie): bias −2.0 col fattore, errore 2.4 kn, 91% entro 5 kn; giusto col vento forte, alto col debole: **non modificare prima di 80-100 coppie** (D38).
8. Analisi dei modelli: **nessuna correzione generale validata** un giorno fuori; solo Livorno su OM migliora (5.0→3.5 kn). Stato consolidato: resta da accumulare dati (D42).
9. **Orbetello**: stazione poco rappresentativa col vento debole; riferimento della zona resta; nella mappa v1.15 (rampa della direzione) e v1.16 (fiducia in rampa 0.3→1 tra 3 e 8 kn). In osservazione.
10. **Regola di M valida per tutta l'app**: un numero sulla mappa e' il dato vero, o il ricalcolato, o il modello, e il popup dice lo stesso numero (numeri bianchi = vero o ricalcolato, azzurri = modello). Un'etichetta come "dato vero" va messa solo se il valore lo e'.
11. **Decisioni di M**: dopo l'archivio il **PDF di `previsioni`** (domande aperte), mappa2 offline dopo; scheda mensile e statistiche rimandate verso marzo, solo se il sistema le rilegge; Vada resta finche' Rosignanometeo non da' un correttore piu' affidabile; nessun cambio di modello dell'AI ora (Sonnet 4.6 → 5.5 un'idea).
12. Piano di lavoro: **un punto per volta** (sezione 3).

## 3. Cosa fare adesso, in ordine (un punto per volta, come ha chiesto M)

0000. **24/11: piccole correzioni fatte, documenti aggiornati.** Consegnati index 5.7.53 e mappa2 1.24 (M li carica e prova il filo del punto di Capraia# a zoom basso). Prossimi: confronto Capraia# contro CFR (`lm_factor_report&auto=capraia_cfr&manual=capraiameteo`), secondo confronto della serie di Livornometeo e confronto con la CFR di Livorno, ISPRA (mareografico.it) da guardare, revisione di sicurezza con Opus 5.5, punto esclamativo per gli errori (D54). Lezione: non descrivere uno strumento senza guardare cosa vede M (il grafico di Livornometeo non c'e' piu').

000. **19/11: Livornometeo chiuso (utente e password) e PDF fatto.** Modello di Livorno confermato con i dati fino al 18/11 (METODOLOGIA 32), nessuna modifica al codice. previsioni v3.19 ha il tasto PDF (M: funziona). Resta la lista 'Da sistemare' in ROADMAP, da fare alla prossima revisione insieme ai punti nuovi (commento in cima a previsioni, frecce del PDF).

00. **Stazioni manuali (D66, 18/11).** Fatti: engine v2.14.61 (`manual_now`), mappa2 v1.21, index v5.7.51. M ha provato il popup di mappa2 (bene) e l'index (tasti aggiunti dopo). **Da sistemare** (lista in ROADMAP, sezione 'Da sistemare'): gruppi dei tasti dell'index (Golfo Aranci va in Corsica/Sardegna, Vada in Toscana), sottotitolo del popup solo 'Stazione manuale', numero dei punti solo con Nodi acceso. Indirizzo di verifica: `https://nautilus-red.vercel.app/api/engine?action=manual_now&v=N`.
0. **Livorno, valore unico (D65, 16/11).** M carica `index.html` v5.7.49, `mappa2.html` v1.20, `previsioni.html` v3.17 (zip `pagine-ln161126.zip`; l'engine v2.14.57 e' gia' in produzione) e confronta il numero di Livorno nelle tre pagine con Livornometeo. Poi incolla l'URL di verifica: `https://nautilus-red.vercel.app/api/engine?action=livorno_now&v=N` (N nuovo ogni volta, un indirizzo alla volta): controllare `valore.fonte`, `eta_min`, `componenti` e `motivo`. Dopo 1-2 settimane rifare `lm_factor_report` (~250 coppie) per vedere se la media serve. Fatti: `triple_wind` v2.14.58 (zeri e `eta_min`) e fusione dell'osservato v2.14.59 (verificata su Orbetello). Da fare dopo: marker Rosignano e Golfo Aranci (D66), guardia sui vicini (D67).

1. **14/11 (M): verifica della scadenza di 14 giorni.** Apri, con il segreto, `…/api/engine?action=zone_hourly_backfill&secret=IL_SEGRETO&zones=orbetello&dry=1&v=N`: `snapshot_trovati` deve superare 72 (circa 100). Poi cancellare la cronologia del browser (contiene il segreto).
2. **Proposta C: fatta e verificata** (13/11): i cinque lavori `cron_snap` per le 10 zone girano e le fotografie hanno onde e IFS. Controllare in `predict_history&zone=orbetello&limit=1` che `current_wave` non sia vuoto dopo il giro delle 13:15.
3. **16/11 (M): il primo giro automatico dell'archivio**: scheda Actions di `nautilus-archivio`, dopo le 6:30 italiane, giro avviato da `schedule` con la spunta verde. Se manca entro la tarda mattinata: **Run workflow** a mano e capire perche'.
4. **Fase C dell'archivio: fatta (18/11, D63).** Engine v2.14.60 e script nuovo gia' in produzione; il primo giro ha scritto 34 stazioni e 24 zone con previsioni. **Lunedi' 23/11 (M)**: incollare `STATUS.json` e dire a che ora e' partito il giro (il 16/11 e' partito alle 14:54 italiane, circa otto ore dopo il previsto): controllare che i campioni per stazione salgano e che `previsioni.*.nuove` sia diverso da zero. Se il ritardo si ripete, spostare l'orario o aggiungere un secondo giro di riserva. Opzionale: M guarda quanto pesa il repository su GitHub (stima: qualche decina di MB).
5. **PDF di `previsioni`** (D47): chiedere a M le tre cose aperte (tutte le 26 zone? valori delle stazioni? cartina con le coste?) e costruirlo.
6. **Punto esclamativo in app** (D54): M decide se mostrare solo gli errori e se aggiungere la scritta con l'ora dell'ultimo giro.
7. **Segnalibro "LM serie" con l'ultimo punto come lettura attuale** (solo Livorno, D58): serve il codice del segnalibro; chiederlo a M. **Pulsante "Inserisci osservazione" nel popup di griglia** (D57): M deve dire cosa vuole.
8. Piu' avanti: `predict_history&zone=barcaggio&limit=1` (e alberese): `data_points` e `similar_cases` devono salire; M cancella il lavoro di prova verso `/api/nonesiste` se non l'ha ancora fatto.

## 4. Alla prossima tappa (circa 15 giorni di dati: dal 12-13/11)

Base: `https://nautilus-red.vercel.app/api/engine?action=...`. Una chiamata per messaggio, `&v=N` nuovo.

1. `manual_status&v=N` — punti di serie, ore di modelli (`models.last` deve avanzare da solo), eta' dell'ultimo punto.
2. `health&detail=1&soft=1&v=N` — stato complessivo e dettaglio per zona (ultima previsione, modello, fotografie).
3. `forecast_monitor&v=N` (poi `&pairs=1`): gruppo `nuovo` per orizzonte e fascia di vento; **bias di Livorno nella scala di Windfinder vicino a zero** e rapporto col vento debole. Con 80-100 coppie rivedere la forma del fattore (ridotto col vento debole) con la validazione un giorno fuori.
4. `manual_hourly&station=all&v=N` — in fondo `validazione_un_giorno_fuori`: leggere l'errore su **tutte le ore** (non la colonna "ore deboli"). Criterio per una correzione: errore corretto sotto il grezzo (suggerito almeno −5%) senza peggiorare le ore forti.
5. Tabella dei costi dell'AI di M: Haiku 5.5 sale? Sonnet sale (ripiego)? Un giorno intero a 0 = lavori non partiti.
6. `zone_hourly_status&v=N` — per zona: ore, prima, ultima (deve essere l'ora corrente), ore mancanti nelle ultime 48. `STATUS.json` del repository dell'archivio (apri **Raw** e incolla): punti per serie e ultima ora delle zone.

## 5. Cosa NON rifare (decisioni gia' prese, e perche')

- **Non correggere OM o AROME con fattori generali**: provato, non migliora l'errore sulle singole ore. Non riproporre senza ≥15 giorni di dati.
- **Non cambiare il fattore di Livorno** prima di 80-100 coppie di monitoraggio (D38).
- **Non sostituire Windfinder x fattore con AROME** per Livorno (errore 4.3-4.9 contro 2.1) (D37).
- **Non costruire una mappa solo dalle stazioni** (17% dell'alto Tirreno entro 15 km da una stazione; errori in parte locali).
- **Non usare fasce scelte sull'osservato per correggere**: effetto statistico; si usano quelle sul modello.
- **Non estendere la rampa della direzione con vento debole a tutte le stazioni** (`OI_DIR_WEAK_ALL`): riaprirebbe il fix del 1/7 (Bocca d'Arno, Viareggio). Montecristo e le altre solo se i dati lo mostrano.
- **Non usare Casotto dei Pescatori come riferimento di zona** (entroterra, M: "molto lontano"). Orbetello resta il riferimento per la velocita'.
- **Non costruire ora scheda mensile e statistiche**: si ricavano dall'archivio in qualunque momento; si riprendono verso marzo, e solo se il sistema le rilegge.
- **Non riportare a 3 giorni la scadenza delle fotografie di `scrape_cfr`** (`SCF_SNAP_TTL` = 14): `predict` ne chiede 14.
- **Non riscrivere da zero i file di serie dell'archivio** (`manual_series/*.jsonl`): si **aggiungono** dall'ultimo punto; Redis tiene solo gli ultimi 30.000 punti.
- **Non cambiare il percorso `.github/workflows/export.yml`** (comincia con un punto) ne' mettere il segreto in un file del repository (solo tra i secrets).
- **Non usare Fable 5.2 per la revisione di sicurezza** (i suoi classificatori cyber bloccano la maggior parte di quei compiti): Opus 5.5, dopo aver tolto la chiave corta dal codice.
- Non applicare il +4.2 (superato); non cambiare le coordinate delle stazioni manuali.

## 6. Trappole note (gia' successe)

0. **Un'impostazione giusta non e' un avviso che funziona**: le email di errore di cron-job.org non sono mai arrivate. Provare ogni canale con un guasto simulato. **Le frequenze si controllano con i conteggi reali** (le fotografie erano orarie, non ogni 30 minuti).
1. **Cambio di modello dell'AI senza provare il percorso che elabora la risposta** = previsioni ferme (13 zone, 19 giorni). Provare end-to-end con risposte finte e controllare l'ultimo record scritto, **per ogni gruppo di zone** (Haiku e Sonnet seguono percorsi diversi).
2. **Costi costanti non provano che il sistema salvi.** Segnale di salute: `health` (data dell'ultima previsione per zona).
3. Un risultato "zero" di un report nuovo e' una scoperta, non un errore del report.
4. URL uguale a uno gia' letto = risposta dalla memoria dello strumento: parametro nuovo. Risposte 5xx scartate: `soft=1`.
5. Un'azione lenta (es. `predict_debug`, 190 letture in fila) va in timeout nello strumento: usare controlli leggeri.
6. Se un collaudo fallisce: prima chiedersi se e' colpa del test (la maggior parte delle volte lo era: firma sbagliata, versione sbagliata del confronto, zona sbagliata), poi se il codice e' fragile.
7. Il bias medio non e' l'errore: valutare l'errore medio assoluto sulle singole ore, un giorno fuori. La colonna "ore deboli" selezionata sull'osservato e' falsata.
8. **Generalizzare da pochi casi**: elencare come il sistema divide i casi e controllare un campione per gruppo.
9. **Istruzioni operative a memoria**: leggere i parametri nel codice prima di darli.
10. **Cambiare un'etichetta senza controllare il dato sotto** ("dato vero" su un valore di modello) e **attribuire una causa non verificata** ("non aveva un dato vivo"): il 6/11 M li ha trovati cliccando in mezzo al mare. Prima si controlla il dato (`bias_history`, `predict_history`), poi si scrive; le ipotesi si scrivono come ipotesi.
11. **Chi scrive per ultimo comanda**: `scrape_cfr` (3 giorni) sovrascriveva la scadenza di `cron_snap` (14). Per ogni chiave scritta da piu' percorsi, elencare tutti i percorsi. **Una tabella di copertura per zona** ha rivelato il difetto: guardarla subito dopo aver costruito un archivio.
12. **Primo giro di una Action fallito**: il motore non era ancora aggiornato (l'azione `archive_export` non esisteva). Prima il deploy, poi il lancio. E nomi di zona con la maiuscola (probabile autocorrezione): il motore ora li tollera e segnala `unknown_zones`.

## 7. Mappa delle azioni dell'engine (sola lettura salvo dove indicato)

`ping` (versione) · `zone_hourly_status[&mesi=N]` · `zone_hourly_get&zone=&month=&limit=` · `health[&detail=1][&soft=1][&alert=0]` (senza `soft` valuta anche l'avviso Telegram) · `health_log` (registro dei cambi di stato) · `predict_history&zone=&limit=` · `forecast_monitor[&pairs=1]` · `manual_status` · `manual_series_get&station=&bucket=60` · `manual_hourly&station=<id>|all[&rows=0][&singles=0][&validate=0]` · `manual_models_get&station=` · `bias_archive_get&station=&from=&limit=` · `bias_history&station=&limit=` · `model_dir_report[&stations=a,b,c]` · `field_test`. **Scrivono** (chiave `k=mdi` o `secret=`): `manual_models_tick`, `manual_models_backfill`, `manual_submit`, `manual_series_submit` (questi ultimi due li usano i segnalibri), `cron_snap` (`secret=<CRON_SECRET>&zones=a,b`; risponde con `unknown_zones`), `zone_hourly_backfill` (`secret=`, `zones=`, `dry=1`, `reset=1`, `budget=`: si riapre finche' `completato: true`), `archive_export` (`secret=`, `type=index|zone_hourly|manual_series`: lo usa l'Action), `health_alert_test` (`secret=<CRON_SECRET>`, manda un messaggio di prova su Telegram; richiede sempre il segreto). `predict` e' **pubblico** e chiama l'AI (D34).
Stazioni manuali: `livornometeo_porto`, `capraiameteo`, `rosignanometeo`, `golfoaranci_lm`. Zone attive: 26 (due ignorate dal controllo: vada e bonifacio); 13 con Haiku 5.5 (`fast=1`), 11 con Sonnet 4.6.

## 8. Messaggio da incollare per riprendere

> Riprendiamo NAUTILUS. Allego CLAUDE.md, ROADMAP.md, METODOLOGIA.md e RIPRESA.md. Seguiamo la sezione 3 di RIPRESA.md, un punto per volta: parti dal punto [N] e dimmi cosa serve da me.

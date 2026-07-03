# NAUTILUS — Roadmap Attività (ROADMAP.md)

Scaletta ordinata con dipendenze, stato e decisioni aperte.
Aggiornato: 2026-07-01 (sera)

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
| 2.3 | Stratificazione MAE per fascia velocità × settore | ⏳ | Dati già disponibili in bias_samples, da implementare in mae.html |
| 2.4 | MAE per ora del giorno | ⏳ | Come 2.3, stesso dataset |
| 2.5 | Trend MAE nel tempo (settimanale) | 🔒 | Richiede 2.3 completato |
| 2.6 | Decisione finale su Vada e Cap Pertusato | ❓ | Dopo almeno 6 settimane di dati (target: fine luglio 2026) |
| 2.7 | Ricerca fonte alternativa per Bonifacio | ❓ | Météo-France verificata ma API con registrazione; Windfinder /report/ unica opzione trovata finora |

---

## Fase 3 — Griglia ibrida (vento attuale) 🔄

| # | Attività | Stato | Note |
|---|---|---|---|
| 3.1 | Definizione bbox e passo griglia | ✅ | 40-44.6N / 7.4-12.5E, passo 0.25° — operativo |
| 3.2 | Fetch OM/AROME per tutti i punti griglia | 🔄 | Proxy Vercel implementato per OM; AROME come base_model non ancora integrato |
| 3.3 | Scelta campo di background per zona | ⏳ | Dipende da 2.3: AROME su isole piccole, OM su costa. Campo `base_model` in grid_rules già previsto, non implementato |
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

## Fase 4 — Griglia previsioni (non iniziata) 🔒

| # | Attività | Stato | Note |
|---|---|---|---|
| 4.1 | Estensione OI a H+3, H+6, H+12 | 🔒 | Dipende da Fase 3 completata |
| 4.2 | Integrazione con predict_history come bias correttivo | 🔒 | Dipende da 4.1 |
| 4.3 | Validazione previsioni griglia vs predict AI per zona | 🔒 | Dipende da 4.2 |

---

## Fase 5 — Funzionalità future (backlog)

| # | Attività | Priorità | Note |
|---|---|---|---|
| 5.1 | Mappa vento animata (Windy-style, esri wind-js) + evoluzione temporale | Alta | Estesa 2026-07-01: includere anche visualizzazione dell'evoluzione oraria (H+1/H+3/H+6...) del flusso, non solo l'istante corrente. Da fare insieme al fix di coerenza flusso/grid_rules (3.10) |
| 5.2 | Bias adattivo per zona (predict_bias:zona in KV) | Alta | Mean H6/H12 error + 5 errori recenti nel prompt |
| 5.3 | Clustering errori per condizione sinottica (A/B/C/D) | Media | KV: predict_errors:zona con 10 errori + contesto |
| 5.4 | Rete osservatori distribuiti (sailor network) | Bassa | Visione a lungo termine, richiede UI dedicata |
| 5.5 | Pubblicazione pubblica app | Bassa | Attendere validazione griglia e affidabilità dati |

---

## Decisioni aperte

| ID | Decisione | Contesto | Target |
|---|---|---|---|
| D1 | Declassare Vada a punto giallo? | Direzione sistematicamente opposta a stazioni vicine, sospetto sensore mal orientato | Fine luglio 2026 |
| D2 | Declassare Cap Pertusato a punto giallo? | Windfinder aggiorna raramente, valori fissi per ore, anti-duplicato obs_time attivo | Fine luglio 2026 |
| D3 | Passo griglia per OI: 0.1° o 0.05°? | 0.1° (~11km) è più leggero su Vercel piano Hobby; 0.05° (~5km) più preciso ma rischio timeout. Nota: attualmente in produzione il passo è 0.25° | Da rivalutare |
| D4 | Libreria Kriging: @sakitam-gis/kriging o implementazione custom? | @sakitam-gis è MIT license ma non testata su Vercel Edge; custom più controllabile. Nota: attualmente in uso reliability_weight custom (1/(1+MAE)), non una vera libreria Kriging | Da rivalutare |
| D5 | Soglia minima vento per peso direzione OI (nuovo, 2026-07-01) | Sotto quale velocità stazione la direzione letta è troppo rumorosa per comandare al peso nominale pieno? Casi noti: Viareggio 0.8-1.2kn (Δdir -88°), Populonia 1.4kn (Δdir -103°) | Dopo aver raccolto altri 2-3 casi simili |

---

## Prossimi passi immediati

1. **Continuare monitoraggio celle a vento debole** — raccogliere altri casi oltre Viareggio e Populonia prima di tarare la soglia minima (D5). Ogni volta che si nota Δdir anomalo, verificare velocità stazione nel popup
2. **Definire grid_rules per altre zone critiche** — dopo analisi fotografie con vento più sostenuto (8-15kt), identificare regole per Canale Piombino (escludere da celle San Vincenzo) e altre zone
3. **Risolvere punta_ala** — zona previsione senza stazione reale vicina (<20km), MAE non affidabile
4. **grid_snapshot automatico da cron** — dopo verifica budget Redis comandi (~25-30K/giorno, limite 500K/mese), aggiungere cron ogni 3 ore per accumulare dati storici celle con stazione
5. **Integrare matrix_by_station nel simulatore** — usa ancora matrix (by_om), aggiornare per usare matrix_by_station sui punti pilota
6. **Integrare score in OI** — applyOI usa bias globale, aggiornare per scelta modello dinamica da score
7. **Validazione pin osservatori** — lista autorizzati in Redis obs_pins_authorized
8. **Audit sicurezza** — nuovo giro completo
9. **Verificare bias injection AI per Barcaggio**
10. **Integrare AROME come base_model** — campo già previsto in grid_rules ma non implementato, prossimo step architetturale per il campo di background

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

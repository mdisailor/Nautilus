# NAUTILUS — Roadmap Attività (ROADMAP.md)

Scaletta ordinata con dipendenze, stato e decisioni aperte.
Aggiornato: 2026-06-23

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
| 2.1 | Web app MAE compare (OM vs AROME per stazione) | ✅ | mae.html v1.0 deployata |
| 2.2 | Valutazione affidabilità Vada e Cap Pertusato | 🔄 | In osservazione da >4 settimane. Decisione rinviata |
| 2.3 | Stratificazione MAE per fascia velocità × settore | ⏳ | Dati già disponibili in bias_samples, da implementare in mae.html |
| 2.4 | MAE per ora del giorno | ⏳ | Come 2.3, stesso dataset |
| 2.5 | Trend MAE nel tempo (settimanale) | 🔒 | Richiede 2.3 completato |
| 2.6 | Decisione finale su Vada e Cap Pertusato | ❓ | Dopo almeno 6 settimane di dati (target: fine luglio 2026) |
| 2.7 | Ricerca fonte alternativa per Bonifacio | ❓ | Météo-France verificata ma API con registrazione; Windfinder /report/ unica opzione trovata finora |

---

## Fase 3 — Griglia ibrida (vento attuale) 🔒

| # | Attività | Stato | Note |
|---|---|---|---|
| 3.1 | Definizione bbox e passo griglia | ⏳ | Proposta: 42-44N / 9-12E, passo 0.1° (~11km) |
| 3.2 | Fetch OM/AROME per tutti i punti griglia | 🔄 | Parzialmente implementato, serve proxy Vercel per evitare rate limit |
| 3.3 | Scelta campo di background per zona | ⏳ | Dipende da 2.3: AROME su isole piccole, OM su costa |
| 3.4 | Implementazione OI (Optimal Interpolation) | ✅ | mappa v1.6.28 — IDW con bias storico stratificato da bias_matrix, raggio 60km |
| 3.5 | Implementazione Kriging come algoritmo di peso in OI | 🔄 | Parziale: IDW con 1/d². Peso per MAE stazione da aggiungere come upgrade |
| 3.6 | Validazione griglia vs stazioni reali | 🔄 | In osservazione — attendere condizioni vento variabile |
| 3.7 | Integrazione griglia in mappa.html | ✅ | Toggle OI ON/OFF in navbar |

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
| 5.1 | Mappa vento animata (Windy-style, esri wind-js) | Media | Dopo stabilizzazione bias system |
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
| D3 | Passo griglia per OI: 0.1° o 0.05°? | 0.1° (~11km) è più leggero su Vercel piano Hobby; 0.05° (~5km) più preciso ma rischio timeout | Prima di iniziare Fase 3 |
| D4 | Libreria Kriging: @sakitam-gis/kriging o implementazione custom? | @sakitam-gis è MIT license ma non testata su Vercel Edge; custom più controllabile | Prima di Fase 3.5 |
| D5 | Quando iniziare Fase 3? | Conveniente aspettare completamento 2.3 (stratificazione MAE) per scegliere campo di background corretto | Dopo 2.3 |

---

## Prossimi passi immediati

1. **Caricare CLAUDE.md, METODOLOGIA.md, ROADMAP.md su GitHub** (già fatto — link raw disponibili)
2. **Osservare OI con vento variabile** — validare che le correzioni abbiano senso geografico con condizioni diverse da bonaccia
3. **Aggiungere peso MAE in OI** — stazioni con MAE basso pesano di più, stazioni inaffidabili pesano meno automaticamente (upgrade Kriging)
4. **Correzione direzione in OI** — lavorare su componenti U/V separatamente per correggere anche la direzione
5. **Implementare `save_oi_validation`** — salva confronto OM grezzo vs OI corretto nei punti stazione per statistiche correttive
6. **Verificare bias injection AI per Barcaggio**
7. **Rimuovere `action=debug_fs`** dall'engine — rischio sicurezza
8. **Nuovo giro di audit sicurezza**

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

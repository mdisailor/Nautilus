// NAUTILUS ENGINE · Vercel API · engine.js · v1.1.0 · by mdisailor engine // Motore diagnostico meteo-marino per navigazione costiera // Zone pilota: Elba/Piombino · Viareggio/Livorno // Endpoint: /api/engine?action=ping|zones|run|zone&zone=xxx

// ── NAUTILUS ENGINE · Cloudflare Worker · Modulo 1 · v1.0.0 · by mdisailor engine ── // Motore diagnostico meteo-marino per navigazione costiera // Zone pilota: Elba/Piombino · Viareggio/Livorno // Preleva dati Open-Meteo, calcola diagnosi sinottica, scenari, avvisi, finestre operative // Salva risultati in Cloudflare KV per lettura da nautilus-proxy

// ── CONFIGURAZIONE ZONE ─────────────────────────────────────────────────────────────

const ZONES = {
elba_piombino: {
name: 'Elba · Piombino · Capraia',
lat: 42.82,
lon: 10.32,
ports: {
portoferraio:  { name: 'Portoferraio',  exposure: 'NE',  shelter: 'high',   swell_threshold: 1.5 },
cavo:          { name: 'Cavo',           exposure: 'N',   shelter: 'low',    swell_threshold: 0.8 },
rio_marina:    { name: 'Rio Marina',     exposure: 'E',   shelter: 'medium', swell_threshold: 1.2 },
porto_azzurro: { name: 'Porto Azzurro',  exposure: 'SE',  shelter: 'high',   swell_threshold: 1.8 },
piombino:      { name: 'Piombino',       exposure: 'SW',  shelter: 'medium', swell_threshold: 1.0 },
punta_ala:     { name: 'Punta Ala',      exposure: 'SW',  shelter: 'medium', swell_threshold: 1.2 },
capraia:       { name: 'Capraia Porto',  exposure: 'NW',  shelter: 'low',    swell_threshold: 0.7 },
},
local_effects: {
venturi_piombino: {
desc: 'Effetto Venturi Canale di Piombino',
active_wind_dirs: [270, 360], // W-N
amplification: 1.35,
note: 'Vento reale +35% rispetto al dato sinottico nel canale' },
rotore_capraia: {
desc: 'Rotore sottovento a Capraia',
active_wind_dirs: [0, 60], // N-NE
note: 'Turbolenza irregolare sottovento all isola con vento da N/NE' },
libeccio_capanne: {
desc: 'Libeccio accelerato sotto Monte Capanne',
active_wind_dirs: [210, 270], // SW-W
amplification: 1.25,
note: 'Libeccio +25% sul versante SW dell Elba, raffiche improvvise' },
canale_corsica: {
desc: 'Canale di Corsica',
active_wind_dirs: [330, 30], // N-NNE
amplification: 1.40,
note: 'Tramontana canalizzata tra Elba e Capraia — accelerazione marcata' } } },
viareggio_livorno: {
name: 'Viareggio · Livorno · Gorgona',
lat: 43.68,
lon: 10.16,
ports: {
viareggio:       { name: 'Viareggio',        exposure: 'W',   shelter: 'medium', swell_threshold: 1.2 },
marina_pisa:     { name: 'Marina di Pisa',   exposure: 'W',   shelter: 'medium', swell_threshold: 1.0 },
livorno:         { name: 'Livorno',           exposure: 'SW',  shelter: 'high',   swell_threshold: 2.0 },
castiglioncello: { name: 'Castiglioncello',  exposure: 'W',   shelter: 'low',    swell_threshold: 0.9 },
san_vincenzo:    { name: 'San Vincenzo',      exposure: 'W',   shelter: 'low',    swell_threshold: 0.8 },
gorgona:         { name: 'Gorgona',           exposure: 'ALL', shelter: 'low',    swell_threshold: 0.6 },
},
local_effects: {
fetch_libeccio: {
desc: 'Fetch aperto da SW',
active_wind_dirs: [210, 270],
note: 'Costa esposta a lungo fetch da SW — mare formato rapidamente con Libeccio' },
convergenza_arno: {
desc: 'Convergenza termica foce Arno',
active_wind_dirs: [0, 360],
note: 'Brezza termica locale nelle ore centrali può creare turbolenza costiera' },
gorgona_scia: {
desc: 'Scia sottovento Gorgona',
active_wind_dirs: [270, 360],
note: 'Zona di calma relativa sottovento all isola con flussi da W/NW' } } } };

// ── REGOLE DIAGNOSTICHE ──────────────────────────────────────────────────────────────

function diagnoseSynopticCase(data) {
const { pressure_trend_1h, pressure_trend_3h, wind_dir, wind_dir_prev, wave_height, swell_height, swell_period, swell_dir, temp_air, temp_water, humidity, wind_speed } = data;

const signals = [];
let caseScores = { A: 0, B: 0, C: 0, D: 0, stable: 0 };

// ── TENDENZA BARICA ───────────────────────────── 
if (pressure_trend_3h <= -4.0) { signals.push({ type: 'pressure_drop', strength: 'strong', msg: 'Calo pressione ' + pressure_trend_3h.toFixed(1) + ' hPa/3h — fronte in arrivo entro 6-12h' }); caseScores.A += 3; caseScores.C += 2; } else if (pressure_trend_3h <= -2.0) { signals.push({ type: 'pressure_drop', strength: 'strong', msg: 'Calo pressione ' + pressure_trend_3h.toFixed(1) + ' hPa/3h — deterioramento probabile' }); caseScores.A += 2; caseScores.B += 1; caseScores.C += 1; } else if (pressure_trend_3h <= -1.0) { signals.push({ type: 'pressure_drop', strength: 'medium', msg: 'Calo pressione ' + pressure_trend_3h.toFixed(1) + ' hPa/3h — monitorare' }); caseScores.B += 2; } else if (pressure_trend_3h >= 1.5) { signals.push({ type: 'pressure_rise', strength: 'medium', msg: 'Rialzo pressione ' + pressure_trend_3h.toFixed(1) + ' hPa/3h — rimonta in corso' }); caseScores.D += 3; caseScores.stable += 2; } else { signals.push({ type: 'pressure_stable', strength: 'weak', msg: 'Pressione stabile' }); caseScores.stable += 2; }

// ── ROTAZIONE VENTO ────────────────────────────── 
const windRotation = calcWindRotation(wind_dir_prev, wind_dir); if (windRotation !== null) { const rotDeg = Math.abs(windRotation); const isVeering = windRotation > 0; // oraria const isBacking = windRotation < 0; // antioraria


if (rotDeg > 30) {
  if (isVeering) {
    // Oraria: S→N = fronte freddo, N→S = fronte caldo
    const fromS = wind_dir_prev >= 150 && wind_dir_prev <= 240;
    const fromN = wind_dir_prev >= 330 || wind_dir_prev <= 30;
    if (fromS) {
      signals.push({ type: 'wind_veering', strength: 'strong', msg: 'Rotazione oraria S→N ' + rotDeg.toFixed(0) + '° — CASO A: fronte freddo' });
      caseScores.A += 4;
    } else if (fromN) {
      signals.push({ type: 'wind_veering', strength: 'strong', msg: 'Rotazione oraria N→S ' + rotDeg.toFixed(0) + '° — CASO B: fronte caldo' });
      caseScores.B += 4;
    } else {
      signals.push({ type: 'wind_veering', strength: 'medium', msg: 'Rotazione oraria ' + rotDeg.toFixed(0) + '°' });
      caseScores.A += 1; caseScores.B += 1;
    }
  } else {
    // Antioraria
    const fromS = wind_dir_prev >= 150 && wind_dir_prev <= 240;
    const fromN = wind_dir_prev >= 330 || wind_dir_prev <= 30;
    if (fromS) {
      signals.push({ type: 'wind_backing', strength: 'strong', msg: 'Rotazione antioraria S→N ' + rotDeg.toFixed(0) + '° — CASO C: ciclogenesi' });
      caseScores.C += 4;
    } else if (fromN) {
      signals.push({ type: 'wind_backing', strength: 'medium', msg: 'Rotazione antioraria N→S ' + rotDeg.toFixed(0) + '° — CASO D: miglioramento' });
      caseScores.D += 3;
    } else {
      signals.push({ type: 'wind_backing', strength: 'medium', msg: 'Rotazione antioraria ' + rotDeg.toFixed(0) + '°' });
      caseScores.C += 1; caseScores.D += 1;
    }
  }
}


}

// ── SWELL ANTICIPATO (fronte caldo a distanza) ─── 
if (swell_period >= 10 && swell_height >= 0.8) { const swellWindAngle = Math.abs(swell_dir - wind_dir); const angleDiff = Math.min(swellWindAngle, 360 - swellWindAngle); if (angleDiff > 45) { signals.push({ type: 'early_swell', strength: 'strong', msg: 'Swell lungo ' + swell_period.toFixed(0) + 's da direzione diversa dal vento — fronte in avvicinamento' }); caseScores.B += 3; } }

// ── MARE INCROCIATO ────────────────────────────── 
if (swell_height > 0.5 && wave_height > 0.5) { const crossAngle = Math.abs(swell_dir - wind_dir); const normAngle = Math.min(crossAngle, 360 - crossAngle); if (normAngle > 60) { signals.push({ type: 'cross_sea', strength: normAngle > 90 ? 'strong' : 'medium',
msg: 'Mare incrociato: swell ' + swell_dir.toFixed(0) + '° vs vento ' + wind_dir.toFixed(0) + '° — angolo ' + normAngle.toFixed(0) + '°' }); } }

// ── NEBBIA DA AVVEZIONE ─────────────────────────── 
const deltaTempAW = temp_air - temp_water; if (deltaTempAW < 1.0 && humidity > 85) { signals.push({ type: 'fog_risk', strength: deltaTempAW < 0.5 ? 'strong' : 'medium',
msg: 'Delta T aria/acqua ' + deltaTempAW.toFixed(1) + '°C, umidità ' + humidity.toFixed(0) + '% — rischio nebbia da avvezione' }); }

// ── TEMPORALE CONVETTIVO ───────────────────────── 
//Stima semplificata: umidità alta + T elevata + vento instabile 
const hour = new Date().getUTCHours(); const afternoonHours = hour >= 12 && hour <= 18; if (humidity > 75 && temp_air > 20 && afternoonHours) { signals.push({ type: 'convective_risk', strength: 'medium',
msg: 'Condizioni favorevoli a sviluppo convettivo pomeridiano — monitorare formazione cumuli' }); }

// ── DETERMINA CASO PREVALENTE ──────────────────── 
const maxScore = Math.max(Object.values(caseScores));
const dominantCase = Object.entries(caseScores).find(([, v]) => v === maxScore)?.[0] || 'stable';

// Calcola confidenza
const totalScore = Object.values(caseScores).reduce((a, b) => a + b, 0); const confidence = totalScore > 0 ? Math.min(95, Math.round((maxScore / totalScore) * 100)) : 50;

const caseDescriptions = {
A: 'Rotazione oraria S→N — Fronte freddo in transito',
B: 'Rotazione oraria N→S — Warm advection / Fronte caldo',
C: 'Rotazione antioraria S→N — Ciclogenesi / Stallo',
D: 'Rotazione antioraria N→S — Miglioramento post-perturbato',
stable: 'Situazione stabile — nessun pattern frontale attivo' };

return {
case: dominantCase,
confidence,
description: caseDescriptions[dominantCase], signals,
scores: caseScores
};
}

// ── EFFETTI LOCALI ───────────────────────────────────────────────────────────────────

function calcLocalEffects(zoneKey, data) { const zone = ZONES[zoneKey]; const { wind_dir, wind_speed, temp_air, temp_water, humidity } = data; const effects = {};

for (const [effectKey, effect] of Object.entries(zone.local_effects)) { const [minDir, maxDir] = effect.active_wind_dirs; let isActive = false;


if (minDir <= maxDir) {
  isActive = wind_dir >= minDir && wind_dir <= maxDir; } else {
  isActive = wind_dir >= minDir || wind_dir <= maxDir; }

effects[effectKey] = {
  active: isActive && wind_speed >= 8,
  desc: effect.desc,
  note: effect.note,
  amplified_speed: isActive && effect.amplification
    ? Math.round(wind_speed * effect.amplification)
    : null
};


}

// Nebbia da avvezione (comune a tutte le zone) effects.fog_advection = {
active: (temp_air - temp_water) < 1.0 && humidity > 85,
desc: 'Nebbia da avvezione',
note: 'Delta T aria/acqua: ' + (temp_air - temp_water).toFixed(1) + '°C' };

return effects;
}

// ── ACCESSIBILITÀ PORTI ──────────────────────────────────────────────────────────────

function calcPortAccess(zoneKey, data, localEffects) { const zone = ZONES[zoneKey]; const { wave_height, swell_height, swell_dir, wind_dir, wind_speed, visibility } = data; const ports = {};

for (const [portKey, port] of Object.entries(zone.ports)) { const effectiveWave = Math.max(wave_height, swell_height * 0.7);


// Verifica esposizione diretta
const isExposed = checkExposure(port.exposure, swell_dir, wind_dir);

// Calcola rischio
let risk = 'low';
let accessible = true;
const notes = [];

if (effectiveWave > port.swell_threshold * 1.5) {
  risk = 'high'; accessible = false;
notes.push('Onda ' + effectiveWave.toFixed(1) + 'm supera soglia (' + port.swell_threshold + 'm)'); } else if (effectiveWave > port.swell_threshold) {
  risk = 'medium';
notes.push('Onda ' + effectiveWave.toFixed(1) + 'm vicina alla soglia'); }

if (isExposed && swell_height > 0.6) {
  if (risk === 'low') risk = 'medium';
notes.push('Esposizione diretta swell da ' + (swell_dir != null ? swell_dir.toFixed(0) : '--') + '°'); }

if (wind_speed > 25) {
  risk = 'high'; accessible = false;
notes.push('Vento ' + wind_speed.toFixed(0) + 'kn — manovra difficile'); } else if (wind_speed > 18) {
  if (risk === 'low') risk = 'medium';
notes.push('Vento sostenuto ' + wind_speed.toFixed(0) + 'kn'); }

if (visibility !== undefined && visibility < 1.0) {
  if (risk === 'low') risk = 'medium';
notes.push('Visibilità ridotta ' + (visibility * 1000).toFixed(0) + 'm'); }

// Applica effetti locali
if (portKey === 'piombino' && localEffects.venturi_piombino?.active) {
  risk = risk === 'low' ? 'medium' : 'high';
  notes.push('Effetto Venturi attivo nel canale'); } if (portKey === 'capraia' && localEffects.rotore_capraia?.active) {
  risk = risk === 'low' ? 'medium' : 'high';
  notes.push('Rotore sottovento attivo'); }

ports[portKey] = {
  name: port.name,
  risk,
  accessible,
  note: notes.join(' · ') || 'Condizioni nella norma' };

}

return ports;
}

function checkExposure(exposure, swellDir, windDir) { if (exposure === 'ALL') return true; const exposureAngles = {
'N': 0, 'NE': 45, 'E': 90, 'SE': 135,
'S': 180, 'SW': 225, 'W': 270, 'NW': 315 }; const expAngle = exposureAngles[exposure] ?? 0; const swellAngleDiff = Math.abs(((swellDir - expAngle) + 360) % 360); return Math.min(swellAngleDiff, 360 - swellAngleDiff) < 60; }

// ── SCENARI PREVISIONALI ─────────────────────────────────────────────────────────────

function buildForecast(diagnosis, data, forecastData) { const { case: synCase, confidence, signals } = diagnosis; const { pressure_trend_3h, wind_speed, wave_height } = data;

const forecasts = {};

// Scenari per Caso A — Fronte freddo
if (synCase === 'A') {
forecasts.h6 = {
scenario: 'peggioramento_rapido',
label: 'Peggioramento rapido',
wind_max: Math.round(wind_speed * 1.6),
wave_max: parseFloat((wave_height * 1.8).toFixed(1)),
confidence: Math.min(85, confidence + 10),
color: 'danger',
note: 'Fronte freddo in transito — raffiche e mare formato rapidamente' };
forecasts.h12 = {
scenario: 'post_fronte_instabile',
label: 'Post-fronte instabile',
wind_max: Math.round(wind_speed * 1.3),
wave_max: parseFloat((wave_height * 1.5).toFixed(1)),
confidence: Math.min(70, confidence),
color: 'warn',
note: 'Mare ancora formato — vento in attenuazione ma ondoso residuo' };
forecasts.h24 = {
scenario: 'normalizzazione',
label: 'Normalizzazione',
wind_max: Math.round(wind_speed * 0.8),
wave_max: parseFloat((wave_height * 0.9).toFixed(1)),
confidence: Math.min(60, confidence - 10),
color: 'safe',
note: 'Progressivo miglioramento — swell residuo possibile' }; } // Caso B — Fronte caldo else if (synCase === 'B') {
forecasts.h6 = {
scenario: 'deterioramento_graduale',
label: 'Deterioramento graduale',
wind_max: Math.round(wind_speed * 1.3),
wave_max: parseFloat((wave_height * 1.4).toFixed(1)),
confidence: Math.min(80, confidence + 5),
color: 'warn',
note: 'Fronte caldo in avvicinamento — visibilità in calo, swell in aumento' };
forecasts.h12 = {
scenario: 'fronte_al_passaggio',
label: 'Fronte al passaggio',
wind_max: Math.round(wind_speed * 1.5),
wave_max: parseFloat((wave_height * 1.7).toFixed(1)),
confidence: Math.min(65, confidence),
color: 'danger',
note: 'Piogge continue — nebbia possibile — navigazione strumentale' };
forecasts.h24 = {
scenario: 'warm_sector',
label: 'Warm sector',
wind_max: Math.round(wind_speed * 1.2),
wave_max: parseFloat((wave_height * 1.3).toFixed(1)),
confidence: Math.min(50, confidence - 15),
color: 'warn',
note: 'Miglioramento solo dopo completo passaggio del fronte' }; } // Caso C — Ciclogenesi else if (synCase === 'C') {
forecasts.h6 = {
scenario: 'peggioramento_prolungato',
label: 'Peggioramento prolungato',
wind_max: Math.round(wind_speed * 1.8),
wave_max: parseFloat((wave_height * 2.0).toFixed(1)),
confidence: Math.min(70, confidence),
color: 'danger',
note: 'Ciclogenesi attiva — mare confuso multi-direzionale' };
forecasts.h12 = {
scenario: 'massimo_perturbazione',
label: 'Massimo perturbazione',
wind_max: Math.round(wind_speed * 2.0),
wave_max: parseFloat((wave_height * 2.2).toFixed(1)),
confidence: Math.min(55, confidence - 10),
color: 'danger',
note: 'Condizioni severe — evitare navigazione se possibile' };
forecasts.h24 = {
scenario: 'evoluzione_incerta',
label: 'Evoluzione incerta',
wind_max: Math.round(wind_speed * 1.4),
wave_max: parseFloat((wave_height * 1.6).toFixed(1)),
confidence: Math.min(40, confidence - 20),
color: 'warn',
note: 'Dipende da traiettoria del minimo — monitorare costantemente' }; } // Caso D — Miglioramento else if (synCase === 'D') {
forecasts.h6 = {
scenario: 'miglioramento_in_corso',
label: 'Miglioramento in corso',
wind_max: Math.round(wind_speed * 0.8),
wave_max: parseFloat((wave_height * 0.85).toFixed(1)),
confidence: Math.min(82, confidence + 8),
color: 'safe',
note: 'Vento in attenuazione — swell residuo ancora presente' };
forecasts.h12 = {
scenario: 'stabilizzazione',
label: 'Stabilizzazione',
wind_max: Math.round(wind_speed * 0.6),
wave_max: parseFloat((wave_height * 0.7).toFixed(1)),
confidence: Math.min(75, confidence + 5),
color: 'safe',
note: 'Condizioni in miglioramento — attenzione a seiche nei porti' };
forecasts.h24 = {
scenario: 'bel_tempo',
label: 'Bel tempo',
wind_max: Math.round(wind_speed * 0.5),
wave_max: parseFloat((wave_height * 0.5).toFixed(1)),
confidence: Math.min(65, confidence),
color: 'safe',
note: 'Buone condizioni attese — finestra favorevole' }; } // Stabile else {
forecasts.h6 = {
scenario: 'stabile',
label: 'Stabile',
wind_max: Math.round(wind_speed * 1.1),
wave_max: parseFloat((wave_height * 1.1).toFixed(1)),
confidence: 78,
color: 'safe',
note: 'Condizioni stabili — variazioni minime attese' };
forecasts.h12 = {
scenario: 'stabile',
label: 'Stabile',
wind_max: Math.round(wind_speed * 1.15),
wave_max: parseFloat((wave_height * 1.15).toFixed(1)),
confidence: 65,
color: 'safe',
note: 'Mantenimento condizioni attuali'
};
forecasts.h24 = {
scenario: 'possibile_variazione',
label: 'Possibile variazione',
wind_max: Math.round(wind_speed * 1.2),
wave_max: parseFloat((wave_height * 1.2).toFixed(1)),
confidence: 50,
color: 'gold',
note: 'Monitorare evoluzione barica oltre 12h' }; }

return forecasts;
}

// ── FINESTRA OPERATIVA ───────────────────────────────────────────────────────────────

function calcOperationalWindow(diagnosis, data) { const { case: synCase, confidence } = diagnosis; const { pressure_trend_1h, wind_speed, wave_height } = data; const hour = new Date().getUTCHours() + 1; // UTC+1 approssimativo

let window = {
status: 'open',
best_start: null,
best_end: null,
reason: '',
next_window: null,
color: 'safe'
};

// Condizioni attuali praticabili?
const currentlyOk = wind_speed < 20 && wave_height < 1.5;

if (synCase === 'A') {
// Fronte freddo: agire SUBITO o aspettare 24h if (currentlyOk && pressure_trend_1h > -2) { const endHour = Math.max(hour + 1, hour + Math.floor((20 - wind_speed) / 3)); window = {
status: 'closing',
best_start: 'Ora',
best_end: Math.min(endHour, 23).toString().padStart(2,'0') + ':00',
reason: 'Finestra in chiusura — fronte freddo in arrivo. Parti subito o aspetta 18-24h',
next_window: 'Domani mattina dopo le 07:00',
color: 'warn'
};
} else {
window = {
status: 'closed',
best_start: null,
best_end: null,
reason: 'Finestra chiusa — fronte freddo attivo. Attendere normalizzazione',
next_window: 'Domani mattina — verificare condizioni',
color: 'danger'
};
}
} else if (synCase === 'B') {
// Fronte caldo: finestra mattutina se ancora possibile if (hour < 10 && currentlyOk) { window = {
status: 'open',
best_start: 'Ora',
best_end: Math.min(hour + 3, 10).toString().padStart(2,'0') + ':00',
reason: 'Finestra mattutina disponibile prima del peggioramento. Rientro anticipato consigliato',
next_window: 'Dopo il passaggio del fronte — 24-36h',
color: 'warn'
};
} else {
window = {
status: 'closed',
best_start: null,
best_end: null,
reason: 'Finestra chiusa — fronte caldo in avvicinamento. Non partire',
next_window: 'Domani dopo le 10:00 — verificare passaggio fronte',
color: 'danger'
};
}
} else if (synCase === 'C') {
window = {
status: 'closed',
best_start: null,
best_end: null,
reason: 'Finestra chiusa — ciclogenesi attiva. Condizioni imprevedibili',
next_window: 'Indefinita — monitorare evoluzione minimo',
color: 'danger'
};
} else if (synCase === 'D') {
// Miglioramento: finestra disponibile o in apertura if (currentlyOk) { window = {
status: 'open',
best_start: 'Ora',
best_end: '18:00',
reason: 'Finestra aperta — rimonta anticiclonica in corso. Attenzione a swell residuo nelle imboccature',
next_window: null,
color: 'safe'
};
} else {
window = {
status: 'opening',
best_start: '08:00',
best_end: '17:00',
reason: 'Finestra in apertura — attendere attenuazione ondoso residuo',
next_window: 'Domani mattina dalle 08:00',
color: 'warn'
};
}
} else {
// Stabile
if (currentlyOk) {
window = {
status: 'open',
best_start: '06:00',
best_end: '17:00',
reason: 'Finestra aperta — condizioni stabili. Brezza termica pomeridiana possibile',
next_window: null,
color: 'safe'
};
} else {
window = {
status: 'limited',
best_start: '07:00',
best_end: '11:00',
reason: 'Finestra limitata — vento/onda ai limiti. Usare con cautela',
next_window: 'Domani mattina — stesse condizioni attese',
color: 'warn'
};
}
}

return window;
}

// ── AVVISI ───────────────────────────────────────────────────────────────────────────

function buildAlerts(diagnosis, data, localEffects, ports) { const alerts = []; const { pressure_trend_1h, pressure_trend_3h, wind_speed, wave_height, swell_height, swell_period, temp_air, temp_water, humidity } = data;

// Soglie barica
if (pressure_trend_3h <= -4.0) {
alerts.push({ type: 'pressure_critical', severity: 'high',
msg: '🔴 Calo pressione ' + pressure_trend_3h.toFixed(1) + ' hPa/3h — fronte IMMINENTE entro 3-6h' }); } else if (pressure_trend_3h <= -2.0) { alerts.push({ type: 'pressure_drop', severity: 'medium',
msg: '⚠️ Calo pressione ' + pressure_trend_3h.toFixed(1) + ' hPa/3h — peggioramento entro 6-12h' }); }

// Vento
if (wind_speed >= 28) {
alerts.push({ type: 'wind_high', severity: 'high',
msg: '🔴 Vento ' + wind_speed.toFixed(0) + 'kn — Forza 7+. Navigazione sconsigliata' }); } else if (wind_speed >= 20) { alerts.push({ type: 'wind_medium', severity: 'medium',
msg: '⚠️ Vento ' + wind_speed.toFixed(0) + 'kn — Forza 5-6. Cautela per piccole imbarcazioni' }); }

// Onda
if (wave_height >= 2.5) {
alerts.push({ type: 'wave_high', severity: 'high',
msg: '🔴 Altezza onda ' + wave_height.toFixed(1) + 'm — Mare agitato' }); } else if (wave_height >= 1.5) { alerts.push({ type: 'wave_medium', severity: 'medium',
msg: '⚠️ Altezza onda ' + wave_height.toFixed(1) + 'm — Mare mosso' }); }

// Swell anticipato
if (swell_period >= 10 && swell_height >= 0.8) { alerts.push({ type: 'early_swell', severity: 'medium',
msg: '⚠️ Swell lungo ' + swell_period.toFixed(0) + 's — sistema perturbato in avvicinamento' }); }

// Nebbia
const deltaT = temp_air - temp_water;
if (deltaT < 0.5 && humidity > 90) {
alerts.push({ type: 'fog_high', severity: 'high',
msg: '🔴 Delta T ' + deltaT.toFixed(1) + '°C, umidità ' + humidity.toFixed(0) + '% — nebbia probabile' }); } else if (deltaT < 1.0 && humidity > 85) { alerts.push({ type: 'fog_risk', severity: 'low',
msg: 'ℹ️ Delta T ' + deltaT.toFixed(1) + '°C — rischio nebbia nelle ore notturne' }); }

// Effetti locali attivi
for (const [key, effect] of Object.entries(localEffects)) { if (effect.active && effect.amplified_speed) { alerts.push({ type: 'local_effect', severity: 'medium',
msg: '⚠️ ' + effect.desc + ' attivo — vento locale stimato ' + effect.amplified_speed + 'kn' }); } }

// Porti chiusi
const closedPorts = Object.values(ports).filter(p => !p.accessible); if (closedPorts.length > 0) { alerts.push({ type: 'ports_closed', severity: 'medium',
msg: '⚠️ Porti con accesso difficile: ' + closedPorts.map(function(p){return p.name;}).join(', ') }); }

// Caso C — sempre allerta alta
if (diagnosis.case === 'C') {
alerts.push({ type: 'cyclogenesis', severity: 'high',
msg: '🔴 Ciclogenesi identificata — condizioni imprevedibili. Evitare navigazione' }); }

// Ordina per severità
const order = { high: 0, medium: 1, low: 2 }; alerts.sort((a, b) => order[a.severity] - order[b.severity]);

return alerts;
}

// ── FETCH DATI OPEN-METEO ────────────────────────────────────────────────────────────

async function fetchOpenMeteo(lat, lon) { const params = [ 'temperature_2m', 'relativehumidity_2m', 'surface_pressure', 'windspeed_10m', 'winddirection_10m', 'windgusts_10m', 'cloudcover', 'precipitation', 'visibility', 'wave_height', 'wave_period', 'wave_direction', 'swell_wave_height', 'swell_wave_period', 'swell_wave_direction' ].join(',');

const url = 'https://eur01.safelinks.protection.outlook.com/?url=https%3A%2F%2Fapi.open-meteo.com%2Fv1%2Fforecast%3Flatitude%3D%40&data=05%7C02%7Cmarco.deglinnocenti%40unicoopfirenze.coop.it%7Cc5f2f59bb5f943db959f08de85926382%7C2266bc20c37146bfa6129581b119bc1f%7C0%7C0%7C639095060966392006%7CUnknown%7CTWFpbGZsb3d8eyJFbXB0eU1hcGkiOnRydWUsIlYiOiIwLjAuMDAwMCIsIlAiOiJXaW4zMiIsIkFOIjoiTWFpbCIsIldUIjoyfQ%3D%3D%7C0%7C%7C%7C&sdata=E0xHldkD0huGD%2BFUzHHV4B48ThgVCiYOtWa8JyNCuBM%3D&reserved=0 + lat + '&longitude=' + lon + '&hourly=' + params + '&wind_speed_unit=kn&timezone=Europe/Rome&forecast_days=2';

const res = await fetch(url);
if (!res.ok) throw new Error('Open-Meteo error: ' + res.status); return await res.json(); }

async function fetchStormglass(lat, lon, apiKey) { const params = [ 'waveHeight', 'wavePeriod', 'waveDirection', 'swellHeight', 'swellPeriod', 'swellDirection', 'waterTemperature', 'currentSpeed', 'currentDirection', 'windSpeed', 'windDirection', 'gust' ].join(','); const now = Math.floor(Date.now() / 1000); const url = 'https://eur01.safelinks.protection.outlook.com/?url=https%3A%2F%2Fapi.stormglass.io%2Fv2%2Fweather%2Fpoint%3Flat%3D%40&data=05%7C02%7Cmarco.deglinnocenti%40unicoopfirenze.coop.it%7Cc5f2f59bb5f943db959f08de85926382%7C2266bc20c37146bfa6129581b119bc1f%7C0%7C0%7C639095060966425994%7CUnknown%7CTWFpbGZsb3d8eyJFbXB0eU1hcGkiOnRydWUsIlYiOiIwLjAuMDAwMCIsIlAiOiJXaW4zMiIsIkFOIjoiTWFpbCIsIldUIjoyfQ%3D%3D%7C0%7C%7C%7C&sdata=ECYmGv%2FaycyK%2B%2Fm8SARyb1Vn8q%2FbVWT6awWEPvemhwM%3D&reserved=0 + lat + '&lng=' + lon + '&params=' + params + '&start=' + now + '&end=' + (now + 3600); const res = await fetch(url, { headers: { 'Authorization': apiKey } }); if (!res.ok) throw new Error('Stormglass error: ' + res.status); return await res.json(); }

function extractStormglassData(sgData) { if (!sgData || !sgData.hours || sgData.hours.length === 0) return null; const h = sgData.hours[0]; const pick = function(param) { if (!h[param]) return null; const sg = h[param].find(function(s) { return s.source === 'sg'; }); const noaa = h[param].find(function(s) { return s.source === 'noaa'; }); const dwd = h[param].find(function(s) { return s.source === 'dwd'; }); const val = sg || noaa || dwd || h[param][0]; return val ? val.value : null; }; return {
wave_height:    pick('waveHeight'),
wave_period:    pick('wavePeriod'),
wave_dir:       pick('waveDirection'),
swell_height:   pick('swellHeight'),
swell_period:   pick('swellPeriod'),
swell_dir:      pick('swellDirection'),
temp_water:     pick('waterTemperature'),
current_speed:  pick('currentSpeed'),
current_dir:    pick('currentDirection'),
wind_speed_sg:  pick('windSpeed'),
wind_gust_sg:   pick('gust'),
};
}

function calcReliability(hasStormglass, hasBoe, signalCount, totalSignals) { let score = 50; if (hasStormglass) score += 25; if (hasBoe) score += 15; const signalRatio = totalSignals > 0 ? signalCount / totalSignals : 0; score += Math.round(signalRatio * 10); return Math.min(98, Math.max(30, score)); }

// ── ESTRAI DATI CORRENTI E PRECEDENTI ────────────────────────────────────────────────

function extractCurrentData(omData, sgData) { const h = omData.hourly; const now = new Date(); const currentHour = now.toISOString().slice(0, 13) + ':00'; let idx = h.time.findIndex(function(t) { return t === currentHour; }); if (idx === -1) idx = 0; const prev = Math.max(0, idx - 3);

// Base data from Open-Meteo
const base = {
temp_air:          h.temperature_2m[idx] !== undefined ? h.temperature_2m[idx] : 15,
humidity:          h.relativehumidity_2m[idx] !== undefined ? h.relativehumidity_2m[idx] : 70,
pressure:          h.surface_pressure[idx] !== undefined ? h.surface_pressure[idx] : 1013,
wind_speed:        h.windspeed_10m[idx] !== undefined ? h.windspeed_10m[idx] : 0,
wind_dir:          h.winddirection_10m[idx] !== undefined ? h.winddirection_10m[idx] : 0,
wind_gust:         h.windgusts_10m[idx] !== undefined ? h.windgusts_10m[idx] : 0,
cloud_cover:       h.cloudcover[idx] !== undefined ? h.cloudcover[idx] : 0,
precipitation:     h.precipitation[idx] !== undefined ? h.precipitation[idx] : 0,
visibility:        h.visibility && h.visibility[idx] !== undefined ? h.visibility[idx] / 1000 : 10,
wave_height:       h.wave_height && h.wave_height[idx] !== undefined ? h.wave_height[idx] : 0,
wave_period:       h.wave_period && h.wave_period[idx] !== undefined ? h.wave_period[idx] : 0,
wave_dir:          h.wave_direction && h.wave_direction[idx] !== undefined ? h.wave_direction[idx] : 0,
swell_height:      h.swell_wave_height && h.swell_wave_height[idx] !== undefined ? h.swell_wave_height[idx] : 0,
swell_period:      h.swell_wave_period && h.swell_wave_period[idx] !== undefined ? h.swell_wave_period[idx] : 0,
swell_dir:         h.swell_wave_direction && h.swell_wave_direction[idx] !== undefined ? h.swell_wave_direction[idx] : 0,
temp_water:        15,
current_speed:     0,
current_dir:       0,
pressure_prev:     h.surface_pressure[prev] !== undefined ? h.surface_pressure[prev] : 1013,
wind_dir_prev:     h.winddirection_10m[prev] !== undefined ? h.winddirection_10m[prev] : 0,
pressure_trend_1h: (h.surface_pressure[idx] !== undefined ? h.surface_pressure[idx] : 1013) - (h.surface_pressure[Math.max(0,idx-1)] !== undefined ? h.surface_pressure[Math.max(0,idx-1)] : 1013),
pressure_trend_3h: (h.surface_pressure[idx] !== undefined ? h.surface_pressure[idx] : 1013) - (h.surface_pressure[prev] !== undefined ? h.surface_pressure[prev] : 1013),
sources: { wind: 'open-meteo', wave: 'open-meteo', pressure: 'open-meteo' } };

// Override with Stormglass data where available (more accurate for marine) if (sgData) { if (sgData.wave_height !== null && sgData.wave_height > 0) { base.wave_height = sgData.wave_height; base.sources.wave = 'stormglass'; } if (sgData.wave_period !== null) base.wave_period = sgData.wave_period; if (sgData.wave_dir !== null) base.wave_dir = sgData.wave_dir; if (sgData.swell_height !== null && sgData.swell_height > 0) { base.swell_height = sgData.swell_height; base.sources.swell = 'stormglass'; } if (sgData.swell_period !== null) base.swell_period = sgData.swell_period; if (sgData.swell_dir !== null) base.swell_dir = sgData.swell_dir; if (sgData.temp_water !== null) base.temp_water = sgData.temp_water; if (sgData.current_speed !== null) base.current_speed = sgData.current_speed; if (sgData.current_dir !== null) base.current_dir = sgData.current_dir; if (sgData.wind_speed_sg !== null && sgData.wind_speed_sg > 0) { // Average OM and SG wind for better accuracy base.wind_speed = (base.wind_speed + sgData.wind_speed_sg) / 2; base.sources.wind = 'open-meteo+stormglass'; } }

return base;
}

// ── CALCOLO ROTAZIONE VENTO ──────────────────────────────────────────────────────────

function calcWindRotation(prevDir, currDir) { if (prevDir === null || currDir === null) return null; let diff = currDir - prevDir; if (diff > 180) diff -= 360; if (diff < -180) diff += 360; return diff; // positivo = oraria, negativo = antioraria }

// ── GENERA TESTO BRIEFING ────────────────────────────────────────────────────────────

function generateBriefingText(zoneName, diagnosis, data, localEffects, forecast, window, alerts) { const { case: synCase, confidence, description } = diagnosis; const { wind_speed, wind_dir, wave_height, swell_height, pressure, pressure_trend_3h, temp_air } = data;

const dirName = (d) => ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSO','SO','OSO','O','ONO','NO','NNO'][Math.round(d/22.5)%16];
const highAlerts = alerts.filter(a => a.severity === 'high');

let text = 'ZONA ' + zoneName.toUpperCase() + '\n'; text += 'Pressione: ' + pressure.toFixed(0) + ' hPa (' + (pressure_trend_3h >= 0 ? '+' : '') + pressure_trend_3h.toFixed(1) + '/3h)\n'; text += 'Vento: ' + wind_speed.toFixed(0) + 'kn da ' + dirName(wind_dir) + ' | Onda: ' + wave_height.toFixed(1) + 'm'; if (swell_height > 0.3) text += ' | Swell: ' + swell_height.toFixed(1) + 'm'; text += '\n\nPATTERN: ' + description + ' (confidenza ' + confidence + '%)\n';

if (highAlerts.length > 0) {
text += '\nALLERTE ATTIVE:\n' + highAlerts.map(function(a){return a.msg;}).join('\n') + '\n'; }

text += '\nEVOLUZIONE:\n';
text += '• 6h: ' + forecast.h6.label + ' — vento max ' + forecast.h6.wind_max + 'kn, onda max ' + forecast.h6.wave_max + 'm\n'; text += '• 12h: ' + forecast.h12.label + ' — vento max ' + forecast.h12.wind_max + 'kn, onda max ' + forecast.h12.wave_max + 'm\n'; text += '• 24h: ' + forecast.h24.label + ' — vento max ' + forecast.h24.wind_max + 'kn, onda max ' + forecast.h24.wave_max + 'm\n';

text += '\nFINESTRA OPERATIVA: ' + window.reason; if (window.next_window) text += '\nProssima finestra: ' + window.next_window;

return text;
}

// ── VERCEL API HANDLER ──────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {

res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

if (req.method === 'OPTIONS') {
return res.status(204).end();
}

const action = req.query.action || 'zones'; const zoneKey = req.query.zone || null;

// /api/engine?action=ping
if (action === 'ping') {
return res.status(200).json({
ok: true,
engine: 'nautilus-engine',
v: '1.0.0',
ts: Date.now()
});
}

// /api/engine?action=zones
if (action === 'zones') {
const list = Object.entries(ZONES).map(function(entry) { return {
key: entry[0],
name: entry[1].name,
ports: Object.keys(entry[1].ports).length
};
});
return res.status(200).json({ zones: list }); }

// /api/engine?action=run — calcola tutte le zone if (action === 'run') { const sgKey = process.env.STORMGLASS_KEY || null; const results = {}; for (const zk of Object.keys(ZONES)) { try { results[zk] = await calcZone(zk, sgKey); } catch (err) { results[zk] = { error: err.message, zone: zk, updated: new Date().toISOString() }; } } return res.status(200).json({ ok: true, results: results, ts: Date.now() }); }

// /api/engine?action=zone&zone=elba_piombino
if (action === 'zone') {
if (!zoneKey || !ZONES[zoneKey]) {
return res.status(404).json({ error: 'Zona non trovata. Zone disponibili: ' + Object.keys(ZONES).join(', ') }); } try { const sgKey = process.env.STORMGLASS_KEY || null; const result = await calcZone(zoneKey, sgKey); return res.status(200).json(result); } catch (err) { return res.status(500).json({ error: err.message }); } }

return res.status(200).json({
engine: 'nautilus-engine v1.0.0 by mdisailor engine',
endpoints: [
'/api/engine?action=ping',
'/api/engine?action=zones',
'/api/engine?action=run',
'/api/engine?action=zone&zone=elba_piombino',
'/api/engine?action=zone&zone=viareggio_livorno'
]
});
};

async function calcZone(zoneKey, sgKey) { const zone = ZONES[zoneKey];

// Fetch Open-Meteo (always)
const omData = await fetchOpenMeteo(zone.lat, zone.lon);

// Fetch Stormglass (if key available)
let sgRaw = null;
let sgData = null;
let hasStormglass = false;
if (sgKey) {
try {
sgRaw = await fetchStormglass(zone.lat, zone.lon, sgKey); sgData = extractStormglassData(sgRaw); hasStormglass = sgData !== null; } catch(e) { // Stormglass failed - continue with OM only hasStormglass = false; } }

const currentData = extractCurrentData(omData, sgData); const diagnosis = diagnoseSynopticCase(currentData);
const localEffects = calcLocalEffects(zoneKey, currentData); const ports = calcPortAccess(zoneKey, currentData, localEffects); const forecast = buildForecast(diagnosis, currentData, null); const win = calcOperationalWindow(diagnosis, currentData); const alerts = buildAlerts(diagnosis, currentData, localEffects, ports); const briefingText = generateBriefingText( zone.name, diagnosis, currentData, localEffects, forecast, win, alerts );

// Reliability score
const strongSignals = diagnosis.signals.filter(function(s) { return s.strength === 'strong'; }).length; const totalSignals = diagnosis.signals.length; const reliability = calcReliability(hasStormglass, false, strongSignals, totalSignals);

return {
zone: zoneKey,
name: zone.name,
updated: new Date().toISOString(),
raw: currentData,
diagnosis: diagnosis,
reliability: reliability,
reliability_note: hasStormglass ? 'Open-Meteo + Stormglass' : 'Solo Open-Meteo',
local_effects: localEffects,
forecast: forecast,
ports: ports,
window: win,
alerts: alerts,
briefing_text: briefingText
};
}

// Fine codice

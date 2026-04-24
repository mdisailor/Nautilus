// NAUTILUS ENGINE - Vercel API - engine.js - v2.9.32 - by mdisailor engine
// Motore diagnostico meteo-marino - 12 zone puntuali
// Zone default: canale_piombino, livorno, viareggio
// Endpoints: /api/engine?action=ping|zones|zone&zone=xxx

//- ZONE PUNTUALI -

var ZONES = {
canale_piombino: {
enabled: true,
name: 'Canale di Piombino',
lat: 42.92, lon: 10.50,
ports: {
piombino:  { name: 'Piombino',  exposure: 'SW', shelter: 'medium', swell_threshold: 1.0 },
cavo:      { name: 'Cavo',      exposure: 'N',  shelter: 'low',    swell_threshold: 0.8 },
punta_ala: { name: 'Punta Ala', exposure: 'SW', shelter: 'medium', swell_threshold: 1.2 },
},
local_effects: {
venturi_piombino: { desc: 'Venturi Canale di Piombino', active_wind_dirs: [270, 360], amplification: 1.35, note: 'Vento reale +35% nel canale con vento da W-N' },
cross_sea_canale: { desc: 'Mare incrociato nel canale', active_wind_dirs: [0, 360], note: 'Correnti di marea + onda frontale = mare incrociato pericoloso' },
}
},
livorno: {
enabled: true,
name: 'Livorno',
lat: 43.548, lon: 10.310,
ports: {
livorno:        { name: 'Livorno',        exposure: 'SW', shelter: 'high', swell_threshold: 2.0 },


},
local_effects: {
  fetch_sw: { desc: 'Fetch aperto SW', active_wind_dirs: [210, 270], note: 'Costa esposta - mare formato rapidamente con Libeccio' },
  gorgona_scia: { desc: 'Scia sottovento Gorgona', active_wind_dirs: [270, 360], note: 'Zona di calma relativa sottovento a Gorgona con vento da W-NW' },
}


},
viareggio: {
enabled: true,
name: 'Viareggio - Versilia',
lat: 43.87, lon: 10.23,
ports: {
viareggio:   { name: 'Viareggio',      exposure: 'W', shelter: 'medium', swell_threshold: 1.2 },
marina_pisa: { name: 'Marina di Pisa', exposure: 'W', shelter: 'medium', swell_threshold: 1.0 },
},
local_effects: {
fetch_sw: { desc: 'Fetch aperto SW', active_wind_dirs: [210, 270], note: 'Costa bassa esposta - Libeccio genera mare velocemente' },
convergenza_arno: { desc: 'Convergenza termica Arno', active_wind_dirs: [0, 360], note: 'Brezza termica locale nelle ore diurne - turbolenza costiera' },
}
},
capraia: {
enabled: true,
name: 'Capraia',
lat: 43.04, lon: 9.84,
ports: {
capraia: { name: 'Capraia Porto', exposure: 'NW', shelter: 'low', swell_threshold: 0.7 },
},
local_effects: {
rotore_capraia: { desc: 'Rotore sottovento Capraia', active_wind_dirs: [0, 60], note: 'Turbolenza irregolare sottovento con vento da N-NE' },
esposizione_totale: { desc: 'Isola esposta su tutti i lati', active_wind_dirs: [0, 360], note: 'Nessun ridosso naturale - condizioni amplificate rispetto alla terraferma' },
}
},
elba_nord: {
enabled: true,
name: 'Elba Nord - Portoferraio',
lat: 42.82, lon: 10.32,
ports: {
portoferraio: { name: 'Portoferraio', exposure: 'NE', shelter: 'high',   swell_threshold: 1.5 },
cavo:         { name: 'Cavo',         exposure: 'N',  shelter: 'low',    swell_threshold: 0.8 },
rio_marina:   { name: 'Rio Marina',   exposure: 'E',  shelter: 'medium', swell_threshold: 1.2 },
},
local_effects: {
canale_corsica: { desc: 'Tramontana Canale di Corsica', active_wind_dirs: [330, 30], amplification: 1.40, note: 'Canalizzazione tra Elba e Capraia - +40% con Tramontana' },
venturi_piombino: { desc: 'Influenza Venturi Piombino', active_wind_dirs: [270, 360], amplification: 1.20, note: 'Accelerazione proveniente dal canale a Nord' },
}
},
elba_sud: {
enabled: true,
name: 'Elba Sud - Porto Azzurro',
lat: 42.75, lon: 10.40,
ports: {
porto_azzurro: { name: 'Porto Azzurro',  exposure: 'SE', shelter: 'high',   swell_threshold: 1.8 },
marina_campo:  { name: 'Marina di Campo',exposure: 'S',  shelter: 'medium', swell_threshold: 1.0 },
},
local_effects: {
libeccio_capanne: { desc: 'Libeccio accelerato Monte Capanne', active_wind_dirs: [210, 270], amplification: 1.25, note: 'Raffiche improvvise sul versante SW con Libeccio' },
}
},
gorgona: {
enabled: false, // disabilitata - risparmio Redis
name: 'Gorgona',
lat: 43.43, lon: 9.89,
ports: {
gorgona: { name: 'Gorgona', exposure: 'ALL', shelter: 'low', swell_threshold: 0.6 },
},
local_effects: {
esposizione_totale: { desc: 'Isola completamente esposta', active_wind_dirs: [0, 360], note: 'Nessun ridosso - tutte le direzioni pericolose con vento forte' },
}
},
giglio: {
enabled: true,
name: 'Isola del Giglio',
lat: 42.37, lon: 10.90,
ports: {
giglio_porto:   { name: 'Giglio Porto',   exposure: 'NE', shelter: 'medium', swell_threshold: 1.0 },
giglio_campese: { name: 'Giglio Campese', exposure: 'W',  shelter: 'low',    swell_threshold: 0.8 },
},
local_effects: {
fetch_sw: { desc: 'Fetch aperto SW-W', active_wind_dirs: [210, 280], note: 'Esposizione diretta al Libeccio - mare formato rapidamente' },
correnti_giglio: { desc: 'Correnti variabili Giglio', active_wind_dirs: [0, 360], note: 'Batimetria irregolare - correnti locali imprevedibili' },
}
},
castiglioncello: {
enabled: false, // disabilitata - vicina a Livorno
name: 'Castiglioncello - Cecina',
lat: 43.40, lon: 10.41,
ports: {
castiglioncello: { name: 'Castiglioncello', exposure: 'W',  shelter: 'low',    swell_threshold: 0.8 },
marina_cecina:   { name: 'Marina di Cecina',exposure: 'SW', shelter: 'medium', swell_threshold: 1.0 },
san_vincenzo:    { name: 'San Vincenzo',     exposure: 'W',  shelter: 'low',    swell_threshold: 0.8 },
},
local_effects: {
fetch_sw: { desc: 'Fetch aperto SW', active_wind_dirs: [210, 270], note: 'Costa bassa con scarsa protezione dai settori occidentali' },
}
},
punta_ala: {
enabled: true,
name: 'Punta Ala - Follonica',
lat: 42.93, lon: 10.74,
ports: {
punta_ala: { name: 'Punta Ala', exposure: 'SW', shelter: 'medium', swell_threshold: 1.2 },
follonica:  { name: 'Follonica', exposure: 'SW', shelter: 'low',    swell_threshold: 0.9 },
},
local_effects: {
fetch_sw: { desc: 'Fetch aperto SW', active_wind_dirs: [210, 270], note: 'Zona esposta al Libeccio con onda che si propaga indisturbata' },
correnti_giglio: { desc: 'Correnti variabili zona Grosseto', active_wind_dirs: [0, 360], note: 'Correnti di marea e residui frontali - mare incrociato possibile' },
}
},
la_spezia: {
enabled: true,
name: 'La Spezia - Lerici',
lat: 44.10, lon: 9.82,
ports: {
la_spezia:   { name: 'La Spezia',   exposure: 'S',  shelter: 'high',   swell_threshold: 2.0 },
lerici:      { name: 'Lerici',      exposure: 'S',  shelter: 'medium', swell_threshold: 1.2 },
portovenere: { name: 'Portovenere', exposure: 'SW', shelter: 'medium', swell_threshold: 1.0 },
},
local_effects: {
fetch_libeccio_ligure: { desc: 'Fetch Libeccio Ligure', active_wind_dirs: [200, 260], note: 'Golfo aperto al Libeccio - swell importante con vento da SW' },
}
},
bastia: {
enabled: false, // disabilitata - risparmio Redis
name: 'Bastia - Nord Corsica',
lat: 42.70, lon: 9.45,
ports: {
bastia:        { name: 'Bastia',        exposure: 'E',  shelter: 'medium', swell_threshold: 1.5 },
saint_florent: { name: 'Saint-Florent', exposure: 'NW', shelter: 'medium', swell_threshold: 1.2 },
},
local_effects: {
tramontane_corsica: { desc: 'Tramontane accelerata Corsica', active_wind_dirs: [330, 30], amplification: 1.30, note: 'Vento canalizzato tra le montagne corse - raffiche violente' },
canale_corsica: { desc: 'Canale di Corsica', active_wind_dirs: [330, 60], amplification: 1.25, note: 'Accelerazione nel canale tra Corsica e continente' },
}
},
};

//- HELPER FUNCTIONS -

function sn(v, def) { return (v !== null && v !== undefined) ? Number(v) : (def || 0); }
function sf(v, d) { return (v !== null && v !== undefined) ? Number(v).toFixed(d) : 'n/d'; }

//- DIAGNOSI SINOTTICA -

function diagnoseSynopticCase(data, rotationAnalysis) {
if (!rotationAnalysis) rotationAnalysis = { trend: 'insufficient_data', hours: 0, rotation: null };
var pressure_trend_1h = sn(data.pressure_trend_1h);
var pressure_trend_3h = sn(data.pressure_trend_3h);
var wind_dir = sn(data.wind_dir);
var wind_dir_prev = sn(data.wind_dir_prev);
var wave_height = sn(data.wave_height);
var swell_height = sn(data.swell_height);
var swell_period = sn(data.swell_period);
var swell_dir = sn(data.swell_dir);
var temp_air = sn(data.temp_air, 15);
var temp_water = sn(data.temp_water, 15);
var humidity = sn(data.humidity, 70);
var wind_speed = sn(data.wind_speed);

var signals = [];
var caseScores = { A: 0, B: 0, C: 0, D: 0, stable: 0 };

// 1 - TENDENZA BARICA
if (pressure_trend_3h <= -4.0) {
signals.push({ type: 'pressure_drop', strength: 'strong', msg: 'Calo pressione ' + sf(pressure_trend_3h,1) + ' hPa/3h - fronte in arrivo entro 6-12h' });
caseScores.A += 3; caseScores.C += 2;
} else if (pressure_trend_3h <= -2.0) {
signals.push({ type: 'pressure_drop', strength: 'strong', msg: 'Calo pressione ' + sf(pressure_trend_3h,1) + ' hPa/3h - deterioramento probabile' });
caseScores.A += 2; caseScores.B += 1; caseScores.C += 1;
} else if (pressure_trend_3h <= -1.0) {
signals.push({ type: 'pressure_drop', strength: 'medium', msg: 'Calo pressione ' + sf(pressure_trend_3h,1) + ' hPa/3h - monitorare' });
caseScores.B += 2;
} else if (pressure_trend_3h >= 1.5) {
signals.push({ type: 'pressure_rise', strength: 'medium', msg: 'Rialzo pressione ' + sf(pressure_trend_3h,1) + ' hPa/3h - rimonta in corso' });
caseScores.D += 3; caseScores.stable += 2;
} else {
signals.push({ type: 'pressure_stable', strength: 'weak', msg: 'Pressione stabile' });
caseScores.stable += 2;
}

// 2 - ROTAZIONE VENTO
// Ignore rotation when wind is very light (< 5kn) - direction is unreliable
var windRotation = calcWindRotation(wind_dir_prev, wind_dir);
var rotationMinWind = 5; // kn threshold
if (windRotation !== null && wind_speed >= rotationMinWind) {
var rotDeg = Math.abs(windRotation);
var isVeering = windRotation > 0;
// Require stronger signal for light winds (5-10kn needs 45deg, strong wind needs 30deg)
var rotThreshold = wind_speed < 10 ? 45 : 30;
if (rotDeg > rotThreshold) {
if (isVeering) {
var fromS = wind_dir_prev >= 150 && wind_dir_prev <= 240;
var fromN = wind_dir_prev >= 330 || wind_dir_prev <= 30;
var fromW = wind_dir_prev >= 240 && wind_dir_prev < 330;
if (fromS) {
signals.push({ type: 'wind_veering', strength: 'strong', msg: 'Rotazione oraria S->N ' + sf(rotDeg,0) + ' gradi - CASO A: fronte freddo' });
caseScores.A += 4;
} else if (fromN) {
signals.push({ type: 'wind_veering', strength: 'strong', msg: 'Rotazione oraria N->S ' + sf(rotDeg,0) + ' gradi - CASO B: fronte caldo' });
caseScores.B += 4;
} else if (fromW) {
signals.push({ type: 'wind_veering', strength: 'medium', msg: 'Rotazione oraria W->N ' + sf(rotDeg,0) + ' gradi - possibile miglioramento' });
caseScores.D += 2;
} else {
signals.push({ type: 'wind_veering', strength: 'medium', msg: 'Rotazione oraria ' + sf(rotDeg,0) + ' gradi' });
caseScores.A += 1; caseScores.B += 1;
}
} else {
var fromS2 = wind_dir_prev >= 150 && wind_dir_prev <= 240;
var fromN2 = wind_dir_prev >= 330 || wind_dir_prev <= 30;
var fromE2 = wind_dir_prev >= 45 && wind_dir_prev < 150;
if (fromS2) {
signals.push({ type: 'wind_backing', strength: 'strong', msg: 'Rotazione antioraria S->N ' + sf(rotDeg,0) + ' gradi - CASO C: ciclogenesi' });
caseScores.C += 4;
} else if (fromN2) {
signals.push({ type: 'wind_backing', strength: 'medium', msg: 'Rotazione antioraria N->S ' + sf(rotDeg,0) + ' gradi - CASO D: miglioramento' });
caseScores.D += 3;
} else if (fromE2) {
signals.push({ type: 'wind_backing', strength: 'medium', msg: 'Rotazione antioraria E->N ' + sf(rotDeg,0) + ' gradi - CASO D: miglioramento' });
caseScores.D += 2;
} else {
signals.push({ type: 'wind_backing', strength: 'medium', msg: 'Rotazione antioraria ' + sf(rotDeg,0) + ' gradi' });
caseScores.C += 1; caseScores.D += 1;
}
}
}
} else if (wind_speed < rotationMinWind) {
signals.push({ type: 'wind_light', strength: 'weak', msg: 'Vento leggero ' + sf(wind_speed,0) + 'kn - direzione inaffidabile per diagnosi' });
caseScores.stable += 2;
}

// 3 - SWELL ANTICIPATO
if (swell_period >= 10 && swell_height >= 0.8) {
var swellWindAngle = Math.abs(swell_dir - wind_dir);
var angleDiff = Math.min(swellWindAngle, 360 - swellWindAngle);
if (angleDiff > 45) {
signals.push({ type: 'early_swell', strength: 'strong', msg: 'Swell lungo ' + sf(swell_period,0) + 's da direzione diversa dal vento - fronte in avvicinamento' });
caseScores.B += 3;
}
}

// 4 - MARE INCROCIATO
if (swell_height > 0.5 && wave_height > 0.5) {
var crossAngle = Math.abs(swell_dir - wind_dir);
var normAngle = Math.min(crossAngle, 360 - crossAngle);
if (normAngle > 60) {
signals.push({ type: 'cross_sea', strength: normAngle > 90 ? 'strong' : 'medium',
msg: 'Mare incrociato: swell ' + sf(swell_dir,0) + ' vs vento ' + sf(wind_dir,0) + ' - angolo ' + sf(normAngle,0) + ' gradi' });
}
}

// 5 - NEBBIA DA AVVEZIONE
var deltaTempAW = temp_air - temp_water;
if (deltaTempAW < 1.0 && humidity > 85) {
signals.push({ type: 'fog_risk', strength: deltaTempAW < 0.5 ? 'strong' : 'medium',
msg: 'Delta T aria/acqua ' + sf(deltaTempAW,1) + ' C, umidita ' + sf(humidity,0) + '% - rischio nebbia da avvezione' });
}

// 6 - TEMPORALE CONVETTIVO
var hour = new Date().getUTCHours();
if (humidity > 75 && temp_air > 20 && hour >= 12 && hour <= 18) {
signals.push({ type: 'convective_risk', strength: 'medium', msg: 'Condizioni favorevoli a sviluppo convettivo pomeridiano' });
}

// CASO PREVALENTE
var caseScoreVals = Object.values(caseScores);
var maxScore = caseScoreVals[0];
for (var si = 1; si < caseScoreVals.length; si++) { if (caseScoreVals[si] > maxScore) maxScore = caseScoreVals[si]; }
var dominantCase = 'stable';
var caseKeys = Object.keys(caseScores);
for (var ci = 0; ci < caseKeys.length; ci++) { if (caseScores[caseKeys[ci]] === maxScore) { dominantCase = caseKeys[ci]; break; } }

var totalScore = 0;
for (var ti = 0; ti < caseScoreVals.length; ti++) { totalScore += caseScoreVals[ti]; }
var rawConf = totalScore > 0 ? Math.round((maxScore / totalScore) * 100) : 50;

// Limit confidence based on available history
// Without rotation history, max 65% - we cannot confirm rotation trend
var maxConf = 65;
var confLabel = 'pattern probabile';
if (rotationAnalysis.hours >= 12 && rotationAnalysis.trend !== 'variable' && rotationAnalysis.consistent) {
maxConf = 92;
confLabel = 'confermato da storico ' + rotationAnalysis.hours + 'h';
} else if (rotationAnalysis.hours >= 6 && rotationAnalysis.trend !== 'insufficient_data') {
maxConf = 78;
confLabel = 'probabile - storico ' + rotationAnalysis.hours + 'h';
} else if (rotationAnalysis.hours > 0) {
maxConf = 68;
confLabel = 'indicativo - dati insufficienti (' + rotationAnalysis.hours + 'h)';
}

// Use rotationAnalysis trend to ALSO influence scores, not just confidence
if (rotationAnalysis.trend === 'veering' && rotationAnalysis.hours >= 6) {
  caseScores.A += 2; caseScores.B += 1;
}
if (rotationAnalysis.trend === 'backing' && rotationAnalysis.hours >= 6) {
  caseScores.C += 1; caseScores.D += 2;
}
if (rotationAnalysis.trend === 'stable' && rotationAnalysis.hours >= 6) {
  caseScores.stable += 3;
}
// Boost confidence if rotation history confirms the diagnosed case
if (rotationAnalysis.trend === 'veering' && (dominantCase === 'A' || dominantCase === 'B')) maxConf = Math.min(95, maxConf + 10);
if (rotationAnalysis.trend === 'backing' && (dominantCase === 'C' || dominantCase === 'D')) maxConf = Math.min(95, maxConf + 10);
if (rotationAnalysis.trend === 'stable' && dominantCase === 'stable') maxConf = Math.min(90, maxConf + 10);

var confidence = Math.min(maxConf, rawConf);

var caseDescriptions = {
A: 'Rotazione oraria S->N - Fronte freddo in transito',
B: 'Rotazione oraria N->S - Warm advection / Fronte caldo',
C: 'Rotazione antioraria S->N - Ciclogenesi / Stallo',
D: 'Rotazione antioraria N->S - Miglioramento post-perturbato',
stable: 'Situazione stabile - nessun pattern frontale attivo'
};

return {
case: dominantCase,
confidence: confidence,
confidence_label: confLabel,
description: caseDescriptions[dominantCase],
signals: signals,
scores: caseScores,
history_hours: rotationAnalysis.hours
};
}

//- EFFETTI LOCALI -

function calcLocalEffects(zoneKey, data) {
var zone = ZONES[zoneKey];
var wind_dir = sn(data.wind_dir);
var wind_speed = sn(data.wind_speed);
var temp_air = sn(data.temp_air, 15);
var temp_water = sn(data.temp_water, 15);
var humidity = sn(data.humidity, 70);
var effects = {};

for (var effectKey in zone.local_effects) {
var effect = zone.local_effects[effectKey];
var minDir = effect.active_wind_dirs[0];
var maxDir = effect.active_wind_dirs[1];
var isActive = false;
if (minDir <= maxDir) {
isActive = wind_dir >= minDir && wind_dir <= maxDir;
} else {
isActive = wind_dir >= minDir || wind_dir <= maxDir;
}
var active = isActive && wind_speed >= 8;
effects[effectKey] = {
active: active,
desc: effect.desc,
note: effect.note,
amplified_speed: (active && effect.amplification) ? Math.round(wind_speed * effect.amplification) : null
};
}

effects.fog_advection = {
active: (temp_air - temp_water) < 1.0 && humidity > 85,
desc: 'Nebbia da avvezione',
note: 'Delta T aria/acqua: ' + sf(temp_air - temp_water, 1) + ' C'
};

return effects;
}

//- ACCESSIBILITA PORTI -

function calcPortAccess(zoneKey, data, localEffects) {
var zone = ZONES[zoneKey];
var wave_height = sn(data.wave_height);
var swell_height = sn(data.swell_height);
var swell_dir = sn(data.swell_dir);
var wind_dir = sn(data.wind_dir);
var wind_speed = sn(data.wind_speed);
var visibility = sn(data.visibility, 10);
var ports = {};

for (var portKey in zone.ports) {
var port = zone.ports[portKey];
var effectiveWave = Math.max(wave_height, swell_height * 0.7);
var risk = 'low';
var accessible = true;
var notes = [];


if (effectiveWave > port.swell_threshold * 1.5) {
  risk = 'high'; accessible = false;
  notes.push('Onda ' + sf(effectiveWave,1) + 'm supera soglia (' + port.swell_threshold + 'm)');
} else if (effectiveWave > port.swell_threshold) {
  risk = 'medium';
  notes.push('Onda ' + sf(effectiveWave,1) + 'm vicina alla soglia');
}

var expAngles = { 'N':0,'NE':45,'E':90,'SE':135,'S':180,'SW':225,'W':270,'NW':315,'ALL':0 };
var expAngle = expAngles[port.exposure] || 0;
if (port.exposure !== 'ALL') {
  var swellAngleDiff = Math.abs(((swell_dir - expAngle) + 360) % 360);
  var isExposed = Math.min(swellAngleDiff, 360 - swellAngleDiff) < 60;
  if (isExposed && swell_height > 0.8) {
    if (risk === 'low') risk = 'medium';
    notes.push('Esposizione diretta swell da ' + sf(swell_dir,0) + ' gradi');
  }
} else {
  // ALL exposure - only escalate if wave is significant
  if (effectiveWave > 0.8 && risk === 'low') risk = 'medium';
}

if (wind_speed > 25) {
  risk = 'high'; accessible = false;
  notes.push('Vento ' + sf(wind_speed,0) + 'kn - manovra difficile');
} else if (wind_speed > 18) {
  if (risk === 'low') risk = 'medium';
  notes.push('Vento sostenuto ' + sf(wind_speed,0) + 'kn');
}

if (visibility < 1.0) {
  if (risk === 'low') risk = 'medium';
  notes.push('Visibilita ridotta ' + sf(visibility * 1000, 0) + 'm');
}

// Effetti locali specifici
if (localEffects.venturi_piombino && localEffects.venturi_piombino.active && portKey === 'piombino') {
  risk = risk === 'low' ? 'medium' : 'high';
  notes.push('Venturi attivo nel canale');
}
if (localEffects.rotore_capraia && localEffects.rotore_capraia.active) {
  if (risk === 'low') risk = 'medium';
  notes.push('Rotore sottovento attivo');
}

ports[portKey] = {
  name: port.name,
  risk: risk,
  accessible: accessible,
  note: notes.join(' - ') || 'Condizioni nella norma'
};


}
return ports;
}

//- SCENARI PREVISIONALI -

function buildForecast(diagnosis, data) {
var synCase = diagnosis.case;
var wind_speed = sn(data.wind_speed);
var wave_height = sn(data.wave_height);

var h6, h12, h24;

if (synCase === 'A') {
h6  = { scenario: 'peggioramento_rapido',   label: 'Peggioramento rapido',   wind_max: Math.round(wind_speed*1.6), wave_max: parseFloat((wave_height*1.8).toFixed(1)), confidence: 82, color: 'danger', note: 'Fronte freddo in transito - raffiche e mare formato rapidamente' };
h12 = { scenario: 'post_fronte_instabile',  label: 'Post-fronte instabile',  wind_max: Math.round(wind_speed*1.3), wave_max: parseFloat((wave_height*1.5).toFixed(1)), confidence: 65, color: 'warn',   note: 'Mare ancora formato - vento in attenuazione ma ondoso residuo' };
h24 = { scenario: 'normalizzazione',         label: 'Normalizzazione',         wind_max: Math.round(wind_speed*0.8), wave_max: parseFloat((wave_height*0.9).toFixed(1)), confidence: 55, color: 'safe',   note: 'Progressivo miglioramento - swell residuo possibile' };
} else if (synCase === 'B') {
h6  = { scenario: 'deterioramento_graduale', label: 'Deterioramento graduale', wind_max: Math.round(wind_speed*1.3), wave_max: parseFloat((wave_height*1.4).toFixed(1)), confidence: 78, color: 'warn',   note: 'Fronte caldo in avvicinamento - visibilita in calo, swell in aumento' };
h12 = { scenario: 'fronte_al_passaggio',     label: 'Fronte al passaggio',     wind_max: Math.round(wind_speed*1.5), wave_max: parseFloat((wave_height*1.7).toFixed(1)), confidence: 60, color: 'danger', note: 'Piogge continue - nebbia possibile - navigazione strumentale' };
h24 = { scenario: 'warm_sector',             label: 'Warm sector',             wind_max: Math.round(wind_speed*1.2), wave_max: parseFloat((wave_height*1.3).toFixed(1)), confidence: 45, color: 'warn',   note: 'Miglioramento solo dopo completo passaggio del fronte' };
} else if (synCase === 'C') {
h6  = { scenario: 'peggioramento_prolungato',label: 'Peggioramento prolungato',wind_max: Math.round(wind_speed*1.8), wave_max: parseFloat((wave_height*2.0).toFixed(1)), confidence: 65, color: 'danger', note: 'Ciclogenesi attiva - mare confuso multi-direzionale' };
h12 = { scenario: 'massimo_perturbazione',   label: 'Massimo perturbazione',   wind_max: Math.round(wind_speed*2.0), wave_max: parseFloat((wave_height*2.2).toFixed(1)), confidence: 50, color: 'danger', note: 'Condizioni severe - evitare navigazione se possibile' };
h24 = { scenario: 'evoluzione_incerta',      label: 'Evoluzione incerta',      wind_max: Math.round(wind_speed*1.4), wave_max: parseFloat((wave_height*1.6).toFixed(1)), confidence: 35, color: 'warn',   note: 'Dipende da traiettoria del minimo - monitorare costantemente' };
} else if (synCase === 'D') {
h6  = { scenario: 'miglioramento_in_corso',  label: 'Miglioramento in corso',  wind_max: Math.round(wind_speed*0.8), wave_max: parseFloat((wave_height*0.85).toFixed(1)), confidence: 82, color: 'safe',   note: 'Vento in attenuazione - swell residuo ancora presente' };
h12 = { scenario: 'stabilizzazione',         label: 'Stabilizzazione',         wind_max: Math.round(wind_speed*0.6), wave_max: parseFloat((wave_height*0.7).toFixed(1)),  confidence: 75, color: 'safe',   note: 'Condizioni in miglioramento - attenzione a seiche nei porti' };
h24 = { scenario: 'bel_tempo',               label: 'Bel tempo',               wind_max: Math.round(wind_speed*0.5), wave_max: parseFloat((wave_height*0.5).toFixed(1)),  confidence: 65, color: 'safe',   note: 'Buone condizioni attese - finestra favorevole' };
} else {
h6  = { scenario: 'stabile', label: 'Stabile', wind_max: Math.round(wind_speed*1.1), wave_max: parseFloat((wave_height*1.1).toFixed(1)), confidence: 78, color: 'safe', note: 'Condizioni stabili - variazioni minime attese' };
h12 = { scenario: 'stabile', label: 'Stabile', wind_max: Math.round(wind_speed*1.15),wave_max: parseFloat((wave_height*1.15).toFixed(1)),confidence: 65, color: 'safe', note: 'Mantenimento condizioni attuali' };
h24 = { scenario: 'possibile_variazione', label: 'Possibile variazione', wind_max: Math.round(wind_speed*1.2), wave_max: parseFloat((wave_height*1.2).toFixed(1)), confidence: 50, color: 'gold', note: 'Monitorare evoluzione barica oltre 12h' };
}

return { h6: h6, h12: h12, h24: h24 };
}

//- FINESTRA OPERATIVA -

function calcOperationalWindow(diagnosis, data) {
var synCase = diagnosis.case;
var wind_speed = sn(data.wind_speed);
var wave_height = sn(data.wave_height);
var pressure_trend_1h = sn(data.pressure_trend_1h);
var hour = new Date().getUTCHours() + 1;
var currentlyOk = wind_speed < 20 && wave_height < 1.5;

if (synCase === 'A') {
if (currentlyOk && pressure_trend_1h > -2) {
return { status: 'closing', best_start: 'Ora', best_end: Math.min(hour+2, 23).toString().padStart(2,'0') + ':00', reason: 'Finestra in chiusura - fronte freddo in arrivo. Parti subito o aspetta 18-24h', next_window: 'Domani mattina dopo le 07:00', color: 'warn' };
}
return { status: 'closed', best_start: null, best_end: null, reason: 'Finestra chiusa - fronte freddo attivo. Attendere normalizzazione', next_window: 'Domani mattina - verificare condizioni', color: 'danger' };
}
if (synCase === 'B') {
// If wind is actually light, don't close window just because of case B diagnosis
if (wind_speed < 8 && wave_height < 0.8) {
return { status: 'open', best_start: 'Ora', best_end: '18:00', reason: 'Condizioni attuali buone nonostante pattern B - monitorare deterioramento', next_window: null, color: 'warn' };
}
if (hour < 10 && currentlyOk) {
return { status: 'open', best_start: 'Ora', best_end: Math.min(hour+3, 10).toString().padStart(2,'0') + ':00', reason: 'Finestra mattutina disponibile prima del peggioramento. Rientro anticipato consigliato', next_window: 'Dopo il passaggio del fronte - 24-36h', color: 'warn' };
}
return { status: 'closed', best_start: null, best_end: null, reason: 'Finestra chiusa - fronte caldo in avvicinamento. Non partire', next_window: 'Domani dopo le 10:00 - verificare passaggio fronte', color: 'danger' };
}
if (synCase === 'C') {
return { status: 'closed', best_start: null, best_end: null, reason: 'Finestra chiusa - ciclogenesi attiva. Condizioni imprevedibili', next_window: 'Indefinita - monitorare evoluzione minimo', color: 'danger' };
}
if (synCase === 'D') {
if (currentlyOk) {
return { status: 'open', best_start: 'Ora', best_end: '18:00', reason: 'Finestra aperta - rimonta anticiclonica. Attenzione a swell residuo nelle imboccature', next_window: null, color: 'safe' };
}
return { status: 'opening', best_start: '08:00', best_end: '17:00', reason: 'Finestra in apertura - attendere attenuazione ondoso residuo', next_window: 'Domani mattina dalle 08:00', color: 'warn' };
}
if (currentlyOk) {
return { status: 'open', best_start: '06:00', best_end: '17:00', reason: 'Finestra aperta - condizioni stabili. Brezza termica pomeridiana possibile', next_window: null, color: 'safe' };
}
return { status: 'limited', best_start: '07:00', best_end: '11:00', reason: 'Finestra limitata - vento/onda ai limiti. Usare con cautela', next_window: 'Domani mattina - stesse condizioni attese', color: 'warn' };
}

//- AVVISI -

function buildAlerts(diagnosis, data, localEffects, ports) {
var pressure_trend_3h = sn(data.pressure_trend_3h);
var wind_speed = sn(data.wind_speed);
var wave_height = sn(data.wave_height);
var swell_height = sn(data.swell_height);
var swell_period = sn(data.swell_period);
var temp_air = sn(data.temp_air, 15);
var temp_water = sn(data.temp_water, 15);
var humidity = sn(data.humidity, 70);
var alerts = [];

if (pressure_trend_3h <= -4.0) alerts.push({ type: 'pressure_critical', severity: 'high', msg: '[ROSSO] Calo pressione ' + sf(pressure_trend_3h,1) + ' hPa/3h - fronte IMMINENTE entro 3-6h' });
else if (pressure_trend_3h <= -2.0) alerts.push({ type: 'pressure_drop', severity: 'medium', msg: '[ATTENZIONE] Calo pressione ' + sf(pressure_trend_3h,1) + ' hPa/3h - peggioramento entro 6-12h' });

var wind_gust = sn(data.wind_gust);
// Raffiche - threshold indipendente dal vento medio
if (wind_gust >= 35) alerts.push({ type: 'gust_critical', severity: 'high', msg: '[ROSSO] Raffiche ' + sf(wind_gust,0) + 'kn - Forza 8+. Pericolo immediato' });
else if (wind_gust >= 28) alerts.push({ type: 'gust_high', severity: 'high', msg: '[ROSSO] Raffiche ' + sf(wind_gust,0) + 'kn - Forza 7. Navigazione sconsigliata' });
else if (wind_gust >= 22) alerts.push({ type: 'gust_medium', severity: 'medium', msg: '[ATTENZIONE] Raffiche ' + sf(wind_gust,0) + 'kn - Rischio sbandamento improvviso' });
// Vento medio
if (wind_speed >= 28) alerts.push({ type: 'wind_high', severity: 'high', msg: '[ROSSO] Vento medio ' + sf(wind_speed,0) + 'kn - Forza 7+. Navigazione sconsigliata' });
else if (wind_speed >= 22) alerts.push({ type: 'wind_medium', severity: 'medium', msg: '[ATTENZIONE] Vento medio ' + sf(wind_speed,0) + 'kn - Forza 6. Cautela' });
else if (wind_speed >= 17) alerts.push({ type: 'wind_low', severity: 'low', msg: '[INFO] Vento medio ' + sf(wind_speed,0) + 'kn - Forza 5. Condizioni impegnative per piccole imbarcazioni' });

if (wave_height >= 3.0) alerts.push({ type: 'wave_critical', severity: 'high', msg: '[ROSSO] Onda ' + sf(wave_height,1) + 'm - Mare molto agitato. Navigazione pericolosa' });
else if (wave_height >= 2.0) alerts.push({ type: 'wave_high', severity: 'high', msg: '[ROSSO] Onda ' + sf(wave_height,1) + 'm - Mare agitato. Sconsigliato per imbarcazioni sotto 10m' });
else if (wave_height >= 1.2) alerts.push({ type: 'wave_medium', severity: 'medium', msg: '[ATTENZIONE] Onda ' + sf(wave_height,1) + 'm - Mare mosso' });
else if (wave_height >= 0.8) alerts.push({ type: 'wave_low', severity: 'low', msg: '[INFO] Onda ' + sf(wave_height,1) + 'm - Mare poco mosso' });

if (swell_period >= 10 && swell_height >= 0.8) alerts.push({ type: 'early_swell', severity: 'medium', msg: '[ATTENZIONE] Swell lungo ' + sf(swell_period,0) + 's - sistema perturbato in avvicinamento' });

var deltaT = temp_air - temp_water;
if (deltaT < 0.5 && humidity > 90) alerts.push({ type: 'fog_high', severity: 'high', msg: '[ROSSO] Delta T ' + sf(deltaT,1) + ' C, umidita ' + sf(humidity,0) + '% - nebbia probabile' });
else if (deltaT < 1.0 && humidity > 85) alerts.push({ type: 'fog_risk', severity: 'low', msg: '[INFO] Delta T ' + sf(deltaT,1) + ' C - rischio nebbia nelle ore notturne' });

for (var key in localEffects) {
var ef = localEffects[key];
if (ef.active && ef.amplified_speed) {
alerts.push({ type: 'local_effect', severity: 'medium', msg: '[ATTENZIONE] ' + ef.desc + ' attivo - vento locale stimato ' + ef.amplified_speed + 'kn' });
}
}

var closedPorts = [];
for (var pk in ports) { if (!ports[pk].accessible) closedPorts.push(ports[pk].name); }
if (closedPorts.length > 0) alerts.push({ type: 'ports_closed', severity: 'medium', msg: '[ATTENZIONE] Porti con accesso difficile: ' + closedPorts.join(', ') });

if (diagnosis.case === 'C') alerts.push({ type: 'cyclogenesis', severity: 'high', msg: '[ROSSO] Ciclogenesi identificata - condizioni imprevedibili. Evitare navigazione' });

var order = { high: 0, medium: 1, low: 2 };
alerts.sort(function(a, b) { return order[a.severity] - order[b.severity]; });
return alerts;
}

//- RISCHIO COMPLESSIVO -

function calcOverallRisk(data, alerts, localEffects) {
var wind_speed = sn(data.wind_speed);
var wind_gust = sn(data.wind_gust);
var wave_height = sn(data.wave_height);
var pressure_trend_3h = sn(data.pressure_trend_3h);

// Start from alerts
var hasHigh = alerts.some(function(a) { return a.severity === 'high'; });
var hasMedium = alerts.some(function(a) { return a.severity === 'medium'; });

var level = hasHigh ? 3 : hasMedium ? 2 : 1;
var reasons = [];

// Hard thresholds that ALWAYS override - raffiche prima di tutto
if (wind_gust >= 28) { level = Math.max(level, 3); reasons.push('raffiche ' + Math.round(wind_gust) + 'kn'); }
else if (wind_gust >= 22) { level = Math.max(level, 2); reasons.push('raffiche ' + Math.round(wind_gust) + 'kn'); }

if (wind_speed >= 22) { level = Math.max(level, 3); reasons.push('vento ' + Math.round(wind_speed) + 'kn'); }
else if (wind_speed >= 17) { level = Math.max(level, 2); reasons.push('vento ' + Math.round(wind_speed) + 'kn'); }

if (wave_height >= 2.0) { level = Math.max(level, 3); reasons.push('onda ' + wave_height.toFixed(1) + 'm'); }
else if (wave_height >= 1.2) { level = Math.max(level, 2); reasons.push('onda ' + wave_height.toFixed(1) + 'm'); }

if (pressure_trend_3h <= -4.0) { level = Math.max(level, 3); reasons.push('calo pressione rapido'); }
else if (pressure_trend_3h <= -2.0) { level = Math.max(level, 2); reasons.push('calo pressione'); }

// Active local effects with amplification
for (var key in localEffects) {
var ef = localEffects[key];
if (ef.active && ef.amplified_speed) {
if (ef.amplified_speed >= 28) { level = Math.max(level, 3); reasons.push(ef.desc + ' ' + ef.amplified_speed + 'kn stimati'); }
else if (ef.amplified_speed >= 22) { level = Math.max(level, 2); reasons.push(ef.desc); }
}
}

var labels = { 1: 'BASSO', 2: 'MEDIO', 3: 'ALTO' };
var colors = { 1: 'safe', 2: 'warn', 3: 'danger' };

return {
level: level,
label: labels[level],
color: colors[level],
reasons: reasons,
summary: level === 1 ? 'Condizioni nella norma' :
level === 2 ? 'Cautela: ' + reasons.join(', ') :
'PERICOLO: ' + reasons.join(', ')
};
}

//- AFFIDABILITA -

function calcReliability(hasStormglass, signals, rotationAnalysis) {
var score = 50;
if (hasStormglass) score += 20;
var strong = signals.filter(function(s) { return s.strength === 'strong'; }).length;
score += Math.min(10, strong * 3);
if (rotationAnalysis && rotationAnalysis.hours >= 6) score += 10;
if (rotationAnalysis && rotationAnalysis.hours >= 12) score += 8;
return Math.min(95, Math.max(30, score));
}

//- TESTO BRIEFING -

function generateBriefingText(zoneName, diagnosis, data, forecast, window, alerts) {
var wind_speed = sn(data.wind_speed);
var wind_dir = sn(data.wind_dir);
var wave_height = sn(data.wave_height);
var swell_height = sn(data.swell_height);
var pressure = sn(data.pressure, 1013);
var pressure_trend_3h = sn(data.pressure_trend_3h);

var dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSO','SO','OSO','O','ONO','NO','NNO'];
var dirName = function(d) { return dirs[Math.round(d/22.5)%16]; };
var highAlerts = alerts.filter(function(a) { return a.severity === 'high'; });

var text = 'ZONA ' + zoneName.toUpperCase() + '\n';
text += 'Pressione: ' + sf(pressure,0) + ' hPa (' + (pressure_trend_3h >= 0 ? '+' : '') + sf(pressure_trend_3h,1) + '/3h)\n';
text += 'Vento: ' + sf(wind_speed,0) + 'kn da ' + dirName(wind_dir) + ' | Onda: ' + sf(wave_height,1) + 'm';
if (swell_height > 0.3) text += ' | Swell: ' + sf(swell_height,1) + 'm';
text += '\n\nPATTERN: ' + diagnosis.description + ' (confidenza ' + diagnosis.confidence + '%)\n';
if (highAlerts.length > 0) text += '\nALLERTE:\n' + highAlerts.map(function(a) { return a.msg; }).join('\n') + '\n';
text += '\nEVOLUZIONE:\n';
text += '- 6h: ' + forecast.h6.label + ' - vento max ' + forecast.h6.wind_max + 'kn, onda max ' + forecast.h6.wave_max + 'm\n';
text += '- 12h: ' + forecast.h12.label + ' - vento max ' + forecast.h12.wind_max + 'kn, onda max ' + forecast.h12.wave_max + 'm\n';
text += '- 24h: ' + forecast.h24.label + ' - vento max ' + forecast.h24.wind_max + 'kn, onda max ' + forecast.h24.wave_max + 'm\n';
text += '\nFINESTRA: ' + window.reason;
if (window.next_window) text += '\nProssima: ' + window.next_window;
return text;
}

//- FETCH DATI -

function calcWindRotation(prevDir, currDir) {
if (prevDir === null || currDir === null) return null;
var diff = currDir - prevDir;
if (diff > 180) diff -= 360;
if (diff < -180) diff += 360;
return diff;
}

async function fetchOpenMeteo(lat, lon, model) {
var atmParams = 'temperature_2m,relativehumidity_2m,surface_pressure,windspeed_10m,winddirection_10m,windgusts_10m,cloudcover,precipitation,visibility';
var waveParams = 'wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period,swell_wave_direction';
var useModel = model || 'best_match';
var atmUrl = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&hourly=' + atmParams + '&wind_speed_unit=kn&timezone=Europe/Rome&forecast_days=2&models=' + useModel;
var waveUrl = 'https://marine-api.open-meteo.com/v1/marine?latitude=' + lat + '&longitude=' + lon + '&hourly=' + waveParams + '&length_unit=metric&timezone=Europe/Rome&forecast_days=2';

var results = await Promise.all([fetch(atmUrl), fetch(waveUrl)]);
var atmRes = results[0];
var waveRes = results[1];

if (!atmRes.ok) throw new Error('Open-Meteo ATM error: ' + atmRes.status);
var atmData = await atmRes.json();

if (waveRes.ok) {
var waveData = await waveRes.json();
if (waveData.hourly) {
var wh = waveData.hourly;
atmData.hourly.wave_height = wh.wave_height;
atmData.hourly.wave_period = wh.wave_period;
atmData.hourly.wave_direction = wh.wave_direction;
atmData.hourly.swell_wave_height = wh.swell_wave_height;
atmData.hourly.swell_wave_period = wh.swell_wave_period;
atmData.hourly.swell_wave_direction = wh.swell_wave_direction;
}
}
return atmData;
}

async function fetchECMWF(lat, lon, model) {
// model: 'ifs04' for IFS 9km, 'aifs025' for AIFS
try {
var url = 'https://api.open-meteo.com/v1/ecmwf?latitude=' + lat + '&longitude=' + lon +
  '&hourly=windspeed_10m,winddirection_10m,windgusts_10m,surface_pressure' +
  '&wind_speed_unit=kn&timezone=Europe/Rome&forecast_days=2';
var res = await fetch(url);
if (!res.ok) return null;
var data = await res.json();
if (!data.hourly || !data.hourly.windspeed_10m) return null;
// Find current hour index
var now = new Date();
var romeParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit'
}).formatToParts(now);
var rp = {};
romeParts.forEach(function(p) { rp[p.type] = p.value; });
var romeHour = rp.year + '-' + rp.month + '-' + rp.day + 'T' + rp.hour + ':00';
var h = data.hourly;
var idx = h.time.findIndex(function(t) { return t === romeHour; });
if (idx === -1) idx = 0;
return {
  wind_speed: h.windspeed_10m[idx],
  wind_dir: h.winddirection_10m[idx],
  wind_gust: h.windgusts_10m ? h.windgusts_10m[idx] : null,
  pressure: h.surface_pressure ? h.surface_pressure[idx] : null,
  hourly: h,
  model: model
};
} catch(e) { return null; }
}

async function fetchStormglass(lat, lon, apiKey) {
var params = 'waveHeight,wavePeriod,waveDirection,swellHeight,swellPeriod,swellDirection,waterTemperature,currentSpeed,currentDirection,windSpeed,windDirection,gust';
var now = Math.floor(Date.now() / 1000);
var url = 'https://api.stormglass.io/v2/weather/point?lat=' + lat + '&lng=' + lon + '&params=' + params + '&start=' + now + '&end=' + (now + 3600);
var res = await fetch(url, { headers: { 'Authorization': apiKey } });
if (!res.ok) throw new Error('Stormglass error: ' + res.status);
return await res.json();
}

function extractStormglassData(sgData) {
if (!sgData || !sgData.hours || sgData.hours.length === 0) return null;
var h = sgData.hours[0];
var pick = function(param) {
if (!h[param]) return null;
var sg = h[param].find(function(s) { return s.source === 'sg'; });
var noaa = h[param].find(function(s) { return s.source === 'noaa'; });
var dwd = h[param].find(function(s) { return s.source === 'dwd'; });
var val = sg || noaa || dwd || h[param][0];
return val ? val.value : null;
};
return {
wave_height: pick('waveHeight'), wave_period: pick('wavePeriod'), wave_dir: pick('waveDirection'),
swell_height: pick('swellHeight'), swell_period: pick('swellPeriod'), swell_dir: pick('swellDirection'),
temp_water: pick('waterTemperature'), current_speed: pick('currentSpeed'), current_dir: pick('currentDirection'),
wind_speed_sg: pick('windSpeed'), wind_gust_sg: pick('gust'),
};
}

function extractCurrentData(omData, sgData, owmData, iconData) {
var h = omData.hourly;
var now = new Date();
// OM returns times in Europe/Rome - use Intl to get local Rome hour
var romeParts = new Intl.DateTimeFormat('it-IT', {
  timeZone: 'Europe/Rome',
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit'
}).formatToParts(now);
var rp = {};
romeParts.forEach(function(p) { rp[p.type] = p.value; });
var romeHour = rp.year + '-' + rp.month + '-' + rp.day + 'T' + rp.hour + ':00';
var idx = h.time.findIndex(function(t) { return t === romeHour; });
if (idx === -1) idx = 0;
var prev = Math.max(0, idx - 3);

var base = {
temp_air:          sn(h.temperature_2m[idx], 15),
humidity:          sn(h.relativehumidity_2m[idx], 70),
pressure:          sn(h.surface_pressure[idx], 1013),
wind_speed:        sn(h.windspeed_10m[idx]),
wind_dir:          sn(h.winddirection_10m[idx]),
wind_gust:         sn(h.windgusts_10m[idx]),
cloud_cover:       sn(h.cloudcover ? h.cloudcover[idx] : null),
precipitation:     sn(h.precipitation ? h.precipitation[idx] : null),
visibility:        h.visibility && h.visibility[idx] ? h.visibility[idx] / 1000 : 10,
wave_height:       sn(h.wave_height && h.wave_height[idx]),
wave_period:       sn(h.wave_period && h.wave_period[idx]),
wave_dir:          sn(h.wave_direction && h.wave_direction[idx]),
swell_height:      sn(h.swell_wave_height && h.swell_wave_height[idx]),
swell_period:      sn(h.swell_wave_period && h.swell_wave_period[idx]),
swell_dir:         sn(h.swell_wave_direction && h.swell_wave_direction[idx]),
temp_water:        15,
current_speed:     0,
current_dir:       0,
pressure_prev:     sn(h.surface_pressure[prev], 1013),
wind_dir_prev:     sn(h.winddirection_10m[prev]),
pressure_trend_1h: sn(h.surface_pressure[idx], 1013) - sn(h.surface_pressure[Math.max(0,idx-1)], 1013),
pressure_trend_3h: sn(h.surface_pressure[idx], 1013) - sn(h.surface_pressure[prev], 1013),
sources: { wind: 'open-meteo', wave: 'open-meteo', pressure: 'open-meteo' },
    data_time: h.time[idx] || null,
    icon_wind_speed: (iconData && iconData.hourly && iconData.hourly.windspeed_10m) ? sn(iconData.hourly.windspeed_10m[idx]) : null,
    icon_wind_dir: (iconData && iconData.hourly && iconData.hourly.winddirection_10m) ? sn(iconData.hourly.winddirection_10m[idx]) : null,
    icon_wind_gust: (iconData && iconData.hourly && iconData.hourly.windgusts_10m) ? sn(iconData.hourly.windgusts_10m[idx]) : null,
    ifs_wind_speed: null,
    ifs_wind_dir: null,
    ifs_wind_gust: null,
    ifs_pressure: null
};

if (sgData) {
if (sgData.wave_height > 0) { base.wave_height = sgData.wave_height; base.sources.wave = 'stormglass'; }
if (sgData.wave_period)  base.wave_period = sgData.wave_period;
if (sgData.wave_dir)     base.wave_dir = sgData.wave_dir;
if (sgData.swell_height > 0) { base.swell_height = sgData.swell_height; base.sources.swell = 'stormglass'; }
if (sgData.swell_period) base.swell_period = sgData.swell_period;
if (sgData.swell_dir)    base.swell_dir = sgData.swell_dir;
if (sgData.temp_water)   base.temp_water = sgData.temp_water;
if (sgData.current_speed)base.current_speed = sgData.current_speed;
if (sgData.current_dir)  base.current_dir = sgData.current_dir;
// Stormglass wind excluded - Open-Meteo only for wind direction/speed
}

// Save OM values for comparison - OWM never overrides OM wind
base.wind_speed_om = base.wind_speed;
base.wind_dir_om = base.wind_dir;
// OWM is kept only as observed reference in base.wind_speed_obs / base.wind_dir_obs
base.sources.wind = 'open-meteo';

return base;
}

//- UPSTASH KV STORAGE -

async function kvGet(key, restUrl, restToken) {
if (!restUrl || !restToken) return null;
try {
var cmd = ['GET', key];
var res = await fetch(restUrl, {
method: 'POST',
headers: { 'Authorization': 'Bearer ' + restToken, 'Content-Type': 'application/json' },
body: JSON.stringify(cmd)
});
if (!res.ok) return null;
var data = await res.json();
if (data.result === null || data.result === undefined) return null;
if (typeof data.result === 'object') return data.result;
try { return JSON.parse(data.result); } catch(e) { return data.result; }
} catch(e) { return null; }
}

async function kvSet(key, value, ttlSeconds, restUrl, restToken) {
if (!restUrl || !restToken) return false;
try {
// Upstash REST API: POST to base URL with command array
// Format: ["SET", "key", "value", "EX", "ttl"]
var serialized = JSON.stringify(value);
var cmd = ttlSeconds
? ['SET', key, serialized, 'EX', String(ttlSeconds)]
: ['SET', key, serialized];
var res = await fetch(restUrl, {
method: 'POST',
headers: { 'Authorization': 'Bearer ' + restToken, 'Content-Type': 'application/json' },
body: JSON.stringify(cmd)
});
return res.ok;
} catch(e) { return false; }
}

async function saveZoneSnapshot(zoneKey, data, restUrl, restToken) {
if (!restUrl || !restToken) return;
var now = new Date();
// Round to nearest 30 min for key
var mins = now.getMinutes() < 30 ? '00' : '30';
var hourKey = now.toISOString().slice(0, 13) + '-' + mins;
var key = 'snap:' + zoneKey + ':' + hourKey;
var snapshot = {
ts: now.toISOString(),
wind_dir: data.wind_dir_om !== undefined ? data.wind_dir_om : data.wind_dir,
wind_speed: data.wind_speed_om !== undefined ? data.wind_speed_om : data.wind_speed,
wind_gust: data.wind_gust !== undefined ? data.wind_gust : null,
pressure: data.pressure,
wave_height: data.wave_height,
swell_height: data.swell_height,
swell_dir: data.swell_dir,
temp_air: data.temp_air,
humidity: data.humidity,
// OWM observed data if present
wind_speed_obs: data.wind_speed_obs || null,
wind_dir_obs: data.wind_dir_obs || null,
wind_gust_obs: data.wind_gust_obs || null,
pressure_obs: data.pressure_obs || null,
obs_source: data.obs_source || null,
obs_station: data.obs_station || null,
// ICON model data for future comparison
wind_speed_icon: data.icon_wind_speed !== undefined ? data.icon_wind_speed : null,
wind_dir_icon: data.icon_wind_dir !== undefined ? data.icon_wind_dir : null,
wind_gust_icon: data.icon_wind_gust !== undefined ? data.icon_wind_gust : null,
ifs_wind_speed: data.ifs_wind_speed !== undefined ? data.ifs_wind_speed : null,
ifs_wind_dir: data.ifs_wind_dir !== undefined ? data.ifs_wind_dir : null,
ifs_wind_gust: data.ifs_wind_gust !== undefined ? data.ifs_wind_gust : null,
ifs_pressure: data.ifs_pressure !== undefined ? data.ifs_pressure : null
};
await kvSet(key, snapshot, 1209600, restUrl, restToken);
}

async function saveForecast(zoneKey, forecast, data, restUrl, restToken) {
if (!restUrl || !restToken) return;
var now = new Date();
var mins = now.getMinutes() < 30 ? '00' : '30';
var key = 'forecast:' + zoneKey + ':' + now.toISOString().slice(0, 13) + '-' + mins;
var record = {
made_at: now.toISOString(),
actual_wind: data.wind_speed,
actual_wave: data.wave_height,
actual_pressure: data.pressure,
h6_wind: forecast.h6.wind_max,
h6_wave: forecast.h6.wave_max,
h12_wind: forecast.h12.wind_max,
h12_wave: forecast.h12.wave_max,
h24_wind: forecast.h24.wind_max,
h24_wave: forecast.h24.wave_max
};
await kvSet(key, record, 1209600, restUrl, restToken);
}

async function getWindHistory(zoneKey, restUrl, restToken, hours) {
if (!restUrl || !restToken) return [];
if (!hours) hours = 24;
var now = new Date();
var snapshots = [];
var promises = [];
// Fetch every 30 min slots (2x per hour)
var slots = hours * 2;
for (var s = slots - 1; s >= 0; s = s - 1) {
(function(ss) {
var d = new Date(now.getTime() - ss * 1800000);
var mins = d.getMinutes() < 30 ? '00' : '30';
var slotKey = d.toISOString().slice(0, 13) + '-' + mins;
var key = 'snap:' + zoneKey + ':' + slotKey;
promises.push(kvGet(key, restUrl, restToken).then(function(snap) {
return snap ? { h: ss / 2, snap: snap } : null;
}));
})(s);
}
var results = await Promise.all(promises);
// Sort by time ascending
results = results.filter(function(r) { return r !== null; });
results.sort(function(a, b) { return b.h - a.h; });
return results.map(function(r) { return r.snap; });
}

function analyzeWindRotation(snapshots) {
if (snapshots.length < 3) return { rotation: null, trend: 'insufficient_data', hours: snapshots.length };
var dirs = snapshots.map(function(s) { return s.wind_dir; });
var totalRotation = 0;
var rotations = [];
for (var i = 1; i < dirs.length; i++) {
var diff = dirs[i] - dirs[i-1];
if (diff > 180) diff -= 360;
if (diff < -180) diff += 360;
rotations.push(diff);
totalRotation += diff;
}
var avgRotation = totalRotation / rotations.length;
var isConsistent = rotations.filter(function(r) { return r * avgRotation > 0; }).length >= rotations.length * 0.6;
var trend;
if (Math.abs(totalRotation) < 20) {
trend = 'stable';
} else if (totalRotation > 0 && isConsistent) {
trend = 'veering';
} else if (totalRotation < 0 && isConsistent) {
trend = 'backing';
} else {
trend = 'variable';
}
return {
rotation: totalRotation,
avg_per_hour: avgRotation,
trend: trend,
consistent: isConsistent,
hours: snapshots.length,
from_dir: dirs[0],
to_dir: dirs[dirs.length - 1]
};
}

//- CALCOLO ZONA -

async function verifyForecasts(zoneKey, currentData, kvUrl, kvToken) {
if (!kvUrl || !kvToken) return;
var now = new Date();
var horizons = [6, 12, 24];
for (var hi = 0; hi < horizons.length; hi = hi + 1) {
var h = horizons[hi];
var pastTime = new Date(now.getTime() - h * 3600000);
var pastMins = pastTime.getMinutes() < 30 ? '00' : '30';
var pastKey = 'forecast:' + zoneKey + ':' + pastTime.toISOString().slice(0, 13) + '-' + pastMins;
var forecast = await kvGet(pastKey, kvUrl, kvToken);
if (!forecast) continue;
var windError = currentData.wind_speed - forecast['h' + h + '_wind'];
var waveError = currentData.wave_height - forecast['h' + h + '_wave'];
var verKey = 'verify:' + zoneKey + ':' + pastTime.toISOString().slice(0, 13) + ':h' + h;
var verRecord = {
forecast_time: pastTime.toISOString(),
horizon_h: h,
predicted_wind: forecast['h' + h + '_wind'],
predicted_wind_dir: forecast['h' + h + '_wind_dir'] || null,
predicted_wave: forecast['h' + h + '_wave'],
actual_wind: currentData.wind_speed,
actual_wind_dir: currentData.wind_dir || null,
actual_wind_source: currentData.sources ? currentData.sources.wind : 'open-meteo',
actual_wave: currentData.wave_height,
wind_error: parseFloat(windError.toFixed(1)),
wave_error: parseFloat(waveError.toFixed(2))
};
await kvSet(verKey, verRecord, 2592000, kvUrl, kvToken);
await updateBias(zoneKey, verRecord, kvUrl, kvToken);
}
}

async function updateBias(zoneKey, verRecord, kvUrl, kvToken) {
var biasKey = 'bias:' + zoneKey;
var bias = await kvGet(biasKey, kvUrl, kvToken);
if (!bias) {
bias = { zone: zoneKey, samples: 0, wind_bias_sum: 0, wind_mae_sum: 0, wave_bias_sum: 0, wave_mae_sum: 0, last_updated: null };
}
bias.samples = bias.samples + 1;
bias.wind_bias_sum = (bias.wind_bias_sum || 0) + verRecord.wind_error;
bias.wind_mae_sum = (bias.wind_mae_sum || 0) + Math.abs(verRecord.wind_error);
bias.wave_bias_sum = (bias.wave_bias_sum || 0) + verRecord.wave_error;
bias.wave_mae_sum = (bias.wave_mae_sum || 0) + Math.abs(verRecord.wave_error);
bias.wind_bias = parseFloat((bias.wind_bias_sum / bias.samples).toFixed(2));
bias.wind_mae = parseFloat((bias.wind_mae_sum / bias.samples).toFixed(2));
bias.wave_bias = parseFloat((bias.wave_bias_sum / bias.samples).toFixed(2));
bias.wave_mae = parseFloat((bias.wave_mae_sum / bias.samples).toFixed(2));
bias.last_updated = new Date().toISOString();
await kvSet(biasKey, bias, 0, kvUrl, kvToken);
}

async function getBias(zoneKey, kvUrl, kvToken) {
if (!kvUrl || !kvToken) return null;
return await kvGet('bias:' + zoneKey, kvUrl, kvToken);
}

function applyBias(forecast, bias) {
if (!bias || bias.samples < 10) return forecast;
var corrected = JSON.parse(JSON.stringify(forecast));
var windCorr = bias.wind_bias || 0;
var waveCorr = bias.wave_bias || 0;
var keys = ['h6', 'h12', 'h24'];
for (var ki = 0; ki < keys.length; ki = ki + 1) {
var hk = keys[ki];
if (corrected[hk]) {
corrected[hk].wind_max = Math.max(0, Math.round(corrected[hk].wind_max - windCorr));
corrected[hk].wave_max = Math.max(0, parseFloat((corrected[hk].wave_max - waveCorr).toFixed(1)));
corrected[hk].bias_corrected = true;
}
}
return corrected;
}

async function getZoneStats(zoneKey, kvUrl, kvToken) {
if (!kvUrl || !kvToken) return null;
var bias = await getBias(zoneKey, kvUrl, kvToken);
var now = new Date();
var countPromises = [];
for (var h = 0; h < 24; h = h + 1) {
(function(hh) {
var d = new Date(now.getTime() - hh * 3600000);
var key = 'snap:' + zoneKey + ':' + d.toISOString().slice(0, 13);
countPromises.push(kvGet(key, kvUrl, kvToken).then(function(s) { return s ? 1 : 0; }));
})(h);
}
var counts = await Promise.all(countPromises);
var snapCount = counts.reduce(function(a, b) { return a + b; }, 0);
return { zone: zoneKey, snapshots_72h: snapCount, bias: bias };
}

async function fetchOWM(lat, lon, owmKey) {
if (!owmKey) return null;
var url = 'https://api.openweathermap.org/data/2.5/weather?lat=' + lat +
'&lon=' + lon + '&appid=' + owmKey + '&units=metric';
try {
var res = await fetch(url);
if (!res.ok) return null;
var d = await res.json();
if (!d.wind) return null;
// wind.speed is m/s, convert to knots
var speedKn = d.wind.speed ? d.wind.speed * 1.94384 : null;
var gustKn = d.wind.gust ? d.wind.gust * 1.94384 : null;
return {
wind_speed_obs: speedKn ? parseFloat(speedKn.toFixed(1)) : null,
wind_dir_obs: d.wind.deg !== undefined ? d.wind.deg : null,
wind_gust_obs: gustKn ? parseFloat(gustKn.toFixed(1)) : null,
temp_obs: d.main ? d.main.temp : null,
pressure_obs: d.main ? d.main.pressure : null,
humidity_obs: d.main ? d.main.humidity : null,
station: d.name || null,
obs_time: d.dt ? new Date(d.dt * 1000).toISOString() : null,
source: 'openweathermap'
};
} catch(e) { return null; }
}

async function calcZone(zoneKey, sgKey, kvUrl, kvToken, req, clientWeatherData) {
var zone = ZONES[zoneKey];

// Use client-provided weatherData if available (ensures data consistency with Meteo tab)
// Otherwise fetch fresh from Open-Meteo (cron mode)
var owmKey = process.env.OWM_KEY || null;
var omData, owmData;
var ifsDataCalc = null;
if (clientWeatherData) {
// Manual analysis: use frontend data + fetch OWM for observed comparison
omData = clientWeatherData;
owmData = await fetchOWM(zone.lat, zone.lon, owmKey);
try { ifsDataCalc = await fetchECMWF(zone.lat, zone.lon, 'ifs04'); } catch(e) {}
} else {
// Cron mode: only fetch OM best_match - skip OWM and ICON to stay within timeout
omData = await fetchOpenMeteo(zone.lat, zone.lon, 'best_match');
owmData = null;
var iconData = null;
try { ifsDataCalc = await fetchECMWF(zone.lat, zone.lon, 'ifs04'); } catch(e) {}
}

var sgData = null;
var hasStormglass = false;
if (sgKey) {
try {
var sgRaw = await fetchStormglass(zone.lat, zone.lon, sgKey);
sgData = extractStormglassData(sgRaw);
hasStormglass = sgData !== null;
} catch(e) { hasStormglass = false; }
}

var currentData = extractCurrentData(omData, sgData, owmData, iconData);
// Merge IFS data into currentData
if (ifsDataCalc) {
  currentData.ifs_wind_speed = ifsDataCalc.wind_speed !== undefined ? ifsDataCalc.wind_speed : null;
  currentData.ifs_wind_dir = ifsDataCalc.wind_dir !== undefined ? ifsDataCalc.wind_dir : null;
  currentData.ifs_wind_gust = ifsDataCalc.wind_gust !== undefined ? ifsDataCalc.wind_gust : null;
  currentData.ifs_pressure = ifsDataCalc.pressure !== undefined ? ifsDataCalc.pressure : null;
}

// Rotation analysis from KV history - read only if explicitly requested
var rotationAnalysis = { trend: 'insufficient_data', hours: 0, rotation: null, consistent: false };
var useHistory = req && req.query && req.query.history === '1';
try {
if (kvUrl && kvToken && useHistory) {
var windHistory = await getWindHistory(zoneKey, kvUrl, kvToken, 720);
rotationAnalysis = analyzeWindRotation(windHistory);
}
// Always save snapshot - fire and forget, never blocks
if (kvUrl && kvToken) {
// In cron mode await the save, otherwise fire and forget
var isCron = req && req.query && req.query.history === '1';
// Merge OWM observed data into snapshot
var snapData = owmData ? Object.assign({}, currentData, {
wind_speed_obs: owmData.wind_speed_obs,
wind_dir_obs: owmData.wind_dir_obs,
wind_gust_obs: owmData.wind_gust_obs,
pressure_obs: owmData.pressure_obs,
obs_source: owmData.source,
obs_station: owmData.station,
obs_time: owmData.obs_time
}) : currentData;
if (isCron) {
await saveZoneSnapshot(zoneKey, snapData, kvUrl, kvToken);
} else {
saveZoneSnapshot(zoneKey, snapData, kvUrl, kvToken).catch(function() {});
}
}
} catch(kvErr) {}

var diagnosis = diagnoseSynopticCase(currentData, rotationAnalysis);
var localEffects = calcLocalEffects(zoneKey, currentData);
var ports = calcPortAccess(zoneKey, currentData, localEffects);
var forecast = buildForecast(diagnosis, currentData);
var win = calcOperationalWindow(diagnosis, currentData);
var alerts = buildAlerts(diagnosis, currentData, localEffects, ports);
var reliability = calcReliability(hasStormglass, diagnosis.signals, rotationAnalysis);
var briefingText = generateBriefingText(zone.name, diagnosis, currentData, forecast, win, alerts);

// Apply bias correction if enough historical data
var bias = null;
try {
if (kvUrl && kvToken) {
bias = await getBias(zoneKey, kvUrl, kvToken);
if (bias && bias.samples >= 10) {
forecast = applyBias(forecast, bias);
}
}
} catch(e) {}

// Save forecast + verify past forecasts - fire and forget
if (kvUrl && kvToken) {
var isCronMode = req && req.query && req.query.history === '1';
if (isCronMode) {
await saveForecast(zoneKey, forecast, currentData, kvUrl, kvToken);
await verifyForecasts(zoneKey, currentData, kvUrl, kvToken);
} else {
saveForecast(zoneKey, forecast, currentData, kvUrl, kvToken).catch(function() {});
verifyForecasts(zoneKey, currentData, kvUrl, kvToken).catch(function() {});
}
}

// Get stats only when history is requested (cron mode)
var stats = null;
try {
if (kvUrl && kvToken && useHistory) stats = await getZoneStats(zoneKey, kvUrl, kvToken);
} catch(e) {}

var overallRisk = calcOverallRisk(currentData, alerts, localEffects);

return {
zone: zoneKey,
name: zone.name,
updated: new Date().toISOString(),
raw: currentData,
observed: owmData,
diagnosis: diagnosis,
risk: overallRisk,
reliability: reliability,
reliability_note: buildReliabilityNote(hasStormglass, rotationAnalysis, bias),
rotation_history: rotationAnalysis,
local_effects: localEffects,
forecast: forecast,
ports: ports,
window: win,
alerts: alerts,
briefing_text: briefingText,
bias: bias,
stats: stats
};
}

function buildReliabilityNote(hasStormglass, rot, bias) {
var sources = hasStormglass ? 'Open-Meteo + Stormglass' : 'Solo Open-Meteo';
if (rot.hours >= 6) {
sources += ' + storico ' + rot.hours + 'h';
} else if (rot.hours > 0) {
sources += ' + ' + rot.hours + 'h dati';
}
if (bias && bias.samples >= 10) {
sources += ' + bias ' + bias.samples + ' camp.';
}
return sources;
}

//- VERCEL HANDLER -

module.exports = async function handler(req, res) {
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
if (req.method === 'OPTIONS') return res.status(204).end();

var action = req.query.action || 'zones';
var zoneKey = req.query.zone || null;
var sgKey = process.env.STORMGLASS_KEY || null;
var kvUrl = process.env.UPSTASH_REDIS_REST_URL || null;
var kvToken = process.env.UPSTASH_REDIS_REST_TOKEN || null;

if (action === 'ping') {
var activeZones = Object.keys(ZONES).filter(function(k){ return ZONES[k].enabled !== false; }).length;
var romeParts2 = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date());
    var rp2 = {}; romeParts2.forEach(function(p) { rp2[p.type] = p.value; });
    var romeNow = rp2.year + '-' + rp2.month + '-' + rp2.day + 'T' + rp2.hour + ':' + rp2.minute;
    return res.status(200).json({ ok: true, engine: 'nautilus-engine', v: '2.9.22', zones: activeZones, ts: Date.now(), rome_now: romeNow, utc_now: new Date().toISOString() });
}

// /api/engine?action=cron - called by cron-job.org every hour for all zones
// /api/engine?action=cron_snap - lightweight cron: fetch OM only + save snapshot
if (action === 'cron_snap') {
var csSecret = req.query.secret || '';
var csExpected = process.env.CRON_SECRET || '';
if (csExpected && csSecret !== csExpected) {
  return res.status(401).json({ error: 'Unauthorized' });
}
var csZones;
if (req.query.zones) {
  var csRequested = req.query.zones.split(',').map(function(z) { return z.trim(); });
  csZones = csRequested.filter(function(zk) { return ZONES[zk] && ZONES[zk].enabled !== false; });
} else {
  csZones = Object.keys(ZONES).filter(function(zk) { return ZONES[zk].enabled !== false; });
}
var csResults = {};
var csPromises = csZones.map(function(zk) {
  var zone = ZONES[zk];
  var owmKeyCs = process.env.OWM_KEY || null;
  // Fetch OM, ICON and OWM in parallel
  return Promise.all([
    fetchOpenMeteo(zone.lat, zone.lon, 'best_match'),
    fetchOpenMeteo(zone.lat, zone.lon, 'icon_seamless'),
    owmKeyCs ? fetchOWM(zone.lat, zone.lon, owmKeyCs) : Promise.resolve(null),
    fetchECMWF(zone.lat, zone.lon, 'ifs04')
  ]).then(function(results) {
      var omData = results[0];
      var iconData = results[1];
      var owmData = results[2];
      var ifsData = results[3];
      if (!omData || !omData.hourly) throw new Error('OM fetch failed');
      var romeParts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit'
      }).formatToParts(new Date());
      var rp2 = {};
      romeParts.forEach(function(p) { rp2[p.type] = p.value; });
      var romeHour = rp2.year + '-' + rp2.month + '-' + rp2.day + 'T' + rp2.hour + ':00';
      var h = omData.hourly;
      var idx2 = h.time.findIndex(function(t) { return t === romeHour; });
      if (idx2 === -1) idx2 = 0;
      var iconH = iconData && iconData.hourly ? iconData.hourly : null;
      var snap = {
        wind_speed: h.windspeed_10m ? h.windspeed_10m[idx2] : null,
        wind_dir: h.winddirection_10m ? h.winddirection_10m[idx2] : null,
        wind_gust: h.windgusts_10m ? h.windgusts_10m[idx2] : null,
        pressure: h.surface_pressure ? h.surface_pressure[idx2] : null,
        temp_air: h.temperature_2m ? h.temperature_2m[idx2] : null,
        humidity: h.relativehumidity_2m ? h.relativehumidity_2m[idx2] : null,
        cloud_cover: h.cloudcover ? h.cloudcover[idx2] : null,
        wave_height: h.wave_height ? h.wave_height[idx2] : null,
        wave_period: h.wave_period ? h.wave_period[idx2] : null,
        wave_dir: h.wave_direction ? h.wave_direction[idx2] : null,
        swell_height: h.swell_wave_height ? h.swell_wave_height[idx2] : null,
        swell_period: h.swell_wave_period ? h.swell_wave_period[idx2] : null,
        swell_dir: h.swell_wave_direction ? h.swell_wave_direction[idx2] : null,
        wind_gust: h.windgusts_10m ? h.windgusts_10m[idx2] : null,
        wind_speed_om: h.windspeed_10m ? h.windspeed_10m[idx2] : null,
        wind_dir_om: h.winddirection_10m ? h.winddirection_10m[idx2] : null,
        icon_wind_speed: iconH && iconH.windspeed_10m ? iconH.windspeed_10m[idx2] : null,
        icon_wind_dir: iconH && iconH.winddirection_10m ? iconH.winddirection_10m[idx2] : null,
        wind_speed_obs: owmData ? owmData.wind_speed_obs : null,
        wind_dir_obs: owmData ? owmData.wind_dir_obs : null,
        wind_gust_obs: owmData ? owmData.wind_gust_obs : null,
        pressure_obs: owmData ? owmData.pressure_obs : null,
        obs_source: owmData ? owmData.source : null,
        obs_station: owmData ? owmData.station : null,
        obs_time: owmData ? owmData.obs_time : null,
        ifs_wind_speed: ifsData && ifsData.wind_speed !== undefined ? ifsData.wind_speed : null,
        ifs_wind_dir: ifsData && ifsData.wind_dir !== undefined ? ifsData.wind_dir : null,
        ifs_wind_gust: ifsData && ifsData.wind_gust !== undefined ? ifsData.wind_gust : null,
        ifs_pressure: ifsData && ifsData.pressure !== undefined ? ifsData.pressure : null
      };
      return saveZoneSnapshot(zk, snap, kvUrl, kvToken)
        .then(function() { csResults[zk] = { ok: true, icon: !!iconH, owm: !!owmData, ifs: !!ifsData }; });
    })
    .catch(function(e) { csResults[zk] = { ok: false, error: e.message }; });
});
await Promise.all(csPromises);
return res.status(200).json({ ok: true, ts: new Date().toISOString(), zones: csResults });
}

if (action === 'cron') {
var cronSecret = req.query.secret || '';
var expectedSecret = process.env.CRON_SECRET || '';
if (expectedSecret && cronSecret !== expectedSecret) {
return res.status(401).json({ error: 'Unauthorized' });
}
// Support ?zones=livorno,viareggio for split cron jobs (avoids timeout)
var cronZones;
if (req.query.zones) {
  var requestedZones = req.query.zones.split(',').map(function(z) { return z.trim(); });
  cronZones = requestedZones.filter(function(zk) { return ZONES[zk] && ZONES[zk].enabled !== false; });
} else {
  cronZones = Object.keys(ZONES).filter(function(zk) { return ZONES[zk].enabled !== false; });
}
var cronResults = {};
var cronPromises = cronZones.map(function(zk) {
return calcZone(zk, null, kvUrl, kvToken, { query: { history: '1' } })
.then(function(r) { cronResults[zk] = { ok: true, case: r.diagnosis.case, alerts: r.alerts.length }; })
.catch(function(e) { cronResults[zk] = { ok: false, error: e.message }; });
});
await Promise.all(cronPromises);
return res.status(200).json({ ok: true, ts: new Date().toISOString(), zones: cronResults });
}

// /api/engine?action=diag - test KV connection
if (action === 'diag') {
var diagResult = {
kv_configured: !!(kvUrl && kvToken),
kv_url_prefix: kvUrl ? kvUrl.slice(0, 30) : null,
kv_write: false, kv_read: false,
write_response: null, error: null
};
if (kvUrl && kvToken) {
try {
var testKey = 'diag:test:' + Date.now();
var testVal = JSON.stringify({ ts: new Date().toISOString(), test: true });
var setCmd = ['SET', testKey, testVal, 'EX', '60'];
var writeRes = await fetch(kvUrl, {
method: 'POST',
headers: { 'Authorization': 'Bearer ' + kvToken, 'Content-Type': 'application/json' },
body: JSON.stringify(setCmd)
});
var writeBody = await writeRes.text();
diagResult.write_status = writeRes.status;
diagResult.write_response = writeBody;
diagResult.kv_write = writeRes.ok;
if (writeRes.ok) {
var getCmd = ['GET', testKey];
var readRes = await fetch(kvUrl, {
method: 'POST',
headers: { 'Authorization': 'Bearer ' + kvToken, 'Content-Type': 'application/json' },
body: JSON.stringify(getCmd)
});
var readBody = await readRes.json();
diagResult.kv_read = readBody.result !== null;
diagResult.read_result = readBody.result;
}
} catch(e) {
diagResult.error = e.message;
}
}
return res.status(200).json(diagResult);
}

// /api/engine?action=stats&zone=xxx - get zone statistics
if (action === 'stats') {
if (!zoneKey || !ZONES[zoneKey]) {
return res.status(404).json({ error: 'Zona non trovata' });
}
try {
var stats = await getZoneStats(zoneKey, kvUrl, kvToken);
return res.status(200).json(stats);
} catch(e) {
return res.status(500).json({ error: e.message });
}
}

// /api/engine?action=export - export all data for analysis
if (action === 'export') {
try {
var exportData = { zones: {}, generated: new Date().toISOString() };
var exportPromises = Object.keys(ZONES).filter(function(k) {
return ZONES[k].enabled !== false;
}).map(function(zk) {
return Promise.all([
getBias(zk, kvUrl, kvToken),
(function() {
var proms = [];
var now3 = new Date();
for (var h3 = 0; h3 < 72; h3++) {
(function(hh3) {
var d3 = new Date(now3.getTime() - hh3 * 3600000);
var mins3 = d3.getMinutes() < 30 ? '00' : '30';
var key3 = 'snap:' + zk + ':' + d3.toISOString().slice(0,13) + '-' + mins3;
proms.push(kvGet(key3, kvUrl, kvToken).then(function(v) { return v; }).catch(function() { return null; }));
})(h3);
}
return Promise.all(proms);
})()
]).then(function(results) {
var bias = results[0];
var snaps = results[1].filter(function(s) { return s !== null; });
exportData.zones[zk] = {
name: ZONES[zk].name,
bias: bias,
snapshots: snaps,
snapshot_count: snaps.length
};
});
});
await Promise.all(exportPromises);
return res.status(200).json(exportData);
} catch(e) {
return res.status(500).json({ error: e.message });
}
}

// /api/engine?action=verify&zone=xxx - get forecast verification records
if (action === 'verify') {
if (!zoneKey || !ZONES[zoneKey]) {
return res.status(404).json({ error: 'Zona non trovata' });
}
try {
var bias = await getBias(zoneKey, kvUrl, kvToken);
// Read last 7 days of verification records (h6 horizon)
var verRecords = [];
var now2 = new Date();
var verPromises = [];
for (var d2 = 0; d2 < 7; d2 = d2 + 1) {
for (var h2 = 0; h2 < 24; h2 = h2 + 1) {
(function(dd, hh) {
var t = new Date(now2.getTime() - dd * 86400000 - hh * 3600000);
var ts = t.toISOString().slice(0, 13);
var key = 'verify:' + zoneKey + ':' + ts + ':h6';
verPromises.push(kvGet(key, kvUrl, kvToken).then(function(v) {
return v ? v : null;
}));
})(d2, h2);
}
}
var allVer = await Promise.all(verPromises);
verRecords = allVer.filter(function(v) { return v !== null; });
// Sort by forecast_time descending
verRecords.sort(function(a, b) {
return new Date(b.forecast_time) - new Date(a.forecast_time);
});
return res.status(200).json({
zone: zoneKey,
name: ZONES[zoneKey].name,
bias: bias,
records: verRecords.slice(0, 50),
total: verRecords.length
});
} catch(e) {
return res.status(500).json({ error: e.message });
}
}

// /api/engine?action=history&zone=xxx&hours=24 - get zone history
if (action === 'history') {
if (!zoneKey || !ZONES[zoneKey]) {
return res.status(404).json({ error: 'Zona non trovata' });
}
try {
var hours = parseInt(req.query.hours) || 24;
var snapshots = await getWindHistory(zoneKey, kvUrl, kvToken, hours);
var bias = await getBias(zoneKey, kvUrl, kvToken);
var rotation = analyzeWindRotation(snapshots);
return res.status(200).json({
zone: zoneKey,
name: ZONES[zoneKey].name,
hours_requested: hours,
hours_available: snapshots.length,
snapshots: snapshots,
rotation: rotation,
bias: bias
});
} catch(e) {
return res.status(500).json({ error: e.message });
}
}

// /api/engine?action=predict&zone=xxx - AI local forecast based on historical data
if (action === 'predict') {
  if (!zoneKey || !ZONES[zoneKey]) {
    return res.status(404).json({ error: 'Zona non trovata' });
  }
  try {
    var anthropicKey = process.env.ANTHROPIC_KEY || null;
    if (!anthropicKey) return res.status(500).json({ error: 'ANTHROPIC_KEY non configurata' });

    // Get last 14 days of snapshots
    var snapshots14 = await getWindHistory(zoneKey, kvUrl, kvToken, req.query.fast === '1' ? 48 : 336); // fast=48h(96 GET), full=14days(672 GET)
    var bias = await getBias(zoneKey, kvUrl, kvToken);
    var rotation = analyzeWindRotation(snapshots14.slice(0, 24)); // rotation from last 24h

    // Get current conditions
    var currentSnap = snapshots14[snapshots14.length - 1] || null;

    // Build statistical summary of historical data
    var validSnaps = snapshots14.filter(function(s) {
      return s.wind_speed !== null && s.pressure !== null;
    });

    // Pressure trend analysis
    var pressureTrend = 'stabile';
    if (validSnaps.length >= 3) {
      var recentP = validSnaps.slice(-3).map(function(s) { return s.pressure; });
      var pDelta = recentP[recentP.length-1] - recentP[0];
      if (pDelta < -3) pressureTrend = 'in calo rapido';
      else if (pDelta < -1) pressureTrend = 'in calo';
      else if (pDelta > 3) pressureTrend = 'in rialzo rapido';
      else if (pDelta > 1) pressureTrend = 'in rialzo';
    }

    // Wind statistics last 24h
    var last24 = validSnaps.slice(-24);
    var avgWind24 = last24.length > 0 ? (last24.reduce(function(a,s){return a+s.wind_speed;},0)/last24.length).toFixed(1) : '--';
    var maxWind24 = last24.length > 0 ? Math.max.apply(null, last24.map(function(s){return s.wind_speed;})).toFixed(1) : '--';

    // Find similar historical patterns (last 14 days, same pressure trend)
    var similarCases = [];
    for (var si = 24; si < validSnaps.length - 6; si++) {
      var histP = validSnaps.slice(Math.max(0,si-3), si).map(function(s){return s.pressure;});
      if (histP.length < 2) continue;
      var histPDelta = histP[histP.length-1] - histP[0];
      var histTrend = histPDelta < -1 ? 'calo' : histPDelta > 1 ? 'rialzo' : 'stabile';
      var currTrend = pressureTrend.indexOf('calo') >= 0 ? 'calo' : pressureTrend.indexOf('rialzo') >= 0 ? 'rialzo' : 'stabile';
      if (histTrend === currTrend) {
        var futureSnaps = validSnaps.slice(si, si+6);
        if (futureSnaps.length >= 6) {
          similarCases.push({
            at: validSnaps[si].ts,
            wind_at: validSnaps[si].wind_speed,
            wind_6h: futureSnaps[5].wind_speed,
            pressure_at: validSnaps[si].pressure,
            dir_at: validSnaps[si].wind_dir
          });
        }
      }
    }

    // Build prompt for Claude Sonnet
    var dirs16p = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSO','SO','OSO','O','ONO','NO','NNO'];
    var pLines = [];
    pLines.push('Sei un meteorologo marino esperto del Tirreno settentrionale e Arcipelago Toscano.');
    pLines.push('');
    pLines.push('ZONA: ' + ZONES[zoneKey].name);
    pLines.push('ORA: ' + new Date().toLocaleString('it-IT', {timeZone:'Europe/Rome'}));
    pLines.push('');
    pLines.push('SITUAZIONE ATTUALE:');
    if (currentSnap) {
      var dirNameP = currentSnap.wind_dir !== null ? dirs16p[Math.round(currentSnap.wind_dir/22.5)%16] : '--';
      pLines.push('- Vento: ' + (currentSnap.wind_speed||'--') + 'kn da ' + dirNameP + ' (' + (currentSnap.wind_dir||'--') + 'deg)');
      pLines.push('- Pressione: ' + (currentSnap.pressure||'--') + 'hPa - ' + pressureTrend);
      pLines.push('- Onda: ' + (currentSnap.wave_height||'--') + 'm');
      if (currentSnap.wind_speed_obs) {
        pLines.push('- OWM osservato: ' + currentSnap.wind_speed_obs + 'kn da ' + dirs16p[Math.round((currentSnap.wind_dir_obs||0)/22.5)%16]);
      }
      if (currentSnap.ifs_wind_speed !== null && currentSnap.ifs_wind_speed !== undefined) {
        var ifsDirName = currentSnap.ifs_wind_dir !== null ? dirs16p[Math.round(currentSnap.ifs_wind_dir/22.5)%16] : '--';
        pLines.push('- IFS ECMWF: ' + currentSnap.ifs_wind_speed + 'kn da ' + ifsDirName + ' (modello globale ad alta risoluzione)');
      }
    }
    pLines.push('');
    if (currentSnap && (currentSnap.wave_height || currentSnap.wave_period)) {
      pLines.push('- Onda: ' + (currentSnap.wave_height||'--') + 'm, periodo: ' + (currentSnap.wave_period||'--') + 's');
    }
    pLines.push('STATISTICHE ULTIME 24H:');
    pLines.push('- Vento medio: ' + avgWind24 + 'kn, max: ' + maxWind24 + 'kn');
    pLines.push('- Rotazione vento: ' + rotation.trend + ' (' + (rotation.rotation ? rotation.rotation.toFixed(0) + ' gradi in ' + rotation.hours + 'h' : 'dati insufficienti') + ')');
    pLines.push('');
    pLines.push('BIAS MODELLO (errore storico Open-Meteo per questa zona):');
    if (bias && bias.samples > 10) {
      pLines.push('- Campioni: ' + bias.samples);
      pLines.push('- Bias vento: ' + bias.wind_bias.toFixed(1) + 'kn');
      pLines.push('- MAE vento: ' + bias.wind_mae.toFixed(1) + 'kn');
    } else {
      pLines.push('- Dati insufficienti per bias affidabile');
    }
    if (similarCases.length > 0) {
      pLines.push('');
      pLines.push('CASI STORICI SIMILI (stessa tendenza barica):');
      var maxCases = req.query.fast === '1' ? 3 : 5;
      similarCases.slice(0, maxCases).forEach(function(c) {
        var cDate = new Date(c.at).toLocaleString('it-IT',{timeZone:'Europe/Rome',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
        pLines.push('- ' + cDate + ': vento ' + c.wind_at + 'kn -> dopo 6h: ' + c.wind_6h + 'kn');
      });
    }
    // Aggiunge contesto rotazione dal manuale operativo (tab Nuvole)
    if (rotation && rotation.trend !== 'insufficient_data' && rotation.trend !== 'stable') {
      pLines.push('');
      pLines.push('CONTESTO OPERATIVO PER QUESTO TIPO DI ROTAZIONE:');
      if (rotation.trend === 'veering') {
        var veeringRate = rotation.rotation && Math.abs(rotation.rotation) > 60 ? 'rapido' : 'lento';
        if (veeringRate === 'rapido') {
          pLines.push('Veering orario RAPIDO rilevato. Meccanismo tipico: fronte freddo in avvicinamento.');
          pLines.push('- Barometro: attendersi caduta rapida >1 hPa/h poi risalita brusca post-fronte');
          pLines.push('- Vento: aumento con raffiche, rotazione S->SW->W->NW->N in minuti-ore');
          pLines.push('- Mare: crescita rapida Hs con periodo che si accorcia (onde corte e ripide)');
          pLines.push('- Cross-sea probabile: swell da settore precedente + nuovo mare da W-NW');
          pLines.push('- Navigazione: reef anticipato, evitare andature portanti in raffiche convettive');
          pLines.push('- Timeline: segnali pre-frontali 1-3h prima, passaggio in minuti, condizioni ventose 6-12h post-fronte');
          pLines.push('- CASO CRITICO se rotazione via Ovest (SWN): linea di groppo + mare ancora formato = finestra piu pericolosa');
        } else {
          pLines.push('Veering orario LENTO rilevato. Meccanismo tipico: fronte caldo in avvicinamento.');
          pLines.push('- Barometro: calo lento e regolare nel corso di 12-24h');
          pLines.push('- Vento: aumento progressivo, rotazione N->NE->E->SE->S, gust spread contenuto');
          pLines.push('- Mare: swell lungo in arrivo ORE PRIMA che il vento rinforzi (segnale precoce)');
          pLines.push('- Rischio nebbia da avvezione se SST < T aria');
          pLines.push('- Navigazione: angolo d onda favorevole, radar/AIS attivi, segnalazioni foniche se nebbia');
          pLines.push('- Timeline: deterioramento lento 12-36h, piogge leggere/moderate per molte ore');
        }
      } else if (rotation.trend === 'backing') {
        pLines.push('Backing antiorario rilevato.');
        if (pressureTrend && pressureTrend.indexOf('calo') >= 0) {
          pLines.push('- Con pressione in calo: possibile ciclogenesi o movimento retrogrado del minimo');
          pLines.push('- Barometro: caduta continua, a tratti accelerata >3-4 hPa/3h');
          pLines.push('- Vento: direzione instabile, raffiche intermittenti, backing S->SE->E->NE->N');
          pLines.push('- Mare: molto confuso per onde da direzioni diverse, frangenti su corrente contraria');
          pLines.push('- Navigazione: heavy-weather, cercare ridosso, report regolari posizione');
          pLines.push('- Timeline: peggioramento prolungato e irregolare (ore-giorni)');
        } else {
          pLines.push('- Con pressione stabile/rialzo: rimonta anticiclonica (NES = miglioramento reale)');
          pLines.push('- Barometro: tendenza al rialzo costante');
          pLines.push('- Vento: attenuazione raffiche, direzione stabilizza verso W-S');
          pLines.push('- Mare: decadimento mare di vento, swell lungo residuo 24-72h');
          pLines.push('- Navigazione: attendere finestre di minima risacca, verificare ormeggi post-burrasca');
          pLines.push('- Timeline: schiarite e calo vento in poche ore, swell residuo 24-72h');
        }
      } else if (rotation.trend === 'variable') {
        pLines.push('Direzione VARIABILE rilevata. Incrociare queste leve diagnostiche:');
        pLines.push('- Barometro: calo rapido >2 hPa/h = fronte freddo | calo lento = fronte caldo | rialzo = rimonta');
        pLines.push('- Vento: aumento brusco + raffiche + veering rapido = fronte freddo (PERICOLOSO)');
        pLines.push('- Mare: swell lungo prima del vento = fronte caldo a distanza | onde corte + corrente contraria = passaggio frontale');
        pLines.push('- Attenzione effetti Venturi nei canali (Capraia, Elba, Piombino) e risacca su imboccature');
        pLines.push('- Verificare SEMPRE: trend barometrico, sequenza nuvolosa, radar/nowcasting');
      }
    }

    pLines.push('');
    pLines.push('Basandoti su questi dati storici reali (non sul modello numerico), fornisci:');
    pLines.push('PREVISIONE_LOCALE: evoluzione vento e mare per h3, h6, h12 con valori numerici');
    pLines.push('CONFIDENZA: bassa/media/alta con motivazione');
    pLines.push('PATTERN: pattern sinottico identificato dai dati storici');
    pLines.push('CONSIGLIO: indicazione operativa per la navigazione in questa zona');
    pLines.push(req.query.fast === '1'
    ? 'Rispondi con: PREVISIONE_LOCALE: H3 Xkn DIR | H6 Xkn DIR | H12 Xkn DIR. Raffica max: Xkn. Onda: Xm. CONFIDENZA: bassa/media/alta con motivazione breve. PATTERN: una riga descrittiva. CONSIGLIO: indicazione operativa. Max 150 parole.'
    : 'Max 200 parole. Basati SOLO sui dati forniti, non su conoscenza generica.');
    var prompt = pLines.join('\n');

        // Call Claude Sonnet
    var aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: req.query.fast === '1' ? 'claude-haiku-4-5-20251001' : 'claude-sonnet-4-20250514',
        max_tokens: req.query.fast === '1' ? 300 : 600,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    var aiData = await aiRes.json();
    var aiText = aiData.content && aiData.content[0] ? aiData.content[0].text : 'Errore risposta AI';

    // Save prediction to KV for later verification
    var now3 = new Date();
    var predMins15 = now3.getMinutes() < 15 ? '00' : now3.getMinutes() < 30 ? '15' : now3.getMinutes() < 45 ? '30' : '45';
    var predKey = 'predict:' + zoneKey + ':' + now3.toISOString().slice(0, 13) + '-' + predMins15;
    // Extract structured wind values from AI text for easy comparison later
    var extractWindVal = function(text, h) {
      // Find lines containing H3/H6/H12 and extract first number before 'kn'
      var lines = text.split('\n');
      for (var li = 0; li < lines.length; li++) {
        var line = lines[li];
        var lup = line.toUpperCase();
        // Match H3, H+3, H3:, **H+3** etc
        if (lup.indexOf('H' + h) === -1 && lup.indexOf('H+' + h) === -1) continue;
        // Extract numbers before kn - look for pattern like 5.8kn or 5-7kn
        var nums = line.match(/([0-9]+\.?[0-9]*)-([0-9]+\.?[0-9]*)\s*kn/i);
        if (nums) return parseFloat(((parseFloat(nums[1])+parseFloat(nums[2]))/2).toFixed(1));
        var num = line.match(/([0-9]+\.?[0-9]*)\s*kn/i);
        if (num) return parseFloat(num[1]);
      }
      return null;
    };
    var predRecord = {
      generated_at: now3.toISOString(),
      zone: zoneKey,
      prediction_text: aiText,
      current_wind: currentSnap ? currentSnap.wind_speed : null,
      current_wind_dir: currentSnap ? currentSnap.wind_dir : null,
      current_pressure: currentSnap ? currentSnap.pressure : null,
      current_wave: currentSnap ? currentSnap.wave_height : null,
      current_ifs_wind: currentSnap ? currentSnap.ifs_wind_speed : null,
      current_ifs_dir: currentSnap ? currentSnap.ifs_wind_dir : null,
      data_points: validSnaps.length,
      similar_cases: similarCases.length,
      forecast_h3: extractWindVal(aiText, '3'),
      forecast_h6: extractWindVal(aiText, '6'),
      forecast_h12: extractWindVal(aiText, '12')
    };
    if (kvUrl && kvToken) {
      var saveOk = await kvSet(predKey, predRecord, 2592000, kvUrl, kvToken); // 30 days TTL
      if (!saveOk) console.error('predict: kvSet failed for key', predKey);
    }

    var result = {
      zone: zoneKey,
      name: ZONES[zoneKey].name,
      generated_at: now3.toISOString(),
      saved_key: predKey,
      save_ok: typeof saveOk !== 'undefined' ? saveOk : null,
      current: currentSnap,
      bias: bias,
      rotation: rotation,
      similar_cases: similarCases.length,
      similar_cases_detail: similarCases,
      prediction: aiText,
      data_points: validSnaps.length
    };
    return res.status(200).json(result);

  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

// /api/engine?action=predict_history&zone=xxx - get saved predictions for verification
if (action === 'predict_history') {
  if (!zoneKey || !ZONES[zoneKey]) {
    return res.status(404).json({ error: 'Zona non trovata' });
  }
  try {
    var now4 = new Date();
    // Search last 14 days, every hour = 336 slots but batch in groups
    // Use a smarter approach: check every hour for last 14 days
    // Search last 7 days x 24 hours x 2 slots = 336 keys max
    // Split into predict keys: check both :00 and :30 for each hour
    var predPromises = [];
    for (var pd4 = 0; pd4 < 7; pd4++) {
      for (var ph4 = 0; ph4 < 24; ph4++) {
        for (var pm4 = 0; pm4 < 4; pm4++) {
          (function(dd, hh, qq) {
            var t = new Date(now4.getTime() - dd*86400000 - hh*3600000 - qq*900000);
            var minStr = qq === 0 ? '00' : qq === 1 ? '15' : qq === 2 ? '30' : '45';
            var key = 'predict:' + zoneKey + ':' + t.toISOString().slice(0,13) + '-' + minStr;
            predPromises.push(kvGet(key, kvUrl, kvToken).then(function(v) {
              return v ? v : null;
            }));
          })(pd4, ph4, pm4);
        }
      }
    }
    var allPreds4 = await Promise.all(predPromises);
    // Deduplicate by generated_at
    var seen = {};
    var predictions4 = allPreds4.filter(function(p) {
      if (!p || !p.generated_at) return false;
      var key = p.generated_at;
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
    predictions4.sort(function(a,b) { return new Date(b.generated_at) - new Date(a.generated_at); });

    // For each prediction, find actual snapshot at h6 and h12
    var top10 = predictions4.slice(0, 10);
    var actualPromises = [];
    top10.forEach(function(p) {
      var genTime = new Date(p.generated_at);
      // h3 actual
      var t3 = new Date(genTime.getTime() + 3*3600000);
      var m3 = t3.getMinutes() < 30 ? '00' : '30';
      var k3 = 'snap:' + zoneKey + ':' + t3.toISOString().slice(0,13) + '-' + m3;
      actualPromises.push(kvGet(k3, kvUrl, kvToken));
      // h6 actual
      var t6 = new Date(genTime.getTime() + 6*3600000);
      var m6 = t6.getMinutes() < 30 ? '00' : '30';
      var k6 = 'snap:' + zoneKey + ':' + t6.toISOString().slice(0,13) + '-' + m6;
      actualPromises.push(kvGet(k6, kvUrl, kvToken));
      // h12 actual
      var t12 = new Date(genTime.getTime() + 12*3600000);
      var m12 = t12.getMinutes() < 30 ? '00' : '30';
      var k12 = 'snap:' + zoneKey + ':' + t12.toISOString().slice(0,13) + '-' + m12;
      actualPromises.push(kvGet(k12, kvUrl, kvToken));
    });
    var actuals = await Promise.all(actualPromises);

    var withActual = top10.map(function(p, i) {
      var snap3 = actuals[i*3];
      var snap6 = actuals[i*3+1];
      var snap12 = actuals[i*3+2];
      return {
        prediction: p,
        actual_3h: snap3 ? snap3.wind_speed : null,
        actual_3h_dir: snap3 ? snap3.wind_dir : null,
        actual_6h: snap6 ? snap6.wind_speed : null,
        actual_6h_dir: snap6 ? snap6.wind_dir : null,
        actual_12h: snap12 ? snap12.wind_speed : null,
        actual_12h_dir: snap12 ? snap12.wind_dir : null
      };
    });

    return res.status(200).json({
      zone: zoneKey,
      name: ZONES[zoneKey].name,
      total: predictions4.length,
      predictions: withActual
    });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

  // /api/engine?action=backfill&zone=xxx&days=30&secret=xxx
  if (action === 'backfill') {
    var bSecret = req.query.secret || '';
    var expectedSecret = process.env.CRON_SECRET || '';
    if (expectedSecret && bSecret !== expectedSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!zoneKey || !ZONES[zoneKey]) {
      return res.status(404).json({ error: 'Zona non trovata' });
    }
    try {
      var days = Math.min(parseInt(req.query.days) || 7, 30);
      var zone = ZONES[zoneKey];
      var atmUrl = 'https://api.open-meteo.com/v1/forecast?latitude=' + zone.lat + '&longitude=' + zone.lon +
        '&hourly=temperature_2m,relativehumidity_2m,surface_pressure,windspeed_10m,winddirection_10m,windgusts_10m' +
        '&wind_speed_unit=kn&timezone=Europe/Rome&forecast_days=1&past_days=' + days + '&models=best_match';
      var waveUrl = 'https://marine-api.open-meteo.com/v1/marine?latitude=' + zone.lat + '&longitude=' + zone.lon +
        '&hourly=wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period,swell_wave_direction' +
        '&length_unit=metric&timezone=Europe/Rome&forecast_days=1&past_days=' + days;
      var res2 = await Promise.all([fetch(atmUrl), fetch(waveUrl)]);
      var atmData = await res2[0].json();
      if (!atmData.hourly) return res.status(500).json({ error: 'OM error' });
      if (res2[1].ok) {
        var waveData = await res2[1].json();
        if (waveData.hourly) {
          var wh2 = waveData.hourly;
          atmData.hourly.wave_height = wh2.wave_height;
          atmData.hourly.wave_period = wh2.wave_period;
          atmData.hourly.swell_wave_height = wh2.swell_wave_height;
          atmData.hourly.swell_wave_direction = wh2.swell_wave_direction;
        }
      }
      var hh = atmData.hourly;
      var written = 0;
      var nowBf = new Date();
      var writePromises = [];
      for (var ti2 = 0; ti2 < hh.time.length; ti2++) {
        var slotTime = new Date(hh.time[ti2]);
        if (slotTime >= nowBf) continue;
        (function(i2) {
          var snap2 = {
            ts: new Date(hh.time[i2]).toISOString(),
            wind_dir: sn(hh.winddirection_10m[i2]),
            wind_speed: sn(hh.windspeed_10m[i2]),
            wind_speed_om: sn(hh.windspeed_10m[i2]),
            wind_dir_om: sn(hh.winddirection_10m[i2]),
            pressure: sn(hh.surface_pressure[i2], 1013),
            wave_height: sn(hh.wave_height && hh.wave_height[i2]),
            swell_height: sn(hh.swell_wave_height && hh.swell_wave_height[i2]),
            temp_air: sn(hh.temperature_2m[i2], 15),
            humidity: sn(hh.relativehumidity_2m[i2], 70),
            wind_speed_obs: null,
            wind_dir_obs: null,
            obs_source: 'backfill_om'
          };
          var keyBf = 'snap:' + zoneKey + ':' + hh.time[i2].slice(0, 13) + '-00';
          writePromises.push(kvSet(keyBf, snap2, 2592000, kvUrl, kvToken));
          written++;
        })(ti2);
      }
      await Promise.all(writePromises);
      return res.status(200).json({ ok: true, zone: zoneKey, days: days, written: written });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

if (action === 'meteo') {
  // Proxy fetch dati meteo completi per il tab Meteo - evita 429 dall'IP del browser
  // Parametri: lat, lon
  var mlat = req.query.lat ? parseFloat(req.query.lat) : null;
  var mlon = req.query.lon ? parseFloat(req.query.lon) : null;
  if (!mlat || !mlon) {
    return res.status(400).json({ error: 'lat e lon richiesti' });
  }
  try {
    var atmUrl  = 'https://api.open-meteo.com/v1/forecast?latitude=' + mlat + '&longitude=' + mlon +
      '&hourly=temperature_2m,relativehumidity_2m,visibility,cloudcover,precipitation_probability,' +
      'windspeed_10m,winddirection_10m,windgusts_10m,surface_pressure' +
      '&wind_speed_unit=kn&timezone=Europe/Rome&forecast_days=2&models=best_match';
    var iconUrl  = 'https://api.open-meteo.com/v1/forecast?latitude=' + mlat + '&longitude=' + mlon +
      '&hourly=windspeed_10m,winddirection_10m,windgusts_10m' +
      '&wind_speed_unit=kn&timezone=Europe/Rome&forecast_days=2&models=icon_seamless';
    var ifsUrl   = 'https://api.open-meteo.com/v1/ecmwf?latitude=' + mlat + '&longitude=' + mlon +
      '&hourly=windspeed_10m,winddirection_10m,windgusts_10m' +
      '&wind_speed_unit=kn&timezone=Europe/Rome&forecast_days=2';
    var marineUrl = 'https://marine-api.open-meteo.com/v1/marine?latitude=' + mlat + '&longitude=' + mlon +
      '&hourly=wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period,swell_wave_direction,sea_surface_temperature' +
      '&length_unit=metric&timezone=Europe/Rome&forecast_days=2';
    var [atmRes, iconRes, ifsRes, marineRes] = await Promise.all([
      fetch(atmUrl), fetch(iconUrl), fetch(ifsUrl), fetch(marineUrl)
    ]);
    var atmData    = atmRes.ok    ? await atmRes.json()    : null;
    var iconData   = iconRes.ok   ? await iconRes.json()   : null;
    var ifsData    = ifsRes.ok    ? await ifsRes.json()    : null;
    var marineData = marineRes.ok ? await marineRes.json() : null;
    if (!atmData || atmData.error) {
      return res.status(502).json({ error: atmData ? atmData.reason : 'OM error' });
    }
    return res.status(200).json({
      atm:    atmData,
      icon:   iconData,
      ifs:    ifsData,
      marine: marineData
    });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

if (action === 'grid') {
  // Fetch vento griglia per la mappa - proxy verso Open-Meteo per evitare 429 dal browser
  // Parametri: lats=lat1,lat2,...  lons=lon1,lon2,...
  var glats = req.query.lats ? req.query.lats.split(',').map(Number) : [];
  var glons = req.query.lons ? req.query.lons.split(',').map(Number) : [];
  if (glats.length === 0 || glats.length !== glons.length) {
    return res.status(400).json({ error: 'lats e lons richiesti e devono avere stessa lunghezza' });
  }
  try {
    var latStr = glats.join(',');
    var lonStr = glons.join(',');
    var gridUrl = 'https://api.open-meteo.com/v1/forecast?latitude=' + latStr +
      '&longitude=' + lonStr +
      '&hourly=windspeed_10m,winddirection_10m,windgusts_10m' +
      '&wind_speed_unit=kn&timezone=Europe/Rome&forecast_days=1';
    var gridRes = await fetch(gridUrl);
    if (!gridRes.ok) {
      return res.status(gridRes.status).json({ error: 'Open-Meteo error: ' + gridRes.status });
    }
    var gridData = await gridRes.json();
    var items = Array.isArray(gridData) ? gridData : [gridData];
    // Trova indice ora corrente Europe/Rome
    var romeParts2 = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Rome', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit'
    }).formatToParts(new Date());
    var rp2 = {};
    romeParts2.forEach(function(p){ rp2[p.type] = p.value; });
    var nowRome2 = rp2.year + '-' + rp2.month + '-' + rp2.day + 'T' + rp2.hour + ':00';
    var gridPoints = items.map(function(d, idx) {
      if (!d.hourly) return null;
      var h = d.hourly;
      var tidx = h.time ? h.time.findIndex(function(t){ return t === nowRome2; }) : 0;
      if (tidx < 0) tidx = 0;
      return {
        lat: glats[idx],
        lon: glons[idx],
        speed: h.windspeed_10m    ? h.windspeed_10m[tidx]    : null,
        dir:   h.winddirection_10m ? h.winddirection_10m[tidx] : null,
        gust:  h.windgusts_10m   ? h.windgusts_10m[tidx]   : null,
        time:  nowRome2.slice(11, 16)
      };
    }).filter(function(p){ return p !== null; });
    return res.status(200).json({ points: gridPoints, ts: new Date().toISOString() });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

if (action === 'zones') {
var list = Object.keys(ZONES).filter(function(k) {
return ZONES[k].enabled !== false;
}).map(function(k) {
return { key: k, name: ZONES[k].name, lat: ZONES[k].lat, lon: ZONES[k].lon, ports: Object.keys(ZONES[k].ports).length };
});
return res.status(200).json({ zones: list });
}

if (action === 'zone') {
if (!zoneKey || !ZONES[zoneKey]) {
return res.status(404).json({ error: 'Zona non trovata', available: Object.keys(ZONES) });
}
try {
// Accept client-side weatherData from POST body for data consistency
var clientWeatherData = null;
if (req.method === 'POST' && req.body && req.body.weatherData) {
clientWeatherData = req.body.weatherData;
}
var result = await calcZone(zoneKey, null, kvUrl, kvToken, req, clientWeatherData);
return res.status(200).json(result);
} catch (err) {
return res.status(500).json({ error: err.message, zone: zoneKey });
}
}

return res.status(200).json({
engine: 'nautilus-engine v2.0.0 - by mdisailor engine',
endpoints: ['/api/engine?action=ping', '/api/engine?action=zones', '/api/engine?action=zone&zone={key}']
});
};

// Fine codice - NAUTILUS ENGINE v2.9.32

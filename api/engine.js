// NAUTILUS ENGINE - Vercel API - engine.js - v2.6.4 A - by mdisailor engine
// Motore diagnostico meteo-marino - 12 zone puntuali
// Zone default: canale_piombino, livorno, viareggio
// Endpoints: /api/engine?action=ping|zones|zone&zone=xxx
 
//- ZONE PUNTUALI -

var ZONES = {
canale_piombino: {
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
name: 'Livorno',
lat: 43.55, lon: 10.31,
ports: {
livorno:        { name: 'Livorno',        exposure: 'SW', shelter: 'high', swell_threshold: 2.0 },
castiglioncello:{ name: 'Castiglioncello',exposure: 'W',  shelter: 'low',  swell_threshold: 0.9 },
},
local_effects: {
fetch_sw: { desc: 'Fetch aperto SW', active_wind_dirs: [210, 270], note: 'Costa esposta - mare formato rapidamente con Libeccio' },
gorgona_scia: { desc: 'Scia sottovento Gorgona', active_wind_dirs: [270, 360], note: 'Zona di calma relativa sottovento a Gorgona con vento da W-NW' },
}
},
viareggio: {
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
var windRotation = calcWindRotation(wind_dir_prev, wind_dir);
if (windRotation !== null) {
var rotDeg = Math.abs(windRotation);
var isVeering = windRotation > 0;
if (rotDeg > 30) {
if (isVeering) {
var fromS = wind_dir_prev >= 150 && wind_dir_prev <= 240;
var fromN = wind_dir_prev >= 330 || wind_dir_prev <= 30;
if (fromS) {
signals.push({ type: 'wind_veering', strength: 'strong', msg: 'Rotazione oraria S->N ' + sf(rotDeg,0) + ' gradi - CASO A: fronte freddo' });
caseScores.A += 4;
} else if (fromN) {
signals.push({ type: 'wind_veering', strength: 'strong', msg: 'Rotazione oraria N->S ' + sf(rotDeg,0) + ' gradi - CASO B: fronte caldo' });
caseScores.B += 4;
} else {
signals.push({ type: 'wind_veering', strength: 'medium', msg: 'Rotazione oraria ' + sf(rotDeg,0) + ' gradi' });
caseScores.A += 1; caseScores.B += 1;
}
} else {
var fromS2 = wind_dir_prev >= 150 && wind_dir_prev <= 240;
var fromN2 = wind_dir_prev >= 330 || wind_dir_prev <= 30;
if (fromS2) {
signals.push({ type: 'wind_backing', strength: 'strong', msg: 'Rotazione antioraria S->N ' + sf(rotDeg,0) + ' gradi - CASO C: ciclogenesi' });
caseScores.C += 4;
} else if (fromN2) {
signals.push({ type: 'wind_backing', strength: 'medium', msg: 'Rotazione antioraria N->S ' + sf(rotDeg,0) + ' gradi - CASO D: miglioramento' });
caseScores.D += 3;
} else {
signals.push({ type: 'wind_backing', strength: 'medium', msg: 'Rotazione antioraria ' + sf(rotDeg,0) + ' gradi' });
caseScores.C += 1; caseScores.D += 1;
}
}
}
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

async function fetchOpenMeteo(lat, lon) {
var atmParams = 'temperature_2m,relativehumidity_2m,surface_pressure,windspeed_10m,winddirection_10m,windgusts_10m,cloudcover,precipitation,visibility';
var waveParams = 'wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period,swell_wave_direction';
var atmUrl = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&hourly=' + atmParams + '&wind_speed_unit=kn&timezone=Europe/Rome&forecast_days=2&models=best_match';
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

function extractCurrentData(omData, sgData) {
var h = omData.hourly;
var now = new Date();
var currentHour = now.toISOString().slice(0, 13) + ':00';
var idx = h.time.findIndex(function(t) { return t === currentHour; });
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
sources: { wind: 'open-meteo', wave: 'open-meteo', pressure: 'open-meteo' }
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
if (sgData.wind_speed_sg > 0) {
base.wind_speed = (base.wind_speed + sgData.wind_speed_sg) / 2;
base.sources.wind = 'open-meteo+stormglass';
}
}
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
// Format: [“SET”, “key”, “value”, “EX”, “ttl”]
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
var hourKey = now.toISOString().slice(0, 13);
var key = 'snap:' + zoneKey + ':' + hourKey;
var snapshot = {
ts: now.toISOString(),
wind_dir: data.wind_dir,
wind_speed: data.wind_speed,
pressure: data.pressure,
wave_height: data.wave_height,
swell_height: data.swell_height,
swell_dir: data.swell_dir,
temp_air: data.temp_air,
humidity: data.humidity
};
await kvSet(key, snapshot, 259200, restUrl, restToken);
}

async function saveForecast(zoneKey, forecast, data, restUrl, restToken) {
if (!restUrl || !restToken) return;
var now = new Date();
var key = 'forecast:' + zoneKey + ':' + now.toISOString().slice(0, 13);
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
await kvSet(key, record, 259200, restUrl, restToken);
}

async function getWindHistory(zoneKey, restUrl, restToken, hours) {
if (!restUrl || !restToken) return [];
if (!hours) hours = 24;
var now = new Date();
var snapshots = [];
// Fetch in parallel for speed
var promises = [];
for (var h = hours - 1; h >= 0; h = h - 1) {
(function(hh) {
var d = new Date(now.getTime() - hh * 3600000);
var hourKey = d.toISOString().slice(0, 13);
var key = 'snap:' + zoneKey + ':' + hourKey;
promises.push(kvGet(key, restUrl, restToken).then(function(snap) {
return snap ? { h: hh, snap: snap } : null;
}));
})(h);
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
var pastKey = 'forecast:' + zoneKey + ':' + pastTime.toISOString().slice(0, 13);
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

async function calcZone(zoneKey, sgKey, kvUrl, kvToken, req) {
var zone = ZONES[zoneKey];
var omData = await fetchOpenMeteo(zone.lat, zone.lon);

var sgData = null;
var hasStormglass = false;
if (sgKey) {
try {
var sgRaw = await fetchStormglass(zone.lat, zone.lon, sgKey);
sgData = extractStormglassData(sgRaw);
hasStormglass = sgData !== null;
} catch(e) { hasStormglass = false; }
}

var currentData = extractCurrentData(omData, sgData);

// Rotation analysis from KV history - read only if explicitly requested
var rotationAnalysis = { trend: 'insufficient_data', hours: 0, rotation: null, consistent: false };
var useHistory = req && req.query && req.query.history === '1';
try {
if (kvUrl && kvToken && useHistory) {
var windHistory = await getWindHistory(zoneKey, kvUrl, kvToken);
rotationAnalysis = analyzeWindRotation(windHistory);
}
// Always save snapshot - fire and forget, never blocks
if (kvUrl && kvToken) {
// In cron mode await the save, otherwise fire and forget
var isCron = req && req.query && req.query.history === '1';
if (isCron) {
await saveZoneSnapshot(zoneKey, currentData, kvUrl, kvToken);
} else {
saveZoneSnapshot(zoneKey, currentData, kvUrl, kvToken).catch(function() {});
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
return res.status(200).json({ ok: true, engine: 'nautilus-engine', v: '2.3.0', zones: Object.keys(ZONES).length, ts: Date.now() });
}

// /api/engine?action=cron - called by cron-job.org every hour for all zones
if (action === 'cron') {
var cronSecret = req.query.secret || '';
var expectedSecret = process.env.CRON_SECRET || '';
if (expectedSecret && cronSecret !== expectedSecret) {
return res.status(401).json({ error: 'Unauthorized' });
}
var cronResults = {};
var cronPromises = Object.keys(ZONES).map(function(zk) {
return calcZone(zk, sgKey, kvUrl, kvToken, { query: { history: '1' } })
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

if (action === 'zones') {
var list = Object.keys(ZONES).map(function(k) {
return { key: k, name: ZONES[k].name, lat: ZONES[k].lat, lon: ZONES[k].lon, ports: Object.keys(ZONES[k].ports).length };
});
return res.status(200).json({ zones: list });
}

if (action === 'zone') {
if (!zoneKey || !ZONES[zoneKey]) {
return res.status(404).json({ error: 'Zona non trovata', available: Object.keys(ZONES) });
}
try {
var result = await calcZone(zoneKey, sgKey, kvUrl, kvToken, req);
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

// Fine codice

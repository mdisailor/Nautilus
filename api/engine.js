// NAUTILUS ENGINE - Vercel API - engine.js - v2.13.15 - by mdisailor engine
// Motore diagnostico meteo-marino - 12 zone puntuali

// AUTH CENTRALIZZATA - richiede CRON_SECRET via header Authorization: Bearer <secret>
// Mai accettare k=mdi come fallback (troppo corto, finisce nei log)
function requireSecret(req) {
  var cronSecret = process.env.CRON_SECRET || '';
  if (!cronSecret) return false; // se non configurato, blocca tutto
  var authHeader = req.headers['authorization'] || '';
  if (authHeader === 'Bearer ' + cronSecret) return true;
  // Fallback query param solo per migrazione (da rimuovere in futuro)
  var qs = req.query.secret || '';
  if (qs === cronSecret) return true;
  return false;
}


// Zone default: canale_piombino, livorno, viareggio
// Endpoints: /api/engine?action=ping|zones|zone&zone=xxx

//- ZONE PUNTUALI -

var ZONES = {
canale_piombino: {
enabled: true,
name: 'Canale di Piombino',
lat: 42.9296, lon: 10.5073,
bias_station: 'populonia_cfr',
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
lat: 43.5497, lon: 10.2950,
bias_station: 'livorno_cfr', bias_quota: 2,
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
lat: 43.8621, lon: 10.2329,
bias_station: 'viareggio_cfr',
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
lat: 43.0527, lon: 9.8410, bias_station: 'capraia_cfr', bias_quota: 274,
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
lat: 42.8138, lon: 10.3457, bias_station: 'portoferraio_cfr', bias_quota: 10,
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
lat: 42.7604, lon: 10.4024, bias_station: 'portoferraio_cfr', bias_quota: 10,
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
lat: 42.3614, lon: 10.9206,
bias_station: 'giglio_porto',
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
vada: {
enabled: true, name: 'Vada', lat: 43.3550, lon: 10.4280, bias_station: 'vada',
ports: {
vada: { name: 'Vada', exposure: 'SW', shelter: 'low', swell_threshold: 0.8 },
},
local_effects: {
fetch_sw: { desc: 'Fetch aperto SW', active_wind_dirs: [210, 270], note: 'Costa bassa con scarsa protezione dai settori occidentali' },
}
},
punta_ala: {
enabled: true,
name: 'Punta Ala - Follonica',
lat: 42.8088, lon: 10.7357, bias_station: 'follonica', bias_quota: 15,
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
lat: 44.0718, lon: 9.8666,
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
barcaggio: {
enabled: true, name: 'Capo Corso - Barcaggio', lat: 43.0058, lon: 9.4045, bias_station: 'barcaggio',
ports: {
barcaggio:  { name: 'Barcaggio',        exposure: 'N',  shelter: 'low',    swell_threshold: 0.8 },
macinaggio: { name: 'Macinaggio',       exposure: 'NE', shelter: 'medium', swell_threshold: 1.0 },
centuri:    { name: 'Port de Centuri',  exposure: 'NW', shelter: 'medium', swell_threshold: 1.0 },
},
local_effects: {
tramontane_corsica: { desc: 'Tramontane accelerata Capo Corso', active_wind_dirs: [330, 30], amplification: 1.30, note: 'Punta estrema Capo Corso - vento canalizzato e accelerato, raffiche violente' },
canale_corsica: { desc: 'Canale di Corsica', active_wind_dirs: [330, 60], amplification: 1.25, note: 'Accelerazione nel canale tra Corsica e continente' },
}
},
bonifacio: {
enabled: true, name: 'Bonifacio - Bocche di Bonifacio', lat: 41.3739, lon: 9.1783, bias_station: 'bonifacio_pertusato',
ports: {
bonifacio: { name: 'Bonifacio',      exposure: 'S', shelter: 'medium', swell_threshold: 1.2 },
cavallo:   { name: 'Isola Cavallo',  exposure: 'S', shelter: 'low',    swell_threshold: 0.8 },
},
local_effects: {
bocche_bonifacio: { desc: 'Effetto Venturi Bocche di Bonifacio', active_wind_dirs: [240, 300], amplification: 1.35, note: 'Canale tra Corsica e Sardegna - forte accelerazione del vento da ovest/libeccio' },
}
},
gorgona: {
enabled: true, name: 'Gorgona', lat: 43.433, lon: 9.883, bias_station: 'gorgona_cfr',
ports: { gorgona: { name: 'Gorgona', exposure: 'W', shelter: 'low', swell_threshold: 0.6 } },
local_effects: { esposizione: { desc: 'Isola esposta', active_wind_dirs: [0,360], note: 'Isola isolata - vento e onda amplificati rispetto alla costa' } }
},
montecristo: {
enabled: true, name: 'Montecristo', lat: 42.335, lon: 10.311, bias_station: 'montecristo',
ports: { montecristo: { name: 'Cala Maestra', exposure: 'N', shelter: 'low', swell_threshold: 0.5 } },
local_effects: { isolamento: { desc: 'Isola isolata centro Tirreno', active_wind_dirs: [0,360], note: 'Nessun ridosso - condizioni spesso piu\' forti rispetto alle isole vicine' } }
},
orbetello: {
enabled: true, name: 'Orbetello - Argentario', lat: 42.441, lon: 11.216, bias_station: 'orbetello',
ports: {
porto_s_stefano: { name: 'Porto S.Stefano', exposure: 'W',  shelter: 'medium', swell_threshold: 1.0 },
porto_ercole:    { name: 'Porto Ercole',    exposure: 'SW', shelter: 'medium', swell_threshold: 1.0 },
},
local_effects: { fetch_w: { desc: 'Fetch aperto W', active_wind_dirs: [240,300], note: 'Libeccio genera mare rapidamente in questa zona' } }
},
bocca_arno: {
enabled: true, name: 'Bocca d\'Arno', lat: 43.680, lon: 10.270, bias_station: 'bocca_arno_cfr',
ports: { bocca_arno: { name: 'Bocca d\'Arno', exposure: 'W', shelter: 'low', swell_threshold: 0.8 } },
local_effects: { foce_arno: { desc: 'Foce Arno - bassi fondali', active_wind_dirs: [180,300], note: 'Mare corto e ripido per fondali bassi all\'imbocco del fiume' } }
},
svincenzo: {
enabled: true, name: 'S.Vincenzo', lat: 43.098, lon: 10.537, bias_station: 'svincenzo_porto',
ports: { svincenzo: { name: 'S.Vincenzo Porto', exposure: 'W', shelter: 'medium', swell_threshold: 1.0 } },
local_effects: { costa_bassa: { desc: 'Costa pianeggiante esposta', active_wind_dirs: [220,300], note: 'Nessun ostacolo naturale a W - mare formato' } }
},
follonica: {
enabled: true, name: 'Follonica', lat: 42.919, lon: 10.765, bias_station: 'follonica',
ports: { follonica: { name: 'Follonica', exposure: 'W', shelter: 'medium', swell_threshold: 1.0 } },
local_effects: { golfo_follonica: { desc: 'Golfo di Follonica', active_wind_dirs: [220,300], note: 'Libeccio entra direttamente nel golfo' } }
},
capalbio: {
enabled: true, name: 'Capalbio - Argentario S', lat: 42.459, lon: 11.269, bias_station: 'capalbio',
ports: { capalbio: { name: 'Capalbio Scalo', exposure: 'W', shelter: 'low', swell_threshold: 0.8 } },
local_effects: { tramontana_s: { desc: 'Tramontana Lazio nord', active_wind_dirs: [330,30], note: 'Tramontana accelerata tra Argentario e costa laziale' } }
},
alberese: {
enabled: true, name: 'Alberese - Foce Ombrone', lat: 42.638, lon: 11.078, bias_station: 'alberese',
ports: { alberese: { name: 'Marina di Alberese', exposure: 'W', shelter: 'low', swell_threshold: 0.7 } },
local_effects: { foce_ombrone: { desc: 'Zona foce Ombrone', active_wind_dirs: [0,360], note: 'Costa bassa del Parco Maremma - vento libero da W' } }
},
forte_marmi: {
enabled: true, name: 'Forte dei Marmi - Versilia N', lat: 43.963, lon: 10.174, bias_station: 'forte_dei_marmi',
ports: { forte_marmi: { name: 'Forte dei Marmi', exposure: 'W', shelter: 'low', swell_threshold: 1.0 } },
local_effects: { apuane: { desc: 'Effetto Alpi Apuane', active_wind_dirs: [30,90], note: 'Tramontana accelerata a valle delle Apuane' } }
},
casotto_gr: {
enabled: true, name: 'Casotto P. - Marina di Grosseto', lat: 42.740, lon: 11.040, bias_station: 'casotto_pescatori',
ports: { casotto: { name: 'Marina di Grosseto', exposure: 'W', shelter: 'low', swell_threshold: 0.8 } },
local_effects: { diaccia: { desc: 'Zona Diaccia Botrona', active_wind_dirs: [0,360], note: 'Costa del parco - area esposta con correnti lagunari' } }
},
venturina: {
enabled: true, name: 'Venturina - Val di Cornia', lat: 42.985, lon: 10.620, bias_station: 'venturina',
ports: { venturina: { name: 'Punta Ala area', exposure: 'W', shelter: 'medium', swell_threshold: 1.0 } },
local_effects: { canale_piombino_s: { desc: 'Influenza canale Piombino', active_wind_dirs: [270,360], note: 'Zona di transizione tra canale Piombino e golfo Follonica' } }
},
};
//  LAMMA STATIONS MAP 
var LAMMA_STATIONS = [
  { id: 4652,  nome: 'CAPRAIA',            zone: 'capraia' },
  { id: 430,   nome: "BOCCA_D'ARNO",       zone: 'viareggio' },
  { id: 4636,  nome: 'VIAREGGIO',          zone: 'viareggio' },
  { id: 1656,  nome: 'GORGONA',            zone: 'livorno' },
  { id: 466,   nome: 'PORTOFERRAIO',       zone: 'elba_nord' },
  { id: 3927,  nome: 'GIGLIO_PORTO',       zone: 'giglio' },
  { id: 3931,  nome: 'GIGLIO_CASTELLO',    zone: 'giglio' },
  { id: 2424,  nome: 'MONTECRISTO_(LAMMA)',zone: 'giglio' },
  { id: 467,   nome: 'SAN_VINCENZO',       zone: 'canale_piombino' },
  { id: 2420,  nome: 'FOLLONICA_(LAMMA)',  zone: 'punta_ala' },
  { id: 1529,  nome: 'MONTE_ARGENTARIO',   zone: 'giglio' },
  { id: 463,   nome: 'DONORATICO',         zone: 'livorno' },
  { id: 462,   nome: 'CECINA',             zone: 'livorno' },
  { id: 507,   nome: 'LIDO_DI_CAMAIORE',   zone: 'viareggio' },
  { id: 363,   nome: 'TORRE_DEL_LAGO',     zone: 'viareggio' },
  { id: 3954,  nome: 'GROSSETO_(LAMMA)',   zone: 'punta_ala' },
  { id: 9338,  nome: 'PIETRASANTA',        zone: 'viareggio' },
  { id: 2530,  nome: 'FORTE_DEI_MARMI',    zone: 'viareggio' },
  { id: 2475,  nome: 'QUERCIANELLA',       zone: 'livorno' },
  { id: 551,   nome: 'ALBERESE',           zone: 'punta_ala' },
  { id: 531,   nome: 'CAPALBIO',           zone: 'giglio' },
  { id: 2526,  nome: 'AVENZA',             zone: 'la_spezia' },
];


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
var romeHourNow = (new Date().getUTCHours() + 2) % 24; // approssimazione UTC+2 (ora legale)
var isFogHour = romeHourNow >= 20 || romeHourNow < 10;
if (deltaT < 0.5 && humidity > 90 && isFogHour) {
  alerts.push({ type: 'fog_high', severity: 'high', msg: '[ROSSO] Delta T ' + sf(deltaT,1) + ' C, umidita ' + sf(humidity,0) + '% - nebbia probabile' });
} else if (deltaT < 0.5 && humidity > 90) {
  alerts.push({ type: 'fog_risk', severity: 'medium', msg: '[GIALLO] Delta T ' + sf(deltaT,1) + ' C, umidita ' + sf(humidity,0) + '% - condizioni favorevoli nebbia notturna' });
} else if (deltaT < 1.0 && humidity > 85) {
  alerts.push({ type: 'fog_risk', severity: 'low', msg: '[INFO] Delta T ' + sf(deltaT,1) + ' C - rischio nebbia nelle ore notturne' });
}

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

// Soglie NAUTILUS v2 -- definite 03/05/2026
// ROSSO: condizioni severe (forza 6 Beaufort pieno)
if (wind_gust >= 35) { level = Math.max(level, 3); reasons.push('raffiche ' + Math.round(wind_gust) + 'kn'); }
else if (wind_gust >= 30) { level = Math.max(level, 3); reasons.push('raffiche ' + Math.round(wind_gust) + 'kn'); }
else if (wind_gust >= 22) { level = Math.max(level, 2); reasons.push('raffiche ' + Math.round(wind_gust) + 'kn'); }

if (wind_speed >= 28) { level = Math.max(level, 3); reasons.push('vento ' + Math.round(wind_speed) + 'kn'); }
else if (wind_speed >= 10) { level = Math.max(level, 2); reasons.push('vento ' + Math.round(wind_speed) + 'kn'); }

if (wave_height >= 2.5) { level = Math.max(level, 3); reasons.push('onda ' + wave_height.toFixed(1) + 'm'); }
else if (wave_height >= 0.5) { level = Math.max(level, 2); reasons.push('onda ' + wave_height.toFixed(1) + 'm'); }

if (pressure_trend_3h <= -5.0) { level = Math.max(level, 3); reasons.push('calo pressione critico'); }
else if (pressure_trend_3h <= -2.0) { level = Math.max(level, 2); reasons.push('calo pressione'); }

// Rapporto raffica/vento anomalo (>2x) -> GIALLO
if (wind_speed > 3 && wind_gust > 0 && wind_gust / wind_speed >= 2.0) {
  level = Math.max(level, 2);
  reasons.push('raffica ' + Math.round(wind_gust / wind_speed * 10) / 10 + 'x vento medio');
}

// Combinazione pericolosa: vento >20kn + onda corta <4s
var wave_period = sn(data.wave_period);
if (wind_speed >= 20 && wave_period && wave_period < 4) {
  level = Math.max(level, 3);
  reasons.push('mare corto e agitato');
}

// Calo pressione >4 hPa in 6h -> GIALLO automatico
var pressure_trend_6h = data.pressure_prev && data.pressure ?
  (data.pressure - data.pressure_prev) : null;
// pressure_prev e' lo snapshot di 3h fa, approssimazione 6h = 2x trend 3h
if (pressure_trend_3h && pressure_trend_3h * 2 <= -4.0 && level < 2) {
  level = 2;
  reasons.push('calo pressione >4 hPa/6h');
}

// Active local effects with amplification
for (var key in localEffects) {
var ef = localEffects[key];
if (ef.active && ef.amplified_speed) {
if (ef.amplified_speed >= 28) { level = Math.max(level, 3); reasons.push(ef.desc + ' ' + ef.amplified_speed + 'kn stimati'); }
else if (ef.amplified_speed >= 20) { level = Math.max(level, 2); reasons.push(ef.desc); }
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
var romeHour = getNowRome();
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
    ifs_pressure: null,
    wind_speed_850: h.windspeed_850hPa ? sn(h.windspeed_850hPa[idx]) : null,
    wind_dir_850:   h.winddirection_850hPa ? sn(h.winddirection_850hPa[idx]) : null,
    cape:           h.cape ? sn(h.cape[idx]) : null,
    lifted_index:   h.lifted_index ? sn(h.lifted_index[idx]) : null,
    precip_prob:    h.precipitation_probability ? sn(h.precipitation_probability[idx]) : null,
    weather_code:   h.weather_code ? h.weather_code[idx] : null,
    cloudcover_high: h.cloudcover_high ? sn(h.cloudcover_high[idx]) : null,
    wind_speed_om:  sn(h.windspeed_10m[idx])
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

// Batch GET: recupera N chiavi in una sola richiesta HTTP
async function kvMGet(keys, restUrl, restToken) {
if (!restUrl || !restToken || !keys.length) return keys.map(function(){ return null; });
try {
var cmd = ['MGET'].concat(keys);
var res = await fetch(restUrl, {
method: 'POST',
headers: { 'Authorization': 'Bearer ' + restToken, 'Content-Type': 'application/json' },
body: JSON.stringify(cmd)
});
if (!res.ok) return keys.map(function(){ return null; });
var data = await res.json();
var results = data.result || [];
return results.map(function(r) {
if (r === null || r === undefined) return null;
if (typeof r === 'object') return r;
try { return JSON.parse(r); } catch(e) { return r; }
});
} catch(e) { return keys.map(function(){ return null; }); }
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
wind_speed_obs: data.wind_speed_obs || null,
wind_dir_obs: data.wind_dir_obs || null,
wind_gust_obs: data.wind_gust_obs || null,
pressure_obs: data.pressure_obs || null,
obs_source: data.obs_source || null,
obs_station: data.obs_station || null,
wind_speed_icon: data.icon_wind_speed !== undefined ? data.icon_wind_speed : null,
wind_dir_icon: data.icon_wind_dir !== undefined ? data.icon_wind_dir : null,
wind_gust_icon: data.icon_wind_gust !== undefined ? data.icon_wind_gust : null,
ifs_wind_speed: data.ifs_wind_speed !== undefined ? data.ifs_wind_speed : null,
ifs_wind_dir: data.ifs_wind_dir !== undefined ? data.ifs_wind_dir : null,
ifs_wind_gust: data.ifs_wind_gust !== undefined ? data.ifs_wind_gust : null,
ifs_pressure: data.ifs_pressure !== undefined ? data.ifs_pressure : null
};
// Se esiste gia uno snap CFR in questo slot, preserva vento/dir reali e aggiunge onde/pressione OM
try {
  var existing = await kvGet(key, restUrl, restToken);
  if (existing && existing.obs_source === 'cfr') {
    snapshot.wind_speed    = existing.wind_speed;
    snapshot.wind_dir      = existing.wind_dir;
    snapshot.wind_gust     = existing.wind_gust;
    snapshot.obs_source    = 'cfr';
    snapshot.obs_station   = existing.obs_station;
    snapshot.wind_speed_om = data.wind_speed_om !== undefined ? data.wind_speed_om : data.wind_speed;
    snapshot.wind_dir_om   = data.wind_dir_om   !== undefined ? data.wind_dir_om   : data.wind_dir;
  }
} catch(e) {}
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
var dirs = snapshots.map(function(s) { return s.wind_dir; }).filter(function(d){ return d != null; });
if (dirs.length < 3) return { rotation: null, trend: 'insufficient_data', hours: snapshots.length };

var steps = [];
for (var i = 1; i < dirs.length; i++) {
  var diff = dirs[i] - dirs[i-1];
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  steps.push(diff);
}

// Rotazione netta (somma algebrica -- puo cancellarsi)
var netRotation = steps.reduce(function(a,b){ return a+b; }, 0);
// Percorso totale (somma valori assoluti -- non si cancella mai)
var totalPath = steps.reduce(function(a,b){ return a + Math.abs(b); }, 0);
// Consistenza: quante rotazioni hanno stesso segno della netta
var veeringSteps = steps.filter(function(r){ return r > 0; }).length;
var backingSteps = steps.filter(function(r){ return r < 0; }).length;
var dominantSign = netRotation >= 0 ? 1 : -1;
var consistentSteps = dominantSign > 0 ? veeringSteps : backingSteps;
var isConsistent = steps.length > 0 && consistentSteps >= steps.length * 0.6;

// Classificazione basata su percorso totale (non solo netta)
// Percorso >60deg in 24h e' significativo anche se netta e' piccola
var trend;
var significantPath = totalPath > 60;   // percorso reale importante
var significantNet  = Math.abs(netRotation) > 20; // rotazione netta importante

if (!significantPath && !significantNet) {
  trend = 'stable';
} else if (significantPath && !significantNet) {
  // Grande percorso ma netta piccola = oscillazione o rotazione completa
  trend = 'variable';
} else if (significantNet && netRotation > 0 && isConsistent) {
  trend = 'veering';
} else if (significantNet && netRotation < 0 && isConsistent) {
  trend = 'backing';
} else if (significantPath) {
  trend = 'variable';
} else {
  trend = 'stable';
}

// Fasi: identifica sequenze di backing/veering consecutive
var phases = [];
var currentPhase = null;
steps.forEach(function(step) {
  var sign = step > 2 ? 'veering' : step < -2 ? 'backing' : 'stable';
  if (!currentPhase || currentPhase.type !== sign) {
    if (currentPhase) phases.push(currentPhase);
    currentPhase = { type: sign, total: step, count: 1 };
  } else {
    currentPhase.total += step;
    currentPhase.count++;
  }
});
if (currentPhase) phases.push(currentPhase);

return {
  rotation: Math.round(netRotation),
  total_path: Math.round(totalPath),
  avg_per_hour: Math.round(netRotation / steps.length * 10) / 10,
  trend: trend,
  consistent: isConsistent,
  hours: snapshots.length,
  from_dir: dirs[0],
  to_dir: dirs[dirs.length - 1],
  veering_deg: Math.round(steps.filter(function(s){ return s>0; }).reduce(function(a,b){return a+b;},0)),
  backing_deg: Math.round(steps.filter(function(s){ return s<0; }).reduce(function(a,b){return a+b;},0)),
  phases: phases.filter(function(p){ return p.type !== 'stable' && Math.abs(p.total) > 15; })
};
}

//- CALCOLO ZONA -

async function getSituazioneAccuracy(zoneKey, kvUrl, kvToken) {
  if (!kvUrl || !kvToken) return null;
  try {
    var keys = [];
    var now = new Date();
    for (var h = 0; h < 48; h++) {
      var t = new Date(now.getTime() - h * 3600000);
      var tRome = t.toLocaleString('en-CA', {
        timeZone:'Europe/Rome', year:'numeric', month:'2-digit', day:'2-digit',
        hour:'2-digit', hour12:false
      });
      var tm = tRome.match(/([0-9]{4})-([0-9]{2})-([0-9]{2}), ([0-9]{2})/) ||
               tRome.match(/([0-9]{4})-([0-9]{2})-([0-9]{2}),([0-9]{2})/);
      if (!tm) continue;
      var th = tm[1]+'-'+tm[2]+'-'+tm[3]+'T'+tm[4];
      keys.push('sit_verify:' + zoneKey + ':' + th + ':h6');
      keys.push('sit_verify:' + zoneKey + ':' + th + ':h12');
    }
    var raws = await Promise.all(keys.map(function(k){ return kvGet(k, kvUrl, kvToken); }));
    var results = raws.filter(function(r){ return r !== null; });
    if (results.length === 0) return null;
    var correct = results.filter(function(r){ return r.wind_in_range === true; }).length;
    var total   = results.filter(function(r){ return r.wind_in_range !== null; }).length;
    var errors  = results.filter(function(r){
      return r.actual_wind != null && r.wind_predicted_max != null;
    }).map(function(r){
      return r.actual_wind - ((r.wind_predicted_min + r.wind_predicted_max) / 2);
    });
    var avgError = errors.length ? (errors.reduce(function(a,b){return a+b;},0)/errors.length).toFixed(1) : null;
    return {
      total: results.length,
      correct: correct,
      accuracy_pct: total > 0 ? Math.round(correct/total*100) : null,
      avg_wind_error: avgError,
      giallo_count: results.filter(function(r){ return r.allerta_predicted==='GIALLO'; }).length,
      rosso_count:  results.filter(function(r){ return r.allerta_predicted==='ROSSO';  }).length
    };
  } catch(e) { return null; }
}

async function verifySituazione(zoneKey, currentData, kvUrl, kvToken) {
  if (!kvUrl || !kvToken) return;
  var now = new Date();
  // Verifica schede delle ultime 6h e 12h
  var horizons = [6, 12];
  for (var hi = 0; hi < horizons.length; hi++) {
    var h = horizons[hi];
    var pastTime = new Date(now.getTime() - h * 3600000);
    var pastRomeStr = pastTime.toLocaleString('en-CA', {
      timeZone: 'Europe/Rome', year:'numeric', month:'2-digit', day:'2-digit',
      hour:'2-digit', minute:'2-digit', hour12: false
    });
    var pastRomeM = pastRomeStr.match(/([0-9]{4})-([0-9]{2})-([0-9]{2}), ([0-9]{2}):([0-9]{2})/) ||
                    pastRomeStr.match(/([0-9]{4})-([0-9]{2})-([0-9]{2}),([0-9]{2}):([0-9]{2})/);
    if (!pastRomeM) continue;
    var pastHour = pastRomeM[1]+'-'+pastRomeM[2]+'-'+pastRomeM[3]+'T'+pastRomeM[4];
    // Cerca la scheda salvata in quell'ora
    var sitFound = null;
    var slots = ['00','15','30','45'];
    for (var si = 0; si < slots.length; si++) {
      var sk = 'situazione:' + zoneKey + ':' + pastHour + '-' + slots[si];
      var rec = await kvGet(sk, kvUrl, kvToken);
      if (rec && rec.text) { sitFound = rec; break; }
    }
    if (!sitFound) continue;
    // Evita di sovrascrivere verifica gia esistente
    var verSitKey = 'sit_verify:' + zoneKey + ':' + pastHour + ':h' + h;
    var existing = await kvGet(verSitKey, kvUrl, kvToken);
    if (existing) continue;
    // Estrai previsione vento dalla scheda (cerca pattern Xkn nel testo)
    var windMatch = sitFound.text ? sitFound.text.match(/(\d+)-(\d+)kn|(\d+\.?\d*)kn/) : null;
    var predictedWindMin = null, predictedWindMax = null;
    if (windMatch) {
      if (windMatch[1] && windMatch[2]) {
        predictedWindMin = parseFloat(windMatch[1]);
        predictedWindMax = parseFloat(windMatch[2]);
      } else if (windMatch[3]) {
        predictedWindMin = predictedWindMax = parseFloat(windMatch[3]);
      }
    }
    var verRecord = {
      zone: zoneKey,
      generated_at: sitFound.generated_at,
      horizon_h: h,
      allerta_predicted: sitFound.allerta,
      wind_predicted_min: predictedWindMin,
      wind_predicted_max: predictedWindMax,
      actual_wind: currentData.wind_speed,
      actual_wind_dir: currentData.wind_dir,
      actual_pressure: currentData.pressure,
      actual_wave: currentData.wave_height,
      verified_at: now.toISOString(),
      // Valuta se la previsione era corretta
      wind_in_range: (predictedWindMin !== null && predictedWindMax !== null) ?
        (currentData.wind_speed >= predictedWindMin * 0.7 && currentData.wind_speed <= predictedWindMax * 1.3) : null
    };
    await kvSet(verSitKey, verRecord, 2592000, kvUrl, kvToken); // 30 giorni
  }
}

async function verifyForecasts(zoneKey, currentData, kvUrl, kvToken) {
if (!kvUrl || !kvToken) return;
var now = new Date();
// H+3 incluso -- usa chiave predict: (AI forecast)
var horizons = [3, 6, 12, 24];
for (var hi = 0; hi < horizons.length; hi = hi + 1) {
var h = horizons[hi];
var pastTime = new Date(now.getTime() - h * 3600000);
// Calcola ora corretta Europe/Rome per la chiave
var pastRomeHour = pastTime.toLocaleString('sv-SE', {timeZone:'Europe/Rome'})
  .replace(' ','T').slice(0,13).replace(':','-');
// Prova tutti i 4 slot da 15 minuti dell'ora passata
var forecast = null;
var slots15 = ['00','15','30','45'];
for (var si = 0; si < slots15.length; si++) {
  forecast = await kvGet('predict:' + zoneKey + ':' + pastRomeHour + '-' + slots15[si], kvUrl, kvToken);
  if (forecast) break;
}
if (!forecast) continue;
var predictedWind = forecast['forecast_h' + h];
if (predictedWind == null) continue;
var windError = parseFloat((currentData.wind_speed - predictedWind).toFixed(1));
var verKey = 'verify:' + zoneKey + ':' + pastRomeHour + ':h' + h;
// Evita di sovrascrivere verifiche gia salvate
var existing = await kvGet(verKey, kvUrl, kvToken);
if (existing && existing.actual_wind != null) continue;
var verRecord = {
forecast_time: pastTime.toISOString(),
horizon_h: h,
predicted_wind: predictedWind,
actual_wind: currentData.wind_speed,
actual_wind_dir: currentData.wind_dir || null,
actual_wave: currentData.wave_height,
wind_error: windError,
wave_error: 0
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

// Calcola statistiche bias stazione reale vs OM dai campioni raccolti
async function biasComputeStations(kvUrl, kvToken) {
  var stations = [
    'livorno','canale_piombino','viareggio','capraia_w','portoferraio','alberese','luri',
    'barcaggio','bonifacio_pertusato','vada',
    'gorgona_cfr','capraia_cfr','giglio_porto','giglio_castello','montecristo','portoferraio_cfr',
    'orbetello','svincenzo_porto','casotto_pescatori','venturina','forte_dei_marmi','lido_camaiore',
    'bocca_arno_cfr','follonica','capalbio'
  ];
  var results = {};
  for (var si = 0; si < stations.length; si++) {
    var sid = stations[si];
    try {
      var samples = await kvGet('bias_samples:' + sid, kvUrl, kvToken);
      if (!Array.isArray(samples) || samples.length === 0) { results[sid] = null; continue; }
      var validWind = samples.filter(function(s){ return s.delta && s.delta.wind_kt !== null; });
      // NOTA: gust_kt MNW e' il massimo giornaliero, non raffica istantanea -- escluso dal bias
      var meanDeltaWind = validWind.length > 0
        ? Math.round(validWind.reduce(function(a,s){ return a + s.delta.wind_kt; }, 0) / validWind.length * 10) / 10 : null;
      // Calcola direzione media stazione vs OM (solo campioni con entrambe le direzioni)
      var validDir = validWind.filter(function(s){ return s.delta && s.delta.dir_station !== null && s.delta.dir_om !== null; });
      var meanDirStation = validDir.length > 0 ? Math.round(validDir.reduce(function(a,s){ return a + s.delta.dir_station; }, 0) / validDir.length) : null;
      var meanDirOm = validDir.length > 0 ? Math.round(validDir.reduce(function(a,s){ return a + s.delta.dir_om; }, 0) / validDir.length) : null;
      var stats = {
        n: samples.length,
        n_wind: validWind.length,
        mean_delta_wind: meanDeltaWind,
        mean_dir_station: meanDirStation,
        mean_dir_om: meanDirOm,
        last_updated: new Date().toISOString()
      };
      await kvSet('bias_stats:' + sid, stats, 31536000, kvUrl, kvToken);
      results[sid] = stats;
    } catch(e) { results[sid] = null; }
  }
  return results;
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

// Adiacenze per visione multi-zona
var ZONE_NEIGHBORS = {
  livorno:         ['viareggio', 'capraia', 'elba_nord'],
  viareggio:       ['livorno', 'la_spezia'],
  la_spezia:       ['viareggio', 'livorno'],
  capraia:         ['livorno', 'elba_nord', 'giglio'],
  elba_nord:       ['livorno', 'capraia', 'elba_sud', 'canale_piombino'],
  elba_sud:        ['elba_nord', 'canale_piombino', 'giglio'],
  canale_piombino: ['elba_nord', 'elba_sud', 'punta_ala'],
  punta_ala:       ['canale_piombino', 'giglio'],
  giglio:          ['punta_ala', 'elba_sud', 'capraia']
};

async function getNeighborSnapshots(zoneKey, kvUrl, kvToken) {
  var neighbors = ZONE_NEIGHBORS[zoneKey] || [];
  if (!neighbors.length || !kvUrl || !kvToken) return [];
  // Legge ultimo snapshot di ogni zona vicina
  var now = new Date();
  var results = [];
  for (var ni = 0; ni < neighbors.length; ni++) {
    var nk = neighbors[ni];
    var found = null;
    // Prova le ultime 3 ore
    for (var hi = 0; hi < 3 && !found; hi++) {
      var t = new Date(now.getTime() - hi * 3600000);
      var mins = t.getMinutes() < 30 ? '00' : '30';
      var tRome = t.toLocaleString('en-CA', {
        timeZone:'Europe/Rome', year:'numeric', month:'2-digit', day:'2-digit',
        hour:'2-digit', hour12:false
      });
      var tm = tRome.match(/([0-9]{4})-([0-9]{2})-([0-9]{2}), ([0-9]{2})/) ||
               tRome.match(/([0-9]{4})-([0-9]{2})-([0-9]{2}),([0-9]{2})/);
      if (!tm) continue;
      var th = tm[1]+'-'+tm[2]+'-'+tm[3]+'T'+tm[4];
      var snap = await kvGet('snap:' + nk + ':' + th + '-' + mins, kvUrl, kvToken);
      if (snap) { found = { zone: nk, name: ZONES[nk] ? ZONES[nk].name : nk, snap: snap }; }
    }
    if (found) results.push(found);
  }
  return results;
}

// MeteoNetwork station codes per zona
// MeteoNetwork -- solo stazioni con licenza distribuzione verificata
// Testare con: curl data-realtime/CODICE -- se risponde [{observation_time...}] e ok
var MNW_STATIONS = {
  livorno:         'tsc265',
  canale_piombino: 'tsc228',
  capraia:         'tsc578',
  elba_nord:       'tsc621',
  viareggio:       'tsc508'
  // tsc265 Livorno: licenza revocata 28/04 - API potrebbe rispondere lo stesso
  // tsc508 Viareggio: no licenza
  // tsc587 Giglio: da verificare
};

async function fetchMeteoNetwork(zoneKey, mnwToken) {
  var stationCode = MNW_STATIONS[zoneKey];
  if (!stationCode || !mnwToken) return null;
  try {
    var url = 'https://api.meteonetwork.it/v3/data-realtime/' + stationCode;
    var r = await fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + mnwToken,
        'User-Agent': 'NAUTILUS/1.0 meteomarine-app'
      }
    });
    if (!r.ok) return { _error: 'http_' + r.status };
    var d = await r.json();
    if (!d) return { _error: 'no_data' };
    if (d.error) return { _error: 'api_error:' + JSON.stringify(d.error) }; // stazione senza licenza distribuzione
    // Gestisci tutte le strutture possibili: array, {data:...}, oggetto diretto
    var data = null;
    if (Array.isArray(d) && d.length > 0) data = d[0];
    else if (d.data) data = d.data;
    else if (d.wind_speed !== undefined || d.wind_direction !== undefined) data = d;
    if (!data) return null;
    var windKmh  = data.wind_speed != null ? parseFloat(data.wind_speed) : null;
    var gustKmh  = data.wind_gust  != null ? parseFloat(data.wind_gust)  : null;
    // Log campi direzione disponibili per debug
    // Converte direzione MNW: puo essere gradi numerici o stringa cardinale
    var MNW_DIR_MAP = {
      'N':0,'NNE':22,'NE':45,'ENE':67,'E':90,'ESE':112,'SE':135,'SSE':157,
      'S':180,'SSO':202,'SO':225,'OSO':247,'O':270,'ONO':292,'NO':315,'NNO':337,
      'NNW':337,'NW':315,'WNW':292,'W':270,'WSW':247,'SW':225,'SSW':202,
      'SSE':157,'SE':135,'ESE':112,'ENE':67,'NE':45,'NNE':22
    };
    var dirFields = ['wind_direction_degree','wind_direction','wind_dir','wind_degree','wind_bearing','wind_angle','dir','direction'];
    var windDir = null;
    for (var di = 0; di < dirFields.length; di++) {
      var dval = data[dirFields[di]];
      if (dval != null && dval !== undefined && dval !== '') {
        var dnum = parseFloat(dval);
        if (!isNaN(dnum)) {
          windDir = dnum;
        } else {
          // Stringa cardinale -> gradi
          var dstr = String(dval).trim().toUpperCase();
          windDir = MNW_DIR_MAP[dstr] !== undefined ? MNW_DIR_MAP[dstr] : null;
        }
        break;
      }
    }
    return {
      wind_speed_mnw: windKmh != null ? Math.round(windKmh / 1.852 * 10) / 10 : null,
      wind_dir_mnw:   windDir,
      wind_gust_mnw:  gustKmh != null ? Math.round(gustKmh / 1.852 * 10) / 10 : null,
      pressure_mnw:   data.smlp != null ? parseFloat(data.smlp) : null,
      temp_mnw:       data.temp != null ? parseFloat(data.temp) : null,
      station_mnw:    stationCode,
      ts_mnw:         data.observation_time_local || data.observation_time_utc || data.date || null
    };
  } catch(e) {
    return null;
  }
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

// Fetch MeteoNetwork realtime
var mnwToken = process.env.METEONETWORK_TOKEN || '';
var mnwData = await fetchMeteoNetwork(zoneKey, mnwToken);

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
var snapBase = owmData ? Object.assign({}, currentData, {
wind_speed_obs: owmData.wind_speed_obs,
wind_dir_obs: owmData.wind_dir_obs,
wind_gust_obs: owmData.wind_gust_obs,
pressure_obs: owmData.pressure_obs,
obs_source: owmData.source,
obs_station: owmData.station,
obs_time: owmData.obs_time
}) : currentData;
var snapData = mnwData ? Object.assign({}, snapBase, {
wind_speed_mnw: mnwData.wind_speed_mnw,
wind_dir_mnw:   mnwData.wind_dir_mnw,
wind_gust_mnw:  mnwData.wind_gust_mnw,
pressure_mnw:   mnwData.pressure_mnw,
station_mnw:    mnwData.station_mnw
}) : snapBase;
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
await verifySituazione(zoneKey, currentData, kvUrl, kvToken);
} else {
// Manuale: salva forecast ma NON verifica -- la verifica gira solo nel cron_snap
saveForecast(zoneKey, forecast, currentData, kvUrl, kvToken).catch(function() {});
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
observed: owmData ? Object.assign({}, owmData, {
  wind_speed_mnw: mnwData ? mnwData.wind_speed_mnw : null,
  wind_dir_mnw:   mnwData ? mnwData.wind_dir_mnw   : null,
  wind_gust_mnw:  mnwData ? mnwData.wind_gust_mnw  : null,
  pressure_mnw:   mnwData ? mnwData.pressure_mnw   : null,
  station_mnw:    mnwData ? mnwData.station_mnw     : null
}) : (mnwData ? {
  wind_speed_mnw: mnwData.wind_speed_mnw,
  wind_dir_mnw:   mnwData.wind_dir_mnw,
  wind_gust_mnw:  mnwData.wind_gust_mnw,
  pressure_mnw:   mnwData.pressure_mnw,
  station_mnw:    mnwData.station_mnw
} : null),
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

async function fetchLammaStation(nome) {
  try {
    var lammaUrl = 'https://geoportale.lamma.rete.toscana.it/geoserver/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=lamma_stazioni:vento&outputFormat=application/json&CQL_FILTER=nome=' + encodeURIComponent("'" + nome + "'");
    var res2 = await fetch(lammaUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NAUTILUS/1.0)', 'Accept': 'application/json' } });
    var res2 = await fetch(lammaUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NAUTILUS/1.0)', 'Accept': 'application/json' } });
    console.log('LaMMA ' + nome + ' status=' + res2.status + ' url=' + lammaUrl.slice(-50));
    if (!res2.ok) { console.log('LaMMA ' + nome + ' not ok'); return null; }
    var data2 = await res2.json();
    console.log('LaMMA ' + nome + ' features=' + (data2.features ? data2.features.length : 'null'));
    // Prende tutti i dati disponibili (LaMMA mantiene finestra mobile ~48h)
    var todayF = data2.features || [];
    var speeds = todayF.map(function(f) { return f.properties.vven_ms; }).filter(function(v) { return v != null && v >= 0; });
    if (speeds.length === 0) return null;
    var avgMs = speeds.reduce(function(a, b) { return a + b; }, 0) / speeds.length;
    var maxMs = Math.max.apply(null, speeds);
    var last = todayF[todayF.length - 1].properties;
    return {
      nome: nome,
      avg_kn: Math.round(avgMs * 1.944 * 10) / 10,
      max_kn: Math.round(maxMs * 1.944 * 10) / 10,
      last_kn: Math.round((last.vven_ms || 0) * 1.944 * 10) / 10,
      last_dir: last.dven_gr || null,
      last_time: last.data_ora,
      samples: speeds.length
    };
  } catch(e) { console.error('LaMMA fetch error ' + nome + ': ' + e.message); return null; }
}

async function updateLammaBias(kvUrl, kvToken) {
  console.log('LaMMA bias update start');
  var zoneData = {};
  for (var si = 0; si < LAMMA_STATIONS.length; si++) {
    var st = LAMMA_STATIONS[si];
    var result = await fetchLammaStation(st.nome);
    if (!result) { console.log('LaMMA skip ' + st.nome); continue; }
    if (!zoneData[st.zone]) zoneData[st.zone] = { readings: [], stations: [] };
    zoneData[st.zone].readings.push(result.avg_kn);
    zoneData[st.zone].stations.push(result.nome + '=' + result.avg_kn + 'kn');
    console.log('LaMMA ' + st.nome + ' avg=' + result.avg_kn + 'kn max=' + result.max_kn + 'kn samples=' + result.samples);
  }
  var zones3 = Object.keys(zoneData);
  for (var zi2 = 0; zi2 < zones3.length; zi2++) {
    var zk3 = zones3[zi2];
    var zd3 = zoneData[zk3];
    var lammaAvg3 = zd3.readings.reduce(function(a, b) { return a + b; }, 0) / zd3.readings.length;
    var lammaKey3 = 'lamma:' + zk3 + ':' + new Date().toISOString().slice(0, 10);
    var lammaRecord3 = { date: new Date().toISOString().slice(0, 10), lamma_avg_kn: Math.round(lammaAvg3 * 10) / 10, stations: zd3.stations, samples: zd3.readings.length };
    await fetch(kvUrl + '/set/' + encodeURIComponent(lammaKey3), {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + kvToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: JSON.stringify(lammaRecord3), ex: 2592000 })
    });
    console.log('LaMMA saved ' + zk3 + ': ' + lammaAvg3.toFixed(1) + 'kn');
  }
  console.log('LaMMA bias update done, zones: ' + Object.keys(zoneData).join(','));
  return zoneData;
}

module.exports = async function handler(req, res) {

// Helper: ora corrente in formato Europe/Rome compatibile con OM hourly.time
function getNowRome() {
  var romeStr = new Date().toLocaleString('en-CA', {
    timeZone: 'Europe/Rome', year:'numeric', month:'2-digit', day:'2-digit',
    hour:'2-digit', minute:'2-digit', hour12: false
  });
  var m = romeStr.match(/([0-9]{4})-([0-9]{2})-([0-9]{2}), ([0-9]{2}):([0-9]{2})/) || romeStr.match(/([0-9]{4})-([0-9]{2})-([0-9]{2}),([0-9]{2}):([0-9]{2})/);
  return m ? m[1]+'-'+m[2]+'-'+m[3]+'T'+m[4]+':00' : null;
}

res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
if (req.method === 'OPTIONS') return res.status(204).end();

var action = req.query.action || 'zones';
var zoneKey = req.query.zone || null;
var sgKey = process.env.STORMGLASS_KEY || null;
var kvUrl = process.env.UPSTASH_REDIS_REST_URL || null;
var kvToken = process.env.UPSTASH_REDIS_REST_TOKEN || null;

if (action === 'triple_wind') {
var twZones = (req.query.zones || 'viareggio,bocca_arno,livorno').split(',');
var twResults = await Promise.all(twZones.map(async function(zk) {
  zk = zk.trim();
  var zObj = ZONES[zk];
  if (!zObj) return { zone: zk, ok: false };
  var bs = zObj.bias_station;
  var usedCfr = false;
  // Prova a leggere da bias_samples se la stazione ha fonte CFR
  if (bs) {
    var samples = await kvGet('bias_samples:' + bs, kvUrl, kvToken) || [];
    var latest = samples[0];
    if (latest && latest.station && latest.station.wind_kt !== null &&
        latest.station.source === 'cfr' &&
        (Date.now() - new Date(latest.ts).getTime()) < 2 * 3600 * 1000) {
      return {
        zone: zk, ok: true, source: 'cfr',
        wind_kt: latest.station.wind_kt,
        wind_dir: latest.station.direction,
        wind_gust: latest.station.gust_kt,
        quota: latest.station.quota,
        ts: latest.ts
      };
    }
  }
  // Fallback OM
  var lat = zObj.lat, lon = zObj.lon;
  try {
    var omUrl = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon +
      '&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m&wind_speed_unit=kn&timezone=Europe/Rome';
    var omRes = await fetch(omUrl);
    var omJson = await omRes.json();
    var c = omJson.current || {};
    return {
      zone: zk, ok: true, source: 'om',
      wind_kt: c.wind_speed_10m || null,
      wind_dir: c.wind_direction_10m || null,
      wind_gust: c.wind_gusts_10m || null,
      quota: null,
      ts: new Date().toISOString()
    };
  } catch(e) {
    return { zone: zk, ok: false, source: 'error' };
  }
}));
return res.status(200).json({ ok: true, results: twResults, ts: Date.now() });
}

if (action === 'ping') {
var activeZones = Object.keys(ZONES).filter(function(k){ return ZONES[k].enabled !== false; }).length;
var romeParts2 = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date());
    var rp2 = {}; romeParts2.forEach(function(p) { rp2[p.type] = p.value; });
    var romeNow = rp2.year + '-' + rp2.month + '-' + rp2.day + 'T' + rp2.hour + ':' + rp2.minute;
    return res.status(200).json({ ok: true, engine: 'nautilus-engine', v: '2.13.15', zones: activeZones, ts: Date.now(), rome_now: romeNow, utc_now: new Date().toISOString() });
}

// /api/engine?action=cron - called by cron-job.org every hour for all zones
// /api/engine?action=cron_snap - lightweight cron: fetch OM only + save snapshot
if (action === 'lamma_test') {
  try {
    var testUrl = 'https://geoportale.lamma.rete.toscana.it/geoserver/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=lamma_stazioni:vento&outputFormat=application/json&CQL_FILTER=nome=%27GIGLIO_PORTO%27';
    var testRes = await fetch(testUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NAUTILUS/1.0)', 'Accept': 'application/json' } });
    var testJson = await testRes.json();
    var features = testJson.features || [];
    var speeds = features.map(function(f) { return f.properties.vven_ms; }).filter(function(v) { return v != null && v >= 0; });
    var avgMs = speeds.length > 0 ? speeds.reduce(function(a,b){return a+b;},0)/speeds.length : 0;
    var last = features.length > 0 ? features[features.length-1].properties : null;
    return res.status(200).json({
      ok: true,
      status: testRes.status,
      total_features: features.length,
      valid_speeds: speeds.length,
      avg_kn: Math.round(avgMs * 1.944 * 10) / 10,
      last_vven_ms: last ? last.vven_ms : null,
      last_time: last ? last.data_ora : null,
      first_time: features.length > 0 ? features[0].properties.data_ora : null
    });
  } catch(e) {
    return res.status(200).json({ ok: false, error: e.message });
  }
}


// /api/engine?action=scrape_web&station=viareggio|bocca_arno&k=mdi
// Scraping pagine pubbliche MeteoNetwork per stazioni senza licenza API
// /api/engine?action=station_refresh&station=X -- pubblico, rate limit 60s per stazione
if (action === 'station_refresh') {
  try {
    var srStation = req.query.station || null;
    if (!srStation) return res.status(400).json({ error: 'station mancante' });

    // Rate limit: max 1 refresh ogni 60s per stazione
    var srRlKey = 'rl:station_refresh:' + srStation;
    var srRl = kvUrl ? await kvGet(srRlKey, kvUrl, kvToken) : null;
    if (srRl) return res.status(429).json({ error: 'Rate limit: riprova tra 60s' });

    var srDirMap = { 'N':0,'NNE':22,'NE':45,'ENE':67,'E':90,'ESE':112,'SE':135,'SSE':157,'S':180,'SSW':202,'SW':225,'WSW':247,'W':270,'WNW':292,'NW':315,'NNW':337 };
    var srTs = new Date().toISOString();
    var srResult = null;

    // Tutte le stazioni con lat/lon per fetch OM
    var srAllStations = {
      livorno:         { lat: 43.465, lon: 10.347, api: true,  sid: 'tsc265', quota: 244 },
      canale_piombino: { lat: 42.920, lon: 10.530, api: true,  sid: 'tsc228', quota: 8   },
      viareggio:       { lat: 43.870, lon: 10.230, api: false, url: 'https://www.meteonetwork.eu/it/weather-station/tsc508-stazione-meteorologica-di-viareggio-lungomare' },
      livorno_cfr:     { lat: 43.546, lon: 10.300, api: false, cfr: 'TOS01005981' },
      viareggio_cfr:   { lat: 43.875, lon: 10.236, api: false, cfr: 'TOS03000481' },
      populonia_cfr:   { lat: 42.992, lon: 10.640, api: false, cfr: 'TOS03002300' },
      bocca_arno:      { lat: 43.680, lon: 10.270, api: false, url: 'https://www.meteonetwork.eu/it/weather-station/tsc431-stazione-meteorologica-di-bocca-darno' },
      capraia_w:       { lat: 43.053, lon: 9.838,  api: false, url: 'https://www.meteonetwork.eu/it/weather-station/tsc578-stazione-meteorologica-di-capraia-isola' },
      populonia:       { lat: 42.992, lon: 10.640, api: false, url: 'https://www.meteonetwork.eu/it/weather-station/tsc539-stazione-meteorologica-di-populonia' },
      portoferraio:    { lat: 42.813, lon: 10.368, api: false, url: 'https://www.meteonetwork.eu/it/weather-station/tsc621-stazione-meteorologica-di-portoferraio' },
      alberese:        { lat: 42.671, lon: 11.107, api: false, url: 'https://www.meteonetwork.eu/it/weather-station/tsc712-stazione-meteorologica-di-alberese' },
      luri:            { lat: 42.982, lon: 9.389,  api: false, url: 'https://www.meteonetwork.eu/it/weather-station/fr0370-stazione-meteorologica-di-luri' },
      // CFR Toscana - fetch pagina monitoraggio
      gorgona_cfr:       { lat: 43.433, lon: 9.883,  api: false, cfr: 'TOS11000107' },
      capraia_cfr:       { lat: 43.050, lon: 9.838,  api: false, cfr: 'TOS03003145' },
      giglio_porto:      { lat: 42.363, lon: 10.910, api: false, cfr: 'TOS03006000' },
      giglio_castello:   { lat: 42.364, lon: 10.920, api: false, cfr: 'TOS03003269' },
      montecristo:       { lat: 42.335, lon: 10.311, api: false, cfr: 'TOS03003267' },
      portoferraio_cfr:  { lat: 42.816, lon: 10.328, api: false, cfr: 'TOS11000012' },
      orbetello:         { lat: 42.441, lon: 11.216, api: false, cfr: 'TOS11000508' },
      svincenzo_porto:   { lat: 43.098, lon: 10.537, api: false, cfr: 'TOS03002283' },
      casotto_pescatori: { lat: 42.637, lon: 11.090, api: false, cfr: 'TOS11000013' },
      venturina:         { lat: 42.985, lon: 10.620, api: false, cfr: 'TOS11000004' },
      forte_dei_marmi:   { lat: 43.963, lon: 10.174, api: false, cfr: 'TOS02004055' },
      lido_camaiore:     { lat: 43.871, lon: 10.262, api: false, cfr: 'TOS11000011' },
      bocca_arno_cfr:    { lat: 43.680, lon: 10.270, api: false, cfr: 'TOS01005251' },
      follonica:         { lat: 42.919, lon: 10.765, api: false, cfr: 'TOS03002459' },
      capalbio:          { lat: 42.459, lon: 11.269, api: false, cfr: 'TOS11000006' },
    };
    var srSt = srAllStations[srStation];
    if (!srSt) return res.status(404).json({ error: 'Stazione non trovata: ' + srStation });

    // Fetch OM per delta (stesso formato scrape_web/scrape_stations)
    var srOmUrl = 'https://api.open-meteo.com/v1/forecast?latitude=' + srSt.lat + '&longitude=' + srSt.lon + '&current=wind_speed_10m,wind_gusts_10m,wind_direction_10m,surface_pressure&wind_speed_unit=kn';
    var srOmJson = null;
    try {
      var srOmRes = await fetch(srOmUrl);
      if (srOmRes.ok) srOmJson = await srOmRes.json();
    } catch(e) { srOmJson = null; }
    var srOm = {
      wind_kt:     srOmJson && srOmJson.current ? Math.round(srOmJson.current.wind_speed_10m  * 10) / 10 : null,
      gust_kt:     srOmJson && srOmJson.current ? Math.round(srOmJson.current.wind_gusts_10m  * 10) / 10 : null,
      direction:   srOmJson && srOmJson.current ? srOmJson.current.wind_direction_10m : null,
      pressure_mb: srOmJson && srOmJson.current ? Math.round(srOmJson.current.surface_pressure * 10) / 10 : null
    };

    var srStation_data = null;
    if (srSt.api) {
      // MNW API
      var mnwToken = process.env.METEONETWORK_TOKEN || null;
      if (!mnwToken) return res.status(500).json({ error: 'METEONETWORK_TOKEN mancante' });
      var mnwRes2 = await fetch('https://api.meteonetwork.it/public/stazione/' + srSt.sid + '/misure', { headers: { 'Authorization': 'Bearer ' + mnwToken } });
      var mnwData2 = await mnwRes2.json();
      if (mnwData2 && mnwData2.wind_speed_ms !== undefined && mnwData2.wind_speed_ms !== null) {
        var srWKt = Math.round(mnwData2.wind_speed_ms * 1.94384 * 10) / 10;
        var srGKt = mnwData2.wind_gust_ms ? Math.round(mnwData2.wind_gust_ms * 1.94384 * 10) / 10 : null;
        srStation_data = { wind_kt: srWKt, gust_kt: srGKt, direction: mnwData2.wind_direction_degree || null, direction_txt: null, pressure_mb: mnwData2.pressure || null, source: 'mnw_api' };
      }
    } else if (srSt.cfr) {
      // CFR Toscana - fetch pagina monitoraggio e parsa stazione specifica
      var srCfrHtml = await fetch('https://www.cfr.toscana.it/monitoraggio/stazioni.php?type=anemo', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': 'text/html', 'Cache-Control': 'no-cache' },
        signal: AbortSignal.timeout ? AbortSignal.timeout(12000) : undefined
      }).then(function(r){ return r.text(); });
      var srCfrRe = new RegExp('new Array\\("' + srSt.cfr + '","([^"]+)","([A-Z]{2})","([^"]*)","([^"]*)","(\\d+)","([\\d.]+)","([\\d.]+)","(\\d+)","([\\d.]+)"');
      var srCfrM = srCfrHtml.match(srCfrRe);
      if (srCfrM) {
        var srCfrKt = Math.round(parseFloat(srCfrM[6]) * 1.94384 * 10) / 10;
        var srCfrGKt = Math.round(parseFloat(srCfrM[7]) * 1.94384 * 10) / 10;
        srStation_data = { wind_kt: srCfrKt, gust_kt: srCfrGKt, direction: parseInt(srCfrM[8]), direction_txt: null, pressure_mb: null, source: 'cfr' };
      }
    } else {
      var srHtml = await fetch(srSt.url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': 'text/html' }, signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined }).then(function(r){ return r.text(); });
      var srMatch = srHtml.match(/Vento\s*<br>\s*([\d.]+)\s*km\/h\s*\(([^)]+)\)/i);
      if (srMatch) {
        var srKn = Math.round(parseFloat(srMatch[1]) / 1.852 * 10) / 10;
        var srDirTxt = srMatch[2].trim();
        var srDir = srDirMap[srDirTxt] !== undefined ? srDirMap[srDirTxt] : null;
        srStation_data = { wind_kt: srKn, direction: srDir, direction_txt: srDirTxt, pressure_mb: null, source: 'mnw_web' };
      }
    }

    // Costruisce sample nel formato identico a scrape_web/scrape_stations
    var srSample = {
      ts: srTs,
      station: srStation_data,
      om: srOm,
      delta: srStation_data && srStation_data.wind_kt !== null && srOm.wind_kt !== null ? {
        wind_kt: Math.round((srStation_data.wind_kt - srOm.wind_kt) * 10) / 10,
        dir_station: srStation_data.direction || null,
        dir_om: srOm.direction || null
      } : null
    };

    // Salva in Redis (prepend, max 100 campioni) -- stesso formato di scrape_web
    if (kvUrl) {
      var srKey = 'bias_samples:' + srStation;
      var srExisting = await kvGet(srKey, kvUrl, kvToken);
      var srList = Array.isArray(srExisting) ? srExisting : [];
      srList.unshift(srSample);
      if (srList.length > 100) srList.length = 100;
      await kvSet(srKey, srList, 31536000, kvUrl, kvToken);
    }

    // Salva rate limit (60s TTL)
    if (kvUrl) await kvSet(srRlKey, JSON.stringify({ ttl: 60 }), kvUrl, kvToken, 60);

    srResult = {
      station: srStation,
      wind_kt: srStation_data ? srStation_data.wind_kt : null,
      dir_deg: srStation_data ? srStation_data.direction : null,
      dir_txt: srStation_data ? srStation_data.direction_txt : null,
      pressure_mb: srStation_data ? srStation_data.pressure_mb : null,
      timestamp: srTs
    };
    return res.status(200).json({ ok: true, data: srResult });
  } catch(e) { return res.status(500).json({ error: e.message }); }
}

// /api/engine?action=scrape_cfr&k=mdi|secret=CRON_SECRET -- scraping CFR Toscana anemometria
if (action === 'scrape_cfr') {
  var scfKey = req.query.k || '';
  var scfSec = req.query.secret || '';
  var cronSecret = process.env.CRON_SECRET || null;
  if (scfKey !== 'mdi' && (!cronSecret || scfSec !== cronSecret)) return res.status(401).json({ error: 'Unauthorized' });
  try {
    // CFR stazioni di interesse con coordinate WGS84
    var CFR_STATIONS = [
      { id:'gorgona_cfr',       cfr:'TOS11000107', name:'Gorgona',           lat:43.433, lon:9.883,  quota:230 },
      { id:'capraia_cfr',       cfr:'TOS03003145', name:'Capraia Isola',     lat:43.050, lon:9.838,  quota:274 },
      { id:'giglio_porto',      cfr:'TOS03006000', name:'Giglio Porto',      lat:42.363, lon:10.910, quota:0   },
      { id:'giglio_castello',   cfr:'TOS03003269', name:'Giglio Castello',   lat:42.364, lon:10.902, quota:470 },
      { id:'montecristo',       cfr:'TOS03003267', name:'Montecristo',       lat:42.335, lon:10.311, quota:85  },
      { id:'portoferraio_cfr',  cfr:'TOS11000012', name:'Portoferraio CFR',  lat:42.816, lon:10.328, quota:10  },
      { id:'orbetello',         cfr:'TOS11000508', name:'Orbetello',         lat:42.441, lon:11.216, quota:0   },
      { id:'svincenzo_porto',   cfr:'TOS03002283', name:'S.Vincenzo Porto',  lat:43.098, lon:10.537, quota:1   },
      { id:'casotto_pescatori', cfr:'TOS11000013', name:'Foce Ombrone',       lat:42.637, lon:11.090, quota:2   },
      { id:'venturina',         cfr:'TOS11000004', name:'Venturina',         lat:42.985, lon:10.620, quota:8   },
      { id:'forte_dei_marmi',   cfr:'TOS02004055', name:'Forte dei Marmi',   lat:43.963, lon:10.174, quota:0   },
      { id:'lido_camaiore',     cfr:'TOS11000011', name:'Lido di Camaiore',  lat:43.871, lon:10.262, quota:1   },
      { id:'livorno_cfr',       cfr:'TOS01005981', name:'Livorno Mareografo', lat:43.546, lon:10.300, quota:2   },
      { id:'bocca_arno_cfr',    cfr:'TOS01005251', name:'Bocca d Arno CFR',  lat:43.680, lon:10.270, quota:1   },
      { id:'viareggio_cfr',     cfr:'TOS03000481', name:'Viareggio CFR',     lat:43.870, lon:10.230, quota:2   },
      { id:'populonia_cfr',     cfr:'TOS03002300', name:'Populonia CFR',     lat:42.992, lon:10.640, quota:164 },
      { id:'follonica',         cfr:'TOS03002459', name:'Follonica',          lat:42.919, lon:10.765, quota:15  },
      { id:'capalbio',          cfr:'TOS11000006', name:'Capalbio',           lat:42.459, lon:11.269, quota:12  },
    ];

    // Fetch pagina CFR
    var scfHtml = await fetch('https://www.cfr.toscana.it/monitoraggio/stazioni.php?type=anemo', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': 'text/html', 'Cache-Control': 'no-cache' },
      signal: AbortSignal.timeout ? AbortSignal.timeout(12000) : undefined
    }).then(function(r){ return r.text(); });

    // Parsa array dati completi (>10 campi per entry)
    var scfRe = /new Array\("(TOS\d+)","([^"]+)","([A-Z]{2})","([^"]*)","([^"]*)","(\d+)","([\d.]+)","([\d.]+)","(\d+)","([\d.]+)"([^)]*)\)/g;
    var scfParsed = {};
    var scfM;
    while ((scfM = scfRe.exec(scfHtml)) !== null) {
      if (!scfParsed[scfM[1]]) {
        scfParsed[scfM[1]] = {
          wind_ms: parseFloat(scfM[7]),
          wind_kt: Math.round(parseFloat(scfM[7]) * 1.94384 * 10) / 10,
          gust_ms: parseFloat(scfM[8]),
          gust_kt: Math.round(parseFloat(scfM[8]) * 1.94384 * 10) / 10,
          dir_deg: parseInt(scfM[9]),
          time_cfr: scfM[10]
        };
      }
    }

    var scfTs = new Date().toISOString();

    // Filtra stazioni con dati validi
    var scfValid = CFR_STATIONS.filter(function(st) {
      return scfParsed[st.cfr] && scfParsed[st.cfr].wind_kt !== null;
    });

    // Fetch OM per tutte le stazioni in PARALLELO
    var scfOmPromises = scfValid.map(function(st) {
      var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + st.lat + '&longitude=' + st.lon + '&current=wind_speed_10m,wind_gusts_10m,wind_direction_10m,surface_pressure&wind_speed_unit=kn&elevation=' + (st.quota != null ? st.quota : 0);
      return fetch(url).then(function(r){ return r.json(); }).catch(function(){ return null; });
    });
    var scfOmResults = await Promise.all(scfOmPromises);

    // Fetch AROME (via Open-Meteo /v1/meteofrance) in PARALLELO, per confronto MAE vs OM (v2 - 16 giugno)
    // Nota: AROME France ha forecast max 2gg, qui usiamo solo il blocco 'current' tramite forecast_hours=1
    // elevation=quota stazione reale: aiuta Open-Meteo a scegliere la cella di griglia piu rappresentativa
    // (es. Capraia 274m, Giglio Castello 470m - senza questo, il default usa l'elevazione media della cella)
    var scfAromePromises = scfValid.map(function(st) {
      var url = 'https://api.open-meteo.com/v1/meteofrance?latitude=' + st.lat + '&longitude=' + st.lon + '&hourly=wind_speed_10m,wind_gusts_10m,wind_direction_10m&wind_speed_unit=kn&models=arome_france&forecast_days=1&elevation=' + (st.quota != null ? st.quota : 0);
      return fetch(url).then(function(r){ return r.json(); }).catch(function(){ return null; });
    });
    var scfAromeResults = await Promise.all(scfAromePromises);

    // Estrae il valore AROME piu vicino all'ora corrente dal blocco hourly (current non disponibile su questo endpoint)
    function scfAromeNearestNow(aJ) {
      if (!aJ || !aJ.hourly || !Array.isArray(aJ.hourly.time)) return { wind_kt: null, gust_kt: null, direction: null };
      var nowMs = Date.now();
      var bestIdx = -1, bestDiff = Infinity;
      for (var i = 0; i < aJ.hourly.time.length; i++) {
        var diff = Math.abs(new Date(aJ.hourly.time[i] + 'Z').getTime() - nowMs);
        if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
      }
      if (bestIdx === -1) return { wind_kt: null, gust_kt: null, direction: null };
      var w = aJ.hourly.wind_speed_10m ? aJ.hourly.wind_speed_10m[bestIdx] : null;
      var g = aJ.hourly.wind_gusts_10m ? aJ.hourly.wind_gusts_10m[bestIdx] : null;
      var d = aJ.hourly.wind_direction_10m ? aJ.hourly.wind_direction_10m[bestIdx] : null;
      return {
        wind_kt: (w !== null && w !== undefined) ? Math.round(w * 10) / 10 : null,
        gust_kt: (g !== null && g !== undefined) ? Math.round(g * 10) / 10 : null,
        direction: (d !== null && d !== undefined) ? Math.round(d) : null
      };
    }

    // 1) Salva prima tutti gli snapshot di zona (priorita alta, operazioni semplici)
    var CFR_TO_ZONE = {
      bocca_arno_cfr:'bocca_arno', giglio_porto:'giglio', montecristo:'montecristo',
      orbetello:'orbetello', svincenzo_porto:'svincenzo', follonica:'follonica',
      capalbio:'capalbio', alberese:'alberese', forte_dei_marmi:'forte_marmi',
      casotto_pescatori:'casotto_gr', venturina:'venturina',
      gorgona_cfr:'gorgona', capraia_cfr:'capraia', portoferraio_cfr:'elba_nord',
      livorno_cfr:'livorno', viareggio_cfr:'viareggio', populonia_cfr:'canale_piombino'
    };
    var snapSavePromises = scfValid.map(function(st, idx) {
      var scfData = scfParsed[st.cfr];
      var omJ = scfOmResults[idx];
      var scfOm = omJ && omJ.current ? {
        wind_kt: Math.round(omJ.current.wind_speed_10m  * 10) / 10,
        gust_kt: Math.round(omJ.current.wind_gusts_10m  * 10) / 10,
        direction: omJ.current.wind_direction_10m,
        pressure_mb: Math.round(omJ.current.surface_pressure * 10) / 10
      } : { wind_kt: null, gust_kt: null, direction: null, pressure_mb: null };
      var mappedZone = CFR_TO_ZONE[st.id];
      if (!mappedZone || scfOm.wind_kt === null) return Promise.resolve();
      var scfNow2 = new Date(scfTs);
      var scfMins2 = scfNow2.getMinutes() < 30 ? '00' : '30';
      var scfSlotKey2 = 'snap:' + mappedZone + ':' + scfNow2.toISOString().slice(0,13) + '-' + scfMins2;
      var scfSnap2 = {
        ts: scfTs, wind_speed: scfData.wind_kt, wind_dir: scfData.dir_deg, wind_gust: scfData.gust_kt,
        pressure: scfOm.pressure_mb, wave_height: null, wave_period: null, wave_direction: null,
        wind_speed_850: null, wind_dir_850: null, ifs_wind_speed: null, ifs_wind_dir: null,
        wind_speed_om: scfOm.wind_kt, wind_dir_om: scfOm.direction,
        obs_source: 'cfr', obs_station: st.id, obs_quota: st.quota || null
      };
      return kvSet(scfSlotKey2, scfSnap2, 86400 * 3, kvUrl, kvToken).catch(function(){});
    });
    await Promise.all(snapSavePromises);

    // 2) Costruisce samples e salva in Redis (bias_samples, secondaria)
    var scfSavePromises = scfValid.map(function(st, idx) {
      var scfData = scfParsed[st.cfr];
      var omJ = scfOmResults[idx];
      var scfOm = omJ && omJ.current ? {
        wind_kt: Math.round(omJ.current.wind_speed_10m  * 10) / 10,
        gust_kt: Math.round(omJ.current.wind_gusts_10m  * 10) / 10,
        direction: omJ.current.wind_direction_10m,
        pressure_mb: Math.round(omJ.current.surface_pressure * 10) / 10
      } : { wind_kt: null, gust_kt: null, direction: null, pressure_mb: null };
      var scfArome = scfAromeNearestNow(scfAromeResults[idx]);
      var scfSample = {
        ts: scfTs,
        station: { wind_kt: scfData.wind_kt, gust_kt: scfData.gust_kt, direction: scfData.dir_deg, direction_txt: null, pressure_mb: null, source: 'cfr', quota: st.quota || null },
        om: scfOm,
        arome: scfArome,
        delta: scfOm.wind_kt !== null ? { wind_kt: Math.round((scfData.wind_kt - scfOm.wind_kt) * 10) / 10, dir_station: scfData.dir_deg, dir_om: scfOm.direction } : null,
        delta_arome: scfArome.wind_kt !== null ? { wind_kt: Math.round((scfData.wind_kt - scfArome.wind_kt) * 10) / 10, dir_station: scfData.dir_deg, dir_arome: scfArome.direction } : null
      };
      var scfKey2 = 'bias_samples:' + st.id;
      return kvGet(scfKey2, kvUrl, kvToken).then(function(existing) {
        var list = Array.isArray(existing) ? existing : [];
        list.unshift(scfSample);
        if (list.length > 100) list.length = 100;
        return kvSet(scfKey2, list, 31536000, kvUrl, kvToken).then(function() {
          return { id: st.id, name: st.name, ok: true, wind_kt: scfData.wind_kt, dir: scfData.dir_deg, delta: scfSample.delta };
        });
      }).catch(function(e) {
        return { id: st.id, name: st.name, ok: false, error: e.message };
      });
    });
    // Stazioni senza dati
    var scfNoData = CFR_STATIONS.filter(function(st) {
      return !scfParsed[st.cfr] || scfParsed[st.cfr].wind_kt === null;
    }).map(function(st) { return { id: st.id, name: st.name, ok: false, error: 'no_data' }; });

    var scfResults = await Promise.all(scfSavePromises);
    scfResults = scfResults.concat(scfNoData);

    return res.status(200).json({ ts: scfTs, parsed: Object.keys(scfParsed).length, results: scfResults });
  } catch(e) { return res.status(500).json({ error: e.message }); }
}

if (action === 'scrape_web') {
  try {
    var swAdminKey = req.query.k || '';
    var swSec = req.query.secret || '';
    var swCronSecret = process.env.CRON_SECRET || null;
    if (swAdminKey !== 'mdi' && (!swCronSecret || swSec !== swCronSecret)) return res.status(401).json({ error: 'Unauthorized' });
    var swStations = [
      { id: 'viareggio',    name: 'Viareggio',      url: 'https://www.meteonetwork.eu/it/weather-station/tsc508-stazione-meteorologica-di-viareggio-lungomare', lat: 43.870, lon: 10.230 },
      { id: 'bocca_arno',   name: 'Bocca d Arno',   url: 'https://www.meteonetwork.eu/it/weather-station/tsc431-stazione-meteorologica-di-bocca-darno',          lat: 43.680, lon: 10.270 },
      { id: 'capraia_w',    name: 'Capraia Monte',  url: 'https://www.meteonetwork.eu/it/weather-station/tsc578-stazione-meteorologica-di-capraia-isola',         lat: 43.053, lon: 9.838  },
      { id: 'populonia',    name: 'Populonia',       url: 'https://www.meteonetwork.eu/it/weather-station/tsc539-stazione-meteorologica-di-populonia',             lat: 42.992, lon: 10.640 },
      { id: 'portoferraio', name: 'Portoferraio',    url: 'https://www.meteonetwork.eu/it/weather-station/tsc621-stazione-meteorologica-di-portoferraio',          lat: 42.813, lon: 10.368 },
      { id: 'alberese',     name: 'Alberese',        url: 'https://www.meteonetwork.eu/it/weather-station/tsc712-stazione-meteorologica-di-alberese',              lat: 42.671, lon: 11.107 },
      { id: 'luri',         name: 'Luri (Corsica)',  url: 'https://www.meteonetwork.eu/it/weather-station/fr0370-stazione-meteorologica-di-luri',                  lat: 42.982, lon: 9.389  },
      { id: 'barcaggio',          name: 'Barcaggio (Corsica)',        url: 'https://www.windfinder.com/windstatistics/barcaggio_corse', lat: 43.0058, lon: 9.4045, parser: 'windfinder' },
      { id: 'bonifacio_pertusato', name: 'Bonifacio - Cap Pertusato', url: 'https://www.windfinder.com/windstatistics/bonifacio',        lat: 41.3739, lon: 9.1783, parser: 'windfinder' }
    ];
    var swFilter = req.query.station || null;
    if (swFilter) swStations = swStations.filter(function(s){ return s.id === swFilter; });
    var swTs = new Date().toISOString();
    var swResults = [];
    for (var swI = 0; swI < swStations.length; swI++) {
      var swSt = swStations[swI];
      try {
        var swHtml = await fetch(swSt.url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': 'text/html' } }).then(function(r){ return r.text(); });
        var swKmh, swDirTxt, swKn, swDir;
        if (swSt.parser === 'windfinder') {
          // Formato Windfinder: "X kts" seguito da direzione testuale inglese (es. "Northwest", "North-Northeast")
          // NOTA: regex da verificare/affinare al primo test in produzione - markup HTML reale non ispezionabile da qui
          var swWfMatch = swHtml.match(/([\d.]+)\s*kts?[\s\S]{0,80}?(North-?North-?East|North-?North-?West|South-?South-?East|South-?South-?West|East-?North-?East|East-?South-?East|West-?North-?West|West-?South-?West|North-?East|North-?West|South-?East|South-?West|North|South|East|West)/i);
          swKn = swWfMatch ? parseFloat(swWfMatch[1]) : null;
          swDirTxt = swWfMatch ? swWfMatch[2].trim() : null;
          swKmh = null; // gia' in nodi, non serve conversione
          var swWfDirMap = {
            'north':0,'north-northeast':22,'northeast':45,'east-northeast':67,'east':90,'east-southeast':112,'southeast':135,'south-southeast':157,
            'south':180,'south-southwest':202,'southwest':225,'west-southwest':247,'west':270,'west-northwest':292,'northwest':315,'north-northwest':337
          };
          var swDirKey = swDirTxt ? swDirTxt.toLowerCase().replace(/\s+/g,'') : null;
          swDir = (swDirKey && swWfDirMap[swDirKey] !== undefined) ? swWfDirMap[swDirKey] : null;
        } else {
          // Pattern: Vento <br> 3.2 km/h (SSW)
          var swMatch = swHtml.match(/Vento\s*<br>\s*([\d.]+)\s*km\/h\s*\(([^)]+)\)/i);
          swKmh = swMatch ? parseFloat(swMatch[1]) : null;
          swDirTxt = swMatch ? swMatch[2].trim() : null;
          swKn = swKmh !== null ? Math.round(swKmh / 1.852 * 10) / 10 : null;
          // Converti direzione testuale in gradi
          var swDirMap = { 'N':0,'NNE':22,'NE':45,'ENE':67,'E':90,'ESE':112,'SE':135,'SSE':157,'S':180,'SSW':202,'SW':225,'WSW':247,'W':270,'WNW':292,'NW':315,'NNW':337 };
          swDir = (swDirTxt && swDirMap[swDirTxt] !== undefined) ? swDirMap[swDirTxt] : null;
        }
        // Fetch OM per stessa posizione
        var swOmUrl = 'https://api.open-meteo.com/v1/forecast?latitude=' + swSt.lat + '&longitude=' + swSt.lon + '&current=wind_speed_10m,wind_gusts_10m,wind_direction_10m,surface_pressure&wind_speed_unit=kn';
        var swOmJson = await fetch(swOmUrl).then(function(r){ return r.json(); });
        var swOm = {
          wind_kt:     swOmJson.current ? Math.round(swOmJson.current.wind_speed_10m  * 10) / 10 : null,
          gust_kt:     swOmJson.current ? Math.round(swOmJson.current.wind_gusts_10m  * 10) / 10 : null,
          direction:   swOmJson.current ? swOmJson.current.wind_direction_10m : null,
          pressure_mb: swOmJson.current ? Math.round(swOmJson.current.surface_pressure * 10) / 10 : null
        };
        // AROME (via Open-Meteo /v1/meteofrance), per confronto MAE vs OM (v2 - 16 giugno)
        var swAromeUrl = 'https://api.open-meteo.com/v1/meteofrance?latitude=' + swSt.lat + '&longitude=' + swSt.lon + '&hourly=wind_speed_10m,wind_gusts_10m,wind_direction_10m&wind_speed_unit=kn&models=arome_france&forecast_days=1';
        var swArome = { wind_kt: null, gust_kt: null, direction: null };
        try {
          var swAromeJson = await fetch(swAromeUrl).then(function(r){ return r.json(); });
          if (swAromeJson && swAromeJson.hourly && Array.isArray(swAromeJson.hourly.time)) {
            var swNowMs = Date.now();
            var swBestIdx = -1, swBestDiff = Infinity;
            for (var swJ = 0; swJ < swAromeJson.hourly.time.length; swJ++) {
              var swDiff = Math.abs(new Date(swAromeJson.hourly.time[swJ] + 'Z').getTime() - swNowMs);
              if (swDiff < swBestDiff) { swBestDiff = swDiff; swBestIdx = swJ; }
            }
            if (swBestIdx !== -1) {
              var swW = swAromeJson.hourly.wind_speed_10m ? swAromeJson.hourly.wind_speed_10m[swBestIdx] : null;
              var swG = swAromeJson.hourly.wind_gusts_10m ? swAromeJson.hourly.wind_gusts_10m[swBestIdx] : null;
              var swD = swAromeJson.hourly.wind_direction_10m ? swAromeJson.hourly.wind_direction_10m[swBestIdx] : null;
              swArome = {
                wind_kt: (swW !== null && swW !== undefined) ? Math.round(swW * 10) / 10 : null,
                gust_kt: (swG !== null && swG !== undefined) ? Math.round(swG * 10) / 10 : null,
                direction: (swD !== null && swD !== undefined) ? Math.round(swD) : null
              };
            }
          }
        } catch(swAromeE) {}
        var swStation = { wind_kt: swKn, direction: swDir, direction_txt: swDirTxt, source: 'mnw_web' };
        var swSample = {
          ts: swTs,
          station: swKn !== null ? swStation : null,
          om: swOm,
          arome: swArome,
          delta: swKn !== null ? {
            wind_kt: swOm.wind_kt !== null ? Math.round((swKn - swOm.wind_kt) * 10) / 10 : null
          } : null,
          delta_arome: swKn !== null ? {
            wind_kt: swArome.wind_kt !== null ? Math.round((swKn - swArome.wind_kt) * 10) / 10 : null
          } : null
        };
        // Salva in Redis
        var swKey = 'bias_samples:' + swSt.id;
        var swExisting = await kvGet(swKey, kvUrl, kvToken);
        var swList = Array.isArray(swExisting) ? swExisting : [];
        swList.unshift(swSample);
        if (swList.length > 100) swList.length = 100;
        await kvSet(swKey, swList, 31536000, kvUrl, kvToken);
        swResults.push({ id: swSt.id, name: swSt.name, ok: swKn !== null, sample: swSample });
      } catch(swE) {
        swResults.push({ id: swSt.id, name: swSt.name, ok: false, error: swE.message });
      }
    }
    // Ricalcola stats per stazioni web
    var swStats = {};
    for (var swSi = 0; swSi < swStations.length; swSi++) {
      var swSid = swStations[swSi].id;
      var swSamples = await kvGet('bias_samples:' + swSid, kvUrl, kvToken);
      if (!Array.isArray(swSamples)) { swStats[swSid] = null; continue; }
      var swValid = swSamples.filter(function(s){ return s.delta && s.delta.wind_kt !== null; });
      swStats[swSid] = swValid.length > 0 ? {
        n_wind: swValid.length,
        mean_delta_wind: Math.round(swValid.reduce(function(a,s){ return a + s.delta.wind_kt; }, 0) / swValid.length * 10) / 10
      } : null;
    }
    return res.status(200).json({ ts: swTs, results: swResults, stats: swStats });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

// action=scrape_lamma&k=mdi -- fetch realtime stazioni LaMMA (es. Vada) via WFS, confronto OM+AROME, salva bias_samples
// Diverso da runLammaBiasCron (che fa la media giornaliera e scrive lamma_bias:zona) - questo e' il pattern puntuale standard
if (action === 'scrape_lamma') {
  try {
    var slAdminKey = req.query.k || '';
    var slSec = req.query.secret || '';
    var slCronSecret = process.env.CRON_SECRET || null;
    if (slAdminKey !== 'mdi' && (!slCronSecret || slSec !== slCronSecret)) return res.status(401).json({ error: 'Unauthorized' });
    var slStations = [
      { id: 'vada', name: 'Vada (LaMMA)', wfsNome: 'VADA', lat: 43.3550, lon: 10.4280 }
    ];
    var slFilter = req.query.station || null;
    if (slFilter) slStations = slStations.filter(function(s){ return s.id === slFilter; });
    var slTs = new Date().toISOString();
    var slResults = [];
    for (var slI = 0; slI < slStations.length; slI++) {
      var slSt = slStations[slI];
      try {
        var slUrl = 'https://geoportale.lamma.rete.toscana.it/geoserver/ows' +
          '?service=WFS&version=2.0.0&request=GetFeature' +
          '&typeName=lamma_stazioni:vento' +
          '&outputFormat=application/json' +
          '&CQL_FILTER=nome=' + encodeURIComponent(slSt.wfsNome);
        var slJson = await fetch(slUrl).then(function(r){ return r.json(); });
        var slLast = (slJson && slJson.features && slJson.features.length > 0)
          ? slJson.features[slJson.features.length - 1].properties : null;
        var slKn = (slLast && slLast.vven_ms != null) ? Math.round(slLast.vven_ms * 1.944 * 10) / 10 : null;
        var slDir = (slLast && slLast.dven_gr != null) ? Math.round(slLast.dven_gr) : null;
        // Fetch OM per stessa posizione
        var slOmUrl = 'https://api.open-meteo.com/v1/forecast?latitude=' + slSt.lat + '&longitude=' + slSt.lon + '&current=wind_speed_10m,wind_gusts_10m,wind_direction_10m,surface_pressure&wind_speed_unit=kn';
        var slOmJson = await fetch(slOmUrl).then(function(r){ return r.json(); });
        var slOm = {
          wind_kt:     slOmJson.current ? Math.round(slOmJson.current.wind_speed_10m  * 10) / 10 : null,
          gust_kt:     slOmJson.current ? Math.round(slOmJson.current.wind_gusts_10m  * 10) / 10 : null,
          direction:   slOmJson.current ? slOmJson.current.wind_direction_10m : null,
          pressure_mb: slOmJson.current ? Math.round(slOmJson.current.surface_pressure * 10) / 10 : null
        };
        // AROME per confronto MAE (stesso pattern delle altre stazioni)
        var slAromeUrl = 'https://api.open-meteo.com/v1/meteofrance?latitude=' + slSt.lat + '&longitude=' + slSt.lon + '&hourly=wind_speed_10m,wind_gusts_10m,wind_direction_10m&wind_speed_unit=kn&models=arome_france&forecast_days=1';
        var slArome = { wind_kt: null, gust_kt: null, direction: null };
        try {
          var slAromeJson = await fetch(slAromeUrl).then(function(r){ return r.json(); });
          if (slAromeJson && slAromeJson.hourly && Array.isArray(slAromeJson.hourly.time)) {
            var slNowMs = Date.now();
            var slBestIdx = -1, slBestDiff = Infinity;
            for (var slJ = 0; slJ < slAromeJson.hourly.time.length; slJ++) {
              var slDiff = Math.abs(new Date(slAromeJson.hourly.time[slJ] + 'Z').getTime() - slNowMs);
              if (slDiff < slBestDiff) { slBestDiff = slDiff; slBestIdx = slJ; }
            }
            if (slBestIdx !== -1) {
              var slW = slAromeJson.hourly.wind_speed_10m ? slAromeJson.hourly.wind_speed_10m[slBestIdx] : null;
              var slG = slAromeJson.hourly.wind_gusts_10m ? slAromeJson.hourly.wind_gusts_10m[slBestIdx] : null;
              var slD = slAromeJson.hourly.wind_direction_10m ? slAromeJson.hourly.wind_direction_10m[slBestIdx] : null;
              slArome = {
                wind_kt: (slW !== null && slW !== undefined) ? Math.round(slW * 10) / 10 : null,
                gust_kt: (slG !== null && slG !== undefined) ? Math.round(slG * 10) / 10 : null,
                direction: (slD !== null && slD !== undefined) ? Math.round(slD) : null
              };
            }
          }
        } catch(slAromeE) {}
        var slStation = { wind_kt: slKn, gust_kt: null, direction: slDir, source: 'lamma' };
        var slSample = {
          ts: slTs,
          station: slKn !== null ? slStation : null,
          om: slOm,
          arome: slArome,
          delta: slKn !== null ? {
            wind_kt: slOm.wind_kt !== null ? Math.round((slKn - slOm.wind_kt) * 10) / 10 : null
          } : null,
          delta_arome: slKn !== null ? {
            wind_kt: slArome.wind_kt !== null ? Math.round((slKn - slArome.wind_kt) * 10) / 10 : null
          } : null
        };
        var slKey = 'bias_samples:' + slSt.id;
        var slExisting = await kvGet(slKey, kvUrl, kvToken);
        var slArr = Array.isArray(slExisting) ? slExisting : [];
        slArr.unshift(slSample);
        if (slArr.length > 100) slArr = slArr.slice(0, 100);
        await kvSet(slKey, slArr, kvUrl, kvToken);
        slResults.push({ id: slSt.id, ok: slKn !== null, wind_kt: slKn, om_wind_kt: slOm.wind_kt });
      } catch(slErr) {
        slResults.push({ id: slSt.id, ok: false, error: slErr.message });
      }
    }
    return res.status(200).json({ ts: slTs, results: slResults });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

if (action === 'mnw_web_test') {
  // Testa fetch pagine pubbliche MeteoNetwork per stazioni senza licenza API
  try {
    var mwtUrls = {
      viareggio:  'https://www.meteonetwork.eu/it/weather-station/tsc508-stazione-meteorologica-di-viareggio-lungomare',
      bocca_arno: 'https://www.meteonetwork.eu/it/weather-station/tsc431-stazione-meteorologica-di-bocca-darno'
    };
    var mwtResults = {};
    var mwtKeys = Object.keys(mwtUrls);
    for (var mwi = 0; mwi < mwtKeys.length; mwi++) {
      var mwtKey = mwtKeys[mwi];
      try {
        var mwtRes = await fetch(mwtUrls[mwtKey], {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': 'text/html' }
        });
        var mwtHtml = await mwtRes.text();
        // Cerca pattern di vento nel HTML (m/s, km/h, kn, wind)
        var mwtWindIdx = mwtHtml.search(/wind|vento|m\/s|km\/h/i);
        var mwtSnippet = mwtWindIdx > -1
          ? mwtHtml.slice(Math.max(0, mwtWindIdx - 50), mwtWindIdx + 400).replace(/\s+/g, ' ')
          : 'pattern_not_found';
        mwtResults[mwtKey] = {
          status: mwtRes.status,
          html_len: mwtHtml.length,
          snippet: mwtSnippet
        };
      } catch(mwtE) {
        mwtResults[mwtKey] = { error: mwtE.message };
      }
    }
    return res.status(200).json({ ok: true, results: mwtResults });
  } catch(e) { return res.status(500).json({ error: e.message }); }
}

// /api/engine?action=mnw_graphs_test&k=mdi - test pagine grafici storici MeteoNetwork
if (action === 'mnw_graphs_test') {
  try {
    var mgtUrl = 'https://www.meteonetwork.eu/it/weather-station/tsc508-stazione-meteorologica-di-viareggio-lungomare/graphs';
    var mgtRes = await fetch(mgtUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': 'text/html' } });
    var mgtHtml = await mgtRes.text();
    var mgtOut = { html_len: mgtHtml.length };
    // Trova tutte le variabili last_24_ o last_48_
    var mgtVarMatches = mgtHtml.match(/(?:last_24|last_48|wind_data|windSpeed|wind_speed|series_wind)\w*\s*[=:][^;]{0,400}/gi) || [];
    mgtOut.last24_vars = mgtVarMatches.slice(0, 5).map(function(m){ return m.slice(0, 200); });
    // Cerca array di numeri decimali (dati serie temporale)
    var mgtNumArrays = mgtHtml.match(/\[\s*(?:\d+\.?\d*\s*,\s*){5,}\d+\.?\d*\s*\]/g) || [];
    mgtOut.numeric_arrays = mgtNumArrays.slice(0, 3).map(function(a){ return a.slice(0, 150); });
    // Cerca pattern fetch/ajax per capire se i dati sono caricati via API
    var mgtAjax = mgtHtml.match(/fetch\(['"][^'"]{10,100}['"]|ajax[^;]{0,200}url[^;]{0,100}/gi) || [];
    mgtOut.ajax_calls = mgtAjax.slice(0, 5).map(function(m){ return m.slice(0, 150); });
    // Cerca /api/ endpoint nel HTML
    var mgtApiUrls = mgtHtml.match(/['"][^'"]*\/api\/[^'"]{5,80}['"]/g) || [];
    mgtOut.api_urls = mgtApiUrls.slice(0, 5);
    return res.status(200).json(mgtOut);
  } catch(e) { return res.status(500).json({ error: e.message }); }
}

// /api/engine?action=buoy_test&k=mdi - test endpoint boe pubblici
// /api/engine?action=buoy_cmems_index&k=mdi - cerca boe CMEMS nel Tirreno nord
// /api/engine?action=sir_test&k=mdi -- proba endpoint SIR/CFR Toscana anemometria
// /api/engine?action=cfr_anemo_stations&k=mdi -- stazioni anemometriche CFR costiere
// /api/engine?action=cfr_anemo_realtime&k=mdi -- dati realtime stazioni CFR anemometria
if (action === 'cfr_anemo_realtime') {
  try {
    var carRes = await fetch('https://www.cfr.toscana.it/monitoraggio/stazioni.php?type=anemo', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': 'text/html', 'Cache-Control': 'no-cache' },
      signal: AbortSignal.timeout ? AbortSignal.timeout(12000) : undefined
    });
    var carHtml = await carRes.text();

    // L'array con dati completi ha il pattern:
    // varname[N] = new Array("TOS...", "NomeStazione", "PROV", "Luogo", "Cod", "quota", "vel", "raffica", "dir", "HH.MM", ...)
    // Cerca entries con almeno 10 campi (stazioni con dati reali)
    var carFullRe = /new Array\("(TOS\d+)","([^"]+)","([A-Z]{2})","([^"]*)","([^"]*)","(\d+)","([\d.]+)","([\d.]+)","(\d+)","([\d.]+)"([^)]*)\)/g;
    var carStations = {};
    var carMatch;
    while ((carMatch = carFullRe.exec(carHtml)) !== null) {
      var carId = carMatch[1];
      if (!carStations[carId]) {
        var carMsToKn = function(ms) { return ms ? Math.round(parseFloat(ms) * 1.94384 * 10) / 10 : null; };
        carStations[carId] = {
          id: carId,
          nome: carMatch[2],
          prov: carMatch[3],
          luogo: carMatch[4],
          quota: parseInt(carMatch[6]),
          wind_ms: parseFloat(carMatch[7]),
          wind_kt: carMsToKn(carMatch[7]),
          gust_ms: parseFloat(carMatch[8]),
          gust_kt: carMsToKn(carMatch[8]),
          dir_deg: parseInt(carMatch[9]),
          time: carMatch[10]
        };
      }
    }

    // Filtra stazioni costiere di interesse
    var carCoast = ['TOS11000107','TOS11000513','TOS11000103','TOS01005251','TOS03001963','TOS11000013','TOS03002300','TOS11000005','TOS03001965'];
    var carCoastData = carCoast.map(function(id) { return carStations[id] || { id: id, wind_kt: null }; });

    return res.status(200).json({
      ts: new Date().toISOString(),
      total_parsed: Object.keys(carStations).length,
      coastal: carCoastData,
      all_stations: Object.values(carStations)
    });
  } catch(e) { return res.status(500).json({ error: e.message }); }
}

if (action === 'cfr_anemo_stations') {
  try {
    var casRes = await fetch('https://geo.sir.toscana.it/geoserver/geo/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=geo:cf_anemometri&maxFeatures=300000&outputFormat=application/json', {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
      signal: AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined
    });
    var casGeo = await casRes.json();
    if (!casGeo.features) return res.status(200).json({ error: 'no features', raw: JSON.stringify(casGeo).slice(0,200) });

    // Leggi CRS dal GeoJSON
    var casCrs = casGeo.crs ? JSON.stringify(casGeo.crs) : 'non specificato';

    // Province costiere Tirreno toscano
    var casCoastProv = ['LI','GR','LU','PI','MS'];

    // Converti coordinate: se Gauss-Boaga Ovest (EPSG:3003) o Web Mercator (EPSG:3857)
    // Approssimazione per Gauss-Boaga: lon circa (X - 1500000) / 75000 + 9
    // Per ora restituiamo coordinate raw + provincia per filtrare manualmente
    var casCoastal = [];
    casGeo.features.forEach(function(f) {
      var p = f.properties;
      var coords = f.geometry ? f.geometry.coordinates : null;
      if (casCoastProv.indexOf(p.provin) >= 0 || (p.comune && ['Livorno','Piombino','Grosseto','Massa','Carrara','Lucca','Pisa','Livorno'].indexOf(p.comune) >= 0)) {
        casCoastal.push({
          id: p.id_stazione,
          nome: p.nome,
          comune: p.comune,
          prov: p.provin,
          coords_raw: coords,
          quota: p.quota || null,
          tipo: p.tipo_stazione || null
        });
      }
    });

    return res.status(200).json({
      crs: casCrs,
      total: casGeo.features.length,
      coastal_count: casCoastal.length,
      coastal_stations: casCoastal
    });
  } catch(e) { return res.status(500).json({ error: e.message }); }
}

if (action === 'sir_test') {
  try {
    var sirEndpoints = [
      // GeoJSON stazioni anemometriche (open data ufficiale)
      { name: 'geo_sir_anemometri', url: 'https://geo.sir.toscana.it/geoserver/geo/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=geo:cf_anemometri&maxFeatures=300000&outputFormat=application/json' },
      // Monitoring realtime CFR
      { name: 'cfr_monitoraggio_anemo', url: 'https://www.cfr.toscana.it/monitoraggio/stazioni.php?type=anemo' },
      { name: 'cfr_monitoraggio_onda',  url: 'https://www.cfr.toscana.it/monitoraggio/stazioni.php?type=onda' },
      { name: 'cfr_monitoraggio_mare',  url: 'https://www.cfr.toscana.it/monitoraggio/stazioni.php?type=mare' },
      // SIR realtime
      { name: 'sir_anemo_pub',    url: 'https://www.sir.toscana.it/monitoraggio/stazioni.php?type=anemo' },
      // GeoJSON stazioni ondametriche
      { name: 'geo_sir_ondametri', url: 'https://geo.sir.toscana.it/geoserver/geo/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=geo:cf_ondametri&maxFeatures=100&outputFormat=application/json' },
    ];
    var sirResults = [];
    for (var si2 = 0; si2 < sirEndpoints.length; si2++) {
      try {
        var sr2 = await fetch(sirEndpoints[si2].url, {
          headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json, text/html, */*' },
          signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined
        });
        var sb2 = await sr2.text();
        var isJson = sb2.trim().startsWith('{') || sb2.trim().startsWith('[');
        sirResults.push({ name: sirEndpoints[si2].name, status: sr2.status, len: sb2.length, isJson: isJson, ct: sr2.headers.get('content-type') || '', snippet: sb2.slice(0, 300) });
      } catch(e2) { sirResults.push({ name: sirEndpoints[si2].name, error: e2.message }); }
    }
    return res.status(200).json({ results: sirResults });
  } catch(e) { return res.status(500).json({ error: e.message }); }
}

if (action === 'buoy_cmems_index') {
  try {
    var cmUser = process.env.CMEMS_USER || null;
    var cmPass = process.env.CMEMS_PASS || null;
    var authHeader = cmUser ? 'Basic ' + Buffer.from(cmUser + ':' + cmPass).toString('base64') : null;

    // Tirreno nord + Arcipelago Toscano bounding box
    var LAT_MIN = 40.0, LAT_MAX = 44.5, LON_MIN = 7.5, LON_MAX = 12.5;

    // Index file piattaforme - piccolo CSV pubblico
    var indexUrls = [
      'https://nrt.cmems-du.eu/Core/INSITU_MED_PHYBGCWAV_DISCRETE_MYNRT_013_035/index_platform.txt',
      'https://nrt.cmems-du.eu/Core/INSITU_MED_PHYBGCWAV_DISCRETE_MYNRT_013_035/metadata/index_platform.txt'
    ];

    var indexText = null;
    var usedUrl = null;
    for (var ui = 0; ui < indexUrls.length; ui++) {
      try {
        var hdr = { 'User-Agent': 'NAUTILUS/1.0' };
        if (authHeader) hdr['Authorization'] = authHeader;
        var ir = await fetch(indexUrls[ui], { headers: hdr, signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined });
        if (ir.ok) { indexText = await ir.text(); usedUrl = indexUrls[ui]; break; }
      } catch(e2) {}
    }

    if (!indexText) return res.status(200).json({ error: 'Index non raggiungibile', auth_configured: !!(cmUser) });

    // Parsa CSV - cerca piattaforme nell'area
    var lines = indexText.split('\n').filter(function(l){ return l.trim() && !l.startsWith('#'); });
    var header = lines[0].split(',').map(function(h){ return h.trim().toLowerCase(); });
    var iLat = header.indexOf('last_latitude_observation') !== -1 ? header.indexOf('last_latitude_observation') : header.indexOf('geospatial_lat_min');
    var iLon = header.indexOf('last_longitude_observation') !== -1 ? header.indexOf('last_longitude_observation') : header.indexOf('geospatial_lon_min');
    var iType = header.indexOf('platform_category'); if (iType < 0) iType = header.indexOf('data_type');
    var iFile = header.indexOf('file_name'); if (iFile < 0) iFile = 0;
    var iPlatId = header.indexOf('platform_code'); if (iPlatId < 0) iPlatId = header.indexOf('platform_id');
    var iParam = header.indexOf('parameters');

    var found = [];
    for (var li = 1; li < lines.length; li++) {
      var cols = lines[li].split(',');
      if (cols.length < 3) continue;
      var lat = parseFloat(cols[iLat]);
      var lon = parseFloat(cols[iLon]);
      if (isNaN(lat) || isNaN(lon)) continue;
      if (lat >= LAT_MIN && lat <= LAT_MAX && lon >= LON_MIN && lon <= LON_MAX) {
        found.push({
          id: iPlatId >= 0 ? cols[iPlatId].trim() : '?',
          lat: lat, lon: lon,
          type: iType >= 0 ? cols[iType].trim() : '?',
          params: iParam >= 0 ? cols[iParam].trim() : '?',
          file: iFile >= 0 ? cols[iFile].trim() : '?'
        });
      }
    }

    return res.status(200).json({
      source: usedUrl,
      auth_configured: !!(cmUser),
      total_platforms: lines.length - 1,
      found_in_area: found.length,
      bbox: { lat_min: LAT_MIN, lat_max: LAT_MAX, lon_min: LON_MIN, lon_max: LON_MAX },
      platforms: found
    });
  } catch(e) { return res.status(500).json({ error: e.message }); }
}

if (action === 'buoy_test') {
  try {
    var btEndpoints = [
      // ISPRA RON - Rete Ondametrica Nazionale
      { name: 'ISPRA_RON_home',    url: 'https://www.isprambiente.gov.it/it/reti-e-sistemi-di-monitoraggio/dati-ambientali-ai-cittadini/ron-rete-ondametrica-nazionale' },
      { name: 'ISPRA_RON_data',    url: 'http://sgi2.isprambiente.it/ron/index.php' },
      { name: 'ISPRA_dati',        url: 'https://dati.isprambiente.it/' },
      // CMEMS in-situ observations (senza auth - solo verifica accessibilita)
      { name: 'CMEMS_catalog',     url: 'https://data.marine.copernicus.eu/api/metadata/products' },
      { name: 'CMEMS_insitu_med',  url: 'https://nrt.cmems-du.eu/motu-web/Motu?action=describeproduct&service=INSITU_MED_PHY_OBSERVATIONS_NRT_013_035-TDS' },
      // ARPA Toscana
      { name: 'ARPA_toscana',      url: 'https://www.arpat.toscana.it/dati-e-servizi/servizi-online' },
      // Protezione Civile meteo
      { name: 'PROTCIV_dpc',       url: 'https://maree.isprambiente.it/api.php?id=LIV&type=last' }
    ];
    var btResults = [];
    for (var bti = 0; bti < btEndpoints.length; bti++) {
      try {
        var btRes = await fetch(btEndpoints[bti].url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NAUTILUS/1.0)', 'Accept': 'application/json, text/html' },
          signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined
        });
        var btBody = await btRes.text();
        btResults.push({ name: btEndpoints[bti].name, status: btRes.status, len: btBody.length, snippet: btBody.slice(0, 150).replace(/\s+/g, ' ') });
      } catch(btE) {
        btResults.push({ name: btEndpoints[bti].name, error: btE.message });
      }
    }
    return res.status(200).json({ results: btResults });
  } catch(e) { return res.status(500).json({ error: e.message }); }
}

if (action === 'mnw_history_test') {
  try {
    var mhtToken = process.env.METEONETWORK_TOKEN || '';
    if (!mhtToken) return res.status(400).json({ error: 'token mancante' });
    var mhtCode = req.query.code || 'tsc508';
    var mhtHeaders = { 'Authorization': 'Bearer ' + mhtToken, 'User-Agent': 'NAUTILUS/1.0' };
    var mhtEndpoints = [
      'https://api.meteonetwork.it/v3/data-history/' + mhtCode + '?hours=24',
      'https://api.meteonetwork.it/v3/data/' + mhtCode + '?limit=24',
      'https://api.meteonetwork.it/v3/observations/' + mhtCode,
      'https://api.meteonetwork.it/v3/data-realtime/' + mhtCode + '?history=24'
    ];
    var mhtResults = [];
    for (var mhti = 0; mhti < mhtEndpoints.length; mhti++) {
      try {
        var mhtRes = await fetch(mhtEndpoints[mhti], { headers: mhtHeaders });
        var mhtBody = await mhtRes.text();
        mhtResults.push({ url: mhtEndpoints[mhti], status: mhtRes.status, body: mhtBody.slice(0, 2000) });
      } catch(mhtE) {
        mhtResults.push({ url: mhtEndpoints[mhti], error: mhtE.message });
      }
    }
    return res.status(200).json({ results: mhtResults });
  } catch(e) { return res.status(500).json({ error: e.message }); }
}

if (action === 'mnw_test') {
  // Testa tutte le stazioni MNW e restituisce risultato diretto
  var mnwTestToken = process.env.METEONETWORK_TOKEN || '';
  if (!mnwTestToken) return res.status(200).json({ error: 'METEONETWORK_TOKEN non configurato' });
  try {
    var mnwResults = {};
    var mnwKeys = Object.keys(MNW_STATIONS);
    for (var mki = 0; mki < mnwKeys.length; mki++) {
      var mkZone = mnwKeys[mki];
      var mkCode = MNW_STATIONS[mkZone];
      try {
        var mkUrl = 'https://api.meteonetwork.it/v3/data-realtime/' + mkCode;
        var mkRes = await fetch(mkUrl, { headers: { 'Authorization': 'Bearer ' + mnwTestToken, 'User-Agent': 'NAUTILUS/1.0' } });
        var mkStatus = mkRes.status;
        if (mkRes.ok) {
          var mkData = await mkRes.json();
          var mkObs = Array.isArray(mkData) ? mkData[0] : mkData;
          mnwResults[mkZone] = { code: mkCode, status: mkStatus, ok: true,
            wind_speed: mkObs ? mkObs.wind_speed : null,
            wind_dir: mkObs ? mkObs.wind_direction : null,
            pressure: mkObs ? mkObs.pressure : null,
            time: mkObs ? mkObs.observation_time : null };
        } else {
          mnwResults[mkZone] = { code: mkCode, status: mkStatus, ok: false };
        }
      } catch(mke) {
        mnwResults[mkZone] = { code: mkCode, ok: false, error: mke.message };
      }
    }
    return res.status(200).json({ ok: true, results: mnwResults });
  } catch(e) { return res.status(500).json({ error: e.message }); }
}

if (action === 'cron_lamma') {
  // Cron 23:50 -- raccoglie dati LaMMA giornalieri e calcola bias
  try {
    var lammaResults = await runLammaBiasCron(kvUrl, kvToken);
    return res.status(200).json({ ok: true, zones: Object.keys(lammaResults).length, results: lammaResults });
  } catch(e) { return res.status(500).json({ error: e.message }); }
}

if (action === 'lamma_bias_get') {
  // Legge bias LaMMA per una zona
  var zona2 = req.query.zone || 'livorno';
  try {
    var biasRaw = await kvGet('lamma_bias:' + zona2, kvUrl, kvToken);
    if (!biasRaw) return res.status(200).json({ found: false });
    return res.status(200).json({ found: true, bias: JSON.parse(biasRaw) });
  } catch(e) { return res.status(500).json({ error: e.message }); }
}

if (action === 'cron_lamma') {
  var cronSecretL = process.env.CRON_SECRET || '';
  if (req.query.secret !== cronSecretL) return res.status(401).json({ error: 'Unauthorized' });
  try {
    var result = await updateLammaBias(kvUrl, kvToken);
    var summary = {};
    Object.keys(result).forEach(function(z) { summary[z] = { avg_kn: result[z].readings.reduce(function(a,b){return a+b;},0)/result[z].readings.length, stations: result[z].stations.length }; });
    return res.status(200).json({ ok: true, action: 'cron_lamma', zones: Object.keys(result).length, summary: summary, ts: Date.now() });
  } catch(e) { return res.status(500).json({ error: e.message }); }
}

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
      var romeHour = getNowRome();
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
        wind_speed_mnw: null,
        wind_dir_mnw:   null,
        wind_gust_mnw:  null,
        pressure_mnw:   null,
        station_mnw:    null,
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
// Genera scheda situazione per ogni zona in parallelo (chiamata diretta)
var sitPromises = cronZones.map(function(zk) {
  return generateSituazioneForZone(zk, true, kvUrl, kvToken, process.env.ANTHROPIC_KEY || null)
    .catch(function() {});
});
await Promise.all(sitPromises);
return res.status(200).json({ ok: true, ts: new Date().toISOString(), zones: cronResults });
}

// /api/engine?action=diag - test KV connection
// /api/engine?action=predict_debug&zone=livorno&k=mdi
if (action === 'predict_debug') {
  try {
    if (!zoneKey || !ZONES[zoneKey]) return res.status(404).json({ error: 'zona mancante' });
    var pdbNow = new Date();
    var pdbFound = [];
    // Cerca ultime 48h con chiavi Roma
    outer: for (var pdd = 0; pdd < 2; pdd++) {
      for (var phh = 0; phh < 24; phh++) {
        for (var pqq = 0; pqq < 4; pqq++) {
          var pdbT = new Date(pdbNow.getTime() - pdd*86400000 - phh*3600000 - pqq*900000);
          var pdbRome = pdbT.toLocaleString('sv-SE',{timeZone:'Europe/Rome'}).replace(' ','T').slice(0,13);
          var pdbSlot = ['00','15','30','45'][pqq];
          var pdbKey = 'predict:' + zoneKey + ':' + pdbRome + '-' + pdbSlot;
          var pdbVal = await kvGet(pdbKey, kvUrl, kvToken);
          if (pdbVal) {
            pdbFound.push({ key: pdbKey, forecast_h3: pdbVal.forecast_h3, forecast_h6: pdbVal.forecast_h6, forecast_h12: pdbVal.forecast_h12, generated_at: pdbVal.generated_at, text_snippet: pdbVal.prediction_text ? pdbVal.prediction_text.slice(0, 200) : null });
            if (pdbFound.length >= 3) break outer;
          }
        }
      }
    }
    return res.status(200).json({ zone: zoneKey, found: pdbFound.length, predictions: pdbFound });
  } catch(e) { return res.status(500).json({ error: e.message }); }
}

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
var minSlots = req.query.min_slots ? parseInt(req.query.min_slots) : 0;
var effectiveHours = (hours <= 1 && minSlots === 0) ? 1.5 : hours;
var cutoffH = new Date(Date.now() - effectiveHours * 3600000);
var snapshots = [];

// Per zone con stazione CFR usa bias_samples (dati reali stazione)
var zoneObjH = ZONES[zoneKey];
var usedBiasSamples = false;
if (zoneObjH && zoneObjH.bias_station) {
  var bsSamples = await kvGet('bias_samples:' + zoneObjH.bias_station, kvUrl, kvToken) || [];
  var cfrSamples = bsSamples.filter(function(bs) {
    return bs.ts && bs.station && bs.station.wind_kt !== null &&
           new Date(bs.ts) >= cutoffH;
  });
  if (cfrSamples.length >= 3) {
    usedBiasSamples = true;
    snapshots = cfrSamples.map(function(bs) {
      return {
        ts: bs.ts,
        wind_speed: bs.station.wind_kt,
        wind_dir: bs.station.direction,
        wind_gust: bs.station.gust_kt || null,
        pressure: bs.om ? bs.om.pressure_mb : null,
        wave_height: null, wave_period: null,
        wind_speed_om: bs.om ? bs.om.wind_kt : null,
        wind_dir_om: bs.om ? bs.om.direction : null,
        obs_source: 'cfr', obs_station: zoneObjH.bias_station
      };
    }).sort(function(a,b){ return new Date(a.ts) - new Date(b.ts); });
  }
}

// Fallback: zone senza stazione CFR usano snap OM
if (!usedBiasSamples) {
  snapshots = await getWindHistory(zoneKey, kvUrl, kvToken, effectiveHours);
  if (hours <= 1 && snapshots.length > 3) snapshots = snapshots.slice(-3);
}

var bias = await getBias(zoneKey, kvUrl, kvToken);
var rotation = analyzeWindRotation(snapshots);
return res.status(200).json({
zone: zoneKey, name: ZONES[zoneKey].name,
hours_requested: hours, hours_available: snapshots.length,
snapshots: snapshots, rotation: rotation, bias: bias,
data_source: usedBiasSamples ? 'cfr_station' : 'om_model'
});
} catch(e) {
return res.status(500).json({ error: e.message });
}
}

// /api/engine?action=predict&zone=xxx - AI local forecast based on historical data
if (action === 'route_grid') {
  try {
    // Riceve waypoints array e divide la rotta in segmenti da ~15nm
    var bodyRG = await new Promise(function(resolve, reject) {
      var data = '';
      req.on('data', function(chunk) { data += chunk; });
      req.on('end', function() { try { resolve(JSON.parse(data)); } catch(e) { resolve({}); } });
      req.on('error', reject);
    });
    var waypoints = bodyRG.waypoints || []; // [{lat,lon,name}]
    if (waypoints.length < 2) return res.status(400).json({ error: 'Servono almeno 2 waypoint' });

    // Funzione distanza in nm
    function haversineNm(lat1, lon1, lat2, lon2) {
      var R = 3440.065;
      var dLat = (lat2-lat1)*Math.PI/180;
      var dLon = (lon2-lon1)*Math.PI/180;
      var a = Math.sin(dLat/2)*Math.sin(dLat/2) +
        Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }

    // Genera punti griglia ogni ~15nm lungo la rotta
    var GRID_NM = 15;
    var gridPoints = [];
    var cumulativeNm = 0;
    gridPoints.push({ lat: waypoints[0].lat, lon: waypoints[0].lon, name: waypoints[0].name || 'Partenza', nm: 0 });

    for (var wi = 0; wi < waypoints.length - 1; wi++) {
      var p1 = waypoints[wi], p2 = waypoints[wi+1];
      var segNm = haversineNm(p1.lat, p1.lon, p2.lat, p2.lon);
      var steps = Math.floor(segNm / GRID_NM);
      for (var si = 1; si <= steps; si++) {
        var frac = si * GRID_NM / segNm;
        var lat = p1.lat + (p2.lat - p1.lat) * frac;
        var lon = p1.lon + (p2.lon - p1.lon) * frac;
        cumulativeNm += GRID_NM;
        gridPoints.push({ lat: lat, lon: lon, nm: Math.round(cumulativeNm),
          name: 'nm ' + Math.round(cumulativeNm) + ' (ore +' + (Math.round(cumulativeNm/6*10)/10).toFixed(1) + 'h a 6kn)' });
      }
      cumulativeNm += segNm - steps * GRID_NM;
    }
    // Aggiunge punto arrivo
    var lastWP = waypoints[waypoints.length-1];
    var totalNm = 0;
    for (var wj = 0; wj < waypoints.length-1; wj++) {
      totalNm += haversineNm(waypoints[wj].lat, waypoints[wj].lon, waypoints[wj+1].lat, waypoints[wj+1].lon);
    }
    gridPoints.push({ lat: lastWP.lat, lon: lastWP.lon,
      name: (lastWP.name || 'Arrivo') + ' nm ' + Math.round(totalNm) + ' (ore +' + (Math.round(totalNm/6*10)/10).toFixed(1) + 'h a 6kn)',
      nm: Math.round(totalNm) });

    // Fetch OM per ogni punto in parallelo
    var omPromises = gridPoints.map(function(gp) {
      var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + gp.lat.toFixed(4) +
        '&longitude=' + gp.lon.toFixed(4) +
        '&hourly=windspeed_10m,winddirection_10m,windgusts_10m,surface_pressure,wave_height&wind_speed_unit=kn&timezone=Europe/Rome&forecast_days=1';
      return fetch(url).then(function(r) { return r.json(); }).then(function(d) {
        var h = d.hourly;
        var romeNow = getNowRome();
        var idx = h && h.time ? h.time.findIndex(function(t){ return t === romeNow; }) : 0;
        if (idx === -1) idx = 0;
        return {
          lat: gp.lat.toFixed(2), lon: gp.lon.toFixed(2),
          name: gp.name || null, nm: gp.nm,
          wind_speed: h && h.windspeed_10m ? Math.round(h.windspeed_10m[idx]*10)/10 : null,
          wind_dir: h && h.winddirection_10m ? Math.round(h.winddirection_10m[idx]) : null,
          wind_gust: h && h.windgusts_10m ? Math.round(h.windgusts_10m[idx]*10)/10 : null,
          pressure: h && h.surface_pressure ? Math.round(h.surface_pressure[idx]*10)/10 : null,
          wave_height: h && h.wave_height ? Math.round(h.wave_height[idx]*100)/100 : null,
        };
      }).catch(function() { return { nm: gp.nm, error: true }; });
    });

    var gridResults = await Promise.all(omPromises);
    return res.status(200).json({ ok: true, total_nm: Math.round(totalNm), grid: gridResults });
  } catch(e) { return res.status(500).json({ error: e.message }); }
}

if (action === 'agent') {
  try {
    var anthropicKey = process.env.ANTHROPIC_KEY || null;
    if (!anthropicKey) return res.status(500).json({ error: 'ANTHROPIC_KEY non configurata' });
    // Rate limit globale: max 30 chiamate/ora per evitare abusi
    if (kvUrl && kvToken) {
      var agentRateKey = 'ratelimit:agent:' + new Date().toISOString().slice(0,13);
      var agentCount = await kvGet(agentRateKey, kvUrl, kvToken) || 0;
      if (parseInt(agentCount) >= 30) return res.status(429).json({ error: 'Limite chiamate raggiunto, riprova tra qualche minuto' });
      await fetch(kvUrl, { method:'POST', headers:{ Authorization:'Bearer '+kvToken, 'Content-Type':'application/json' }, body: JSON.stringify(['INCR', agentRateKey]) });
      await fetch(kvUrl, { method:'POST', headers:{ Authorization:'Bearer '+kvToken, 'Content-Type':'application/json' }, body: JSON.stringify(['EXPIRE', agentRateKey, 3600]) });
    }
    var body = await new Promise(function(resolve, reject) {
      var data = '';
      req.on('data', function(chunk) { data += chunk; });
      req.on('end', function() { try { resolve(JSON.parse(data)); } catch(e) { resolve({}); } });
      req.on('error', reject);
    });
    var agentRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1800,
        system: body.system || '',
        messages: body.messages || []
      })
    });
    if (!agentRes.ok) return res.status(500).json({ error: 'AI error ' + agentRes.status });
    var agentData = await agentRes.json();
    return res.status(200).json(agentData);
  } catch(e) { return res.status(500).json({ error: e.message }); }
}

if (action === 'situazione') {
  if (!zoneKey || !ZONES[zoneKey]) {
    return res.status(404).json({ error: 'Zona non trovata' });
  }
  try {
    var zObj = ZONES[zoneKey];
    var anthropicKey = process.env.ANTHROPIC_KEY || null;
    if (!anthropicKey) return res.status(500).json({ error: 'ANTHROPIC_KEY non configurata' });

    var isFast = req.query.fast === '1';
    var snapsSit = await getWindHistory(zoneKey, kvUrl, kvToken, 48);
    var biasSit = await getBias(zoneKey, kvUrl, kvToken);
    var rotSit = analyzeWindRotation(snapsSit.slice(0, 24));
    var currentSit = snapsSit[snapsSit.length - 1] || null;
    if (!currentSit) return res.status(500).json({ error: 'Nessun dato disponibile per la zona' });

    // Tendenza pressione
    var pressNow = currentSit.pressure || null;
    var press3h = snapsSit.length >= 6 ? snapsSit[snapsSit.length - 6].pressure : null;
    var pressTrend = (pressNow && press3h) ? (pressNow - press3h).toFixed(1) + ' hPa/3h' : 'nd';

    // Vento medio e max ultime 6h
    var last6 = snapsSit.slice(-6).filter(function(s){ return s.wind_speed != null; });
    var avgWind6 = last6.length ? (last6.reduce(function(a,s){ return a+s.wind_speed; },0)/last6.length).toFixed(1) : '--';
    var maxWind6 = last6.length ? Math.max.apply(null, last6.map(function(s){ return s.wind_speed; })).toFixed(1) : '--';

    // Diagnosi sinottica
    var diagSit = diagnoseSynopticCase(currentSit, rotSit);

    // Alert attivi
    var alertsSit = [];
    if (rotSit.trend !== 'stable' && rotSit.trend !== 'insufficient_data' && rotSit.total_path > 60) {
      alertsSit.push('Rotazione ' + rotSit.trend + ': percorso ' + rotSit.total_path + ' gradi in ' + rotSit.hours + 'h');
    }
    if (pressNow && press3h && (pressNow - press3h) < -2) {
      alertsSit.push('Caduta pressione rapida: ' + pressTrend);
    }
    if (currentSit.wind_speed_850 && currentSit.wind_dir_850 && currentSit.wind_dir) {
      var divSit = Math.abs(currentSit.wind_dir_850 - currentSit.wind_dir);
      if (divSit > 90) alertsSit.push('Divergenza vento quota/superficie: ' + Math.round(divSit) + ' gradi');
    }

    // Prompt AI
    var dir16sit = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSO','SO','OSO','O','ONO','NO','NNO'];
    var sLines = [];
    sLines.push('Sei un meteorologo marino esperto del Tirreno settentrionale. Analizza i dati della zona ' + ZONES[zoneKey].name + ' e genera una SCHEDA SITUAZIONE strutturata.');
    sLines.push('');
    sLines.push('DATI ATTUALI:');
    sLines.push('- Vento: ' + (currentSit.wind_speed||'--') + 'kn da ' + (currentSit.wind_dir != null ? dir16sit[Math.round(currentSit.wind_dir/22.5)%16] : '--'));
    sLines.push('- Raffica: ' + (currentSit.wind_gust||'--') + 'kn');
    sLines.push('- Pressione: ' + (currentSit.pressure||'--') + ' hPa (tendenza ' + pressTrend + ')');
    sLines.push('- Onda: ' + (currentSit.wave_height||'--') + 'm');
    sLines.push('- T aria/acqua: ' + (currentSit.temp_air||'--') + '/' + (currentSit.temp_water||'--') + ' C');
    sLines.push('- Vento medio 6h: ' + avgWind6 + 'kn, max: ' + maxWind6 + 'kn');
    if (currentSit.wind_speed_850 != null) {
      sLines.push('- Vento 850hPa: ' + currentSit.wind_speed_850 + 'kn da ' + (currentSit.wind_dir_850 != null ? dir16sit[Math.round(currentSit.wind_dir_850/22.5)%16] : '--'));
    }
    sLines.push('');
    sLines.push('PATTERN SINOTTICO: ' + (diagSit.description || diagSit.case));
    sLines.push('ROTAZIONE: ' + rotSit.trend + ', percorso ' + (rotSit.total_path||0) + ' gradi in ' + rotSit.hours + 'h');
    if (biasSit && biasSit.wind_bias) {
      sLines.push('BIAS STORICO: ' + biasSit.wind_bias + 'kn (i modelli tendono a ' + (biasSit.wind_bias < 0 ? 'sottostimare' : 'sovrastimare') + ')');
    }
    if (alertsSit.length > 0) {
      sLines.push('');
      sLines.push('ALERT RILEVATI: ' + alertsSit.join(' | '));
    }
    // Legge snapshot zone vicine per visione d'insieme
    var neighborSnaps = await getNeighborSnapshots(zoneKey, kvUrl, kvToken);
    if (neighborSnaps.length > 0) {
      sLines.push('');
      sLines.push('ZONE VICINE (per gradiente e anticipazione):');
      neighborSnaps.forEach(function(nb) {
        var ns = nb.snap;
        var nbDir = ns.wind_dir != null ? dir16sit[Math.round(ns.wind_dir/22.5)%16] : '--';
        var nbPres = ns.pressure ? ns.pressure.toFixed(0) + 'hPa' : '--';
        var nbWind = ns.wind_speed != null ? ns.wind_speed.toFixed(1) + 'kn ' + nbDir : '--';
        var pressDiff = (ns.pressure && currentSit.pressure) ?
          (ns.pressure - currentSit.pressure).toFixed(1) : null;
        sLines.push('- ' + nb.name + ': vento ' + nbWind + ', pressione ' + nbPres +
          (pressDiff ? ' (diff ' + (pressDiff > 0 ? '+' : '') + pressDiff + 'hPa vs ' + ZONES[zoneKey].name + ')' : ''));
      });
      sLines.push('Usa il gradiente di pressione tra zone per anticipare direzione e intensita del vento.');
    }

    // Aggiungi track record accuratezza schede precedenti
    var sitAccuracy = await getSituazioneAccuracy(zoneKey, kvUrl, kvToken);
    if (sitAccuracy && sitAccuracy.total >= 3) {
      sLines.push('');
      sLines.push('TRACK RECORD SCHEDE PRECEDENTI (' + sitAccuracy.total + ' verifiche):');
      sLines.push('- Accuratezza previsione vento: ' + (sitAccuracy.accuracy_pct !== null ? sitAccuracy.accuracy_pct + '%' : 'nd'));
      if (sitAccuracy.avg_wind_error !== null) {
        var errDir = parseFloat(sitAccuracy.avg_wind_error) > 0 ? 'sovrastima' : 'sottostima';
        sLines.push('- Errore medio: ' + Math.abs(sitAccuracy.avg_wind_error) + 'kn (' + errDir + ')');
      }
      if (sitAccuracy.giallo_count > 0) {
        sLines.push('- Allerte GIALLO emesse: ' + sitAccuracy.giallo_count + ' (verifica se erano giustificate)');
      }
      sLines.push('Usa questi dati per calibrare la tua valutazione attuale.');
    }

    // === TREND CFR (ultime 3 ore) ===
    if (zObj.bias_station && kvUrl && kvToken) {
      var trendSamples = await kvGet('bias_samples:' + zObj.bias_station, kvUrl, kvToken) || [];
      var trendQuota = zObj.bias_quota || 0;
      var trendWeight = trendQuota <= 15 ? 1.0 : trendQuota <= 100 ? 0.85 : trendQuota <= 200 ? 0.65 : 0.45;
      var now3h = new Date(Date.now() - 3 * 3600000);
      var recentTrend = (trendSamples || []).filter(function(s) {
        return s && s.ts && s.station && s.station.wind_kt !== null && new Date(s.ts) >= now3h;
      }).slice(0, 8).reverse();
      if (recentTrend.length >= 2) {
        sLines.push('');
        sLines.push('OSSERVAZIONI REALI ULTIME 3 ORE (stazione ' + zObj.bias_station + (trendWeight < 1 ? ', quota ' + trendQuota + 'm, peso ' + trendWeight + ')' : ')'));
        recentTrend.forEach(function(s) {
          var t = new Date(s.ts).toLocaleTimeString('it-IT',{timeZone:'Europe/Rome',hour:'2-digit',minute:'2-digit'});
          var wkt = Math.round(s.station.wind_kt * trendWeight * 10) / 10;
          var dir = s.station.direction_txt || '--';
          sLines.push(t + ': ' + wkt + 'kn ' + dir);
        });
        sLines.push('Usa il trend osservato per ancorare le previsioni H+3/H+6 alla realta misurata.');
      }
    }

    // === BIAS PREVISIONALE (errori sistematici AI) ===
    if (kvUrl && kvToken) {
      var biasPred = await kvGet('predict_bias:' + zoneKey, kvUrl, kvToken);
      if (biasPred && biasPred.bias) {
        var bp = biasPred.bias;
        var bpLines = [];
        ['h1','h3','h6','h9','h12'].forEach(function(h) {
          var b = bp[h];
          if (!b || b.n < 5 || b.mean === null) return;
          var label = 'H+' + h.slice(1);
          var dir2 = b.mean > 0 ? 'sottostima' : 'sovrastima';
          var correction = b.mean > 0 ? b.mean : b.mean; // segno conservato
          bpLines.push(label + ': errore medio ' + (b.mean > 0 ? '+' : '') + b.mean + 'kn (' + dir2 + ', n=' + b.n + ') - DEVI sottrarre ' + b.mean + 'kn dal valore OM per ' + label);
        });
        if (bpLines.length > 0) {
          sLines.push('');
          sLines.push('CORREZIONE BIAS OBBLIGATORIA (basata su ' + Object.keys(bp).filter(function(h){ var b=bp[h]; return b&&b.n>=5&&b.mean!==null; }).length + ' orizzonti verificati):');
          bpLines.forEach(function(l){ sLines.push('- ' + l); });
          sLines.push('IMPORTANTE: questi errori sono sistematici e confermati. Applica NUMERICAMENTE queste correzioni ai valori OM prima di generare la previsione. Se OM dice 8kn e il bias e\' -3kn, la tua previsione deve essere 8-(-3)=5kn, non 8kn.');
        }
      }
    }

    sLines.push('');
    sLines.push('Rispondi ESATTAMENTE in questo formato (usa questi titoli in maiuscolo):');
    sLines.push('');
    sLines.push('SITUAZIONE ATTUALE');
    sLines.push('[2-3 righe: descrivi cosa sta succedendo ora in linguaggio naturale]');
    sLines.push('');
    sLines.push('EVOLUZIONE ATTESA');
    sLines.push('[2-3 righe: cosa ci si aspetta nelle prossime 3-12 ore con valori indicativi]');
    sLines.push('');
    sLines.push('CONSIGLIO NAVIGAZIONE');
    sLines.push('[1-2 righe: indicazione operativa concreta per questa zona]');
    sLines.push('');
    sLines.push('MONITORARE');
    sLines.push('[2-4 punti specifici da tenere d occhio con soglie concrete]');
    sLines.push('');
    sLines.push('ALLERTA: VERDE o GIALLO o ROSSO');
    sLines.push('');
    sLines.push('Max ' + (isFast ? '200' : '300') + ' parole totali. Sii concreto e operativo.');

    var sitRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: isFast ? 'claude-haiku-4-5-20251001' : 'claude-sonnet-4-6',
        max_tokens: isFast ? 400 : 600,
        messages: [{ role: 'user', content: sLines.join('\n') }]
      })
    });
    if (!sitRes.ok) return res.status(500).json({ error: 'AI error ' + sitRes.status });
    var sitData = await sitRes.json();
    var sitText = sitData.content && sitData.content[0] ? sitData.content[0].text : '';

    // Estrae livello allerta dal testo
    var allertaMatch = sitText.match(/ALLERTA:\s*(VERDE|GIALLO|ROSSO)/i);
    var allertaLevel = allertaMatch ? allertaMatch[1].toUpperCase() : 'VERDE';
    var allertaColor = allertaLevel === 'ROSSO' ? 'danger' : allertaLevel === 'GIALLO' ? 'warn' : 'safe';

    // Salva in KV
    var now3s = new Date();
    var mins15s = now3s.getMinutes() < 15 ? '00' : now3s.getMinutes() < 30 ? '15' : now3s.getMinutes() < 45 ? '30' : '45';
    var romeHourS = getNowRome().slice(0, 13); // "2026-04-30T09" senza :00
    var sitKey = 'situazione:' + zoneKey + ':' + romeHourS + '-' + mins15s;
    var sitRecord = {
      zone: zoneKey,
      generated_at: now3s.toISOString(),
      text: sitText,
      allerta: allertaLevel,
      allerta_color: allertaColor,
      current_wind: currentSit.wind_speed,
      current_pressure: currentSit.pressure,
      rotation_trend: rotSit.trend,
      rotation_path: rotSit.total_path
    };
    if (kvUrl && kvToken) await kvSet(sitKey, sitRecord, 86400 * 7, kvUrl, kvToken); // TTL 7 giorni
    if (kvUrl && kvToken) await kvSet('situazione_latest:' + zoneKey, sitRecord, 86400 * 7, kvUrl, kvToken); // indice rapido

    // Salva in lista unificata predict_history:zona (stessa di action=predict)
    var sitExtractWind = function(text, h) {
      var pats = [
        new RegExp('H\+?' + h + '[^0-9(]*([0-9]+\.?[0-9]*)\s*[-\u2013\u2014]\s*([0-9]+\.?[0-9]*)\s*kn', 'i'),
        new RegExp('H\+?' + h + '[^0-9(]*([0-9]+\.?[0-9]*)\s*kn', 'i')
      ];
      for (var pi = 0; pi < pats.length; pi++) {
        var m = text.match(pats[pi]);
        if (m) return pi === 0 ? Math.round((parseFloat(m[1]) + parseFloat(m[2])) / 2 * 10) / 10 : parseFloat(m[1]);
      }
      return null;
    };
    if (kvUrl && kvToken) {
      var sitPredRecord = {
        zone: zoneKey, generated_at: now3s.toISOString(),
        prediction_text: sitText, source: 'situazione',
        current_wind: currentSit.wind_speed, current_wind_dir: currentSit.wind_dir,
        current_pressure: currentSit.pressure, current_wave: currentSit.wave_height || null,
        forecast_h1: sitExtractWind(sitText, '1'),
        forecast_h3: sitExtractWind(sitText, '3'),
        forecast_h6: sitExtractWind(sitText, '6'),
        forecast_h9: sitExtractWind(sitText, '9'),
        forecast_h12: sitExtractWind(sitText, '12')
      };
      var phListSit = await kvGet('predict_history:' + zoneKey, kvUrl, kvToken) || [];
      phListSit = Array.isArray(phListSit) ? phListSit : [];
      phListSit.unshift(sitPredRecord);
      if (phListSit.length > 30) phListSit.length = 30;
      await kvSet('predict_history:' + zoneKey, phListSit, 2592000, kvUrl, kvToken);
    }

    return res.status(200).json({
      zone: zoneKey,
      name: ZONES[zoneKey].name,
      generated_at: sitRecord.generated_at,
      saved_key: sitKey,
      allerta: allertaLevel,
      allerta_color: allertaColor,
      text: sitText
    });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

if (action === 'predict') {
  if (!zoneKey || !ZONES[zoneKey]) {
    return res.status(404).json({ error: 'Zona non trovata' });
  }
  try {
    var anthropicKey = process.env.ANTHROPIC_KEY || null;
    if (!anthropicKey) return res.status(500).json({ error: 'ANTHROPIC_KEY non configurata' });

    // Get last 14 days of snapshots
    var snapshots14 = await getWindHistory(zoneKey, kvUrl, kvToken, req.query.fast === '1' ? 48 : 336);
    // Per zone con dati reali CFR, usa solo quelli per l'analisi storica
    var cfrSnaps14 = snapshots14.filter(function(s){ return s.obs_source === 'cfr'; });
    if (cfrSnaps14.length >= 3) snapshots14 = cfrSnaps14;
    var bias = await getBias(zoneKey, kvUrl, kvToken);
    var biasStatLivorno = await kvGet('bias_stats:livorno', kvUrl, kvToken);
    var biasStatPiombino = await kvGet('bias_stats:canale_piombino', kvUrl, kvToken);
    var biasStatViareggio = await kvGet('bias_stats:viareggio', kvUrl, kvToken);
    var biasStatCapraia = await kvGet('bias_stats:capraia_w', kvUrl, kvToken);
    var zoneObj = ZONES[zoneKey];
    var biasStatZone = null;
    if (zoneObj && zoneObj.bias_station) {
      biasStatZone = await kvGet('bias_stats:' + zoneObj.bias_station, kvUrl, kvToken);
    }
    // Quota stazione primaria - stazioni >100m hanno componente altimetrica nel bias
    var ALL_STATION_QUOTAS = {
      gorgona_cfr:230, capraia_cfr:274, giglio_porto:0, giglio_castello:470, montecristo:85,
      portoferraio_cfr:10, orbetello:0, svincenzo_porto:1, casotto_pescatori:2, venturina:8,
      forte_dei_marmi:0, lido_camaiore:1, bocca_arno_cfr:1, follonica:15, capalbio:12, livorno_cfr:2, viareggio_cfr:2, populonia_cfr:164,
      livorno:244, canale_piombino:8, viareggio:25, capraia_w:274, portoferraio:368,
      alberese:1, luri:50, barcaggio:4, bonifacio_pertusato:90, vada:8 // bonifacio_pertusato: stima falesia, da verificare
    };
    var zoneStationQuota = zoneObj && zoneObj.bias_station ? (ALL_STATION_QUOTAS[zoneObj.bias_station] || null) : null;
    var zoneStationHighAlt = zoneStationQuota !== null && zoneStationQuota > 100;

    // Carica ultimi campioni stazione reale (ground truth)
    var stSamples = [];
    var lastStSample = null;
    var stIsRecent = false;
    if (zoneObj && zoneObj.bias_station) {
      stSamples = await kvGet('bias_samples:' + zoneObj.bias_station, kvUrl, kvToken) || [];
      // campioni ordinati dal piu recente (indice 0) al piu vecchio
      if (stSamples.length > 0) {
        lastStSample = stSamples[0];
        var stAge = (new Date() - new Date(lastStSample.ts)) / 60000; // minuti
        stIsRecent = stAge < 45;
      }
    }

    // Fetch OM forecast H+3 H+6 H+12 bias-corretti
    var omForecastHours = {};
    try {
      var omFcUrl = 'https://api.open-meteo.com/v1/forecast?latitude=' + zoneObj.lat +
        '&longitude=' + zoneObj.lon +
        '&hourly=windspeed_10m,winddirection_10m,windgusts_10m&wind_speed_unit=kn&timezone=Europe%2FRome&forecast_days=1';
      var omFcJ = await fetch(omFcUrl).then(function(r){ return r.json(); });
      if (omFcJ && omFcJ.hourly) {
        var omTimes = omFcJ.hourly.time; // formato "2026-05-22T15:00"
        var nowMs = Date.now();
        [1,3,6,9,12].forEach(function(th) {
          var targetMs = nowMs + th * 3600000;
          var bestIdx = 0, bestDiff = Infinity;
          for (var ti = 0; ti < omTimes.length; ti++) {
            var tMs = new Date(omTimes[ti] + ':00+02:00').getTime(); // Rome timezone
            var diff2 = Math.abs(tMs - targetMs);
            if (diff2 < bestDiff) { bestDiff = diff2; bestIdx = ti; }
          }
          omForecastHours['h' + th] = {
            wind_kt:  Math.round(omFcJ.hourly.windspeed_10m[bestIdx] * 10) / 10,
            dir:      omFcJ.hourly.winddirection_10m[bestIdx],
            gust_kt:  Math.round(omFcJ.hourly.windgusts_10m[bestIdx] * 10) / 10,
            time:     omTimes[bestIdx]
          };
        });
      }
    } catch(omFcErr) { /* silenzioso */ }

    var rotation = analyzeWindRotation(snapshots14.slice(0, 24));
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

    // LIVELLO 1: STAZIONE REALE (ground truth se disponibile)
    var biasCorr = biasStatZone && biasStatZone.n_wind >= 15 && !zoneStationHighAlt ? biasStatZone.mean_delta_wind : 0;
    if (stIsRecent && lastStSample && lastStSample.station && lastStSample.station.wind_kt !== null) {
      var stData = lastStSample.station;
      var stDirName = stData.direction !== null ? dirs16p[Math.round(stData.direction/22.5)%16] : '--';
      var stTimeStr = new Date(lastStSample.ts).toLocaleString('it-IT',{timeZone:'Europe/Rome',hour:'2-digit',minute:'2-digit'});
      var quotaNote = zoneStationQuota !== null ? ' [quota ' + zoneStationQuota + 'm' + (zoneStationHighAlt ? ' - VENTO AMPLIFICATO DA ALTITUDINE, non usare come riferimento assoluto di superficie' : '') + ']' : '';
      pLines.push('DATI STAZIONE REALE [' + zoneObj.bias_station + ']' + quotaNote + ':');
      pLines.push('- ' + stTimeStr + ': ' + stData.wind_kt + ' kn da ' + stDirName + ' (' + (stData.direction||'--') + 'deg)' +
        (stData.gust_kt ? ', raffica ' + stData.gust_kt + ' kn' : ''));

      // Trend recente ultimi 4 campioni (ultime ~2h)
      var trendSamples = stSamples.slice(0, 5).filter(function(s){ return s.station && s.station.wind_kt !== null; });
      if (trendSamples.length >= 3) {
        var trendStr = trendSamples.slice(0,4).reverse().map(function(s) {
          var td = s.station.direction !== null ? dirs16p[Math.round(s.station.direction/22.5)%16] : '--';
          return s.station.wind_kt + 'kn ' + td;
        }).join(' -> ');
        pLines.push('- Trend ultime 2h: ' + trendStr + ' (piu recente a destra)');
      }
      pLines.push('');
      pLines.push('PREVISIONE OM' + (biasCorr !== 0 ? ' BIAS-CORRETTA' : ' (no stazione, dati OM grezzi)') + ':');
    } else {
      // Nessuna stazione recente: usa OM come prima
      pLines.push('SITUAZIONE ATTUALE (Open-Meteo' + (zoneObj && zoneObj.bias_station ? ' - stazione ' + zoneObj.bias_station + ' non recente' : '') + '):');
      if (currentSnap) {
        var dirNameP = currentSnap.wind_dir !== null ? dirs16p[Math.round(currentSnap.wind_dir/22.5)%16] : '--';
        pLines.push('- Vento OM: ' + (currentSnap.wind_speed||'--') + 'kn da ' + dirNameP + ' (' + (currentSnap.wind_dir||'--') + 'deg)');
        pLines.push('- Pressione: ' + (currentSnap.pressure||'--') + 'hPa - ' + pressureTrend);
      }
      pLines.push('');
      pLines.push('PREVISIONE OM' + (biasCorr !== 0 ? ' BIAS-CORRETTA' : '') + ':');
    }

    // LIVELLO 3: OM forecast bias-corretto
    var fcDirs = dirs16p;
    [1,3,6,9,12].forEach(function(th) {
      var fc = omForecastHours['h' + th];
      if (fc) {
        var rawW = fc.wind_kt;
        var corrW = biasCorr !== 0 ? Math.round((rawW + biasCorr) * 10) / 10 : rawW;
        var fcDirN = fc.dir !== null ? fcDirs[Math.round(fc.dir/22.5)%16] : '--';
        var conf = th >= 12 ? ' [confidenza minore]' : '';
        var corrNote = biasCorr !== 0 ? ' (OM raw: ' + rawW + ' kn, bias: ' + (biasCorr>=0?'+':'') + biasCorr + ' kn, n=' + biasStatZone.n_wind + ')' : '';
        pLines.push('- H+' + th + ': ' + corrW + ' kn da ' + fcDirN + corrNote + conf);
      }
    });
    pLines.push('');

    // Pressione e onde da currentSnap (OM)
    if (currentSnap) {
      pLines.push('DATI OM AGGIUNTIVI:');
      pLines.push('- Pressione: ' + (currentSnap.pressure||'--') + 'hPa - ' + pressureTrend);
      if (currentSnap.wave_height) pLines.push('- Onda: ' + currentSnap.wave_height + 'm, periodo: ' + (currentSnap.wave_period||'--') + 's');
      if (currentSnap.ifs_wind_speed !== null && currentSnap.ifs_wind_speed !== undefined) {
        var ifsDirName2 = currentSnap.ifs_wind_dir !== null ? dirs16p[Math.round(currentSnap.ifs_wind_dir/22.5)%16] : '--';
        pLines.push('- IFS ECMWF: ' + currentSnap.ifs_wind_speed + 'kn da ' + ifsDirName2);
      }
      if (currentSnap.cape != null && currentSnap.cape > 100) {
        pLines.push('- CAPE: ' + Math.round(currentSnap.cape) + ' J/kg' + (currentSnap.cape > 500 ? ' -- instabilita significativa' : ''));
      }
      pLines.push('');
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
    pLines.push('Basandoti su questi dati, analizza la situazione e fornisci la previsione nel formato richiesto.');
    var prompt = pLines.join('\n');

        // Call Claude Sonnet
    var systemPrompt = 'Sei un meteorologo marino esperto del Tirreno settentrionale e Arcipelago Toscano. ' +
      'Rispondi SEMPRE con questo formato esatto, senza variazioni:\n' +
      'PREVISIONE_LOCALE:\n' +
      '- H+1: X kn da DIR\n' +
      '- H+3: X kn da DIR\n' +
      '- H+6: X kn da DIR\n' +
      '- H+9: X kn da DIR\n' +
      '- H+12: X kn da DIR\n' +
      'Raffica max: X kn (attesa a H+N)\n' +
      'Onda: Xm a H+3 | Xm a H+6 | Xm a H+12\n' +
      // SEZIONE DESCRITTIVA COMMENTATA - riattivarla quando serve
      // '\nCONFIDENZA: bassa/media/alta - motivazione in una riga\n' +
      // 'PATTERN: pattern sinottico in una riga\n' +
      // 'CONSIGLIO: indicazione operativa in una riga\n' +
      '\n' +
      'Usa sempre il formato "X kn" con numero decimale (es. 7.5 kn). ' +
      'Non usare range (es. 6-8 kn), scrivi il valore centrale (7.0 kn). ' +
      'Non aggiungere sezioni extra, analisi, commenti o spiegazioni. Solo i dati numerici nel formato indicato. Basati SOLO sui dati forniti.';

    var systemPromptFast = 'Sei un meteorologo marino esperto del Tirreno settentrionale. ' +
      'Rispondi SEMPRE con questo formato esatto:\n' +
      'PREVISIONE_LOCALE:\n' +
      '- H+1: X kn da DIR\n' +
      '- H+3: X kn da DIR\n' +
      '- H+6: X kn da DIR\n' +
      '- H+9: X kn da DIR\n' +
      '- H+12: X kn da DIR\n' +
      'Raffica max: X kn\n' +
      'Onda: Xm\n' +
      // SEZIONE DESCRITTIVA COMMENTATA - riattivarla quando serve
      // 'CONFIDENZA: bassa/media/alta - breve motivazione\n' +
      // 'PATTERN: una riga\n' +
      // 'CONSIGLIO: una riga\n' +
      'Usa valori singoli (non range). Nessuna analisi o commento. Solo i dati numerici nel formato indicato. Max 80 parole.';

    var aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: req.query.fast === '1' ? 'claude-haiku-4-5-20251001' : 'claude-sonnet-4-6',
        max_tokens: req.query.fast === '1' ? 300 : 600,
        system: req.query.fast === '1' ? systemPromptFast : systemPrompt,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    var aiData = await aiRes.json();
    var aiText = aiData.content && aiData.content[0] ? aiData.content[0].text : 'Errore risposta AI';

    // Save prediction to KV for later verification
    var now3 = new Date();
    var predMins15 = now3.getMinutes() < 15 ? '00' : now3.getMinutes() < 30 ? '15' : now3.getMinutes() < 45 ? '30' : '45';
    var predRomeHour = getNowRome().slice(0, 13); // "2026-04-30T09" senza :00
    var predKey = 'predict:' + zoneKey + ':' + predRomeHour + '-' + predMins15;
    // Extract structured wind values from AI text for easy comparison later
    var extractWindVal = function(text, h) {
      // Formato atteso dal system prompt: "- H+N: X.X kn da DIR"
      // Pattern primario: H+N: X.X kn
      var m = text.match(new RegExp('H\\+?' + h + '\\s*:\\s*([0-9]+\\.?[0-9]*)\\s*kn', 'i'));
      if (m) return parseFloat(m[1]);
      // Fallback per range (risposta non conforme): "H+N: X-Y kn" -> media
      var mr = text.match(new RegExp('H\\+?' + h + '\\s*:\\s*([0-9]+\\.?[0-9]*)\\s*[-\u2013\u2014]\\s*([0-9]+\\.?[0-9]*)\\s*kn', 'i'));
      if (mr) return Math.round((parseFloat(mr[1]) + parseFloat(mr[2])) / 2 * 10) / 10;
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
      forecast_h1: extractWindVal(aiText, '1'),
      forecast_h3: extractWindVal(aiText, '3'),
      forecast_h6: extractWindVal(aiText, '6'),
      forecast_h9: extractWindVal(aiText, '9'),
      forecast_h12: extractWindVal(aiText, '12'),
      slot: (function(){ var h = parseInt(getNowRome().slice(11,13),10); return h < 11 ? 'morning' : 'afternoon'; }())
    };
    if (kvUrl && kvToken) {
      var saveOk = await kvSet(predKey, predRecord, 2592000, kvUrl, kvToken); // 30 days TTL
      if (!saveOk) console.error('predict: kvSet failed for key', predKey);
      // Salva anche in lista unificata predict_history:zona
      var phList = await kvGet('predict_history:' + zoneKey, kvUrl, kvToken) || [];
      phList = Array.isArray(phList) ? phList : [];
      phList.unshift(Object.assign({}, predRecord, { source: 'predict' }));
      if (phList.length > 30) phList.length = 30;
      await kvSet('predict_history:' + zoneKey, phList, 2592000, kvUrl, kvToken);
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
if (action === 'situazione_verify') {
  if (!zoneKey || !ZONES[zoneKey]) return res.status(404).json({ error: 'Zona non trovata' });
  try {
    var verKeys = [];
    var verResults = [];
    // Cerca verifiche ultime 14 giorni
    var nowV = new Date();
    for (var dv = 0; dv < 14; dv++) {
      var dayTime = new Date(nowV.getTime() - dv * 86400000);
      for (var hv = 0; hv < 24; hv++) {
        var t = new Date(dayTime);
        t.setUTCHours(hv, 0, 0, 0);
        var tStr = t.toLocaleString('en-CA', {
          timeZone:'Europe/Rome', year:'numeric', month:'2-digit', day:'2-digit',
          hour:'2-digit', hour12:false
        });
        var tm = tStr.match(/([0-9]{4})-([0-9]{2})-([0-9]{2}), ([0-9]{2})/) ||
                 tStr.match(/([0-9]{4})-([0-9]{2})-([0-9]{2}),([0-9]{2})/);
        if (!tm) continue;
        var th = tm[1]+'-'+tm[2]+'-'+tm[3]+'T'+tm[4];
        var hvns = [6, 12]; for (var hvni = 0; hvni < hvns.length; hvni++) { var hvn = hvns[hvni];
          var vk = 'sit_verify:' + zoneKey + ':' + th + ':h' + hvn;
          verKeys.push(vk);
        }
      }
    }
    // Fetch in parallel batch
    var batchV = [];
    for (var ki = 0; ki < Math.min(verKeys.length, 100); ki++) {
      batchV.push(kvGet(verKeys[ki], kvUrl, kvToken).then(function(r){ return r; }));
    }
    var verRaw = await Promise.all(batchV);
    verResults = verRaw.filter(function(r){ return r !== null; });
    return res.status(200).json({ zone: zoneKey, count: verResults.length, verifications: verResults });
  } catch(e) { return res.status(500).json({ error: e.message }); }
}

if (action === 'situazione_get') {
  if (!zoneKey || !ZONES[zoneKey]) {
    return res.status(404).json({ error: 'Zona non trovata' });
  }
  try {
    // Prima cerca l'indice rapido (1 chiamata)
    var latestSit = await kvGet('situazione_latest:' + zoneKey, kvUrl, kvToken);
    if (latestSit) {
      return res.status(200).json({ zone: zoneKey, found: true, situazione: latestSit });
    }
    // Fallback: batch MGET di tutte le chiavi (48h x 2 slot) in una sola richiesta
    var slots2 = ['00','30'];
    var allKeys = [];
    for (var hh2 = 0; hh2 <= 47; hh2++) {
      var st2 = new Date(new Date().getTime() - hh2 * 3600000);
      var sh2 = st2.toLocaleString('sv-SE', {timeZone:'Europe/Rome'})
        .replace(' ','T').slice(0,13).replace(':','-');
      slots2.forEach(function(sl){ allKeys.push('situazione:' + zoneKey + ':' + sh2 + '-' + sl); });
    }
    var batchResults = await kvMGet(allKeys, kvUrl, kvToken);
    var sitFound = null;
    for (var bi = 0; bi < batchResults.length && !sitFound; bi++) {
      if (batchResults[bi]) { sitFound = batchResults[bi]; sitFound._key = allKeys[bi]; }
    }
    if (sitFound && kvUrl && kvToken) await kvSet('situazione_latest:' + zoneKey, sitFound, 86400 * 7, kvUrl, kvToken);
    if (!sitFound) return res.status(200).json({ zone: zoneKey, found: false });
    return res.status(200).json({ zone: zoneKey, found: true, situazione: sitFound });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

// action=backfill_actuals -- riempie actual_3h/6h/12h in predict_history per tutte le zone
if (action === 'migrate_history') {
  var mhSecret = req.query.secret || '';
  if (!requireSecret(req)) return res.status(401).json({ error: 'Unauthorized' });
  var mhZone = req.query.zone;
  if (!mhZone || !ZONES[mhZone]) return res.status(400).json({ error: 'Zona non valida' });
  // Controlla se la chiave esiste gia'
  var mhExists = await fetch(kvUrl, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + kvToken, 'Content-Type': 'application/json' },
    body: JSON.stringify(['EXISTS', 'predict_history:' + mhZone])
  });
  var mhExistsData = await mhExists.json();
  if (mhExistsData.result > 0) return res.status(200).json({ ok: false, msg: 'Chiave gia esistente - usa reset_history prima se necessario' });
  // Migra dai vecchi predict:zona:*
  var mhPromises = [];
  var mhNow = new Date();
  for (var mhD = 0; mhD < 20; mhD++) {
    for (var mhH = 0; mhH < 24; mhH++) {
      (function(dd, hh) {
        var t = new Date(mhNow.getTime() - dd*86400000 - hh*3600000);
        var tRome = t.toLocaleString('sv-SE', {timeZone:'Europe/Rome'}).replace(' ','T').slice(0,13).replace(':','-');
        ['00','15','30','45'].forEach(function(mm) {
          mhPromises.push(kvGet('predict:' + mhZone + ':' + tRome + '-' + mm, kvUrl, kvToken));
        });
      })(mhD, mhH);
    }
  }
  var mhResults = await Promise.all(mhPromises);
  var mhSeen = {};
  var mhList = mhResults.filter(function(p) {
    if (!p || !p.generated_at) return false;
    if (mhSeen[p.generated_at]) return false;
    mhSeen[p.generated_at] = true;
    return true;
  }).sort(function(a,b) { return new Date(b.generated_at) - new Date(a.generated_at); }).slice(0, 30);
  // Arricchisci con actual da snap
  var mhEnriched = await Promise.all(mhList.map(async function(p) {
    if (!p || !p.generated_at) return p;
    var gen = new Date(p.generated_at);
    var enriched = Object.assign({}, p);
    var hors = [['actual_1h','actual_1h_dir',1],['actual_3h','actual_3h_dir',3],['actual_6h','actual_6h_dir',6],['actual_9h','actual_9h_dir',9],['actual_12h','actual_12h_dir',12]];
    for (var hi = 0; hi < hors.length; hi++) {
      var hor = hors[hi];
      if (enriched[hor[0]] != null) continue;
      var target = new Date(gen.getTime() + hor[2] * 3600000);
      if (target > new Date()) continue;
      var tr = target.toLocaleString('sv-SE',{timeZone:'Europe/Rome'}).replace(' ','T').slice(0,13).replace(':','-');
      var m2 = target.getMinutes() < 30 ? '00' : '30';
      var snap = await kvGet('snap:' + mhZone + ':' + tr + '-' + m2, kvUrl, kvToken);
      if (snap && snap.wind_speed != null) { enriched[hor[0]] = snap.wind_speed; enriched[hor[1]] = snap.wind_dir; }
    }
    return enriched;
  }));
  await kvSet('predict_history:' + mhZone, mhEnriched, 2592000, kvUrl, kvToken);
  var nActuals = mhEnriched.filter(function(p){ return p.actual_3h != null || p.actual_6h != null; }).length;
  return res.status(200).json({ ok: true, zone: mhZone, migrated: mhEnriched.length, with_actuals: nActuals });
}

if (action === 'reset_history') {
  var rhSecret = req.query.secret || '';
  if (!requireSecret(req)) return res.status(401).json({ error: 'Unauthorized' });
  var rhZone = req.query.zone;
  if (!rhZone || !ZONES[rhZone]) return res.status(400).json({ error: 'Zona non valida' });
  await fetch(kvUrl, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + kvToken, 'Content-Type': 'application/json' },
    body: JSON.stringify(['DEL', 'predict_history:' + rhZone])
  });
  return res.status(200).json({ ok: true, deleted: 'predict_history:' + rhZone });
}

if (action === 'forecast_stats') {
  if (!zoneKey || !ZONES[zoneKey]) return res.status(404).json({ error: 'Zona non trovata' });
  try {
    var fsList = await kvGet('predict_history:' + zoneKey, kvUrl, kvToken) || [];
    if (!Array.isArray(fsList)) fsList = [];

    // Arricchisci con actual da snap se mancanti (stesso meccanismo di predict_history)
    var fsZoneObj = ZONES[zoneKey] || {};
    var fsBsSamples = fsZoneObj.bias_station ? await kvGet('bias_samples:' + fsZoneObj.bias_station, kvUrl, kvToken) || [] : [];
    var fsEnriched = await Promise.all(fsList.map(async function(p) {
      if (!p || !p.generated_at) return p;
      var hasActuals = p.actual_3h !== undefined || p.actual_6h !== undefined || p.actual_12h !== undefined;
      if (hasActuals) return p;
      var gen = new Date(p.generated_at);
      var cfrV = (fsBsSamples || []).filter(function(b){ return b.station && b.station.wind_kt !== null; });
      var snapActuals = {};
      if (cfrV.length > 0) {
        [['actual_3h','actual_3h_dir',3],['actual_6h','actual_6h_dir',6],['actual_12h','actual_12h_dir',12]].forEach(function(hor) {
          var target = new Date(gen.getTime() + hor[2] * 3600000);
          if (target > new Date()) return;
          var best = null, bestDiff = 25*60*1000;
          cfrV.forEach(function(b) {
            var diff = Math.abs(new Date(b.ts) - target);
            if (diff < bestDiff) { bestDiff = diff; best = b; }
          });
          if (best) { snapActuals[hor[0]] = best.station.wind_kt; snapActuals[hor[1]] = best.station.direction; }
        });
      } else {
        // Fallback snap
        var snapRes = await Promise.all([3,6,12].map(function(hh) {
          var t = new Date(gen.getTime() + hh * 3600000);
          if (t > new Date()) return Promise.resolve(null);
          var tr = t.toLocaleString('sv-SE',{timeZone:'Europe/Rome'}).replace(' ','T').slice(0,13).replace(':','-');
          var m = t.getMinutes() < 30 ? '00' : '30';
          return kvGet('snap:' + zoneKey + ':' + tr + '-' + m, kvUrl, kvToken);
        }));
        [['actual_3h','actual_3h_dir',0],['actual_6h','actual_6h_dir',1],['actual_12h','actual_12h_dir',2]].forEach(function(hor) {
          var s = snapRes[hor[2]];
          if (s && s.wind_speed != null) { snapActuals[hor[0]] = s.wind_speed; snapActuals[hor[1]] = s.wind_dir; }
        });
      }
      return Object.assign({}, p, snapActuals);
    }));
    fsList = fsEnriched;

    var verified = fsList.filter(function(p) {
      if (!p) return false;
      var a1  = p.actual_1h  != null ? p.actual_1h  : (p.prediction && p.prediction.actual_1h  != null ? p.prediction.actual_1h  : null);
      var a3  = p.actual_3h  != null ? p.actual_3h  : (p.prediction && p.prediction.actual_3h  != null ? p.prediction.actual_3h  : null);
      var a6  = p.actual_6h  != null ? p.actual_6h  : (p.prediction && p.prediction.actual_6h  != null ? p.prediction.actual_6h  : null);
      var a9  = p.actual_9h  != null ? p.actual_9h  : (p.prediction && p.prediction.actual_9h  != null ? p.prediction.actual_9h  : null);
      var a12 = p.actual_12h != null ? p.actual_12h : (p.prediction && p.prediction.actual_12h != null ? p.prediction.actual_12h : null);
      return a1 != null || a3 != null || a6 != null || a9 != null || a12 != null;
    });
    // Raggruppa per settimana ISO
    var weekMap = {};
    verified.forEach(function(p) {
      var ga = p.generated_at || (p.prediction && p.prediction.generated_at) || new Date().toISOString();
      var d = new Date(ga);
      var jan1 = new Date(d.getFullYear(), 0, 1);
      var week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
      var wk = d.getFullYear() + '-W' + String(week).padStart(2, '0');
      if (!weekMap[wk]) weekMap[wk] = { week: wk, h1: [], h3: [], h6: [], h9: [], h12: [], n: 0 };
      var w = weekMap[wk];
      w.n++;
      var getA = function(p, k){ return p[k] != null ? p[k] : (p.prediction && p.prediction[k] != null ? p.prediction[k] : null); };
      var getF = function(p, k){ return p[k] != null ? p[k] : (p.prediction && p.prediction[k] != null ? p.prediction[k] : null); };
      if (getA(p,'actual_1h') != null && getF(p,'forecast_h1') != null) w.h1.push(Math.abs(getA(p,'actual_1h') - getF(p,'forecast_h1')));
      if (getA(p,'actual_3h') != null && getF(p,'forecast_h3') != null) w.h3.push(Math.abs(getA(p,'actual_3h') - getF(p,'forecast_h3')));
      if (getA(p,'actual_6h') != null && getF(p,'forecast_h6') != null) w.h6.push(Math.abs(getA(p,'actual_6h') - getF(p,'forecast_h6')));
      if (getA(p,'actual_9h') != null && getF(p,'forecast_h9') != null) w.h9.push(Math.abs(getA(p,'actual_9h') - getF(p,'forecast_h9')));
      if (getA(p,'actual_12h') != null && getF(p,'forecast_h12') != null) w.h12.push(Math.abs(getA(p,'actual_12h') - getF(p,'forecast_h12')));
    });
    var avg = function(arr) { return arr.length ? Math.round(arr.reduce(function(a,b){return a+b;},0)/arr.length*10)/10 : null; };
    var weekly = Object.keys(weekMap).sort().map(function(wk) {
      var w = weekMap[wk];
      return { week: wk, h1_mae: avg(w.h1), h3_mae: avg(w.h3), h6_mae: avg(w.h6), h9_mae: avg(w.h9), h12_mae: avg(w.h12), n: w.n };
    });
    // Trend generale (prima meta vs seconda meta)
    var half = Math.floor(verified.length / 2);
    var calcMae = function(arr, key, fkey) {
      var errs = arr.filter(function(p){
        var av = p[key] != null ? p[key] : (p.prediction && p.prediction[key] != null ? p.prediction[key] : null);
        var fv = p[fkey] != null ? p[fkey] : (p.prediction && p.prediction[fkey] != null ? p.prediction[fkey] : null);
        return av != null && fv != null;
      }).map(function(p){
        var av = p[key] != null ? p[key] : p.prediction[key];
        var fv = p[fkey] != null ? p[fkey] : p.prediction[fkey];
        return Math.abs(av - fv);
      });
      return avg(errs);
    };
    var early = verified.slice(half), late = verified.slice(0, half);
    var trend = {
      early_h6_mae: calcMae(early, 'actual_6h', 'forecast_h6'),
      late_h6_mae: calcMae(late, 'actual_6h', 'forecast_h6'),
      improving: null
    };
    if (trend.early_h6_mae !== null && trend.late_h6_mae !== null) {
      trend.improving = trend.late_h6_mae < trend.early_h6_mae;
    }
    var biasPred = await kvGet('predict_bias:' + zoneKey, kvUrl, kvToken);
    // Se bias non in Redis, calcolalo inline dai dati verificati
    var currentBias = biasPred ? biasPred.bias : null;
    if (!currentBias && verified.length >= 3) {
      var inlineErrors = {h1:[],h3:[],h6:[],h9:[],h12:[]};
      verified.forEach(function(p) {
        var getA = function(k){ return p[k] != null ? p[k] : (p.prediction && p.prediction[k] != null ? p.prediction[k] : null); };
        var getF = function(k){ return p[k] != null ? p[k] : (p.prediction && p.prediction[k] != null ? p.prediction[k] : null); };
        ['h1','h3','h6','h9','h12'].forEach(function(h) {
          var hNum = h.slice(1); // '1','3','6','9','12'
          var av = getA('actual_' + hNum + 'h'); var fv = getF('forecast_' + h);
          if (av != null && fv != null) inlineErrors[h].push(av - fv);
        });
      });
      currentBias = {};
      ['h1','h3','h6','h9','h12'].forEach(function(h) {
        var errs = inlineErrors[h];
        if (errs.length < 3) { currentBias[h] = {n:errs.length, mean:null, mae:null, std:null}; return; }
        var mean = errs.reduce(function(a,b){return a+b;},0)/errs.length;
        var mae = errs.map(function(e){return Math.abs(e);}).reduce(function(a,b){return a+b;},0)/errs.length;
        var std = Math.sqrt(errs.map(function(e){return (e-mean)*(e-mean);}).reduce(function(a,b){return a+b;},0)/errs.length);
        currentBias[h] = {n:errs.length, mean:Math.round(mean*10)/10, mae:Math.round(mae*10)/10, std:Math.round(std*10)/10};
      });
    }
    return res.status(200).json({
      zone: zoneKey, name: ZONES[zoneKey].name,
      total: fsList.length, verified: verified.length,
      weekly_mae: weekly,
      current_bias: currentBias,
      trend: trend
    });
  } catch(e) { return res.status(500).json({ error: e.message }); }
}

if (action === 'backfill_actuals') {
  var bfSecret = req.query.secret || '';
  if (!requireSecret(req)) return res.status(401).json({ error: 'Unauthorized' });
  var bfZones = Object.keys(ZONES).filter(function(k){ return ZONES[k].enabled !== false && ZONES[k].bias_station; });
  var bfResults = [];
  for (var bfi = 0; bfi < bfZones.length; bfi++) {
    var bfZk = bfZones[bfi];
    var bfZone = ZONES[bfZk];
    try {
      var bfList = await kvGet('predict_history:' + bfZk, kvUrl, kvToken) || [];
      if (!Array.isArray(bfList) || bfList.length === 0) { bfResults.push({zone:bfZk, skipped:'no_predictions'}); continue; }
      // Carica bias_samples per questa zona (ultime 100 osservazioni)
      var bfSamples = await kvGet('bias_samples:' + bfZone.bias_station, kvUrl, kvToken) || [];
      // Peso quota: riduce affidabilita stazioni in quota
      var bfQuota = bfZone.bias_quota || 0;
      var bfWeight = bfQuota <= 15 ? 1.0 : bfQuota <= 100 ? 0.85 : bfQuota <= 200 ? 0.65 : 0.45;
      // Se bias_samples vuoto, prova con snapshot zona (wind_speed osservato)
      var bfSnapSources = [];
      var bfSamplesValid = (bfSamples || []).filter(function(s){ return s && s.station && s.station.wind_kt != null; });
      if (bfSamplesValid.length === 0 && kvUrl && kvToken) {
        // Legge ultimi 48 snapshot orari della zona (entrambi gli slot :00 e :30)
        var bfSnapKeys = [];
        var bfNow2 = new Date();
        for (var bfSi = 0; bfSi < 48; bfSi++) {
          var bfSt = new Date(bfNow2.getTime() - bfSi * 3600000);
          var bfSRome = bfSt.toLocaleString('sv-SE', {timeZone:'Europe/Rome'}).replace(' ','T').slice(0,13).replace(':','-');
          bfSnapKeys.push('snap:' + bfZk + ':' + bfSRome + '-00');
          bfSnapKeys.push('snap:' + bfZk + ':' + bfSRome + '-30');
        }
        var bfSnapResults = await kvMGet(bfSnapKeys, kvUrl, kvToken);
        bfSnapResults.forEach(function(snap) {
          if (!snap || snap.wind_speed == null) return;
          bfSnapSources.push({
            ts: snap.ts || snap.time || new Date().toISOString(),
            station: { wind_kt: snap.wind_speed, direction: snap.wind_dir }
          });
        });
      }
      var bfSourceData = bfSamplesValid.length > 0 ? bfSamplesValid : bfSnapSources;
      var bfUpdated = 0;
      bfList = bfList.map(function(item) {
        if (!item.generated_at) return item;
        var gen = new Date(item.generated_at);
        [['actual_1h','actual_1h_dir',1], ['actual_3h','actual_3h_dir',3], ['actual_6h','actual_6h_dir',6], ['actual_9h','actual_9h_dir',9], ['actual_12h','actual_12h_dir',12]].forEach(function(hor) {
          if (item[hor[0]] !== undefined && item[hor[0]] !== null) return;
          var target = new Date(gen.getTime() + hor[2] * 3600000);
          if (target > new Date()) return;
          var best = null, bestDiff = 25 * 60 * 1000;
          (bfSourceData || []).forEach(function(s) {
            if (!s || !s.ts || !s.station || s.station.wind_kt === null || s.station.wind_kt === undefined) return;
            var diff = Math.abs(new Date(s.ts) - target);
            if (diff < bestDiff) { bestDiff = diff; best = s; }
          });
          if (best) {
            item[hor[0]] = Math.round(best.station.wind_kt * bfWeight * 10) / 10;
            item[hor[1]] = best.station.direction;
            bfUpdated++;
          }
        });
        return item;
      });
      if (bfUpdated > 0) {
        await kvSet('predict_history:' + bfZk, bfList, 2592000, kvUrl, kvToken);
      }
      bfResults.push({zone:bfZk, updated:bfUpdated, samples:bfSamples.length, weight:bfWeight});
    } catch(e) { bfResults.push({zone:bfZk, error:e.message}); }
  }
  // Dopo backfill ricalcola bias per tutte le zone aggiornate
  for (var bfi2 = 0; bfi2 < bfZones.length; bfi2++) {
    var bfZk2 = bfZones[bfi2];
    try {
      var bfList2 = await kvGet('predict_history:' + bfZk2, kvUrl, kvToken) || [];
      var bfErrors = {h1:[], h3:[], h6:[], h9:[], h12:[]};
      (bfList2 || []).forEach(function(item) {
        var getAct = function(item, k){ return item[k] != null ? item[k] : (item.prediction && item.prediction[k] != null ? item.prediction[k] : null); };
        var getFc = function(item, k){ return item[k] != null ? item[k] : (item.prediction && item.prediction[k] != null ? item.prediction[k] : null); };
        if (getAct(item,'actual_1h') !== null && getFc(item,'forecast_h1') !== null) bfErrors.h1.push(getAct(item,'actual_1h') - getFc(item,'forecast_h1'));
        if (getAct(item,'actual_3h') !== null && getFc(item,'forecast_h3') !== null) bfErrors.h3.push(getAct(item,'actual_3h') - getFc(item,'forecast_h3'));
        if (getAct(item,'actual_6h') !== null && getFc(item,'forecast_h6') !== null) bfErrors.h6.push(getAct(item,'actual_6h') - getFc(item,'forecast_h6'));
        if (getAct(item,'actual_9h') !== null && getFc(item,'forecast_h9') !== null) bfErrors.h9.push(getAct(item,'actual_9h') - getFc(item,'forecast_h9'));
        if (getAct(item,'actual_12h') !== null && getFc(item,'forecast_h12') !== null) bfErrors.h12.push(getAct(item,'actual_12h') - getFc(item,'forecast_h12'));
      });
      var bfBias = {};
      ['h1','h3','h6','h9','h12'].forEach(function(h) {
        var errs = bfErrors[h];
        if (errs.length < 3) { bfBias[h] = {n:errs.length, mean:null, mae:null, std:null}; return; }
        // bias medio con segno: positivo = sottostima, negativo = sovrastima
        var mean = errs.reduce(function(a,b){return a+b;},0) / errs.length;
        // MAE: media degli errori assoluti - misura l'entita' reale dell'errore
        var mae = errs.map(function(e){return Math.abs(e);}).reduce(function(a,b){return a+b;},0) / errs.length;
        var std = Math.sqrt(errs.map(function(e){return (e-mean)*(e-mean);}).reduce(function(a,b){return a+b;},0) / errs.length);
        bfBias[h] = {n:errs.length, mean:Math.round(mean*10)/10, mae:Math.round(mae*10)/10, std:Math.round(std*10)/10};
      });
      await kvSet('predict_bias:' + bfZk2, {zone:bfZk2, bias:bfBias, ts:new Date().toISOString()}, 2592000, kvUrl, kvToken);
    } catch(e) {}
  }
  return res.status(200).json({ok:true, zones_processed:bfZones.length, results:bfResults});
}

if (action === 'predict_history') {
  if (!zoneKey || !ZONES[zoneKey]) {
    return res.status(404).json({ error: 'Zona non trovata' });
  }
  try {
    // Legge dalla lista unificata predict_history:zona (1 GET invece di 672)
    var phRaw = await kvGet('predict_history:' + zoneKey, kvUrl, kvToken) || [];
    var predictions4 = Array.isArray(phRaw) ? phRaw : [];

    // Migrazione one-shot: se lista vuota cerca nei vecchi predict:zona:* e popola la lista
    if (predictions4.length === 0 && kvUrl && kvToken) {
      var migPromises = [];
      var now4 = new Date();
      for (var pd4 = 0; pd4 < 14; pd4++) {
        for (var ph4 = 0; ph4 < 24; ph4++) {
          (function(dd, hh) {
            var t = new Date(now4.getTime() - dd*86400000 - hh*3600000);
            var tRome = t.toLocaleString('sv-SE', {timeZone:'Europe/Rome'}).replace(' ','T').slice(0,13).replace(':','-');
            ['00','15','30','45'].forEach(function(mm) {
              migPromises.push(kvGet('predict:' + zoneKey + ':' + tRome + '-' + mm, kvUrl, kvToken));
            });
          })(pd4, ph4);
        }
      }
      var migResults = await Promise.all(migPromises);
      var seen4 = {};
      predictions4 = migResults.filter(function(p) {
        if (!p || !p.generated_at) return false;
        if (seen4[p.generated_at]) return false;
        seen4[p.generated_at] = true;
        return true;
      }).sort(function(a,b) { return new Date(b.generated_at) - new Date(a.generated_at); }).slice(0, 20);
      // Salva lista migrata per le prossime chiamate
      if (predictions4.length > 0) await kvSet('predict_history:' + zoneKey, predictions4, 2592000, kvUrl, kvToken);
    }

    predictions4.sort(function(a,b) { return new Date(b.generated_at) - new Date(a.generated_at); });

    // For each prediction, find actual snapshot at h6 and h12
    var top10 = predictions4.slice(0, 10);
    var actualPromises = [];
    top10.forEach(function(p) {
      var genTime = new Date(p.generated_at);
      // Se actuals gia presenti nel record (da backfill_actuals) non fare lookup Redis
      if (p.actual_3h !== undefined || p.actual_6h !== undefined || p.actual_12h !== undefined) {
        actualPromises.push(Promise.resolve([
          p.actual_3h !== null && p.actual_3h !== undefined ? {wind_speed: p.actual_3h, wind_dir: p.actual_3h_dir} : null,
          p.actual_6h !== null && p.actual_6h !== undefined ? {wind_speed: p.actual_6h, wind_dir: p.actual_6h_dir} : null,
          p.actual_12h !== null && p.actual_12h !== undefined ? {wind_speed: p.actual_12h, wind_dir: p.actual_12h_dir} : null
        ]));
        return;
      }
      // Lookup Redis solo per items senza actuals
      actualPromises.push((async function(zone, gen) {
        var results = [null, null, null];
        var zObjV = ZONES[zone];
        if (zObjV && zObjV.bias_station) {
          var bsSamplesV = await kvGet('bias_samples:' + zObjV.bias_station, kvUrl, kvToken) || [];
          var cfrV = bsSamplesV.filter(function(b){ return b.station && b.station.wind_kt !== null; });
          [3,6,12].forEach(function(hh, idx) {
            var target = new Date(gen.getTime() + hh * 3600000);
            var best = null, bestDiff = 25 * 60 * 1000;
            cfrV.forEach(function(b) {
              var diff = Math.abs(new Date(b.ts) - target);
              if (diff < bestDiff) { bestDiff = diff; best = b; }
            });
            if (best) results[idx] = { wind_speed: best.station.wind_kt, wind_dir: best.station.direction };
          });
          return results;
        }
        // Fallback snap
        var snapResults = await Promise.all([3,6,12].map(function(hh) {
          var t = new Date(gen.getTime() + hh * 3600000);
          var m = t.getMinutes() < 30 ? '00' : '30';
          var tr = t.toLocaleString('sv-SE',{timeZone:'Europe/Rome'}).replace(' ','T').slice(0,13).replace(':','-').replace(':','-');
          return kvGet('snap:' + zone + ':' + tr + '-' + m, kvUrl, kvToken);
        }));
        return snapResults.map(function(s){ return s ? {wind_speed: s.wind_speed, wind_dir: s.wind_dir} : null; });
      })(zoneKey, genTime));
    });
    var actuals = await Promise.all(actualPromises);

    var withActual = top10.map(function(p, i) {
      var res = actuals[i] || [null, null, null];
      var snap3 = res[0], snap6 = res[1], snap12 = res[2];
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
    var nowRome2 = getNowRome();
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

// /api/engine?action=scrape_stations - campiona stazioni MeteoNetwork e confronta con OM
// Stazioni attive: livorno (tsc265), canale_piombino (tsc228)
// Capraia tsc578: no licenza  -  Elba tsc621, Viareggio tsc431: rate limit
if (action === 'scrape_stations') {
  try {
    var bsSecret = req.query.secret || '';
    var bsAdminKey = req.query.k || '';
    var bsCronSecret = process.env.CRON_SECRET || '';
    var bsAdminOk = bsAdminKey === 'mdi';
    if (!bsAdminOk && (!bsCronSecret || bsSecret !== bsCronSecret)) return res.status(401).json({ error: 'Unauthorized' });
    var bsToken = process.env.METEONETWORK_TOKEN || '';
    var bsStations = [
      { id: 'livorno',         name: 'Quercianella (MNW)',  mnwKey: 'livorno',         lat: 43.465, lon: 10.347 },
      { id: 'canale_piombino', name: 'Piombino',            mnwKey: 'canale_piombino', lat: 42.920, lon: 10.530 },
      { id: 'elba_nord',       name: 'Elba Nord',           mnwKey: 'elba_nord',       lat: 42.850, lon: 10.320 },
      { id: 'viareggio',       name: 'Viareggio',           mnwKey: 'viareggio',       lat: 43.870, lon: 10.230 }
    ];
    // Elba Nord tsc621, Viareggio tsc508: api_error (no licenza MNW al momento)
    // Filtro opzionale: ?station=livorno chiama solo quella stazione
    var bsFilter = req.query.station || null;
    if (bsFilter) bsStations = bsStations.filter(function(s){ return s.id === bsFilter; });
    var bsTs = new Date().toISOString();
    var bsResults = [];
    for (var bsI = 0; bsI < bsStations.length; bsI++) {
      var bsSt = bsStations[bsI];
      try {
        var bsMnwRaw = await fetchMeteoNetwork(bsSt.mnwKey, bsToken);
        var bsMnwErr = (bsMnwRaw && bsMnwRaw._error) ? bsMnwRaw._error : null;
        var bsMnw = (bsMnwRaw && !bsMnwRaw._error) ? bsMnwRaw : null;
        var bsOmUrl = 'https://api.open-meteo.com/v1/forecast'
          + '?latitude=' + bsSt.lat + '&longitude=' + bsSt.lon
          + '&current=wind_speed_10m,wind_gusts_10m,wind_direction_10m,surface_pressure'
          + '&wind_speed_unit=kn';
        var bsOmJson = await fetch(bsOmUrl).then(function(r){ return r.json(); });
        var bsOm = {
          wind_kt:     bsOmJson.current ? Math.round(bsOmJson.current.wind_speed_10m  * 10) / 10 : null,
          gust_kt:     bsOmJson.current ? Math.round(bsOmJson.current.wind_gusts_10m  * 10) / 10 : null,
          direction:   bsOmJson.current ? bsOmJson.current.wind_direction_10m : null,
          pressure_mb: bsOmJson.current ? Math.round(bsOmJson.current.surface_pressure * 10) / 10 : null
        };
        // AROME (via Open-Meteo /v1/meteofrance), per confronto MAE vs OM (v2 - 16 giugno)
        var bsAromeUrl = 'https://api.open-meteo.com/v1/meteofrance'
          + '?latitude=' + bsSt.lat + '&longitude=' + bsSt.lon
          + '&hourly=wind_speed_10m,wind_gusts_10m,wind_direction_10m&wind_speed_unit=kn&models=arome_france&forecast_days=1';
        var bsArome = { wind_kt: null, gust_kt: null, direction: null };
        try {
          var bsAromeJson = await fetch(bsAromeUrl).then(function(r){ return r.json(); });
          if (bsAromeJson && bsAromeJson.hourly && Array.isArray(bsAromeJson.hourly.time)) {
            var bsNowMs = Date.now();
            var bsBestIdx = -1, bsBestDiff = Infinity;
            for (var bsJ = 0; bsJ < bsAromeJson.hourly.time.length; bsJ++) {
              var bsDiff = Math.abs(new Date(bsAromeJson.hourly.time[bsJ] + 'Z').getTime() - bsNowMs);
              if (bsDiff < bsBestDiff) { bsBestDiff = bsDiff; bsBestIdx = bsJ; }
            }
            if (bsBestIdx !== -1) {
              var bsW = bsAromeJson.hourly.wind_speed_10m ? bsAromeJson.hourly.wind_speed_10m[bsBestIdx] : null;
              var bsG = bsAromeJson.hourly.wind_gusts_10m ? bsAromeJson.hourly.wind_gusts_10m[bsBestIdx] : null;
              var bsD = bsAromeJson.hourly.wind_direction_10m ? bsAromeJson.hourly.wind_direction_10m[bsBestIdx] : null;
              bsArome = {
                wind_kt: (bsW !== null && bsW !== undefined) ? Math.round(bsW * 10) / 10 : null,
                gust_kt: (bsG !== null && bsG !== undefined) ? Math.round(bsG * 10) / 10 : null,
                direction: (bsD !== null && bsD !== undefined) ? Math.round(bsD) : null
              };
            }
          }
        } catch(bsAromeE) {}
        var bsStation = bsMnw ? {
          wind_kt:     bsMnw.wind_speed_mnw,
          direction:   bsMnw.wind_dir_mnw,
          gust_kt:     bsMnw.wind_gust_mnw,
          pressure_mb: bsMnw.pressure_mnw,
          ts_station:  bsMnw.ts_mnw,
          source:      'meteonetwork'
        } : null;
        var bsSample = {
          ts: bsTs,
          station: bsStation,
          om: bsOm,
          arome: bsArome,
          delta: bsStation ? {
            wind_kt: (bsStation.wind_kt != null && bsOm.wind_kt != null)
              ? Math.round((bsStation.wind_kt - bsOm.wind_kt) * 10) / 10 : null,
            gust_kt: (bsStation.gust_kt != null && bsOm.gust_kt != null)
              ? Math.round((bsStation.gust_kt - bsOm.gust_kt) * 10) / 10 : null
          } : null,
          delta_arome: bsStation ? {
            wind_kt: (bsStation.wind_kt != null && bsArome.wind_kt != null)
              ? Math.round((bsStation.wind_kt - bsArome.wind_kt) * 10) / 10 : null,
            gust_kt: (bsStation.gust_kt != null && bsArome.gust_kt != null)
              ? Math.round((bsStation.gust_kt - bsArome.gust_kt) * 10) / 10 : null
          } : null
        };
        var bsKey = 'bias_samples:' + bsSt.id;
        var bsExisting = await kvGet(bsKey, kvUrl, kvToken);
        var bsList = Array.isArray(bsExisting) ? bsExisting : [];
        bsList.unshift(bsSample);
        if (bsList.length > 100) bsList.length = 100;
        await kvSet(bsKey, bsList, 31536000, kvUrl, kvToken);
        bsResults.push({ id: bsSt.id, name: bsSt.name, ok: !!bsStation, mnw_error: bsMnwErr || undefined, sample: bsSample });
      } catch(bsE) {
        bsResults.push({ id: bsSt.id, name: bsSt.name, ok: false, error: bsE.message });
      }
    }
    var bsStats = await biasComputeStations(kvUrl, kvToken);
    // Filtra stats solo alle stazioni effettivamente campionate
    var bsStatsFilt = {};
    bsResults.forEach(function(r){ if (bsStats[r.id] !== undefined) bsStatsFilt[r.id] = bsStats[r.id]; });
    return res.status(200).json({ ts: bsTs, results: bsResults, stats: bsStatsFilt });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

// /api/engine?action=snap_debug&zone=bocca_arno&k=mdi -- verifica chiavi snap in Redis
if (action === 'snap_debug') {
  if (!requireSecret(req)) return res.status(401).json({ error: 'Unauthorized' });
  var sdZone = req.query.zone || 'bocca_arno';
  try {
    var sdNow = new Date();
    var sdResults = [];
    for (var sdI = 0; sdI < 12; sdI++) {
      var sdD = new Date(sdNow.getTime() - sdI * 1800000);
      var sdMins = sdD.getMinutes() < 30 ? '00' : '30';
      var sdKey = 'snap:' + sdZone + ':' + sdD.toISOString().slice(0,13) + '-' + sdMins;
      var sdVal = await kvGet(sdKey, kvUrl, kvToken);
      sdResults.push({ key: sdKey, found: sdVal !== null, wind_speed: sdVal ? sdVal.wind_speed : null, obs_source: sdVal ? (sdVal.obs_source || 'om') : null });
    }
    return res.status(200).json({ zone: sdZone, slots: sdResults });
  } catch(e) { return res.status(500).json({ error: e.message }); }
}

// /api/engine?action=bias_history&station=livorno&limit=20
if (action === 'bias_history') {
  try {
    var bhStation = req.query.station || 'livorno';
    var bhLimit = Math.min(parseInt(req.query.limit || '20'), 100);
    var bhKey = 'bias_samples:' + bhStation;
    var bhList = await kvGet(bhKey, kvUrl, kvToken);
    var bhSamples = Array.isArray(bhList) ? bhList.slice(0, bhLimit) : [];
    return res.status(200).json({ station: bhStation, samples: bhSamples });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

// /api/engine?action=bias_reset&station=livorno - svuota campioni stazione (richiede secret)
if (action === 'bias_reset') {
  try {
    var brSecret = req.query.secret || '';
    var cronSecret = process.env.CRON_SECRET || '';
    var brK = req.query.k || '';
    if (brK !== 'mdi' && (!cronSecret || brSecret !== cronSecret)) return res.status(401).json({ error: 'Unauthorized' });
    var brStation = req.query.station || 'livorno';
    await kvSet('bias_samples:' + brStation, [], 31536000, kvUrl, kvToken);
    await kvSet('bias_stats:' + brStation, null, 1, kvUrl, kvToken);
    return res.status(200).json({ ok: true, station: brStation, message: 'Campioni azzerati' });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

// /api/engine?action=bias_stats - mostra statistiche calcolate per tutte le stazioni
if (action === 'compute_bias') {
  if (!requireSecret(req)) return res.status(401).json({ error: 'Unauthorized' });
  try {
    var cbResults = await biasComputeStations(kvUrl, kvToken);
    return res.status(200).json({ ok: true, results: cbResults });
  } catch(e) { return res.status(500).json({ error: e.message }); }
}

if (action === 'bias_stats') {
  try {
    var btsLiv = await kvGet('bias_stats:livorno', kvUrl, kvToken);
    var btsPio = await kvGet('bias_stats:canale_piombino', kvUrl, kvToken);
    return res.status(200).json({
      livorno:         btsLiv  || null,
      canale_piombino: btsPio  || null
    });
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
engine: 'nautilus-engine v2.13.15 - by mdisailor engine',
endpoints: ['/api/engine?action=ping', '/api/engine?action=zones', '/api/engine?action=zone&zone={key}']
});
};

//  LAMMA BIAS CRON 
// Chiamato dal cron 23:50 -- raccoglie dati LaMMA della giornata e calcola bias vs OM

var LAMMA_STATIONS = [
  { nome: 'BOCCA_D_ARNO',      id: 430,  zona: 'viareggio'       },
  { nome: 'CAPRAIA',            id: 4652, zona: 'capraia'          },
  { nome: 'VIAREGGIO',          id: 4636, zona: 'viareggio'        },
  { nome: 'SAN_VINCENZO',       id: 467,  zona: 'canale_piombino'  },
  { nome: 'FOLLONICA__LAMMA_',  id: 2420, zona: 'punta_ala'        },
  { nome: 'GIGLIO_PORTO',       id: 3927, zona: 'giglio'           },
  { nome: 'GIGLIO_CASTELLO',    id: 3931, zona: 'giglio'           },
  { nome: 'PORTOFERRAIO',       id: 466,  zona: 'elba_nord'        },
  { nome: 'GORGONA',            id: 1656, zona: 'livorno'          },
  { nome: 'MONTECRISTO__LAMMA_',id: 2424, zona: 'giglio'           },
  { nome: 'MONTE_ARGENTARIO',   id: 1529, zona: 'giglio'           },
  { nome: 'GROSSETO__LAMMA_',   id: 3954, zona: 'punta_ala'        },
  { nome: 'CECINA',             id: 462,  zona: 'livorno'          },
  { nome: 'DONORATICO',         id: 463,  zona: 'canale_piombino'  },
  { nome: 'QUERCIANELLA',       id: 2475, zona: 'livorno'          },
  { nome: 'LIDO_DI_CAMAIORE',   id: 507,  zona: 'viareggio'        },
  { nome: 'FORTE_DEI_MARMI',    id: 2530, zona: 'viareggio'        },
  { nome: 'TORRE_DEL_LAGO',     id: 363,  zona: 'viareggio'        },
  { nome: 'CAPALBIO',           id: 531,  zona: 'giglio'           },
  { nome: 'ALBERESE',           id: 551,  zona: 'punta_ala'        },
  { nome: 'PIETRASANTA',        id: 9338, zona: 'viareggio'        },
  { nome: 'AVENZA',             id: 2526, zona: 'la_spezia'        },
  { nome: 'VADA',                id: 3950, zona: 'vada'             }, // 17 giugno - nome WFS da verificare al primo cron
];

async function fetchLammaDayData(stazione) {
  // Scarica tutti i dati della giornata per una stazione
  var url = 'https://geoportale.lamma.rete.toscana.it/geoserver/ows' +
    '?service=WFS&version=2.0.0&request=GetFeature' +
    '&typeName=lamma_stazioni:vento' +
    '&outputFormat=application/json' +
    '&CQL_FILTER=nome=' + encodeURIComponent(stazione.nome);
  try {
    var res = await fetch(url);
    if (!res.ok) return null;
    var data = await res.json();
    if (!data.features || data.features.length === 0) return null;
    // Calcola media vento della giornata
    var valori = data.features
      .filter(function(f) { return f.properties.vven_ms != null; })
      .map(function(f) { return f.properties.vven_ms * 1.944; }); // m/s -> kn
    if (valori.length === 0) return null;
    var media = valori.reduce(function(a, b) { return a + b; }, 0) / valori.length;
    var max = Math.max.apply(null, valori);
    // Ultima lettura
    var ultima = data.features[data.features.length - 1].properties;
    return {
      nome: stazione.nome,
      zona: stazione.zona,
      wind_avg_kn: Math.round(media * 10) / 10,
      wind_max_kn: Math.round(max * 10) / 10,
      wind_last_kn: Math.round(ultima.vven_ms * 1.944 * 10) / 10,
      wind_dir: ultima.dven_gr,
      samples: valori.length,
      last_ts: ultima.data_ora
    };
  } catch(e) {
    return null;
  }
}

async function runLammaBiasCron(kvUrl, kvToken) {
  console.log('LAMMA BIAS CRON start');
  var results = {};

  // Fetch tutte le stazioni in parallelo
  var fetches = LAMMA_STATIONS.map(function(s) { return fetchLammaDayData(s); });
  var datas = await Promise.all(fetches);

  // Raggruppa per zona e calcola media
  var byZona = {};
  datas.forEach(function(d) {
    if (!d) return;
    if (!byZona[d.zona]) byZona[d.zona] = [];
    byZona[d.zona].push(d);
  });

  // Per ogni zona calcola media LaMMA e confronta con OM snapshot
  var zonaKeys = Object.keys(byZona);
  for (var zi = 0; zi < zonaKeys.length; zi++) {
    var zona = zonaKeys[zi];
    var staz = byZona[zona];
    var lammaAvg = staz.reduce(function(s, d) { return s + d.wind_avg_kn; }, 0) / staz.length;
    var lammaMax = Math.max.apply(null, staz.map(function(d) { return d.wind_max_kn; }));

    // Legge snapshot OM per confronto
    try {
      var snapKey = 'snap:' + zona + ':' + getNowRome().slice(0, 13) + '-00';
      var snapRaw = await kvGet(snapKey, kvUrl, kvToken);
      var snap = snapRaw ? JSON.parse(snapRaw) : null;
      var omAvg = snap ? (snap.wind_speed || 0) : 0;
      var bias = omAvg > 0 ? Math.round((lammaAvg - omAvg) * 10) / 10 : null;

      // Salva bias in KV
      var biasKey = 'lamma_bias:' + zona;
      var biasRecord = {
        zona: zona,
        lamma_avg: Math.round(lammaAvg * 10) / 10,
        lamma_max: Math.round(lammaMax * 10) / 10,
        om_avg: omAvg,
        bias_kn: bias,
        stazioni: staz.map(function(d) { return d.nome; }),
        samples: staz.reduce(function(s, d) { return s + d.samples; }, 0),
        updated: new Date().toISOString()
      };
      await kvSet(biasKey, JSON.stringify(biasRecord), kvUrl, kvToken);
      results[zona] = biasRecord;
      console.log('LAMMA bias ' + zona + ': LaMMA=' + lammaAvg.toFixed(1) + 'kn OM=' + omAvg + 'kn bias=' + bias);
    } catch(ez) {
      console.error('LAMMA bias error zona ' + zona + ':', ez.message);
    }
  }
  console.log('LAMMA BIAS CRON done', Object.keys(results).length, 'zone');
  return results;
}



// Fine codice - NAUTILUS ENGINE v2.13.15

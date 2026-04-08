// NAUTILUS ENGINE - Vercel API - engine.js - v2.7.9 - by mdisailor engine
// Motore diagnostico meteo-marino - 12 zone puntuali
// Zone default: canale_piombino, livorno, viareggio
// Endpoints: /api/engine?action=ping|zones|zone&zone=xxx

//- ZONE PUNTUALI -

var ZONES = {
canale_piombino: {
enabled: true,
name: “Canale di Piombino”,
lat: 42.92, lon: 10.50,
ports: {
piombino:  { name: “Piombino”,  exposure: “SW”, shelter: “medium”, swell_threshold: 1.0 },
cavo:      { name: “Cavo”,      exposure: “N”,  shelter: “low”,    swell_threshold: 0.8 },
punta_ala: { name: “Punta Ala”, exposure: “SW”, shelter: “medium”, swell_threshold: 1.2 },
},
local_effects: {
venturi_piombino: { desc: “Venturi Canale di Piombino”, active_wind_dirs: [270, 360], amplification: 1.35, note: “Vento reale +35% nel canale con vento da W-N” },
cross_sea_canale: { desc: “Mare incrociato nel canale”, active_wind_dirs: [0, 360], note: “Correnti di marea + onda frontale = mare incrociato pericoloso” },
}
},
livorno: {
enabled: true,
name: “Livorno”,
lat: 43.548, lon: 10.310,
ports: {
livorno:        { name: “Livorno”,        exposure: “SW”, shelter: “high”, swell_threshold: 2.0 },

},

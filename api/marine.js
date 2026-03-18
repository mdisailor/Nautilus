// NAUTILUS · Vercel API · marine.js · v1.0.0 · by mdisailor engine
// Proxy per dati marini Stormglass
// Endpoint: /api/marine?lat=xx&lon=xx (GET)

export default async function handler(req, res) {

res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘GET, OPTIONS’);
res.setHeader(‘Access-Control-Allow-Headers’, ‘Content-Type’);

if (req.method === ‘OPTIONS’) {
return res.status(204).end();
}

const { lat, lon } = req.query;

if (!lat || !lon) {
return res.status(400).json({ error: ‘lat e lon richiesti’ });
}

const STORMGLASS_KEY = process.env.STORMGLASS_KEY;

if (!STORMGLASS_KEY) {
return res.status(500).json({ error: ‘STORMGLASS_KEY non configurata’ });
}

const params = [
‘waveHeight’, ‘wavePeriod’, ‘waveDirection’,
‘swellHeight’, ‘swellPeriod’, ‘swellDirection’,
‘windWaveHeight’, ‘windWavePeriod’,
‘windSpeed’, ‘windDirection’, ‘gust’,
‘waterTemperature’, ‘currentSpeed’, ‘currentDirection’,
‘airTemperature’, ‘humidity’, ‘pressure’
].join(’,’);

const now = Math.floor(Date.now() / 1000);
const url = ‘https://api.stormglass.io/v2/weather/point?lat=’ + lat +
‘&lng=’ + lon + ‘&params=’ + params +
‘&start=’ + now + ‘&end=’ + (now + 3600);

try {
const response = await fetch(url, {
headers: { ‘Authorization’: STORMGLASS_KEY }
});
const data = await response.json();
res.setHeader(‘Cache-Control’, ‘max-age=1800’);
return res.status(200).json(data);
} catch (err) {
return res.status(500).json({ error: ‘Errore Stormglass’, detail: err.message });
}
}

// Fine codice

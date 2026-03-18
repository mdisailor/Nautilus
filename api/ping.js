// NAUTILUS · Vercel API · ping.js · v1.0.0 · by mdisailor engine
// Test connessione
// Endpoint: /api/ping (GET)

export default async function handler(req, res) {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
return res.status(200).json({
ok: true,
service: ‘nautilus-api’,
v: ‘1.0.0’,
ts: Date.now()
});
}

// Fine codice

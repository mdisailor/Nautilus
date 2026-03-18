// NAUTILUS · Vercel API · briefing.js · v1.0.0 · by mdisailor engine
// Sostituisce nautilus-proxy Cloudflare per il briefing AI
// Endpoint: /api/briefing (POST)

export default async function handler(req, res) {

res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘GET, POST, OPTIONS’);
res.setHeader(‘Access-Control-Allow-Headers’, ‘Content-Type’);

if (req.method === ‘OPTIONS’) {
return res.status(204).end();
}

if (req.method !== ‘POST’) {
return res.status(405).json({ error: ‘Method not allowed’ });
}

const { prompt } = req.body;

if (!prompt) {
return res.status(400).json({ error: ‘prompt mancante’ });
}

const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY;

if (!ANTHROPIC_KEY) {
return res.status(500).json({ error: ‘ANTHROPIC_KEY non configurata’ });
}

try {
const response = await fetch(‘https://api.anthropic.com/v1/messages’, {
method: ‘POST’,
headers: {
‘Content-Type’: ‘application/json’,
‘x-api-key’: ANTHROPIC_KEY,
‘anthropic-version’: ‘2023-06-01’,
},
body: JSON.stringify({
model: ‘claude-haiku-4-5-20251001’,
max_tokens: 1024,
messages: [{ role: ‘user’, content: prompt.slice(0, 12000) }]
})
});

```
const data = await response.json();
return res.status(response.status).json(data);
```

} catch (err) {
return res.status(500).json({ error: ‘fetch_failed’, detail: err.message });
}
}

// Fine codice

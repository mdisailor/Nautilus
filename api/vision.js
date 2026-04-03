// NAUTILUS - Vercel API - vision.js - v1.0.0 - by mdisailor engine
// Riconoscimento nuvole via Claude Vision API
// Endpoint: POST /api/vision con body {image: base64, mediaType: 'image/jpeg'}

module.exports = async function handler(req, res) {
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
if (req.method === 'OPTIONS') return res.status(204).end();
if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY;
if (!ANTHROPIC_KEY) return res.status(500).json({ error: 'ANTHROPIC_KEY non configurata' });

const { image, mediaType } = req.body;
if (!image) return res.status(400).json({ error: 'image mancante (base64)' });

const prompt = 'Sei un esperto meteorologo marino. Analizza questa fotografia del cielo e identifica le nuvole presenti secondo la classificazione WMO.\n\nRispondi SOLO con un JSON valido in questo formato esatto:\n{\n  “clouds”: [“Ci”, “Cs”],\n  “primary”: “Cs”,\n  “confidence”: 85,\n  “sequence”: “Ci->Cs”,\n  “scenario”: “B”,\n  “scenario_desc”: “Fronte caldo in avvicinamento - warm advection”,\n  “implication”: “Deterioramento graduale previsto entro 12-36h. Swell lungo potrebbe precedere il vento.”,\n  “urgency”: “medium”,\n  “visibility”: “buona”,\n  “ceiling”: “alto”\n}\n\nCodici nuvole WMO validi: Ci, Cs, Cc, As, Ac, Ns, Sc, St, Cu, Cb\nScenari: A (fronte freddo PERICOLOSO), B (fronte caldo graduale), C (ciclogenesi IMPREVEDIBILE), D (miglioramento), stable (stabile)\nUrgency: low, medium, high\n\nSe non vedi chiaramente nuvole o e una foto non del cielo, rispondi con: {“error”: “Foto non riconoscibile come cielo”}\n\nAnalizza ora la foto:';

try {
const response = await fetch('https://api.anthropic.com/v1/messages', {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'x-api-key': ANTHROPIC_KEY,
'anthropic-version': '2023-06-01',
},
body: JSON.stringify({
model: 'claude-sonnet-4-5-20251001',
max_tokens: 512,
messages: [{
role: 'user',
content: [
{
type: 'image',
source: {
type: 'base64',
media_type: mediaType || 'image/jpeg',
data: image
}
},
{ type: 'text', text: prompt }
]
}]
})
});


const data = await response.json();
if (!response.ok) return res.status(500).json({ error: 'Anthropic error', detail: data });

const text = data.content && data.content[0] ? data.content[0].text : '';

// Parse JSON from response
try {
  var fence = String.fromCharCode(96,96,96); var clean = text.replace(new RegExp(fence+'json|'+fence,'g'), '').trim();
  const parsed = JSON.parse(clean);
  return res.status(200).json(parsed);
} catch(e) {
  return res.status(200).json({ raw: text, parse_error: true });
}


} catch(err) {
return res.status(500).json({ error: 'fetch_failed', detail: err.message });
}
};

// Fine codice

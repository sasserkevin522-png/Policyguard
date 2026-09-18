const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const MANUALS = require('./manuals.js');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'PolicyApp v2', manuals: Object.keys(MANUALS) });
});

async function askClaude(system, question) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system,
      messages: [{ role: 'user', content: question }]
    })
  });
  const data = await r.json();
  if (data.error) throw new Error(data.error.message);
  return data.content?.[0]?.text || 'No answer returned.';
}

app.post('/api/ask', async (req, res) => {
  const { manualId, manualName, question } = req.body;
  if (!question) return res.status(400).json({ error: 'Question is required' });

  const manualText = MANUALS[manualId] || null;
  const system = manualText
    ? `You are PolicyApp, an AI safety assistant for utility field crew leaders at Sol Powerlines. Answer questions STRICTLY based on the provided manual content. Be direct and practical. State specific requirements, distances, or procedures exactly as written. Reference the section when possible. Keep answers under 200 words.\n\n${manualName.toUpperCase()}:\n${manualText.substring(0, 12000)}`
    : `You are PolicyApp, an AI safety assistant for Sol Powerlines field crews. Answer based on typical industry standards for "${manualName}". Keep answers under 200 words.`;

  try {
    const answer = await askClaude(system, question);
    res.json({ answer });
  } catch (err) {
    res.status(500).json({ error: err.message || 'AI service error.' });
  }
});

app.post('/api/strictest', async (req, res) => {
  const { question, manuals } = req.body;
  if (!question || !manuals) return res.status(400).json({ error: 'Missing fields' });

  const results = [];
  for (const m of manuals) {
    const manualText = MANUALS[m.id] || null;
    const system = manualText
      ? `Answer in 2-3 sentences based ONLY on this manual. State the specific requirement. Manual: ${m.name}\n\nCONTENT:\n${manualText.substring(0, 8000)}`
      : `Answer in 2-3 sentences about typical "${m.name}" requirements. Note no PDF is loaded.`;
    try {
      const answer = await askClaude(system, question);
      results.push({ manual: m, answer });
    } catch (e) {
      results.push({ manual: m, answer: 'Could not retrieve.' });
    }
  }

  const combined = results.map(r => `${r.manual.name}: ${r.answer}`).join('\n\n');
  let winner = '';
  try {
    winner = await askClaude(
      'Given these answers from multiple safety manuals, identify which has the MOST STRINGENT requirement. Reply with ONLY the exact manual name.',
      `Question: ${question}\n\nAnswers:\n${combined}`
    );
  } catch (e) {}

  res.json({ results, winner });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`PolicyApp running on port ${PORT}`));

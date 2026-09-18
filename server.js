const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const MANUALS = require('./manuals.js');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'PolicyApp', manuals: Object.keys(MANUALS) });
});

// Single manual query
app.post('/api/ask', async (req, res) => {
  const { manualId, manualName, question } = req.body;
  if (!question) return res.status(400).json({ error: 'Question is required' });

  const manualText = MANUALS[manualId] || null;
  const system = manualText
    ? `You are PolicyApp, an AI safety assistant for utility field crew leaders at Sol Powerlines. Answer questions STRICTLY based on the provided safety manual content. Be direct and practical — field crews need clear, actionable answers. State specific requirements, distances, or procedures exactly as written. Reference the relevant section when possible. Keep answers under 200 words.\n\n${manualName.toUpperCase()} MANUAL:\n${manualText.substring(0, 12000)}`
    : `You are PolicyApp, an AI safety assistant for utility field crews at Sol Powerlines. Answer questions about "${manualName}" based on typical industry standards and OSHA requirements. Note the specific PDF has not been uploaded for this manual. Keep answers under 200 words.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
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
    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    res.json({ answer: data.content?.[0]?.text || 'No answer returned.' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: 'Could not reach AI service. Try again.' });
  }
});

// Strictest Standard — query all manuals, find most stringent
app.post('/api/strictest', async (req, res) => {
  const { question, manuals } = req.body;
  if (!question || !manuals) return res.status(400).json({ error: 'Question and manuals required' });

  const results = [];

  for (const m of manuals) {
    const manualText = MANUALS[m.id] || null;
    const system = manualText
      ? `You are PolicyApp. Answer in 2-3 sentences based ONLY on this manual content. State the specific requirement clearly. Manual: ${m.name}\n\nCONTENT:\n${manualText.substring(0, 8000)}`
      : `You are PolicyApp. Answer in 2-3 sentences about typical "${m.name}" requirements. Note briefly that no PDF is loaded for this manual.`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          system,
          messages: [{ role: 'user', content: question }]
        })
      });
      const data = await response.json();
      results.push({ manual: m, answer: data.content?.[0]?.text || 'No answer.' });
    } catch (e) {
      results.push({ manual: m, answer: 'Could not retrieve.' });
    }
  }

  // Determine most stringent
  const combined = results.map(r => `${r.manual.name}: ${r.answer}`).join('\n\n');
  let winner = '';
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 100,
        system: 'Given these answers from multiple safety manuals, identify which has the MOST STRINGENT (most protective, most restrictive) requirement. Reply with ONLY the exact manual name, nothing else.',
        messages: [{ role: 'user', content: `Question: ${question}\n\nAnswers:\n${combined}` }]
      })
    });
    const data = await response.json();
    winner = data.content?.[0]?.text?.trim() || '';
  } catch (e) {
    console.error('Winner error:', e);
  }

  res.json({ results, winner });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`PolicyApp running on port ${PORT}`);
});

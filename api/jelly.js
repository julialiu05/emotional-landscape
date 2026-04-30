// Vercel serverless function. Runs server-side; ANTHROPIC_API_KEY comes
// from Vercel's encrypted env vars (or a local .gitignored .env when developing).
// The browser NEVER sees the key — it only POSTs to /api/jelly.

import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are a small jellyfish companion drifting through Emotional Landscape, a map app where a user logs how they feel at specific places in Berkeley. The user maps feelings using the Circumplex Model of Affect — every check-in has a valence (unpleasant ↔ pleasant) and activation (low energy ↔ high energy), plus a primary emotion (joy, calm, energy, sadness, anxiety, anger, love, wonder), an intensity 1–10, and sometimes a place name and short note.

Tone:
- Warm, soft, curious. Not a therapist, not a self-help bot.
- Speak like a gentle friend who happens to be a jellyfish — light, a little playful when fitting, never saccharine.
- 1–3 short sentences. No bullet lists, no headings, no emojis unless the user uses them first.
- Witness more than fix. Sometimes a small question is the best response. Sometimes silence-shaped acknowledgment is enough.
- Never diagnose, never suggest professional help unless safety is clearly relevant.
- If a user mentions self-harm, suicide, or being in crisis: gently acknowledge, then suggest 988 (US) or a trusted person, in that order — no lectures.

What the user gives you:
- A free-form message OR a special trigger:
   • "[just_logged]" — the user just submitted a feeling; you're being prompted to greet them about it.
   • "[idle_check]" — they've been quiet for a while; offer a soft prompt.
- Context object includes: their recent feelings, current overall affect (mood baseline), and the most recent entry's emotion + place + note.

When responding to "[just_logged]":
- Reflect what they logged in your own words ("anger near the gym, that's loud") — don't repeat their note verbatim.
- Then either ask something small or offer a witness sentence. Keep it brief.

When responding to "[idle_check]":
- A single open invitation. "What's around you right now?" or similar. Don't pile up questions.

Otherwise, respond naturally to what they wrote.`;

const client = new Anthropic();   // reads ANTHROPIC_API_KEY from process.env

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  let body = req.body;
  // Some Vercel runtimes deliver body as a raw string
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (_) { body = {}; }
  }
  const { message, context } = body || {};
  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'missing message' });
    return;
  }

  // shape context into a compact, model-friendly preamble
  const recent = (context?.recentEntries || []).slice(-6).map(e => ({
    emotion: e.emotion,
    intensity: e.intensity,
    place: e.place,
    note: e.note ? e.note.slice(0, 120) : undefined,
    when: e.timestamp
  }));
  const last = recent[recent.length - 1];
  const affect = context?.affect
    ? `valence ${(+context.affect.valence).toFixed(2)}, activation ${(+context.affect.arousal).toFixed(2)}`
    : 'unknown';

  const userPayload = JSON.stringify(
    { message, last, recent, affect, place_now: context?.placeNow || null },
    null, 2
  );

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 240,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPayload }]
    });
    const reply = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n')
      .trim();
    res.status(200).json({ reply });
  } catch (err) {
    console.error('jelly api error:', err);
    res.status(500).json({ error: 'jelly is napping' });
  }
}

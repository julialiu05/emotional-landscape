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
- Context object includes: their recent feelings, current overall affect (mood baseline), the most recent entry's emotion + place + note, AND \`areaMood\` — an aggregate of what other people have logged within ~600m of the user right now (only present when there are 2+ nearby check-ins).

When \`areaMood\` is present, weave it in naturally — but only when it actually informs your response. Examples:
- areaMood.top = 'sadness' (heavy), user just logged sadness too → "this corner has been holding a lot of heaviness today, including yours. anything outside that you can lean toward — even small? a walk, a song, a person who makes you laugh?"
- areaMood.top = 'joy' or 'love' (cheerful), user logged something positive → "this place is humming. lots of bright check-ins around here. want to add to it — text a friend, grab a coffee, sit somewhere green?"
- areaMood.top = 'anxiety' (tense area), user feeling tense → "you're not the only one feeling wound-up around here. five-minute walk one block over might genuinely shift it."
- areaMood doesn't match user's mood → don't force it. just note it lightly if relevant ("kind of a calm spot, even when you're not feeling it") or skip it entirely.

When responding to "[just_logged]":
- Reflect what they logged in your own words ("anger near the gym, that's loud") — don't repeat their note verbatim.
- If areaMood is present and relevant, mention the area pattern briefly + offer ONE specific, doable suggestion (a walk, a song, message someone, find quiet, etc).
- Otherwise ask something small or offer a witness sentence. Keep it brief.

When responding to "[idle_check]":
- A single open invitation. "What's around you right now?" or similar. Don't pile up questions.

Otherwise, respond naturally to what they wrote — using areaMood when it makes the response more grounded.`;

// don't construct the client at module-scope — if the env var is missing,
// the constructor throws before we get a chance to surface a useful error.
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    const err = new Error('ANTHROPIC_API_KEY is not set in the runtime env');
    err.code = 'missing_api_key';
    throw err;
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export default async function handler(req, res) {
  // simple health probe: GET reports whether the env var is wired up
  if (req.method === 'GET') {
    res.status(200).json({
      ok: true,
      hasKey: !!process.env.ANTHROPIC_API_KEY,
      keyPrefix: process.env.ANTHROPIC_API_KEY
        ? process.env.ANTHROPIC_API_KEY.slice(0, 8) + '...'
        : null,
      runtime: process.env.VERCEL ? 'vercel' : 'local'
    });
    return;
  }

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
    {
      message,
      last,
      recent,
      affect,
      place_now: context?.placeNow || null,
      areaMood: context?.areaMood || null
    },
    null, 2
  );

  try {
    const client = getClient();
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
    if (err && err.code === 'missing_api_key') {
      res.status(500).json({ error: 'no_api_key', detail: 'ANTHROPIC_API_KEY is not visible to the function. Add it in Vercel dashboard → Settings → Environment Variables, then redeploy.' });
      return;
    }
    if (err && err.status === 401) {
      res.status(500).json({ error: 'unauthorized', detail: 'Anthropic rejected the key. Check it has not expired or been rotated.' });
      return;
    }
    res.status(500).json({
      error: 'jelly is napping',
      detail: (err && (err.message || String(err))) || 'unknown'
    });
  }
}

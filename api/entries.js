// Vercel serverless function backed by Upstash Redis.
// GET  /api/entries           → returns recent entries (also acts as health probe)
// POST /api/entries           → adds a new entry
//
// Env vars expected (set in Vercel dashboard):
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN

import { Redis } from '@upstash/redis';

const KEY = 'el:entries';
const MAX_ENTRIES = 200;

function getClient() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return Redis.fromEnv();
}

export default async function handler(req, res) {
  // ---- GET: health probe + recent entries ----
  if (req.method === 'GET') {
    const client = getClient();
    if (!client) {
      res.status(200).json({
        ok: false,
        hasUpstash: false,
        detail: 'UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not visible to the function',
        entries: []
      });
      return;
    }
    try {
      const raw = await client.lrange(KEY, 0, MAX_ENTRIES - 1);
      const entries = raw.map(e => (typeof e === 'string' ? safeParse(e) : e)).filter(Boolean);
      res.status(200).json({ ok: true, hasUpstash: true, count: entries.length, entries });
    } catch (err) {
      console.error('entries GET error:', err);
      res.status(500).json({ ok: false, error: 'redis_error', detail: err?.message || String(err) });
    }
    return;
  }

  // ---- POST: add a new entry ----
  if (req.method === 'POST') {
    const client = getClient();
    if (!client) {
      res.status(500).json({ ok: false, error: 'no_upstash_creds' });
      return;
    }

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (_) { body = {}; }
    }
    const e = body || {};

    if (typeof e.lat !== 'number' || typeof e.lng !== 'number' || !e.emotion) {
      res.status(400).json({ ok: false, error: 'invalid_entry', detail: 'lat, lng, emotion required' });
      return;
    }

    const entry = {
      id: 'srv-' + Date.now() + '-' + Math.floor(Math.random() * 9999),
      lat: clampNum(e.lat, -90, 90),
      lng: clampNum(e.lng, -180, 180),
      emotion: String(e.emotion).slice(0, 32),
      intensity: clampNum(typeof e.intensity === 'number' ? e.intensity : 5, 1, 10),
      valence: typeof e.valence === 'number' ? clampNum(e.valence, -1.5, 1.5) : 0,
      arousal: typeof e.arousal === 'number' ? clampNum(e.arousal, -1.5, 1.5) : 0,
      note: e.note ? String(e.note).slice(0, 280) : '',
      placeName: e.placeName ? String(e.placeName).slice(0, 80) : '',
      userName: e.userName ? String(e.userName).slice(0, 24) : 'Anon',
      hue: typeof e.hue === 'string' && /^#[0-9a-f]{3,8}$/i.test(e.hue) ? e.hue : '#7ee5d4',
      timestamp: new Date().toISOString()
    };

    try {
      await client.lpush(KEY, JSON.stringify(entry));
      await client.ltrim(KEY, 0, MAX_ENTRIES - 1);
      res.status(200).json({ ok: true, entry });
    } catch (err) {
      console.error('entries POST error:', err);
      res.status(500).json({ ok: false, error: 'redis_error', detail: err?.message || String(err) });
    }
    return;
  }

  res.status(405).json({ ok: false, error: 'method_not_allowed' });
}

function safeParse(s) {
  try { return JSON.parse(s); } catch (_) { return null; }
}
function clampNum(n, min, max) {
  return Math.max(min, Math.min(max, +n));
}

// Lightweight presence: each client posts a heartbeat every ~15s.
// Server keeps a sorted-set of "last seen" timestamps per user. Anyone
// seen in the last 30s is considered online.

import { Redis } from '@upstash/redis';

const KEY = 'el:presence';
const ONLINE_WINDOW_MS = 30 * 1000;
const STALE_WINDOW_MS = 5 * 60 * 1000;

function getClient() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return Redis.fromEnv();
}

export default async function handler(req, res) {
  const client = getClient();
  if (!client) {
    res.status(200).json({ ok: false, hasUpstash: false, online: [] });
    return;
  }

  // ---- POST: heartbeat ----
  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (_) { body = {}; }
    }
    const userName = body && typeof body.userName === 'string' ? body.userName.slice(0, 24) : null;
    const hue = body && typeof body.hue === 'string' && /^#[0-9a-f]{3,8}$/i.test(body.hue) ? body.hue : '#7ee5d4';
    if (!userName) {
      res.status(400).json({ ok: false, error: 'missing_userName' });
      return;
    }
    const now = Date.now();
    try {
      const member = JSON.stringify({ name: userName, hue });
      await client.zadd(KEY, { score: now, member });
      // remove anyone older than STALE_WINDOW_MS so the set stays small
      await client.zremrangebyscore(KEY, 0, now - STALE_WINDOW_MS);
      res.status(200).json({ ok: true });
    } catch (err) {
      console.error('presence POST error:', err);
      res.status(500).json({ ok: false, error: 'redis_error', detail: err?.message });
    }
    return;
  }

  // ---- GET: online users ----
  if (req.method === 'GET') {
    const now = Date.now();
    try {
      const raw = await client.zrange(KEY, now - ONLINE_WINDOW_MS, '+inf', { byScore: true });
      // dedupe by name (last hue wins)
      const byName = new Map();
      raw.forEach(m => {
        const v = typeof m === 'string' ? safeParse(m) : m;
        if (v && v.name) byName.set(v.name, v);
      });
      const online = [...byName.values()];
      res.status(200).json({ ok: true, count: online.length, online });
    } catch (err) {
      console.error('presence GET error:', err);
      res.status(500).json({ ok: false, error: 'redis_error', detail: err?.message });
    }
    return;
  }

  res.status(405).json({ ok: false, error: 'method_not_allowed' });
}

function safeParse(s) { try { return JSON.parse(s); } catch (_) { return null; } }

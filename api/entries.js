// /api/entries — community feed backed by Upstash Redis
//
// Schema:
//   el:entries                           LIST of entry JSON, newest first (LPUSH)
//   el:entry:echoCounts                  HASH { entryId → integer }
//   el:entry:replyCounts                 HASH { entryId → integer }
//   el:entry:{id}:echoes                 SET of userNames (dedup)
//   el:entry:{id}:replies                LIST of reply JSON
//
// Endpoints:
//   GET   /api/entries                       → recent entries (with echoCount + replyCount)
//   POST  /api/entries                       → create new entry
//   POST  /api/entries?action=echo           → toggle echo on an entry
//   POST  /api/entries?action=reply          → add a reply
//   GET   /api/entries?action=replies&id=…   → fetch replies for an entry

import { Redis } from '@upstash/redis';

const ENTRIES_KEY      = 'el:entries';
const ECHO_COUNTS_KEY  = 'el:entry:echoCounts';
const REPLY_COUNTS_KEY = 'el:entry:replyCounts';
const ECHO_SET   = (id) => `el:entry:${id}:echoes`;
const REPLY_LIST = (id) => `el:entry:${id}:replies`;
const MAX_ENTRIES = 200;
const MAX_REPLIES = 80;

function getClient() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return Redis.fromEnv();
}

export default async function handler(req, res) {
  const action = req.query?.action || null;
  const client = getClient();

  if (!client) {
    if (req.method === 'GET') {
      res.status(200).json({ ok: false, hasUpstash: false, entries: [] });
    } else {
      res.status(500).json({ ok: false, error: 'no_upstash_creds' });
    }
    return;
  }

  // ===== GET =====
  if (req.method === 'GET') {
    if (action === 'replies') {
      const id = req.query?.id;
      if (!id) { res.status(400).json({ ok: false, error: 'missing_id' }); return; }
      try {
        const raw = await client.lrange(REPLY_LIST(id), 0, MAX_REPLIES - 1);
        const replies = raw.map(r => typeof r === 'string' ? safeParse(r) : r).filter(Boolean);
        res.status(200).json({ ok: true, count: replies.length, replies });
      } catch (err) {
        res.status(500).json({ ok: false, error: 'redis_error', detail: err?.message });
      }
      return;
    }

    // default: list entries with counts merged in
    try {
      const [raw, echoCounts, replyCounts] = await Promise.all([
        client.lrange(ENTRIES_KEY, 0, MAX_ENTRIES - 1),
        client.hgetall(ECHO_COUNTS_KEY).catch(() => ({})),
        client.hgetall(REPLY_COUNTS_KEY).catch(() => ({}))
      ]);
      const entries = (raw || [])
        .map(e => typeof e === 'string' ? safeParse(e) : e)
        .filter(Boolean)
        .map(e => ({
          ...e,
          echoCount:  +(echoCounts?.[e.id]  || 0),
          replyCount: +(replyCounts?.[e.id] || 0)
        }));
      res.status(200).json({ ok: true, hasUpstash: true, count: entries.length, entries });
    } catch (err) {
      console.error('entries GET error:', err);
      res.status(500).json({ ok: false, error: 'redis_error', detail: err?.message });
    }
    return;
  }

  // ===== POST =====
  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (_) { body = {}; }
    }
    body = body || {};

    if (action === 'echo') {
      const { entryId, userName } = body;
      if (!entryId || !userName) { res.status(400).json({ ok: false, error: 'missing_fields' }); return; }
      try {
        const set = ECHO_SET(entryId);
        const isMember = await client.sismember(set, userName);
        let delta;
        if (isMember) { await client.srem(set, userName); delta = -1; }
        else          { await client.sadd(set, userName); delta = +1; }
        const count = await client.hincrby(ECHO_COUNTS_KEY, entryId, delta);
        res.status(200).json({ ok: true, echoed: !isMember, count: Math.max(0, count) });
      } catch (err) {
        res.status(500).json({ ok: false, error: 'redis_error', detail: err?.message });
      }
      return;
    }

    if (action === 'reply') {
      const { entryId, userName, hue, text } = body;
      if (!entryId || !userName || !text) { res.status(400).json({ ok: false, error: 'missing_fields' }); return; }
      const reply = {
        id: 'r-' + Date.now() + '-' + Math.floor(Math.random() * 9999),
        userName: String(userName).slice(0, 24),
        hue: typeof hue === 'string' && /^#[0-9a-f]{3,8}$/i.test(hue) ? hue : '#7ee5d4',
        text: String(text).slice(0, 280),
        timestamp: new Date().toISOString()
      };
      try {
        await client.rpush(REPLY_LIST(entryId), JSON.stringify(reply));
        await client.ltrim(REPLY_LIST(entryId), 0, MAX_REPLIES - 1);
        const count = await client.hincrby(REPLY_COUNTS_KEY, entryId, 1);
        res.status(200).json({ ok: true, reply, count });
      } catch (err) {
        res.status(500).json({ ok: false, error: 'redis_error', detail: err?.message });
      }
      return;
    }

    // default: create new entry
    const e = body;
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
      await client.lpush(ENTRIES_KEY, JSON.stringify(entry));
      await client.ltrim(ENTRIES_KEY, 0, MAX_ENTRIES - 1);
      res.status(200).json({ ok: true, entry });
    } catch (err) {
      console.error('entries POST error:', err);
      res.status(500).json({ ok: false, error: 'redis_error', detail: err?.message });
    }
    return;
  }

  res.status(405).json({ ok: false, error: 'method_not_allowed' });
}

function safeParse(s) { try { return JSON.parse(s); } catch (_) { return null; } }
function clampNum(n, min, max) { return Math.max(min, Math.min(max, +n)); }

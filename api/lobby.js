// /api/lobby — shared real-time chat room
//
// GET   /api/lobby            → recent messages (oldest → newest)
// POST  /api/lobby            → add a message { userName, hue, text }
//
// Env: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN

import { Redis } from '@upstash/redis';

const KEY = 'el:lobby';
const MAX_MESSAGES = 200;

function getClient() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return Redis.fromEnv();
}

export default async function handler(req, res) {
  const client = getClient();
  if (!client) {
    if (req.method === 'GET') {
      res.status(200).json({ ok: false, hasUpstash: false, messages: [] });
    } else {
      res.status(500).json({ ok: false, error: 'no_upstash_creds' });
    }
    return;
  }

  if (req.method === 'GET') {
    try {
      const raw = await client.lrange(KEY, 0, MAX_MESSAGES - 1);
      // LPUSH stores newest at index 0 → reverse so client gets oldest → newest
      const messages = (raw || [])
        .map(m => typeof m === 'string' ? safeParse(m) : m)
        .filter(Boolean)
        .reverse();
      res.status(200).json({ ok: true, hasUpstash: true, count: messages.length, messages });
    } catch (err) {
      console.error('lobby GET error:', err);
      res.status(500).json({ ok: false, error: 'redis_error', detail: err?.message });
    }
    return;
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (_) { body = {}; }
    }
    const { userName, hue, text } = body || {};
    if (!userName || !text) {
      res.status(400).json({ ok: false, error: 'missing_fields' });
      return;
    }
    const message = {
      id: 'm-' + Date.now() + '-' + Math.floor(Math.random() * 9999),
      userName: String(userName).slice(0, 24),
      hue: typeof hue === 'string' && /^#[0-9a-f]{3,8}$/i.test(hue) ? hue : '#7ee5d4',
      text: String(text).slice(0, 500).trim(),
      timestamp: new Date().toISOString()
    };
    if (!message.text) {
      res.status(400).json({ ok: false, error: 'empty_text' });
      return;
    }
    try {
      await client.lpush(KEY, JSON.stringify(message));
      await client.ltrim(KEY, 0, MAX_MESSAGES - 1);
      res.status(200).json({ ok: true, message });
    } catch (err) {
      console.error('lobby POST error:', err);
      res.status(500).json({ ok: false, error: 'redis_error', detail: err?.message });
    }
    return;
  }

  res.status(405).json({ ok: false, error: 'method_not_allowed' });
}

function safeParse(s) { try { return JSON.parse(s); } catch (_) { return null; } }

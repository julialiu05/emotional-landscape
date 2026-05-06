// ---- AUTH ----
let currentAuthMode = 'login';

function checkAuth() {
  // always show the login page as the entrance, even for returning sessions.
  // the saved user (if any) is preserved in localStorage and reused after the
  // user clicks Enter (handleAuth) or Skip (skipLogin).
  return false;
}

function setLever(checked) {
  const lever = document.getElementById('mode-lever');
  lever.checked = checked;
  handleLever(checked);
}

function handleLever(checked) {
  switchLoginTab(checked ? 'signup' : 'login');
}

function switchLoginTab(mode) {
  currentAuthMode = mode;
  document.getElementById('login-error').textContent = '';

  const segLogin = document.getElementById('seg-login');
  const segSignup = document.getElementById('seg-signup');
  if (segLogin) segLogin.classList.toggle('active', mode === 'login');
  if (segSignup) segSignup.classList.toggle('active', mode === 'signup');

  const nameGroup = document.getElementById('name-group');
  const btn = document.getElementById('login-btn');
  const footer = document.getElementById('login-footer-text');
  const heading = document.getElementById('login-heading');
  const sub = document.getElementById('login-sub');

  const btnText = btn ? (btn.querySelector('.text_button') || btn) : null;
  if (mode === 'signup') {
    if (nameGroup) nameGroup.style.display = 'flex';
    if (btnText) btnText.textContent = 'Enter';
    if (heading) heading.innerHTML = 'Begin <em>here</em>.';
    if (sub) sub.textContent = 'Create an account to keep your check-ins.';
    if (footer) footer.innerHTML = 'Already have an account? <a onclick="setLever(false)">Log in</a>';
  } else {
    if (nameGroup) nameGroup.style.display = 'none';
    if (btnText) btnText.textContent = 'Enter';
    if (heading) heading.innerHTML = 'Welcome <em>back</em>.';
    if (sub) sub.textContent = 'Map how the places you move through make you feel.';
    if (footer) footer.innerHTML = 'No account yet? <a onclick="setLever(true)">Sign up</a>';
  }
}

function skipLogin() {
  localStorage.setItem('el_user', JSON.stringify({ email: 'guest@local', name: 'Guest', guest: true }));
  document.getElementById('login-page').classList.add('hidden');
  setTimeout(() => {
    document.getElementById('login-page').style.display = 'none';
    if (typeof map !== 'undefined') { map.resize(); autoLocate(); }
    maybeShowAffectOnboarding();
    updateSidebarStats();
  }, 400);
}

function handleAuth() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');

  if (!email) { errorEl.textContent = 'Please enter your email.'; return; }
  if (!password) { errorEl.textContent = 'Please enter a password.'; return; }

  const users = JSON.parse(localStorage.getItem('el_users') || '{}');

  if (currentAuthMode === 'signup') {
    const name = document.getElementById('signup-name').value.trim();
    if (!name) { errorEl.textContent = 'Please enter your name.'; return; }
    if (users[email]) { errorEl.textContent = 'An account with this email already exists.'; return; }
    users[email] = { name, password, created: new Date().toISOString() };
    localStorage.setItem('el_users', JSON.stringify(users));
    localStorage.setItem('el_user', JSON.stringify({ email, name }));
  } else {
    if (!users[email]) { errorEl.textContent = 'No account found with this email.'; return; }
    if (users[email].password !== password) { errorEl.textContent = 'Incorrect password.'; return; }
    localStorage.setItem('el_user', JSON.stringify({ email, name: users[email].name }));
  }

  document.getElementById('login-page').classList.add('hidden');
  setTimeout(() => {
    document.getElementById('login-page').style.display = 'none';
    map.resize();
    autoLocate();
    maybeShowAffectOnboarding();
  }, 600);
}

// allow Enter key to submit
document.addEventListener('DOMContentLoaded', () => {
  ['login-email', 'login-password', 'signup-name'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => {
      if (e.key === 'Enter') handleAuth();
    });
  });
  setupAffectPad();
  setupLogPad();
  // pre-fill email for returning users — they still click Enter to proceed
  try {
    const savedUser = JSON.parse(localStorage.getItem('el_user') || 'null');
    if (savedUser && savedUser.email && savedUser.email !== 'guest@local') {
      const emailInput = document.getElementById('login-email');
      if (emailInput) emailInput.value = savedUser.email;
    }
  } catch (_) {}
  checkAuth();
});

// rotating emotion word on the login page
const LOGIN_TICKER_WORDS = ['joy', 'calm', 'energy', 'sadness', 'anxiety', 'anger', 'love', 'wonder'];
let _loginTickerIdx = 0;
let _loginTickerTimer = null;
function startLoginEmotionTicker() {
  const el = document.getElementById('login-ticker-word');
  if (!el) return;
  if (_loginTickerTimer) clearInterval(_loginTickerTimer);
  el.textContent = LOGIN_TICKER_WORDS[0];
  _loginTickerTimer = setInterval(() => {
    el.classList.add('fading');
    setTimeout(() => {
      _loginTickerIdx = (_loginTickerIdx + 1) % LOGIN_TICKER_WORDS.length;
      el.textContent = LOGIN_TICKER_WORDS[_loginTickerIdx];
      el.classList.remove('fading');
    }, 320);
  }, 2400);
}

// ---- PARTICLES ----
function createParticles() {
  const container = document.getElementById('particles');
  const colors = ['rgba(200,180,240,0.3)', 'rgba(240,180,200,0.25)', 'rgba(180,210,240,0.25)', 'rgba(240,220,180,0.2)', 'rgba(255,255,255,0.3)'];
  for (let i = 0; i < 25; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = 4 + Math.random() * 12;
    p.style.cssText = `
      width: ${size}px; height: ${size}px;
      left: ${Math.random() * 100}%;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      animation-duration: ${12 + Math.random() * 20}s;
      animation-delay: ${Math.random() * 15}s;
      filter: blur(${Math.random() * 2}px);
    `;
    container.appendChild(p);
  }
}
createParticles();

// ---- DATA ----
const EMOTIONS = [
  { id: 'joy',     label: 'Joy',     color: '#F5B841', glow: 'rgba(245,184,65,0.4)',  emoji: '\u2600\uFE0F' },
  { id: 'calm',    label: 'Calm',    color: '#6FC8A3', glow: 'rgba(111,200,163,0.4)', emoji: '\uD83C\uDF3F' },
  { id: 'energy',  label: 'Energy',  color: '#FF8A5B', glow: 'rgba(255,138,91,0.4)',  emoji: '\u26A1' },
  { id: 'sadness', label: 'Sadness', color: '#6B8FD4', glow: 'rgba(107,143,212,0.4)', emoji: '\uD83C\uDF27\uFE0F' },
  { id: 'anxiety', label: 'Anxiety', color: '#A89C82', glow: 'rgba(168,156,130,0.4)', emoji: '\uD83C\uDF00' },
  { id: 'anger',   label: 'Anger',   color: '#E8635F', glow: 'rgba(232,99,95,0.4)',   emoji: '\uD83D\uDD25' },
  { id: 'love',    label: 'Love',    color: '#F49EB0', glow: 'rgba(244,158,176,0.4)', emoji: '\uD83C\uDF38' },
  { id: 'wonder',  label: 'Wonder',  color: '#5AC8FA', glow: 'rgba(90,200,250,0.4)',  emoji: '\u2728' },
];

const EMOTION_MAP = {};
EMOTIONS.forEach(e => EMOTION_MAP[e.id] = e);

// Circumplex positions for each emotion (valence × arousal, both in [-1, 1])
const EMOTION_COORDS = {
  joy:     { valence:  0.55, arousal:  0.55 },
  wonder:  { valence:  0.25, arousal:  0.80 },
  energy:  { valence: -0.05, arousal:  0.88 },
  anxiety: { valence: -0.55, arousal:  0.60 },
  anger:   { valence: -0.80, arousal:  0.35 },
  sadness: { valence: -0.65, arousal: -0.50 },
  calm:    { valence:  0.65, arousal: -0.55 },
  love:    { valence:  0.85, arousal:  0.00 }
};

function nearestEmotion(v, a) {
  let best = EMOTIONS[0], bestD = Infinity;
  for (const em of EMOTIONS) {
    const c = EMOTION_COORDS[em.id];
    const d = Math.hypot(c.valence - v, c.arousal - a);
    if (d < bestD) { bestD = d; best = em; }
  }
  return best;
}

let entries = JSON.parse(localStorage.getItem('el_entries') || '[]');
let pendingLatLng = null;

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substr(0, 2), 16),
    parseInt(h.substr(2, 2), 16),
    parseInt(h.substr(4, 2), 16)
  ];
}

// ---- AFFECT (Circumplex Model) ----
let affectState = JSON.parse(localStorage.getItem('el_affect') || 'null');

function computeAffectFilter(affect) {
  if (!affect) return '';
  const v = Math.max(-1, Math.min(1, affect.valence || 0));
  const a = Math.max(-1, Math.min(1, affect.arousal || 0));
  const sat   = (1 + a * 0.18 + v * 0.10).toFixed(3);
  const bri   = (1 + a * 0.05 + v * 0.03).toFixed(3);
  const hue   = (-v * 10 + (a < 0 ? 4 : -2)).toFixed(1);
  const con   = (1 + a * 0.06).toFixed(3);
  const sep   = v < 0 && a < 0 ? (-v * 0.12).toFixed(2) : 0;
  return `saturate(${sat}) brightness(${bri}) hue-rotate(${hue}deg) contrast(${con}) sepia(${sep})`;
}

function applyAffect(affect) {
  const canvas = document.querySelector('.maplibregl-canvas');
  const filter = computeAffectFilter(affect);
  if (canvas) canvas.style.filter = filter;
  if (affect) {
    document.documentElement.style.setProperty('--user-valence', affect.valence.toFixed(2));
    document.documentElement.style.setProperty('--user-arousal', affect.arousal.toFixed(2));
  }
}

function affectQuadrantName(v, a) {
  if (Math.hypot(v, a) < 0.2) return 'neutral';
  if (v >= 0 && a >= 0) return 'excited';
  if (v < 0 && a >= 0) return 'tense';
  if (v < 0 && a < 0) return 'sad';
  return 'calm';
}

function setupAffectPad() {
  const pad = document.getElementById('affect-pad');
  const thumb = document.getElementById('affect-thumb');
  if (!pad || !thumb) return;

  function placeAt(clientX, clientY) {
    const rect = pad.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    thumb.style.left = (x * 100) + '%';
    thumb.style.top  = (y * 100) + '%';
    thumb.classList.add('visible');
    const affect = { valence: x * 2 - 1, arousal: -(y * 2 - 1) };
    pad._pending = affect;
    applyAffect(affect);
    const nameEl = document.getElementById('affect-readout-name');
    const axesEl = document.getElementById('affect-readout-axes');
    if (nameEl) nameEl.textContent = affectQuadrantName(affect.valence, affect.arousal);
    if (axesEl) axesEl.textContent =
      `valence ${affect.valence.toFixed(2)} · activation ${affect.arousal.toFixed(2)}`;
  }

  function onDown(e) {
    e.preventDefault();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    placeAt(cx, cy);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);
  }
  function onMove(e) {
    if (e.touches) e.preventDefault();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    placeAt(cx, cy);
  }
  function onUp() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onUp);
  }

  pad.addEventListener('mousedown', onDown);
  pad.addEventListener('touchstart', onDown, { passive: false });
}

function showAffectOnboarding() {
  document.getElementById('affect-overlay').classList.add('active');
}
function confirmAffect() {
  const pad = document.getElementById('affect-pad');
  affectState = pad._pending || { valence: 0, arousal: 0 };
  localStorage.setItem('el_affect', JSON.stringify(affectState));
  localStorage.setItem('el_affect_onboarded', '1');
  document.getElementById('affect-overlay').classList.remove('active');
  applyAffect(affectState);
}
function skipAffectOnboarding() {
  localStorage.setItem('el_affect_onboarded', '1');
  document.getElementById('affect-overlay').classList.remove('active');
}
function maybeShowAffectOnboarding() {
  // show on every login / page-enter so the user explicitly sets a mood baseline.
  // within a single session they can still dismiss it with Skip/Continue.
  setTimeout(showAffectOnboarding, 550);
}

// ---- GPS + NEARBY toggles ----
let gpsOn = false;
function toggleGps() {
  gpsOn = !gpsOn;
  const btn = document.getElementById('gps-toggle');
  btn.classList.toggle('on', gpsOn);
  btn.querySelector('.gps-text').textContent = gpsOn ? 'GPS ON' : 'GPS OFF';
  if (gpsOn) { autoLocateTried = false; autoLocate(); }
}
function showNearby() {
  if (!map) return;
  if (entries.length === 0) { showMapHint('No check-ins yet — drop the first one.'); return; }
  const last = entries[entries.length - 1];
  map.flyTo({ center: [last.lng, last.lat], zoom: 17, pitch: 60, bearing: -18, duration: 1200 });
}

// ---- JELLYFISH CHAT (RAG via /api/jelly serverless function) ----
let _jellyChatBusy = false;

// per-emotion fallback responses for prototype mode (used when /api/jelly is
// unreachable or no ANTHROPIC_API_KEY is set yet). Same gentle-witness tone
// as the live system prompt, just hand-written.
const JELLY_EMOTION_LINES = {
  joy: [
    "{place} held some lightness. what kept it there?",
    "joy at {place}. small kind, or one that surprised you?",
    "noted — it matters that you log the bright ones too."
  ],
  calm: [
    "calm at {place}. did it find you, or did you find it?",
    "settled. that's a useful shape to know.",
    "peace near {place}. quiet, or just unhurried?"
  ],
  energy: [
    "buzzing near {place}. what's it pulling you toward?",
    "high charge logged. anything you want to do with it?",
    "bright and moving. i'll witness."
  ],
  sadness: [
    "sadness at {place}. you don't have to do anything with it.",
    "logged. sit with it as long as you need.",
    "is it about the place, or is the place just where it landed?"
  ],
  anxiety: [
    "anxious near {place}. one small thing — what's the loudest piece?",
    "the spiral. breath if you can. i'll keep the seat warm.",
    "noted. did it follow you in, or did the place stir it up?"
  ],
  anger: [
    "anger near {place}. that's loud. what would it say if it had words?",
    "logged. anger usually points at something — notice where it aims.",
    "real and worth marking. don't apologize for it."
  ],
  love: [
    "love at {place}. who's it for?",
    "warm. logged.",
    "the kind that stays, or the kind that visits?"
  ],
  wonder: [
    "wonder at {place}. what made the world feel bigger?",
    "logged. those moments don't always announce themselves.",
    "rare and worth a pin."
  ]
};
const JELLY_IDLE_LINES = [
  "what's the air like where you are?",
  "small check-in: how's your chest?",
  "stop and notice — anything moved?"
];
const JELLY_GENERIC_LINES = [
  "still listening.",
  "with you. say more if you want.",
  "tell me where that's coming from.",
  "i hear you. nothing to fix, just here."
];

function localJellyFallback(message, ctx) {
  const last = (ctx.recentEntries || []).slice(-1)[0];
  const place = (last && last.place) || 'where you are';
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  if (message === '[just_logged]') {
    const emotion = (last && last.emotion) || 'joy';
    const lines = JELLY_EMOTION_LINES[emotion] || JELLY_EMOTION_LINES.joy;
    return pick(lines).replace('{place}', place);
  }
  if (message === '[idle_check]') return pick(JELLY_IDLE_LINES);
  return pick(JELLY_GENERIC_LINES);
}

function buildJellyContext(extra = {}) {
  const recent = entries.slice(-6).map(e => ({
    emotion: (e.emotions || [])[0],
    intensity: e.intensity,
    place: e.placeName || `${e.lat.toFixed(3)}, ${e.lng.toFixed(3)}`,
    note: e.note,
    timestamp: e.timestamp
  }));
  const last = recent[recent.length - 1];

  // ---- area mood: scan community entries near the user's current center ----
  let areaMood = null;
  try {
    const center = (map && map.getCenter && map.getCenter())
      || (last && { lat: last.lat, lng: last.lng })
      || { lat: 37.8716, lng: -122.2727 };
    const NEAR_KM = 0.6;  // ~6 city blocks
    const nearby = (_serverEntries || []).filter(e => {
      const d = haversineKm(+e.lat, +e.lng, center.lat, center.lng);
      return d <= NEAR_KM;
    });
    if (nearby.length >= 2) {
      const counts = {};
      nearby.forEach(e => { counts[e.emotion] = (counts[e.emotion] || 0) + 1; });
      const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      const top = ranked[0];
      areaMood = {
        n: nearby.length,
        top: top[0],
        topShare: +(top[1] / nearby.length).toFixed(2),
        mix: ranked.slice(0, 4).map(([e, c]) => ({ emotion: e, count: c }))
      };
    }
  } catch (_) {}

  return {
    recentEntries: recent,
    affect: affectState,
    lastEmotion: last && last.emotion,
    placeNow: extra.placeNow || (last && last.place) || null,
    areaMood,
    ...extra
  };
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

async function askJelly(message, contextExtras) {
  if (_jellyChatBusy) return;
  _jellyChatBusy = true;

  const ctx = buildJellyContext(contextExtras || {});
  // open the panel up-front so the user can see the loading dots + reply land
  openJellyChat();
  appendJellyChat({ who: 'you', text: message === '[just_logged]' || message === '[idle_check]' ? null : message });
  appendJellyChat({ who: 'jelly', loading: true });

  // brief artificial delay so the loading dots register even when we go local
  const minDelay = new Promise(r => setTimeout(r, 600));

  let reply = null;
  try {
    const res = await fetch('/api/jelly', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context: ctx })
    });
    if (res.ok) {
      const data = await res.json();
      reply = (data && data.reply) || null;
    }
  } catch (e) {
    // network or function error → drop to fallback
  }

  if (!reply) reply = localJellyFallback(message, ctx);

  await minDelay;
  replaceLoadingJellyMessage(reply);
  _jellyChatBusy = false;
}

function appendJellyChat({ who, text, loading }) {
  const log = document.getElementById('jelly-chat-log');
  if (!log) return;
  if (text === null) return;  // skip rendering empty user-side trigger messages
  const div = document.createElement('div');
  div.className = `jelly-msg ${who}` + (loading ? ' loading' : '');
  if (loading) {
    div.innerHTML = '<span class="dots"><span></span><span></span><span></span></span>';
  } else {
    div.textContent = text;
  }
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function replaceLoadingJellyMessage(text) {
  const log = document.getElementById('jelly-chat-log');
  if (!log) return;
  const loading = log.querySelector('.jelly-msg.loading');
  if (loading) {
    loading.classList.remove('loading');
    loading.innerHTML = '';
    loading.textContent = text;
  } else {
    appendJellyChat({ who: 'jelly', text });
  }
  log.scrollTop = log.scrollHeight;
}

function openJellyChat() {
  const wrap = document.getElementById('jelly-chat');
  if (wrap) wrap.classList.add('open');
}
function closeJellyChat() {
  const wrap = document.getElementById('jelly-chat');
  if (wrap) wrap.classList.remove('open');
}
function toggleJellyChat() {
  const wrap = document.getElementById('jelly-chat');
  if (!wrap) return;
  wrap.classList.toggle('open');
  if (wrap.classList.contains('open')) {
    setTimeout(() => document.getElementById('jelly-chat-input')?.focus(), 100);
  }
}

function sendToJelly() {
  const input = document.getElementById('jelly-chat-input');
  if (!input) return;
  const txt = input.value.trim();
  if (!txt) return;
  input.value = '';
  askJelly(txt);
}

// ---- DOCK CHAT (the always-visible bottom bar) ----
async function sendDockToJelly() {
  const input = document.getElementById('jelly-dock-input');
  if (!input) return;
  const txt = input.value.trim();
  if (!txt) return;
  input.value = '';

  appendDockMessage('you', txt);
  const loaderId = appendDockMessage('jelly-loading');

  const ctx = buildJellyContext({});
  const minDelay = new Promise(r => setTimeout(r, 500));

  let reply = null;
  try {
    const res = await fetch('/api/jelly', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: txt, context: ctx })
    });
    if (res.ok) {
      const data = await res.json();
      reply = (data && data.reply) || null;
    }
  } catch (_) {}
  if (!reply) reply = localJellyFallback(txt, ctx);

  await minDelay;
  replaceDockLoading(loaderId, reply);
}

function dockProactiveReply(message, contextExtras) {
  // used by submitEntry-style triggers; surfaces in the dock feed
  const ctx = buildJellyContext(contextExtras || {});
  const loaderId = appendDockMessage('jelly-loading');
  const minDelay = new Promise(r => setTimeout(r, 600));

  (async () => {
    let reply = null;
    try {
      const res = await fetch('/api/jelly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context: ctx })
      });
      if (res.ok) {
        const data = await res.json();
        reply = (data && data.reply) || null;
      }
    } catch (_) {}
    if (!reply) reply = localJellyFallback(message, ctx);
    await minDelay;
    replaceDockLoading(loaderId, reply);
  })();
}

function appendDockMessage(who, text) {
  const feed = document.getElementById('jelly-dock-feed');
  if (!feed) return null;
  const id = 'jdm-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  const div = document.createElement('div');
  div.className = `jdm jdm-${who}`;
  div.id = id;
  if (who === 'jelly-loading') {
    div.innerHTML = '<span class="jdm-dots"><span></span><span></span><span></span></span>';
  } else {
    div.textContent = text;
  }
  feed.appendChild(div);

  // scroll feed to newest at the bottom
  feed.scrollTop = feed.scrollHeight;

  // limit visible history to keep the dock light
  const all = feed.querySelectorAll('.jdm');
  if (all.length > 8) all[0].remove();

  return id;
}

function replaceDockLoading(loaderId, text) {
  const el = loaderId ? document.getElementById(loaderId) : null;
  if (el) {
    el.classList.remove('jdm-jelly-loading');
    el.classList.add('jdm-jelly');
    el.innerHTML = '';
    el.textContent = text;
    const feed = document.getElementById('jelly-dock-feed');
    if (feed) feed.scrollTop = feed.scrollHeight;
  } else {
    appendDockMessage('jelly', text);
  }
}

// ---- JELLYFISH EXPLORER (3D GLB model rendered via Three.js custom layer) ----
// final rotation tuned via the debug panel: X 4°, Y 2°, Z -127°
const JELLY_ROT_X = (4 * Math.PI) / 180;
const JELLY_ROT_Y = (2 * Math.PI) / 180;
const JELLY_ROT_Z = (-127 * Math.PI) / 180;
const JELLY_GLB_URL = 'cute_pastel_jellyfish.glb';
const JELLY_ALTITUDE_M = 22;     // meters above the ground plane
const JELLY_MODEL_SCALE = 18;    // model fits inside this cube (meters)

// kept for backward-compat with old code paths; the 3D layer is the real renderer now
const JELLY_SVG = `
<svg class="jelly-svg" viewBox="0 0 140 210" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="jelly-bell-grad" cx="0.4" cy="0.28" r="0.78">
      <stop offset="0"    stop-color="#ffffff" stop-opacity="1"/>
      <stop offset="0.22" stop-color="#ffc4ea" stop-opacity="1"/>
      <stop offset="0.55" stop-color="#ff6bc0" stop-opacity="0.98"/>
      <stop offset="1"    stop-color="#7b2aa0" stop-opacity="0.95"/>
    </radialGradient>
    <radialGradient id="jelly-glow-grad" cx="0.5" cy="0.38" r="0.55">
      <stop offset="0"    stop-color="rgba(255, 140, 220, 0.55)"/>
      <stop offset="0.6"  stop-color="rgba(255, 100, 200, 0.25)"/>
      <stop offset="1"    stop-color="rgba(255, 100, 200, 0)"/>
    </radialGradient>
  </defs>
  <!-- glow halo -->
  <ellipse cx="70" cy="60" rx="70" ry="52" fill="url(#jelly-glow-grad)"/>
  <!-- tentacles -->
  <g class="jelly-tentacles" stroke-linecap="round" fill="none">
    <path d="M34 82 Q26 110 38 138 Q48 164 38 198" stroke="#d94aab" stroke-width="4"   opacity="0.95"/>
    <path d="M52 90 Q48 116 56 144 Q62 172 54 202" stroke="#f07dc8" stroke-width="3.5" opacity="0.95"/>
    <path d="M70 92 Q70 120 72 150 Q74 178 70 206" stroke="#ffb0dd" stroke-width="3.5" opacity="1"/>
    <path d="M88 90 Q92 116 84 144 Q78 172 86 202" stroke="#f07dc8" stroke-width="3.5" opacity="0.95"/>
    <path d="M106 82 Q114 110 102 138 Q92 164 102 198" stroke="#d94aab" stroke-width="4" opacity="0.95"/>
  </g>
  <!-- bell -->
  <ellipse cx="70" cy="58" rx="46" ry="34" fill="url(#jelly-bell-grad)" stroke="#ffdaf0" stroke-width="2.2"/>
  <!-- bell highlights -->
  <ellipse cx="56" cy="46" rx="17" ry="9"  fill="rgba(255,255,255,0.82)"/>
  <ellipse cx="82" cy="50" rx="6"  ry="3"  fill="rgba(255,255,255,0.55)"/>
  <!-- tiny sparkle -->
  <circle cx="50"  cy="42" r="2" fill="#ffffff"/>
  <circle cx="92"  cy="64" r="1.4" fill="#ffffff" opacity="0.7"/>
</svg>`;

let jellyfishMarker = null;
let jellyfishShadowLngLat = null;
const jellyKeys = new Set();
let jellyVel = { x: 0, y: 0 };  // in lng/lat deg per frame (camera-local)
const JELLY_FRICTION = 0.86;
let _jellyRaf = null;
let _jellySteered = false;
let _jellySelfMove = false;  // true while our own setCenter is animating

function spawnJellyfish() {
  if (jellyfishMarker || typeof map === 'undefined') return;
  const center = map.getCenter();
  jellyfishShadowLngLat = { lng: center.lng, lat: center.lat };

  // -- 3D model layer (Three.js renders into MapLibre's gl context) --
  if (typeof THREE === 'undefined') {
    console.warn('three.js not loaded; jellyfish unavailable');
    return;
  }
  if (!map.getLayer('el-jelly-3d')) {
    map.addLayer(buildJellyfish3DLayer());
  }
  // a sentinel so the rest of the app knows the jellyfish exists
  jellyfishMarker = { _isThreeJsBacked: true };

  // soft ground shadow under the jellyfish (ground-aligned, moves with it)
  if (!map.getSource('el-jelly-shadow')) {
    map.addSource('el-jelly-shadow', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });
    map.addLayer({
      id: 'el-jelly-shadow',
      type: 'circle',
      source: 'el-jelly-shadow',
      paint: {
        'circle-color': '#7eb6ff',
        'circle-pitch-alignment': 'map',
        'circle-pitch-scale': 'map',
        'circle-radius': 26,
        'circle-blur': 1,
        'circle-opacity': 0.55
      }
    });
    // inner darker core so it reads as a ground anchor
    map.addLayer({
      id: 'el-jelly-shadow-core',
      type: 'circle',
      source: 'el-jelly-shadow',
      paint: {
        'circle-color': 'rgba(20, 40, 95, 0.5)',
        'circle-pitch-alignment': 'map',
        'circle-pitch-scale': 'map',
        'circle-radius': 10,
        'circle-blur': 0.6
      }
    });
  }
  updateJellyShadow();
  showJellyHint();

  // until the user has taken the wheel, the jelly re-snaps to camera center
  // whenever the camera settles (autoLocate, manual pan, etc.)
  map.on('moveend', syncJellyToCameraIfIdle);

  if (_jellyRaf) cancelAnimationFrame(_jellyRaf);
  _jellyRaf = requestAnimationFrame(jellyLoop);
}

function syncJellyToCameraIfIdle(e) {
  if (!jellyfishMarker) return;
  if (_jellySteered) return;         // user has grabbed control
  if (_jellySelfMove) return;        // we caused this movement
  // skip user-driven movements (mouse drag, wheel zoom, pinch). These have an
  // originalEvent on the moveend payload; programmatic flyTo / autoLocate don't.
  if (e && e.originalEvent) return;
  const c = map.getCenter();
  jellyfishShadowLngLat = { lng: c.lng, lat: c.lat };
  updateJellyShadow();
  // 3D jelly reads jellyfishShadowLngLat each frame, so just nudge a repaint
  if (map.triggerRepaint) map.triggerRepaint();
}

// MapLibre custom layer that renders the GLB via Three.js
function buildJellyfish3DLayer() {
  return {
    id: 'el-jelly-3d',
    type: 'custom',
    renderingMode: '3d',

    onAdd: function (map, gl) {
      this.map = map;
      this.camera = new THREE.Camera();
      this.scene = new THREE.Scene();

      // bright, even illumination so pastel surfaces read on a sunlit map
      this.scene.add(new THREE.AmbientLight(0xffffff, 1.1));
      this.scene.add(new THREE.HemisphereLight(0xfff4e6, 0xb8a6dc, 0.55));
      const key = new THREE.DirectionalLight(0xffffff, 0.7);
      key.position.set(60, 100, 120);
      this.scene.add(key);
      const rim = new THREE.DirectionalLight(0xffd0ee, 0.5);
      rim.position.set(-80, 40, 90);
      this.scene.add(rim);

      this.renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true
      });
      this.renderer.autoClear = false;
      this.clock = new THREE.Clock();

      // pulsing bottom light — gives the jelly a glow from below.
      // its intensity oscillates each frame inside render().
      this.bottomLight = new THREE.PointLight(0x9ec7ff, 2.2, 28, 1.4);
      this.bottomLight.position.set(0, 0, 0);   // sits at the bottom of the centered model
      this.scene.add(this.bottomLight);

      const loader = new THREE.GLTFLoader();
      loader.load(
        JELLY_GLB_URL,
        (gltf) => {
          const model = gltf.scene;

          // Normalize: re-center to origin and scale so the longest axis = JELLY_MODEL_SCALE meters
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const longest = Math.max(size.x, size.y, size.z) || 1;
          const norm = JELLY_MODEL_SCALE / longest;

          // pivot the model on its bottom-center so altitude is measured from the tentacles
          model.position.set(-center.x * norm, -box.min.y * norm, -center.z * norm);
          model.scale.setScalar(norm);

          // make the jellyfish translucent so emotion washes / map colors pick through it
          model.traverse((node) => {
            if (node.isMesh && node.material) {
              const mat = node.material;
              if ('transparent' in mat) mat.transparent = true;
              if ('opacity' in mat) mat.opacity = 0.55;
              if ('depthWrite' in mat) mat.depthWrite = false;
              // a touch of emissive so the bell holds its own light
              if ('emissive' in mat && mat.emissive) {
                mat.emissive.set(0x4a78ff);
                if ('emissiveIntensity' in mat) mat.emissiveIntensity = 0.18;
              }
            }
          });

          this.model = model;
          this.scene.add(model);

          // animations disabled — they were tilting the bell over time and
          // making orientation appear inconsistent across screenshots.
          // (re-enable by uncommenting this block if the model has a swim cycle worth playing)
          // if (gltf.animations && gltf.animations.length) {
          //   this.mixer = new THREE.AnimationMixer(model);
          //   gltf.animations.forEach(c => this.mixer.clipAction(c).play());
          // }
        },
        undefined,
        (err) => console.error('jellyfish glb load failed', err)
      );
    },

    render: function (gl, matrix) {
      if (!this.model || !jellyfishShadowLngLat) return;

      const t = (typeof performance !== 'undefined' ? performance.now() : Date.now()) * 0.001;
      const altitude = JELLY_ALTITUDE_M + Math.sin(t * 0.9) * 2.0;

      // pulse the bottom light's intensity in time with the bob
      if (this.bottomLight) {
        this.bottomLight.intensity = 2.0 + Math.sin(t * 0.9 + 0.4) * 0.7;
      }

      const merc = maplibregl.MercatorCoordinate.fromLngLat(
        [jellyfishShadowLngLat.lng, jellyfishShadowLngLat.lat],
        altitude
      );
      // 1 unit in Three.js = 1 meter; the model is already pre-scaled to meters in onAdd
      const meterScale = merc.meterInMercatorCoordinateUnits();

      const rotX = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), JELLY_ROT_X);
      const rotY = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), JELLY_ROT_Y);
      const rotZ = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), JELLY_ROT_Z);

      const m = new THREE.Matrix4().fromArray(matrix);
      const l = new THREE.Matrix4()
        .makeTranslation(merc.x, merc.y, merc.z)
        .scale(new THREE.Vector3(meterScale, -meterScale, meterScale))
        .multiply(rotZ)
        .multiply(rotX)
        .multiply(rotY);

      this.camera.projectionMatrix = m.multiply(l);
      this.renderer.resetState();

      if (this.mixer) this.mixer.update(this.clock.getDelta());

      this.renderer.render(this.scene, this.camera);
      this.map.triggerRepaint();
    }
  };
}

function updateJellyShadow() {
  const src = map && map.getSource && map.getSource('el-jelly-shadow');
  if (!src || !jellyfishShadowLngLat) return;
  src.setData({
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [jellyfishShadowLngLat.lng, jellyfishShadowLngLat.lat] },
      properties: {}
    }]
  });
}

function showJellyHint() {
  const hint = document.getElementById('jelly-hint');
  if (!hint) return;
  hint.classList.add('visible');
  clearTimeout(showJellyHint._t);
  showJellyHint._t = setTimeout(() => hint.classList.remove('visible'), 6000);
}

function jellyLoop() {
  if (!jellyfishMarker) return;
  let ax = 0, ay = 0;
  if (jellyKeys.has('w') || jellyKeys.has('arrowup'))    ay += 1;
  if (jellyKeys.has('s') || jellyKeys.has('arrowdown'))  ay -= 1;
  if (jellyKeys.has('a') || jellyKeys.has('arrowleft'))  ax -= 1;
  if (jellyKeys.has('d') || jellyKeys.has('arrowright')) ax += 1;

  const mag = Math.hypot(ax, ay);
  if (mag > 0) { ax /= mag; ay /= mag; }

  const zoom = map.getZoom();
  // thrust scales with zoom so movement feels consistent whether zoomed in or out
  const thrust = 0.0000009 * Math.pow(2, 20 - zoom);

  jellyVel.x = jellyVel.x * JELLY_FRICTION + ax * thrust * (1 - JELLY_FRICTION);
  jellyVel.y = jellyVel.y * JELLY_FRICTION + ay * thrust * (1 - JELLY_FRICTION);

  if (Math.abs(jellyVel.x) + Math.abs(jellyVel.y) > 1e-12) {
    // rotate input by camera bearing so "up" == toward horizon
    const bearingRad = -map.getBearing() * Math.PI / 180;
    const cs = Math.cos(bearingRad), sn = Math.sin(bearingRad);
    const dLng = jellyVel.x * cs - jellyVel.y * sn;
    const dLat = jellyVel.x * sn + jellyVel.y * cs;
    jellyfishShadowLngLat.lng += dLng;
    jellyfishShadowLngLat.lat += dLat;
    updateJellyShadow();
    if (map.triggerRepaint) map.triggerRepaint();

    // follow camera when actively steering — setCenter is synchronous,
    // so the jelly stays pinned to the screen's center instead of sliding
    // off-axis with each stutter of easeTo
    if (mag > 0) {
      _jellySteered = true;
      _jellySelfMove = true;
      map.setCenter([jellyfishShadowLngLat.lng, jellyfishShadowLngLat.lat]);
      _jellySelfMove = false;
    }
  }

  _jellyRaf = requestAnimationFrame(jellyLoop);
}

window.addEventListener('keydown', e => {
  if (!jellyfishMarker) return;
  const tag = document.activeElement && document.activeElement.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea') return;
  if (document.getElementById('modal-overlay')?.classList.contains('active')) return;
  if (document.getElementById('affect-overlay')?.classList.contains('active')) return;
  const k = e.key.toLowerCase();
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'].includes(k)) {
    jellyKeys.add(k);
    e.preventDefault();
  }
});
window.addEventListener('keyup', e => {
  jellyKeys.delete(e.key.toLowerCase());
});

// ---- WORLD CHAT / LIVE FEED ----
function findPlaceName(lng, lat) {
  if (!map || !map.loaded || !map.loaded()) return null;
  try {
    const p = map.project([lng, lat]);
    const bbox = [[p.x - 60, p.y - 60], [p.x + 60, p.y + 60]];
    const feats = map.queryRenderedFeatures(bbox);
    const pickNamed = (predicate) => {
      const hit = feats.find(f => predicate(f) && f.properties && (f.properties.name || f.properties.name_en));
      return hit ? (hit.properties.name_en || hit.properties.name) : null;
    };
    return (
      pickNamed(f => (f.sourceLayer || '').toLowerCase().includes('poi')) ||
      pickNamed(f => (f.sourceLayer || '').toLowerCase().includes('building')) ||
      pickNamed(f => (f.sourceLayer || '').toLowerCase().includes('transportation')) ||
      pickNamed(() => true)
    );
  } catch (e) {
    return null;
  }
}

function formatRelTime(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 45) return 'just now';
  if (diff < 3600) return Math.max(1, Math.floor(diff / 60)) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

function renderWorldChat() {
  const feed = document.getElementById('world-chat-feed');
  const count = document.getElementById('wc-count');
  if (!feed) return;

  // merge community feed (server) with this user's local entries that haven't synced yet
  const fromServer = (_serverEntries || []).map(e => ({
    id: e.id,
    lat: +e.lat,
    lng: +e.lng,
    emotion: e.emotion,
    placeName: e.placeName || '',
    timestamp: e.timestamp
  }));
  const fromLocal = entries.map(e => ({
    id: e.id,
    lat: e.lat,
    lng: e.lng,
    emotion: (e.emotions || [])[0] || 'joy',
    placeName: e.placeName || '',
    timestamp: e.timestamp
  }));
  const merged = [...fromServer, ...fromLocal]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 24);

  if (count) count.textContent = (_serverEntries || []).length || entries.length;

  if (merged.length === 0) {
    feed.innerHTML = `<div class="wc-empty">No check-ins yet. Drop the pin to begin.</div>`;
    return;
  }

  feed.innerHTML = merged.map(e => {
    const em = EMOTION_MAP[e.emotion] || EMOTIONS[0];
    const place = e.placeName ? e.placeName : `${e.lat.toFixed(3)}, ${e.lng.toFixed(3)}`;
    const coords = `${e.lat.toFixed(4)}, ${e.lng.toFixed(4)}`;
    return `
      <div class="wc-message" data-lat="${e.lat}" data-lng="${e.lng}" style="--m-color:${em.color};">
        <span class="emo-dot"></span>
        <div class="body">
          <div class="line">
            <span class="emo-label">${em.label}</span>
            <span class="place-txt">logged at ${place}</span>
          </div>
          <div class="meta">${coords} · ${formatRelTime(e.timestamp)}</div>
        </div>
      </div>`;
  }).join('');

  feed.querySelectorAll('.wc-message').forEach(el => {
    el.addEventListener('click', () => {
      const lat = parseFloat(el.dataset.lat);
      const lng = parseFloat(el.dataset.lng);
      if (!isNaN(lat) && !isNaN(lng) && map) {
        map.flyTo({ center: [lng, lat], zoom: 17, pitch: 60, bearing: -18, duration: 1200 });
      }
    });
  });
}

function refreshFeelingsSource() {
  const src = map && map.getSource && map.getSource('el-feelings');
  if (!src) return;
  const features = [];
  entries.forEach(entry => {
    entry.emotions.forEach(emId => {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [entry.lng, entry.lat] },
        properties: {
          emotion: emId,
          weight: Math.max(0.25, (entry.intensity || 5) / 10)
        }
      });
    });
  });
  src.setData({ type: 'FeatureCollection', features });
}

// ---- MAP (MapLibre GL — 3D pitched view, OpenFreeMap tiles) ----
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://tiles.openfreemap.org/styles/liberty',
  center: [-122.2727, 37.8716],
  zoom: 17.5,
  pitch: 60,
  bearing: -18,
  antialias: true,
  attributionControl: { compact: true }
});

map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

map.on('load', () => {
  // warm the base palette to match the paper aesthetic
  const tint = (layerId, prop, value) => {
    if (map.getLayer(layerId)) {
      try { map.setPaintProperty(layerId, prop, value); } catch (_) {}
    }
  };

  // white ground
  tint('background', 'background-color', '#ffffff');

  // parks, forest, grass → very pale blue-green
  ['park', 'park_outline', 'landcover_wood', 'landcover_grass', 'landuse_residential']
    .forEach(id => tint(id, 'fill-color', '#e6efff'));

  // water → pale electric blue
  ['water', 'water_name'].forEach(id => tint(id, 'fill-color', '#bcd0ff'));

  // roads → near-white with a hint of blue
  const roadIds = ['highway_motorway', 'highway_trunk', 'highway_primary',
    'highway_secondary', 'highway_tertiary', 'highway_minor', 'highway_path',
    'road_motorway', 'road_trunk_primary', 'road_secondary_tertiary', 'road_minor',
    'tunnel_motorway', 'bridge_motorway'];
  roadIds.forEach(id => {
    tint(id, 'line-color', '#f4f7ff');
    tint(id, 'line-opacity', 0.95);
  });

  // remove / hide every building-related layer the style ships with,
  // so only our single extrusion draws (prevents z-fighting + stripe artifacts)
  const existingLayers = map.getStyle().layers;
  existingLayers.forEach(l => {
    const isBuildingLayer = l['source-layer'] === 'building' || (l.id && l.id.toLowerCase().includes('building'));
    if (!isBuildingLayer) return;
    if (l.type === 'fill-extrusion') {
      map.removeLayer(l.id);
    } else if (l.type === 'fill') {
      try { map.setPaintProperty(l.id, 'fill-opacity', 0); } catch (_) {}
    } else if (l.type === 'line') {
      try { map.setPaintProperty(l.id, 'line-opacity', 0); } catch (_) {}
    }
  });

  // find the first label layer — everything we add before it draws under labels
  const layers = map.getStyle().layers;
  let firstSymbolId;
  for (const layer of layers) {
    if (layer.type === 'symbol') { firstSymbolId = layer.id; break; }
  }

  // emotional wash — one heatmap layer per emotion, sharing a single source
  if (!map.getSource('el-feelings')) {
    map.addSource('el-feelings', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });
  }

  // ground-aligned circle wash — lies flat on the world, stretches with perspective,
  // occluded by buildings. Two layers per emotion: a wide soft halo + a tight core,
  // stacking to give a radial falloff that sits in the 3D scene.
  EMOTIONS.forEach(em => {
    const haloId = `el-wash-${em.id}-halo`;
    const coreId = `el-wash-${em.id}-core`;
    if (map.getLayer(haloId)) map.removeLayer(haloId);
    if (map.getLayer(coreId)) map.removeLayer(coreId);

    // HALO — ring stroke only (no fill). Rings overlap as concentric rings,
    // they don't accumulate as darkening blobs.
    map.addLayer({
      id: haloId,
      type: 'circle',
      source: 'el-feelings',
      filter: ['==', ['get', 'emotion'], em.id],
      paint: {
        'circle-color': 'rgba(0,0,0,0)',
        'circle-pitch-alignment': 'map',
        'circle-pitch-scale': 'map',
        'circle-radius': [
          'interpolate', ['linear'], ['zoom'],
          10, 4,
          12, 8,
          14, 14,
          15, 20,
          17, 40,
          19, 80
        ],
        'circle-stroke-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 0.8,
          14, 1.2,
          17, 2,
          19, 3
        ],
        'circle-stroke-color': em.color,
        'circle-stroke-opacity': [
          'interpolate', ['linear'], ['zoom'],
          10, 0.30,
          14, 0.45,
          17, 0.55,
          19, 0.65
        ]
      }
    }, firstSymbolId);

    // CORE — small filled dot with a thin white stroke for crispness
    map.addLayer({
      id: coreId,
      type: 'circle',
      source: 'el-feelings',
      filter: ['==', ['get', 'emotion'], em.id],
      paint: {
        'circle-color': em.color,
        'circle-pitch-alignment': 'map',
        'circle-pitch-scale': 'map',
        'circle-radius': [
          'interpolate', ['linear'], ['zoom'],
          10, 2.5,
          12, 4,
          14, 6,
          15, 8,
          17, 14,
          19, 24
        ],
        'circle-blur': 0,
        'circle-opacity': [
          'interpolate', ['linear'], ['coalesce', ['get', 'weight'], 0.5],
          0.25, 0.7,
          1,    0.92
        ],
        'circle-stroke-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 0.5,
          14, 1,
          17, 1.5,
          19, 2
        ],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-opacity': 0.7
      }
    }, firstSymbolId);
  });

  // drop reticle — ground-aligned, only visible while dragging the pin
  if (!map.getSource('el-reticle')) {
    map.addSource('el-reticle', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });
  }
  if (!map.getLayer('el-reticle-halo')) {
    map.addLayer({
      id: 'el-reticle-halo',
      type: 'circle',
      source: 'el-reticle',
      paint: {
        'circle-color': 'rgba(194,123,94,0.22)',
        'circle-pitch-alignment': 'map',
        'circle-pitch-scale': 'map',
        'circle-radius': 32,
        'circle-blur': 0.6,
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#c27b5e',
        'circle-stroke-opacity': 0.85
      }
    }, firstSymbolId);
  }
  if (!map.getLayer('el-reticle-dot')) {
    map.addLayer({
      id: 'el-reticle-dot',
      type: 'circle',
      source: 'el-reticle',
      paint: {
        'circle-color': '#c27b5e',
        'circle-pitch-alignment': 'map',
        'circle-pitch-scale': 'map',
        'circle-radius': 6,
        'circle-blur': 0.15
      }
    }, firstSymbolId);
  }

  // 3D building extrusion — added AFTER heatmaps so buildings occlude the wash
  if (!map.getLayer('el-3d-buildings')) {
    map.addLayer({
      id: 'el-3d-buildings',
      source: 'openmaptiles',
      'source-layer': 'building',
      type: 'fill-extrusion',
      minzoom: 14,
      paint: {
        'fill-extrusion-color': [
          'interpolate', ['linear'], ['coalesce', ['get', 'render_height'], ['get', 'height'], 10],
          0, '#eef2ff',
          20, '#d9e1ff',
          60, '#b6c4ee',
          150, '#7e93d4'
        ],
        'fill-extrusion-height': [
          'interpolate', ['linear'], ['zoom'],
          14, 0,
          15.05, ['coalesce', ['get', 'render_height'], ['get', 'height'], 10]
        ],
        'fill-extrusion-base': [
          'interpolate', ['linear'], ['zoom'],
          14, 0,
          15.05, ['coalesce', ['get', 'render_min_height'], ['get', 'min_height'], 0]
        ],
        'fill-extrusion-opacity': 1,
        'fill-extrusion-vertical-gradient': false
      }
    }, firstSymbolId);
  }

  // once tiles are styled, drop any existing markers + paint the wash + prime feed
  renderMarkers();
  refreshFeelingsSource();
  renderWorldChat();
  if (affectState) applyAffect(affectState);
  spawnJellyfish();
});

map.on('click', function(e) {
  const latlng = { lat: e.lngLat.lat, lng: e.lngLat.lng };
  pendingLatLng = latlng;
  openModal(latlng);
});

const activeMarkers = [];

function renderMarkers() {
  // clear any previous markers (e.g. after submitEntry re-calls renderMarkers)
  while (activeMarkers.length) activeMarkers.pop().remove();
  entries.forEach(entry => addMarker(entry));
}

function addMarker(entry) {
  const primary = EMOTION_MAP[entry.emotions[0]] || EMOTIONS[0];
  const size = 38 + (entry.intensity * 4);

  // deterministic "organic" blob shape per entry so it doesn't reshuffle on re-render
  const seed = (entry.id || 1) >>> 0;
  const r = (k) => {
    const n = Math.sin(seed * 9301 + k * 49297) * 43758.5453;
    return n - Math.floor(n);
  };
  const rad = i => (38 + Math.floor(r(i) * 34)) + '%';
  const borderRadius =
    `${rad(1)} ${rad(2)} ${rad(3)} ${rad(4)} / ${rad(5)} ${rad(6)} ${rad(7)} ${rad(8)}`;
  const rot = Math.floor(r(9) * 360);

  const el = document.createElement('div');
  el.className = 'emotion-marker';
  el.style.cssText = `
    width:${size}px; height:${size}px;
    background:
      radial-gradient(ellipse 70% 65% at 38% 32%, ${primary.color}f2, ${primary.color}b8 55%, ${primary.color}60 85%, ${primary.color}00);
    box-shadow:
      0 0 ${size * 1.1}px ${primary.glow},
      0 0 ${size * 0.55}px ${primary.glow};
    border-radius: ${borderRadius};
    transform: rotate(${rot}deg);
    mix-blend-mode: multiply;
  `;

  const emotionTags = entry.emotions.map(id => {
    const em = EMOTION_MAP[id];
    return `<span style="display:inline-block;padding:3px 10px;border-radius:10px;background:${em.color}22;color:${em.color};font-size:11px;font-weight:500;margin:2px;">${em.emoji} ${em.label}</span>`;
  }).join('');

  const popup = new maplibregl.Popup({ offset: size / 2 + 8, closeButton: false, className: 'el-popup' })
    .setHTML(`
      <div style="font-family: inherit; min-width: 180px;">
        <div style="margin-bottom:8px;">${emotionTags}</div>
        <div style="font-size:11px;opacity:0.6;">Intensity ${entry.intensity}/10 &middot; Energy ${entry.energy}/10</div>
        ${entry.note ? `<div style="font-size:13px;margin-top:10px;line-height:1.6;">${entry.note}</div>` : ''}
        <div style="font-size:10px;opacity:0.45;margin-top:8px;">${new Date(entry.timestamp).toLocaleString()}</div>
      </div>
    `);

  const marker = new maplibregl.Marker({
    element: el,
    pitchAlignment: 'map',
    rotationAlignment: 'map'
  })
    .setLngLat([entry.lng, entry.lat])
    .setPopup(popup)
    .addTo(map);

  activeMarkers.push(marker);
}

// ---- DROPPER (drag-and-drop figurine) ----
(function setupDropper() {
  const dropper = document.getElementById('dropper');
  const mapEl = document.getElementById('map');
  let ghost = null;

  const emptyFC = { type: 'FeatureCollection', features: [] };
  function setReticleAt(lngLat) {
    const src = map.getSource('el-reticle');
    if (!src) return;
    src.setData({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lngLat.lng, lngLat.lat] },
        properties: {}
      }]
    });
  }
  function clearReticle() {
    const src = map.getSource('el-reticle');
    if (src) src.setData(emptyFC);
  }

  function onPointerDown(e) {
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // build a ghost that follows the cursor
    ghost = dropper.cloneNode(true);
    ghost.removeAttribute('id');
    ghost.classList.add('dropper-ghost');
    document.body.appendChild(ghost);
    positionGhost(clientX, clientY);

    dropper.classList.add('hidden');
    document.body.classList.add('is-dragging-dropper');

    document.addEventListener('mousemove', onPointerMove);
    document.addEventListener('mouseup', onPointerUp);
    document.addEventListener('touchmove', onPointerMove, { passive: false });
    document.addEventListener('touchend', onPointerUp);
  }

  function positionGhost(x, y) {
    ghost.style.left = x + 'px';
    ghost.style.top = y + 'px';
  }

  function isOverMap(x, y) {
    const rect = mapEl.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  function onPointerMove(e) {
    if (e.touches) e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    positionGhost(clientX, clientY);

    if (isOverMap(clientX, clientY)) {
      const rect = mapEl.getBoundingClientRect();
      const lngLat = map.unproject([clientX - rect.left, clientY - rect.top]);
      setReticleAt(lngLat);
    } else {
      clearReticle();
    }
  }

  function onPointerUp(e) {
    const clientX = e.changedTouches ? e.changedTouches[0].clientX
      : (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
    const clientY = e.changedTouches ? e.changedTouches[0].clientY
      : (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY;

    document.removeEventListener('mousemove', onPointerMove);
    document.removeEventListener('mouseup', onPointerUp);
    document.removeEventListener('touchmove', onPointerMove);
    document.removeEventListener('touchend', onPointerUp);

    clearReticle();
    document.body.classList.remove('is-dragging-dropper');

    if (ghost) { ghost.remove(); ghost = null; }

    if (isOverMap(clientX, clientY)) {
      const rect = mapEl.getBoundingClientRect();
      const lngLat = map.unproject([clientX - rect.left, clientY - rect.top]);
      const latlng = { lat: lngLat.lat, lng: lngLat.lng };
      pendingLatLng = latlng;
      openModal(latlng);
    }

    // return figure to dock
    dropper.classList.remove('hidden');
  }

  dropper.addEventListener('mousedown', onPointerDown);
  dropper.addEventListener('touchstart', onPointerDown, { passive: false });
})();

// ---- MODAL ----
function openModal(latlng) {
  document.getElementById('modal-overlay').classList.add('active');
  document.getElementById('modal-location-label').textContent =
    `Logging at ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`;
  resetLogPad();
  document.getElementById('journal-note').value = '';
  document.querySelectorAll('.trigger-chip').forEach(c => c.classList.remove('selected'));
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
  pendingLatLng = null;
}

// ---- AUTO-LOCATE ----
let locatePingMarker = null;
let autoLocateTried = false;

function showMapHint(msg, hideAfter = 3200) {
  const hint = document.getElementById('map-hint');
  hint.textContent = msg;
  hint.style.opacity = '1';
  clearTimeout(showMapHint._t);
  if (hideAfter) {
    showMapHint._t = setTimeout(() => { hint.style.opacity = '0'; }, hideAfter);
  }
}

function autoLocate() {
  if (autoLocateTried) return;
  autoLocateTried = true;

  if (!navigator.geolocation) return;
  const insecure = location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1';
  if (insecure) return;

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      map.flyTo({ center: [longitude, latitude], zoom: 17, pitch: 60, bearing: -18, duration: 1600 });
      if (locatePingMarker) locatePingMarker.remove();
      const pingEl = document.createElement('div');
      pingEl.className = 'locate-ping';
      locatePingMarker = new maplibregl.Marker({
        element: pingEl,
        pitchAlignment: 'map',
        rotationAlignment: 'map'
      })
        .setLngLat([longitude, latitude])
        .addTo(map);
    },
    (err) => {
      if (err.code === err.PERMISSION_DENIED) return;
      showMapHint('Could not find your location. Showing Berkeley.');
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
}

// ---- LOG PAD (circumplex picker inside the check-in modal) ----
function renderLogPadAnchors() {
  const container = document.getElementById('log-pad-anchors');
  if (!container) return;
  container.innerHTML = EMOTIONS.map(em => {
    const c = EMOTION_COORDS[em.id];
    const left = ((c.valence + 1) / 2) * 100;
    const top  = ((1 - c.arousal) / 2) * 100;
    return `
      <div class="log-pad-anchor" data-emotion="${em.id}" style="left:${left}%; top:${top}%; --anchor-color:${em.color};">
        <div class="dot"></div>
        <div class="label">${em.label}</div>
      </div>`;
  }).join('');
}

function resetLogPad() {
  renderLogPadAnchors();
  const pad = document.getElementById('log-pad');
  const thumb = document.getElementById('log-pad-thumb');
  if (pad) pad._pending = null;
  if (thumb) thumb.classList.remove('visible');
  document.querySelectorAll('#log-pad-anchors .log-pad-anchor').forEach(a => a.classList.remove('nearest'));
  document.getElementById('log-pad-emotion').textContent = '—';
  document.getElementById('log-pad-intensity').textContent = 'tap the field to begin';
}

function setupLogPad() {
  const pad = document.getElementById('log-pad');
  const thumb = document.getElementById('log-pad-thumb');
  if (!pad || !thumb) return;

  function placeAt(clientX, clientY) {
    const rect = pad.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    thumb.style.left = (x * 100) + '%';
    thumb.style.top  = (y * 100) + '%';
    thumb.classList.add('visible');

    const valence = x * 2 - 1;
    const arousal = -(y * 2 - 1);
    const em = nearestEmotion(valence, arousal);
    const intensity = Math.min(10, Math.max(1, Math.round(Math.hypot(valence, arousal) * 10)));
    const energy = Math.max(1, Math.min(10, Math.round((arousal + 1) * 5)));

    pad._pending = { valence, arousal, emotion: em.id, intensity, energy };

    document.querySelectorAll('#log-pad-anchors .log-pad-anchor').forEach(a => {
      a.classList.toggle('nearest', a.dataset.emotion === em.id);
    });
    document.getElementById('log-pad-emotion').textContent = em.label;
    document.getElementById('log-pad-intensity').textContent = `Intensity ${intensity} · Energy ${energy}`;
  }

  function onDown(e) {
    e.preventDefault();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    placeAt(cx, cy);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);
  }
  function onMove(e) {
    if (e.touches) e.preventDefault();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    placeAt(cx, cy);
  }
  function onUp() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onUp);
  }

  pad.addEventListener('mousedown', onDown);
  pad.addEventListener('touchstart', onDown, { passive: false });
}

document.querySelectorAll('.trigger-chip').forEach(chip => {
  chip.addEventListener('click', () => chip.classList.toggle('selected'));
});

function submitEntry() {
  const pad = document.getElementById('log-pad');
  const pending = pad && pad._pending;
  if (!pending) { alert('Tap the field to place how you’re feeling.'); return; }

  const triggers = [...document.querySelectorAll('.trigger-chip.selected')]
    .map(el => el.dataset.trigger);

  const placeName = findPlaceName(pendingLatLng.lng, pendingLatLng.lat);

  const entry = {
    id: Date.now(),
    lat: pendingLatLng.lat,
    lng: pendingLatLng.lng,
    emotions: [pending.emotion],
    valence: pending.valence,
    arousal: pending.arousal,
    intensity: pending.intensity,
    energy: pending.energy,
    note: document.getElementById('journal-note').value.trim(),
    triggers,
    timestamp: new Date().toISOString()
  };
  if (placeName) entry.placeName = placeName;

  entries.push(entry);
  localStorage.setItem('el_entries', JSON.stringify(entries));
  addMarker(entry);
  refreshFeelingsSource();

  // share to community feed
  const me = getOrCreateUserIdentity();
  postServerEntry({
    lat: entry.lat,
    lng: entry.lng,
    emotion: entry.emotions[0],
    intensity: entry.intensity,
    valence: entry.valence,
    arousal: entry.arousal,
    note: entry.note,
    placeName: entry.placeName || '',
    userName: me.name,
    hue: me.hue
  }).then(() => {
    if (document.getElementById('chat-list')) renderChat();
  });

  renderWorldChat();
  if (document.getElementById('chat-list')) renderChat();
  closeModal();
  setTimeout(() => dockProactiveReply('[just_logged]', { placeNow: entry.placeName || null }), 800);
  document.getElementById('map-hint').style.opacity = '0';
  updateSidebarStats();
  updateMapInfo();
}

// ---- VIEWS ----
const VIEW_TITLES = { map: 'Map', dashboard: 'Insights', journal: 'Messages' };

function switchView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.tab-item').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
  document.getElementById(name + '-view').classList.add('active');
  const tabBtn = document.querySelector(`.tab-item[data-view="${name}"]`);
  if (tabBtn) tabBtn.classList.add('active');
  const navTab = document.querySelector(`.nav-tab[data-view="${name}"]`);
  if (navTab) navTab.classList.add('active');

  const title = document.getElementById('nav-bar-title');
  if (title) title.textContent = VIEW_TITLES[name];

  // reset nav bar compact state
  const navBar = document.getElementById('nav-bar');
  if (navBar) navBar.classList.remove('compact');

  if (name === 'map') { setTimeout(() => map.resize(), 100); updateMapInfo(); }
  if (name === 'dashboard') renderDashboard();
  if (name === 'journal') {
    renderChat();                           // paint cached/local immediately
    fetchServerEntries().then(renderChat);  // refresh from server, repaint
    fetchPresence();
    startJournalPolling();                  // 7s polling while on this view
  } else {
    stopJournalPolling();
  }
  updateSidebarStats();
}

// scroll-collapsed large-title nav bar (iOS style)
function setupScrollCollapse() {
  const navBar = document.getElementById('nav-bar');
  ['dashboard-view', 'journal-view'].forEach(id => {
    const el = document.getElementById(id);
    el.addEventListener('scroll', () => {
      if (!el.classList.contains('active')) return;
      if (el.scrollTop > 20) navBar.classList.add('compact');
      else navBar.classList.remove('compact');
    }, { passive: true });
  });
}
setupScrollCollapse();

function toggleProfileMenu() { logout(); }

// ---- SIDEBAR / HEADER BITS ----
function updateSidebarStats() {
  document.getElementById('side-count').textContent = entries.length;
  const days = new Set(entries.map(e => new Date(e.timestamp).toDateString())).size;
  document.getElementById('side-days').textContent = days;

  if (entries.length) {
    const counts = {};
    entries.forEach(e => e.emotions.forEach(em => counts[em] = (counts[em]||0) + 1));
    const top = Object.entries(counts).sort((a,b) => b[1] - a[1])[0];
    document.getElementById('side-top').textContent = EMOTION_MAP[top[0]].emoji;
  } else {
    document.getElementById('side-top').textContent = '—';
  }

  const user = JSON.parse(localStorage.getItem('el_user') || 'null');
  if (user) {
    const initial = (user.name || user.email || '?').trim()[0].toUpperCase();
    const sideName = document.getElementById('side-name');
    const sideAvatar = document.getElementById('side-avatar');
    if (sideName) sideName.textContent = user.name || user.email;
    if (sideAvatar) sideAvatar.textContent = initial;
    const navProfile = document.getElementById('nav-profile');
    if (navProfile) navProfile.textContent = initial;
  }

  const dashDate = document.getElementById('dash-date');
  if (dashDate) dashDate.textContent = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function updateMapInfo() {
  const today = new Date().toDateString();
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const todayCount = entries.filter(e => new Date(e.timestamp).toDateString() === today).length;
  const weekCount = entries.filter(e => new Date(e.timestamp).getTime() >= weekAgo).length;

  document.getElementById('info-today').textContent = todayCount;
  document.getElementById('info-week').textContent = weekCount;
  document.getElementById('info-total').textContent = entries.length;

  const moodEl = document.getElementById('info-mood');
  if (entries.length === 0) {
    moodEl.innerHTML = 'Tap the map or drop the pin to log a feeling.';
  } else {
    const last = entries[entries.length - 1];
    const em = EMOTION_MAP[last.emotions[0]];
    const when = new Date(last.timestamp);
    const mins = Math.round((Date.now() - when) / 60000);
    const rel = mins < 1 ? 'just now'
      : mins < 60 ? `${mins}m ago`
      : mins < 1440 ? `${Math.round(mins/60)}h ago`
      : `${Math.round(mins/1440)}d ago`;
    moodEl.innerHTML = `Last: <strong>${em.emoji} ${em.label}</strong>, ${rel}.`;
  }
}

function logout() {
  localStorage.removeItem('el_user');
  location.reload();
}

// ---- DASHBOARD ----
function renderDashboard() {
  if (entries.length === 0) {
    document.getElementById('stat-count').querySelector('.stat-value').textContent = '0';
    document.getElementById('stat-intensity').querySelector('.stat-value').textContent = '—';
    document.getElementById('stat-days').querySelector('.stat-value').textContent = '0';
    document.getElementById('mood-name').textContent = '—';
    document.getElementById('mood-desc').textContent = 'No data yet';
    document.getElementById('mood-orb').style.background = 'radial-gradient(circle at 35% 30%, #f4f0e8, #c9c3b4 60%, #a8a294)';
    document.getElementById('emotion-bars').innerHTML = '';
    document.getElementById('timeline').innerHTML = `
      <div class="empty-state"><h3>No check-ins yet</h3>
      <p>Head to the Map and click anywhere in Berkeley to log your first emotion.</p></div>`;
    return;
  }

  const emotionCounts = {};
  let totalIntensity = 0;
  entries.forEach(e => {
    e.emotions.forEach(em => emotionCounts[em] = (emotionCounts[em] || 0) + 1);
    totalIntensity += e.intensity;
  });
  const topEmotion = Object.entries(emotionCounts).sort((a,b) => b[1] - a[1])[0];
  const topEm = EMOTION_MAP[topEmotion[0]];
  const avgIntensity = (totalIntensity / entries.length).toFixed(1);
  const uniqueDays = new Set(entries.map(e => new Date(e.timestamp).toDateString())).size;

  document.getElementById('stat-count').querySelector('.stat-value').textContent = entries.length;
  document.getElementById('stat-intensity').querySelector('.stat-value').textContent = avgIntensity;
  document.getElementById('stat-days').querySelector('.stat-value').textContent = uniqueDays;

  document.getElementById('mood-name').textContent = topEm.label;
  document.getElementById('mood-desc').textContent = `${topEmotion[1]} of ${entries.length} readings`;
  const orb = document.getElementById('mood-orb');
  const moodCard = document.getElementById('mood-card');
  orb.style.setProperty('--orb-color',
    `radial-gradient(circle at 30% 25%, ${topEm.color} 0%, ${topEm.color} 40%, ${shade(topEm.color, -30)} 100%)`);
  orb.style.setProperty('--orb-shadow', topEm.glow);
  if (moodCard) moodCard.style.setProperty('--mood-glow', topEm.glow);

  const maxCount = Math.max(...Object.values(emotionCounts));
  document.getElementById('emotion-bars').innerHTML = EMOTIONS.map(e => {
    const count = emotionCounts[e.id] || 0;
    const pct = maxCount > 0 ? (count / maxCount * 100) : 0;
    return `<div class="bar-row">
      <div class="bar-label">${e.label}</div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${pct}%;background:linear-gradient(90deg, ${e.color}aa, ${e.color});box-shadow:0 0 12px ${e.glow};"></div>
      </div>
      <div class="bar-count">${count}</div>
    </div>`;
  }).join('');

  const recent = [...entries].reverse().slice(0, 10);
  document.getElementById('timeline').innerHTML = recent.map(e => {
    const em = EMOTION_MAP[e.emotions[0]];
    const time = new Date(e.timestamp);
    return `<div class="timeline-entry">
      <div class="timeline-dot" style="background:${em.color};color:${em.glow};box-shadow:0 0 10px ${em.glow}"></div>
      <div class="timeline-content">
        <div class="time">${time.toLocaleDateString()} at ${time.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
        <div class="place">${e.emotions.map(id => EMOTION_MAP[id].label).join(', ')}</div>
        ${e.note ? `<div class="note">${e.note}</div>` : ''}
      </div>
    </div>`;
  }).join('');

  // ensure layout is flushed before sizing the canvas
  requestAnimationFrame(() => drawLandscape());
}

function shade(hex, lum) {
  hex = String(hex).replace(/[^0-9a-f]/gi, '');
  if (hex.length < 6) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  lum = lum/100 || 0;
  let rgb = '#';
  for (let i = 0; i < 3; i++) {
    const c = parseInt(hex.substr(i*2,2), 16);
    const v = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
    rgb += ('00'+v).substr(v.length);
  }
  return rgb;
}

// ---- EMOTIONAL TERRAIN (animated canvas) ----
let _terrainRafId = null;
let _terrainStart = 0;
function drawLandscape() {
  renderEmotionalTerrain();
}

function renderEmotionalTerrain() {
  const canvas = document.getElementById('landscape-canvas');
  if (!canvas) return;
  if (_terrainRafId) { cancelAnimationFrame(_terrainRafId); _terrainRafId = null; }

  const ctx = canvas.getContext('2d');
  const DPR = Math.min(2, window.devicePixelRatio || 1);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * DPR));
    canvas.height = Math.max(1, Math.floor(rect.height * DPR));
  }
  resize();

  // frequency distribution → ordered emotions (most → least frequent)
  const counts = {};
  EMOTIONS.forEach(e => counts[e.id] = 0);
  entries.forEach(e => (e.emotions || []).forEach(id => { if (counts[id] !== undefined) counts[id]++; }));
  const ranked = [...EMOTIONS].sort((a, b) => counts[b.id] - counts[a.id]);
  const total = Math.max(1, entries.length);
  // arousal average drives day/night feel
  const avgArousal = entries.length
    ? entries.reduce((s, e) => s + (typeof e.arousal === 'number' ? e.arousal : ((e.energy || 5) / 5 - 1)), 0) / entries.length
    : 0.1;

  const dayNight = Math.max(0, Math.min(1, (avgArousal + 1) / 2));  // 0 night → 1 day

  // pre-cached starfield (seeded)
  const stars = Array.from({ length: 90 }, (_, i) => {
    const s = Math.sin(i * 27.179) * 43758.5453;
    const r = s - Math.floor(s);
    const t = Math.sin(i * 13.37) * 91.57;
    const r2 = t - Math.floor(t);
    return { x: r, y: r2 * 0.55, tw: Math.floor(r * 997) };
  });

  function frame(tms) {
    const t = (tms - _terrainStart) * 0.001;
    const w = canvas.width / DPR;
    const h = canvas.height / DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // ---- SKY GRADIENT (mood-driven) ----
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    const nightSky = ['#11092b', '#2a1d4a', '#6d4272', '#d47e6e', '#f6d7a7', '#fbf6ed'];
    const daySky   = ['#3b6bb0', '#79a6d6', '#e8c7b3', '#f8deb7', '#faeccb', '#fbf6ed'];
    for (let i = 0; i < 6; i++) {
      const n = nightSky[i], d = daySky[i];
      sky.addColorStop(i / 5, lerpColor(n, d, dayNight));
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // ---- STARS (night bias) ----
    const starAlpha = (1 - dayNight) * 0.85;
    if (starAlpha > 0.04) {
      stars.forEach((s, i) => {
        const x = s.x * w;
        const y = s.y * h;
        const tw = 0.5 + 0.5 * Math.sin(t * 1.4 + s.tw);
        ctx.globalAlpha = starAlpha * (0.3 + 0.7 * tw);
        ctx.fillStyle = '#fff7dd';
        ctx.beginPath();
        ctx.arc(x, y, 0.6 + tw * 0.8, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    // ---- SUN/MOON with soft halo ----
    const cx = w * 0.76, cy = h * 0.22;
    const sunR = 28;
    const haloG = ctx.createRadialGradient(cx, cy, 0, cx, cy, sunR * 4);
    const warm = dayNight > 0.5 ? 'rgba(255, 232, 170,' : 'rgba(230, 215, 245,';
    haloG.addColorStop(0, warm + '0.55)');
    haloG.addColorStop(0.4, warm + '0.18)');
    haloG.addColorStop(1, warm + '0)');
    ctx.fillStyle = haloG;
    ctx.fillRect(0, 0, w, h);
    const sunG = ctx.createRadialGradient(cx - 7, cy - 7, 0, cx, cy, sunR);
    sunG.addColorStop(0, dayNight > 0.5 ? '#fff3d6' : '#ede4f5');
    sunG.addColorStop(1, dayNight > 0.5 ? '#f2c99a' : '#c5b5d8');
    ctx.fillStyle = sunG;
    ctx.beginPath();
    ctx.arc(cx, cy, sunR, 0, Math.PI * 2);
    ctx.fill();

    // ---- MOUNTAIN LAYERS (6 bands, back to front, colored by top emotions) ----
    const layers = Math.min(6, ranked.length);
    for (let i = 0; i < layers; i++) {
      const progress = i / Math.max(1, layers - 1);    // 0 back, 1 front
      const em = ranked[i];
      const ratio = counts[em.id] / total;
      const amp = 20 + ratio * 70 + progress * 8;      // taller for frequent emotions
      const yBase = h * (0.45 + progress * 0.38);
      const phase = t * 0.12 + i * 1.6;
      const freq = 0.008 + i * 0.0022;

      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 2) {
        const noise =
          Math.sin(x * freq + phase) * 0.6 +
          Math.sin(x * freq * 2.1 + phase * 1.25) * 0.28 +
          Math.sin(x * freq * 0.55 + phase * 0.4) * 0.4;
        const y = yBase - noise * amp;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();

      const [r, g, b] = hexToRgb(em.color);
      const darken = 0.55 + progress * 0.4;
      const alpha = 0.62 + progress * 0.3;
      ctx.fillStyle = `rgba(${Math.round(r * darken)},${Math.round(g * darken)},${Math.round(b * darken)},${alpha})`;
      ctx.fill();

      // ridge highlight on front-most mountains
      if (progress > 0.6) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighten';
        ctx.strokeStyle = `rgba(255, 240, 210, ${0.08 + progress * 0.1})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const noise =
            Math.sin(x * freq + phase) * 0.6 +
            Math.sin(x * freq * 2.1 + phase * 1.25) * 0.28 +
            Math.sin(x * freq * 0.55 + phase * 0.4) * 0.4;
          const y = yBase - noise * amp;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      }
    }

    // ---- FOREGROUND: emotion flowers scattered along the ground ----
    const flowerRows = 40;
    for (let i = 0; i < flowerRows; i++) {
      const seed = Math.sin(i * 12.9898) * 43758.5453;
      const xR = seed - Math.floor(seed);
      const x = xR * w;
      const yR = (Math.sin(i * 7.77 + 3) + 1) / 2;
      const y = h * (0.88 + yR * 0.1);
      const em = ranked[i % Math.max(1, ranked.length)];
      const bob = Math.sin(t * 1.1 + i * 1.7) * 1.5;
      const [r, g, b] = hexToRgb(em.color);
      ctx.fillStyle = `rgba(${r},${g},${b},0.82)`;
      ctx.beginPath();
      ctx.arc(x, y + bob, 2.2 + (i % 3) * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(${r},${g},${b},0.22)`;
      ctx.beginPath();
      ctx.arc(x, y + bob, 5 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }

    _terrainRafId = requestAnimationFrame(frame);
  }

  _terrainStart = performance.now();
  _terrainRafId = requestAnimationFrame(frame);
}

// blend two hex colors (t in [0,1])
function lerpColor(hex1, hex2, tt) {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  const r = Math.round(r1 + (r2 - r1) * tt);
  const g = Math.round(g1 + (g2 - g1) * tt);
  const b = Math.round(b1 + (b2 - b1) * tt);
  return `rgb(${r},${g},${b})`;
}

// ---- WORLD CHAT / MESSAGES ----
const CHAT_USERS = [
  { id: 'rhea', name: 'Rhea',  hue: '#c27b5e' },
  { id: 'kai',  name: 'Kai',   hue: '#6b8fd4' },
  { id: 'mira', name: 'Mira',  hue: '#6fc8a3' },
  { id: 'jun',  name: 'Jun',   hue: '#f5b841' },
  { id: 'sol',  name: 'Sol',   hue: '#f49eb0' },
  { id: 'theo', name: 'Theo',  hue: '#a89c82' },
  { id: 'nara', name: 'Nara',  hue: '#5ac8fa' },
  { id: 'etta', name: 'Etta',  hue: '#e8635f' }
];
const CHAT_USER_MAP = Object.fromEntries(CHAT_USERS.map(u => [u.id, u]));

// seed messages — times are "minutes ago"
const SEED_CHAT = [
  { userId: 'rhea', emotion: 'anxiety', place: 'Doe Library',         lat: 37.8721, lng: -122.2585, note: 'midterm in 45 min, spiraling', minsAgo: 4 },
  { userId: 'kai',  emotion: 'joy',     place: 'Memorial Glade',      lat: 37.8720, lng: -122.2591, note: 'spring is finally here',         minsAgo: 12 },
  { userId: 'mira', emotion: 'calm',    place: 'Strawberry Creek',    lat: 37.8702, lng: -122.2605, note: 'reading on the bank, no rush',   minsAgo: 28 },
  { userId: 'jun',  emotion: 'energy',  place: 'Soda Hall',           lat: 37.8753, lng: -122.2583, note: "a bug I couldn't crack cracked itself", minsAgo: 47 },
  { userId: 'sol',  emotion: 'love',    place: 'Caffe Strada',        lat: 37.8692, lng: -122.2545, note: 'coffee x2 and she laughed',      minsAgo: 72 },
  { userId: 'theo', emotion: 'wonder',  place: 'Campanile',           lat: 37.8721, lng: -122.2578, note: 'fog over the bay, the bells',    minsAgo: 98 },
  { userId: 'nara', emotion: 'sadness', place: 'Dwinelle Hall',       lat: 37.8706, lng: -122.2603, note: 'wrong grade. reshaping.',        minsAgo: 135 },
  { userId: 'etta', emotion: 'anger',   place: 'RSF Gym',             lat: 37.8687, lng: -122.2626, note: 'they took my treadmill AGAIN',   minsAgo: 186 },
  { userId: 'rhea', emotion: 'calm',    place: 'Tilden Park',         lat: 37.8912, lng: -122.2444, note: 'hiking killed the spiral',       minsAgo: 360 },
  { userId: 'jun',  emotion: 'wonder',  place: 'Lawrence Hall',       lat: 37.8786, lng: -122.2461, note: 'mercury was visible tonight',    minsAgo: 1190 },
  { userId: 'mira', emotion: 'joy',     place: 'North Gate',          lat: 37.8744, lng: -122.2600, note: '☀️ first day without a jacket', minsAgo: 1630 },
  { userId: 'sol',  emotion: 'anxiety', place: 'Wheeler Hall',        lat: 37.8712, lng: -122.2593, note: 'econ final... pray for me',      minsAgo: 2210 },
];

// session-only extra messages the user "posts" via the composer (optimistic)
let _chatSessionExtras = [];
let chatFilter = 'all';
// server-fetched community entries — populated by fetchServerEntries()
let _serverEntries = [];

function initialsOf(name) {
  return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
}

// anonymous-but-stable identity per browser, stored in localStorage
const _ANON_ADJ = ['Quiet', 'Soft', 'Bright', 'Drift', 'Calm', 'Wild', 'Far', 'Slow', 'Warm', 'Pale', 'Deep', 'Tide'];
const _ANON_NOUN = ['Jellyfish', 'Otter', 'Heron', 'Fox', 'Moth', 'Crane', 'Wren', 'Hare', 'Lark', 'Owl', 'Dolphin', 'Fern'];
const _ANON_HUES = ['#7ee5d4', '#a8b5d6', '#c89a8e', '#a89c82', '#d4a5e8', '#86a8a0', '#e8a08d', '#8a92b8'];
function getOrCreateUserIdentity() {
  let stored = null;
  try { stored = JSON.parse(localStorage.getItem('el_user') || 'null'); } catch (_) { stored = null; }
  if (!stored) stored = {};
  let changed = false;
  // only generate an anon name if no real name from sign-up exists
  // (and treat the placeholder "Guest" as missing too)
  if (!stored.name || stored.name === 'Guest') {
    const adj = _ANON_ADJ[Math.floor(Math.random() * _ANON_ADJ.length)];
    const noun = _ANON_NOUN[Math.floor(Math.random() * _ANON_NOUN.length)];
    stored.name = adj + ' ' + noun;
    changed = true;
  }
  if (!stored.hue) {
    stored.hue = _ANON_HUES[Math.floor(Math.random() * _ANON_HUES.length)];
    changed = true;
  }
  if (changed) {
    try { localStorage.setItem('el_user', JSON.stringify(stored)); } catch (_) {}
  }
  return stored;
}

async function fetchServerEntries() {
  try {
    const res = await fetch('/api/entries');
    if (!res.ok) return;
    const data = await res.json();
    if (data && Array.isArray(data.entries)) {
      _serverEntries = data.entries;
      // refresh anywhere that consumes the community feed
      if (document.getElementById('world-chat-feed')) renderWorldChat();
      if (document.getElementById('chat-list')) renderChat();
    }
  } catch (_) { /* offline — keep last cache */ }
}

// ---- PRESENCE (online users) ----
let _onlineUsers = [];
async function presenceHeartbeat() {
  const me = getOrCreateUserIdentity();
  try {
    await fetch('/api/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName: me.name, hue: me.hue })
    });
  } catch (_) {}
}
async function fetchPresence() {
  try {
    const res = await fetch('/api/presence');
    if (!res.ok) return;
    const data = await res.json();
    if (data && Array.isArray(data.online)) {
      _onlineUsers = data.online;
      if (document.getElementById('chat-list')) renderChat();
    }
  } catch (_) {}
}
function isOnline(name) { return _onlineUsers.some(u => u.name === name); }

// ---- ECHOES (stored locally so we can show "filled" state instantly) ----
function getMyEchoes() {
  try { return new Set(JSON.parse(localStorage.getItem('el_echoes') || '[]')); }
  catch (_) { return new Set(); }
}
function saveMyEchoes(set) {
  try { localStorage.setItem('el_echoes', JSON.stringify([...set])); } catch (_) {}
}
async function toggleEcho(entryId) {
  const me = getOrCreateUserIdentity();
  // optimistic local update
  const echoes = getMyEchoes();
  const wasEchoed = echoes.has(entryId);
  if (wasEchoed) echoes.delete(entryId); else echoes.add(entryId);
  saveMyEchoes(echoes);
  const target = _serverEntries.find(e => e.id === entryId);
  if (target) target.echoCount = Math.max(0, (target.echoCount || 0) + (wasEchoed ? -1 : 1));
  renderChat();
  // sync to server
  try {
    const res = await fetch('/api/entries?action=echo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entryId, userName: me.name })
    });
    if (res.ok) {
      const data = await res.json();
      if (target && typeof data.count === 'number') target.echoCount = data.count;
      renderChat();
    }
  } catch (_) {}
}

// ---- REPLIES ----
const _repliesCache = {};        // entryId → array of replies (loaded lazily)
const _expandedReplies = new Set(); // entryId set — which threads are expanded
async function fetchReplies(entryId) {
  try {
    const res = await fetch('/api/entries?action=replies&id=' + encodeURIComponent(entryId));
    if (!res.ok) return;
    const data = await res.json();
    if (data && Array.isArray(data.replies)) {
      _repliesCache[entryId] = data.replies;
      renderChat();
    }
  } catch (_) {}
}
function toggleReplies(entryId) {
  if (_expandedReplies.has(entryId)) {
    _expandedReplies.delete(entryId);
    renderChat();
  } else {
    _expandedReplies.add(entryId);
    if (!_repliesCache[entryId]) fetchReplies(entryId);
    else renderChat();
  }
}
async function submitReply(entryId, inputEl) {
  const text = (inputEl.value || '').trim();
  if (!text) return;
  const me = getOrCreateUserIdentity();
  inputEl.value = '';
  // optimistic
  const optimistic = {
    id: 'opt-' + Date.now(),
    userName: me.name,
    hue: me.hue,
    text,
    timestamp: new Date().toISOString()
  };
  _repliesCache[entryId] = [...(_repliesCache[entryId] || []), optimistic];
  const target = _serverEntries.find(e => e.id === entryId);
  if (target) target.replyCount = (target.replyCount || 0) + 1;
  renderChat();
  try {
    const res = await fetch('/api/entries?action=reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entryId, userName: me.name, hue: me.hue, text })
    });
    if (res.ok) {
      const data = await res.json();
      // replace optimistic with confirmed
      _repliesCache[entryId] = (_repliesCache[entryId] || []).filter(r => r.id !== optimistic.id);
      if (data.reply) _repliesCache[entryId].push(data.reply);
      if (target && typeof data.count === 'number') target.replyCount = data.count;
      renderChat();
    }
  } catch (_) {}
}

// ---- REAL-TIME POLLING (when journal view is active + tab visible) ----
let _journalPollId = null;
function startJournalPolling() {
  stopJournalPolling();
  _journalPollId = setInterval(() => {
    if (document.hidden) return;
    fetchServerEntries();
  }, 7000);
}
function stopJournalPolling() {
  if (_journalPollId) { clearInterval(_journalPollId); _journalPollId = null; }
}

async function postServerEntry(payload) {
  try {
    const res = await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.entry) {
      _serverEntries.unshift(data.entry);
      return data.entry;
    }
  } catch (_) {}
  return null;
}

function buildChatFeed() {
  const me = getOrCreateUserIdentity();
  // server entries are now the source of truth for community
  const community = _serverEntries.map(e => ({
    id: e.id,
    kind: e.userName === me.name ? 'self' : 'other',
    userId: e.userName,
    userName: e.userName || 'Anon',
    hue: e.hue || '#7ee5d4',
    emotion: e.emotion,
    place: e.placeName || `${(+e.lat).toFixed(3)}, ${(+e.lng).toFixed(3)}`,
    lat: +e.lat, lng: +e.lng,
    note: e.note || '',
    timestamp: e.timestamp
  }));
  return [...community, ..._chatSessionExtras]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function setChatFilter(f) {
  chatFilter = f;
  document.querySelectorAll('.chat-filter').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === f);
  });
  renderChat();
}

function renderChat() {
  const list = document.getElementById('chat-list');
  if (!list) return;

  // ---- presence bar at the top ----
  const presenceEl = document.getElementById('chat-presence');
  if (presenceEl) {
    const me = getOrCreateUserIdentity();
    const others = _onlineUsers.filter(u => u.name !== me.name);
    const total = _onlineUsers.length;
    if (total === 0) {
      presenceEl.innerHTML = `<span class="presence-empty">just you here · ${me.name}</span>`;
    } else {
      const dots = _onlineUsers.slice(0, 6).map(u =>
        `<span class="presence-chip" style="--user-hue:${u.hue};" title="${u.name}">
          <span class="presence-dot"></span>${u.name}${u.name === me.name ? ' (you)' : ''}
        </span>`
      ).join('');
      const more = total > 6 ? `<span class="presence-more">+${total - 6}</span>` : '';
      presenceEl.innerHTML = `<span class="presence-count">${total} here now</span> ${dots} ${more}`;
    }
  }

  const feed = buildChatFeed();
  const shown = chatFilter === 'mine'   ? feed.filter(m => m.kind === 'self')
              : chatFilter === 'others' ? feed.filter(m => m.kind === 'other')
              : feed;

  if (shown.length === 0) {
    list.innerHTML = `<div class="chat-empty">
      <h3>Nothing here yet</h3>
      <p>Log a feeling on the map and it will land in this feed.</p>
    </div>`;
    return;
  }

  const myEchoes = getMyEchoes();
  const me = getOrCreateUserIdentity();

  list.innerHTML = shown.map(m => {
    const em = EMOTION_MAP[m.emotion] || EMOTIONS[0];
    const time = new Date(m.timestamp);
    const rel = formatRelTime(m.timestamp);
    const serverEntry = _serverEntries.find(e => e.id === m.id);
    const echoCount = serverEntry?.echoCount || 0;
    const replyCount = serverEntry?.replyCount || 0;
    const iEchoed = myEchoes.has(m.id);
    const expanded = _expandedReplies.has(m.id);
    const replies = _repliesCache[m.id] || [];

    const onlineDot = isOnline(m.userName) ? `<span class="user-online-dot" title="online"></span>` : '';

    return `<div class="chat-msg ${m.kind === 'self' ? 'self' : ''}" data-id="${m.id}" style="--em-color:${em.color};">
      <div class="chat-avatar" style="--user-hue:${m.hue};">${initialsOf(m.userName)}</div>
      <div class="chat-msg-body">
        <div class="chat-msg-head">
          <span class="chat-username">${m.userName}${onlineDot}</span>
          <span class="chat-emotion-chip" style="color:${em.color};">${em.label}</span>
          <span class="chat-time">${rel}</span>
        </div>
        <div class="chat-msg-place" data-action="fly">at <em>${m.place}</em></div>
        ${m.note ? `<div class="chat-msg-note">${m.note}</div>` : ''}
        <div class="chat-msg-actions">
          <button class="chat-action ${iEchoed ? 'on' : ''}" data-action="echo">
            <svg viewBox="0 0 24 24" fill="${iEchoed ? 'currentColor' : 'none'}" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span>${echoCount > 0 ? echoCount : ''}</span>
          </button>
          <button class="chat-action" data-action="reply">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
            <span>${replyCount > 0 ? `${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}` : 'reply'}</span>
          </button>
          <span class="chat-msg-coords">${m.lat.toFixed(3)}, ${m.lng.toFixed(3)} · ${time.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        ${expanded ? `
          <div class="reply-thread">
            ${replies.map(r => `
              <div class="reply">
                <div class="reply-avatar" style="--user-hue:${r.hue};">${initialsOf(r.userName)}</div>
                <div class="reply-body">
                  <span class="reply-name">${r.userName}${isOnline(r.userName) ? '<span class="user-online-dot"></span>' : ''}</span>
                  <span class="reply-time">${formatRelTime(r.timestamp)}</span>
                  <div class="reply-text">${r.text}</div>
                </div>
              </div>
            `).join('')}
            <form class="reply-form" data-action="reply-submit">
              <input class="reply-input" placeholder="Reply as ${me.name}…" maxlength="280">
              <button class="reply-send" type="submit">Send</button>
            </form>
          </div>
        ` : ''}
      </div>
    </div>`;
  }).join('');

  // wire up message actions
  list.querySelectorAll('.chat-msg').forEach(el => {
    const id = el.dataset.id;
    el.querySelectorAll('[data-action]').forEach(actionEl => {
      actionEl.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const action = actionEl.dataset.action;
        if (action === 'echo')  toggleEcho(id);
        if (action === 'reply') toggleReplies(id);
        if (action === 'fly') {
          const msg = buildChatFeed().find(m => m.id === id);
          if (msg && map) {
            switchView('map');
            setTimeout(() => map.flyTo({ center: [msg.lng, msg.lat], zoom: 17, pitch: 60, bearing: -18, duration: 1200 }), 200);
          }
        }
      });
    });
    const form = el.querySelector('form[data-action="reply-submit"]');
    if (form) {
      form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const input = form.querySelector('.reply-input');
        if (input) submitReply(id, input);
      });
    }
  });
}

function sendChatMessage() {
  const input = document.getElementById('chat-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  const emotion = affectState
    ? nearestEmotion(affectState.valence, affectState.arousal).id
    : 'joy';
  const center = map && map.getCenter ? map.getCenter() : { lat: 37.8716, lng: -122.2727 };
  const place = (map && findPlaceName(center.lng, center.lat)) || 'somewhere on campus';
  const me = getOrCreateUserIdentity();
  // optimistic local render so the message appears instantly
  _chatSessionExtras.push({
    id: 'you-' + Date.now(),
    kind: 'self',
    userId: me.name,
    userName: me.name,
    hue: me.hue,
    emotion,
    place,
    lat: center.lat, lng: center.lng,
    note: text,
    timestamp: new Date().toISOString()
  });
  input.value = '';
  renderChat();
  // share to community
  postServerEntry({
    lat: center.lat,
    lng: center.lng,
    emotion,
    intensity: 5,
    valence: affectState ? affectState.valence : 0,
    arousal: affectState ? affectState.arousal : 0,
    note: text,
    placeName: place,
    userName: me.name,
    hue: me.hue
  }).then(() => {
    // server-confirmed entry replaces the optimistic one
    _chatSessionExtras = _chatSessionExtras.filter(m => m.note !== text || m.userName !== me.name);
    renderChat();
  });
}

document.getElementById('modal-overlay').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// initial paint
updateSidebarStats();
// kick off an initial fetch so the world feed and messages are warm
fetchServerEntries();

// presence: send heartbeat now + every 20s; fetch online list every 20s
presenceHeartbeat();
fetchPresence();
setInterval(() => { if (!document.hidden) presenceHeartbeat(); }, 20000);
setInterval(() => { if (!document.hidden) fetchPresence(); }, 20000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) { presenceHeartbeat(); fetchPresence(); }
});
updateMapInfo();

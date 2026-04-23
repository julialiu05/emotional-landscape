// ---- AUTH ----
let currentAuthMode = 'login';

function checkAuth() {
  const user = JSON.parse(localStorage.getItem('el_user') || 'null');
  if (user) {
    document.getElementById('login-page').classList.add('hidden');
    setTimeout(() => {
      document.getElementById('login-page').style.display = 'none';
      if (typeof map !== 'undefined') { map.resize(); autoLocate(); }
    maybeShowAffectOnboarding();
    }, 600);
    return true;
  }
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

  if (mode === 'signup') {
    nameGroup.style.display = 'flex';
    btn.textContent = 'Create account';
    heading.innerHTML = 'Begin <em>here</em>.';
    sub.textContent = 'Create an account to keep your check-ins.';
    footer.innerHTML = 'Already have an account? <a onclick="setLever(false)">Log in</a>';
  } else {
    nameGroup.style.display = 'none';
    btn.textContent = 'Log in';
    heading.innerHTML = 'Welcome <em>back</em>.';
    sub.textContent = 'Map how the places you move through make you feel.';
    footer.innerHTML = 'No account yet? <a onclick="setLever(true)">Sign up</a>';
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
  checkAuth();
});

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
  if (localStorage.getItem('el_affect_onboarded') === '1') return;
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
  if (count) count.textContent = entries.length;

  if (entries.length === 0) {
    feed.innerHTML = `<div class="wc-empty">No check-ins yet. Drop the pin to begin.</div>`;
    return;
  }

  const recent = [...entries].reverse().slice(0, 24);
  feed.innerHTML = recent.map(e => {
    const em = EMOTION_MAP[e.emotions && e.emotions[0]] || EMOTIONS[0];
    const place = e.placeName ? e.placeName : `${e.lat.toFixed(3)}, ${e.lng.toFixed(3)}`;
    const coords = `${e.lat.toFixed(4)}, ${e.lng.toFixed(4)}`;
    return `
      <div class="wc-message" data-id="${e.id}" style="--m-color:${em.color};">
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
      const id = parseInt(el.dataset.id, 10);
      const entry = entries.find(x => x.id === id);
      if (entry && map) map.flyTo({ center: [entry.lng, entry.lat], zoom: 17, pitch: 60, bearing: -18, duration: 1200 });
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

  // paper ground
  tint('background', 'background-color', '#fbf6ed');

  // parks, forest, grass → sage
  ['park', 'park_outline', 'landcover_wood', 'landcover_grass', 'landuse_residential']
    .forEach(id => tint(id, 'fill-color', '#cdd9bf'));

  // water → soft mauve-lavender
  ['water', 'water_name'].forEach(id => tint(id, 'fill-color', '#c8c0dc'));

  // roads → warm ivory
  const roadIds = ['highway_motorway', 'highway_trunk', 'highway_primary',
    'highway_secondary', 'highway_tertiary', 'highway_minor', 'highway_path',
    'road_motorway', 'road_trunk_primary', 'road_secondary_tertiary', 'road_minor',
    'tunnel_motorway', 'bridge_motorway'];
  roadIds.forEach(id => {
    tint(id, 'line-color', '#f3e6cf');
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

    map.addLayer({
      id: haloId,
      type: 'circle',
      source: 'el-feelings',
      filter: ['==', ['get', 'emotion'], em.id],
      paint: {
        'circle-color': em.color,
        'circle-pitch-alignment': 'map',
        'circle-pitch-scale': 'map',
        'circle-radius': [
          'interpolate', ['linear'], ['zoom'],
          12, 18,
          15, 48,
          17, 90,
          19, 180
        ],
        'circle-blur': 1,
        'circle-opacity': [
          'interpolate', ['linear'], ['coalesce', ['get', 'weight'], 0.5],
          0.25, 0.16,
          1,    0.32
        ]
      }
    }, firstSymbolId);

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
          12, 8,
          15, 20,
          17, 40,
          19, 80
        ],
        'circle-blur': 0.8,
        'circle-opacity': [
          'interpolate', ['linear'], ['coalesce', ['get', 'weight'], 0.5],
          0.25, 0.22,
          1,    0.45
        ]
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
          0, '#f0ebde',
          20, '#e3dccb',
          60, '#cfc6ae',
          150, '#a89b80'
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
  renderWorldChat();
  closeModal();
  document.getElementById('map-hint').style.opacity = '0';
  updateSidebarStats();
  updateMapInfo();
}

// ---- VIEWS ----
const VIEW_TITLES = { map: 'Map', dashboard: 'Insights', journal: 'Journal' };

function switchView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.tab-item').forEach(b => b.classList.remove('active'));
  document.getElementById(name + '-view').classList.add('active');
  const tabBtn = document.querySelector(`.tab-item[data-view="${name}"]`);
  if (tabBtn) tabBtn.classList.add('active');

  const title = document.getElementById('nav-bar-title');
  if (title) title.textContent = VIEW_TITLES[name];

  // reset nav bar compact state
  const navBar = document.getElementById('nav-bar');
  if (navBar) navBar.classList.remove('compact');

  if (name === 'map') { setTimeout(() => map.resize(), 100); updateMapInfo(); }
  if (name === 'dashboard') renderDashboard();
  if (name === 'journal') renderJournal();
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

  drawLandscape();
}

// ---- LANDSCAPE CANVAS ----
function drawLandscape() {
  const canvas = document.getElementById('landscape-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth * 2;
  canvas.height = canvas.offsetHeight * 2;
  ctx.scale(2, 2);
  const w = canvas.offsetWidth;
  const h = canvas.offsetHeight;

  const avgEnergy = entries.reduce((s,e) => s + e.energy, 0) / entries.length;
  const avgIntensity = entries.reduce((s,e) => s + e.intensity, 0) / entries.length;

  const emotionCounts = {};
  entries.forEach(e => e.emotions.forEach(em => emotionCounts[em] = (emotionCounts[em] || 0) + 1));
  const sorted = Object.entries(emotionCounts).sort((a,b) => b[1] - a[1]);

  // dreamy sky
  const skyGrad = ctx.createLinearGradient(0, 0, w, h * 0.55);
  const skyColors = avgEnergy > 6
    ? ['#fce4c8', '#f8d0e0', '#d8c8f0']
    : avgEnergy > 3
    ? ['#d0d8f0', '#e0d0e8', '#d8e0f0']
    : ['#8898b8', '#9088a8', '#7888a0'];
  skyGrad.addColorStop(0, skyColors[0]);
  skyGrad.addColorStop(0.5, skyColors[1]);
  skyGrad.addColorStop(1, skyColors[2]);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h * 0.6);

  // soft glow sun/moon
  if (avgEnergy > 5) {
    const sunGrad = ctx.createRadialGradient(w * 0.78, h * 0.15, 5, w * 0.78, h * 0.15, 50);
    sunGrad.addColorStop(0, 'rgba(255,240,200,0.9)');
    sunGrad.addColorStop(0.4, 'rgba(255,220,160,0.4)');
    sunGrad.addColorStop(1, 'rgba(255,200,150,0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(w * 0.58, 0, w * 0.42, h * 0.35);
  } else {
    const moonGrad = ctx.createRadialGradient(w * 0.78, h * 0.15, 5, w * 0.78, h * 0.15, 35);
    moonGrad.addColorStop(0, 'rgba(220,225,245,0.95)');
    moonGrad.addColorStop(0.5, 'rgba(200,210,235,0.3)');
    moonGrad.addColorStop(1, 'rgba(180,190,220,0)');
    ctx.fillStyle = moonGrad;
    ctx.fillRect(w * 0.58, 0, w * 0.42, h * 0.35);
  }

  // stars if low energy
  if (avgEnergy <= 4) {
    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h * 0.4, 1 + Math.random(), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.4})`;
      ctx.fill();
    }
  }

  // dreamy hills
  const hillHeight = 0.15 + (avgIntensity / 10) * 0.25;
  const baseY = h * 0.5;
  const colors = sorted.slice(0, 4).map(([id]) => EMOTION_MAP[id].color);
  if (colors.length === 0) colors.push('#c8b8d8');

  for (let layer = 0; layer < Math.min(4, colors.length); layer++) {
    ctx.beginPath();
    ctx.moveTo(-10, h);
    const segments = 8;
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * (w + 20) - 10;
      const peakH = hillHeight * h * (0.4 + Math.sin(i * 1.1 + layer * 1.8) * 0.6);
      const y = baseY - peakH + layer * 18 + 10;
      if (i === 0) ctx.lineTo(x, y);
      else {
        const cpx = x - (w + 20) / segments / 2;
        ctx.quadraticCurveTo(cpx, y - 15, x, y);
      }
    }
    ctx.lineTo(w + 10, h);
    ctx.closePath();
    const hillGrad = ctx.createLinearGradient(0, baseY - hillHeight * h, 0, h);
    hillGrad.addColorStop(0, colors[layer] + '55');
    hillGrad.addColorStop(1, colors[layer] + '22');
    ctx.fillStyle = hillGrad;
    ctx.fill();
  }

  // ground with soft gradient
  const groundGrad = ctx.createLinearGradient(0, h * 0.65, 0, h);
  const hasJoy = emotionCounts['joy'] || 0;
  const hasSadness = emotionCounts['sadness'] || 0;
  const groundBase = hasJoy > hasSadness ? [200,220,170] : hasSadness > hasJoy ? [150,175,195] : [185,205,165];
  groundGrad.addColorStop(0, `rgba(${groundBase.join(',')},0.6)`);
  groundGrad.addColorStop(1, `rgba(${groundBase.map(c=>c-20).join(',')},0.8)`);
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, h * 0.65, w, h * 0.35);

  // elements
  const elements = entries.slice(-20);
  elements.forEach((entry, i) => {
    const x = 30 + (i / Math.max(elements.length, 1)) * (w - 60);
    const primary = entry.emotions[0];
    const em = EMOTION_MAP[primary];
    const baseElemY = h * 0.67 + Math.sin(i * 1.3) * 18;

    if (primary === 'joy' || primary === 'love') drawDreamFlower(ctx, x, baseElemY, em, entry.intensity);
    else if (primary === 'calm' || primary === 'wonder') drawDreamTree(ctx, x, baseElemY, em, entry.intensity);
    else if (primary === 'sadness') drawDreamRain(ctx, x, baseElemY - 30, em);
    else if (primary === 'anxiety') drawDreamSwirl(ctx, x, baseElemY - 15, em);
    else if (primary === 'anger') drawDreamFlame(ctx, x, baseElemY, em, entry.intensity);
    else if (primary === 'energy') drawDreamBolt(ctx, x, baseElemY - 25, em);
  });

  // grain on canvas
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 12;
    data[i] += noise; data[i+1] += noise; data[i+2] += noise;
  }
  ctx.putImageData(imageData, 0, 0);
}

function drawDreamFlower(ctx, x, y, em, intensity) {
  const size = 6 + intensity * 1.2;
  // glow
  const glow = ctx.createRadialGradient(x, y - size, 0, x, y - size, size * 2.5);
  glow.addColorStop(0, em.color + '30');
  glow.addColorStop(1, em.color + '00');
  ctx.fillStyle = glow;
  ctx.fillRect(x - size * 3, y - size * 3.5, size * 6, size * 5);

  const petals = 6;
  for (let i = 0; i < petals; i++) {
    const angle = (i / petals) * Math.PI * 2 - Math.PI/2;
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(angle) * size * 0.55, y - size + Math.sin(angle) * size * 0.55, size * 0.45, size * 0.25, angle, 0, Math.PI * 2);
    ctx.fillStyle = em.color + 'aa';
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(x, y - size, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#fff8e0cc';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, y - size + 3); ctx.lineTo(x, y);
  ctx.strokeStyle = '#8aaa7a88';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawDreamTree(ctx, x, y, em, intensity) {
  const th = 18 + intensity * 3;
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(x, y - th * 0.5);
  ctx.strokeStyle = '#a09080aa';
  ctx.lineWidth = 2;
  ctx.stroke();

  const r = 10 + intensity * 1.2;
  const glow = ctx.createRadialGradient(x, y - th * 0.5 - 6, 0, x, y - th * 0.5 - 6, r * 2);
  glow.addColorStop(0, em.color + '50');
  glow.addColorStop(1, em.color + '00');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y - th * 0.5 - 6, r * 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y - th * 0.5 - 6, r, 0, Math.PI * 2);
  ctx.fillStyle = em.color + '88';
  ctx.fill();
}

function drawDreamRain(ctx, x, y, em) {
  const glow = ctx.createRadialGradient(x, y + 5, 0, x, y + 5, 25);
  glow.addColorStop(0, em.color + '25');
  glow.addColorStop(1, em.color + '00');
  ctx.fillStyle = glow;
  ctx.fillRect(x - 25, y - 20, 50, 50);

  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    const rx = x - 10 + i * 5;
    ctx.moveTo(rx, y + i * 2);
    ctx.lineTo(rx - 1.5, y + 10 + i * 2);
    ctx.strokeStyle = em.color + '66';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function drawDreamSwirl(ctx, x, y, em) {
  ctx.beginPath();
  for (let a = 0; a < Math.PI * 5; a += 0.15) {
    const r = a * 1.2;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.strokeStyle = em.color + '55';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const glow = ctx.createRadialGradient(x, y, 0, x, y, 20);
  glow.addColorStop(0, em.color + '20');
  glow.addColorStop(1, em.color + '00');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, Math.PI * 2);
  ctx.fill();
}

function drawDreamFlame(ctx, x, y, em, intensity) {
  const fh = 12 + intensity * 2.5;
  const glow = ctx.createRadialGradient(x, y - fh * 0.5, 0, x, y - fh * 0.5, fh);
  glow.addColorStop(0, em.color + '30');
  glow.addColorStop(1, em.color + '00');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y - fh * 0.5, fh, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x - 7, y - fh * 0.6, x, y - fh);
  ctx.quadraticCurveTo(x + 7, y - fh * 0.6, x, y);
  ctx.fillStyle = em.color + '88';
  ctx.fill();
}

function drawDreamBolt(ctx, x, y, em) {
  const glow = ctx.createRadialGradient(x, y + 12, 0, x, y + 12, 20);
  glow.addColorStop(0, em.color + '35');
  glow.addColorStop(1, em.color + '00');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y + 12, 20, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 5, y + 12);
  ctx.lineTo(x + 1, y + 12);
  ctx.lineTo(x + 3, y + 24);
  ctx.lineTo(x - 4, y + 10);
  ctx.lineTo(x, y + 10);
  ctx.closePath();
  ctx.fillStyle = em.color + '99';
  ctx.fill();
}

// ---- JOURNAL ----
let journalFilter = null;

function renderJournalFilters() {
  const counts = {};
  entries.forEach(e => e.emotions.forEach(em => counts[em] = (counts[em]||0) + 1));
  const container = document.getElementById('journal-filters');
  const chips = [
    `<div class="filter-chip ${journalFilter === null ? 'active' : ''}" onclick="setJournalFilter(null)">All</div>`,
    ...EMOTIONS.filter(e => counts[e.id]).map(e =>
      `<div class="filter-chip ${journalFilter === e.id ? 'active' : ''}" onclick="setJournalFilter('${e.id}')">${e.emoji} ${e.label}</div>`
    )
  ];
  container.innerHTML = chips.join('');
}

function setJournalFilter(id) {
  journalFilter = id;
  renderJournal();
}

function renderJournal() {
  const container = document.getElementById('journal-entries');

  // aside stats
  document.getElementById('jr-entries').textContent = entries.length;
  const places = new Set(entries.map(e => `${e.lat.toFixed(3)},${e.lng.toFixed(3)}`)).size;
  document.getElementById('jr-places').textContent = places;
  const days = new Set(entries.map(e => new Date(e.timestamp).toDateString())).size;
  document.getElementById('jr-days').textContent = days;
  renderJournalFilters();

  const shown = journalFilter
    ? entries.filter(e => e.emotions.includes(journalFilter))
    : entries;
  document.getElementById('journal-count-label').textContent =
    `${shown.length} ${shown.length === 1 ? 'entry' : 'entries'}${journalFilter ? ' · filtered' : ''}`;

  if (shown.length === 0) {
    container.innerHTML = `<div class="empty-state"><h3>${entries.length === 0 ? 'Your journal is empty' : 'No matching entries'}</h3>
      <p>${entries.length === 0 ? 'Go to the Map, click a spot in Berkeley, and log your first feeling. It will appear here.' : 'Try a different filter or clear it.'}</p></div>`;
    return;
  }
  container.innerHTML = [...shown].reverse().map(entry => {
    const primary = EMOTION_MAP[entry.emotions[0]];
    const time = new Date(entry.timestamp);
    const tags = entry.emotions.map(id => {
      const em = EMOTION_MAP[id];
      return `<span class="tag" style="background:${em.color}22;color:${em.color};">${em.emoji} ${em.label}</span>`;
    }).join('');
    const triggerTags = entry.triggers.map(t =>
      `<span class="tag" style="background:var(--fill-tertiary);color:var(--label-secondary);">${t}</span>`
    ).join('');
    return `<div class="journal-card">
      <div class="emotion-badge" style="--badge-color: radial-gradient(circle at 30% 25%, ${primary.color}, ${primary.color}dd); --badge-shadow: ${primary.glow};">
        ${primary.emoji}
      </div>
      <div class="journal-body">
        <div class="journal-meta">
          <span>${time.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          <span>${time.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
          <span>Intensity ${entry.intensity}/10</span>
          <span>Energy ${entry.energy}/10</span>
        </div>
        ${entry.note ? `<div class="journal-text">${entry.note}</div>` : '<div class="journal-text" style="color:var(--label-tertiary);font-style:italic;">No note</div>'}
        <div class="journal-tags">${tags}${triggerTags}</div>
      </div>
    </div>`;
  }).join('');
}

document.getElementById('modal-overlay').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// initial paint
updateSidebarStats();
updateMapInfo();

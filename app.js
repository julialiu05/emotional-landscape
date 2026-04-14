// ---- AUTH ----
let currentAuthMode = 'login';

function checkAuth() {
  const user = JSON.parse(localStorage.getItem('el_user') || 'null');
  if (user) {
    document.getElementById('login-page').classList.add('hidden');
    setTimeout(() => {
      document.getElementById('login-page').style.display = 'none';
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
    if (typeof map !== 'undefined') map.invalidateSize();
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
    map.invalidateSize();
  }, 600);
}

// allow Enter key to submit
document.addEventListener('DOMContentLoaded', () => {
  ['login-email', 'login-password', 'signup-name'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => {
      if (e.key === 'Enter') handleAuth();
    });
  });
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

let entries = JSON.parse(localStorage.getItem('el_entries') || '[]');
let pendingLatLng = null;

// ---- MAP ----
const map = L.map('map', { zoomControl: false }).setView([37.8716, -122.2727], 15);
L.control.zoom({ position: 'topright' }).addTo(map);

// soft pastel map tiles
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  maxZoom: 19
}).addTo(map);

map.on('click', function(e) {
  pendingLatLng = e.latlng;
  openModal(e.latlng);
});

function renderMarkers() {
  entries.forEach(entry => addMarker(entry));
}

function addMarker(entry) {
  const primary = EMOTION_MAP[entry.emotions[0]] || EMOTIONS[0];
  const size = 14 + (entry.intensity * 2.5);
  const icon = L.divIcon({
    className: '',
    html: `<div class="emotion-marker" style="
      width:${size}px; height:${size}px;
      background: radial-gradient(circle at 35% 35%, ${primary.color}ee, ${primary.color}88);
      box-shadow: 0 0 ${size * 0.8}px ${primary.glow}, 0 0 ${size * 0.4}px ${primary.glow};
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
  const marker = L.marker([entry.lat, entry.lng], { icon }).addTo(map);
  const emotionTags = entry.emotions.map(id => {
    const em = EMOTION_MAP[id];
    return `<span style="display:inline-block;padding:3px 10px;border-radius:10px;background:${em.color}22;color:${em.color};font-size:11px;font-weight:500;margin:2px;">${em.emoji} ${em.label}</span>`;
  }).join('');
  marker.bindPopup(`
    <div style="font-family:'DM Sans',sans-serif;min-width:180px;">
      <div style="margin-bottom:8px;">${emotionTags}</div>
      <div style="font-size:11px;color:rgba(45,38,66,0.5);">Intensity ${entry.intensity}/10 &middot; Energy ${entry.energy}/10</div>
      ${entry.note ? `<div style="font-size:13px;margin-top:10px;line-height:1.6;color:rgba(45,38,66,0.85);">${entry.note}</div>` : ''}
      <div style="font-size:10px;color:rgba(45,38,66,0.35);margin-top:8px;">${new Date(entry.timestamp).toLocaleString()}</div>
    </div>
  `);
}
renderMarkers();

// ---- DROPPER (drag-and-drop figurine) ----
(function setupDropper() {
  const dropper = document.getElementById('dropper');
  const reticle = document.getElementById('drop-reticle');
  const mapEl = document.getElementById('map');
  let ghost = null;

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
      reticle.style.display = 'block';
      reticle.style.left = (clientX - rect.left) + 'px';
      reticle.style.top = (clientY - rect.top) + 'px';
    } else {
      reticle.style.display = 'none';
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

    reticle.style.display = 'none';
    document.body.classList.remove('is-dragging-dropper');

    if (ghost) { ghost.remove(); ghost = null; }

    if (isOverMap(clientX, clientY)) {
      const rect = mapEl.getBoundingClientRect();
      const latlng = map.containerPointToLatLng([clientX - rect.left, clientY - rect.top]);
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
  buildEmotionPicker();
  document.getElementById('intensity').value = 5;
  document.getElementById('energy').value = 5;
  document.getElementById('journal-note').value = '';
  document.querySelectorAll('.trigger-chip').forEach(c => c.classList.remove('selected'));
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
  pendingLatLng = null;
}

function buildEmotionPicker() {
  const grid = document.getElementById('emotion-picker');
  grid.innerHTML = EMOTIONS.map(e => `
    <div class="emotion-chip" data-emotion="${e.id}" onclick="toggleEmotion(this)"
         style="--dot-color:${e.color}; --chip-color:${e.color};">
      <div class="dot"></div>
      <span>${e.label}</span>
    </div>
  `).join('');
}

function toggleEmotion(el) { el.classList.toggle('selected'); }

document.querySelectorAll('.trigger-chip').forEach(chip => {
  chip.addEventListener('click', () => chip.classList.toggle('selected'));
});

function submitEntry() {
  const selected = [...document.querySelectorAll('#emotion-picker .emotion-chip.selected')]
    .map(el => el.dataset.emotion);
  if (selected.length === 0) { alert('Please select at least one emotion.'); return; }

  const triggers = [...document.querySelectorAll('.trigger-chip.selected')]
    .map(el => el.dataset.trigger);

  const entry = {
    id: Date.now(),
    lat: pendingLatLng.lat,
    lng: pendingLatLng.lng,
    emotions: selected,
    intensity: parseInt(document.getElementById('intensity').value),
    energy: parseInt(document.getElementById('energy').value),
    note: document.getElementById('journal-note').value.trim(),
    triggers,
    timestamp: new Date().toISOString()
  };

  entries.push(entry);
  localStorage.setItem('el_entries', JSON.stringify(entries));
  addMarker(entry);
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

  if (name === 'map') { setTimeout(() => map.invalidateSize(), 100); updateMapInfo(); }
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

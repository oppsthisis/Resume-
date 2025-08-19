/*
  Birthday Surprise for Saniya & Afreen
  - Intro tap -> heart burst + confetti
  - Name gate accepts only Saniya or Afreen
  - Plays background birthday track after interaction
  - Animated balloons/hearts, kawaii cake, fireworks, shayari carousel
*/

const state = {
  person: 'Bestie',
  audioEnabled: false,
  shayariIndex: 0,
};

const introOverlay = document.getElementById('intro-overlay');
const startBtn = document.getElementById('startBtn');
const confettiCanvas = document.getElementById('confetti-canvas');
const nameGate = document.getElementById('name-gate');
const nameInput = document.getElementById('nameInput');
const enterBtn = document.getElementById('enterBtn');
const gateError = document.getElementById('gateError');
const scene = document.getElementById('scene');
const personName = document.getElementById('personName');
const wishLine = document.getElementById('wishLine');
const floaters = document.getElementById('floaters');
const fireworksCanvas = document.getElementById('fireworks');
const starfield = document.getElementById('starfield');
const shayariBox = document.getElementById('shayariBox');
const prevShayari = document.getElementById('prevShayari');
const nextShayari = document.getElementById('nextShayari');
const toggleSoundBtn = document.getElementById('toggleSound');
const switchPersonBtn = document.getElementById('switchPerson');
const bgm = document.getElementById('bgm');
const burst = document.getElementById('burst');
const desktopHint = document.getElementById('desktop-hint');
const continueMobile = document.getElementById('continueMobile');
const copyLink = document.getElementById('copyLink');
const showQR = document.getElementById('showQR');
const qrOverlay = document.getElementById('qr-overlay');
const qrImage = document.getElementById('qrImage');
const closeQR = document.getElementById('closeQR');
const desktopCanvas = document.getElementById('desktopCanvas');
const galleryGrid = document.getElementById('galleryGrid');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const closeLightbox = document.getElementById('closeLightbox');
const typewriterEl = document.getElementById('typewriter');
const themeToggle = document.getElementById('themeToggle');
const shareBtn = document.getElementById('shareBtn');

// Load music sources dynamically (use royalty-free or path placeholders)
const SONGS = [
  // Add more local files to /birthday/audio/ if desired
  'https://cdn.pixabay.com/download/audio/2022/03/15/audio_0d4a58a87d.mp3?filename=birthday-112188.mp3',
  'https://cdn.pixabay.com/download/audio/2021/09/16/audio_c666e5c6d0.mp3?filename=happy-birthday-9623.mp3',
];

function pickSong() {
  const index = Math.floor(Math.random() * SONGS.length);
  return SONGS[index];
}

// -------- Audio fallback (WebAudio Melody) --------
let audioCtx = null;
let fallbackPlaying = false;
let fallbackStopFns = [];
let fallbackStartTimer = null;

function startFallbackMelody() {
  if (fallbackPlaying) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioCtx = audioCtx || new Ctx();
  } catch (e) {
    return; // WebAudio not available
  }
  const ctx = audioCtx;
  const master = ctx.createGain();
  master.gain.value = 0.06; // soft volume
  master.connect(ctx.destination);

  // Approx Happy Birthday melody (key of G)
  const melody = [
    // freq (Hz), duration (ms)
    [392, 350], [392, 350], [440, 700], [392, 700], [523, 700], [494, 1400],
    [392, 350], [392, 350], [440, 700], [392, 700], [587, 700], [523, 1400],
    [392, 350], [392, 350], [784, 700], [659, 700], [523, 700], [494, 700], [440, 1400],
    [698, 350], [698, 350], [659, 700], [523, 700], [587, 700], [523, 1600]
  ];

  let startTime = ctx.currentTime + 0.02;
  const toStop = [];
  for (let i = 0; i < melody.length; i++) {
    const [freq, durMs] = melody[i];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const dur = Math.max(0.05, durMs / 1000);
    const noteGain = 0.9; // relative per note
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(noteGain, startTime + 0.02);
    gain.gain.linearRampToValueAtTime(0.001, startTime + dur - 0.04);
    osc.connect(gain).connect(master);
    osc.start(startTime);
    osc.stop(startTime + dur);
    toStop.push(() => { try { osc.stop(); } catch(_){} });
    startTime += dur + 0.04; // small gap
  }
  fallbackStopFns = toStop;
  fallbackPlaying = true;

  // Auto-loop by scheduling next start after sequence ends
  const totalDurMs = melody.reduce((a, [,d]) => a + d, 0) + melody.length * 40;
  setTimeout(() => {
    if (fallbackPlaying) startFallbackMelody();
  }, totalDurMs);
}

function stopFallbackMelody() {
  if (!fallbackPlaying) return;
  fallbackPlaying = false;
  fallbackStopFns.forEach(fn => fn());
  fallbackStopFns = [];
  // Do not close context to allow reuse; simply suspend
  if (audioCtx && audioCtx.state !== 'closed') {
    try { audioCtx.suspend(); } catch(_) {}
  }
}

function setWishLine(name) {
  const lines = [
    `Allah tumhein hamesha khush rakhe, ${name}!`,
    `${name}, tumhari muskurahat sabse zyada chamke aaj!`,
    `Happy Birthday, ${name}! Stay blessed and awesome!`,
    `Dosti ki meethaas tumse hi hai, ${name}!`
  ];
  wishLine.textContent = lines[Math.floor(Math.random() * lines.length)];
}

function validateName(raw) {
  if (!raw) return null;
  const val = raw.trim().toLowerCase();
  if (['sania', 'saniya'].includes(val)) return 'Saniya';
  if (['afreen', 'afrin', 'afreena'].includes(val)) return 'Afreen';
  return null;
}

// Heart burst effect at center
function heartBurst(x, y, count = 28) {
  for (let i = 0; i < count; i++) {
    const span = document.createElement('span');
    span.className = 'burst-heart';
    span.textContent = '❤';
    const angle = (Math.PI * 2 * i) / count;
    const distance = 80 + Math.random() * 80;
    const dx = Math.cos(angle) * distance + 'px';
    const dy = Math.sin(angle) * distance + 'px';
    span.style.left = x + 'px';
    span.style.top = y + 'px';
    span.style.setProperty('--dx', dx);
    span.style.setProperty('--dy', dy);
    burst.appendChild(span);
    setTimeout(() => span.remove(), 1000);
  }
}

// Cursor/touch heart trail
function heartTrail(x, y) { heartBurst(x, y, 8); }
document.addEventListener('pointermove', (e) => {
  if (!scene || scene.classList.contains('hidden')) return;
  if (Math.random() < 0.1) heartTrail(e.clientX, e.clientY);
});
document.addEventListener('click', (e) => {
  if (!scene || scene.classList.contains('hidden')) return;
  heartTrail(e.clientX, e.clientY);
});

// Simple confetti using canvas
function confettiBoom(canvas, durationMs = 1200) {
  const ctx = canvas.getContext('2d');
  const w = (canvas.width = window.innerWidth);
  const h = (canvas.height = window.innerHeight);
  const pieces = Array.from({ length: 150 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h * 0.3 + h * 0.2,
    r: 4 + Math.random() * 6,
    c: Math.random() > 0.5 ? '#ff66a6' : (Math.random() > 0.5 ? '#7ef9ff' : '#ffd166'),
    vx: -2 + Math.random() * 4,
    vy: -6 - Math.random() * 6,
  }));
  let start = performance.now();

  function frame(t) {
    const elapsed = t - start;
    ctx.clearRect(0, 0, w, h);
    for (const p of pieces) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.25;
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (elapsed < durationMs) requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, w, h);
  }
  requestAnimationFrame(frame);
}

// Fireworks particles
function fireworksStart() {
  const canvas = fireworksCanvas;
  const ctx = canvas.getContext('2d');
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const particles = [];
  function spawnFirework() {
    const x = Math.random() * canvas.width * 0.8 + canvas.width * 0.1;
    const y = Math.random() * canvas.height * 0.3 + canvas.height * 0.15;
    const color = `hsl(${Math.random() * 360}, 90%, 60%)`;
    const count = 80;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 2 + Math.random() * 3.5;
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 60 + Math.random() * 20, color });
    }
  }
  let lastSpawn = 0;
  function tick(ts) {
    if (!lastSpawn || ts - lastSpawn > 1200) { spawnFirework(); lastSpawn = ts; }
    ctx.globalCompositeOperation = 'lighter';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.02;
      p.life -= 1;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// Starfield background
function startStarfield() {
  const canvas = starfield;
  const ctx = canvas.getContext('2d');
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);
  const stars = Array.from({ length: 160 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    z: Math.random() * 0.6 + 0.4,
    tw: Math.random() * 0.6 + 0.2
  }));
  function tick(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of stars) {
      const r = s.z * 1.2;
      const alpha = 0.4 + Math.sin((t / 500) * s.tw) * 0.3;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      ctx.fill();
      s.y += 0.02 + s.z * 0.06; // slow drift down
      if (s.y > canvas.height + 2) { s.y = -2; s.x = Math.random() * canvas.width; }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// Floaters generator
function spawnFloater() {
  const el = document.createElement('div');
  const isHeart = Math.random() > 0.5;
  el.className = 'floater ' + (isHeart ? 'heart' : 'balloon');
  el.style.left = Math.random() * 100 + 'vw';
  const duration = 10 + Math.random() * 12;
  el.style.animationDuration = duration + 's';
  el.style.setProperty('--drift', (Math.random() * 120 - 60) + 'px');
  el.style.setProperty('--rot', (Math.random() * 60 - 30) + 'deg');
  if (isHeart) el.textContent = Math.random() > 0.5 ? '❤' : '💖';
  else el.style.background = Math.random() > 0.5 ? '#ff66a6' : (Math.random() > 0.5 ? '#7ef9ff' : '#ffd166');
  floaters.appendChild(el);
  setTimeout(() => el.remove(), (duration + 1) * 1000);
}
// Desktop layout scaler — scales the scene to fit viewport width while keeping desktop aspect
function applyDesktopScale() {
  const container = desktopCanvas;
  const content = scene;
  if (!container || !content) return;
  const targetWidth = 1100;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scale = Math.min(vw / targetWidth, 1); // never upscale beyond 1
  content.style.transform = `scale(${scale}) translateY(${scale < 1 ? (vh/scale - vh)/4 + 'px' : '0'})`;
}
window.addEventListener('resize', applyDesktopScale);


function startFloaters() {
  for (let i = 0; i < 10; i++) setTimeout(spawnFloater, i * 400);
  setInterval(spawnFloater, 1200);
}

// Parallax banner scroll effect
window.addEventListener('scroll', () => {
  const banner = document.querySelector('.parallax-banner');
  if (!banner) return;
  const y = window.scrollY;
  banner.style.backgroundPositionY = `${y * 0.3}px`;
});

// Build gallery with placeholder images; replace URLs with your own
const GALLERY = [
  'https://res.cloudinary.com/dxjkbpmgm/image/upload/v1755595200/IMG_20250816_203354_hpyqym.png',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1541976076758-347942db1972?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1600&auto=format&fit=crop'
];

function buildGallery() {
  if (!galleryGrid) return;
  galleryGrid.innerHTML = '';
  GALLERY.forEach((src, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.setProperty('--rot', (Math.random() * 6 - 3) + 'deg');
    const img = document.createElement('img');
    img.src = src;
    img.alt = 'Memory photo ' + (i + 1);
    card.appendChild(img);
    card.addEventListener('click', () => openLightbox(src));
    galleryGrid.appendChild(card);
  });
}

function openLightbox(src) {
  if (!lightbox || !lightboxImg) return;
  lightboxImg.src = src;
  lightbox.classList.add('visible');
}
closeLightbox && closeLightbox.addEventListener('click', () => lightbox.classList.remove('visible'));

// Our Story Typewriter
const STORY_LINES = [
  'Ek din dosti hui, aur phir har din yaari gehri hoti gayi...',
  'Hasne ki wajah tum, himmat ka sahara bhi tum...',
  'Har saal, har pal, sirf khushiyan tumhare naam...',
  'Aaj ke din, sirf tum — Happy Birthday, Bestie!'
];

async function typewriter(lines, el, speed = 28, gap = 600) {
  if (!el) return;
  for (const line of lines) {
    el.innerHTML += '<div></div>';
    const div = el.lastChild;
    for (const ch of line) {
      div.textContent += ch;
      await new Promise(r => setTimeout(r, speed));
    }
    await new Promise(r => setTimeout(r, gap));
  }
}

// Theme toggle (light/dark accent)
let themeAlt = false;
function applyTheme() {
  document.documentElement.style.setProperty('--pink', themeAlt ? '#7b5cff' : '#ff66a6');
  document.documentElement.style.setProperty('--cyan', themeAlt ? '#a8ffea' : '#7ef9ff');
  document.documentElement.style.setProperty('--yellow', themeAlt ? '#ffc777' : '#ffd166');
}
themeToggle && themeToggle.addEventListener('click', () => {
  themeAlt = !themeAlt;
  applyTheme();
});

// Share button
shareBtn && shareBtn.addEventListener('click', async () => {
  const shareData = {
    title: 'Birthday Surprise',
    text: 'Come see this special birthday surprise! 🎉',
    url: location.href
  };
  try {
    if (navigator.share) await navigator.share(shareData);
    else {
      await navigator.clipboard.writeText(location.href);
      shareBtn.textContent = 'Copied!';
      setTimeout(() => (shareBtn.textContent = '📤 Share'), 1200);
    }
  } catch (_) {}
});

// Shayari
const SHAYARI = [
  'Dosti ki meethaas tum se hi hai, har muskurahat mein tera hissa hai.',
  'Woh dosti hi kya jo musibat mein kaam na aaye. Hum toh saanse tak saath nibhayenge.',
  'Teri dosti ka asar kuch aisa hai, gham bhi aaye toh muskurahat saath aati hai.',
  'Hum doston ke dushmanon ko bhi dost bana lete hain, jab hum saath hote hain toh duniya roshan lagti hai.',
  'Kuch rishtay khuda ki rehmat hote hain, unhi mein se ek teri dosti hai.',
  'Teri dosti ki chhaon mein dil ko sukoon milta hai.',
  'Har mod par tera saath chahiye, dosti ka ye haath bas yunhi sath rahe.',
  'Muskurahat teri sabse pyari, dosti teri sabse nyari.',
  'Humari dosti hawa jaisi hai—na dikhe, par har lamhe mehsoos ho.',
  'Na dhoop se darte hain, na aandhiyon se, hum dost hain to hausle bade hote hain.',
  'Dost woh hota hai jo bina kahe samajh le, aur bina bole muskurahat de de.',
  'Teri yaari meri zindagi, sabse pyari dastaan.',
  'Har ghadi teri yaari ka ehsaas, dil ko deta hai khaas.',
  'Zindagi ke safar mein dost kam hi milte hain, khush-naseeb hain jo tujhe paa liya.',
  'Tu muskuraati rahe sada, yehi meri har dua.'
];

function typeInto(el, text, speed = 22) {
  return new Promise(async (resolve) => {
    el.textContent = '';
    for (const ch of text) {
      el.textContent += ch;
      await new Promise(r => setTimeout(r, speed));
    }
    resolve();
  });
}

async function showShayari(index) {
  const total = SHAYARI.length;
  state.shayariIndex = (index + total) % total;
  const text = SHAYARI[state.shayariIndex];
  await typeInto(shayariBox, text, 22);
}

// auto-rotate shayari
let shayariTimer = null;
async function startShayariAuto() {
  if (shayariTimer) clearTimeout(shayariTimer);
  await showShayari(state.shayariIndex);
  shayariTimer = setTimeout(async function cycle() {
    await showShayari(state.shayariIndex + 1);
    shayariTimer = setTimeout(cycle, 1200);
  }, 1500);
}

// Audio control
function ensureAudio() {
  if (!state.audioEnabled) return;
  if (!bgm.src) bgm.src = pickSong();
  const playPromise = bgm.play();
  if (playPromise) {
    playPromise.then(() => {
      stopFallbackMelody();
    }).catch(() => {
      // If media blocked or failed, use fallback
      if (!fallbackPlaying) startFallbackMelody();
    });
  }
}

toggleSoundBtn.addEventListener('click', () => {
  state.audioEnabled = !state.audioEnabled;
  toggleSoundBtn.textContent = state.audioEnabled ? '🔈 Mute' : '🔊 Sound';
  if (state.audioEnabled) ensureAudio(); else bgm.pause();
});

switchPersonBtn.addEventListener('click', () => {
  state.person = state.person === 'Saniya' ? 'Afreen' : 'Saniya';
  personName.textContent = state.person;
  setWishLine(state.person);
});

// Start flow
startBtn.addEventListener('click', () => {
  // heart burst from center
  const rect = introOverlay.getBoundingClientRect();
  heartBurst(rect.width / 2, rect.height / 2, 36);
  confettiBoom(confettiCanvas);
  setTimeout(() => {
    introOverlay.classList.remove('visible');
    // Mobile hint: show if screen width < 720px, otherwise go straight
    if (window.innerWidth < 720) {
      desktopHint.classList.add('visible');
    } else {
      nameGate.classList.add('visible');
    }
  }, 900);
});

enterBtn.addEventListener('click', () => {
  const name = validateName(nameInput.value);
  if (!name) {
    gateError.textContent = 'Only Saniya or Afreen allowed 🙂';
    return;
  }
  state.person = name;
  personName.textContent = name;
  setWishLine(name);
  nameGate.classList.remove('visible');
  scene.classList.remove('hidden');
  state.audioEnabled = true; // enable after explicit interaction
  // Try HTML audio; schedule fallback if it fails to start
  ensureAudio();
  clearTimeout(fallbackStartTimer);
  fallbackStartTimer = setTimeout(() => {
    if (!bgm || bgm.paused) startFallbackMelody();
  }, 800);
  fireworksStart();
  startFloaters();
  buildGallery();
  typewriter(STORY_LINES, typewriterEl);
  applyTheme();
});

nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') enterBtn.click(); });

// Desktop hint controls
continueMobile.addEventListener('click', () => {
  desktopHint.classList.remove('visible');
  nameGate.classList.add('visible');
});
copyLink.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(location.href);
    copyLink.textContent = 'Link Copied!';
    setTimeout(() => (copyLink.textContent = 'Copy Link'), 1500);
  } catch (_) {
    copyLink.textContent = 'Copy Failed';
    setTimeout(() => (copyLink.textContent = 'Copy Link'), 1500);
  }
});

// Show QR code using a public API (no dependency); falls back to Google Charts if needed
function generateQR(url) {
  const encoded = encodeURIComponent(url);
  // Try goqr.me API first
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encoded}`;
}

showQR.addEventListener('click', () => {
  const link = location.href;
  qrImage.src = generateQR(link);
  qrOverlay.classList.add('visible');
});

closeQR.addEventListener('click', () => {
  qrOverlay.classList.remove('visible');
});

// Prebuild shayari list and navigation
showShayari(0);
startShayariAuto();

// Accessibility: pause when tab hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden) bgm.pause();
  else if (state.audioEnabled) ensureAudio();
});

// Start background animations
startStarfield();
applyDesktopScale();
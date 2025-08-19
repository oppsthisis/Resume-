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
const shayariList = document.getElementById('shayariList');
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

function buildShayariSlides() {
  shayariList.innerHTML = '';
  SHAYARI.forEach((line, idx) => {
    const li = document.createElement('li');
    li.textContent = line;
    if (idx === 0) li.classList.add('active');
    shayariList.appendChild(li);
  });
}

function showShayari(index) {
  const items = Array.from(shayariList.children);
  state.shayariIndex = (index + items.length) % items.length;
  items.forEach((el, i) => el.classList.toggle('active', i === state.shayariIndex));
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
buildShayariSlides();
prevShayari.addEventListener('click', () => showShayari(state.shayariIndex - 1));
nextShayari.addEventListener('click', () => showShayari(state.shayariIndex + 1));

// Accessibility: pause when tab hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden) bgm.pause();
  else if (state.audioEnabled) ensureAudio();
});

// Start background animations
startStarfield();
applyDesktopScale();


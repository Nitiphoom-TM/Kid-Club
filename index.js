/* ==========================================
   Kid Club - Interactive Storybook Engine
   ========================================== */

let storyData = null;
let currentPageIndex = 0;
let isSoundEnabled = true;
let audioContext = null;

// DOM Elements
const welcomeScreen = document.getElementById('welcome-screen');
const storyScreen = document.getElementById('story-screen');
const btnPlayStory = document.getElementById('btn-play-story');
const btnHome = document.getElementById('btn-home');
const btnSoundToggle = document.getElementById('btn-sound-toggle');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const pageNumSpan = document.getElementById('current-page-num');
const sceneImage = document.getElementById('scene-image');
const textDisplay = document.getElementById('text-display');
const interactiveOverlay = document.getElementById('interactive-overlay');
const narrationAudio = document.getElementById('narration-audio');

// ------------------------------------------
// 1. Init & Event Listeners
// ------------------------------------------

async function init() {
  try {
    // Load story JSON configuration
    const response = await fetch('assets/stories/rabbit_and_tortoise.json');
    storyData = await response.json();
    console.log('Story loaded:', storyData.title);
    
    // Bind Event Listeners
    btnPlayStory.addEventListener('click', startStory);
    btnHome.addEventListener('click', goHome);
    btnSoundToggle.addEventListener('click', toggleSound);
    btnPrev.addEventListener('click', prevPage);
    btnNext.addEventListener('click', nextPage);
    
    // Timeupdate sync for highlighting text
    narrationAudio.addEventListener('timeupdate', syncHighlighting);
  } catch (error) {
    console.error('Error initializing Kid Club:', error);
  }
}

// Start user audio context on first touch to satisfy browser security policies
function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
}

function startStory() {
  initAudioContext();
  welcomeScreen.classList.remove('active');
  storyScreen.classList.add('active');
  currentPageIndex = 0;
  loadPage(currentPageIndex);
}

function goHome() {
  narrationAudio.pause();
  storyScreen.classList.remove('active');
  welcomeScreen.classList.add('active');
}

function toggleSound() {
  isSoundEnabled = !isSoundEnabled;
  btnSoundToggle.innerText = isSoundEnabled ? '🔊' : '🔇';
  if (!isSoundEnabled) {
    narrationAudio.muted = true;
  } else {
    initAudioContext();
    narrationAudio.muted = false;
  }
}

// ------------------------------------------
// 2. Page Loading & Interaction Render
// ------------------------------------------

function loadPage(index) {
  if (!storyData || index < 0 || index >= storyData.pages.length) return;
  
  currentPageIndex = index;
  const page = storyData.pages[index];
  
  // Set UI Details
  pageNumSpan.innerText = page.pageNumber;
  sceneImage.src = page.image;
  
  // Update Nav Buttons
  btnPrev.classList.toggle('disabled', index === 0);
  btnNext.classList.toggle('disabled', index === storyData.pages.length - 1);
  
  // Render text chunks into spans
  textDisplay.innerHTML = '';
  page.chunks.forEach((chunk, i) => {
    const span = document.createElement('span');
    span.innerText = chunk;
    span.dataset.index = i;
    textDisplay.appendChild(span);
  });
  
  // Render tap target overlays for interactive characters
  interactiveOverlay.innerHTML = '';
  page.interactives.forEach(char => {
    const target = document.createElement('div');
    target.className = 'interactive-target';
    target.style.left = `${char.x}%`;
    target.style.top = `${char.y}%`;
    target.style.width = `${char.width}%`;
    target.style.height = `${char.height}%`;
    
    // Add interaction trigger
    target.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerCharacter(char);
    });
    
    interactiveOverlay.appendChild(target);
  });
  
  // Play Narration
  narrationAudio.src = page.audio;
  narrationAudio.currentTime = 0;
  
  // Tiny delay to ensure audio is loaded before playing
  setTimeout(() => {
    narrationAudio.play().catch(e => console.log("Auto-play blocked by browser. Awaiting interaction."));
  }, 100);
}

function prevPage() {
  if (currentPageIndex > 0) {
    loadPage(currentPageIndex - 1);
  }
}

function nextPage() {
  if (currentPageIndex < storyData.pages.length - 1) {
    loadPage(currentPageIndex + 1);
  }
}

// ------------------------------------------
// 3. Audio Sync & Text Highlighting
// ------------------------------------------

function syncHighlighting() {
  if (!storyData) return;
  const page = storyData.pages[currentPageIndex];
  const currentTime = narrationAudio.currentTime;
  
  // Find which chunk is active based on timings
  let activeIndex = -1;
  for (let i = 0; i < page.timings.length; i++) {
    if (currentTime >= page.timings[i]) {
      activeIndex = i;
    } else {
      break;
    }
  }
  
  // Apply highlight class to spans
  const spans = textDisplay.querySelectorAll('span');
  spans.forEach((span, i) => {
    span.classList.toggle('active', i === activeIndex);
  });
}

// ------------------------------------------
// 4. Character Animations & Web Audio Synthesizer
// ------------------------------------------

function triggerCharacter(char) {
  initAudioContext();
  
  // Apply Animation to scene image container briefly
  const imgElement = document.getElementById('scene-image');
  const animClass = `animate-${char.animation}`;
  
  imgElement.classList.add(animClass);
  setTimeout(() => {
    imgElement.classList.remove(animClass);
  }, 600);
  
  // Play dynamic sound effect
  if (isSoundEnabled) {
    playSynthSound(char.sound);
  }
}

// Play pre-mapped synthesizer sounds programmatically
function playSynthSound(soundKey) {
  if (!audioContext) return;
  
  // Route to the appropriate synthesizer sound algorithm
  if (soundKey.includes('rabbit_jump')) {
    synthJump();
  } else if (soundKey.includes('rabbit_laugh')) {
    synthLaugh();
  } else if (soundKey.includes('tortoise_walk')) {
    synthWalk();
  } else if (soundKey.includes('tortoise_speak')) {
    synthSpeak();
  } else if (soundKey.includes('rabbit_gasp')) {
    synthGasp();
  } else if (soundKey.includes('rabbit_run')) {
    synthRun();
  } else if (soundKey.includes('rabbit_snore')) {
    synthSnore();
  } else if (soundKey.includes('cheer')) {
    synthCheer();
  } else if (soundKey.includes('rabbit_cry')) {
    synthCry();
  } else if (soundKey.includes('applause')) {
    synthApplause();
  } else if (soundKey.includes('rabbit_cheer')) {
    synthRabbitCheer();
  }
}

// --- SYNTHESIZER SOUND GENERATORS ---

function synthJump() {
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, audioContext.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.3);
  
  gain.gain.setValueAtTime(0.3, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
  
  osc.connect(gain);
  gain.connect(audioContext.destination);
  
  osc.start();
  osc.stop(audioContext.currentTime + 0.3);
}

function synthLaugh() {
  const now = audioContext.currentTime;
  const count = 4;
  for (let i = 0; i < count; i++) {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now + (i * 0.12));
    osc.frequency.exponentialRampToValueAtTime(700, now + (i * 0.12) + 0.08);
    
    gain.gain.setValueAtTime(0.2, now + (i * 0.12));
    gain.gain.exponentialRampToValueAtTime(0.01, now + (i * 0.12) + 0.08);
    
    osc.connect(gain);
    gain.connect(audioContext.destination);
    
    osc.start(now + (i * 0.12));
    osc.stop(now + (i * 0.12) + 0.08);
  }
}

function synthWalk() {
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(120, audioContext.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.15);
  
  gain.gain.setValueAtTime(0.4, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
  
  osc.connect(gain);
  gain.connect(audioContext.destination);
  
  osc.start();
  osc.stop(audioContext.currentTime + 0.15);
}

function synthSpeak() {
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(130, audioContext.currentTime);
  osc.frequency.linearRampToValueAtTime(170, audioContext.currentTime + 0.2);
  
  gain.gain.setValueAtTime(0.25, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
  
  osc.connect(gain);
  gain.connect(audioContext.destination);
  
  osc.start();
  osc.stop(audioContext.currentTime + 0.25);
}

function synthGasp() {
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, audioContext.currentTime);
  osc.frequency.exponentialRampToValueAtTime(900, audioContext.currentTime + 0.2);
  
  gain.gain.setValueAtTime(0.2, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
  
  osc.connect(gain);
  gain.connect(audioContext.destination);
  
  osc.start();
  osc.stop(audioContext.currentTime + 0.2);
}

function synthRun() {
  const now = audioContext.currentTime;
  const steps = 6;
  for (let i = 0; i < steps; i++) {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now + (i * 0.08));
    osc.frequency.exponentialRampToValueAtTime(80, now + (i * 0.08) + 0.06);
    
    gain.gain.setValueAtTime(0.3, now + (i * 0.08));
    gain.gain.exponentialRampToValueAtTime(0.01, now + (i * 0.08) + 0.06);
    
    osc.connect(gain);
    gain.connect(audioContext.destination);
    
    osc.start(now + (i * 0.08));
    osc.stop(now + (i * 0.08) + 0.06);
  }
}

function synthSnore() {
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(75, audioContext.currentTime);
  osc.frequency.linearRampToValueAtTime(85, audioContext.currentTime + 0.8);
  osc.frequency.linearRampToValueAtTime(75, audioContext.currentTime + 1.6);
  
  gain.gain.setValueAtTime(0.01, audioContext.currentTime);
  gain.gain.linearRampToValueAtTime(0.12, audioContext.currentTime + 0.8);
  gain.gain.linearRampToValueAtTime(0.01, audioContext.currentTime + 1.6);
  
  osc.connect(gain);
  gain.connect(audioContext.destination);
  
  osc.start();
  osc.stop(audioContext.currentTime + 1.6);
}

function synthCheer() {
  // Synthesize soft applause & whistling
  const bufferSize = audioContext.sampleRate * 1.5;
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  
  // Fill buffer with random white noise
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const noise = audioContext.createBufferSource();
  noise.buffer = buffer;
  
  const filter = audioContext.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1000, audioContext.currentTime);
  
  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(0.15, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.5);
  
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);
  
  noise.start();
  noise.stop(audioContext.currentTime + 1.5);
  
  // Add a cute little bird-whistle
  const osc = audioContext.createOscillator();
  const oscGain = audioContext.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, audioContext.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1500, audioContext.currentTime + 0.3);
  
  oscGain.gain.setValueAtTime(0.05, audioContext.currentTime);
  oscGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
  
  osc.connect(oscGain);
  oscGain.connect(audioContext.destination);
  
  osc.start();
  osc.stop(audioContext.currentTime + 0.3);
}

function synthCry() {
  const now = audioContext.currentTime;
  for (let i = 0; i < 2; i++) {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, now + (i * 0.4));
    osc.frequency.exponentialRampToValueAtTime(300, now + (i * 0.4) + 0.3);
    
    gain.gain.setValueAtTime(0.2, now + (i * 0.4));
    gain.gain.exponentialRampToValueAtTime(0.01, now + (i * 0.4) + 0.3);
    
    osc.connect(gain);
    gain.connect(audioContext.destination);
    
    osc.start(now + (i * 0.4));
    osc.stop(now + (i * 0.4) + 0.3);
  }
}

function synthApplause() {
  // Sound of clapping hands
  const bufferSize = audioContext.sampleRate * 2.0;
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const noise = audioContext.createBufferSource();
  noise.buffer = buffer;
  
  const filter = audioContext.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(900, audioContext.currentTime);
  
  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(0.25, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 2.0);
  
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);
  
  noise.start();
  noise.stop(audioContext.currentTime + 2.0);
}

function synthRabbitCheer() {
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(450, audioContext.currentTime);
  osc.frequency.exponentialRampToValueAtTime(900, audioContext.currentTime + 0.25);
  
  gain.gain.setValueAtTime(0.2, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
  
  osc.connect(gain);
  gain.connect(audioContext.destination);
  
  osc.start();
  osc.stop(audioContext.currentTime + 0.25);
}

// ------------------------------------------
// 5. App Launch
// ------------------------------------------

window.addEventListener('DOMContentLoaded', init);

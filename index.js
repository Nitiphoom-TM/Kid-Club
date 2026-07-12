/* ==========================================
   Kid Club - Master Application Engine
   ========================================== */

let storyData = null;
let currentPageIndex = 0;
let isSoundEnabled = true;
let audioContext = null;
let currentPlaybackSpeed = 1.0;

// DOM Elements
const screens = document.querySelectorAll('.screen');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const pageNumSpan = document.getElementById('current-page-num');
const sceneImage = document.getElementById('scene-image');
const interactiveOverlay = document.getElementById('interactive-overlay');
const narrationAudio = document.getElementById('narration-audio');

// Settings Modal Elements
const settingsOverlay = document.getElementById('settings-overlay');
const btnSettingsToggle = document.getElementById('btn-settings-toggle');
const btnSettingsClose = document.getElementById('btn-settings-close');
const settingsSoundBtn = document.getElementById('settings-sound-btn');
const btnReplay = document.getElementById('btn-replay');

// ------------------------------------------
// 1. App Navigation & Routing
// ------------------------------------------

function showScreen(screenId) {
  screens.forEach(screen => {
    screen.classList.remove('active');
  });
  const activeScreen = document.getElementById(screenId);
  if (activeScreen) {
    activeScreen.classList.add('active');
  }
  
  // Pause story narration when leaving the storybook player
  if (screenId !== 'story-screen') {
    narrationAudio.pause();
    removeNextGlow();
  }
}

function initNavigation() {
  // Hub Main Menu Cards
  document.querySelectorAll('.hub-card').forEach(card => {
    card.addEventListener('click', () => {
      initAudioContext();
      const target = card.dataset.target;
      showScreen(target);
    });
  });

  // Back to Home buttons
  document.querySelectorAll('.btn-back-home').forEach(btn => {
    btn.addEventListener('click', () => {
      showScreen('welcome-screen');
    });
  });

  // Generic Back buttons
  document.querySelectorAll('.btn-back-to').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      showScreen(target);
    });
  });

  // Story Choice Selector
  document.querySelectorAll('.story-list-item').forEach(item => {
    item.addEventListener('click', () => {
      const storyId = item.dataset.story;
      if (storyId) {
        startStory(storyId);
      }
    });
  });

  // Learning Menu Grid Selector
  document.querySelectorAll('[data-learn]').forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.dataset.learn;
      const label = btn.innerText;
      loadLearningGrid(category, label);
    });
  });

  // Game Menu Selector
  document.querySelectorAll('[data-game]').forEach(btn => {
    btn.addEventListener('click', () => {
      const gameKey = btn.dataset.game;
      const label = btn.innerText;
      loadGame(gameKey, label);
    });
  });
}

// ------------------------------------------
// 2. Audio Context & TTS Setup
// ------------------------------------------

function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
}

// Speak text using Web Speech API in Thai
function speakThai(text, pitch = 1.3) {
  if (!isSoundEnabled) return;
  window.speechSynthesis.cancel(); // Stop any active speech
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'th-TH';
  utterance.pitch = pitch; // High pitched and cute
  utterance.rate = 0.95;   // Friendly speed
  
  window.speechSynthesis.speak(utterance);
}

function toggleSound() {
  isSoundEnabled = !isSoundEnabled;
  if (settingsSoundBtn) {
    settingsSoundBtn.innerText = isSoundEnabled ? 'เปิดเสียง 🔊' : 'ปิดเสียง 🔇';
    settingsSoundBtn.classList.toggle('muted', !isSoundEnabled);
  }
  if (!isSoundEnabled) {
    narrationAudio.muted = true;
    window.speechSynthesis.cancel();
  } else {
    initAudioContext();
    narrationAudio.muted = false;
  }
}

// ------------------------------------------
// 3. Interactive Storybook Logic
// ------------------------------------------

async function startStory(storyId) {
  initAudioContext();
  try {
    const response = await fetch(`assets/stories/${storyId}.json`);
    storyData = await response.json();
    showScreen('story-screen');
    currentPageIndex = 0;
    loadPage(currentPageIndex);
  } catch (error) {
    console.error(`Failed to load story JSON config for ${storyId}:`, error);
  }
}

function loadPage(index) {
  if (!storyData || index < 0 || index >= storyData.pages.length) return;
  
  currentPageIndex = index;
  const page = storyData.pages[index];
  
  // Set UI Details
  pageNumSpan.innerText = page.pageNumber;
  sceneImage.src = page.image;
  
  // Reset foot navigation glow
  removeNextGlow();
  
  // Update Nav buttons
  btnPrev.classList.toggle('disabled', index === 0);
  btnNext.classList.toggle('disabled', index === storyData.pages.length - 1);
  
  // Interactive targets
  interactiveOverlay.innerHTML = '';
  page.interactives.forEach(char => {
    const target = document.createElement('div');
    target.className = 'interactive-target';
    target.style.left = `${char.x}%`;
    target.style.top = `${char.y}%`;
    target.style.width = `${char.width}%`;
    target.style.height = `${char.height}%`;
    
    target.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerCharacter(char);
    });
    
    interactiveOverlay.appendChild(target);
  });
  
  // Load and play narration audio
  narrationAudio.src = page.audio;
  narrationAudio.playbackRate = currentPlaybackSpeed;
  narrationAudio.currentTime = 0;
  
  setTimeout(() => {
    narrationAudio.play().catch(e => console.log('Auto-play blocked, awaiting user interaction.'));
  }, 120);
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

// Timing highlight synchronization has been disabled as per UI requests

function handleNarrationEnded() {
  // Reading finished - trigger the glow and bounce alert on the Next footprint button
  btnNext.classList.add('highlight-next');
}

function removeNextGlow() {
  btnNext.classList.remove('highlight-next');
}

function triggerCharacter(char) {
  initAudioContext();
  
  const imgElement = document.getElementById('scene-image');
  const animClass = `animate-${char.animation}`;
  
  imgElement.classList.add(animClass);
  setTimeout(() => {
    imgElement.classList.remove(animClass);
  }, 600);
  
  if (isSoundEnabled) {
    playSynthSound(char.sound);
  }
}

// ------------------------------------------
// 4. Learning World Grids Data & Logic
// ------------------------------------------

const LEARNING_DATA = {
  thai: [
    { key: "ก", val: "กอ ไก่" }, { key: "ข", val: "ขอ ไข่" }, { key: "ฃ", val: "ขอ ขวด" }, { key: "ค", val: "คอ ควาย" },
    { key: "ฅ", val: "คอ คน" }, { key: "ฆ", val: "คอ ระฆัง" }, { key: "ง", val: "งอ งู" }, { key: "จ", val: "จอ จาน" },
    { key: "ฉ", val: "ฉอ ฉิ่ง" }, { key: "ช", val: "ชอ ช้าง" }, { key: "ซ", val: "ซอ โซ่" }, { key: "ฌ", val: "ฌอ เฌอ" },
    { key: "ญ", val: "ญอ หญิง" }, { key: "ฎ", val: "ดอ ชฎา" }, { key: "ฏ", val: "ตอ ปฏัก" }, { key: "ฐ", val: "ถอ ฐาน" },
    { key: "ฑ", val: "ทอ มณโฑ" }, { key: "ฒ", val: "ทอ ผู้เฒ่า" }, { key: "ณ", val: "ณอ เณร" }, { key: "ด", val: "ดอ เด็ก" },
    { key: "ต", val: "ตอ เต่า" }, { key: "ถ", val: "ถอ ถุง" }, { key: "ท", val: "ทอ ทหาร" }, { key: "ธ", val: "ธอ ธง" },
    { key: "น", val: "นอ หนู" }, { key: "บ", val: "บอ ใบไม้" }, { key: "ป", val: "ปอ ปลา" }, { key: "ผ", val: "ผอ ผึ้ง" },
    { key: "ฝ", val: "ฝอ ฝา" }, { key: "พ", val: "พอ พาน" }, { key: "ฟ", val: "ฟอ ฟัน" }, { key: "ภ", val: "พอ สำเภา" },
    { key: "ม", val: "มอ ม้า" }, { key: "ย", val: "ยอ ยักษ์" }, { key: "ร", val: "รอ เรือ" }, { key: "ล", val: "ลอ ลิง" },
    { key: "ว", val: "วอ แหวน" }, { key: "ศ", val: "สอ ศาลา" }, { key: "ษ", val: "สอ ฤาษี" }, { key: "ส", val: "สอ เสือ" },
    { key: "ห", val: "หอ หีบ" }, { key: "ฬ", val: "ลอ จุฬา" }, { key: "อ", val: "ออ อ่าง" }, { key: "ฮ", val: "ฮอ นกฮูก" }
  ],
  english: [
    { key: "A", val: "เอ แแอปเปิ้ล" }, { key: "B", val: "บี บานาน่า" }, { key: "C", val: "ซี แคท" }, { key: "D", val: "ดี ด็อก" },
    { key: "E", val: "อี เอลเลเฟ่นท์" }, { key: "F", val: "เอฟ ฟิช" }, { key: "G", val: "จี เกรป" }, { key: "H", val: "เอช ฮอร์ส" },
    { key: "I", val: "ไอ ไอศกรีม" }, { key: "J", val: "เจ เจลลี่" }, { key: "K", val: "เค ไคท์" }, { key: "L", val: "แอล ไลออน" },
    { key: "M", val: "เอ็ม มังกี้" }, { key: "N", val: "เอ็น เนสท์" }, { key: "O", val: "โอ ออเรนจ์" }, { key: "P", val: "พี แพนด้า" },
    { key: "Q", val: "คิว ควีน" }, { key: "R", val: "อาร์ แรบบิท" }, { key: "S", val: "เอส ซัน" }, { key: "T", val: "ที ไทเกอร์" },
    { key: "U", val: "ยู อัมเบรลล่า" }, { key: "V", val: "วี แวน" }, { key: "W", val: "ดับเบิ้ลยู วอเตอร์" }, { key: "X", val: "เอ็กซ์ ไซโลโฟน" },
    { key: "Y", val: "วาย โยโย่" }, { key: "Z", val: "ซี แซบรา" }
  ],
  colors: [
    { key: "#FF3366", val: "สีแดง" }, { key: "#FFCC00", val: "สีเหลือง" }, { key: "#3399FF", val: "สีน้ำเงิน" },
    { key: "#2ECC71", val: "สีเขียว" }, { key: "#FF7F27", val: "สีส้ม" }, { key: "#9B5DE5", val: "สีม่วง" },
    { key: "#FF82C5", val: "สีชมพู" }, { key: "#1E1E1E", val: "สีดำ" }
  ],
  fruits: [
    { key: "🍎", val: "แอปเปิ้ล" }, { key: "🍌", val: "กล้วย" }, { key: "🍊", val: "ส้ม" }, { key: "🍇", val: "องุ่น" },
    { key: "🍓", val: "สตรอว์เบอร์รี" }, { key: "🍉", val: "แตงโม" }, { key: "🥭", val: "มะม่วง" }, { key: "🍍", val: "สับปะรด" }
  ],
  vehicles: [
    { key: "🚗", val: "รถยนต์" }, { key: "🚓", val: "รถตำรวจ" }, { key: "🚑", val: "รถพยาบาล" }, { key: "🚒", val: "รถดับเพลิง" },
    { key: "🚂", val: "รถไฟ" }, { key: "✈️", val: "เครื่องบิน" }, { key: "🚲", val: "จักรยาน" }, { key: "🚜", val: "รถไถ" }
  ],
  home: [
    { key: "🛏️", val: "เตียงนอน" }, { key: "🪑", val: "เก้าอี้" }, { key: "🍽️", val: "จานข้าว" }, { key: "⏰", val: "นาฬิกา" },
    { key: "☎️", val: "โทรศัพท์" }, { key: "🔑", val: "กุญแจ" }, { key: "🥛", val: "แก้วน้ำ" }, { key: "☂️", val: "ร่ม" }
  ],
  careers: [
    { key: "🩺", val: "คุณหมอ" }, { key: "🍎", val: "คุณครู" }, { key: "👮", val: "คุณตำรวจ" }, { key: "👨‍🚒", val: "นักดับเพลิง" },
    { key: "🍳", val: "พ่อครัว" }, { key: "👨‍🌾", val: "ชาวนา" }, { key: "👩‍✈️", val: "นักบิน" }, { key: "👨‍🚀", val: "นักบินอวกาศ" }
  ]
};

function loadLearningGrid(category, label) {
  const gridTitle = document.getElementById('learning-grid-title');
  const gridContainer = document.getElementById('learning-grid');
  
  gridTitle.innerText = label;
  gridContainer.innerHTML = '';
  
  const items = LEARNING_DATA[category] || [];
  
  items.forEach(item => {
    const card = document.createElement('button');
    card.className = 'learn-card';
    
    if (category === 'colors') {
      const preview = document.createElement('div');
      preview.className = 'learn-color-preview';
      preview.style.backgroundColor = item.key;
      card.appendChild(preview);
      
      const text = document.createElement('div');
      text.className = 'learn-card-label';
      text.innerText = item.val;
      card.appendChild(text);
    } else {
      card.innerText = item.key;
      const text = document.createElement('div');
      text.className = 'learn-card-label';
      text.innerText = item.val;
      card.appendChild(text);
    }
    
    // Tap to Speak logic for child learning
    card.addEventListener('click', () => {
      card.classList.add('animate-pulse');
      setTimeout(() => card.classList.remove('animate-pulse'), 400);
      
      // Sound effect pops
      synthJump();
      speakThai(item.val);
    });
    
    gridContainer.appendChild(card);
  });
  
  showScreen('learning-grid-screen');
}

// ------------------------------------------
// 5. Game World Logic
// ------------------------------------------

function loadGame(gameKey, label) {
  const gameTitle = document.getElementById('game-play-title');
  const gameCanvas = document.getElementById('game-canvas');
  
  gameTitle.innerText = label;
  gameCanvas.innerHTML = '';
  
  if (gameKey === 'soundboard') {
    initAnimalSoundboard(gameCanvas);
  } else if (gameKey === 'sorter') {
    initColorSorter(gameCanvas);
  }
  
  showScreen('game-play-screen');
}

/* 🐱 Game 1: Animal Soundboard */
const SOUNDBOARD_ANIMALS = [
  { emoji: "🐱", name: "แมว", sound: "rabbit_laugh" },
  { emoji: "🐶", name: "สุนัข", sound: "rabbit_gasp" },
  { emoji: "🐮", name: "วัว", sound: "tortoise_speak" },
  { emoji: "🐑", name: "แกะ", sound: "rabbit_snore" },
  { emoji: "🐷", name: "หมู", sound: "tortoise_walk" },
  { emoji: "🦁", name: "สิงโต", sound: "applause" },
  { emoji: "🐸", name: "กบ", sound: "rabbit_jump" },
  { emoji: "🦆", name: "เป็ด", sound: "rabbit_cheer" },
  { emoji: "🐵", name: "ลิง", sound: "rabbit_laugh" },
  { emoji: "🐔", name: "ไก่", sound: "rabbit_cheer" },
  { emoji: "🐴", name: "ม้า", sound: "rabbit_run" },
  { emoji: "🐘", name: "ช้าง", sound: "cheer" }
];

function initAnimalSoundboard(container) {
  const grid = document.createElement('div');
  grid.className = 'soundboard-grid';
  
  SOUNDBOARD_ANIMALS.forEach(animal => {
    const card = document.createElement('button');
    card.className = 'soundboard-card';
    
    const emoji = document.createElement('div');
    emoji.className = 'soundboard-emoji';
    emoji.innerText = animal.emoji;
    
    const name = document.createElement('div');
    name.className = 'soundboard-name';
    name.innerText = animal.name;
    
    card.appendChild(emoji);
    card.appendChild(name);
    
    card.addEventListener('click', () => {
      card.classList.add('animate-pulse');
      setTimeout(() => card.classList.remove('animate-pulse'), 500);
      
      playSynthSound(animal.sound);
      speakThai(animal.name, 1.4);
    });
    
    grid.appendChild(card);
  });
  
  container.appendChild(grid);
}

/* 🔴 Game 2: Color Sorter (Tap-to-match for Toddlers) */
function initColorSorter(container) {
  let score = 0;
  let selectedBall = null;
  
  const gameWrapper = document.createElement('div');
  gameWrapper.className = 'sorter-game-container';
  
  // Score indicator
  const scoreBadge = document.createElement('div');
  scoreBadge.className = 'score-badge';
  scoreBadge.innerText = `คะแนน: ${score}`;
  gameWrapper.appendChild(scoreBadge);
  
  // Top play area
  const playArea = document.createElement('div');
  playArea.className = 'sorter-play-area';
  gameWrapper.appendChild(playArea);
  
  // Bottom basket area
  const basketArea = document.createElement('div');
  basketArea.className = 'sorter-basket-area';
  
  const colors = [
    { label: "สีแดง", hex: "#FF3366", key: "red" },
    { label: "สีเหลือง", hex: "#FFCC00", key: "yellow" },
    { label: "สีน้ำเงิน", hex: "#3399FF", key: "blue" }
  ];
  
  colors.forEach(col => {
    const basket = document.createElement('div');
    basket.className = 'sorter-basket';
    basket.style.backgroundColor = col.hex;
    basket.innerText = col.label;
    
    // Clicking a basket attempts to sort the active ball
    basket.addEventListener('click', () => {
      if (selectedBall) {
        if (selectedBall.dataset.color === col.key) {
          // Success!
          score++;
          scoreBadge.innerText = `คะแนน: ${score}`;
          synthCheer();
          speakThai("เก่งมากครับ!");
          
          // Animate ball drop
          selectedBall.style.top = '100%';
          selectedBall.style.opacity = '0';
          
          const targetBall = selectedBall;
          selectedBall = null;
          setTimeout(() => {
            targetBall.remove();
            spawnBall();
          }, 300);
        } else {
          // Wrong basket - waddle waddle
          selectedBall.classList.add('animate-shake');
          speakThai("ลองใหม่นะจ๊ะ");
          synthWalk();
          setTimeout(() => {
            selectedBall.classList.remove('animate-shake');
          }, 500);
        }
      }
    });
    
    basketArea.appendChild(basket);
  });
  
  gameWrapper.appendChild(basketArea);
  container.appendChild(gameWrapper);
  
  // Spawns a colored toy ball
  function spawnBall() {
    const ball = document.createElement('div');
    ball.className = 'sorter-ball';
    
    // Choose random color
    const randColor = colors[Math.floor(Math.random() * colors.length)];
    ball.dataset.color = randColor.key;
    ball.style.backgroundColor = randColor.hex;
    ball.style.color = '#FFFFFF';
    ball.innerText = '🎈';
    
    // Random position in play area
    ball.style.left = `${20 + Math.random() * 60}%`;
    ball.style.top = '30%';
    
    playArea.appendChild(ball);
    selectedBall = ball;
    
    // Speak ball prompt
    speakThai(`ลูกโป่งนี้สีอะไรเอ่ย จิ้มใส่กล่องสีให้ถูกนะจ๊ะ`);
  }
  
  spawnBall();
}

// ------------------------------------------
// 6. Narration Timing & Web Audio Synthesizer
// ------------------------------------------

function playSynthSound(soundKey) {
  if (!audioContext) return;
  
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

// -- SYNTHESIZERS --

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
  osc.frequency.linearRampToValueAtTime(170, audioContext.currentTime + 0.25);
  
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
  const bufferSize = audioContext.sampleRate * 1.5;
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  
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
// 7. Event Binding & Start
// ------------------------------------------

function setupSpeedControls() {
  document.querySelectorAll('.btn-speed').forEach(btn => {
    btn.addEventListener('click', () => {
      initAudioContext();
      
      // Update Active class
      document.querySelectorAll('.btn-speed').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update playbackRate
      const speed = parseFloat(btn.dataset.speed);
      currentPlaybackSpeed = speed;
      narrationAudio.playbackRate = speed;
    });
  });
}

function bindMainEvents() {
  btnPrev.addEventListener('click', prevPage);
  btnNext.addEventListener('click', nextPage);
  
  narrationAudio.addEventListener('ended', handleNarrationEnded);
  
  // Settings Overlay Toggles
  if (btnSettingsToggle) {
    btnSettingsToggle.addEventListener('click', () => {
      initAudioContext();
      settingsOverlay.classList.add('active');
    });
  }
  
  if (btnSettingsClose) {
    btnSettingsClose.addEventListener('click', () => {
      settingsOverlay.classList.remove('active');
    });
  }
  
  if (settingsSoundBtn) {
    settingsSoundBtn.addEventListener('click', toggleSound);
  }

  if (btnReplay) {
    btnReplay.addEventListener('click', () => {
      initAudioContext();
      narrationAudio.currentTime = 0;
      narrationAudio.play().catch(e => console.log('Replay blocked:', e));
    });
  }
  
  setupSpeedControls();
}

window.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  bindMainEvents();
});

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

const SOUND_MAP = {
  "เก่งมากครับ!": "game_success",
  "ลองใหม่นะจ๊ะ": "game_try_again",
  "ลูกโป่งนี้สีอะไรเอ่ย จิ้มใส่กล่องสีให้ถูกนะจ๊ะ": "game_sorter_intro",
  "แมว": "animal_cat",
  "สุนัข": "animal_dog",
  "กระต่าย": "animal_bunny",
  "สิงโต": "animal_lion",
  "วัว": "animal_cow",
  "หมู": "animal_pig",
  "แกะ": "animal_sheep",
  "ช้าง": "animal_elephant",
  "ลิง": "animal_monkey",
  "ไก่": "animal_chicken",
  "กบ": "animal_frog",
  "เป็ด": "animal_duck"
};

function speakLearningWord(soundKey) {
  if (!isSoundEnabled) return;
  const audio = new Audio(`assets/audio/learning/${soundKey}.mp3`);
  audio.play().catch(e => console.log('Speech playback blocked:', e));
}

// Speak text using Microsoft Edge Neural TTS or Web Speech API fallback
function speakThai(text, pitch = 1.3) {
  if (!isSoundEnabled) return;
  
  const mappedSound = SOUND_MAP[text];
  if (mappedSound) {
    speakLearningWord(mappedSound);
    return;
  }
  
  // Fallback to browser Web Speech API
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'th-TH';
  utterance.pitch = pitch;
  utterance.rate = 0.95;
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
const LEARNING_DATA = {
  thai: [
    { key: "ก", val: "กอ ไก่", sound: "thai_0" },
    { key: "ข", val: "ขอ ไข่", sound: "thai_1" },
    { key: "ฃ", val: "ขอ ขวด", sound: "thai_2" },
    { key: "ค", val: "คอ ควาย", sound: "thai_3" },
    { key: "ฅ", val: "คอ คน", sound: "thai_4" },
    { key: "ฆ", val: "คอ ระฆัง", sound: "thai_5" },
    { key: "ง", val: "งอ งู", sound: "thai_6" },
    { key: "จ", val: "จอ จาน", sound: "thai_7" },
    { key: "ฉ", val: "ฉอ ฉิ่ง", sound: "thai_8" },
    { key: "ช", val: "ชอ ช้าง", sound: "thai_9" },
    { key: "ซ", val: "ซอ โซ่", sound: "thai_10" },
    { key: "ฌ", val: "ฌอ เฌอ", sound: "thai_11" },
    { key: "ญ", val: "ญอ หญิง", sound: "thai_12" },
    { key: "ฎ", val: "ดอ ชฎา", sound: "thai_13" },
    { key: "ฏ", val: "ตอ ปฏัก", sound: "thai_14" },
    { key: "ฐ", val: "ถอ ฐาน", sound: "thai_15" },
    { key: "ฑ", val: "ทอ มณโฑ", sound: "thai_16" },
    { key: "ฒ", val: "ทอ ผู้เฒ่า", sound: "thai_17" },
    { key: "ณ", val: "ณอ เณร", sound: "thai_18" },
    { key: "ด", val: "ดอ เด็ก", sound: "thai_19" },
    { key: "ต", val: "ตอ เต่า", sound: "thai_20" },
    { key: "ถ", val: "ถอ ถุง", sound: "thai_21" },
    { key: "ท", val: "ทอ ทหาร", sound: "thai_22" },
    { key: "ธ", val: "ธอ ธง", sound: "thai_23" },
    { key: "น", val: "นอ หนู", sound: "thai_24" },
    { key: "บ", val: "บอ ใบไม้", sound: "thai_25" },
    { key: "ป", val: "ปอ ปลา", sound: "thai_26" },
    { key: "ผ", val: "ผอ ผึ้ง", sound: "thai_27" },
    { key: "ฝ", val: "ฝอ ฝา", sound: "thai_28" },
    { key: "พ", val: "พอ พาน", sound: "thai_29" },
    { key: "ฟ", val: "ฟอ ฟัน", sound: "thai_30" },
    { key: "ภ", val: "พอ สำเภา", sound: "thai_31" },
    { key: "ม", val: "มอ ม้า", sound: "thai_32" },
    { key: "ย", val: "ยอ ยักษ์", sound: "thai_33" },
    { key: "ร", val: "รอ เรือ", sound: "thai_34" },
    { key: "ล", val: "ลอ ลิง", sound: "thai_35" },
    { key: "ว", val: "วอ แหวน", sound: "thai_36" },
    { key: "ศ", val: "สอ ศาลา", sound: "thai_37" },
    { key: "ษ", val: "สอ ฤาษี", sound: "thai_38" },
    { key: "ส", val: "สอ เสือ", sound: "thai_39" },
    { key: "ห", val: "หอ หีบ", sound: "thai_40" },
    { key: "ฬ", val: "ลอ จุฬา", sound: "thai_41" },
    { key: "อ", val: "ออ อ่าง", sound: "thai_42" },
    { key: "ฮ", val: "ฮอ นกฮูก", sound: "thai_43" }
  ],
  english: [
    { key: "A", val: "เอ แอปเปิ้ล", sound: "eng_0" },
    { key: "B", val: "บี บานาน่า", sound: "eng_1" },
    { key: "C", val: "ซี แคท", sound: "eng_2" },
    { key: "D", val: "ดี ด็อก", sound: "eng_3" },
    { key: "E", val: "อี เอลเลเฟ่นท์", sound: "eng_4" },
    { key: "F", val: "เอฟ ฟิช", sound: "eng_5" },
    { key: "G", val: "จี เกรป", sound: "eng_6" },
    { key: "H", val: "เอช ฮอร์ส", sound: "eng_7" },
    { key: "I", val: "ไอ ไอศกรีม", sound: "eng_8" },
    { key: "J", val: "เจ เจลลี่", sound: "eng_9" },
    { key: "K", val: "เค ไคท์", sound: "eng_10" },
    { key: "L", val: "แอล ไลออน", sound: "eng_11" },
    { key: "M", val: "เอ็ม มังกี้", sound: "eng_12" },
    { key: "N", val: "เอ็น เนสท์", sound: "eng_13" },
    { key: "O", val: "โอ ออเรนจ์", sound: "eng_14" },
    { key: "P", val: "พี แพนด้า", sound: "eng_15" },
    { key: "Q", val: "คิว ควีน", sound: "eng_16" },
    { key: "R", val: "อาร์ แรบบิท", sound: "eng_17" },
    { key: "S", val: "เอส ซัน", sound: "eng_18" },
    { key: "T", val: "ที ไทเกอร์", sound: "eng_19" },
    { key: "U", val: "ยู อัมเบรลล่า", sound: "eng_20" },
    { key: "V", val: "วี แวน", sound: "eng_21" },
    { key: "W", val: "ดับเบิ้ลยู วอเตอร์", sound: "eng_22" },
    { key: "X", val: "เอ็กซ์ ไไซโลโฟน", sound: "eng_23" },
    { key: "Y", val: "วาย โยโย่", sound: "eng_24" },
    { key: "Z", val: "ซี แซบรา", sound: "eng_25" }
  ],
  colors: [
    { key: "#FF3366", val: "สีแดง", sound: "color_red" },
    { key: "#FFCC00", val: "สีเหลือง", sound: "color_yellow" },
    { key: "#3399FF", val: "สีน้ำเงิน", sound: "color_blue" },
    { key: "#2ECC71", val: "สีเขียว", sound: "color_green" },
    { key: "#FF7F27", val: "สีส้ม", sound: "color_orange" },
    { key: "#9B5DE5", val: "สีม่วง", sound: "color_purple" },
    { key: "#FF82C5", val: "สีชมพู", sound: "color_pink" },
    { key: "#1E1E1E", val: "สีดำ", sound: "color_black" },
    { key: "#FFFFFF", val: "สีขาว", sound: "color_white" },
    { key: "#8B5A2B", val: "สีน้ำตาล", sound: "color_brown" },
    { key: "#95A5A6", val: "สีเทา", sound: "color_grey" },
    { key: "#00FFFF", val: "สีฟ้า", sound: "color_cyan" }
  ],
  fruits: [
    { key: "🍎", val: "แอปเปิ้ล", sound: "fruit_apple" },
    { key: "🍌", val: "กล้วย", sound: "fruit_banana" },
    { key: "🍊", val: "ส้ม", sound: "fruit_orange" },
    { key: "🍇", val: "องุ่น", sound: "fruit_grape" },
    { key: "🍓", val: "สตรอว์เบอร์รี", sound: "fruit_strawberry" },
    { key: "🍉", val: "แตงโม", sound: "fruit_watermelon" },
    { key: "🥭", val: "มะม่วง", sound: "fruit_mango" },
    { key: "🍍", val: "สับปะรด", sound: "fruit_pineapple" },
    { key: "🥥", val: "มะพร้าว", sound: "fruit_coconut" },
    { key: "🍈", val: "แคนตาลูป", sound: "fruit_cantaloupe" },
    { key: "🥑", val: "อะโวคาโด", sound: "fruit_avocado" },
    { key: "🍒", val: "เชอร์รี", sound: "fruit_cherry" }
  ],
  vehicles: [
    { key: "🚗", val: "รถยนต์", sound: "vehicle_car" },
    { key: "🚓", val: "รถตำรวจ", sound: "vehicle_police" },
    { key: "🚑", val: "รถพยาบาล", sound: "vehicle_ambulance" },
    { key: "🚒", val: "รถดับเพลิง", sound: "vehicle_fire" },
    { key: "🚂", val: "รถไฟ", sound: "vehicle_train" },
    { key: "✈️", val: "เครื่องบิน", sound: "vehicle_plane" },
    { key: "🚲", val: "จักรยาน", sound: "vehicle_bike" },
    { key: "🚜", val: "รถไถ", sound: "vehicle_tractor" },
    { key: "🚢", val: "เรือ", sound: "vehicle_ship" },
    { key: "🏍️", val: "รถจักรยานยนต์", sound: "vehicle_motorcycle" },
    { key: "🚁", val: "เฮลิคอปเตอร์", sound: "vehicle_helicopter" },
    { key: "🚀", val: "จรวด", sound: "vehicle_rocket" }
  ],
  home: [
    { key: "🛏️", val: "เตียงนอน", sound: "home_bed" },
    { key: "🪑", val: "เก้าอี้", sound: "home_chair" },
    { key: "🍽️", val: "จานข้าว", sound: "home_plate" },
    { key: "⏰", val: "นาฬิกา", sound: "home_clock" },
    { key: "☎️", val: "โทรศัพท์", sound: "home_phone" },
    { key: "🔑", val: "กุญแจ", sound: "home_key" },
    { key: "🥛", val: "แก้วน้ำ", sound: "home_glass" },
    { key: "☂️", val: "ร่ม", sound: "home_umbrella" },
    { key: "💡", val: "หลอดไฟ", sound: "home_bulb" },
    { key: "🛋️", val: "โซฟา", sound: "home_sofa" },
    { key: "🪞", val: "กระจก", sound: "home_mirror" },
    { key: "🚪", val: "ประตู", sound: "home_door" }
  ],
  careers: [
    { key: "🩺", val: "คุณหมอ", sound: "career_doctor" },
    { key: "👩‍🏫", val: "คุณครู", sound: "career_teacher" },
    { key: "👮", val: "คุณตำรวจ", sound: "career_police" },
    { key: "👨‍🚒", val: "นักดับเพลิง", sound: "career_firefighter" },
    { key: "🍳", val: "พ่อครัว", sound: "career_chef" },
    { key: "👨‍🌾", val: "ชาวนา", sound: "career_farmer" },
    { key: "👩‍✈️", val: "นักบิน", sound: "career_pilot" },
    { key: "👨‍🚀", val: "นักบินอวกาศ", sound: "career_astronaut" },
    { key: "🎨", val: "ศิลปิน", sound: "career_artist" },
    { key: "🦷", val: "หมอฟัน", sound: "career_dentist" },
    { key: "💂", val: "ทหาร", sound: "career_soldier" },
    { key: "👩‍🔬", val: "นักวิทยาศาสตร์", sound: "career_scientist" }
  ],
  animals: [
    { key: "🐱", val: "แมว", sound: "animal_cat" },
    { key: "🐶", val: "สุนัข", sound: "animal_dog" },
    { key: "🐰", val: "กระต่าย", sound: "animal_bunny" },
    { key: "🦁", val: "สิงโต", sound: "animal_lion" },
    { key: "🐮", val: "วัว", sound: "animal_cow" },
    { key: "🐷", val: "หมู", sound: "animal_pig" },
    { key: "🐑", val: "แกะ", sound: "animal_sheep" },
    { key: "🐘", val: "ช้าง", sound: "animal_elephant" },
    { key: "🐵", val: "ลิง", sound: "animal_monkey" },
    { key: "🐔", val: "ไก่", sound: "animal_chicken" },
    { key: "🐸", val: "กบ", sound: "animal_frog" },
    { key: "🦆", val: "เป็ด", sound: "animal_duck" }
  ],
  shapes: [
    { key: "🔴", val: "วงกลม", sound: "shape_circle" },
    { key: "🔺", val: "สามเหลี่ยม", sound: "shape_triangle" },
    { key: "🟩", val: "สี่เหลี่ยม", sound: "shape_square" },
    { key: "⭐️", val: "ดาว", sound: "shape_star" },
    { key: "🧡", val: "รูปหัวใจ", sound: "shape_heart" },
    { key: "🔷", val: "สี่เหลี่ยมข้าวหลามตัด", sound: "shape_diamond" },
    { key: "🌙", val: "พระจันทร์เสี้ยว", sound: "shape_crescent" },
    { key: "🥚", val: "วงรี", sound: "shape_oval" }
  ],
  foods: [
    { key: "🍔", val: "แฮมเบอร์เกอร์", sound: "food_hamburger" },
    { key: "🍕", val: "พิซซ่า", sound: "food_pizza" },
    { key: "🍦", val: "ไอศกรีม", sound: "food_icecream" },
    { key: "🍩", val: "โดนัท", sound: "food_donut" },
    { key: "🍰", val: "เค้ก", sound: "food_cake" },
    { key: "🍿", val: "ป๊อปคอร์น", sound: "food_popcorn" },
    { key: "🥛", val: "นม", sound: "food_milk" },
    { key: "🥚", val: "ไข่", sound: "food_egg" },
    { key: "🍞", val: "ขนมปัง", sound: "food_bread" },
    { key: "🍫", val: "ช็อกโกแลต", sound: "food_chocolate" },
    { key: "🍪", val: "คุกกี้", sound: "food_cookie" },
    { key: "🍜", val: "บะหมี่", sound: "food_noodle" }
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
      speakLearningWord(item.sound);
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
  } else if (gameKey === 'guess_sound') {
    initGuessSoundGame(gameCanvas);
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

/* 🗣️ Game 3: Guess the Word from Sound */
function initGuessSoundGame(container) {
  let score = 0;
  let targetItem = null;
  let options = [];
  
  const wrapper = document.createElement('div');
  wrapper.className = 'guess-game-container';
  
  // Score indicator
  const scoreBadge = document.createElement('div');
  scoreBadge.className = 'score-badge';
  scoreBadge.innerText = `คะแนน: ${score}`;
  wrapper.appendChild(scoreBadge);
  
  // Speaker section
  const speakerContainer = document.createElement('div');
  speakerContainer.className = 'speaker-container';
  
  const speakerBtn = document.createElement('button');
  speakerBtn.className = 'btn-speaker-large';
  speakerBtn.innerText = '🔊';
  speakerBtn.addEventListener('click', () => {
    if (targetItem) {
      speakLearningWord(targetItem.sound);
    }
  });
  
  const speakerLabel = document.createElement('div');
  speakerLabel.className = 'speaker-label';
  speakerLabel.innerText = 'กดเพื่อฟังเสียงอีกครั้ง 🐰';
  
  speakerContainer.appendChild(speakerBtn);
  speakerContainer.appendChild(speakerLabel);
  wrapper.appendChild(speakerContainer);
  
  // Options Grid
  const optionsGrid = document.createElement('div');
  optionsGrid.className = 'guess-options-grid';
  wrapper.appendChild(optionsGrid);
  
  container.appendChild(wrapper);
  
  // Pick items pool (items that have clear emoji/key and name)
  const poolCategories = ['fruits', 'vehicles', 'home', 'careers', 'animals', 'shapes', 'foods'];
  const pool = [];
  poolCategories.forEach(cat => {
    LEARNING_DATA[cat].forEach(item => {
      pool.push({ ...item, category: cat });
    });
  });
  
  function nextQuestion() {
    optionsGrid.innerHTML = '';
    
    // Pick 1 target item
    targetItem = pool[Math.floor(Math.random() * pool.length)];
    
    // Pick 3 distractors from the same or different categories
    const distractors = [];
    while (distractors.length < 3) {
      const item = pool[Math.floor(Math.random() * pool.length)];
      if (item.sound !== targetItem.sound && !distractors.some(d => d.sound === item.sound)) {
        distractors.push(item);
      }
    }
    
    // Combine and shuffle
    options = [targetItem, ...distractors];
    options.sort(() => Math.random() - 0.5);
    
    // Render option buttons
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'btn-guess-option';
      
      const emoji = document.createElement('span');
      emoji.className = 'guess-emoji';
      
      // Handle color rendering
      if (opt.category === 'colors') {
        emoji.innerHTML = `<div style="background-color: ${opt.key}; width: 45px; height: 45px; border-radius: 50%; border: 3px solid #E2E8F0;"></div>`;
      } else {
        emoji.innerText = opt.key;
      }
      
      const label = document.createElement('span');
      label.innerText = opt.val;
      
      btn.appendChild(emoji);
      btn.appendChild(label);
      
      btn.addEventListener('click', () => {
        // Disable options during animation
        optionsGrid.querySelectorAll('.btn-guess-option').forEach(b => b.style.pointerEvents = 'none');
        
        if (opt.sound === targetItem.sound) {
          // Correct!
          btn.classList.add('correct');
          score++;
          scoreBadge.innerText = `คะแนน: ${score}`;
          playSynthSound('applause');
          speakThai("เก่งมากครับ!");
          
          setTimeout(() => {
            nextQuestion();
          }, 1500);
        } else {
          // Incorrect
          btn.classList.add('incorrect');
          playSynthSound('rabbit_gasp');
          speakThai("ลองใหม่นะจ๊ะ");
          
          setTimeout(() => {
            btn.classList.remove('incorrect');
            optionsGrid.querySelectorAll('.btn-guess-option').forEach(b => b.style.pointerEvents = 'auto');
          }, 1000);
        }
      });
      
      optionsGrid.appendChild(btn);
    });
    
    // Play target sound automatically
    setTimeout(() => {
      speakLearningWord(targetItem.sound);
    }, 300);
  }
  
  // Play introduction
  const introAudio = new Audio('assets/audio/learning/game_guess_intro.mp3');
  introAudio.play().catch(e => console.log('Intro blocked:', e));
  
  setTimeout(() => {
    nextQuestion();
  }, 2200);
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

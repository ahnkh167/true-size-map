// game.js — Listen & Tap minigame (MVP)

const MASCOT = '🐯';

let stages = null;         // all available stages (vowels, consonants)
let stage = null;          // current stage being played
let currentStageId = null; // so "Again" replays the same stage
let queue = [];            // letters to quiz this game
let roundIndex = 0;
let mistakes = 0;
let locked = false;        // block taps during transitions

const $ = sel => document.querySelector(sel);
const screens = {
  start:  () => $('#screen-start'),
  game:   () => $('#screen-game'),
  build:  () => $('#screen-build'),
  reward: () => $('#screen-reward'),
};

function show(name) {
  Object.values(screens).forEach(fn => fn().classList.remove('active'));
  screens[name]().classList.add('active');
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Built-in copy of the stages so the game still runs when the page is
// opened directly from disk (file://), where fetch() is blocked by the browser.
const FALLBACK_STAGES = [
  {
    id: 'vowels-1', title: 'Basic Vowels', titleKo: '기본 모음',
    letters: [
      { id: 'a',   char: 'ㅏ', sound: '아', romaji: 'a',   hint: 'ah — like in f̲a̲ther' },
      { id: 'ya',  char: 'ㅑ', sound: '야', romaji: 'ya',  hint: 'ya — like in y̲a̲rd' },
      { id: 'eo',  char: 'ㅓ', sound: '어', romaji: 'eo',  hint: 'uh — like in d̲u̲ck' },
      { id: 'yeo', char: 'ㅕ', sound: '여', romaji: 'yeo', hint: 'yuh — like in y̲ou̲ng' },
      { id: 'o',   char: 'ㅗ', sound: '오', romaji: 'o',   hint: 'oh — like in g̲o̲' },
      { id: 'yo',  char: 'ㅛ', sound: '요', romaji: 'yo',  hint: 'yo — like in y̲o̲ga' },
      { id: 'u',   char: 'ㅜ', sound: '우', romaji: 'u',   hint: 'oo — like in m̲oo̲n' },
      { id: 'yu',  char: 'ㅠ', sound: '유', romaji: 'yu',  hint: 'yu — like in y̲ou̲' },
      { id: 'eu',  char: 'ㅡ', sound: '으', romaji: 'eu',  hint: 'eu — like in g̲oo̲d' },
      { id: 'i',   char: 'ㅣ', sound: '이', romaji: 'i',   hint: 'ee — like in s̲ee̲' }
    ]
  },
  {
    id: 'vowels-2', title: 'Complex Vowels', titleKo: '복합 모음',
    letters: [
      { id: 'ae',  char: 'ㅐ', sound: '애', romaji: 'ae',  hint: 'ae — like in c̲a̲t' },
      { id: 'yae', char: 'ㅒ', sound: '얘', romaji: 'yae', hint: 'yae — like in y̲a̲m' },
      { id: 'e',   char: 'ㅔ', sound: '에', romaji: 'e',   hint: 'e — like in b̲e̲d' },
      { id: 'ye',  char: 'ㅖ', sound: '예', romaji: 'ye',  hint: 'ye — like in y̲e̲s' },
      { id: 'wa',  char: 'ㅘ', sound: '와', romaji: 'wa',  hint: 'wa — like in w̲a̲nt' },
      { id: 'wae', char: 'ㅙ', sound: '왜', romaji: 'wae', hint: 'wae — like in w̲e̲t' },
      { id: 'oe',  char: 'ㅚ', sound: '외', romaji: 'oe',  hint: 'we — like in w̲e̲igh' },
      { id: 'wo',  char: 'ㅝ', sound: '워', romaji: 'wo',  hint: 'wo — like in w̲a̲r' },
      { id: 'we',  char: 'ㅞ', sound: '웨', romaji: 'we',  hint: 'we — like in w̲e̲t' },
      { id: 'wi',  char: 'ㅟ', sound: '위', romaji: 'wi',  hint: 'wi — like in w̲e̲' },
      { id: 'ui',  char: 'ㅢ', sound: '의', romaji: 'ui',  hint: 'ui — like in g̲oo̲ey' }
    ]
  },
  {
    id: 'consonants-1', title: 'Basic Consonants', titleKo: '기본 자음',
    letters: [
      { id: 'g',  char: 'ㄱ', sound: '가', romaji: 'ga', hint: 'g — like in g̲o̲' },
      { id: 'n',  char: 'ㄴ', sound: '나', romaji: 'na', hint: 'n — like in n̲o̲' },
      { id: 'd',  char: 'ㄷ', sound: '다', romaji: 'da', hint: 'd — like in d̲o̲g' },
      { id: 'r',  char: 'ㄹ', sound: '라', romaji: 'ra', hint: 'r / l — like in l̲i̲on' },
      { id: 'm',  char: 'ㅁ', sound: '마', romaji: 'ma', hint: 'm — like in m̲o̲m' },
      { id: 'b',  char: 'ㅂ', sound: '바', romaji: 'ba', hint: 'b — like in b̲a̲ll' },
      { id: 's',  char: 'ㅅ', sound: '사', romaji: 'sa', hint: 's — like in s̲u̲n' },
      { id: 'ng', char: 'ㅇ', sound: '아', romaji: 'a',  hint: "silent — 'ng' at the end" },
      { id: 'j',  char: 'ㅈ', sound: '자', romaji: 'ja', hint: 'j — like in j̲u̲mp' },
      { id: 'ch', char: 'ㅊ', sound: '차', romaji: 'cha', hint: 'ch — like in ch̲air' },
      { id: 'k',  char: 'ㅋ', sound: '카', romaji: 'ka', hint: 'k — like in k̲i̲te' },
      { id: 't',  char: 'ㅌ', sound: '타', romaji: 'ta', hint: 't — like in t̲o̲y' },
      { id: 'p',  char: 'ㅍ', sound: '파', romaji: 'pa', hint: 'p — like in p̲i̲g' },
      { id: 'h',  char: 'ㅎ', sound: '하', romaji: 'ha', hint: 'h — like in h̲a̲t' }
    ]
  },
  {
    id: 'consonants-2', title: 'Double Consonants', titleKo: '쌍자음',
    letters: [
      { id: 'gg', char: 'ㄲ', sound: '까', romaji: 'kka', hint: 'kk — strong g̲/k' },
      { id: 'dd', char: 'ㄸ', sound: '따', romaji: 'tta', hint: 'tt — strong d̲/t' },
      { id: 'bb', char: 'ㅃ', sound: '빠', romaji: 'ppa', hint: 'pp — strong b̲/p' },
      { id: 'ss', char: 'ㅆ', sound: '싸', romaji: 'ssa', hint: 'ss — strong s̲' },
      { id: 'jj', char: 'ㅉ', sound: '짜', romaji: 'jja', hint: 'jj — strong j̲' }
    ]
  },
  {
    id: 'combine-1', title: 'Build a Letter', titleKo: '글자 만들기', type: 'combine',
    vowelPool: [
      { char: 'ㅏ', id: 'a' }, { char: 'ㅓ', id: 'eo' }, { char: 'ㅗ', id: 'o' },
      { char: 'ㅜ', id: 'u' }, { char: 'ㅣ', id: 'i' }
    ],
    items: [
      { cons: 'ㄱ', vowel: 'ㅏ', vowelId: 'a', syllable: '가', sound: '가' },
      { cons: 'ㄱ', vowel: 'ㅗ', vowelId: 'o', syllable: '고', sound: '고' },
      { cons: 'ㄱ', vowel: 'ㅜ', vowelId: 'u', syllable: '구', sound: '구' },
      { cons: 'ㄴ', vowel: 'ㅏ', vowelId: 'a', syllable: '나', sound: '나' },
      { cons: 'ㄴ', vowel: 'ㅗ', vowelId: 'o', syllable: '노', sound: '노' },
      { cons: 'ㄴ', vowel: 'ㅜ', vowelId: 'u', syllable: '누', sound: '누' },
      { cons: 'ㄷ', vowel: 'ㅏ', vowelId: 'a', syllable: '다', sound: '다' },
      { cons: 'ㄷ', vowel: 'ㅗ', vowelId: 'o', syllable: '도', sound: '도' },
      { cons: 'ㄷ', vowel: 'ㅣ', vowelId: 'i', syllable: '디', sound: '디' },
      { cons: 'ㅁ', vowel: 'ㅏ', vowelId: 'a', syllable: '마', sound: '마' },
      { cons: 'ㅁ', vowel: 'ㅗ', vowelId: 'o', syllable: '모', sound: '모' },
      { cons: 'ㅁ', vowel: 'ㅣ', vowelId: 'i', syllable: '미', sound: '미' },
      { cons: 'ㅂ', vowel: 'ㅏ', vowelId: 'a', syllable: '바', sound: '바' },
      { cons: 'ㅂ', vowel: 'ㅗ', vowelId: 'o', syllable: '보', sound: '보' },
      { cons: 'ㅂ', vowel: 'ㅜ', vowelId: 'u', syllable: '부', sound: '부' }
    ]
  }
];

function boot() {
  // Set the data SYNCHRONOUSLY so the game is playable the instant the page
  // loads — no waiting on fetch, no async race, works even from file://.
  stages = FALLBACK_STAGES;

  // Upgrade to the JSON file in the background if it's reachable (lets us grow
  // the letter list by editing data only). Failure is harmless — we already
  // have the built-in stages. Version the URL so a stale cached copy can't
  // overwrite the (current) built-in stages with old letters.
  fetch('data/hangul.json?v=12')
    .then(res => res.json())
    .then(data => { if (data && Array.isArray(data.stages) && data.stages.length) stages = data.stages; })
    .catch(() => {});

  updateStarCount();  // reads localStorage only, no data needed
  $('#btn-vowels').addEventListener('click', () => startGame('vowels-1'));
  $('#btn-vowels2').addEventListener('click', () => startGame('vowels-2'));
  $('#btn-consonants').addEventListener('click', () => startGame('consonants-1'));
  $('#btn-consonants2').addEventListener('click', () => startGame('consonants-2'));
  $('#btn-build').addEventListener('click', () => startGame('combine-1'));
  $('#btn-again').addEventListener('click', () => startGame(currentStageId));
  $('#btn-home').addEventListener('click', () => { updateStarCount(); show('start'); });
  $('#speaker').addEventListener('click', () => playSound(queue[roundIndex].sound));
  $('#build-speaker').addEventListener('click', () => playSound(queue[roundIndex].sound, '#build-speaker'));
}

function updateStarCount() {
  $('#total-stars').textContent = Progress.totalStars();
}

// Play a sound and make the tiger wiggle while it "speaks".
// Returns the AudioPlayer promise, which resolves when the sound finishes.
let wiggleTimer = null;
function playSound(sound, tigerSel) {
  const tiger = $(tigerSel || '#speaker');
  if (tiger) tiger.classList.add('speaking');
  const stopWiggle = () => { if (tiger) tiger.classList.remove('speaking'); };
  const p = AudioPlayer.play(sound);
  p.then(stopWiggle);
  clearTimeout(wiggleTimer);            // safety net if 'ended' never fires
  wiggleTimer = setTimeout(stopWiggle, 5000);
  return p;
}

function startGame(stageId) {
  stage = stages.find(s => s.id === stageId) || stages[0];
  currentStageId = stage.id;
  roundIndex = 0;
  mistakes = 0;
  if (stage.type === 'combine') {
    queue = shuffle(stage.items);   // one round per syllable
    show('build');
    renderBuild();
  } else {
    queue = shuffle(stage.letters); // quiz every letter once, random order
    show('game');
    renderRound();
  }
}

function renderRound() {
  locked = false;
  const target = queue[roundIndex];

  $('#progress-dots').innerHTML = queue
    .map((_, i) => `<span class="dot ${i < roundIndex ? 'done' : ''} ${i === roundIndex ? 'now' : ''}"></span>`)
    .join('');

  // build 4 options: the target + 3 distractors
  const distractors = shuffle(stage.letters.filter(l => l.id !== target.id)).slice(0, 3);
  const options = shuffle([target, ...distractors]);

  const board = $('#options');
  board.innerHTML = '';
  options.forEach(opt => {
    const card = document.createElement('button');
    card.className = 'letter-card';
    card.textContent = opt.char;
    card.addEventListener('click', () => onPick(opt, target, card));
    board.appendChild(card);
  });

  $('#hint').textContent = target.hint;

  // auto-play the sound so the child hears the target
  setTimeout(() => playSound(target.sound), 350);
}

function onPick(opt, target, card) {
  if (locked) return;

  if (opt.id === target.id) {
    locked = true;
    card.classList.add('correct');
    burst(card);
    setTimeout(nextRound, 900);
  } else {
    mistakes++;
    card.classList.add('wrong');
    card.addEventListener('animationend', () => card.classList.remove('wrong'), { once: true });
    playSound(target.sound); // replay so they can try again
  }
}

// ---- Build a Letter (consonant + vowel = syllable) ----
function renderBuild() {
  locked = false;
  const target = queue[roundIndex];

  $('#build-dots').innerHTML = queue
    .map((_, i) => `<span class="dot ${i < roundIndex ? 'done' : ''} ${i === roundIndex ? 'now' : ''}"></span>`)
    .join('');

  $('#build-cons').textContent = target.cons;
  const vslot = $('#build-vowel'); vslot.textContent = '?'; vslot.classList.remove('filled');
  const rslot = $('#build-result'); rslot.textContent = '?'; rslot.classList.remove('filled', 'pop');
  $('#build-hint').textContent = 'Pick the vowel! 어떤 모음일까요?';

  // vowel options: the correct one + 2 distractors from the pool
  const pool = stage.vowelPool;
  const correct = pool.find(v => v.id === target.vowelId);
  const distractors = shuffle(pool.filter(v => v.id !== target.vowelId)).slice(0, 2);
  const options = shuffle([correct, ...distractors]);

  const board = $('#build-options');
  board.innerHTML = '';
  options.forEach(opt => {
    const card = document.createElement('button');
    card.className = 'letter-card';
    card.textContent = opt.char;
    card.addEventListener('click', () => onPickVowel(opt, target, card));
    board.appendChild(card);
  });

  setTimeout(() => playSound(target.sound, '#build-speaker'), 350);
}

function onPickVowel(opt, target, card) {
  if (locked) return;

  if (opt.id === target.vowelId) {
    locked = true;
    card.classList.add('correct');
    const vslot = $('#build-vowel');
    vslot.textContent = target.vowel; vslot.classList.add('filled');
    // Show the finished syllable big, say it, and only move on once that
    // sound has fully played — so it never overlaps the next question.
    setTimeout(() => {
      const rslot = $('#build-result');
      rslot.textContent = target.syllable; rslot.classList.add('filled', 'pop');
      burst(rslot);
      playSound(target.sound, '#build-speaker').then(() => setTimeout(nextRound, 500));
    }, 320);
  } else {
    mistakes++;
    card.classList.add('wrong');
    card.addEventListener('animationend', () => card.classList.remove('wrong'), { once: true });
    playSound(target.sound, '#build-speaker');
  }
}

function nextRound() {
  roundIndex++;
  if (roundIndex >= queue.length) return finish();
  if (stage.type === 'combine') renderBuild(); else renderRound();
}

function finish() {
  const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
  Progress.setStars(stage.id, stars);

  $('#reward-stars').innerHTML =
    [1, 2, 3].map(n => `<span class="big-star ${n <= stars ? 'lit' : ''}">★</span>`).join('');
  $('#reward-msg').textContent =
    stars === 3 ? 'Perfect! 완벽해요!' : stars === 2 ? 'Great job! 잘했어요!' : 'Good try! 좋아요!';
  show('reward');
}

// little celebration particles
function burst(el) {
  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  for (let i = 0; i < 12; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.textContent = ['⭐', '✨', '🎉'][i % 3];
    p.style.left = cx + 'px';
    p.style.top = cy + 'px';
    const angle = (Math.PI * 2 * i) / 12;
    p.style.setProperty('--dx', Math.cos(angle) * 120 + 'px');
    p.style.setProperty('--dy', Math.sin(angle) * 120 + 'px');
    document.body.appendChild(p);
    p.addEventListener('animationend', () => p.remove(), { once: true });
  }
}

// Run boot as soon as the DOM is ready (scripts are at end of <body>, so this
// is normally immediate — the guard just protects against any load-order quirk).
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

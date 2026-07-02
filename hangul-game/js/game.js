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
    id: 'consonants-1', title: 'Basic Consonants', titleKo: '기본 자음',
    letters: [
      { id: 'g',  char: 'ㄱ', sound: '기역', romaji: 'giyeok', hint: 'g — like in g̲o̲' },
      { id: 'n',  char: 'ㄴ', sound: '니은', romaji: 'nieun',  hint: 'n — like in n̲o̲' },
      { id: 'd',  char: 'ㄷ', sound: '디귿', romaji: 'digeut', hint: 'd — like in d̲o̲g' },
      { id: 'r',  char: 'ㄹ', sound: '리을', romaji: 'rieul',  hint: 'r / l — like in l̲i̲on' },
      { id: 'm',  char: 'ㅁ', sound: '미음', romaji: 'mieum',  hint: 'm — like in m̲o̲m' },
      { id: 'b',  char: 'ㅂ', sound: '비읍', romaji: 'bieup',  hint: 'b — like in b̲a̲ll' },
      { id: 's',  char: 'ㅅ', sound: '시옷', romaji: 'siot',   hint: 's — like in s̲u̲n' },
      { id: 'ng', char: 'ㅇ', sound: '이응', romaji: 'ieung',  hint: "silent — 'ng' at the end" },
      { id: 'j',  char: 'ㅈ', sound: '지읒', romaji: 'jieut',  hint: 'j — like in j̲u̲mp' },
      { id: 'ch', char: 'ㅊ', sound: '치읓', romaji: 'chieut', hint: 'ch — like in ch̲air' },
      { id: 'k',  char: 'ㅋ', sound: '키읔', romaji: 'kieuk',  hint: 'k — like in k̲i̲te' },
      { id: 't',  char: 'ㅌ', sound: '티읕', romaji: 'tieut',  hint: 't — like in t̲o̲y' },
      { id: 'p',  char: 'ㅍ', sound: '피읖', romaji: 'pieup',  hint: 'p — like in p̲i̲g' },
      { id: 'h',  char: 'ㅎ', sound: '히읗', romaji: 'hieut',  hint: 'h — like in h̲a̲t' }
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
  fetch('data/hangul.json?v=8')
    .then(res => res.json())
    .then(data => { if (data && Array.isArray(data.stages) && data.stages.length) stages = data.stages; })
    .catch(() => {});

  updateStarCount();  // reads localStorage only, no data needed
  $('#btn-vowels').addEventListener('click', () => startGame('vowels-1'));
  $('#btn-consonants').addEventListener('click', () => startGame('consonants-1'));
  $('#btn-again').addEventListener('click', () => startGame(currentStageId));
  $('#btn-home').addEventListener('click', () => { updateStarCount(); show('start'); });
  $('#speaker').addEventListener('click', () => playSound(queue[roundIndex].sound));
}

function updateStarCount() {
  $('#total-stars').textContent = Progress.totalStars();
}

// Play a sound and make the tiger wiggle while it "speaks".
let wiggleTimer = null;
function playSound(sound) {
  AudioPlayer.play(sound);
  const tiger = $('#speaker');
  if (!tiger) return;
  tiger.classList.add('speaking');
  clearTimeout(wiggleTimer);
  wiggleTimer = setTimeout(() => tiger.classList.remove('speaking'), 2700);
}

function startGame(stageId) {
  stage = stages.find(s => s.id === stageId) || stages[0];
  currentStageId = stage.id;
  queue = shuffle(stage.letters);   // quiz every letter in the stage, once, in random order
  roundIndex = 0;
  mistakes = 0;
  show('game');
  renderRound();
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

function nextRound() {
  roundIndex++;
  if (roundIndex >= queue.length) return finish();
  renderRound();
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

// game.js — Listen & Tap minigame (MVP)

const MASCOT = '🐯';
const ROUNDS = 5;

let stage = null;          // current stage data
let queue = [];            // letters to quiz this round-set
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

async function boot() {
  const res = await fetch('data/hangul.json');
  const data = await res.json();
  stage = data.stages[0];

  updateStarCount();
  $('#btn-play').addEventListener('click', startGame);
  $('#btn-again').addEventListener('click', startGame);
  $('#btn-home').addEventListener('click', () => { updateStarCount(); show('start'); });
  $('#speaker').addEventListener('click', () => AudioPlayer.play(queue[roundIndex].sound));
}

function updateStarCount() {
  $('#total-stars').textContent = Progress.totalStars();
}

function startGame() {
  queue = shuffle(stage.letters).slice(0, ROUNDS);
  // if fewer than ROUNDS letters, repeat to fill
  while (queue.length < ROUNDS) queue.push(shuffle(stage.letters)[0]);
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
  setTimeout(() => AudioPlayer.play(target.sound), 350);
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
    AudioPlayer.play(target.sound); // replay so they can try again
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

boot();

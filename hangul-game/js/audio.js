// audio.js — plays letter pronunciation.
// Strategy: if an AI-generated file exists at audio/<sound>.mp3, use it.
// Otherwise fall back to the browser's Korean text-to-speech so the game
// is playable immediately. Drop real audio files in later with no code change.

const AudioPlayer = (() => {
  const cache = new Map();      // sound -> HTMLAudioElement (or false if missing)
  let koVoice = null;

  function pickKoreanVoice() {
    const voices = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    koVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('ko')) || null;
  }

  if (window.speechSynthesis) {
    pickKoreanVoice();
    speechSynthesis.onvoiceschanged = pickKoreanVoice;
  }

  function speakTTS(sound) {
    if (!window.speechSynthesis) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(sound);
    u.lang = 'ko-KR';
    if (koVoice) u.voice = koVoice;
    u.rate = 0.75;   // slow and clear for kids
    u.pitch = 1.1;
    speechSynthesis.speak(u);
  }

  function tryFile(sound) {
    return new Promise(resolve => {
      if (cache.has(sound)) return resolve(cache.get(sound));
      const audio = new Audio(`audio/${encodeURIComponent(sound)}.wav`);
      audio.addEventListener('canplaythrough', () => { cache.set(sound, audio); resolve(audio); }, { once: true });
      audio.addEventListener('error', () => { cache.set(sound, false); resolve(false); }, { once: true });
      audio.load();
    });
  }

  let currentFile = null;   // the audio element playing right now
  let playToken = 0;        // guards against overlapping async play() calls

  function stop() {
    if (currentFile) { try { currentFile.pause(); } catch (e) {} currentFile = null; }
    if (window.speechSynthesis) speechSynthesis.cancel();
  }

  // Play a sound, stopping anything already playing first.
  // Returns a promise that resolves when THIS sound finishes (so callers can
  // sequence the next sound and avoid overlap).
  async function play(sound) {
    const myToken = ++playToken;
    stop();
    const file = await tryFile(sound);
    if (myToken !== playToken) return;   // a newer play() has taken over

    if (!file) { speakTTS(sound); return; }

    currentFile = file;
    file.currentTime = 0;
    await new Promise(resolve => {
      const done = () => { file.removeEventListener('ended', done); resolve(); };
      file.addEventListener('ended', done, { once: true });
      file.play().catch(() => { done(); speakTTS(sound); });
    });
    if (currentFile === file) currentFile = null;
  }

  return { play, stop };
})();

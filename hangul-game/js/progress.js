// progress.js — saves stars & completed stages in localStorage.

const Progress = (() => {
  const KEY = 'hangul-adventure-progress';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch { return {}; }
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function getStars(stageId) {
    return load()[stageId]?.stars || 0;
  }

  // Keep the best score only.
  function setStars(stageId, stars) {
    const data = load();
    const prev = data[stageId]?.stars || 0;
    data[stageId] = { stars: Math.max(prev, stars) };
    save(data);
  }

  function totalStars() {
    return Object.values(load()).reduce((sum, s) => sum + (s.stars || 0), 0);
  }

  return { getStars, setStars, totalStars };
})();

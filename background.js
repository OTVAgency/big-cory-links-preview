/* Gentle native playback replaces scroll seeking, so scrolling cannot jerk the lights. */
(() => {
  const video = document.getElementById('studio-video');
  const backdrop = document.querySelector('.studio-backdrop');
  const toggle = document.getElementById('motion-toggle');
  if (!video || !backdrop || !toggle) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 700px)');
  const connection = navigator.connection;
  let enabled = true;
  let playbackRequest = 0;

  function permitted() {
    return enabled && !reducedMotion.matches && !connection?.saveData;
  }

  function playGently() {
    if (!permitted() || document.hidden) return;
    const request = ++playbackRequest;
    // The 60fps web clip plays at half speed: a smooth 30 displayed frames/second.
    video.muted = true;
    video.loop = true;
    video.playbackRate = 0.5;
    video.play().then(() => {
      if (!permitted() || document.hidden) video.pause();
    }).catch(() => {
      if (request !== playbackRequest || !permitted() || document.hidden) return;
      // A browser may block even muted autoplay. Keep the still and offer a retry.
      enabled = false;
      updateToggle();
    });
  }

  function updateToggle() {
    toggle.hidden = reducedMotion.matches || Boolean(connection?.saveData);
    toggle.textContent = enabled ? 'Motion on' : 'Motion off';
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.setAttribute('aria-label', enabled ? 'Pause background motion' : 'Play background motion');
  }

  function configure() {
    playbackRequest += 1;
    video.pause();
    updateToggle();
    if (reducedMotion.matches || connection?.saveData) {
      // Respect accessibility and data preferences before requesting video bytes.
      backdrop.classList.remove('is-ready');
      video.removeAttribute('src');
      video.load();
      return;
    }
    if (!enabled) return; // A manual pause holds the currently displayed frame.
    const source = mobile.matches ? video.dataset.mobile : video.dataset.desktop;
    if (video.getAttribute('src') !== source) {
      backdrop.classList.remove('is-ready');
      video.src = source;
      video.preload = 'auto';
      video.load();
    }
    playGently();
  }

  video.addEventListener('loadeddata', () => {
    if (permitted()) backdrop.classList.add('is-ready');
  });
  video.addEventListener('timeupdate', () => {
    // A small DOM readback makes the delivered playback easy to verify.
    video.dataset.renderedFrame = video.currentTime.toFixed(3);
  });
  video.addEventListener('error', () => {
    backdrop.classList.remove('is-ready');
    toggle.hidden = true;
  });
  toggle.addEventListener('click', () => {
    enabled = !enabled;
    configure();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    else playGently();
  });
  reducedMotion.addEventListener('change', configure);
  mobile.addEventListener('change', configure);
  connection?.addEventListener('change', configure);
  configure();
})();

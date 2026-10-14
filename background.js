/* Gentle native playback replaces scroll seeking, so scrolling cannot jerk the lights. */
(() => {
  const video = document.getElementById('studio-video');
  const backdrop = document.querySelector('.studio-backdrop');
  const toggle = document.getElementById('motion-toggle');
  const speedControl = document.getElementById('speed-control');
  const speedInput = document.getElementById('motion-speed');
  const speedValue = document.getElementById('motion-speed-value');
  if (!video || !backdrop || !toggle) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 700px)');
  const connection = navigator.connection;
  let enabled = true;
  let playbackRequest = 0;
  const speedStorageKey = 'big-cory-motion-speed-v1';
  let speed = 0.5;
  // Remember this browser's choice; blocked/private storage must not break playback.
  try {
    const savedSpeed = Number(window.localStorage.getItem(speedStorageKey));
    if (savedSpeed >= 0.25 && savedSpeed <= 4) speed = savedSpeed;
  } catch { /* Keep the gentle default when storage is unavailable. */ }

  function updateSpeed() {
    video.playbackRate = speed;
    if (speedInput) {
      speedInput.value = String(speed);
      speedInput.setAttribute('aria-valuetext', `${speed.toFixed(2)} times normal speed`);
    }
    if (speedValue) speedValue.value = `${speed.toFixed(2)}×`;
    video.dataset.motionSpeed = String(speed);
  }

  function permitted() {
    return enabled && !reducedMotion.matches && !connection?.saveData;
  }

  function playGently() {
    if (!permitted() || document.hidden) return;
    const request = ++playbackRequest;
    // Change native playback speed without seeking or restarting the loop.
    video.muted = true;
    video.loop = true;
    updateSpeed();
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
    if (speedControl) speedControl.hidden = toggle.hidden;
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
  speedInput?.addEventListener('input', () => {
    const value = Number(speedInput.value);
    if (!Number.isFinite(value) || value < 0.25 || value > 4) return;
    speed = value;
    updateSpeed();
    try { window.localStorage.setItem(speedStorageKey, String(speed)); }
    catch { /* The control still works for this visit when storage is blocked. */ }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    else playGently();
  });
  reducedMotion.addEventListener('change', configure);
  mobile.addEventListener('change', configure);
  connection?.addEventListener('change', configure);
  updateSpeed();
  configure();
})();

/* Sharing opens the visitor's own share sheet; it never sends to a chosen recipient. */
(() => {
  const button = document.getElementById('share-card');
  const status = document.getElementById('share-status');
  if (!button || !status) return;
  const cardUrl = 'https://otvagency.github.io/big-cory-links-preview/';
  button.hidden = false;
  button.addEventListener('click', async () => {
    status.hidden = true;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Cory W. Crawford | Big Cory', text: 'Founder, OTV Agency — my links and creative work.', url: cardUrl });
        return;
      } catch (error) {
        if (error.name === 'AbortError') return; // Cancelling a share should stay quiet.
      }
    }
    try {
      await navigator.clipboard.writeText(cardUrl);
      status.textContent = 'Link copied — ready to send.';
    } catch {
      status.textContent = `Copy this link to share: ${cardUrl}`;
    }
    status.hidden = false;
  });
})();

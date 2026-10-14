/* Approved ambient speed is fixed at 2x. No motion settings are shown on the card. */
(() => {
  const video = document.getElementById('studio-video');
  const backdrop = document.querySelector('.studio-backdrop');
  if (!video || !backdrop) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 700px)');
  const connection = navigator.connection;
  let playbackRequest = 0;

  function permitted() {
    return !reducedMotion.matches && !connection?.saveData;
  }

  function playAmbient() {
    if (!permitted() || document.hidden) return;
    const request = ++playbackRequest;
    video.muted = true;
    video.loop = true;
    // Ignore previous per-browser slider choices now that Cory has chosen the final speed.
    video.playbackRate = 2;
    video.dataset.motionSpeed = '2';
    video.play().then(() => {
      if (!permitted() || document.hidden) video.pause();
    }).catch(() => {
      if (request === playbackRequest && permitted() && !document.hidden) {
        backdrop.classList.remove('is-ready'); // Keep the poster if autoplay is blocked.
      }
    });
  }

  function configure() {
    playbackRequest += 1;
    video.pause();
    if (!permitted()) {
      // Honor accessibility and data preferences before requesting any video bytes.
      backdrop.classList.remove('is-ready');
      video.removeAttribute('src');
      video.load();
      return;
    }
    const source = mobile.matches ? video.dataset.mobile : video.dataset.desktop;
    if (video.getAttribute('src') !== source) {
      backdrop.classList.remove('is-ready');
      video.src = source;
      video.preload = 'auto';
      video.load();
    }
    playAmbient();
  }

  video.addEventListener('loadeddata', () => {
    if (permitted()) backdrop.classList.add('is-ready');
  });
  video.addEventListener('timeupdate', () => {
    video.dataset.renderedFrame = video.currentTime.toFixed(3);
  });
  video.addEventListener('error', () => backdrop.classList.remove('is-ready'));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    else playAmbient();
  });
  reducedMotion.addEventListener('change', configure);
  mobile.addEventListener('change', configure);
  connection?.addEventListener('change', configure);
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

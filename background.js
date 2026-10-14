/* Scroll scrubs a paused studio clip; no autoplay, timers, or idle animation. */
(() => {
  const video = document.getElementById('studio-video');
  const backdrop = document.querySelector('.studio-backdrop');
  const toggle = document.getElementById('motion-toggle');
  if (!video || !backdrop || !toggle) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 700px)');
  const connection = navigator.connection;
  let enabled = true;
  let frame = 0;
  let targetTime = 0;

  function permitted() {
    return enabled && !reducedMotion.matches && !connection?.saveData;
  }

  function seekLatest() {
    // One seek at a time. The seeked event catches up to the latest scroll position.
    if (!permitted() || video.seeking || !Number.isFinite(video.duration)) return;
    if (Math.abs(video.currentTime - targetTime) >= 1 / 15) {
      video.currentTime = targetTime;
    }
  }

  function syncScroll() {
    frame = 0;
    if (!permitted() || !Number.isFinite(video.duration)) return;
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    const progress = distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0;
    // Avoid the end-of-file frame. Every frame is a keyframe for responsive seeking.
    targetTime = progress * Math.max(0, video.duration - 1 / 15);
    video.dataset.scrollFrame = targetTime.toFixed(3);
    seekLatest();
  }

  function queueScroll() {
    if (permitted() && !frame) frame = window.requestAnimationFrame(syncScroll);
  }

  function configure() {
    video.pause();
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    toggle.hidden = reducedMotion.matches || Boolean(connection?.saveData);
    toggle.textContent = enabled ? 'Motion on' : 'Motion off';
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.setAttribute('aria-label', enabled ? 'Turn off scroll background motion' : 'Turn on scroll background motion');
    if (reducedMotion.matches || connection?.saveData) {
      // Honor accessibility/data preferences before requesting any video bytes.
      backdrop.classList.remove('is-ready');
      video.removeAttribute('src');
      video.load();
      return;
    }
    if (!enabled) return; // Keep the current frosted frame when manually paused.
    const source = mobile.matches ? video.dataset.mobile : video.dataset.desktop;
    if (video.getAttribute('src') !== source) {
      backdrop.classList.remove('is-ready');
      video.src = source;
      video.preload = 'auto';
      video.load();
    } else {
      queueScroll();
    }
  }

  video.addEventListener('loadeddata', () => {
    if (!permitted()) return;
    backdrop.classList.add('is-ready');
    queueScroll();
  });
  video.addEventListener('loadedmetadata', queueScroll);
  video.addEventListener('seeked', () => {
    video.dataset.renderedFrame = video.currentTime.toFixed(3);
    seekLatest();
  });
  video.addEventListener('error', () => {
    backdrop.classList.remove('is-ready');
    toggle.hidden = true;
  });
  toggle.addEventListener('click', () => {
    enabled = !enabled;
    configure();
  });
  window.addEventListener('scroll', queueScroll, { passive: true });
  window.addEventListener('resize', queueScroll, { passive: true });
  reducedMotion.addEventListener('change', configure);
  mobile.addEventListener('change', configure);
  connection?.addEventListener('change', configure);
  configure();
})();

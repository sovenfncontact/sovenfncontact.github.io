/* Small, progressive enhancements. Content and links work without this file. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const targets = [...document.querySelectorAll('[data-reveal], .page-intro, .principles article, .division, .community-grid, .discord-invite')];
  let revealObserver;
  function revealAll() {
    revealObserver?.disconnect();
    targets.forEach(el => { el.classList.remove('reveal-ready'); el.classList.add('is-visible'); });
  }
  if (!reduced.matches && 'IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); }
      });
    }, { threshold: 0.08 });
    targets.forEach(el => {
      // Never hide already visible content during initialization.
      if (el.getBoundingClientRect().top < innerHeight) el.classList.add('is-visible');
      else { el.classList.add('reveal-ready'); revealObserver.observe(el); }
    });
    document.addEventListener('focusin', event => event.target.closest('.reveal-ready')?.classList.add('is-visible'));
  }

  const video = document.querySelector('.brand-video');
  const art = document.querySelector('[data-brand-motion]');
  const control = document.querySelector('.motion-toggle');
  if (!video || !art || !control) { reduced.addEventListener('change', revealAll); return; }
  const connection = navigator.connection;
  let wantsPlay = !reduced.matches && !connection?.saveData;
  let inView = false;
  let failed = false;
  let playPending = false;
  let userPaused = false;
  control.hidden = false;
  const label = control.querySelector('span');
  function updateControl() {
    const playing = !video.paused && !video.ended;
    control.classList.toggle('is-playing', playing);
    control.setAttribute('aria-label', playing ? 'Pause logo animation' : 'Play logo animation');
    label.textContent = playing ? 'Pause animation' : 'Play animation';
  }
  async function syncPlayback() {
    if (failed) return;
    if (!wantsPlay || !inView || document.hidden) { video.pause(); updateControl(); return; }
    if (playPending || !video.paused) return;
    if (!video.getAttribute('src')) { video.src = video.dataset.src; video.muted = true; }
    playPending = true;
    try {
      await video.play();
      if (!wantsPlay || !inView || document.hidden) video.pause();
    } catch { /* Browser may require a tap. The play button and poster remain available. */ }
    finally { playPending = false; updateControl(); }
  }
  video.addEventListener('playing', () => { art.classList.add('has-video'); updateControl(); });
  video.addEventListener('pause', updateControl);
  video.addEventListener('error', () => { failed = true; art.classList.remove('has-video'); control.hidden = true; });
  control.addEventListener('click', () => {
    wantsPlay = video.paused;
    userPaused = !wantsPlay;
    syncPlayback();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { inView = entries[0].isIntersecting; syncPlayback(); }, { threshold: 0.1 }).observe(art);
  } else { inView = true; syncPlayback(); }
  document.addEventListener('visibilitychange', syncPlayback);
  reduced.addEventListener('change', () => {
    revealAll();
    wantsPlay = !reduced.matches && !connection?.saveData && !userPaused;
    if (reduced.matches) art.classList.remove('has-video');
    syncPlayback();
  });
  connection?.addEventListener('change', () => {
    if (connection.saveData) { wantsPlay = false; syncPlayback(); }
  });

  // A small natural-scroll response, with no scroll trapping or pinned content.
  let frame = 0;
  function updateArt() {
    frame = 0;
    if (reduced.matches) { art.style.removeProperty('--brand-scale'); return; }
    if (!inView) return;
    art.style.setProperty('--brand-scale', String(1 - Math.min(scrollY / Math.max(innerHeight, 1), 1) * 0.035));
  }
  addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(updateArt); }, { passive: true });
  reduced.addEventListener('change', updateArt);
})();

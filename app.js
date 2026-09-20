if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
 const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) { entry.target.classList.add('reveal'); observer.unobserve(entry.target); }
 }), {threshold:.08});
 document.querySelectorAll('.section-top,.archive-heading,.platform-group').forEach(element => {
  if (!element.closest('#contact')) observer.observe(element);
 });
}
(() => {
  const runway = document.querySelector('.video-scroll');
  if (!runway) return;
  const rows = [...runway.querySelectorAll('.scroll-video')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let active = -1;
  let enabled = false;
  let queued = false;
  const step = 420;
  function select(index) {
    if (index === active) return;
    active = index;
    rows.forEach((row, i) => {
      const open = i === index;
      row.classList.toggle('active', open);
      row.querySelector('button').setAttribute('aria-expanded', String(open));
      row.querySelector('.reveal-symbol').textContent = open ? '−' : '+';
      const panel = row.querySelector('.video-image');
      if (!open && panel.contains(document.activeElement)) {
        row.querySelector('button').focus({ preventScroll: true });
      }
      panel.inert = !open;
      panel.setAttribute('aria-hidden', String(!open));
    });
  }
  function update() {
    queued = false;
    if (!enabled) return;
    const progress = Math.max(0, Math.min(rows.length - 1, (parseFloat(getComputedStyle(runway.querySelector('.video-pin')).top) - runway.getBoundingClientRect().top) / step));
    select(Math.round(progress));
  }
  function configure() {
    const pin = runway.querySelector('.video-pin');
    const hint = runway.querySelector('.video-scroll-hint');
    const pinStyle = getComputedStyle(pin);
    const hintStyle = getComputedStyle(hint);
    const chrome = rows.reduce((sum, row) => sum + row.querySelector('h3').getBoundingClientRect().height, 0)
      + hint.getBoundingClientRect().height + parseFloat(hintStyle.marginBottom)
      + parseFloat(pinStyle.paddingTop) + parseFloat(pinStyle.paddingBottom) + 12;
    // Portrait phones use the remaining screen; desktop keeps the wide composition.
    const viewportHeight = Math.min(innerHeight, window.visualViewport?.height || innerHeight);
    const pinTop = parseFloat(pinStyle.top) || 20;
    const availableHeight = viewportHeight - pinTop - parseFloat(pinStyle.paddingBottom) - chrome;
    const portraitPhone = matchMedia('(max-width: 600px) and (orientation: portrait)').matches;
    const height = Math.floor(portraitPhone ? availableHeight : Math.min(runway.clientWidth * 9 / 16, availableHeight));
    enabled = !reduced.matches && height >= 120;
    runway.style.setProperty('--reveal-height', `${Math.max(0, height)}px`);
    runway.style.setProperty('--pin-height', `${chrome + Math.max(0, height)}px`);
    runway.classList.toggle('scroll-enhanced', enabled);
    if (enabled) {
      runway.style.setProperty('--scroll-travel', `${(rows.length - 1) * step}px`);
      update();
    } else {
      active = -1;
      rows.forEach(row => {
        row.classList.remove('active');
        row.querySelector('button').setAttribute('aria-expanded', 'true');
        row.querySelector('.reveal-symbol').textContent = '↗';
        row.querySelector('.video-image').inert = false;
        row.querySelector('.video-image').removeAttribute('aria-hidden');
      });
    }
  }
  rows.forEach((row, i) => {
    row.querySelector('button').addEventListener('click', () => {
      if (!enabled) {
        row.querySelector('a').focus({ preventScroll: true });
        return;
      }
      const top = scrollY + runway.getBoundingClientRect().top - (parseFloat(getComputedStyle(runway.querySelector('.video-pin')).top) || 20) + i * step;
      window.scrollTo({ top, behavior: 'instant' });
      select(i);
    });
  });
  window.addEventListener('scroll', () => {
    if (enabled && !queued) { queued = true; requestAnimationFrame(update); }
  }, { passive: true });
  let configureQueued = false;
  function scheduleConfigure() {
    if (configureQueued) return;
    configureQueued = true;
    requestAnimationFrame(() => {
      configureQueued = false;
      configure();
    });
  }
  window.addEventListener('resize', scheduleConfigure);
  window.visualViewport?.addEventListener('resize', scheduleConfigure);
  reduced.addEventListener('change', configure);
  document.fonts.ready.then(scheduleConfigure);
  configure();
  let measuredWidth = 0;
  if ('ResizeObserver' in window) new ResizeObserver(entries => {
    const width = entries[0].contentRect.width;
    if (width !== measuredWidth) { measuredWidth = width; scheduleConfigure(); }
  }).observe(runway);
})();


// Reveal a photograph only after it has loaded and decoded successfully.
(() => {
 document.querySelectorAll('.media-frame').forEach(frame => {
  const img = frame.querySelector('img');
  if (!img) return;
  let settled = false;
  const fail = () => {
   settled = false;
   frame.classList.remove('image-loading');
   frame.classList.add('image-error');
   frame.removeAttribute('aria-busy');
  };
  const show = async () => {
   if (settled) return;
   try { await img.decode(); } catch { if (!img.naturalWidth) { fail(); return; } }
   if (settled) return;
   settled = true;
   frame.classList.remove('image-loading');
   frame.classList.remove('image-error');
   frame.classList.add('image-loaded');
   frame.removeAttribute('aria-busy');
  };
  if (!img.complete || !img.naturalWidth) {
   frame.classList.add('image-loading');
   frame.setAttribute('aria-busy', 'true');
  }
  img.addEventListener('load', show);
  img.addEventListener('error', fail);
  if (img.complete) { if (img.naturalWidth) show(); else fail(); }
 });
})();

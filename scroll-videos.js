(() => {
  const runway = document.querySelector('.video-scroll');
  if (!runway) return;
  const rows = [...runway.querySelectorAll('.scroll-video')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let active = -1;
  let enabled = false;
  let queued = false;
  const step = 420;
  function showLinkIcon(symbol) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '18');
    svg.setAttribute('height', '18');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.8');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M5 19 19 5M8 5h11v11');
    svg.append(path);
    symbol.replaceChildren(svg);
  }
  function select(index) {
    if (index === active) return;
    active = index;
    rows.forEach((row, i) => {
      const open = i === index;
      row.classList.toggle('active', open);
      row.querySelector('button').setAttribute('aria-expanded', String(open));
      row.querySelector('.reveal-symbol').textContent = open ? '−' : '+';
      row.querySelector('.video-image').inert = !open;
      row.querySelector('.video-image').setAttribute('aria-hidden', String(!open));
    });
  }
  function update() {
    queued = false;
    if (!enabled) return;
    const progress = Math.max(0, Math.min(rows.length - 1, (20 - runway.getBoundingClientRect().top) / step));
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
    const height = Math.floor(Math.min(runway.clientWidth * 9 / 16, innerHeight - 40 - chrome));
    enabled = !reduced.matches && height >= 120;
    runway.style.setProperty('--reveal-height', `${Math.max(0, height)}px`);
    runway.style.setProperty('--pin-height', `${chrome + Math.max(0, height)}px`);
    runway.classList.toggle('scroll-enhanced', enabled);
    active = -1;
    if (enabled) {
      runway.style.setProperty('--scroll-travel', `${(rows.length - 1) * step}px`);
      update();
    } else {
      rows.forEach(row => {
        row.classList.remove('active');
        row.querySelector('button').setAttribute('aria-expanded', 'true');
        showLinkIcon(row.querySelector('.reveal-symbol'));
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
      const top = scrollY + runway.getBoundingClientRect().top - 20 + i * step;
      window.scrollTo({ top, behavior: 'instant' });
      select(i);
    });
  });
  window.addEventListener('scroll', () => {
    if (!queued) { queued = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', configure);
  reduced.addEventListener('change', configure);
  document.fonts.ready.then(configure);
  let measuredWidth = 0;
  new ResizeObserver(entries => {
    const width = entries[0].contentRect.width;
    if (width !== measuredWidth) { measuredWidth = width; configure(); }
  }).observe(runway);
  configure();
})();


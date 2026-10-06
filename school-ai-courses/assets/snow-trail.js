(() => {
  const allowed = matchMedia('(min-width: 901px) and (hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const particles = new Set();
  let last = 0;
  function clear() { particles.forEach(p => p.remove()); particles.clear(); }
  function move(e) {
    if (!allowed.matches || reduced.matches || e.pointerType !== 'mouse') return;
    const now = performance.now();
    if (now - last < 40 || particles.size >= 24) return;
    last = now;
    const p = document.createElement('span');
    p.className = 's14-snow-spark'; p.setAttribute('aria-hidden', 'true');
    p.textContent = particles.size % 3 ? '❄' : '✧';
    p.style.left = e.clientX + 'px'; p.style.top = e.clientY + 'px';
    p.style.setProperty('--drift', ((Math.random() - .5) * 26).toFixed(1) + 'px');
    particles.add(p); document.body.appendChild(p);
    setTimeout(() => { particles.delete(p); p.remove(); }, 720);
  }
  document.addEventListener('pointermove', move, { passive: true });
  [allowed, reduced].forEach(q => q.addEventListener('change', clear));
  document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });
})();

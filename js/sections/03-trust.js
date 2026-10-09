// 03 · Анимированные счётчики: <span data-count="73">73</span>. Без JS / при reduced-motion показывается итоговое число.
(() => {
  const els = [...document.querySelectorAll('[data-count]')];
  if (!els.length || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const run = (el) => {
    const to = Number(el.dataset.count) || 0, dur = 1400, t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(to * e));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver((es) => es.forEach(e => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target); run(e.target);
  }), { threshold: .6 });
  els.forEach(el => io.observe(el));
})();

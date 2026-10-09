// Отзывы: фильтры по теме + scroll-snap слайдер со стрелками и клавиатурой
(function () {
  var root = document.querySelector('[data-rv-slider]');
  if (!root) return;
  var track = root.querySelector('[data-rv-track]');
  var prev = root.querySelector('[data-rv-prev]');
  var next = root.querySelector('[data-rv-next]');
  var count = root.querySelector('[data-rv-count]');
  var cards = Array.prototype.slice.call(track.children);
  var filters = root.querySelectorAll('[data-filter]');

  function visible() { return cards.filter(function (c) { return !c.hidden; }); }
  function step() {
    var c = visible()[0];
    if (!c) return track.clientWidth;
    var gap = parseFloat(getComputedStyle(track).columnGap) || 16;
    return c.getBoundingClientRect().width + gap;
  }
  function go(dir) { track.scrollBy({ left: dir * step(), behavior: 'smooth' }); }

  function update() {
    var vis = visible();
    var max = track.scrollWidth - track.clientWidth;
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= max - 2;
    var first = Math.min(vis.length, Math.round(track.scrollLeft / step()) + 1);
    var perView = Math.max(1, Math.round(track.clientWidth / step()));
    var last = Math.min(vis.length, first + perView - 1);
    count.textContent = vis.length ? (first === last ? first : first + '–' + last) + ' из ' + vis.length : 'Нет отзывов';
  }

  function apply(topic) {
    cards.forEach(function (c) {
      c.hidden = !(topic === 'all' || c.dataset.topics.split(' ').indexOf(topic) !== -1);
    });
    filters.forEach(function (b) {
      var on = b.dataset.filter === topic;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    track.scrollTo({ left: 0, behavior: 'auto' });
    update();
  }

  filters.forEach(function (b) { b.addEventListener('click', function () { apply(b.dataset.filter); }); });
  prev.addEventListener('click', function () { go(-1); });
  next.addEventListener('click', function () { go(1); });
  track.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    else if (e.key === 'Home') { e.preventDefault(); track.scrollTo({ left: 0, behavior: 'smooth' }); }
    else if (e.key === 'End') { e.preventDefault(); track.scrollTo({ left: track.scrollWidth, behavior: 'smooth' }); }
  });
  track.addEventListener('scroll', function () { window.requestAnimationFrame(update); }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

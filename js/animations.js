/* animations.js — reveal on scroll, header já no app.js, hero crossfade */
window.BrechoAnimations = (() => {
  let observer;

  function observe() {
    const els = document.querySelectorAll(".reveal:not(.in), img.img-fade:not(.loaded)");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in", "loaded"));
      return;
    }
    observer ??= new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          if (e.target.tagName === "IMG") e.target.classList.add("loaded");
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    els.forEach((el) => {
      if (el.tagName === "IMG" && el.complete && el.naturalWidth) el.classList.add("loaded");
      else observer.observe(el);
    });
  }

  function hero() {
    const slides = [...document.querySelectorAll(".hero-slide")];
    const dots = [...document.querySelectorAll(".hero-dots button")];
    if (slides.length < 2) return;
    const region = document.querySelector('.hero');
    const pause = region.querySelector('[data-hero-pause]');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let i = 0, timer, paused = reduced.matches, hovered = false, focused = false;
    const go = (n) => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => { s.classList.toggle('active', k === i); s.setAttribute('aria-hidden', String(k !== i)); });
      dots.forEach((d, k) => { d.classList.toggle('active', k === i); d.setAttribute('aria-pressed', String(k === i)); });
      region.querySelector('[data-hero-count]').textContent = `0${i + 1} / 0${slides.length}`;
    };
    const auto = () => {
      clearInterval(timer);
      pause.textContent = paused ? '▶ Reproduzir' : 'Ⅱ Pausar';
      pause.setAttribute('aria-label', paused ? 'Reproduzir carrossel' : 'Pausar carrossel');
      if (!paused && !hovered && !focused && !document.hidden) timer = setInterval(() => go(i + 1), 6000);
    };
    dots.forEach((d, k) => d.addEventListener("click", () => { go(k); auto(); }));
    region.querySelector('[data-hero-prev]').addEventListener('click', () => { go(i - 1); auto(); });
    region.querySelector('[data-hero-next]').addEventListener('click', () => { go(i + 1); auto(); });
    pause.addEventListener('click', () => { paused = !paused; auto(); });
    region.addEventListener('mouseenter', () => { hovered = true; auto(); });
    region.addEventListener('mouseleave', () => { hovered = false; auto(); });
    region.addEventListener('focusin', () => { focused = true; auto(); });
    region.addEventListener('focusout', event => { if (!region.contains(event.relatedTarget)) { focused = false; auto(); } });
    region.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault(); go(i + (event.key === 'ArrowRight' ? 1 : -1)); auto();
    });
    let start;
    region.addEventListener('touchstart', event => { start = { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY }; }, { passive: true });
    region.addEventListener('touchend', event => {
      if (!start) return;
      const dx = event.changedTouches[0].clientX - start.x;
      const dy = event.changedTouches[0].clientY - start.y;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) { go(i + (dx < 0 ? 1 : -1)); auto(); }
      start = null;
    }, { passive: true });
    document.addEventListener('visibilitychange', auto);
    reduced.addEventListener('change', () => { paused = reduced.matches; auto(); });
    go(0);
    auto();
  }

  document.addEventListener("DOMContentLoaded", () => { observe(); hero(); });
  return { observe };
})();

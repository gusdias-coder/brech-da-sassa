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
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let i = 0, timer;
    const go = (n) => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle("active", k === i));
      dots.forEach((d, k) => d.classList.toggle("active", k === i));
    };
    const auto = () => { clearInterval(timer); timer = setInterval(() => go(i + 1), 5200); };
    dots.forEach((d, k) => d.addEventListener("click", () => { go(k); auto(); }));
    auto();
  }

  document.addEventListener("DOMContentLoaded", () => { observe(); hero(); });
  return { observe };
})();

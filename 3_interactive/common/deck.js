// Deck engine: scales a 1920x1080 stage to the window, steps through slides with the
// keyboard, reveals [data-step] elements, and calls per-slide animation hooks.
//
// Slide markup:   <section class="slide" id="my-slide"> ... </section>
// Reveal:         data-step="n"   element appears at step n (fades in)
//                 data-until="n"  element disappears at step n
//                 data-mark="n"   element gets the .marked highlight from step n
// Animations:     Deck.widget("my-slide", {steps, enter(slide), leave(slide), step(slide, k, dir)})
//                 step 0 is the state on arrival; dir is +1 going forward, -1 going back.
// Controls:       Deck.slider(input, fmt) links a range input to the <output> beside it.
(function () {
  "use strict";

  const widgets = {};
  let slides = [], totals = [], cur = -1, step = 0, deck = null;

  const NEXT = { ArrowRight: 1, ArrowDown: 1, " ": 1, PageDown: 1, Enter: 1 };
  const PREV = { ArrowLeft: 1, ArrowUp: 1, PageUp: 1, Backspace: 1 };

  function fit() {
    const k = Math.min(innerWidth / 1920, innerHeight / 1080);
    const x = (innerWidth - 1920 * k) / 2, y = (innerHeight - 1080 * k) / 2;
    deck.style.transform = `translate(${x}px,${y}px) scale(${k})`;
  }

  function hook(i, name, a, b) {
    const w = widgets[slides[i].id];
    if (w && typeof w[name] === "function") w[name](slides[i], a, b);
  }

  function showStep(i, k, dir) {
    const sl = slides[i];
    sl.classList.toggle("instant", dir < 0);   // no fades when stepping back
    sl.querySelectorAll("[data-step],[data-until]").forEach(el => {
      const from = Number(el.dataset.step || 0);
      const until = el.dataset.until === undefined ? Infinity : Number(el.dataset.until);
      el.classList.toggle("shown", k >= from && k < until);
    });
    sl.querySelectorAll("[data-mark]").forEach(el => {
      el.classList.toggle("marked", k >= Number(el.dataset.mark));
    });
    hook(i, "step", k, dir);
  }

  function go(i, k, dir) {
    if (i < 0 || i >= slides.length) return;
    if (i !== cur) {
      if (cur >= 0) {
        hook(cur, "leave");
        slides[cur].classList.remove("active");
      }
      cur = i;
      slides[cur].classList.add("active");
      hook(cur, "enter");
      history.replaceState(null, "", "#" + (cur + 1));
    }
    step = k;
    showStep(cur, step, dir);
    const f = slides.length > 1 ? cur / (slides.length - 1) : 1;
    const bar = deck.querySelector(".deck-progress");
    if (bar) bar.style.width = 100 * f + "%";
    const num = deck.querySelector(".deck-number");
    if (num) num.textContent = cur + 1 + " / " + slides.length;
  }

  function next() {
    if (step < totals[cur]) go(cur, step + 1, 1);
    else if (cur + 1 < slides.length) go(cur + 1, 0, 1);
  }

  function prev() {
    if (step > 0) go(cur, step - 1, -1);
    else if (cur > 0) go(cur - 1, totals[cur - 1], -1);
  }

  // Interactive controls (sliders, buttons, inputs) keep their keys while focused;
  // Escape hands the keyboard back to the deck.
  function isControl(t) {
    return t && t.closest && t.closest("input, select, textarea, button");
  }

  function onKey(e) {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (isControl(e.target)) {
      if (e.key === "Escape" && e.type === "keydown") e.target.blur();
      return;
    }
    if (e.key === "f" || e.key === "F") {
      if (e.type === "keydown") {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen();
      }
      return;
    }
    if (e.key === "Home" && e.type === "keydown") return go(0, 0, 1);
    if (e.key === "End" && e.type === "keydown") return go(slides.length - 1, totals[slides.length - 1], -1);
    const n = NEXT[e.key], p = PREV[e.key];
    if (!n && !p) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.type !== "keydown") return;
    if (n) next(); else prev();
  }

  function start() {
    deck = document.querySelector(".deck");
    slides = Array.from(deck.querySelectorAll(".slide"));
    if (window.renderMathInElement) {
      renderMathInElement(deck, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false }
        ],
        throwOnError: false
      });
    }
    totals = slides.map(sl => {
      let m = 0;
      sl.querySelectorAll("[data-step],[data-until],[data-mark]").forEach(el => {
        m = Math.max(m, Number(el.dataset.step || 0), Number(el.dataset.until || 0), Number(el.dataset.mark || 0));
      });
      const w = widgets[sl.id];
      return Math.max(m, (w && w.steps) || 0);
    });
    fit();
    addEventListener("resize", fit);
    for (const t of ["keydown", "keyup", "keypress"]) addEventListener(t, onKey, true);
    // After a mouse drag or click on a slider/button, give the keys back to the deck so
    // → still means "next". (Keyboard users who Tab into a control keep it focused.)
    addEventListener("pointerup", e => {
      const c = e.target.closest && e.target.closest("input[type=range], input[type=checkbox], button");
      if (c) setTimeout(() => c.blur(), 0);
    });
    const h = parseInt(location.hash.slice(1), 10);
    go(h >= 1 && h <= slides.length ? h - 1 : 0, 0, 1);
  }

  // Calls draw(now) every animation frame between start() and stop().
  function Runner(draw) {
    let id = 0, on = false;
    function loop(now) {
      if (!on) return;
      draw(now);
      id = requestAnimationFrame(loop);
    }
    return {
      start() { if (!on) { on = true; id = requestAnimationFrame(loop); } },
      stop() { on = false; cancelAnimationFrame(id); }
    };
  }

  // A number that eases from its old value to a new target over `dur` ms.
  class Tween {
    constructor(v) { this.from = this.to = v; this.t0 = 0; this.dur = 1; }
    get(now) {
      let f = Math.max(0, Math.min(1, (now - this.t0) / this.dur));
      f = f < 0.5 ? 2 * f * f : 1 - 2 * (1 - f) * (1 - f);
      return this.from + (this.to - this.from) * f;
    }
    set(target, now, dur, instant) {
      if (instant) { this.from = this.to = target; return; }
      if (this.to === target) return;
      this.from = this.get(now); this.to = target; this.t0 = now; this.dur = dur;
    }
  }

  // Links a range input to the <output> that follows it in the same .row, showing
  // fmt(value). Returns a function that re-reads and re-displays the value; call it
  // after setting input.value from code.
  function slider(input, fmt) {
    const out = input.parentElement.querySelector("output");
    fmt = fmt || (v => String(v));
    const show = () => { if (out) out.textContent = fmt(Number(input.value)); };
    input.addEventListener("input", show);
    show();
    return show;
  }

  window.Deck = {
    widget(id, hooks) { widgets[id] = hooks; },
    start, Runner, Tween, slider,
    go(n) { go(n - 1, 0, 1); }
  };
})();

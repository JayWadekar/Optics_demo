// Two sources A and B emit waves in phase; A sits a path difference Δd ahead of B, as in the
// notes' sketch. Both waves travel right to the observer. Steps: 0 the two waves; 1 their sum
// (what the observer gets); 2 reveals the condition Δd = mλ / (m + ½)λ (HTML).
// Controls: Δd slider (in wavelengths), snap buttons, play/pause.
(function () {
  "use strict";
  const LAM = 160, AMP = 52, XB = 150, XEND = 1180, XOBS = 1060;
  const ROWS = { A: 150, B: 330, S: 540 };
  let canvas, run, ui = null;
  let dd = 2, t = 0, last = 0, playing = true;
  const sum = new Deck.Tween(0);

  const wave = (x, xs) => AMP * Math.sin(2 * Math.PI * ((x - xs) / LAM - 0.6 * t));

  function circled(g, s, x, y) {
    g.strokeStyle = Plot.BLUE; g.lineWidth = 3;
    g.beginPath(); g.arc(x, y, 26, 0, 2 * Math.PI); g.stroke();
    Plot.text(g, s, x, y + 1, { align: "center", color: Plot.BLUE, size: 32 });
  }

  function path(g, f, x0, x1, y0, color, width) {
    g.beginPath();
    for (let x = x0; x <= x1; x += 3) {
      const y = y0 - f(x);
      x === x0 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    g.strokeStyle = color; g.lineWidth = width; g.stroke();
  }

  function draw(now) {
    if (playing && last) t += (now - last) / 1000;
    last = now;
    const g = Plot.ctx(canvas);
    const XA = XB + dd * LAM;

    path(g, x => wave(x, XA), XA + 30, XEND, ROWS.A, Plot.BLUE, 4);
    path(g, x => wave(x, XB), XB + 30, XEND, ROWS.B, Plot.BLUE, 4);
    circled(g, "A", XA, ROWS.A);
    circled(g, "B", XB, ROWS.B);

    // path difference bracket
    g.strokeStyle = "#000"; g.lineWidth = 3;
    const yb = 60;
    g.beginPath(); g.moveTo(XB, yb); g.lineTo(XA, yb);
    g.moveTo(XB, yb - 12); g.lineTo(XB, yb + 12); g.moveTo(XA, yb - 12); g.lineTo(XA, yb + 12); g.stroke();
    Plot.text(g, "Δd = " + dd.toFixed(2) + " λ", (XB + XA) / 2, yb - 30, { align: "center", size: 30 });

    // sum, where both waves are present
    const s = sum.get(now);
    if (s > 0.001) {
      g.globalAlpha = s;
      path(g, x => wave(x, XA) + wave(x, XB), XA + 30, XEND, ROWS.S, "#000", 4);
      Plot.text(g, "A + B", 40, ROWS.S, { size: 32 });
      g.globalAlpha = 1;
    }

    // observer and what arrives there
    g.strokeStyle = Plot.GRAY; g.lineWidth = 2; g.setLineDash([8, 8]);
    g.beginPath(); g.moveTo(XOBS, 100); g.lineTo(XOBS, ROWS.S + 110); g.stroke(); g.setLineDash([]);
    [[ROWS.A, wave(XOBS, XA), 1], [ROWS.B, wave(XOBS, XB), 1], [ROWS.S, wave(XOBS, XA) + wave(XOBS, XB), s]].forEach(([y0, v, a]) => {
      if (a < 0.01) return;
      g.globalAlpha = a; g.fillStyle = Plot.ORANGE;
      g.beginPath(); g.arc(XOBS, y0 - v, 10, 0, 2 * Math.PI); g.fill(); g.globalAlpha = 1;
    });
    Plot.text(g, "observer", XOBS, ROWS.S + 140, { align: "center", color: "#555", size: 28 });

    if (ui) {
      const frac = dd - Math.floor(dd);
      const amp = Math.abs(2 * Math.cos(Math.PI * dd));
      let kind = "partial", color = "#555";
      if (Math.min(frac, 1 - frac) < 0.04) { kind = "constructive"; color = Plot.GREEN; }
      else if (Math.abs(frac - 0.5) < 0.04) { kind = "destructive"; color = Plot.ORANGE; }
      ui.kind.textContent = kind;
      ui.kind.style.color = color;
      ui.amp.textContent = amp.toFixed(2);
      ui.play.textContent = playing ? "Pause" : "Play";
    }
  }

  function bind(slide) {
    if (ui) return;
    const q = s => slide.querySelector(s);
    ui = { dd: q("#wv-dd"), m: q("#wv-m"), half: q("#wv-half"), play: q("#wv-play"), kind: q("#wv-kind"), amp: q("#wv-amp") };
    const show = Deck.slider(ui.dd, v => v.toFixed(2) + " λ");
    const setDD = v => { dd = v; ui.dd.value = v; show(); };
    ui.dd.addEventListener("input", () => { dd = Number(ui.dd.value); });
    ui.m.addEventListener("click", () => setDD(Math.min(3, Math.max(0, Math.round(dd)))));
    ui.half.addEventListener("click", () => setDD(Math.min(2.5, Math.floor(dd) + 0.5)));
    ui.play.addEventListener("click", () => { playing = !playing; });
  }

  Deck.widget("waves", {
    steps: 2,
    enter(slide) {
      canvas = slide.querySelector("#wv-canvas");
      bind(slide);
      last = 0;
      run = run || Deck.Runner(draw);
      run.start();
    },
    leave() { run.stop(); },
    step(slide, k, dir) { sum.set(k >= 1 ? 1 : 0, performance.now(), 600, dir < 0); }
  });
})();

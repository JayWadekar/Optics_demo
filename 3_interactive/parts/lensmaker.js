// Lensmaker's formula explorer: 1/f = (n_lens/n_medium - 1)(1/R1 - 1/R2).
// Sliders set the curvatures 1/R1 and 1/R2 (0 = flat, R = infinity) and the two indices; the
// lens is drawn to scale (10 px per cm) with parallel rays and its focal point. "Show spheres"
// draws the spheres each surface comes from, with their centres C1 and C2.
// Other slides call LensExplorer.load(c1, c2, nLens, nMedium) to open a lens here.
(function () {
  "use strict";
  const S = 10, X0 = 430, YC = 360, XEND = 1180;
  let canvas, run, ui = null;
  let c1 = 0.05, c2 = -0.05, nl = 1.5, nm = 1.0, spheres = false;

  function draw() {
    const g = Plot.ctx(canvas);
    g.strokeStyle = "#ccc"; g.lineWidth = 2; g.setLineDash([10, 10]);
    g.beginPath(); g.moveTo(0, YC); g.lineTo(XEND, YC); g.stroke(); g.setLineDash([]);

    const geo = Optics.geometry(c1, c2, 13);
    if (spheres) {
      g.strokeStyle = "rgba(0,0,0,0.25)"; g.lineWidth = 2;
      [[c1, -geo.t / 2, "C₁"], [c2, geo.t / 2, "C₂"]].forEach(([c, v, name]) => {
        if (!c) return;
        const cx = X0 + (v + 1 / c) * S;
        g.beginPath(); g.arc(cx, YC, Math.abs(1 / c) * S, 0, 2 * Math.PI); g.stroke();
        if (cx > -20 && cx < XEND + 20) {
          g.fillStyle = "#555"; g.beginPath(); g.arc(cx, YC, 6, 0, 2 * Math.PI); g.fill();
          Plot.text(g, name, cx, YC + 34, { align: "center", color: "#555", size: 30 });
        }
      });
    }

    const P = Optics.power(c1, c2, nl, nm);          // 1/cm
    const f = P ? 1 / P : Infinity, fpx = f * S;
    const H = geo.H * S;

    // rays: thin-lens refraction at the lens plane
    g.strokeStyle = Plot.BLUE; g.lineWidth = 3;
    for (const k of [-0.75, -0.35, 0.35, 0.75]) {
      const y = k * H;
      const yEnd = isFinite(fpx) ? y * (1 - (XEND - X0) / fpx) : y;
      g.beginPath(); g.moveTo(0, YC - y); g.lineTo(X0, YC - y); g.lineTo(XEND, YC - yEnd); g.stroke();
      if (isFinite(fpx) && fpx < 0) {
        // diverging: rays seem to come from the virtual focus
        const xs = Math.max(0, X0 + fpx);
        g.setLineDash([6, 8]); g.strokeStyle = "rgba(31,95,191,0.6)";
        g.beginPath(); g.moveTo(X0, YC - y); g.lineTo(xs, YC - y * (1 - (xs - X0) / fpx)); g.stroke();
        g.setLineDash([]); g.strokeStyle = Plot.BLUE;
      }
    }

    Optics.drawLens(g, X0, YC, S, c1, c2, { Hmax: 13 });

    if (isFinite(fpx) && X0 + fpx > 0 && X0 + fpx < XEND) {
      g.fillStyle = Plot.ORANGE;
      g.beginPath(); g.arc(X0 + fpx, YC, 9, 0, 2 * Math.PI); g.fill();
      Plot.text(g, "F", X0 + fpx, YC - 34, { align: "center", color: Plot.ORANGE });
    }

    if (ui) {
      ui.f.textContent = isFinite(f) ? (f > 0 ? "+" : "−") + Math.abs(f).toFixed(1) + " cm" : "∞";
      ui.P.textContent = (P * 100 > 0 ? "+" : "") + (P * 100).toFixed(2) + " D";
      ui.shape.textContent = Optics.shapeName(c1, c2);
      const conv = P > 1e-9, div = P < -1e-9;
      ui.kind.textContent = conv ? "converging (f > 0)" : div ? "diverging (f < 0)" : "no focusing";
      ui.kind.style.color = conv ? Plot.GREEN : div ? Plot.ORANGE : "#555";
      const edge = geo.t + Optics.sag(c2, geo.H) - Optics.sag(c1, geo.H);
      ui.thick.textContent = geo.t > edge + 1e-6 ? "thicker in the middle" : geo.t < edge - 1e-6 ? "thinner in the middle" : "same thickness";
    }
  }

  const fmtN = v => v.toFixed(2);

  function bind(slide) {
    if (ui) return;
    const q = s => slide.querySelector(s);
    ui = {
      r1: q("#lm-r1"), r2: q("#lm-r2"), nl: q("#lm-nl"), nm: q("#lm-nm"), sph: q("#lm-sph"),
      f: q("#lm-f"), P: q("#lm-P"), shape: q("#lm-shape"), kind: q("#lm-kind"), thick: q("#lm-thick")
    };
    // the R sliders store 1000/R (1/R in 1/(10 m)); 0 means a flat surface
    ui.show = [
      Deck.slider(ui.r1, v => Optics.fmtR(v / 1000)),
      Deck.slider(ui.r2, v => Optics.fmtR(v / 1000)),
      Deck.slider(ui.nl, fmtN),
      Deck.slider(ui.nm, fmtN)
    ];
    ui.r1.addEventListener("input", () => { c1 = Number(ui.r1.value) / 1000; });
    ui.r2.addEventListener("input", () => { c2 = Number(ui.r2.value) / 1000; });
    ui.nl.addEventListener("input", () => { nl = Number(ui.nl.value); });
    ui.nm.addEventListener("input", () => { nm = Number(ui.nm.value); });
    ui.sph.addEventListener("change", () => { spheres = ui.sph.checked; });
    slide.querySelectorAll("[data-medium]").forEach(b => b.addEventListener("click", () => {
      set(c1, c2, nl, Number(b.dataset.medium));
    }));
    set(c1, c2, nl, nm);
  }

  function set(a, b, n1, n2) {
    c1 = a; c2 = b; nl = n1; nm = n2;
    if (!ui) return;
    ui.r1.value = Math.round(a * 1000); ui.r2.value = Math.round(b * 1000);
    ui.nl.value = n1; ui.nm.value = n2;
    ui.show.forEach(s => s());
  }

  window.LensExplorer = {
    load(a, b, n1, n2) {
      set(a, b, n1 === undefined ? 1.5 : n1, n2 === undefined ? 1.0 : n2);
      const slides = Array.from(document.querySelectorAll(".deck .slide"));
      Deck.go(slides.indexOf(document.getElementById("lensmaker")) + 1);
    }
  };

  Deck.widget("lensmaker", {
    steps: 1,
    enter(slide) {
      canvas = slide.querySelector("#lm-canvas");
      bind(slide);
      run = run || Deck.Runner(draw);
      run.start();
    },
    leave() { run.stop(); }
  });
})();

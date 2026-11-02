// Near-sighted eye and corrective glasses (paraxial ray tracing, real units).
// The eye is a single lens a distance L in front of the retina, with power chosen so that an
// object at the far point d_far is in focus: P_eye = 1/d_far + 1/L. Parallel light therefore
// focuses in front of the retina. Glasses of power P_g sit g in front of the eye.
// Controls: far point (log slider), glasses power, and "Prescribe" which sets P_g = -1/(d_far - g)
// (= -1/d_far for glasses at the eye, the notes' answer). Steps only reveal text.
(function () {
  "use strict";
  const L = 0.022, G = 0.012;              // eye length, glasses-to-eye distance (m)
  const SX = 20000, SY = 20000;            // px per m (horizontal and vertical)
  const XG = 380, XE = XG + G * SX, XR = XE + L * SX, YC = 330;
  const HEIGHTS = [-0.003, -0.0015, 0.0015, 0.003];
  let canvas, run, ui = null;
  let dfar = 2, Pg = 0;

  function trace() {
    const Pe = 1 / dfar + 1 / L;
    return HEIGHTS.map(y0 => {
      const u1 = -y0 * Pg;                 // after the glasses
      const y1 = y0 + u1 * G;              // at the eye lens
      const u2 = u1 - y1 * Pe;             // after the eye lens
      return { y0, y1, u2, yr: y1 + u2 * L };
    });
  }

  // where parallel light focuses, measured from the eye lens (m); Infinity if it doesn't
  function focus(rays) {
    const r = rays[rays.length - 1];
    return r.u2 < 0 ? -r.y1 / r.u2 : Infinity;
  }

  function draw() {
    const g = Plot.ctx(canvas);
    const rays = trace(), xf = focus(rays), defocus = xf - L;
    const sharp = Math.abs(defocus) < 0.0001;

    // eye
    g.strokeStyle = "#000"; g.lineWidth = 4;
    g.beginPath(); g.ellipse((XE + XR) / 2 - 10, YC, (XR - XE) / 2 + 30, 200, 0, 0, 2 * Math.PI); g.stroke();
    g.strokeStyle = sharp ? Plot.GREEN : Plot.ORANGE; g.lineWidth = 10;
    g.beginPath(); g.ellipse((XE + XR) / 2 - 10, YC, (XR - XE) / 2 + 30, 200, 0, -0.5, 0.5); g.stroke();
    g.fillStyle = "rgba(0,0,0,0.06)"; g.strokeStyle = "#000"; g.lineWidth = 3;
    g.beginPath(); g.ellipse(XE, YC, 22, 95, 0, 0, 2 * Math.PI); g.fill(); g.stroke();
    Plot.text(g, "retina", XR + 40, YC - 200, { color: "#555", size: 30 });
    Plot.text(g, "eye lens", XE, YC + 230, { color: "#555", size: 30, align: "center" });

    // glasses
    if (Math.abs(Pg) > 0.001) {
      const c = Math.sign(Pg) * 0.06;
      Optics.drawLens(g, XG, YC, 9, c, -c, { Hmax: 13, stroke: Plot.ORANGE, fill: "rgba(191,87,0,0.12)" });
      Plot.text(g, "glasses", XG, YC + 170, { color: Plot.ORANGE, size: 30, align: "center" });
    }

    // rays
    g.strokeStyle = Plot.BLUE; g.lineWidth = 3;
    for (const r of rays) {
      const y0 = YC - r.y0 * SY, y1 = YC - r.y1 * SY;
      g.beginPath();
      // to the retina (crossing first if the focus is in front of it)
      g.moveTo(0, y0); g.lineTo(XG, y0); g.lineTo(XE, y1); g.lineTo(XR, YC - r.yr * SY);
      g.stroke();
      if (xf > L && isFinite(xf)) {
        const xe = Math.min(XE + xf * SX, 1180);
        g.setLineDash([6, 8]);
        g.beginPath(); g.moveTo(XR, YC - r.yr * SY);
        g.lineTo(xe, YC - (r.y1 + r.u2 * (xe - XE) / SX) * SY);
        g.stroke(); g.setLineDash([]);
      }
    }
    // focus marker
    if (isFinite(xf) && XE + xf * SX < 1180) {
      g.fillStyle = sharp ? Plot.GREEN : Plot.ORANGE;
      g.beginPath(); g.arc(XE + xf * SX, YC, 8, 0, 2 * Math.PI); g.fill();
    }

    if (ui) {
      ui.need.textContent = (-1 / dfar).toFixed(2);
      let msg;
      if (!isFinite(xf)) msg = "Light never focuses.";
      else if (sharp) msg = "Sharp: parallel light focuses on the retina.";
      else msg = `Blurry: focus is ${Math.abs(defocus * 1000).toFixed(1)} mm ${defocus < 0 ? "in front of" : "behind"} the retina.`;
      ui.status.textContent = msg;
      ui.status.style.color = sharp ? Plot.GREEN : Plot.ORANGE;
    }
  }

  function bind(slide) {
    if (ui) return;
    const q = s => slide.querySelector(s);
    ui = { d: q("#eye-d"), p: q("#eye-p"), rx: q("#eye-rx"), none: q("#eye-none"), need: q("#eye-need"), status: q("#eye-status") };
    const showD = Deck.slider(ui.d, v => (10 ** v).toFixed(2) + " m");
    const showP = Deck.slider(ui.p, v => (v > 0 ? "+" : "") + v.toFixed(2) + " D");
    ui.d.addEventListener("input", () => { dfar = 10 ** Number(ui.d.value); });
    ui.p.addEventListener("input", () => { Pg = Number(ui.p.value); });
    ui.rx.addEventListener("click", () => {
      Pg = -1 / (dfar - G);
      ui.p.value = Pg; showP();
    });
    ui.none.addEventListener("click", () => { Pg = 0; ui.p.value = 0; showP(); });
    dfar = 10 ** Number(ui.d.value); Pg = Number(ui.p.value);
    showD();
  }

  Deck.widget("eye", {
    steps: 2,
    enter(slide) {
      canvas = slide.querySelector("#eye-canvas");
      bind(slide);
      run = run || Deck.Runner(draw);
      run.start();
    },
    leave() { run.stop(); }
  });
})();

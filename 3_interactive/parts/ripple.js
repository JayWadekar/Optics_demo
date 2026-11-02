// Ripple tank: two in-phase point sources A and B in 2D. Each emits cos(k r − ωt)/√r.
// "Waves" shows the instantaneous field; "Intensity" the time average
// |e^{ikr_A}/√r_A + e^{ikr_B}/√r_B|^2, whose bright and dark bands are the constructive and
// destructive directions. Drag the observer to read r_A, r_B and Δd = |r_A − r_B| in λ.
// The field is computed on a grid 1/4 of the canvas resolution and scaled up smoothly.
(function () {
  "use strict";
  const W = 1180, H = 860, DS = 4, GW = W / DS, GH = H / DS, SX = 110, SY = H / 2;
  let canvas, run, ui = null, off, octx, img;
  let lam = 70, sep = 210, mode = "waves", t = 0, last = 0, playing = true;
  let probe = { x: 860, y: 260 }, dragging = false;

  const src = () => [{ x: SX, y: SY - sep / 2, name: "A" }, { x: SX, y: SY + sep / 2, name: "B" }];

  function field() {
    const [A, B] = src(), k = 2 * Math.PI / lam, w = 2 * Math.PI * 0.8 * t;
    const d = img.data, NORM = Math.sqrt(250);
    for (let j = 0; j < GH; j++) {
      const y = (j + 0.5) * DS;
      for (let i = 0; i < GW; i++) {
        const x = (i + 0.5) * DS;
        const ra = Math.max(Math.hypot(x - A.x, y - A.y), 12), rb = Math.max(Math.hypot(x - B.x, y - B.y), 12);
        let r, gch, b;
        if (mode === "waves") {
          const v = NORM * (Math.cos(k * ra - w) / Math.sqrt(ra) + Math.cos(k * rb - w) / Math.sqrt(rb));
          const a = Math.max(-1, Math.min(1, v / 1.6));
          // blue for crests, orange for troughs, white for zero
          if (a > 0) { r = 255 - 224 * a; gch = 255 - 160 * a; b = 255 - 64 * a; }
          else { r = 255 + 64 * a; gch = 255 + 168 * a; b = 255 + 255 * a; }
        } else {
          const I = NORM * NORM * (1 / ra + 1 / rb + 2 * Math.cos(k * (ra - rb)) / Math.sqrt(ra * rb));
          const a = Math.min(1, I / 4.5);
          r = 255 - 225 * a; gch = 255 - 205 * a; b = 255 - 150 * a;
        }
        const p = 4 * (j * GW + i);
        d[p] = r; d[p + 1] = gch; d[p + 2] = b; d[p + 3] = 255;
      }
    }
    octx.putImageData(img, 0, 0);
  }

  function draw(now) {
    if (playing && last) t += (now - last) / 1000;
    last = now;
    const g = Plot.ctx(canvas);
    field();
    g.imageSmoothingEnabled = true;
    g.drawImage(off, 0, 0, W, H);

    const [A, B] = src();
    const ra = Math.hypot(probe.x - A.x, probe.y - A.y), rb = Math.hypot(probe.x - B.x, probe.y - B.y);
    g.setLineDash([10, 8]); g.strokeStyle = "#000"; g.lineWidth = 2;
    for (const s of [A, B]) { g.beginPath(); g.moveTo(s.x, s.y); g.lineTo(probe.x, probe.y); g.stroke(); }
    g.setLineDash([]);
    for (const s of [A, B]) {
      g.fillStyle = "#fff"; g.strokeStyle = Plot.BLUE; g.lineWidth = 3;
      g.beginPath(); g.arc(s.x, s.y, 24, 0, 2 * Math.PI); g.fill(); g.stroke();
      Plot.text(g, s.name, s.x, s.y + 1, { align: "center", color: Plot.BLUE, size: 30 });
    }
    // observer
    g.fillStyle = "#000"; g.strokeStyle = "#fff"; g.lineWidth = 4;
    g.beginPath(); g.arc(probe.x, probe.y, 14, 0, 2 * Math.PI); g.stroke(); g.fill();

    if (ui) {
      const dd = Math.abs(ra - rb) / lam, frac = dd - Math.floor(dd);
      ui.ra.textContent = (ra / lam).toFixed(2) + " λ";
      ui.rb.textContent = (rb / lam).toFixed(2) + " λ";
      ui.dd.textContent = dd.toFixed(2) + " λ";
      let kind = "partial", color = "#555";
      if (Math.min(frac, 1 - frac) < 0.08) { kind = "constructive (bright)"; color = Plot.GREEN; }
      else if (Math.abs(frac - 0.5) < 0.08) { kind = "destructive (dark)"; color = Plot.ORANGE; }
      ui.kind.textContent = kind; ui.kind.style.color = color;
      ui.play.textContent = playing ? "Pause" : "Play";
      ui.waves.classList.toggle("on", mode === "waves");
      ui.intensity.classList.toggle("on", mode === "intensity");
    }
  }

  // pointer position in canvas (deck) pixels, whatever the window scale
  function toCanvas(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * canvas.offsetWidth / r.width, y: (e.clientY - r.top) * canvas.offsetHeight / r.height };
  }

  function bind(slide) {
    if (ui) return;
    const q = s => slide.querySelector(s);
    ui = {
      lam: q("#rp-lam"), sep: q("#rp-sep"), play: q("#rp-play"), waves: q("#rp-waves"), intensity: q("#rp-int"),
      ra: q("#rp-ra"), rb: q("#rp-rb"), dd: q("#rp-dd"), kind: q("#rp-kind")
    };
    const showSep = Deck.slider(ui.sep, v => (v / lam).toFixed(2) + " λ");
    Deck.slider(ui.lam, v => v + " px");
    ui.lam.addEventListener("input", () => { lam = Number(ui.lam.value); showSep(); });
    ui.sep.addEventListener("input", () => { sep = Number(ui.sep.value); });
    ui.play.addEventListener("click", () => { playing = !playing; });
    ui.waves.addEventListener("click", () => { mode = "waves"; });
    ui.intensity.addEventListener("click", () => { mode = "intensity"; });
    canvas.style.cursor = "crosshair";
    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", e => { dragging = true; canvas.setPointerCapture(e.pointerId); probe = toCanvas(e); });
    canvas.addEventListener("pointermove", e => { if (dragging) probe = toCanvas(e); });
    canvas.addEventListener("pointerup", () => { dragging = false; });
  }

  Deck.widget("ripple", {
    enter(slide) {
      canvas = slide.querySelector("#rp-canvas");
      if (!off) {
        off = document.createElement("canvas"); off.width = GW; off.height = GH;
        octx = off.getContext("2d"); img = octx.createImageData(GW, GH);
      }
      bind(slide);
      last = 0;
      run = run || Deck.Runner(draw);
      run.start();
    },
    leave() { run.stop(); }
  });
})();

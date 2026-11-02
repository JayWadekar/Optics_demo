// Lens helpers shared by the optics slides. Lenses are described by the curvatures of their
// two surfaces, c = 1/R in 1/cm (c = 0 is a flat surface, R = infinity), with the sign
// convention of the notes: the centre of the sphere to the right of the surface means R > 0.
(function () {
  "use strict";

  // Displacement of a spherical surface from its vertex at height y (cm).
  function sag(c, y) {
    if (!c) return 0;
    return (1 - Math.sqrt(Math.max(0, 1 - c * c * y * y))) / c;
  }

  // Half-aperture H (cm) and centre thickness t (cm) that give a drawable lens: the aperture
  // fits inside both spheres and the edge is never thinner than `edge`.
  function geometry(c1, c2, Hmax) {
    const cmax = Math.max(Math.abs(c1), Math.abs(c2), 1e-9);
    const H = Math.min(Hmax, 0.92 / cmax);
    const edge = 0.06 * H, tmin = 0.12 * H;
    let t = tmin;
    for (let i = 0; i <= 40; i++) {
      const y = H * i / 40;
      t = Math.max(t, edge + sag(c1, y) - sag(c2, y));
    }
    return { H, t };
  }

  // Draws the lens centred at (x0, yc) px with s px per cm. Returns {H, t} in cm.
  function drawLens(g, x0, yc, s, c1, c2, opt) {
    opt = opt || {};
    const { H, t } = geometry(c1, c2, opt.Hmax || 13);
    const v1 = -t / 2, v2 = t / 2, N = 60;
    g.beginPath();
    for (let i = 0; i <= N; i++) {
      const y = H - 2 * H * i / N;
      const x = v1 + sag(c1, y);
      i ? g.lineTo(x0 + x * s, yc - y * s) : g.moveTo(x0 + x * s, yc - y * s);
    }
    for (let i = 0; i <= N; i++) {
      const y = -H + 2 * H * i / N;
      g.lineTo(x0 + (v2 + sag(c2, y)) * s, yc - y * s);
    }
    g.closePath();
    g.fillStyle = opt.fill || "rgba(31,95,191,0.13)";
    g.fill();
    g.strokeStyle = opt.stroke || "#000";
    g.lineWidth = opt.width || 3;
    g.stroke();
    return { H, t, v1, v2 };
  }

  // Lensmaker's formula: optical power in 1/cm.
  const power = (c1, c2, nl, nm) => (nl / nm - 1) * (c1 - c2);

  function shapeName(c1, c2) {
    const e = 1e-9, s1 = Math.abs(c1) < e ? 0 : Math.sign(c1), s2 = Math.abs(c2) < e ? 0 : Math.sign(c2);
    if (s1 === 0 && s2 === 0) return "Flat plate";
    if (s1 > 0 && s2 < 0) return "Double convex";
    if (s1 < 0 && s2 > 0) return "Double concave";
    if ((s1 === 0 && s2 < 0) || (s1 > 0 && s2 === 0)) return "Plano convex";
    if ((s1 === 0 && s2 > 0) || (s1 < 0 && s2 === 0)) return "Plano concave";
    return "Meniscus";
  }

  // R = 1/c as text, e.g. "+20.0 cm" or "∞".
  function fmtR(c) {
    if (Math.abs(c) < 1e-9) return "∞";
    const R = 1 / c;
    return (R > 0 ? "+" : "−") + Math.abs(R).toFixed(1) + " cm";
  }

  window.Optics = { sag, geometry, drawLens, power, shapeName, fmtR };
})();

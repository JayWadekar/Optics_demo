// Small canvas helpers shared by the animated slides. All drawing is in deck pixels
// (the 1920x1080 stage), whatever the window size.
(function () {
  "use strict";

  // Sizes the canvas backing store to its on-screen size in device pixels (sharp at any
  // zoom), clears it, and returns a context that draws in the canvas's CSS pixels.
  function ctx(c) {
    const r = c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    const k = w / c.offsetWidth, g = c.getContext("2d");
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, w, h);
    g.setTransform(k, 0, 0, k, 0, 0);
    g.lineJoin = g.lineCap = "round";
    return g;
  }

  // Maps data coordinates to pixels inside the box (left, top, width, height).
  function axes(left, top, width, height, xr, yr) {
    return {
      left, top, width, height, xr, yr,
      X: x => left + (x - xr[0]) / (xr[1] - xr[0]) * width,
      Y: y => top + (1 - (y - yr[0]) / (yr[1] - yr[0])) * height
    };
  }

  // Strokes y = f(x) for x in [x0, x1].
  function curve(g, ax, f, x0, x1, style) {
    const n = Math.max(2, Math.ceil(Math.abs(ax.X(x1) - ax.X(x0)) / 2));
    g.beginPath();
    for (let i = 0; i <= n; i++) {
      const x = x0 + (x1 - x0) * i / n;
      const px = ax.X(x), py = ax.Y(f(x));
      i ? g.lineTo(px, py) : g.moveTo(px, py);
    }
    g.strokeStyle = style.color || "#000";
    g.lineWidth = style.width || 3;
    g.globalAlpha = style.alpha === undefined ? 1 : style.alpha;
    g.setLineDash(style.dash || []);
    g.stroke();
    g.setLineDash([]);
    g.globalAlpha = 1;
  }

  // Fills between y = f(x) and y = base for x in [x0, x1].
  function fill(g, ax, f, x0, x1, base, color, alpha) {
    const n = Math.max(2, Math.ceil(Math.abs(ax.X(x1) - ax.X(x0)) / 2));
    g.beginPath();
    g.moveTo(ax.X(x0), ax.Y(base));
    for (let i = 0; i <= n; i++) {
      const x = x0 + (x1 - x0) * i / n;
      g.lineTo(ax.X(x), ax.Y(f(x)));
    }
    g.lineTo(ax.X(x1), ax.Y(base));
    g.closePath();
    g.fillStyle = color;
    g.globalAlpha = alpha === undefined ? 1 : alpha;
    g.fill();
    g.globalAlpha = 1;
  }

  function text(g, s, x, y, opt) {
    opt = opt || {};
    g.font = (opt.italic ? "italic " : "") + (opt.size || 36) + "px Arial, Helvetica, sans-serif";
    g.fillStyle = opt.color || "#000";
    g.globalAlpha = opt.alpha === undefined ? 1 : opt.alpha;
    g.textAlign = opt.align || "left";
    g.textBaseline = opt.baseline || "middle";
    g.fillText(s, x, y);
    g.globalAlpha = 1;
  }

  window.Plot = {
    ctx, axes, curve, fill, text,
    BLUE: "#1f5fbf", ORANGE: "#bf5700", GREEN: "#2a8a3a", GRAY: "#9a9a9a"
  };
})();

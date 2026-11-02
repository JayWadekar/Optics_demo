// Title slide: parallel light focused by a double-convex lens, the light flowing along the rays.
(function () {
  "use strict";
  let canvas, run;

  function draw(now) {
    const g = Plot.ctx(canvas), t = now / 1000;
    const x0 = 960, yc = 180, F = 420;
    Plot.curve(g, Plot.axes(0, 0, 1920, 360, [0, 1920], [-180, 180]), () => 0, 0, 1920, { color: "#ddd", width: 2, dash: [10, 10] });
    g.setLineDash([26, 18]);
    g.lineDashOffset = -t * 70;
    g.strokeStyle = Plot.ORANGE;
    g.lineWidth = 4;
    // each ray crosses the axis at the focal point x0 + F, then keeps going
    for (const y of [-110, -55, 55, 110]) {
      const xe = 1920;
      g.beginPath();
      g.moveTo(0, yc + y); g.lineTo(x0, yc + y); g.lineTo(xe, yc + y * (1 - (xe - x0) / F));
      g.stroke();
    }
    g.setLineDash([]);
    Optics.drawLens(g, x0, yc, 9, 0.045, -0.045, { Hmax: 15, fill: "rgba(31,95,191,0.12)" });
    g.fillStyle = Plot.ORANGE;
    g.beginPath(); g.arc(x0 + F, yc, 7, 0, 2 * Math.PI); g.fill();
  }

  Deck.widget("title", {
    enter(slide) {
      canvas = slide.querySelector("#title-rays");
      run = run || Deck.Runner(draw);
      run.start();
    },
    leave() { run.stop(); }
  });
})();

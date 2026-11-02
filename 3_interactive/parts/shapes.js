// The six lens shapes from the notes, drawn from their radii. Each "Explore" button carries the
// lens's curvatures (data-c1, data-c2, in 1/cm) and opens it in the lensmaker explorer; the
// canvas draws the same lenses from those buttons, so the two can't disagree.
(function () {
  "use strict";
  let canvas, buttons = [];

  function draw() {
    if (!canvas || !canvas.offsetWidth) return;   // slide not showing
    const g = Plot.ctx(canvas);
    buttons.forEach((b, i) => {
      const x = 150 + 300 * i;
      Optics.drawLens(g, x, 110, 7, Number(b.dataset.c1), Number(b.dataset.c2), { Hmax: 13 });
    });
  }

  Deck.widget("shapes", {
    steps: 2,
    enter(slide) {
      canvas = slide.querySelector("#sh-canvas");
      if (!buttons.length) {
        buttons = Array.from(slide.querySelectorAll("[data-c1]"));
        buttons.forEach(b => b.addEventListener("click", () =>
          LensExplorer.load(Number(b.dataset.c1), Number(b.dataset.c2), 1.5, 1.0)));
        addEventListener("resize", draw);
      }
      draw();
    }
  });
})();

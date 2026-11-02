// Problem 26.8 as a clicker question: pick A, B or C and get feedback. Step 1 reveals the
// worked solution (in the HTML); "Open in the lens explorer" loads this lens on the explorer slide.
(function () {
  "use strict";
  const FEEDBACK = {
    A: "Not quite: (1/R₁ − 1/R₂) = −1/20 − 1/5 is negative, and n − 1 > 0.",
    B: "Correct! 1/f = 0.52 × (−5/20) < 0, so f < 0: diverging.",
    C: "There is enough: the lensmaker's formula needs only n, R₁ and R₂."
  };
  let bound = false;

  Deck.widget("quiz", {
    steps: 1,
    enter(slide) {
      if (bound) return;
      bound = true;
      const msg = slide.querySelector("#qz-msg");
      const choices = slide.querySelectorAll("[data-choice]");
      choices.forEach(b => b.addEventListener("click", () => {
        const c = b.dataset.choice;
        choices.forEach(o => o.classList.remove("right", "wrong"));
        b.classList.add(c === "B" ? "right" : "wrong");
        msg.textContent = FEEDBACK[c];
        msg.style.color = c === "B" ? Plot.GREEN : Plot.ORANGE;
      }));
      slide.querySelector("#qz-open").addEventListener("click", () =>
        LensExplorer.load(-1 / 20, 1 / 5, 1.52, 1.0));
    }
  });
})();

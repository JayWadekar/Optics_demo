# From handwritten notes to an interactive lecture

One lecture (Lecture 28: lenses and interference) at three stages, all produced with Claude Code.

**Run the interactive deck online: <https://jaywadekar.github.io/Optics_demo/3_interactive/Demo.html>**

## 1. Handwritten notes: [`1_handwritten/Handwritten.pdf`](1_handwritten/Handwritten.pdf)

The original lecture as written on a tablet: 9 pages of handwriting, sketches and one
printed textbook problem.

## 2. Typeset LaTeX: [`2_latex/Latex_converted.tex`](2_latex/Latex_converted.tex) → [`Latex_converted.pdf`](2_latex/Latex_converted.pdf)

The same lecture converted to editable LaTeX, page by page.

- All text and equations are typeset, and the sketches are redrawn as vector diagrams (TikZ).
  These include the eye diagrams, the six lens shapes and the two-source waves.
- Comments in the `.tex` source flag what was changed or needs a decision:
  - `% CORRECTED:` marks a slip in the handwriting that was fixed.
  - `% CHECK:` marks something questionable that was left for the instructor to decide.
- To edit, change the `.tex` and recompile with any LaTeX tool (TeXShop, Overleaf,
  `latexmk Latex_converted.tex`).

## 3. Interactive deck: [`3_interactive/Demo.html`](3_interactive/Demo.html)

Open in a web browser. Use → / space for next, ← for back, F for full screen.
It needs an internet connection, because the equations render from an online library.

| Slide | What you can do |
|---|---|
| Near-sighted eye | Set the far point and the glasses' power. See where the light focuses and prescribe the correction. |
| Lens maker's formula | Change R₁, R₂, n_lens and n_medium. The lens, rays, f and P update live. |
| Six lens shapes | See the sign conventions. **Explore →** opens any shape in the formula slide. |
| Clicker question 26.8 | Answer A/B/C and get instant feedback, then reveal the worked solution. |
| Interference of waves | Slide the path difference Δd and watch the sum go constructive or destructive. |
| Two sources in 2D | A ripple tank. Drag the observer, or switch to the intensity view. |

The deck is plain HTML and JavaScript with no install. The whole `3_interactive` folder is
needed to run it.

# Coding Interview Lab

An offline, animated course for coding interviews in C++17: 20 patterns, each with an animated
trace of a real LeetCode solution, a deep dive, a quiz, drills and flashcards, plus 85 worked
problems. It follows the look and the controls of System Design Lab.

## Open it

Double-click `index.html`. No build step, no server, no internet. All paths are relative and all
file names are lower-case, so the same folder also works as a GitHub Pages site.

## Tabs

- **Learn** (`index.html`): the 20 patterns in the sidebar. A pattern whose file is not written yet
  shows as "soon". Each pattern has two tabs:
  - **Animation**: the trace on an SVG stage, the C++ code with the current line highlighted, the
    variables (chips flash when a value changes), the caption and step title, a GOOD TO KNOW tip on
    the turning points, the step timeline, Back / Next / Replay / Autoplay / speed, the final answer,
    and a "Try your own input" box that reruns the trace on your input. Patterns with two demos have
    switcher chips. Finishing the last step marks the pattern done and opens the quiz.
  - **Deep Dive**: plain summary, how to spot it, when not to use it, the template with notes,
    variants, common mistakes, complexity, a 60-second spoken answer with a timer, follow-up
    questions and the worked problems.
  - A 3-question quiz: options are shuffled each time it opens and on Retry, the best score is
    kept, and wrong answers go to Practice → Missed.
- **Problems** (`problems.html`): the 85 worked pages grouped by pattern, with live search and an
  Easy / Medium / Hard filter. Every row links to the worked page and the pattern lesson. The copies
  live in `problems/`; their "All problems" link comes back here and a "Pattern lesson" link opens
  the lesson.
- **Practice** (`practice.html`): "Which pattern is this?" drills, a timed mock interview (clarify 5,
  approach 10, code 20, test 5, complexity 5 minutes, then a self-check scorecard from the pattern's
  rubric), a review of missed quiz questions and drills, and complexity flashcards in five Leitner
  boxes.

## Keys

| key | does |
|---|---|
| `→` or `Space` | next step |
| `←` | previous step |
| `R` | replay the current step |
| `A` | autoplay on / off |
| `/` | search |
| `Esc` | leave a text field |

Keys never fire while you type in a field. With "reduce motion" set in the operating system, steps
change instantly and nothing flies.

## Deep links

- `index.html#sliding-window`: first demo, step 1
- `index.html#sliding-window/longest-unique`: that demo, step 1
- `index.html#sliding-window/longest-unique/9`: that demo at step 9
- `index.html#sliding-window/deep-dive`: the Deep Dive tab
- `practice.html#drills`, `#mock`, `#missed`, `#flashcards`
- add `?theme=dark` to any page to open it in dark mode (the toggle remembers your choice)

## Files

| path | what |
|---|---|
| `engine.js` | `CIL_ENGINE.mountTrace(container, demo, opts)`: recorder, layout of every view type, tweening, flying tiles, code panel, timeline, input editor |
| `fields.js` | input parser shared by the page and the checkers |
| `patterns/NN-id.js` | one pattern each (data, C++ and its JS port) |
| `data/problems.js` | the 85 problems and the 20 pattern titles (generated) |
| `problems/` | copies of the worked pages and their `assets/` |
| `app.js`, `problems-page.js`, `practice/app.js` | the three tabs |
| `styles.css` | theme (light and dark), chrome and every view type |
| `check.js`, `tools/check-patterns.js` | checkers |

The data contract (pattern record, frames, view types, marks, moves, storage keys) is in
`.work/PLAN.md`. Read it before writing a pattern. `patterns/02-sliding-window.js` is the model
record. Progress lives in `localStorage` under keys that start with `cil-`.

`data/problems.js` and `problems/` are rebuilt from `/Users/rnnavane/CODING/prep/html` with
`node .work/engine/build-problems.js` (it only reads that folder).

## Check it

```
node check.js
```

It runs every pattern file through `tools/check-patterns.js`, lays out every frame of every demo
with the engine, and checks the 85 problems, their copied pages, links and assets. It prints `OK`
when everything passes and exits with code 1 otherwise. It works with any subset of the 20
pattern files present. For one pattern: `node tools/check-patterns.js patterns/02-sliding-window.js`.

`.work/engine/gallery.html` mounts small hand-made traces of every view type, mark, move, layout,
truncation and error case, for checking the engine by eye.

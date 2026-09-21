# AGENTS.md

Working notes for whoever picks this repo up next. Read this before changing
anything — several of the rules below are load-bearing and the gotchas cost
real debugging time to find.

## What this is

**Belajar Menulis — Petualangan Dino**: a handwriting app in Indonesian for
kindergarten and early primary children. Two modes: a lesson that teaches the
62 glyphs (A–Z, a–z, 0–9) stroke by stroke, and a runner-style game where
writing the requested letter correctly is the attack. Live at
<https://havban.github.io/belajar-menulis/>, deployed from `main` by GitHub
Actions.

Static site, **no build step**. Serve the folder and it runs.

## Hard rules

1. **No build step, no dependencies.** Plain ES modules loaded straight from
   `index.html`. No bundler, no framework, no npm package for the app itself.
2. **No binary assets.** Every dinosaur, plant, star and sound is generated in
   code (`js/dino.js`, `js/fx.js`, `js/audio.js`). If you are about to add a
   `.png`, `.glb` or `.mp3`, stop and draw or synthesise it instead. The only
   image file is `icon.svg`, which is text.
3. **Language split.** Everything a child, parent or teacher sees is
   **Indonesian**. Code comments, commit bodies and this file are **English**.
   `README.md` is Indonesian because it addresses the owner and parents.
4. **Nothing may hard-depend on an optional browser feature.** Speech
   synthesis, fullscreen, service workers and `localStorage` are all wrapped so
   a refusal or a missing Indonesian voice leaves the app fully playable.
5. **The pad owns the screen.** The writing area is the biggest element in
   every layout, in both orientations. If a change shrinks it, the change is
   wrong — that is why the game screen splits into two columns in landscape.
6. **Comments explain *why*.** The code says what it does; comment the
   constraint or the bug being avoided.

## Layout

```
index.html            all four screens + the settings sheet
css/style.css         layout, colours, portrait/landscape breakpoints
js/glyphs.js          stroke data for all 62 glyphs, plus the sampler
js/lines.js           every spoken line, and the recording-filename rule
js/trace.js           TracePad: guide, demo, touch capture, scoring  (start here)
js/dino.js            every drawing: rex poses, other dinosaurs, backdrop
js/mascot.js          the small reacting rex, on its own canvas
js/tutor.js           lesson screen controller
js/game.js            game screen controller (phases, enemies, scoring)
js/audio.js           synthesised music, effects and Indonesian speech
js/fx.js              full-screen confetti/star/praise layer
js/progress.js        localStorage: stars per glyph, high score, settings
js/main.js            backdrop, routing, settings, service worker
sw.js                 network-first offline cache
```

## Glyph data (`js/glyphs.js`)

Every glyph lives in a 100×100 box, y down: cap line 12, x-height 38, baseline
80, descender 97. A glyph is a list of strokes; a stroke is a list of segments
(`L` polyline, `A` arc, `C` cubic, `DOT`).

**The arc trap:** angles are degrees with 0 = right, 90 = bottom, 180 = left,
270 = top, and the sampler interpolates *linearly from `a0` to `a1`*. If `a1 <
a0` the arc sweeps the other way round the circle. The top bump of `3` was
written as `A(46,29,19,17,200,70)` and silently drew a mirrored hook through
the bottom left; the fix was `430`, the same end point taken over the top.
**After editing any glyph, look at it** — render the grid (see Testing) rather
than trusting the numbers.

## The practice boxes

The pad can hold 1–4 copies of the same letter on one page (the **Latihan**
control on the lesson screen), because repetition is what actually smooths a
child's handwriting. `layoutCells()` picks the arrangement that makes the boxes
biggest for the pad's shape, with a small bonus for grids that have no empty
slot, and centres the whole block rather than each box in its own slice.

Everything below the layout still draws in glyph units: `_use(cell)` points
`ox`/`oy`/`s` at one box, so every painter stays box-agnostic. Two bits of
state track where the child is: `index` is the stroke within the current box
and `cell` is which box; `finished` means `cell >= repeat`.

**The invariant to respect:** `index` is reset to 0 and `cell` incremented the
moment a box is finished, so `index` is only ever a valid stroke slot. The
painters guard against an empty slot anyway — the assumption is easy to break
from the outside and the old code crashed once per frame when it was.

The game always uses one box; only the lesson exposes the choice, and it is
remembered in `localStorage` through `progress.setPref('repeat', n)`.

## Scoring (`scoreStroke` in `js/trace.js`)

The child's stroke and the model stroke are each resampled to 34 points evenly
spaced along their own length, and the score is the mean distance between
corresponding points (retried against a version of the child's stroke trimmed
at either end, because children overshoot).

This replaced a "did the line pass near every part of the target" metric, which
was far too generous: it accepted a **C** when the letter asked for the slanted
stroke of an **A**. If you touch the thresholds (`tol * 0.62` for the mean,
`tol * 1.15` for the 90th percentile), re-run the acceptance matrix — the app
must keep accepting a wobbly-but-correct letter and keep rejecting a wrong,
reversed, or half-finished one. Stroke *length* is measured on the smoothed
34-point version: raw touch samples jitter enough to fail a good letter for
being "too long".

Wobble decides stars (1–3), never pass or fail. That is deliberate: the habits
being taught are stroke order, start point and direction.

## The teacher's voice

Spoken lines are built as a **list of parts** (`audio.speakParts`), not one
string. Each part is its own utterance, which buys a real breath-pause between
the invitation and the letter, and lets the letter be said slower - that is the
part the child has to catch. Every part also gets a small random wobble in rate
and pitch, and the wording rotates through a handful of variants
(`audio.pickLine` never returns the same one twice running). A fixed sentence
repeated letter after letter is what makes an app grating to sit next to.

Lines live in `js/lines.js`, apart from the code that speaks them, so
`tools/voice-phrases.mjs` can enumerate every phrase the app can utter. That
list is what a **recorded voice pack** needs: drop `voice/<slug>.m4a` files in,
run `tools/voice-manifest.sh`, and `speakParts` plays the recording instead of
synthesising - per phrase, so a half-finished pack is fine and anything missing
still goes through the device voice. The slug is derived from the phrase itself
(`clipName`), which is why the letter name is its own part with no punctuation:
one recording of "huruf be besar" serves every sentence that mentions it.

The child's name (`progress.name()`) is always **its own part**, never spliced
into a sentence: a fixed pack cannot contain every child's name, but a family
that records one file named after their child gets it in the recorded voice for
free. Name-flavoured variants (`*_WHO` tables) are used on roughly half the
lines - every sentence would wear thin fast.

Two traps: the music is ducked under the voice and only un-ducked on `onend`,
so `speakParts` also arms a **watchdog** - on a device with no Indonesian voice
the utterance can neither start nor report an error, and the music would stay
quiet forever. And every call takes a token; stale callbacks from a cancelled
line must not un-duck or continue a sequence that has been replaced.

## Gotchas

* **The demo must never steal the pen.** `TracePad.playDemo()` returns early if
  a stroke is in progress, and `pointerdown` stops a running demo instead of
  ignoring the touch. Both were bugs: the auto-demo fired 900 ms after a letter
  was selected and wiped out whatever the child had already drawn.
* **One pointer at a time.** `_down` ignores a second pointer while one is
  active — children rest their palms on the screen.
* **The shell backdrop is throttled to ~20 fps** in `js/main.js`. The pad and
  the game loop run at full rate; the decoration behind them must not eat a
  cheap tablet's frame budget.
* **Audio needs a gesture.** `audio.unlock()` is called from the first
  `pointerdown` anywhere and from every menu button.
* **Asset URLs carry the commit sha** (`?v=__BUILD__`, substituted by the
  workflow). Pages caches each file separately for ten minutes, so a reload can
  otherwise pair new HTML with a stale module. Keep the placeholder in new
  modules and add the file to the `sed` list in `.github/workflows/pages.yml`
  and to `ASSETS` in `sw.js`.

## Testing

There is no test runner. Drive the app with Playwright from
`/home/havban/projects/node_modules`:

```bash
python3 -m http.server 8791        # from the repo root
node your-script.js                # chromium, goto http://localhost:8791
```

`window.__app` exposes everything worth asserting: `screen`, `progress`,
`audio`, `tutor` (`.pad`, `.select(ch, {demo:false})`) and `game`
(`.pad`, `.state`). To fake a child writing, read `pad.strokes[pad.index].pts`
and map glyph units to page pixels with the active box (`pad.box.ox`,
`pad.box.oy`, `pad.box.s`) plus the canvas bounding rect, then dispatch
mouse/touch events along the path. **Re-read the box before every stroke**: with
repetition on, the coordinate frame moves to the next box as the child works
across the page.

To check letterforms, draw every glyph into a grid canvas and screenshot it —
that is how the `3`, `5`, `8`, `S`, `s`, `f` and `k` shapes were corrected.

## Deploying

**Auto-deploy is paused right now.** The `push` trigger in
`.github/workflows/pages.yml` is commented out while the letter strokes are
being reviewed one by one, so pushing to `main` archives the work without
publishing it. Restore the trigger (or run the workflow from the Actions tab)
once the review is finished — and say so, because a paused deploy is invisible
from the live site.

Normally: push to `main`; the workflow stamps the build, syntax-checks every
module and publishes to Pages. Note from the sibling repos: **Pages must be enabled by
hand once** in Settings → Pages → Source: "GitHub Actions". A workflow with
`enablement: true` cannot do it with `GITHUB_TOKEN`, and the failure shows up
as `actions/configure-pages` erroring out.

Commits here need an explicit identity (`GIT_AUTHOR_NAME`/`GIT_AUTHOR_EMAIL`
and the matching `GIT_COMMITTER_*`) — there is no global git config on this
machine.

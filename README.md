# Snake Nom

A browser game made with [PixiJS](https://pixijs.com).

## Run it

```bash
npm install
npm run dev
```

To play on a phone or tablet on the same Wi-Fi, run `npm run dev:wifi` and open the
"Network" address it prints.

## Tests

```bash
npm test
```

The tests check how the snakes move, steer, eat, grow and fight. They sit next to the code
(`src/*.test.ts`) and run in Node without a browser. Publishing runs them before every build.

## How to play

There are 10 levels. The start screen ("Mompf so viel du kannst!") shows your snake and the
next level; a tap plays it. Won levels can be played again: pick one with `<` and `>`. The
browser remembers which levels are won.

You're the green snake; at the start of a round, a ring and "Du!" point it out. The other
snakes are after the yellow dots too, and after you. After biting you, a snake goes for
something else first: a dot, or another snake. Level 1 has one of them, level 2 two,
level 5 three and level 8 four. From level 3, they get a bit faster each level, there are
more dots, and the rounds last longer.

- A round lasts 30 seconds in level 1; the clock at the top counts down and turns red for the
  last 5 seconds. The start screen shows how long the next level lasts.
- In the top left corner, every snake's head and length are listed, longest first.
- Every dot makes a snake one part longer and a bit bigger. An eaten dot comes back somewhere
  else right away.
- A head that touches another snake's body bites that one part off, whatever the sizes. The
  biter gets one part longer, the bitten snake one part shorter. After a bite, the bitten snake
  blinks for half a second: it can't be bitten again, and it can't bite back.
- A snake with no body left gets eaten when another head touches its head.
- When the time is up, the biggest snake wins. If that's you, the next level opens. If your
  head gets eaten, the round is over.

The snakes never stop. They turn away by themselves before they reach the edge of the screen.

|                                             | Touch / mouse                                                         | Keyboard      |
| ------------------------------------------- | --------------------------------------------------------------------- | ------------- |
| Pick a level, on the start screen           | Tap `<` or `>`                                                        | Left / right  |
| Start, on the start screen                  | Tap                                                                   | Enter / Space |
| Steer                                       | Hold and drag: the snake follows your finger. Tap: it heads that way. | Arrows / WASD |
| Back to the start screen, after a round end | Tap                                                                   | Enter / Space |

## Drawing sprites

Every picture is a 16×16 PNG in `src/sprites/`, named after its entry in `ART` in `src/art.ts`
(`head.png`, `body.png`, `tail.png`, `food.png`). Bigger exports (2×, 10×, …) are shrunk back to 16×16.
If a file is missing, the game draws a coloured placeholder.

The other snakes have their own pictures: `redHead.png`, `redBody.png`, `redTail.png`, and the
same with `blue`, `pink` and `orange`.

Draw a snake's head looking to the right, and the tail with its tip on the left. Both turn
with the snake. The body parts don't turn, so draw them however you like.

To add a new picture, add a line to `ART` (the placeholder colour and shape), then draw
`src/sprites/<name>.png`.

## Publishing (GitHub Pages)

Publishing only happens when you start it: on GitHub, open the **Actions** tab, pick
**Build and publish**, and click **Run workflow**. It checks the game (lint, type-check,
build) and, if you ran it on `main`, publishes it at `https://<user>.github.io/<repo>/`.
Running it on another branch only does the checks. See `.github/workflows/pages.yml`.

One-time setup: on GitHub, open **Settings → Pages** and set **Source** to **GitHub Actions**.

## Versions and the changelog

The version number shows in the bottom-right corner of the game, so you can tell
whether a tablet has loaded the newest build.

1. As you go, write down what changed under `## [Unreleased]` in [CHANGELOG.md](CHANGELOG.md).
2. When it's time for a new version, commit everything, then run
   `npm version minor` (new things) or `npm version patch` (only fixes).
   This moves the notes into a section for the new version, updates `package.json`,
   and makes a "Release vX.Y.Z" commit and a `vX.Y.Z` tag.
3. `git push --follow-tags`

## Make it yours

| To change...                                        | Edit                                    |
| --------------------------------------------------- | --------------------------------------- |
| What happens on the screen                          | `src/arena.ts`                          |
| Snake speed, turning, size, growth, starting length | `src/snake.ts`                          |
| Levels: other snakes, their speed, dots             | `src/levels.ts`                         |
| How the other snakes choose what to go for          | `src/rival.ts`                          |
| How hard it is                                      | [BALANCING.md](BALANCING.md)            |
| Keys                                                | `src/input.ts`                          |
| Pictures                                            | Draw them! See "Drawing sprites" above. |
| Placeholder colours, shapes                         | `src/art.ts`                            |
| How much of the world fits                          | `MIN_VIEW` in `src/main.ts`             |
| Background colour                                   | `background` in `src/main.ts`           |

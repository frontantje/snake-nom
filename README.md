# Snake Nom

A browser game made with [PixiJS](https://pixijs.com).

## Run it

```bash
npm install
npm run dev
```

To play on a phone or tablet on the same Wi-Fi, run `npm run dev:wifi` and open the
"Network" address it prints.

## Controls

|      | Touch / mouse                                      | Keyboard      |
| ---- | -------------------------------------------------- | ------------- |
| Walk | Tap where to go, or hold and drag to lead the hero | Arrows / WASD |

## Drawing sprites

Every picture is a 16×16 PNG in `src/sprites/`, named after its entry in `ART` in `src/art.ts`
(`hero.png`, …). Bigger exports (2×, 10×, …) are shrunk back to 16×16. If a file is missing,
the game draws a coloured placeholder.

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

| To change...                 | Edit                                      |
| ---------------------------- | ----------------------------------------- |
| What happens on the screen   | `src/playground.ts`                       |
| Keys                         | `src/input.ts`                            |
| Pictures                     | Draw them! See "Drawing sprites" above.   |
| Placeholder colours, shapes  | `src/art.ts`                              |
| How much of the world fits   | `MIN_VIEW` in `src/main.ts`               |
| Background colour            | `background` in `src/main.ts`             |

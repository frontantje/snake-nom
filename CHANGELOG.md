# Changelog

Everything that changes in the game gets written down here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and version
numbers follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.2.0] - 2026-11-13

### Changed

- The snake starts smaller, and every dot it eats makes it a bit bigger as well as longer.
- A finger held still leads the snake right through that spot, so it eats a dot under your
  finger instead of circling around it.
- Dots can lie a little closer to the edges.

### Fixed

- The snake could get stuck facing into a corner of the screen.
- The snake no longer keeps circling where a touch was cancelled, e.g. by a system swipe on the
  iPad.
- Turning the tablet keeps the snake in its place on the screen.
- A round no longer starts with a dot already eaten.
- Drawings that aren't square are centred instead of sitting at the bottom.
- The `src/sprites/` folder exists again in a fresh copy of the project, ready for drawings.

## [0.1.0] - 2026-11-12

### Added

- The game runs in the browser, built with PixiJS, Vite and TypeScript.
- Crisp pixel art on every screen: art pixels are scaled by whole numbers only.
- A snake to steer: a head, five round body parts and a tail. Drag and it follows your finger,
  tap and it heads that way, or use the arrow keys / WASD. It turns away from the screen edges.
- Food: yellow dots scattered around the screen. Each dot eaten makes the snake one body part
  longer. Eat them all to win ("Alles aufgefuttert!"), then tap for a new round.
- Drawn sprites: any `src/sprites/<name>.png` replaces the placeholder of that name.
- The version number in the bottom-right corner.
- `npm run dev:wifi` to play on a phone or tablet on the same Wi-Fi.
- Publishing to GitHub Pages, started by hand from the Actions tab.

# Changelog

Everything that changes in the game gets written down here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and version
numbers follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- The game runs in the browser, built with PixiJS, Vite and TypeScript.
- Crisp pixel art on every screen: art pixels are scaled by whole numbers only.
- A snake to steer: a head, five round body parts and a tail. Drag and it follows your finger,
  tap and it heads that way, or use the arrow keys / WASD. It turns away from the screen edges.
- Drawn sprites: any `src/sprites/<name>.png` replaces the placeholder of that name.
- The version number in the bottom-right corner.
- `npm run dev:wifi` to play on a phone or tablet on the same Wi-Fi.
- Publishing to GitHub Pages, started by hand from the Actions tab.

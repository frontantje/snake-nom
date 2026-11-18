# Changelog

Everything that changes in the game gets written down here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and version
numbers follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.4.0] - 2026-11-18

### Added

- A start screen with your snake circling under "Mompf so viel du kannst!". The game starts
  on a tap (or Enter / Space) instead of right away. Taps in its first moment don't count, so
  a tap meant for the round before can't skip it.
- 10 levels. Level 2 brings a second rival, level 5 a third and level 8 a fourth; from level 3
  the rivals get a bit faster and there are more dots every level. All levels are in
  `src/levels.ts`.
- Between levels, the start screen shows which level comes next. Won levels can be played
  again: pick one with `<` and `>` (or the arrow keys). An arrow fades when there's no level
  that way.
- The browser remembers which levels are won, also when the game is open in several tabs.
- Winning the last level says "Alle Level geschafft!".
- An orange rival, so up to four rivals all look different.
- Balancing notes in `BALANCING.md`: every value that makes the game easier or harder, the
  level table, ideas to try, and a play test log.

### Changed

- The rival in level 1 is slower: 0.65 of your speed instead of 0.8.
- After a round, a tap goes back to the start screen instead of straight into a new round.
- After biting a snake, a rival goes for something else first. Only once it has eaten a dot or
  bitten another snake can it go after the first one again.

## [0.3.0] - 2026-11-13

### Added

- A red snake that goes for dots or for other snakes, the player's included. Blue and pink
  ones are ready for later levels.
- Nibbling: a head that touches another snake's body bites that one part off, whatever the
  sizes, and grows by one part. A snake that was just bitten blinks for half a second, and can't
  bite or be bitten during that time. A snake with no body left is eaten when another head touches its head.
- A ring and "Du!" point out your snake for the first seconds of a round.
- The other snakes can be drawn too: `redHead.png`, `blueBody.png`, `pinkTail.png`, and so on.
- Unit tests for how the snakes move, steer, eat, grow and fight (`npm test`). Publishing
  runs them before every build.

### Changed

- A round ends when all dots are gone, and the biggest snake wins. It also ends when your
  head gets eaten.
- A snake's size now follows its length, so it shrinks again when it loses parts.

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

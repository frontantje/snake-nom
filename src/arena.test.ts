import { type FederatedPointerEvent, Point } from "pixi.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Arena } from "./arena";
import { FOOD_RADIUS } from "./art";
import type { Input } from "./input";
import { distance } from "./math";
import { DT, seeded, strip } from "./testing";

const WIDTH = 240;
const HEIGHT = 160;

const noKeys = { direction: null, wasPressed: () => false } as unknown as Input;

const arenas: Arena[] = [];

beforeEach(() => {
  vi.stubGlobal("window", new EventTarget());
  vi.spyOn(Math, "random").mockImplementation(seeded(7));
});

// like the game does when a round ends
afterEach(() => {
  for (const arena of arenas.splice(0)) arena.view.destroy({ children: true });
});

function newArena(rivals = 0) {
  const arena = new Arena(noKeys, () => {}, rivals);
  arena.resize(WIDTH, HEIGHT, 1);
  arenas.push(arena);
  return arena;
}

const playerOf = (arena: Arena) => arena["player"]!;
const rivalOf = (arena: Arena) => arena["rivals"][0].snake;
const dotsOf = (arena: Arena) => arena["food"].children;

// all dots but one gone, and that one where it's wanted
function lastDot(arena: Arena, x: number, y: number) {
  const [last, ...others] = dotsOf(arena);
  for (const dot of others) dot.destroy();
  last.position.set(x, y);
  return last;
}

function touch(
  arena: Arena,
  type: "pointerdown" | "pointerup",
  x: number,
  y: number,
) {
  const event = { pointerId: 1, global: new Point(x, y) };
  arena.view.emit(type, event as unknown as FederatedPointerEvent);
}

// true if done() became true within the time
function runUntil(arena: Arena, seconds: number, done: () => boolean) {
  for (let frame = 0; frame < seconds / DT; frame++) {
    if (done()) return true;
    arena.update(DT);
  }
  return done();
}

describe("Arena", () => {
  it("starts a round with no dot within reach of a head", () => {
    for (let round = 0; round < 50; round++) {
      const arena = newArena(3);
      for (const snake of arena["snakes"]) {
        for (const dot of dotsOf(arena)) {
          expect(distance(dot, snake)).toBeGreaterThan(
            snake.radius + FOOD_RADIUS,
          );
        }
      }
      arena.view.destroy({ children: true });
    }
  });

  it("eats a dot the head touches, and the snake gets longer", () => {
    const arena = newArena();
    const player = playerOf(arena);
    const parts = player.bodyCount;
    const dots = dotsOf(arena).length;
    dotsOf(arena)[0].position.set(player.x + 10, player.y);

    runUntil(arena, 1, () => dotsOf(arena).length < dots);

    expect(dotsOf(arena).length).toBe(dots - 1);
    expect(player.bodyCount).toBe(parts + 1);
  });

  it("brings the snake to a tapped spot, also near the edges", () => {
    const spots = [
      { x: 0, y: 0 },
      { x: WIDTH, y: 0 },
      { x: 0, y: HEIGHT },
      { x: WIDTH, y: HEIGHT },
      { x: WIDTH / 2, y: 0 },
      { x: 0, y: HEIGHT / 2 },
      { x: WIDTH / 2 - 15, y: HEIGHT / 2 },
    ];
    for (const spot of spots) {
      const arena = newArena();
      touch(arena, "pointerdown", spot.x, spot.y);
      touch(arena, "pointerup", spot.x, spot.y);
      expect(runUntil(arena, 5, () => arena["target"] === null)).toBe(true);
    }
  });

  it("eats a dot under a finger held right beside the head", () => {
    const arena = newArena();
    const player = playerOf(arena);
    const dot = lastDot(arena, player.x, player.y + 8);

    touch(arena, "pointerdown", dot.x, dot.y);

    expect(runUntil(arena, 5, () => dot.destroyed)).toBe(true);
  });

  it("treats a cancelled touch like a lifted finger", () => {
    const arena = newArena();
    touch(arena, "pointerdown", 60, 40);

    const cancel = Object.assign(new Event("pointercancel"), { pointerId: 1 });
    window.dispatchEvent(cancel);

    expect(runUntil(arena, 5, () => arena["target"] === null)).toBe(true);
  });

  it("keeps the snake in its place when the screen turns", () => {
    const arena = newArena();
    runUntil(arena, 1, () => false);
    const player = playerOf(arena);
    const before = { x: player.x / WIDTH, y: player.y / HEIGHT };

    arena.resize(HEIGHT, WIDTH, 1);
    arena.update(DT);

    expect(player.x / HEIGHT).toBeCloseTo(before.x, 1);
    expect(player.y / WIDTH).toBeCloseTo(before.y, 1);
  });

  it("lets a head bite one part off another snake, whatever the sizes", () => {
    const arena = newArena(1);
    const player = playerOf(arena);
    const rival = rivalOf(arena);
    lastDot(arena, WIDTH - 20, HEIGHT - 20);
    strip(player);
    player.grow(1);
    rival.grow(10);
    runUntil(arena, 1, () => !player.safe);
    rival.placeAt(130, 140, Math.PI / 2);
    const third = rival.body[2];
    player.placeAt(third.x - 1, third.y, 0);

    arena.update(DT);

    expect(third.destroyed).toBe(true);
    expect(rival.bodyCount).toBe(14);
    expect(player.bodyCount).toBe(2);
    expect(rival.safe).toBe(true);

    const [first] = rival.body;
    player.placeAt(first.x - 1, first.y, 0);
    arena.update(DT);

    expect(rival.bodyCount).toBe(14);
  });

  it("doesn't let a bitten snake bite back while it blinks", () => {
    const arena = newArena(1);
    const player = playerOf(arena);
    const rival = rivalOf(arena);
    lastDot(arena, WIDTH - 20, HEIGHT - 20);
    const biteBack = () => {
      player.placeAt(120, 80, 0);
      const part = player.body[2];
      rival.placeAt(part.x, part.y - 1, Math.PI / 2);
      arena.update(DT);
    };
    rival.biteOff(0);
    const parts = player.bodyCount;

    biteBack();
    expect(player.bodyCount).toBe(parts);

    runUntil(arena, 1, () => !rival.safe);
    biteBack();
    expect(player.bodyCount).toBe(parts - 1);
  });

  it("can't kill a snake that still has a body", () => {
    const arena = newArena(1);
    const player = playerOf(arena);
    const rival = rivalOf(arena);
    lastDot(arena, WIDTH - 20, HEIGHT - 20);
    rival.placeAt(130, 100, Math.PI / 2);
    player.placeAt(rival.x - 1, rival.y, 0);

    arena.update(DT);

    expect(rival.destroyed).toBe(false);
    expect(player.destroyed).toBe(false);
  });

  it("eats a snake whole once it has no body left", () => {
    const arena = newArena(1);
    const player = playerOf(arena);
    const rival = rivalOf(arena);
    lastDot(arena, WIDTH - 20, HEIGHT - 20);
    strip(rival);
    rival.placeAt(30, HEIGHT - 20, Math.PI);
    runUntil(arena, 2, () => !rival.safe);
    const parts = player.bodyCount;

    rival.placeAt(150, 80, Math.PI);
    player.placeAt(140, 80, 0);

    expect(runUntil(arena, 1, () => rival.destroyed)).toBe(true);
    expect(arena["rivals"]).toHaveLength(0);
    expect(player.bodyCount).toBe(parts + 1);
  });

  it("ends the round when the player's head is eaten", () => {
    const arena = newArena(1);
    const player = playerOf(arena);
    const rival = rivalOf(arena);
    lastDot(arena, WIDTH - 20, HEIGHT - 20);
    strip(player);
    rival.placeAt(30, HEIGHT - 20, Math.PI);
    runUntil(arena, 2, () => !player.safe);

    player.placeAt(140, 80, 0);
    rival.placeAt(150, 80, Math.PI);

    expect(runUntil(arena, 1, () => player.destroyed)).toBe(true);
    expect(arena["player"]).toBeNull();
    expect(arena["banner"].text).toContain("gefressen");
  });

  it("ends the round when the dots are gone, won if no rival is longer", () => {
    for (const rivalParts of [0, 20]) {
      const arena = newArena(1);
      const player = playerOf(arena);
      const rival = rivalOf(arena);
      strip(rival);
      rival.grow(rivalParts);
      rival.placeAt(30, HEIGHT - 20, Math.PI);
      const last = lastDot(arena, player.x + 20, player.y);

      arena.update(DT);
      expect(arena["banner"].visible).toBe(false);
      runUntil(arena, 1, () => last.destroyed);

      expect(arena["banner"].visible).toBe(true);
      expect(arena["banner"].text).toContain(
        rivalParts === 0 ? "Gewonnen" : "zu kurz",
      );
    }
  });

  it("has rivals that go and eat dots", () => {
    const arena = newArena(1);
    const rival = rivalOf(arena);
    // far away, so the dot is the better goal
    playerOf(arena).placeAt(WIDTH - 30, HEIGHT - 30, 0);
    const dot = lastDot(arena, rival.x + 20, rival.y + 25);

    expect(runUntil(arena, 2, () => dot.destroyed)).toBe(true);
    expect(rival.bodyCount).toBe(6);
  });

  it("points out the player's snake for the first seconds of a round", () => {
    const arena = newArena(1);
    const marker = arena["marker"].view;

    arena.update(DT);
    expect(marker.visible).toBe(true);
    expect(distance(marker, playerOf(arena))).toBeLessThan(0.01);

    runUntil(arena, 3, () => false);
    expect(marker.visible).toBe(false);
  });
});

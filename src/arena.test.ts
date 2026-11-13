import { type FederatedPointerEvent, Point } from "pixi.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Arena } from "./arena";
import { FOOD_RADIUS } from "./art";
import type { Input } from "./input";
import { distance } from "./math";
import { DT, seeded } from "./testing";

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

function newArena() {
  const arena = new Arena(noKeys, () => {});
  arena.resize(WIDTH, HEIGHT, 1);
  arenas.push(arena);
  return arena;
}

const snakeOf = (arena: Arena) => arena["snake"];
const dotsOf = (arena: Arena) => arena["food"].children;

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
  it("starts a round with no dot within reach of the head", () => {
    for (let round = 0; round < 50; round++) {
      const arena = newArena();
      const snake = snakeOf(arena);
      for (const dot of dotsOf(arena)) {
        expect(distance(dot, snake)).toBeGreaterThan(
          snake.radius + FOOD_RADIUS,
        );
      }
      arena.view.destroy({ children: true });
    }
  });

  it("eats a dot the head touches, and the snake gets longer", () => {
    const arena = newArena();
    const snake = snakeOf(arena);
    const parts = snake.view.children.length;
    const dots = dotsOf(arena).length;
    dotsOf(arena)[0].position.set(snake.x + 10, snake.y);

    runUntil(arena, 1, () => dotsOf(arena).length < dots);

    expect(dotsOf(arena).length).toBe(dots - 1);
    expect(snake.view.children.length).toBe(parts + 1);
  });

  it("shows the win message once the last dot is eaten", () => {
    const arena = newArena();
    const snake = snakeOf(arena);
    const [last, ...others] = dotsOf(arena);
    for (const dot of others) dot.destroy();
    last.position.set(snake.x + 20, snake.y);

    arena.update(DT);
    expect(arena["banner"].visible).toBe(false);

    runUntil(arena, 1, () => last.destroyed);
    expect(arena["banner"].visible).toBe(true);
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
    const snake = snakeOf(arena);
    const [dot, ...others] = dotsOf(arena);
    for (const other of others) other.destroy();
    dot.position.set(snake.x, snake.y + 8);

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
    const snake = snakeOf(arena);
    const before = { x: snake.x / WIDTH, y: snake.y / HEIGHT };

    arena.resize(HEIGHT, WIDTH, 1);
    arena.update(DT);

    expect(snake.x / HEIGHT).toBeCloseTo(before.x, 1);
    expect(snake.y / WIDTH).toBeCloseTo(before.y, 1);
  });
});

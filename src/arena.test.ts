import { type FederatedPointerEvent, Point, type Sprite } from "pixi.js";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from "vitest";
import { Arena } from "./arena";
import { FOOD_RADIUS } from "./art";
import type { Action, Input } from "./input";
import { LAST_LEVEL, LEVELS } from "./levels";
import { distance } from "./math";
import { DT, seeded, strip } from "./testing";

const WIDTH = 240;
const HEIGHT = 160;

// pressed: the keys that count as just pressed in every frame
const keys = {
  direction: null,
  pressed: [] as Action[],
  wasPressed(action: Action) {
    return this.pressed.includes(action);
  },
};

const arenas: Arena[] = [];
let done: Mock<(won: boolean) => void>;

beforeEach(() => {
  vi.stubGlobal("window", new EventTarget());
  vi.spyOn(Math, "random").mockImplementation(seeded(7));
  done = vi.fn();
  keys.pressed = [];
});

// like the game does when a round ends
afterEach(() => {
  for (const arena of arenas.splice(0)) arena.view.destroy({ children: true });
});

// the tests' own settings, so balancing the levels doesn't change them
function newArena(rivals = 0, dots = 10, level = 1, seconds = 60) {
  const settings = { rivals, rivalSpeed: 0.8, dots, seconds };
  const arena = new Arena(keys as unknown as Input, level, done, settings);
  arena.resize(WIDTH, HEIGHT, 1);
  arenas.push(arena);
  return arena;
}

// waits until the round-end message can be tapped away, then taps it
function tapAfterEnd(arena: Arena) {
  runUntil(arena, 1.1, () => false);
  touch(arena, "pointerdown", 10, 10);
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
    const dot = dotsOf(arena)[0];
    dot.position.set(player.x + 10, player.y);

    runUntil(arena, 1, () => dot.destroyed);

    expect(dot.destroyed).toBe(true);
    expect(player.bodyCount).toBe(parts + 1);
  });

  it("puts a new dot somewhere else for every dot eaten", () => {
    const arena = newArena();
    const player = playerOf(arena);
    const eaten = lastDot(arena, player.x + 10, player.y);

    runUntil(arena, 1, () => eaten.destroyed);

    const [fresh] = dotsOf(arena);
    expect(dotsOf(arena)).toHaveLength(1);
    expect(distance(fresh, player)).toBeGreaterThan(
      player.radius + FOOD_RADIUS,
    );
  });

  it("keeps as many dots on the field as the level asks for", () => {
    const arena = newArena(2, 12);

    for (let second = 0; second < 20; second++) {
      runUntil(arena, 1, () => false);
      expect(dotsOf(arena)).toHaveLength(12);
    }
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

  it("sends a rival elsewhere after a bite, and back once it has eaten a dot", () => {
    const arena = newArena(1);
    const player = playerOf(arena);
    const rival = rivalOf(arena);
    const dot = lastDot(arena, 30, 30);
    player.placeAt(120, 80, 0);
    const part = player.body[2];
    rival.placeAt(part.x, part.y - 1, Math.PI / 2);

    arena.update(DT);
    expect(player.bodyCount).toBe(4);

    const goal = () => arena["rivals"][0]["goal"] as Sprite | null;
    const goesForPlayer = () => player.body.includes(goal()!);
    runUntil(arena, 5, () => goesForPlayer() || dot.destroyed);
    expect(dot.destroyed).toBe(true);
    expect(rival.bodyCount).toBe(7);

    // the dot that came back would be a goal too
    for (const other of [...dotsOf(arena)]) other.destroy();
    expect(runUntil(arena, 2, goesForPlayer)).toBe(true);
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
    expect(arena["banner"].text).toContain("Nochmal");

    touch(arena, "pointerdown", 10, 10);
    expect(done).not.toHaveBeenCalled();
    tapAfterEnd(arena);
    expect(done).toHaveBeenCalledExactlyOnceWith(false);
  });

  it("ends the round when the time is up, won if no rival is longer", () => {
    for (const rivalParts of [0, 20]) {
      done.mockClear();
      const arena = newArena(1, 10, 1, 2);
      const rival = rivalOf(arena);
      strip(rival);
      rival.grow(rivalParts);
      rival.placeAt(30, HEIGHT - 20, Math.PI);

      runUntil(arena, 1.9, () => false);
      expect(arena["banner"].visible).toBe(false);
      runUntil(arena, 0.2, () => false);

      const won = rivalParts === 0;
      expect(arena["banner"].visible).toBe(true);
      expect(arena["banner"].text).toContain(won ? "Gewonnen" : "zu kurz");
      expect(arena["banner"].text).toContain(won ? "Weiter" : "Nochmal");

      tapAfterEnd(arena);
      expect(done).toHaveBeenCalledExactlyOnceWith(won);
    }
  });

  it("says that all levels are done when the last one is won", () => {
    const arena = newArena(0, 10, LAST_LEVEL, 1);

    runUntil(arena, 1.1, () => false);

    expect(arena["banner"].text).toContain("Alle Level geschafft");
    expect(arena["banner"].text).not.toContain("Weiter");
  });

  it("keeps the ranking of all snakes up to date during the round", () => {
    const arena = newArena(2);
    const rival = rivalOf(arena);
    lastDot(arena, WIDTH - 20, HEIGHT - 20);
    const topRow = () =>
      [...arena["ranking"]["rows"].entries()].sort(
        ([, a], [, b]) => a.view.y - b.view.y,
      )[0][0];
    expect(arena["ranking"]["rows"].size).toBe(3);
    expect(topRow()).toBe(playerOf(arena));

    rival.grow(3);
    arena.update(DT);

    expect(topRow()).toBe(rival);
  });

  it("counts the seconds down at the top, in red at the end", () => {
    const arena = newArena(0, 10, 1, 30);
    const clock = arena["clock"];
    expect(clock.text).toBe("30");
    expect(clock.x).toBe(WIDTH / 2);
    expect(clock.y).toBeLessThan(HEIGHT / 10);

    runUntil(arena, 1.1, () => false);
    expect(clock.text).toBe("29");
    expect(clock.style.fill).toBe(0xffffff);

    runUntil(arena, 24.5, () => false);
    expect(clock.text).toBe("5");
    expect(clock.style.fill).toBe(0xd95763);
    expect(arena["banner"].visible).toBe(false);

    runUntil(arena, 5, () => false);
    expect(clock.text).toBe("0");
    expect(arena["banner"].visible).toBe(true);
  });

  it("moves on with Enter or Space too, but only after a moment", () => {
    const arena = newArena(0, 10, 1, 1);
    runUntil(arena, 2, () => arena["banner"].visible);
    const movedOn = () => done.mock.calls.length > 0;

    keys.pressed = ["confirm"];

    expect(runUntil(arena, 0.9, movedOn)).toBe(false);
    expect(runUntil(arena, 0.5, movedOn)).toBe(true);
    expect(done).toHaveBeenCalledExactlyOnceWith(true);
  });

  it("gives every rival its own colour, up to the most any level has", () => {
    const most = Math.max(...LEVELS.map((level) => level.rivals));
    const arena = newArena(most);

    const skins = arena["rivals"].map((rival) => rival.snake["skin"]);

    expect(new Set(skins).size).toBe(most);
  });

  it("scatters as many dots as the level asks for", () => {
    expect(dotsOf(newArena(0, 3))).toHaveLength(3);
    expect(dotsOf(newArena(0, 26))).toHaveLength(26);
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

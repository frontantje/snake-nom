import { Rectangle, type Sprite } from "pixi.js";
import { describe, expect, it } from "vitest";
import { angleTo, distance } from "./math";
import { Snake } from "./snake";
import { DT, seeded } from "./testing";

const SCREEN = new Rectangle(0, 0, 240, 160);

function run(snake: Snake, seconds: number, eachFrame?: () => void) {
  for (let frame = 0; frame < seconds / DT; frame++) {
    eachFrame?.();
    snake.move(DT, SCREEN);
  }
}

// head first, tail last
const parts = (snake: Snake) => [...snake.view.children].reverse() as Sprite[];

const gaps = (snake: Snake) =>
  parts(snake)
    .slice(1)
    .map((part, i) => distance(parts(snake)[i], part));

describe("Snake", () => {
  it("stays on the screen, whichever way it's steered", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const random = seeded(seed);
      const snake = new Snake();
      snake.placeAt(120, 80, 0);
      let goal = 0;
      run(snake, 20, () => {
        if (random() < 0.02) goal = random() * 2 * Math.PI;
        snake.turnTowards(goal, DT);
        expect(snake.x).toBeGreaterThanOrEqual(snake.radius);
        expect(snake.x).toBeLessThanOrEqual(SCREEN.width - snake.radius);
        expect(snake.y).toBeGreaterThanOrEqual(snake.radius);
        expect(snake.y).toBeLessThanOrEqual(SCREEN.height - snake.radius);
      });
    }
  });

  it("keeps moving when steered into a corner", () => {
    const corners = [
      { x: 0, y: 0 },
      { x: SCREEN.width, y: 0 },
      { x: 0, y: SCREEN.height },
      { x: SCREEN.width, y: SCREEN.height },
    ];
    for (const corner of corners) {
      const snake = new Snake();
      snake.placeAt(120, 80, angleTo({ x: 120, y: 80 }, corner));
      for (let second = 0; second < 10; second += 0.5) {
        const before = { x: snake.x, y: snake.y };
        run(snake, 0.5, () => snake.turnTowards(angleTo(snake, corner), DT));
        expect(distance(before, snake)).toBeGreaterThan(5);
      }
    }
  });

  it("gets one part longer and a bit bigger with every bite", () => {
    const snake = new Snake();
    snake.placeAt(120, 80, 0);
    const count = parts(snake).length;
    const radius = snake.radius;

    snake.grow();

    expect(parts(snake).length).toBe(count + 1);
    expect(snake.radius).toBeGreaterThan(radius);
  });

  it("keeps its parts evenly spaced, also after growing", () => {
    const snake = new Snake();
    snake.placeAt(60, 80, 0);
    run(snake, 1);
    const before = gaps(snake);
    for (const gap of before) expect(gap).toBeCloseTo(before[0], 6);

    snake.grow();
    run(snake, 1);

    const after = gaps(snake);
    for (const gap of after) expect(gap).toBeCloseTo(after[0], 6);
    expect(after[0]).toBeGreaterThan(before[0]);
  });

  it("points the tail the right way right after a bite", () => {
    const snake = new Snake();
    snake.placeAt(180, 80, Math.PI);
    // long enough to leave the straight line it was placed on
    run(snake, 1.5);
    const tail = parts(snake).pop()!;

    snake.grow();

    run(snake, 0.5, () => expect(Math.cos(tail.rotation)).toBeCloseTo(-1, 6));
  });

  it("loses just the bitten part, shrinks a bit, and is safe for a moment", () => {
    const snake = new Snake();
    snake.placeAt(120, 80, 0);
    run(snake, 1);
    const [a, b, bitten, d, e] = snake.body;
    const radius = snake.radius;

    snake.biteOff(2);

    expect(snake.body).toEqual([a, b, d, e]);
    expect(bitten.destroyed).toBe(true);
    expect(snake.radius).toBeLessThan(radius);
    expect(snake.safe).toBe(true);
    run(snake, 0.6);
    expect(snake.safe).toBe(false);
  });
});

import { Rectangle } from "pixi.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type Goal, Rival } from "./rival";
import { Snake } from "./snake";
import { DT, seeded, strip } from "./testing";

beforeEach(() => {
  vi.spyOn(Math, "random").mockImplementation(seeded(3));
});

const dot = (x: number, y: number): Goal => ({ x, y, destroyed: false });

function rivalAt(x: number, y: number) {
  const rival = new Rival(new Snake());
  rival.snake.placeAt(x, y, 0);
  return rival;
}

function snakeAt(x: number, y: number) {
  const snake = new Snake();
  snake.placeAt(x, y, 0);
  return snake;
}

describe("Rival", () => {
  it("goes for a dot right in front of it rather than a snake far away", () => {
    const rival = rivalAt(60, 80);
    const other = snakeAt(220, 150);
    const near = dot(75, 80);

    rival.update(DT, [near, dot(220, 20)], [rival.snake, other]);

    expect(rival["goal"]).toBe(near);
  });

  it("goes for another snake's body when there are no dots", () => {
    const rival = rivalAt(60, 80);
    const other = snakeAt(150, 80);

    rival.update(DT, [], [rival.snake, other]);

    expect(other.body).toContain(rival["goal"]);
  });

  it("goes for the head of a snake with no body left", () => {
    const rival = rivalAt(60, 80);
    const other = snakeAt(150, 80);
    strip(other);
    // long enough to not be safe anymore
    other.move(1.1, new Rectangle(0, 0, 240, 160));

    rival.update(DT, [], [rival.snake, other]);

    expect(rival["goal"]).toBe(other);
  });

  it("leaves a snake alone while it's safe after a bite", () => {
    const rival = rivalAt(60, 80);
    const other = snakeAt(150, 80);
    other.biteOff(2);

    rival.update(DT, [], [rival.snake, other]);

    expect(rival["goal"]).toBeNull();
  });

  describe("after biting a snake", () => {
    // `bitten` is nearer, so it's the goal whenever it's allowed
    function setUp() {
      const rival = rivalAt(60, 80);
      const bitten = snakeAt(150, 80);
      const other = snakeAt(150, 140);
      const snakes = [rival.snake, bitten, other];
      const goalIn = (snake: Snake) =>
        snake.body.some((part) => part === rival["goal"]);
      const think = (seconds: number) => {
        for (let frame = 0; frame < seconds / DT; frame++) {
          rival.update(DT, [], snakes);
        }
      };
      think(DT);
      expect(goalIn(bitten)).toBe(true);
      rival.ate(bitten);
      return { rival, bitten, other, goalIn, think };
    }

    it("goes for something else next", () => {
      const { other, goalIn, think } = setUp();

      for (let second = 0; second < 5; second++) {
        think(1);
        expect(goalIn(other)).toBe(true);
      }
    });

    it("may go for that snake again once it has bitten another one", () => {
      const { rival, bitten, other, goalIn, think } = setUp();

      rival.ate(other);
      think(DT);

      expect(goalIn(bitten)).toBe(true);
    });

    it("may go for that snake again once it has eaten a dot", () => {
      const { rival, bitten, goalIn, think } = setUp();

      rival.ate(null);
      think(1);

      expect(goalIn(bitten)).toBe(true);
    });
  });

  it("picks a new goal when its goal is gone", () => {
    const rival = rivalAt(60, 80);
    const first = { x: 75, y: 80, destroyed: false };
    const second = dot(200, 80);
    rival.update(DT, [first, second], [rival.snake]);
    expect(rival["goal"]).toBe(first);

    first.destroyed = true;
    rival.update(DT, [second], [rival.snake]);

    expect(rival["goal"]).toBe(second);
  });
});

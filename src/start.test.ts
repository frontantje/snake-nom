import { type FederatedPointerEvent, Point } from "pixi.js";
import { describe, expect, it, vi } from "vitest";
import type { Action, Input } from "./input";
import { distance } from "./math";
import { Progress } from "./progress";
import { StartScreen } from "./start";
import { DT } from "./testing";

const WIDTH = 240;
const HEIGHT = 160;

function startScreen({ completed = 0, pressed = [] as Action[] } = {}) {
  vi.stubGlobal("localStorage", {
    getItem: () => String(completed),
    setItem: () => {},
  });
  const progress = new Progress();
  const keys = {
    direction: null,
    wasPressed: (a: Action) => pressed.includes(a),
  };
  const play = vi.fn();
  const screen = new StartScreen(
    keys as unknown as Input,
    progress,
    progress.unlocked,
    play,
  );
  screen.resize(WIDTH, HEIGHT, 1);
  return { screen, play };
}

const wait = (screen: StartScreen, seconds: number) => {
  for (let frame = 0; frame < seconds / DT; frame++) screen.update(DT);
};

function tap(screen: StartScreen, at: { x: number; y: number }) {
  const event = { global: new Point(at.x, at.y) };
  screen.view.emit("pointerdown", event as unknown as FederatedPointerEvent);
}

const [back, forward] = [0, 1];
const arrow = (screen: StartScreen, which: number) =>
  screen["arrows"][which].label;
const levelShown = (screen: StartScreen) => screen["levelLabel"].text;

describe("StartScreen", () => {
  it("shows the title and the next level, and doesn't start by itself", () => {
    const { screen, play } = startScreen({ completed: 2 });

    wait(screen, 10);

    expect(screen["title"].text).toContain("Mompf so viel");
    expect(levelShown(screen)).toBe("Level 3");
    expect(play).not.toHaveBeenCalled();
  });

  it("plays the shown level on a tap", () => {
    const { screen, play } = startScreen({ completed: 2 });
    wait(screen, 1);

    tap(screen, { x: 20, y: 20 });

    expect(play).toHaveBeenCalledExactlyOnceWith(3);
  });

  it("plays the shown level on Enter or Space", () => {
    const { screen, play } = startScreen({
      completed: 2,
      pressed: ["confirm"],
    });

    wait(screen, 1);

    expect(play).toHaveBeenNthCalledWith(1, 3);
  });

  it("ignores taps and Enter for a moment, so they can't skip the screen", () => {
    const { screen, play } = startScreen({ pressed: ["confirm"] });

    tap(screen, { x: 20, y: 20 });
    wait(screen, 0.5);
    tap(screen, { x: 20, y: 20 });

    expect(play).not.toHaveBeenCalled();
  });

  it("lets you pick a won level or the one after, but nothing further", () => {
    const { screen, play } = startScreen({ completed: 3 });
    wait(screen, 1);
    const tapArrow = (which: number) => tap(screen, arrow(screen, which));

    tapArrow(back);
    expect(levelShown(screen)).toBe("Level 3");
    tapArrow(back);
    tapArrow(back);
    expect(levelShown(screen)).toBe("Level 1");
    for (let i = 0; i < 5; i++) tapArrow(forward);
    expect(levelShown(screen)).toBe("Level 4");

    expect(play).not.toHaveBeenCalled();
  });

  it("fades an arrow with no level that way, and a tap on it does nothing", () => {
    const { screen, play } = startScreen({ completed: 3 });
    wait(screen, 1);
    expect(arrow(screen, forward).alpha).toBeLessThan(1);
    expect(arrow(screen, back).alpha).toBe(1);

    tap(screen, arrow(screen, forward));

    expect(levelShown(screen)).toBe("Level 4");
    expect(play).not.toHaveBeenCalled();
  });

  it("lets you pick levels with the arrow keys too", () => {
    const left = startScreen({ completed: 3, pressed: ["left"] }).screen;
    left.update(DT);
    expect(levelShown(left)).toBe("Level 3");

    const right = startScreen({ completed: 3, pressed: ["right"] }).screen;
    right.update(DT);
    expect(levelShown(right)).toBe("Level 4");
  });

  it("shows no arrows before the first win", () => {
    const { screen } = startScreen();

    expect(levelShown(screen)).toBe("Level 1");
    expect(arrow(screen, back).visible).toBe(false);
    expect(arrow(screen, forward).visible).toBe(false);
  });

  it("celebrates once every level is won", () => {
    const { screen } = startScreen({ completed: 10 });

    expect(screen["title"].text).toContain("Alle Level");
    expect(levelShown(screen)).toBe("Level 10");
  });

  it("keeps the player's snake circling below the title", () => {
    const { screen } = startScreen();
    const snake = screen["snake"];
    const middle = screen["middle"];
    const radius = distance(middle, screen["aim"]());
    const seen = { left: false, right: false, top: false, bottom: false };

    for (let frame = 0; frame < 60 * 10; frame++) {
      screen.update(DT);
      const away = distance(middle, snake);
      expect(away).toBeGreaterThan(radius / 2);
      expect(away).toBeLessThan(radius * 1.5);
      seen.left ||= snake.x < middle.x - radius / 2;
      seen.right ||= snake.x > middle.x + radius / 2;
      seen.top ||= snake.y < middle.y - radius / 2;
      seen.bottom ||= snake.y > middle.y + radius / 2;
    }

    expect(seen).toEqual({ left: true, right: true, top: true, bottom: true });
  });
});

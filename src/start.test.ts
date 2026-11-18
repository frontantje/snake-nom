import type { FederatedPointerEvent } from "pixi.js";
import { describe, expect, it, vi } from "vitest";
import type { Input } from "./input";
import { distance } from "./math";
import { StartScreen } from "./start";
import { DT } from "./testing";

const WIDTH = 240;
const HEIGHT = 160;

function startScreen(confirm = false) {
  const keys = { direction: null, wasPressed: () => confirm } as unknown;
  const start = vi.fn();
  const screen = new StartScreen(keys as Input, start);
  screen.resize(WIDTH, HEIGHT, 1);
  return { screen, start };
}

describe("StartScreen", () => {
  it("shows the title and doesn't start by itself", () => {
    const { screen, start } = startScreen();

    for (let frame = 0; frame < 60 * 10; frame++) screen.update(DT);

    expect(screen["title"].text).toContain("Mompf so viel");
    expect(start).not.toHaveBeenCalled();
  });

  it("starts the game on a tap", () => {
    const { screen, start } = startScreen();

    screen.view.emit("pointerdown", {} as FederatedPointerEvent);

    expect(start).toHaveBeenCalledOnce();
  });

  it("starts the game on Enter or Space", () => {
    const { screen, start } = startScreen(true);

    screen.update(DT);

    expect(start).toHaveBeenCalledOnce();
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

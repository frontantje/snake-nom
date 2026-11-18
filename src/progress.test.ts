import { beforeEach, describe, expect, it, vi } from "vitest";
import { Progress } from "./progress";

let saved: Map<string, string>;

beforeEach(() => {
  saved = new Map();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => saved.get(key) ?? null,
    setItem: (key: string, value: string) => saved.set(key, value),
  });
});

describe("Progress", () => {
  it("starts at level 1 when nothing is saved", () => {
    const progress = new Progress();

    expect(progress.completed).toBe(0);
    expect(progress.unlocked).toBe(1);
  });

  it("offers the next level after a win and the same one after a loss", () => {
    const progress = new Progress();

    expect(progress.finish(1, false)).toBe(1);
    expect(progress.unlocked).toBe(1);

    expect(progress.finish(1, true)).toBe(2);
    expect(progress.unlocked).toBe(2);
  });

  it("remembers won levels for the next visit", () => {
    new Progress().finish(1, true);
    new Progress().finish(2, true);

    expect(new Progress().unlocked).toBe(3);
  });

  it("doesn't lose progress when an earlier level is played again", () => {
    const progress = new Progress();
    for (let level = 1; level <= 5; level++) progress.finish(level, true);

    expect(progress.finish(2, true)).toBe(3);
    progress.finish(3, false);

    expect(progress.completed).toBe(5);
    expect(new Progress().completed).toBe(5);
  });

  it("keeps what another tab has won in the meantime", () => {
    const first = new Progress();
    for (let level = 1; level <= 5; level++) first.finish(level, true);
    const second = new Progress();
    for (let level = 6; level <= 8; level++) second.finish(level, true);

    first.finish(6, true);

    expect(first.completed).toBe(8);
    expect(new Progress().completed).toBe(8);
  });

  it("stays at level 10 once everything is won", () => {
    const progress = new Progress();
    for (let level = 1; level <= 10; level++) progress.finish(level, true);

    expect(progress.completed).toBe(10);
    expect(progress.unlocked).toBe(10);
    expect(progress.finish(10, true)).toBe(10);
  });

  it("ignores saved values that make no sense", () => {
    for (const [value, completed] of [
      ["nonsense", 0],
      ["-3", 0],
      ["2.5", 0],
      ["99", 10],
    ] as const) {
      saved.set("snake-nom:completed", value);
      expect(new Progress().completed).toBe(completed);
    }
  });

  it("still works when the browser won't store anything", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });
    const progress = new Progress();

    expect(progress.unlocked).toBe(1);
    expect(progress.finish(1, true)).toBe(2);
    expect(progress.unlocked).toBe(2);
  });
});

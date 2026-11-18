import { describe, expect, it } from "vitest";
import { LEVELS } from "./levels";

const level = (n: number) => LEVELS[n - 1];

describe("LEVELS", () => {
  it("ends with level 10", () => {
    expect(LEVELS).toHaveLength(10);
  });

  it("adds a rival at levels 2, 5 and 8", () => {
    expect(LEVELS.map((l) => l.rivals)).toEqual([1, 2, 2, 2, 3, 3, 3, 4, 4, 4]);
  });

  it("starts with rivals slower than in version 0.3.0", () => {
    expect(level(1).rivalSpeed).toBeLessThan(0.8);
  });

  it("changes nothing but the number of rivals at level 2", () => {
    expect({ ...level(2), rivals: 1 }).toEqual(level(1));
  });

  it("makes rivals faster and dots more from level 3 on", () => {
    for (let n = 3; n <= LEVELS.length; n++) {
      expect(level(n).rivalSpeed).toBeGreaterThan(level(n - 1).rivalSpeed);
      expect(level(n).dots).toBeGreaterThan(level(n - 1).dots);
    }
  });

  it("never makes rivals as fast as the player", () => {
    for (const l of LEVELS) expect(l.rivalSpeed).toBeLessThan(1);
  });
});

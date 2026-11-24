import { describe, expect, it } from "vitest";
import { Ranking } from "./ranking";
import { Snake } from "./snake";
import { strip } from "./testing";

// top row first
function rows(ranking: Ranking) {
  return [...ranking["rows"].entries()]
    .sort(([, a], [, b]) => a.view.y - b.view.y)
    .map(([snake, row]) => ({ snake, length: row.count.text }));
}

function placedSnake() {
  const snake = new Snake();
  snake.placeAt(120, 80, 0);
  return snake;
}

function setUp() {
  const player = placedSnake();
  const long = placedSnake();
  long.grow(5);
  const short = placedSnake();
  strip(short);
  const ranking = new Ranking([long, short, player], player);
  ranking.resize(1);
  return { ranking, player, long, short };
}

describe("Ranking", () => {
  it("lists every snake's length, longest first", () => {
    const { ranking, player, long, short } = setUp();

    expect(rows(ranking)).toEqual([
      { snake: long, length: "10" },
      { snake: player, length: "5" },
      { snake: short, length: "0" },
    ]);
  });

  it("puts the player first when lengths are equal", () => {
    const { ranking, player, long } = setUp();
    player.grow(5);

    ranking.update();

    expect(rows(ranking)[0].snake).toBe(player);
    expect(rows(ranking)[1].snake).toBe(long);
  });

  it("follows the lengths as they change", () => {
    const { ranking, player, short } = setUp();
    short.grow(12);
    player.grow(1);

    ranking.update();

    expect(rows(ranking).map((row) => row.length)).toEqual(["12", "10", "6"]);
    expect(rows(ranking)[0].snake).toBe(short);
  });

  it("drops a snake that has been eaten", () => {
    const { ranking, short } = setUp();
    short.view.destroy({ children: true });

    ranking.update();

    expect(rows(ranking).map((row) => row.snake)).not.toContain(short);
    expect(ranking.view.children).toHaveLength(2);
  });
});

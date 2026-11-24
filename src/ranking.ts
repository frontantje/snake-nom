import { Container, Sprite, type Text } from "pixi.js";
import { art, SIZE } from "./art";
import { makeLabel, sizeLabel } from "./label";
import type { Snake } from "./snake";

// art pixels: the size of a head icon and the height of a row
const ICON = 10;
const ROW = 12;

type Row = { view: Container; icon: Sprite; count: Text };

// every snake's head and length in the top left corner, longest first
export class Ranking {
  readonly view = new Container();
  private rows = new Map<Snake, Row>();
  private scale = 1;

  constructor(
    snakes: readonly Snake[],
    private player: Snake,
  ) {
    for (const snake of snakes) {
      const icon = new Sprite(art(snake.skin.head));
      icon.anchor.set(0, 0.5);
      const count = makeLabel();
      count.anchor.set(0, 0.5);
      const view = new Container();
      view.addChild(icon, count);
      this.view.addChild(view);
      this.rows.set(snake, { view, icon, count });
    }
  }

  resize(scale: number) {
    this.scale = scale;
    for (const { icon, count } of this.rows.values()) {
      icon.scale.set((ICON * scale) / SIZE);
      sizeLabel(count, 8 * scale);
      count.x = (ICON + 2) * scale;
    }
    this.update();
  }

  update() {
    for (const [snake, row] of this.rows) {
      if (!snake.destroyed) continue;
      row.view.destroy({ children: true });
      this.rows.delete(snake);
    }
    const isPlayer = (snake: Snake) => Number(snake === this.player);
    // a tie goes to the player, like the win does
    const order = [...this.rows.keys()].sort(
      (a, b) => b.bodyCount - a.bodyCount || isPlayer(b) - isPlayer(a),
    );
    order.forEach((snake, i) => {
      const row = this.rows.get(snake)!;
      row.view.position.set(4 * this.scale, (4 + ROW * (i + 0.5)) * this.scale);
      row.count.text = String(snake.bodyCount);
    });
  }
}

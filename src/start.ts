import { Container, Rectangle } from "pixi.js";
import type { Input } from "./input";
import { makeLabel, sizeLabel } from "./label";
import { angleTo, type Point } from "./math";
import type { Scene } from "./scene";
import { Snake } from "./snake";

// the snake circles this much of the shorter screen side around a point below the title
const CIRCLE = 0.2;
// radians ahead on its circle that the snake aims at
const AIM_AHEAD = 0.6;

export class StartScreen implements Scene {
  readonly view = new Container();
  private world = new Container();
  private snake = new Snake({ length: 12 });
  private title = makeLabel("Mompf so viel\ndu kannst!");
  private bounds = new Rectangle();
  private placed = false;

  constructor(
    private input: Input,
    private start: () => void,
  ) {
    this.world.addChild(this.snake.view);
    this.title.anchor.set(0.5);
    this.view.addChild(this.world, this.title);
    this.view.eventMode = "static";
    this.view.on("pointerdown", () => this.start());
  }

  update(dt: number) {
    if (this.input.wasPressed("confirm")) {
      this.start();
      return;
    }
    const { snake } = this;
    snake.turnTowards(angleTo(snake, this.aim()), dt);
    snake.move(dt, this.bounds);
  }

  resize(width: number, height: number, scale: number) {
    this.view.hitArea = new Rectangle(0, 0, width, height);
    this.world.scale.set(scale);
    this.bounds = new Rectangle(0, 0, width / scale, height / scale);
    if (!this.placed) {
      const { x, y } = this.aim();
      this.snake.placeAt(x, y, angleTo(this.middle, { x, y }) + Math.PI / 2);
      this.placed = true;
    }
    sizeLabel(this.title, 12 * scale);
    this.title.position.set(width / 2, height * 0.28);
  }

  private get middle() {
    return { x: this.bounds.width / 2, y: this.bounds.height * 0.65 };
  }

  // a point a bit further along the circle than the snake
  private aim(): Point {
    const { middle } = this;
    const radius = CIRCLE * Math.min(this.bounds.width, this.bounds.height);
    const angle = angleTo(middle, this.snake) + AIM_AHEAD;
    return {
      x: middle.x + Math.cos(angle) * radius,
      y: middle.y + Math.sin(angle) * radius,
    };
  }
}

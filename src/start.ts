import { Container, Rectangle, type Text } from "pixi.js";
import type { Input } from "./input";
import { makeLabel, sizeLabel } from "./label";
import { LAST_LEVEL, LEVELS } from "./levels";
import { angleTo, clamp, type Point } from "./math";
import type { Progress } from "./progress";
import type { Scene } from "./scene";
import { Snake } from "./snake";

// the snake circles this much of the shorter screen side around a point below the title
const CIRCLE = 0.16;
// radians ahead on its circle that the snake aims at
const AIM_AHEAD = 0.6;
// seconds before a tap starts a level, so taps meant for the round before don't
const START_DELAY = 0.7;
// an arrow with no level in its direction stays, faded, so a tap on it does nothing
const DIMMED = 0.3;

// shows the player's snake and which level comes next; a tap plays it
export class StartScreen implements Scene {
  readonly view = new Container();
  private world = new Container();
  private snake = new Snake({ length: 12 });
  private title: Text;
  private levelLabel = makeLabel();
  private secondsLabel = makeLabel();
  // zone: where on the screen a tap counts for the arrow
  private arrows = [
    { label: makeLabel("<"), step: -1, zone: new Rectangle() },
    { label: makeLabel(">"), step: 1, zone: new Rectangle() },
  ];
  private bounds = new Rectangle();
  private placed = false;
  private time = 0;

  constructor(
    private input: Input,
    private progress: Progress,
    private level: number,
    private play: (level: number) => void,
  ) {
    const allDone = progress.completed === LAST_LEVEL;
    this.title = makeLabel(
      allDone ? "Alle Level\ngeschafft!" : "Mompf so viel\ndu kannst!",
    );
    const labels = [
      this.title,
      this.levelLabel,
      this.secondsLabel,
      ...this.arrows.map((a) => a.label),
    ];
    for (const label of labels) label.anchor.set(0.5);
    this.world.addChild(this.snake.view);
    this.view.addChild(this.world, ...labels);
    this.view.eventMode = "static";
    this.view.on("pointerdown", (e) => this.tap(e.global));
    this.pick(level);
  }

  update(dt: number) {
    this.time += dt;
    if (this.input.wasPressed("left")) this.pick(this.level - 1);
    if (this.input.wasPressed("right")) this.pick(this.level + 1);
    if (this.ready && this.input.wasPressed("confirm")) {
      this.play(this.level);
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
    this.title.position.set(width / 2, height * 0.2);

    const size = 10 * scale;
    const y = height * 0.42;
    sizeLabel(this.levelLabel, size);
    this.levelLabel.position.set(width / 2, y);
    sizeLabel(this.secondsLabel, 8 * scale);
    this.secondsLabel.position.set(width / 2, y + 12 * scale);
    for (const { label, step, zone } of this.arrows) {
      const x = width / 2 + step * 4 * size;
      sizeLabel(label, size);
      label.position.set(x, y);
      // bigger than the arrow itself, for small fingers
      zone.copyFrom(new Rectangle(x - size, y - size, 2 * size, 2 * size));
    }
  }

  private get ready() {
    return this.time > START_DELAY;
  }

  private tap(point: Point) {
    const arrow = this.arrows.find(
      ({ label, zone }) => label.visible && zone.contains(point.x, point.y),
    );
    if (arrow) this.pick(this.level + arrow.step);
    else if (this.ready) this.play(this.level);
  }

  private pick(level: number) {
    const last = this.progress.unlocked;
    this.level = clamp(level, 1, last);
    this.levelLabel.text = `Level ${this.level}`;
    this.secondsLabel.text = `${LEVELS[this.level - 1].seconds} Sekunden`;
    for (const { label, step } of this.arrows) {
      const next = this.level + step;
      label.visible = last > 1;
      label.alpha = next >= 1 && next <= last ? 1 : DIMMED;
    }
  }

  private get middle() {
    return { x: this.bounds.width / 2, y: this.bounds.height * 0.75 };
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

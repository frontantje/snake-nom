import {
  Container,
  FederatedPointerEvent,
  Rectangle,
  Sprite,
  Text,
} from "pixi.js";
import { art, FOOD_RADIUS } from "./art";
import type { Direction, Input } from "./input";
import { angleTo, clamp, distance, type Point, random } from "./math";
import type { Scene } from "./scene";
import { LOOKAHEAD, Snake } from "./snake";

const KEY_ANGLE: Record<Direction, number> = {
  right: 0,
  down: Math.PI / 2,
  left: Math.PI,
  up: -Math.PI / 2,
};

// art pixels from a tapped spot that count as having reached it
const ARRIVED = 3;
const START_LENGTH = 5;
const FOOD_COUNT = 10;
// art pixels kept free between two dots, when there's room
const FOOD_GAP = 14;
// a tap on a dot this far from the edges brings any snake's head within reach
const FOOD_MARGIN = LOOKAHEAD;
// seconds after winning before a tap starts a new round instead of steering
const RESTART_DELAY = 1;

export class Arena implements Scene {
  readonly view = new Container();
  private world = new Container();
  private food = new Container<Sprite>();
  private snake = new Snake(START_LENGTH);
  private banner = new Text({
    text: "Alles aufgefuttert!\nNochmal? Tippen!",
    style: {
      fill: 0xffffff,
      fontFamily: "monospace",
      fontWeight: "bold",
      align: "center",
    },
  });
  private target: Point | null = null;
  private steeringPointer: number | null = null;
  private bounds = new Rectangle();
  private placed = false;
  // seconds since the last dot was eaten
  private wonFor: number | null = null;

  constructor(
    private input: Input,
    private newRound: () => void,
  ) {
    this.world.addChild(this.food, this.snake.view);
    this.banner.anchor.set(0.5);
    this.banner.visible = false;
    this.view.addChild(this.world, this.banner);

    this.view.eventMode = "static";
    this.view.on("pointerdown", (e) => {
      if (this.canRestart) {
        this.newRound();
        return;
      }
      this.steeringPointer = e.pointerId;
      this.aimAt(e);
    });
    this.view.on("globalpointermove", (e) => {
      if (e.pointerId === this.steeringPointer) this.aimAt(e);
    });
    const release = (e: { pointerId: number }) => {
      if (e.pointerId === this.steeringPointer) this.steeringPointer = null;
    };
    this.view.on("pointerup", release).on("pointerupoutside", release);
    // Pixi doesn't pass on touches the system cancels, e.g. for an iPad swipe
    window.addEventListener("pointercancel", release);
    this.view.on("destroyed", () =>
      window.removeEventListener("pointercancel", release),
    );
  }

  update(dt: number) {
    this.steer(dt);
    this.snake.move(dt, this.bounds);
    this.eat();
    if (this.wonFor !== null) {
      this.wonFor += dt;
      if (this.canRestart && this.input.wasPressed("confirm")) this.newRound();
    }
  }

  resize(width: number, height: number, scale: number) {
    const old = this.bounds;
    this.view.hitArea = new Rectangle(0, 0, width, height);
    this.world.scale.set(scale);
    this.bounds = new Rectangle(0, 0, width / scale, height / scale);
    this.target = null;
    if (this.placed) {
      // everything keeps its place relative to the screen, so dots stay spread out
      const map = (point: Point) => ({
        x: stretch(point.x, old.width, this.bounds.width),
        y: stretch(point.y, old.height, this.bounds.height),
      });
      for (const dot of this.food.children) dot.position.copyFrom(map(dot));
      this.snake.remap(map);
    } else {
      this.snake.placeAt(this.bounds.width / 2, this.bounds.height / 2, 0);
      this.scatterFood();
      this.placed = true;
    }
    this.banner.style.fontSize = 10 * scale;
    this.banner.style.stroke = { color: 0x1b1b24, width: 3 * scale };
    this.banner.position.set(width / 2, height / 2);
  }

  private get canRestart() {
    return (this.wonFor ?? 0) > RESTART_DELAY;
  }

  private steer(dt: number) {
    const { snake, target } = this;
    const direction = this.input.direction;
    if (direction) {
      this.target = null;
      snake.turnTowards(KEY_ANGLE[direction], dt);
    } else if (target) {
      const away = distance(snake, target);
      if (away >= ARRIVED) {
        snake.turnTowards(angleTo(snake, target), dt, away);
      } else if (this.steeringPointer === null) {
        // a held finger stays the goal, so the snake loops back through it
        this.target = null;
      }
    }
  }

  private eat() {
    const { snake } = this;
    const reach = snake.radius + FOOD_RADIUS;
    for (const dot of [...this.food.children]) {
      if (distance(dot, snake) < reach) {
        dot.destroy();
        snake.grow();
      }
    }
    if (this.food.children.length === 0 && this.wonFor === null) {
      this.wonFor = 0;
      this.banner.visible = true;
    }
  }

  private scatterFood() {
    for (let i = 0; i < FOOD_COUNT; i++) {
      const dot = new Sprite(art("food"));
      dot.anchor.set(0.5);
      dot.position.copyFrom(this.freeSpot());
      this.food.addChild(dot);
    }
  }

  private freeSpot() {
    const { width, height } = this.bounds;
    let spot = { x: 0, y: 0 };
    for (let tries = 0; tries < 20; tries++) {
      spot = {
        x: random(FOOD_MARGIN, width - FOOD_MARGIN),
        y: random(FOOD_MARGIN, height - FOOD_MARGIN),
      };
      // the snake's head counts too, or a dot could be eaten right away
      const crowded =
        distance(this.snake, spot) < FOOD_GAP ||
        this.food.children.some((dot) => distance(dot, spot) < FOOD_GAP);
      if (!crowded) break;
    }
    return spot;
  }

  private aimAt(e: FederatedPointerEvent) {
    const { x, y } = this.world.toLocal(e.global);
    const { width, height } = this.bounds;
    const margin = this.snake.edgeMargin;
    this.target = {
      x: clamp(x, margin, width - margin),
      y: clamp(y, margin, height - margin),
    };
  }
}

// maps a spot between the margins of one screen size to another
const stretch = (value: number, from: number, to: number) =>
  FOOD_MARGIN +
  ((value - FOOD_MARGIN) * (to - 2 * FOOD_MARGIN)) / (from - 2 * FOOD_MARGIN);

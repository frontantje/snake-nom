import { Container, FederatedPointerEvent, Rectangle } from "pixi.js";
import type { Direction, Input } from "./input";
import { clamp } from "./math";
import type { Scene } from "./scene";
import { EDGE_MARGIN, Snake } from "./snake";

const KEY_ANGLE: Record<Direction, number> = {
  right: 0,
  down: Math.PI / 2,
  left: Math.PI,
  up: -Math.PI / 2,
};

// art pixels from a tapped spot that count as having reached it
const ARRIVED = 3;

export class Arena implements Scene {
  readonly view = new Container();
  private world = new Container();
  private snake = new Snake(5);
  private target: { x: number; y: number } | null = null;
  private steeringPointer: number | null = null;
  private bounds = new Rectangle();
  private placed = false;

  constructor(private input: Input) {
    this.world.addChild(this.snake.view);
    this.view.addChild(this.world);

    this.view.eventMode = "static";
    this.view.on("pointerdown", (e) => {
      this.steeringPointer = e.pointerId;
      this.aimAt(e);
    });
    this.view.on("globalpointermove", (e) => {
      if (e.pointerId === this.steeringPointer) this.aimAt(e);
    });
    const release = (e: FederatedPointerEvent) => {
      if (e.pointerId === this.steeringPointer) this.steeringPointer = null;
    };
    this.view.on("pointerup", release).on("pointerupoutside", release);
  }

  update(dt: number) {
    const { snake, target } = this;
    const direction = this.input.direction;
    if (direction) {
      this.target = null;
      snake.turnTowards(KEY_ANGLE[direction], dt);
    } else if (target) {
      const dx = target.x - snake.x;
      const dy = target.y - snake.y;
      const angle = Math.atan2(dy, dx);
      // a held finger is followed and circled around, a tap is a spot to reach
      if (this.steeringPointer !== null) {
        snake.turnTowards(angle, dt);
      } else if (Math.hypot(dx, dy) < ARRIVED) {
        this.target = null;
      } else {
        snake.turnTowards(angle, dt, Math.hypot(dx, dy));
      }
    }
    snake.move(dt, this.bounds);
  }

  resize(width: number, height: number, scale: number) {
    this.view.hitArea = new Rectangle(0, 0, width, height);
    this.world.scale.set(scale);
    this.bounds = new Rectangle(0, 0, width / scale, height / scale);
    if (!this.placed) {
      this.snake.placeAt(this.bounds.width / 2, this.bounds.height / 2, 0);
      this.placed = true;
    }
  }

  private aimAt(e: FederatedPointerEvent) {
    const { x, y } = this.world.toLocal(e.global);
    const { width, height } = this.bounds;
    this.target = {
      x: clamp(x, EDGE_MARGIN, width - EDGE_MARGIN),
      y: clamp(y, EDGE_MARGIN, height - EDGE_MARGIN),
    };
  }
}

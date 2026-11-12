import { Container, FederatedPointerEvent, Rectangle, Sprite } from "pixi.js";
import { art } from "./art";
import type { Direction, Input } from "./input";
import type { Scene } from "./scene";

// art pixels per second
const SPEED = 60;

const STEP: Record<Direction, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

export class Playground implements Scene {
  readonly view = new Container();
  private world = new Container();
  private hero = new Sprite(art("hero"));
  private target: { x: number; y: number } | null = null;
  private steeringPointer: number | null = null;
  private bounds = new Rectangle();
  private placed = false;

  constructor(private input: Input) {
    this.hero.anchor.set(0.5, 1);
    this.world.addChild(this.hero);
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
    const { hero, target } = this;
    const step = SPEED * dt;
    const direction = this.input.direction;
    if (direction) {
      this.target = null;
      const [dx, dy] = STEP[direction];
      hero.x += dx * step;
      hero.y += dy * step;
    } else if (target) {
      const dx = target.x - hero.x;
      const dy = target.y - hero.y;
      const distance = Math.hypot(dx, dy);
      if (distance <= step) {
        hero.position.set(target.x, target.y);
        this.target = null;
      } else {
        hero.x += (dx / distance) * step;
        hero.y += (dy / distance) * step;
      }
    }
    const halfWidth = hero.width / 2;
    hero.x = clamp(hero.x, halfWidth, this.bounds.width - halfWidth);
    hero.y = clamp(hero.y, hero.height, this.bounds.height);
  }

  resize(width: number, height: number, scale: number) {
    this.view.hitArea = new Rectangle(0, 0, width, height);
    this.world.scale.set(scale);
    this.bounds = new Rectangle(0, 0, width / scale, height / scale);
    if (!this.placed) {
      this.hero.position.set(this.bounds.width / 2, this.bounds.height / 2);
      this.placed = true;
    }
  }

  private aimAt(e: FederatedPointerEvent) {
    const { x, y } = this.world.toLocal(e.global);
    this.target = { x, y };
  }
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

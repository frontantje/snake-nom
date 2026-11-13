import { Container, Graphics } from "pixi.js";
import { makeLabel, sizeLabel } from "./label";
import type { Snake } from "./snake";

// seconds the player's snake is pointed out at the start of a round
const SHOW_TIME = 3;
// seconds of fading out at the end
const FADE_TIME = 0.5;

// a pulsing ring and "Du!" around the player's head, so it's clear which snake is yours
export class Marker {
  readonly view = new Container();
  private ring = new Graphics();
  private label = makeLabel("Du!");
  private scale = 1;
  private time = 0;

  constructor() {
    this.label.anchor.set(0.5, 1);
    this.view.addChild(this.ring, this.label);
  }

  resize(scale: number) {
    this.scale = scale;
    sizeLabel(this.label, 8 * scale);
  }

  // world is where the snake lives, so its head can be found on the screen
  update(dt: number, snake: Snake | null, world: Container) {
    this.time += dt;
    this.view.visible = snake !== null && this.time < SHOW_TIME;
    if (!snake || !this.view.visible) return;
    const { scale } = this;
    const radius = (snake.radius + 3) * scale;
    const pulse = 1 + 0.2 * Math.sin(this.time * 8);
    this.ring
      .clear()
      .circle(0, 0, radius * pulse)
      .stroke({ color: 0xffffff, width: scale });
    this.label.position.set(0, -radius - 3 * scale);
    this.view.position.copyFrom(world.toGlobal(snake));
    this.view.alpha = Math.min(1, (SHOW_TIME - this.time) / FADE_TIME);
  }
}

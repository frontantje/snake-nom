import { Container, Rectangle, Sprite } from "pixi.js";
import { art } from "./art";
import { clamp, wrapAngle } from "./math";

// art pixels per second
const SPEED = 50;
// radians per second
const TURN_RATE = 4;
// art pixels between the centres of neighbouring parts
const SPACING = 8;
const HEAD_RADIUS = 7;
// art pixels ahead of the head where an edge makes the snake turn away
const LOOKAHEAD = 16;

// spots at least this far from the edges can be reached without turning away
export const EDGE_MARGIN = HEAD_RADIUS + LOOKAHEAD;

type Point = { x: number; y: number };

export class Snake {
  readonly view = new Container();
  heading = 0;
  private head = new Sprite(art("head"));
  private tail = new Sprite(art("tail"));
  private parts = [this.head, this.tail];
  // where the head has been, newest first
  private trail: Point[] = [];

  constructor(bodyLength: number) {
    this.head.anchor.set(0.5);
    this.tail.anchor.set(0.5);
    this.view.addChild(this.tail, this.head);
    for (let i = 0; i < bodyLength; i++) this.grow();
  }

  // the tail stays put until the body has stretched out to make room
  grow() {
    const part = new Sprite(art("body"));
    part.anchor.set(0.5);
    part.position.copyFrom(this.tail.position);
    this.parts.splice(-1, 0, part);
    this.view.addChildAt(part, 1);
  }

  get x() {
    return this.head.x;
  }

  get y() {
    return this.head.y;
  }

  placeAt(x: number, y: number, heading: number) {
    this.heading = heading;
    const length = (this.parts.length - 1) * SPACING;
    this.trail = [
      { x, y },
      { x: x - Math.cos(heading) * length, y: y - Math.sin(heading) * length },
    ];
    this.layout();
  }

  // pass distance for a goal that must be reached, not circled around
  turnTowards(angle: number, dt: number, distance = Infinity) {
    const diff = wrapAngle(angle - this.heading);
    const rate = Math.max(
      TURN_RATE,
      (2.4 * SPEED * Math.abs(Math.sin(diff))) / distance,
    );
    this.turn(diff, rate * dt);
  }

  move(dt: number, bounds: Rectangle) {
    const minX = bounds.left + HEAD_RADIUS;
    const maxX = bounds.right - HEAD_RADIUS;
    const minY = bounds.top + HEAD_RADIUS;
    const maxY = bounds.bottom - HEAD_RADIUS;
    let dx = Math.cos(this.heading);
    let dy = Math.sin(this.heading);
    const seeX = this.x + dx * LOOKAHEAD;
    const seeY = this.y + dy * LOOKAHEAD;
    const awayX = (seeX < minX && dx < 0) || (seeX > maxX && dx > 0) ? -dx : dx;
    const awayY = (seeY < minY && dy < 0) || (seeY > maxY && dy > 0) ? -dy : dy;
    if (awayX !== dx || awayY !== dy) {
      // twice the steering rate, so steering into an edge can't win
      const diff = wrapAngle(Math.atan2(awayY, awayX) - this.heading);
      this.turn(diff, 2 * TURN_RATE * dt);
      dx = Math.cos(this.heading);
      dy = Math.sin(this.heading);
    }
    this.trail.unshift({
      x: clamp(this.x + dx * SPEED * dt, minX, maxX),
      y: clamp(this.y + dy * SPEED * dt, minY, maxY),
    });
    this.layout();
  }

  private turn(diff: number, max: number) {
    this.heading = wrapAngle(this.heading + clamp(diff, -max, max));
  }

  private layout() {
    const { trail, parts } = this;
    parts[0].position.copyFrom(trail[0]);
    let i = 0;
    let walked = 0;
    for (let n = 1; n < parts.length; n++) {
      const wanted = n * SPACING;
      while (i + 1 < trail.length) {
        const gap = distance(trail[i], trail[i + 1]);
        if (walked + gap >= wanted) break;
        walked += gap;
        i++;
      }
      const a = trail[i];
      const b = trail[i + 1] ?? a;
      const gap = distance(a, b);
      const t = gap > 0 ? (wanted - walked) / gap : 0;
      parts[n].position.set(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
    }
    trail.length = Math.min(trail.length, i + 2);

    face(this.head, this.heading);
    const ahead = parts[parts.length - 2];
    face(this.tail, Math.atan2(ahead.y - this.tail.y, ahead.x - this.tail.x));
  }
}

// pictures look to the right; heading left mirrors them instead of turning them upside down
function face(sprite: Sprite, angle: number) {
  sprite.rotation = angle;
  sprite.scale.y = Math.cos(angle) < 0 ? -1 : 1;
}

const distance = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y);

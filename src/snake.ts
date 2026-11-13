import { Container, Rectangle, Sprite } from "pixi.js";
import { art } from "./art";
import { clamp, wrapAngle } from "./math";

// art pixels per second
const SPEED = 50;
// radians per second
const TURN_RATE = 4;
// art pixels between the centres of neighbouring parts, at size 1
const SPACING = 8;
// art pixels, at size 1
const HEAD_RADIUS = 7;
// art pixels ahead of the head where an edge makes the snake turn away
const LOOKAHEAD = 16;
// size 1 shows the pictures at their own size
const START_SIZE = 0.6;
// size factor for every part gained
const GROWTH = 1.05;

type Point = { x: number; y: number };

export class Snake {
  readonly view = new Container();
  heading = 0;
  private size = START_SIZE;
  private head = new Sprite(art("head"));
  private tail = new Sprite(art("tail"));
  private parts = [this.head, this.tail];
  // where the head has been, newest first
  private trail: Point[] = [];

  constructor(bodyLength: number) {
    this.head.anchor.set(0.5);
    this.tail.anchor.set(0.5);
    this.view.addChild(this.tail, this.head);
    for (let i = 0; i < bodyLength; i++) this.addPart();
  }

  grow() {
    this.addPart();
    this.size *= GROWTH;
  }

  get x() {
    return this.head.x;
  }

  get y() {
    return this.head.y;
  }

  get radius() {
    return HEAD_RADIUS * this.size;
  }

  // spots at least this far from the edges can be reached without turning away
  get edgeMargin() {
    return this.radius + LOOKAHEAD;
  }

  placeAt(x: number, y: number, heading: number) {
    this.heading = heading;
    const length = (this.parts.length - 1) * SPACING * this.size;
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
    const minX = bounds.left + this.radius;
    const maxX = bounds.right - this.radius;
    const minY = bounds.top + this.radius;
    const maxY = bounds.bottom - this.radius;
    let dx = Math.cos(this.heading);
    let dy = Math.sin(this.heading);
    const seeX = this.x + dx * LOOKAHEAD;
    const seeY = this.y + dy * LOOKAHEAD;
    if (seeX < minX || seeX > maxX || seeY < minY || seeY > maxY) {
      const toMiddle = Math.atan2(
        bounds.y + bounds.height / 2 - this.y,
        bounds.x + bounds.width / 2 - this.x,
      );
      // twice the steering rate, so steering into an edge can't win
      this.turn(wrapAngle(toMiddle - this.heading), 2 * TURN_RATE * dt);
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

  // the tail stays put until the body has stretched out to make room
  private addPart() {
    const part = new Sprite(art("body"));
    part.anchor.set(0.5);
    part.position.copyFrom(this.tail.position);
    this.parts.splice(-1, 0, part);
    this.view.addChildAt(part, 1);
  }

  private layout() {
    const { trail, parts, size } = this;
    parts[0].position.copyFrom(trail[0]);
    let i = 0;
    let walked = 0;
    for (let n = 1; n < parts.length; n++) {
      const wanted = n * SPACING * size;
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
      parts[n].scale.set(size);
    }
    trail.length = Math.min(trail.length, i + 2);

    face(this.head, this.heading, size);
    const ahead = parts[parts.length - 2];
    const { tail } = this;
    face(tail, Math.atan2(ahead.y - tail.y, ahead.x - tail.x), size);
  }
}

// pictures look to the right; heading left mirrors them instead of turning them upside down
function face(sprite: Sprite, angle: number, size: number) {
  sprite.rotation = angle;
  sprite.scale.set(size, Math.cos(angle) < 0 ? -size : size);
}

const distance = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y);

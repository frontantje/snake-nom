import { Container, Rectangle, Sprite } from "pixi.js";
import { art, type ArtName } from "./art";
import { angleTo, clamp, distance, type Point, wrapAngle } from "./math";

// art pixels per second
const SPEED = 50;
// radians per second
const TURN_RATE = 4;
// art pixels between the centres of neighbouring parts, at size 1
const SPACING = 8;
// art pixels, at size 1
const HEAD_RADIUS = 7;
const BODY_RADIUS = 6;
// art pixels ahead of the head where an edge makes the snake turn away
export const LOOKAHEAD = 16;
const START_LENGTH = 5;
// size 1 shows the pictures at their own size
const START_SIZE = 0.6;
// size factor for every body part gained or lost
const GROWTH = 1.05;
// seconds after a bite in which the bitten snake can't bite or be bitten
const SAFE_TIME = 0.5;

export type Skin = { head: ArtName; body: ArtName; tail: ArtName };

const GREEN: Skin = { head: "head", body: "body", tail: "tail" };

export class Snake {
  readonly view = new Container();
  heading = 0;
  private skin: Skin;
  // art pixels per second
  private speed: number;
  private head: Sprite;
  private tail: Sprite;
  private parts: Sprite[];
  // where the head has been, newest first
  private trail: Point[] = [];
  private safeFor = 0;

  // speed 1 is the player's
  constructor({ skin = GREEN, speed = 1, length = START_LENGTH } = {}) {
    this.skin = skin;
    this.speed = SPEED * speed;
    this.head = centred(new Sprite(art(skin.head)));
    this.tail = centred(new Sprite(art(skin.tail)));
    this.parts = [this.head, this.tail];
    this.view.addChild(this.tail, this.head);
    for (let i = 0; i < length; i++) this.addPart();
  }

  get x() {
    return this.head.x;
  }

  get y() {
    return this.head.y;
  }

  get destroyed() {
    return this.view.destroyed;
  }

  // head to tail, without either
  get body(): readonly Sprite[] {
    return this.parts.slice(1, -1);
  }

  get bodyCount() {
    return this.parts.length - 2;
  }

  get size() {
    return START_SIZE * GROWTH ** (this.bodyCount - START_LENGTH);
  }

  get radius() {
    return HEAD_RADIUS * this.size;
  }

  get partRadius() {
    return BODY_RADIUS * this.size;
  }

  // spots at least this far from the edges can be reached without turning away
  get edgeMargin() {
    return this.radius + LOOKAHEAD;
  }

  get safe() {
    return this.safeFor > 0;
  }

  grow(parts = 1) {
    for (let i = 0; i < parts; i++) this.addPart();
    this.layout();
  }

  biteOff(part: number) {
    this.parts.splice(part + 1, 1)[0].destroy();
    this.safeFor = SAFE_TIME;
    this.layout();
  }

  // the body part closest to point, if one is nearer than reach
  partAt(point: Point, reach: number) {
    let found = -1;
    let nearest = reach;
    this.body.forEach((part, i) => {
      const away = distance(part, point);
      if (away < nearest) [found, nearest] = [i, away];
    });
    return found;
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

  // keeps the snake's place on a resized screen
  remap(map: (point: Point) => Point) {
    this.trail = this.trail.map(map);
    this.layout();
  }

  // pass distance for a goal that must be reached, not circled around
  turnTowards(angle: number, dt: number, distance = Infinity) {
    const diff = wrapAngle(angle - this.heading);
    const rate = Math.max(
      TURN_RATE,
      (2.4 * this.speed * Math.abs(Math.sin(diff))) / distance,
    );
    this.turn(diff, rate * dt);
  }

  move(dt: number, bounds: Rectangle) {
    const room = bounds.clone().pad(-this.radius);
    let dx = Math.cos(this.heading);
    let dy = Math.sin(this.heading);
    if (!room.contains(this.x + dx * LOOKAHEAD, this.y + dy * LOOKAHEAD)) {
      const middle = {
        x: bounds.x + bounds.width / 2,
        y: bounds.y + bounds.height / 2,
      };
      // twice the steering rate, so steering into an edge can't win
      const diff = wrapAngle(angleTo(this, middle) - this.heading);
      this.turn(diff, 2 * TURN_RATE * dt);
      dx = Math.cos(this.heading);
      dy = Math.sin(this.heading);
    }
    this.trail.unshift({
      x: clamp(this.x + dx * this.speed * dt, room.left, room.right),
      y: clamp(this.y + dy * this.speed * dt, room.top, room.bottom),
    });
    this.safeFor = Math.max(0, this.safeFor - dt);
    this.view.alpha = this.safe && Math.floor(this.safeFor * 8) % 2 ? 0.4 : 1;
    this.layout();
  }

  private turn(diff: number, max: number) {
    this.heading = wrapAngle(this.heading + clamp(diff, -max, max));
  }

  private addPart() {
    const part = centred(new Sprite(art(this.skin.body)));
    this.parts.splice(-1, 0, part);
    this.view.addChildAt(part, 1);
  }

  private layout() {
    const { trail, parts, size, head, tail } = this;
    head.position.copyFrom(trail[0]);
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
      // parts past the trail's end wait there, so the tail stays put while the snake grows
      const b = trail[i + 1] ?? a;
      const gap = distance(a, b);
      const t = gap > 0 ? (wanted - walked) / gap : 0;
      parts[n].position.set(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
      parts[n].scale.set(size);
    }
    trail.length = Math.min(trail.length, i + 2);

    face(head, this.heading, size);
    const ahead = parts[parts.length - 2];
    // right after a bite, the new part and the tail share a spot
    const angle =
      distance(ahead, tail) > 0.5 ? angleTo(tail, ahead) : tail.rotation;
    face(tail, angle, size);
  }
}

function centred(sprite: Sprite) {
  sprite.anchor.set(0.5);
  return sprite;
}

// pictures look to the right; heading left mirrors them instead of turning them upside down
function face(sprite: Sprite, angle: number, size: number) {
  sprite.rotation = angle;
  sprite.scale.set(size, Math.cos(angle) < 0 ? -size : size);
}

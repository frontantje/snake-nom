import { Container, FederatedPointerEvent, Rectangle, Sprite } from "pixi.js";
import { art, FOOD_RADIUS } from "./art";
import type { Direction, Input } from "./input";
import { makeLabel, sizeLabel } from "./label";
import { Marker } from "./marker";
import { angleTo, clamp, distance, type Point, random } from "./math";
import { Rival } from "./rival";
import type { Scene } from "./scene";
import { LOOKAHEAD, type Skin, Snake } from "./snake";

const KEY_ANGLE: Record<Direction, number> = {
  right: 0,
  down: Math.PI / 2,
  left: Math.PI,
  up: -Math.PI / 2,
};

// art pixels from a tapped spot that count as having reached it
const ARRIVED = 3;
const FOOD_COUNT = 10;
// art pixels kept free between two dots, when there's room
const FOOD_GAP = 14;
// a tap on a dot this far from the edges brings any snake's head within reach
const FOOD_MARGIN = LOOKAHEAD;
const RIVALS = 1;
// compared to the player's speed
const RIVAL_SPEED = 0.8;
const RIVAL_SKINS: Skin[] = [
  { head: "redHead", body: "redBody", tail: "redTail" },
  { head: "blueHead", body: "blueBody", tail: "blueTail" },
  { head: "pinkHead", body: "pinkBody", tail: "pinkTail" },
];
// seconds after a round ends before a tap starts a new one instead of steering
const RESTART_DELAY = 1;

export class Arena implements Scene {
  readonly view = new Container();
  private world = new Container();
  private food = new Container<Sprite>();
  private player: Snake | null = new Snake();
  private rivals: Rival[];
  private marker = new Marker();
  private banner = makeLabel();
  private target: Point | null = null;
  private steeringPointer: number | null = null;
  private bounds = new Rectangle();
  private placed = false;
  // seconds since the round ended
  private overFor: number | null = null;

  constructor(
    private input: Input,
    private newRound: () => void,
    rivals = RIVALS,
  ) {
    this.rivals = Array.from({ length: rivals }, (_, i) => {
      const skin = RIVAL_SKINS[i % RIVAL_SKINS.length];
      return new Rival(new Snake({ skin, speed: RIVAL_SPEED }));
    });
    // the player's snake comes last, so it's drawn on top
    this.world.addChild(this.food, ...this.snakes.map((snake) => snake.view));
    this.banner.anchor.set(0.5);
    this.banner.visible = false;
    this.view.addChild(this.world, this.marker.view, this.banner);

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
    const { snakes } = this;
    this.steer(dt);
    for (const rival of this.rivals) {
      rival.update(dt, this.food.children, snakes);
    }
    for (const snake of snakes) snake.move(dt, this.bounds);
    this.marker.update(dt, this.player, this.world);
    if (this.overFor === null) {
      this.eat();
      this.fight();
      this.checkForEnd();
    } else {
      this.overFor += dt;
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
      for (const snake of this.snakes) snake.remap(map);
    } else {
      this.placeSnakes();
      this.scatterFood();
      this.placed = true;
    }
    sizeLabel(this.banner, 10 * scale);
    this.banner.position.set(width / 2, height / 2);
    this.marker.resize(scale);
  }

  private get snakes() {
    const rivals = this.rivals.map((rival) => rival.snake);
    return this.player ? [...rivals, this.player] : rivals;
  }

  private get canRestart() {
    return (this.overFor ?? 0) > RESTART_DELAY;
  }

  // the player in the middle, the rivals around it, circling
  private placeSnakes() {
    const { width, height } = this.bounds;
    this.player?.placeAt(width / 2, height / 2, 0);
    this.rivals.forEach((rival, i) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / this.rivals.length;
      rival.snake.placeAt(
        width / 2 + (Math.cos(angle) * width) / 3,
        height / 2 + (Math.sin(angle) * height) / 3,
        angle + Math.PI / 2,
      );
    });
  }

  private steer(dt: number) {
    const { player, target } = this;
    if (!player) return;
    const direction = this.input.direction;
    if (direction) {
      this.target = null;
      player.turnTowards(KEY_ANGLE[direction], dt);
    } else if (target) {
      const away = distance(player, target);
      if (away >= ARRIVED) {
        player.turnTowards(angleTo(player, target), dt, away);
      } else if (this.steeringPointer === null) {
        // a held finger stays the goal, so the snake loops back through it
        this.target = null;
      }
    }
  }

  private eat() {
    for (const snake of this.snakes) {
      const reach = snake.radius + FOOD_RADIUS;
      for (const dot of [...this.food.children]) {
        if (distance(dot, snake) < reach) {
          dot.destroy();
          snake.grow();
        }
      }
    }
  }

  // a head bites one part off any body it touches; a snake without a body is eaten whole
  private fight() {
    for (const attacker of this.snakes) {
      for (const victim of this.snakes) {
        if (attacker.destroyed || victim.destroyed) continue;
        if (victim === attacker || victim.safe || attacker.safe) continue;
        const reach = attacker.radius / 2;
        if (victim.bodyCount > 0) {
          const hit = victim.partAt(attacker, victim.partRadius + reach);
          if (hit >= 0) {
            victim.biteOff(hit);
            attacker.grow();
          }
        } else if (distance(attacker, victim) < victim.radius + reach) {
          attacker.grow();
          this.remove(victim);
        }
      }
    }
  }

  private remove(snake: Snake) {
    snake.view.destroy({ children: true });
    if (snake === this.player) {
      this.player = null;
      this.end("Oh nein, gefressen!");
    } else {
      this.rivals = this.rivals.filter((rival) => rival.snake !== snake);
    }
  }

  // once the dots are gone, the longest snake wins
  private checkForEnd() {
    if (!this.player || this.food.children.length > 0) return;
    const longest = Math.max(0, ...this.rivals.map((r) => r.snake.bodyCount));
    this.end(
      this.player.bodyCount >= longest ? "Gewonnen!" : "Leider zu kurz!",
    );
  }

  private end(message: string) {
    if (this.overFor !== null) return;
    this.overFor = 0;
    this.banner.text = `${message}\nNochmal? Tippen!`;
    this.banner.visible = true;
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
      // the heads count too, or a dot could be eaten right away
      const crowded =
        this.snakes.some((snake) => distance(snake, spot) < FOOD_GAP) ||
        this.food.children.some((dot) => distance(dot, spot) < FOOD_GAP);
      if (!crowded) break;
    }
    return spot;
  }

  private aimAt(e: FederatedPointerEvent) {
    if (!this.player) return;
    const { x, y } = this.world.toLocal(e.global);
    const { width, height } = this.bounds;
    const margin = this.player.edgeMargin;
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

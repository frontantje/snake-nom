import { angleTo, distance, type Point, random } from "./math";
import type { Snake } from "./snake";

// seconds between choosing a goal
const THINK_TIME = 0.8;
// art pixels added to every distance, so a rival's likes count for more than a few pixels
const HEADSTART = 20;
// eating a head ends that snake, which is worth more than its single part
const HEAD_WORTH = 2;

export type Goal = Point & { readonly destroyed: boolean };

// a computer snake that goes for dots or for other snakes
export class Rival {
  private goal: Goal | null = null;
  private thinkIn = 0;
  // every rival likes dots and fighting a bit differently
  private appetite = random(0.5, 1.5);
  private aggression = random(0.2, 1);
  // left alone until this rival has eaten a dot or bitten another snake
  private lastBitten: Snake | null = null;

  constructor(readonly snake: Snake) {}

  // victim is the snake it bit, or null for a dot
  ate(victim: Snake | null) {
    this.lastBitten = victim;
    this.goal = null;
  }

  update(dt: number, dots: readonly Goal[], snakes: readonly Snake[]) {
    this.thinkIn -= dt;
    if (this.thinkIn <= 0 || !this.goal || this.goal.destroyed) {
      this.goal = this.choose(dots, snakes);
      this.thinkIn = THINK_TIME;
    }
    if (this.goal) {
      const away = Math.max(distance(this.snake, this.goal), 1);
      this.snake.turnTowards(angleTo(this.snake, this.goal), dt, away);
    }
  }

  // the goal worth the most body parts for its distance
  private choose(dots: readonly Goal[], snakes: readonly Snake[]) {
    const options: [Goal, number][] = dots.map((dot) => [dot, this.appetite]);
    for (const other of snakes) {
      if (other === this.snake || other === this.lastBitten || other.safe) {
        continue;
      }
      const { body } = other;
      if (body.length === 0)
        options.push([other, HEAD_WORTH * this.aggression]);
      for (const part of body) options.push([part, this.aggression]);
    }
    let best: Goal | null = null;
    let bestScore = 0;
    for (const [goal, worth] of options) {
      const score = worth / (distance(this.snake, goal) + HEADSTART);
      if (score > bestScore) [best, bestScore] = [goal, score];
    }
    return best;
  }
}

import type { Snake } from "./snake";

export const DT = 1 / 60;

// bites off every body part
export function strip(snake: Snake) {
  while (snake.bodyCount > 0) snake.biteOff(0);
}

// the same "random" numbers on every run, so a failing test can be repeated
export function seeded(seed: number) {
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
}

export type Point = { x: number; y: number };

export const random = (min: number, max: number) =>
  min + Math.random() * (max - min);

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const distance = (a: Point, b: Point) =>
  Math.hypot(b.x - a.x, b.y - a.y);

export const angleTo = (from: Point, to: Point) =>
  Math.atan2(to.y - from.y, to.x - from.x);

// the same angle, between -π and π
export const wrapAngle = (angle: number) =>
  Math.atan2(Math.sin(angle), Math.cos(angle));

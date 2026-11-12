export const random = (min: number, max: number) =>
  min + Math.random() * (max - min);

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

// the same angle, between -π and π
export const wrapAngle = (angle: number) =>
  Math.atan2(Math.sin(angle), Math.cos(angle));

import type { Container } from "pixi.js";

export interface Scene {
  readonly view: Container;
  // dt in seconds
  update(dt: number): void;
  // scale: screen pixels per art pixel
  resize(width: number, height: number, scale: number): void;
}

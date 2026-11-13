export const DT = 1 / 60;

// the same "random" numbers on every run, so a failing test can be repeated
export function seeded(seed: number) {
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
}

export type Level = {
  rivals: number;
  // compared to the player's speed
  rivalSpeed: number;
  dots: number;
};

// level 1 first; how these were chosen is in BALANCING.md
export const LEVELS: readonly Level[] = [
  { rivals: 1, rivalSpeed: 0.65, dots: 10 },
  { rivals: 2, rivalSpeed: 0.65, dots: 10 },
  { rivals: 2, rivalSpeed: 0.67, dots: 12 },
  { rivals: 2, rivalSpeed: 0.69, dots: 14 },
  { rivals: 3, rivalSpeed: 0.71, dots: 16 },
  { rivals: 3, rivalSpeed: 0.73, dots: 18 },
  { rivals: 3, rivalSpeed: 0.75, dots: 20 },
  { rivals: 4, rivalSpeed: 0.77, dots: 22 },
  { rivals: 4, rivalSpeed: 0.79, dots: 24 },
  { rivals: 4, rivalSpeed: 0.81, dots: 26 },
];

export const LAST_LEVEL = LEVELS.length;

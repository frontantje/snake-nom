export type Level = {
  rivals: number;
  // compared to the player's speed
  rivalSpeed: number;
  // on the field at once; every eaten dot comes back somewhere else
  dots: number;
  // how long a round lasts; the biggest snake at the end wins
  seconds: number;
};

// level 1 first; how these were chosen is in BALANCING.md
export const LEVELS: readonly Level[] = [
  { rivals: 1, rivalSpeed: 0.65, dots: 10, seconds: 30 },
  { rivals: 2, rivalSpeed: 0.65, dots: 10, seconds: 30 },
  { rivals: 2, rivalSpeed: 0.67, dots: 12, seconds: 35 },
  { rivals: 2, rivalSpeed: 0.69, dots: 14, seconds: 40 },
  { rivals: 3, rivalSpeed: 0.71, dots: 16, seconds: 45 },
  { rivals: 3, rivalSpeed: 0.73, dots: 18, seconds: 50 },
  { rivals: 3, rivalSpeed: 0.75, dots: 20, seconds: 55 },
  { rivals: 4, rivalSpeed: 0.77, dots: 22, seconds: 60 },
  { rivals: 4, rivalSpeed: 0.79, dots: 24, seconds: 65 },
  { rivals: 4, rivalSpeed: 0.81, dots: 26, seconds: 70 },
];

export const LAST_LEVEL = LEVELS.length;

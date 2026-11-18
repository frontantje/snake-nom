import { LAST_LEVEL } from "./levels";
import { clamp } from "./math";

const KEY = "snake-nom:completed";

// which levels are won, kept in the browser between visits
export class Progress {
  private best = load();

  // the highest level won so far, 0 before the first win
  get completed() {
    return this.best;
  }

  get unlocked() {
    return Math.min(this.best + 1, LAST_LEVEL);
  }

  // returns the level to offer next
  finish(level: number, won: boolean) {
    // another tab may have won more levels in the meantime
    this.best = Math.max(this.best, load());
    if (won && level > this.best) {
      this.best = level;
      save(level);
    }
    return won ? Math.min(level + 1, LAST_LEVEL) : level;
  }
}

function load() {
  try {
    const saved = Number(localStorage.getItem(KEY));
    return Number.isInteger(saved) ? clamp(saved, 0, LAST_LEVEL) : 0;
  } catch {
    return 0;
  }
}

function save(level: number) {
  try {
    localStorage.setItem(KEY, String(level));
  } catch {
    // e.g. in private browsing: the game still works, it just won't remember
  }
}

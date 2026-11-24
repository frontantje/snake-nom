# Balancing notes

Everything that makes Snake Nom easier or harder, where it lives in the code, and what we've
learned from play tests so far.

To try a change, edit the number while `npm run dev` is running; the game reloads by itself.
Afterwards run `npm test`. The tests check rules (e.g. "a bite takes one part"), not exact
numbers, so they should keep passing. If one fails after a tuning change, check whether a rule
broke or a test just assumed the old number.

Distances are in art pixels: the screen shows at least 160 of them along its shorter side.

## Where things stand (after v0.4.0)

There are 10 levels. As a first step against "quite hard" (v0.3.0), the rival in level 1 is
slower: 0.65 of the player's speed instead of 0.8.

Since v0.4.0, a round lasts a set time instead of until the dots are gone, and eaten dots come
back right away. The biggest snake when the time is up wins. Not play-tested yet.

What made v0.3.0 hard, and is still true:

- A rival steers straight at its goal and picks a new one every 0.8 s. When your body is the
  nearest thing worth having, it comes for you.
- Every bite is +1 for one snake and −1 for the other, so a single bite is a two-part swing in
  "who's biggest".
- Rivals are slower, but their turning circle is smaller (see `TURN_RATE`), so in a tight chase
  they're the more nimble ones.

## Levels

All in `LEVELS` in `src/levels.ts`, one line per level:

| Level | Rivals | Rival speed | Dots | Seconds |
| ----- | ------ | ----------- | ---- | ------- |
| 1     | 1      | 0.65        | 10   | 30      |
| 2     | 2      | 0.65        | 10   | 30      |
| 3     | 2      | 0.67        | 12   | 35      |
| 4     | 2      | 0.69        | 14   | 40      |
| 5     | 3      | 0.71        | 16   | 45      |
| 6     | 3      | 0.73        | 18   | 50      |
| 7     | 3      | 0.75        | 20   | 55      |
| 8     | 4      | 0.77        | 22   | 60      |
| 9     | 4      | 0.79        | 24   | 65      |
| 10    | 4      | 0.81        | 26   | 70      |

- **Rivals:** they get red, blue, pink and orange, in that order. A fifth rival would repeat red,
  so add a skin in `src/arena.ts` (and `src/art.ts`) before going past 4.
- **Rival speed:** compared to the player's.
- **Dots:** how many are on the field at once. An eaten dot comes back somewhere else right
  away, so there's always this many. More rivals need more dots to share.
- **Seconds:** how long a round lasts. When the time is up, the biggest snake wins. The clock
  at the top turns red for the last 5 seconds (`HURRY` in `src/arena.ts`).

The rules behind the table are tested in `src/levels.test.ts`:

- a rival joins at levels 2, 5 and 8
- level 2 changes nothing else
- from level 3, speed, dots and seconds go up every level
- level 1 is slower than v0.3.0 and lasts 30 seconds
- rivals stay slower than the player

Changing numbers within these rules keeps the tests green. Changing a rule means changing its
test too.

## The values

### The rivals

| Value        | Now     | File           | What it does                                                                                           | Easier if…   |
| ------------ | ------- | -------------- | ------------------------------------------------------------------------------------------------------ | ------------ |
| `aggression` | 0.2–1   | `src/rival.ts` | How much a rival wants to bite another snake. Each rival gets a random value in this range.            | lower range  |
| `appetite`   | 0.5–1.5 | `src/rival.ts` | How much a rival wants a dot. Random per rival, like `aggression`.                                     | higher range |
| `THINK_TIME` | 0.8 s   | `src/rival.ts` | How often a rival picks a new goal; it also picks one when its goal is gone.                           | higher       |
| `HEADSTART`  | 20      | `src/rival.ts` | Added to every distance when a rival compares goals. Bigger means its likes matter more than distance. | depends      |
| `HEAD_WORTH` | 2       | `src/rival.ts` | How much a bodiless snake's head is worth compared to one body part.                                   | lower        |

How many rivals there are and how fast they are depends on the level (see above).

A rival scores every dot as `appetite / (distance + HEADSTART)` and every body part of another
snake as `aggression / (distance + HEADSTART)`, and goes for the highest score. It skips snakes
that are blinking after a bite, and the snake it bit last, until it has eaten a dot or bitten
another snake. It can still bite a snake again by accident when their paths cross.

### Fighting

| Value       | Now                                | File                      | What it does                                                                                                  |
| ----------- | ---------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `SAFE_TIME` | 0.5 s                              | `src/snake.ts`            | After a bite, the bitten snake blinks: it can't bite or be bitten. At most two bites per second on one snake. |
| Bite reach  | `partRadius + attacker radius / 2` | `src/arena.ts`, `fight()` | How close a head must get to a body part to bite it: about 5.7 at the start size.                             |
| Head reach  | `radius + attacker radius / 2`     | `src/arena.ts`, `fight()` | How close a head must get to a bodiless head to eat it.                                                       |

`SAFE_TIME` works the same for both sides: a longer one also protects the rivals from the player.

### Dots and the arena

| Value         | Now | File           | What it does                                                                                                                            |
| ------------- | --- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `FOOD_RADIUS` | 3   | `src/art.ts`   | Size of the dot. A head eats a dot within its own radius plus this (7.2 at the start).                                                  |
| `FOOD_GAP`    | 14  | `src/arena.ts` | Space kept between dots, and between a new dot and the heads.                                                                           |
| `MIN_VIEW`    | 160 | `src/main.ts`  | Art pixels at least visible along the shorter side. Bigger means a bigger arena with more room to get away, and smaller-looking snakes. |

The number of dots and the length of a round depend on the level (see above).

### Every snake

| Value                        | Now           | File           | What it does                                                                                                     |
| ---------------------------- | ------------- | -------------- | ---------------------------------------------------------------------------------------------------------------- |
| `SPEED`                      | 50 per second | `src/snake.ts` | Base speed. The player moves at this, rivals at their level's rival speed times this.                            |
| `TURN_RATE`                  | 4 rad/s       | `src/snake.ts` | How fast snakes turn. Turning circle = speed / `TURN_RATE`: 12.5 for the player, about 8 for a rival at level 1. |
| `START_LENGTH`               | 5             | `src/snake.ts` | Body parts at the start of a round.                                                                              |
| `START_SIZE`                 | 0.6           | `src/snake.ts` | Size at `START_LENGTH` parts.                                                                                    |
| `GROWTH`                     | 1.05          | `src/snake.ts` | Size factor per body part gained or lost.                                                                        |
| `HEAD_RADIUS`, `BODY_RADIUS` | 7, 6          | `src/snake.ts` | Head and body part size at size 1. Bigger means easier to bite and to be bitten.                                 |

## Things to try next

If level 1 is still too hard, roughly from cheapest to biggest change:

1. Lower `aggression` to about 0.1–0.5, so rivals mostly eat dots and only bite when you come
   close.
2. Raise `THINK_TIME` to about 1.2 s, so a quick turn shakes a rival off.
3. More dots or more seconds in the early levels, so there is more to eat and a lost bite matters less.
4. Ideas that need a bit of code:
   - Give the rivals a calm start: no biting for the first few seconds of a round.
   - Let the player's blinking last longer than the rivals'.
   - Let rivals avoid the player while they're smaller than the player.
   - Make `aggression` part of a level's settings, so later levels get bolder rivals.

## Play test log

| Version | Date       | Setup                                                             | Notes                                                                                                                                                                   |
| ------- | ---------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| pre-0.3 | 2026-11-13 | 3 rivals; a head cut through a body and took everything behind it | Unclear which snake was the player's. 3 rivals too many to start with. Tiny snakes cutting big ones and flipping the sizes felt wrong. → nibbling, 1 rival, start ring. |
| 0.3.0   | 2026-11-13 | 1 rival at 0.8 speed, aggression 0.2–1, 0.5 s safe time, 10 dots  | Better, but quite hard. → slower rival in level 1, levels.                                                                                                              |
| 0.4.0   |            | 10 levels, see the table; level 1: 1 rival at 0.65 speed, 10 dots |                                                                                                                                                                         |

# Balancing notes

Everything that makes Snake Nom easier or harder, where it lives in the code, and what we've
learned from play tests so far.

To try a change, edit the number while `npm run dev` is running; the game reloads by itself.
Afterwards run `npm test`. The tests check rules (e.g. "a bite takes one part"), not exact
numbers, so they should keep passing. If one fails after a tuning change, check whether a rule
broke or a test just assumed the old number.

Distances are in art pixels: the screen shows at least 160 of them along its shorter side.

## Where things stand (v0.3.0)

One red rival, nibbling fights, biggest snake wins when the dots are gone. Play test: better
than before, but quite hard.

Likely reasons:

- The rival steers straight at its goal and picks a new one every 0.8 s. When your body is the
  nearest thing worth having, it comes for you.
- Every bite is +1 for one snake and −1 for the other, so a single bite is a two-part swing in
  "who's biggest".
- The rival is slower, but its turning circle is smaller (see `TURN_RATE`), so in a tight chase
  it's the more nimble one.

## The values

### The rival

| Value         | Now     | File           | What it does                                                                                           | Easier if…   |
| ------------- | ------- | -------------- | ------------------------------------------------------------------------------------------------------ | ------------ |
| `RIVALS`      | 1       | `src/arena.ts` | Number of rivals per round. They get red, blue and pink skins, in that order.                          | lower        |
| `RIVAL_SPEED` | 0.8     | `src/arena.ts` | Rival speed compared to the player's.                                                                  | lower        |
| `aggression`  | 0.2–1   | `src/rival.ts` | How much a rival wants to bite another snake. Each rival gets a random value in this range.            | lower range  |
| `appetite`    | 0.5–1.5 | `src/rival.ts` | How much a rival wants a dot. Random per rival, like `aggression`.                                     | higher range |
| `THINK_TIME`  | 0.8 s   | `src/rival.ts` | How often a rival picks a new goal; it also picks one when its goal is gone.                           | higher       |
| `HEADSTART`   | 20      | `src/rival.ts` | Added to every distance when a rival compares goals. Bigger means its likes matter more than distance. | depends      |
| `HEAD_WORTH`  | 2       | `src/rival.ts` | How much a bodiless snake's head is worth compared to one body part.                                   | lower        |

A rival scores every dot as `appetite / (distance + HEADSTART)` and every body part of another
snake as `aggression / (distance + HEADSTART)`, and goes for the highest score. Snakes that are
blinking after a bite are skipped.

### Fighting

| Value       | Now                                | File                      | What it does                                                                                                  |
| ----------- | ---------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `SAFE_TIME` | 0.5 s                              | `src/snake.ts`            | After a bite, the bitten snake blinks: it can't bite or be bitten. At most two bites per second on one snake. |
| Bite reach  | `partRadius + attacker radius / 2` | `src/arena.ts`, `fight()` | How close a head must get to a body part to bite it: about 5.7 at the start size.                             |
| Head reach  | `radius + attacker radius / 2`     | `src/arena.ts`, `fight()` | How close a head must get to a bodiless head to eat it.                                                       |

`SAFE_TIME` works the same for both sides: a longer one also protects the rival from the player.

### Dots and rounds

| Value         | Now | File           | What it does                                                                                                                            |
| ------------- | --- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `FOOD_COUNT`  | 10  | `src/arena.ts` | Dots per round. The round ends when they're gone, so this sets the round length.                                                        |
| `FOOD_RADIUS` | 3   | `src/art.ts`   | Size of the dot. A head eats a dot within its own radius plus this (7.2 at the start).                                                  |
| `FOOD_GAP`    | 14  | `src/arena.ts` | Space kept between dots, and between dots and heads at the start.                                                                       |
| `MIN_VIEW`    | 160 | `src/main.ts`  | Art pixels at least visible along the shorter side. Bigger means a bigger arena with more room to get away, and smaller-looking snakes. |

### Every snake

| Value                        | Now           | File           | What it does                                                                                       |
| ---------------------------- | ------------- | -------------- | -------------------------------------------------------------------------------------------------- |
| `SPEED`                      | 50 per second | `src/snake.ts` | Base speed. The player moves at this, rivals at `RIVAL_SPEED` times this.                          |
| `TURN_RATE`                  | 4 rad/s       | `src/snake.ts` | How fast snakes turn. Turning circle = speed / `TURN_RATE`: 12.5 for the player, 10 for the rival. |
| `START_LENGTH`               | 5             | `src/snake.ts` | Body parts at the start of a round.                                                                |
| `START_SIZE`                 | 0.6           | `src/snake.ts` | Size at `START_LENGTH` parts.                                                                      |
| `GROWTH`                     | 1.05          | `src/snake.ts` | Size factor per body part gained or lost.                                                          |
| `HEAD_RADIUS`, `BODY_RADIUS` | 7, 6          | `src/snake.ts` | Head and body part size at size 1. Bigger means easier to bite and to be bitten.                   |

## Things to try first

For "quite hard", roughly from cheapest to biggest change:

1. Lower `aggression` to about 0.1–0.5, so the rival mostly eats dots and only bites when you
   come close.
2. Raise `THINK_TIME` to about 1.2 s, so a quick turn shakes the rival off.
3. Lower `RIVAL_SPEED` to about 0.7.
4. Raise `FOOD_COUNT` to about 15, so a round lasts longer and a lost bite matters less.
5. Ideas that need a bit of code:
   - Give the rival a calm start: no biting for the first few seconds of a round.
   - Let the player's blinking last longer than the rival's.
   - Let the rival avoid the player while it's smaller than the player.

## Level curve

Values that would make natural steps from one level to the next: `RIVALS` (1, then 2, then 3),
`RIVAL_SPEED`, the `aggression` range and `FOOD_COUNT`. `new Arena(input, newRound, rivals)`
already takes the number of rivals; the other values would need to become arguments the same
way.

## Play test log

| Version | Date       | Setup                                                             | Notes                                                                                                                                                                   |
| ------- | ---------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| pre-0.3 | 2026-11-13 | 3 rivals; a head cut through a body and took everything behind it | Unclear which snake was the player's. 3 rivals too many to start with. Tiny snakes cutting big ones and flipping the sizes felt wrong. → nibbling, 1 rival, start ring. |
| 0.3.0   | 2026-11-13 | 1 rival at 0.8 speed, aggression 0.2–1, 0.5 s safe time, 10 dots  | Better, but quite hard.                                                                                                                                                 |

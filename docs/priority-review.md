# Priority Review

This is a review of `docs/running-ideas.md` against the current state of the app. The original list is still directionally good, but the prototype has moved: the game now has a single playable Cannon Ship, Cannon Charge, a fixed 7-encounter run, events, ports, elites, a boss, crew, card rewards, status cards, and some combat readability UI.

## Current Prototype Read

The best current strategy is still: make one ship/run fun before adding breadth. The Cannon Ship is close enough now that the highest-value work is not "more systems"; it is tightening the run loop around the Cannon Charge decision:

- Setup should feel tempting but risky.
- Spending charges should feel strong but not automatic.
- Enemies should attack the charge plan directly.
- Events should create real run-shaping consequences.
- Rewards should help the player decide whether they are building toward loading, payoff, defense, or disruption.

## Recommended Priority Order

### P0. Cannon Ship Balance And Combat Feel

Status: In progress, still the main priority.

Why it ranks first:

- This is the core fun test.
- The ship now has a real mechanic, but tuning is still fragile.
- Small number changes and enemy pressure will teach more than adding another subsystem.

Best next work:

- Tune starter deck counts, charge gain, and charge payoff.
- Watch whether `Load Cannons`, `Quick Load`, and `Ammo Cache` make charge too easy.
- Make sure `Fire Cannons` is useful at 2-3 charge but not always correct at 5.
- Give the player more reasons to sometimes hold charge and sometimes spend it.

Definition of done:

- A full fixed run can be won or lost based on tactical choices, not just lucky draw order.
- Charge turns create a clear "do I defend, load, or fire?" decision.

### P1. Enemy Variety And Pressure

Status: Partially implemented, should be next.

Why it ranks above events now:

- The app already has a fixed run order and a first boss/elite structure.
- If battles are flat, events and rewards cannot carry the game.
- The Saboteur and strength-scaling elites are a good start, but the Cannon Ship needs more targeted pressure.

Best next work:

- Add one more normal enemy that pressures block or energy.
- Add one more charge-disruption tool besides `Misfire`.
- Make elites more mechanically distinct: one scaler, one disruptor.
- Add boss actions that create a clear phase two problem other than "more damage."

Good enemy ideas:

- An enemy that steals or drains Cannon Charge.
- An enemy that punishes holding max charge.
- An enemy that adds more than one status card if ignored.
- A boss phase that forces frequent smaller spending instead of one huge payoff.

### P2. Event System Expansion

Status: Implemented but still too generous.

Why it remains high:

- Events are already in the run, so improving them has immediate value.
- The current event system supports HP loss, card gain, healing, card removal, and crew rewards.
- Most events still feel like "choose a reward" rather than "choose a consequence."

Best next work:

- Add persistent curses or negative cards as event costs.
- Add event outcomes that affect the next battle or rest of run.
- Make at least one event choice clearly risky but exciting.

Recommended first additions:

- Add a persistent curse card type to the master deck.
- Add event effects for "gain card plus curse" and "next battle starts with Weak/Vulnerable."
- Add an event that offers a powerful Cannon card in exchange for a `Misfire` or new curse.

### P3. Reward And Card Pool Tuning

Status: Working, but needs focus.

Why it comes before new systems:

- The reward engine exists and already supports rarity, tags, and duplicate avoidance.
- The Cannon Ship needs enough reward cards to support a few small build directions.
- More cards are useful only if they clarify choices.

Best next work:

- Split Cannon rewards into load, payoff, defense, and control roles.
- Add 3-5 cards that interact with charge in different ways.
- Keep reward pool small enough that playtest feedback is readable.

Good near-term cards:

- Spend 1 charge, gain block.
- If charge is exactly 0, draw or gain energy.
- Convert block into charge.
- Apply Vulnerable if charge was spent this turn.

### P4. Crew System Polish

Status: Implemented, but currently a secondary build layer.

Why not higher:

- Crew already exists and works as a relic-like system.
- It can deepen runs, but it should not become the main source of fun before the Cannon Ship is tuned.

Best next work:

- Add crew tradeoffs only after the base crew feels too bland.
- Add one Cannon-specific crew member that changes charge math.
- Make elite/event crew rewards feel special.

Possible crew additions:

- Start with +1 charge but max charge is reduced by 1.
- First time you spend charge each battle, gain block.
- Cannon cards apply 1 Weak, but attacks cost +1 energy on the first turn.

### P5. Persistent Run Modifiers

Status: Good idea, but wait until events need more bite.

Why it moves up from experimental:

- The run is fixed-length now, which makes short-term modifiers easy to reason about.
- This is a natural extension of events and sea conditions.

Best first version:

- Add a simple `runModifiers` array later.
- Start with one-battle or next-two-battle modifiers only.
- Avoid permanent complicated modifiers until the core run is fun.

### P6. Ocean / Sea Conditions

Status: Still interesting, but no longer P0.

Why it drops:

- The current combat already has enough moving parts: charge, statuses, powers, status cards, elites, boss phase.
- A global modifier could muddy playtest feedback right now.

When to revisit:

- After battles feel too predictable.
- After event rewards need non-card consequences.

Best first version:

- Tie sea conditions to events or boss zones rather than every battle.
- Add one condition at a time.

### P7. Ship Maneuvering / Boarding

Status: Later.

Why:

- Boarding already exists as a card tag but not as a mechanic.
- A full maneuvering layer would compete with Cannon Charge for attention.

Recommendation:

- Keep boarding as card flavor and occasional effects for now.
- Do not build positional combat yet.

### P8. Tutorial / Onboarding

Status: Later, but track confusing UI.

Why:

- The app is changing quickly.
- A tutorial written now would go stale.

What to do instead:

- Keep improving combat readability: intent, pile modals, map modal, HP popups, resource display.
- Add inline clarity only when a mechanic repeatedly confuses playtests.

### P9. Ghost Run, Supply System, Spell System, Daily Runs, Accounts

Status: Defer.

Why:

- These are not bad ideas, but they are breadth.
- The current work should prove one satisfying local run first.

Do not build these until:

- The Cannon Ship run is consistently fun.
- There are enough cards/enemies/events to make repeated runs interesting.
- You know which mechanics players actually like.

## Suggested Next Three Implementation Tasks

1. Add event costs that create real downside.
2. Add one more charge-disrupting enemy or elite pattern.
3. Add 3-5 charge interaction cards that are not just "gain charge" or "spend all charge."

## One-Sentence Product Direction

Make the Cannon Ship run a tight, readable, seven-encounter roguelike prototype where every turn asks: load, defend, disrupt, or fire.

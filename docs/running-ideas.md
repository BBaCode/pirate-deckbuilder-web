# Idea Backlog And Priorities

This is the single working backlog for the game. It combines the original brainstorm with the current priority read from the playable Cannon Ship prototype.

## Current Product Direction

Make the Cannon Ship run a tight, readable, seven-encounter roguelike prototype where every turn asks:

- Load
- Defend
- Disrupt
- Fire

The current strategy is to make one ship/run genuinely fun before adding breadth. Avoid building multiple ships or big new subsystems until the Cannon Ship run has real tension.

## Current Prototype Read

The app now has:

- One playable ship: Cannon Ship.
- Cannon Charge as the main resource.
- A fixed seven-encounter run: battle, battle, event, battle, elite, port, boss.
- Normal enemies, elites, and a boss.
- Events, ports, card rewards, and crew rewards.
- Weak, Strength, Vulnerable, Misfire, powers, and status-card behavior.
- Combat readability UI: intent, HP popups, pile modals, and map modal.

The highest-value work is tightening the run loop around Cannon Charge:

- Setup should feel tempting but risky.
- Spending charges should feel strong but not automatic.
- Enemies should attack the charge plan directly.
- Events should create real run-shaping consequences.
- Rewards should help the player decide whether they are building toward loading, payoff, defense, or disruption.

## P0 - Cannon Ship Balance And Combat Feel

Status: in progress, highest priority.

Why this comes first:

- This is the core fun test.
- The ship now has a real mechanic, but tuning is still fragile.
- Small number changes and enemy pressure will teach more than adding another system.

Best next work:

- Tune starter deck counts, charge gain, and charge payoff.
- Watch whether `Load Cannons`, `Quick Load`, and `Ammo Cache` make charge too easy.
- Make sure `Fire Cannons` is useful at 2-3 charge but not always correct at 5.
- Give the player more reasons to sometimes hold charge and sometimes spend it.

Definition of done:

- A full fixed run can be won or lost based on tactical choices, not just lucky draw order.
- Charge turns create a clear "do I defend, load, or fire?" decision.

## P1 - Enemy Variety And Pressure

Status: partially implemented, should be next.

Why this is high:

- If battles are flat, events and rewards cannot carry the game.
- The Saboteur and strength-scaling elites are a good start.
- The Cannon Ship needs more targeted pressure against its core plan.

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

## P2 - Event System Expansion

Status: implemented, but too generous.

Why this matters:

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

Example event tradeoffs:

- Gain a powerful card, add a curse.
- Heal now, lose max HP.
- Remove a card, take damage.
- Gain a rare card, start the next battle Vulnerable.

## P3 - Reward And Card Pool Tuning

Status: working, but needs focus.

Why this comes before new systems:

- The reward engine already supports rarity, tags, and duplicate avoidance.
- The Cannon Ship needs enough reward cards to support a few small build directions.
- More cards are useful only if they clarify choices.

Best next work:

- Split Cannon rewards into load, payoff, defense, and control roles.
- Add 3-5 cards that interact with charge in different ways.
- Keep the reward pool small enough that playtest feedback is readable.

Good near-term cards:

- Spend 1 charge, gain block.
- If charge is exactly 0, draw or gain energy.
- Convert block into charge.
- Apply Vulnerable if charge was spent this turn.
- Gain charge but add a `Misfire`.

## P4 - Crew System Polish

Status: implemented, but currently a secondary build layer.

Why not higher:

- Crew already exists and works as a relic-like system.
- It can deepen runs, but it should not become the main source of fun before the Cannon Ship is tuned.

Best next work:

- Add crew tradeoffs only after the base crew feels too bland.
- Add one Cannon-specific crew member that changes charge math.
- Make elite/event crew rewards feel special.

Possible crew additions:

- Start with +1 charge, but max charge is reduced by 1.
- First time you spend charge each battle, gain block.
- Cannon cards apply 1 Weak, but attacks cost +1 energy on the first turn.
- +Damage, -Energy.
- +Energy, no healing at ports.
- Stronger status effects, weaker base attacks.

## P5 - Persistent Run Modifiers

Status: interesting, but wait until events need more bite.

Why it matters later:

- The run is fixed-length now, which makes short-term modifiers easy to reason about.
- This is a natural extension of events and sea conditions.
- It can add long-term strategy without adding a new combat subsystem.

Best first version:

- Add a simple `runModifiers` array later.
- Start with one-battle or next-two-battle modifiers only.
- Avoid permanent complicated modifiers until the core run is fun.

Examples:

- Stronger enemies for next 3 battles.
- Increased rewards with added risk.
- Ongoing debuffs.
- Next battle starts with enemy Strength.

## P6 - Ocean / Sea Conditions

Status: still interesting, but not current P0.

Why it drops:

- Combat already has enough moving parts: charge, statuses, powers, status cards, elites, and boss phase.
- A global modifier could muddy playtest feedback right now.

When to revisit:

- After battles feel too predictable.
- After event rewards need non-card consequences.

Best first version:

- Tie sea conditions to events or boss zones rather than every battle.
- Add one condition at a time.
- Keep conditions simple and obvious.

Possible first conditions:

- Stormy: occasional bonus damage to both sides.
- Calm: +1 energy per turn.
- Boiling waters: both sides take chip damage.
- Freezing waters: occasional Weak or energy loss.

## P7 - Expanded Enemy Fantasy Layer

Status: later, after mechanics are stronger.

Why:

- More enemy flavor is useful, but mechanics should lead.
- Sea monsters, undead ships, and magic enemies will land better once enemy roles are clear.

Good eventual archetypes:

- Bruiser: high direct damage.
- Controller: debuffs and status spam.
- Scaler: gets stronger over time.
- Disruptor: interferes with Cannon Charge or draw/discard.

## P8 - Ship Maneuvering And Boarding

Status: later.

Why:

- Boarding already exists as a card tag but not as a full mechanic.
- A full maneuvering layer would compete with Cannon Charge for attention.

Recommendation:

- Keep boarding as card flavor and occasional effects for now.
- Do not build positional combat yet.

Potential later effects:

- Steal resources.
- Apply debuffs.
- Interrupt enemy turns.
- Defensive or positional bonuses.

## P9 - Tutorial And Onboarding

Status: later, but track confusing UI.

Why:

- The app is changing quickly.
- A tutorial written now would go stale.

What to do instead:

- Keep improving combat readability.
- Add inline clarity only when a mechanic repeatedly confuses playtests.

Eventually explain:

- Combat.
- Cards.
- Cannon Charge.
- Enemy intent.
- Status effects.
- Rewards and events.

## Todo Later / Potentially Interesting Ideas

These are worth keeping, but should not distract from making the Cannon Ship run fun.

### Ghost Run Mechanic

After losing:

- Replay the run.
- Fight a ghost version of your previous ship.
- Potentially use your old deck.
- Scale with how far the previous run got.

This is very cool, but not needed early.

### Crew Resource / Supply System

Crew could require:

- Food.
- Morale.
- Supplies.

Risk:

- Can become tedious micromanagement.

Only pursue if it clearly creates meaningful decisions.

### Spell System

Spells could be:

- Buff or utility focused cards.
- Less direct damage and more control.
- A future ship identity.

Do not force this into the Cannon Ship unless it naturally supports the current run.

### Daily Run

Eventually:

- Daily seed from date string.
- Same run for everyone.
- Shareable "I beat today's run" moment.
- Leaderboards or accounts much later.

This depends on having enough run variety first.

### Accounts, Badges, Unlocks

Long-term only.

Could include:

- Accounts.
- Saved unlocks.
- Badges.
- Daily run history.
- Ship/card unlocks.
- Cosmetic unlocks.

Add only after the game is fun locally.

## Active Avoid List

Avoid for now:

- Building multiple ships.
- Adding too many systems at once.
- Over-designing mechanics before playtesting.
- Adding global modifiers before battles are tuned.
- Building account/unlock systems before the local run is fun.

## Suggested Next Three Implementation Tasks

1. Add event costs that create real downside.
2. Add one more charge-disrupting enemy or elite pattern.
3. Add 3-5 charge interaction cards that are not just "gain charge" or "spend all charge."

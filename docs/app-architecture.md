# Application Architecture

This document explains how the current pirate deckbuilder works so future prompts can make targeted changes without rediscovering the whole app.

## Current Game Shape

The app is a local React/Vite roguelike deckbuilder prototype. It currently focuses on one playable ship, the Cannon Ship, and a fixed seven-encounter run:

1. Normal battle
2. Normal battle
3. Event
4. Normal battle
5. Elite battle
6. Port
7. Boss battle

The run order is hardcoded in `src/game/runEngine.ts` as `ENCOUNTER_SEQUENCE`. The specific normal enemies, elite, boss, and event are still selected dynamically from data lists.

## Important Files

### Types

`src/types/game.ts` is the contract for almost everything:

- `RunState`: top-level saved game state.
- `BattleState`: combat-only state such as draw pile, hand, discard pile, enemy intent index, powers, and turn.
- `CombatantState`: HP, max HP, block, resources, and status effects.
- `Card`, `CardEffect`, `CardScaling`, `CardCondition`: declarative card system.
- `EnemyDefinition`, `EnemyAction`, `EnemyActionPhase`: declarative enemy behavior.
- `PlayerShipDefinition`, `ShipPassive`: ship data and ship start-of-battle effects.
- `CrewMateDefinition`, `CrewEffect`: crew/relic-like passive hooks.

When adding new mechanics, update types first if the data model needs to express something new.

### Data

Data lives in `src/data`.

- `cards.ts`: card definitions and reward pools.
- `ships.ts`: ship definitions. Only `playableShips` is shown on ship select.
- `enemies.ts`: normal, elite, and boss definitions.
- `events.ts`: event text, choices, and event effects.
- `crew.ts`: crew/relic definitions.
- `powers.ts`: persistent combat powers.

Most content should be added here first. The engine should usually interpret data rather than hardcode specific card names.

### Engines

Game logic lives in `src/game`.

- `createInitialRun.ts`: creates a new run and initial master deck.
- `runEngine.ts`: moves between encounters, resolves events, ports, rewards, and run progression.
- `combatEngine.ts`: starts battles, draws cards, plays cards, ends turns, resolves enemy actions, and checks victory/defeat.
- `mechanics.ts`: reusable low-level mechanics for resources, statuses, damage modifiers, and combatant creation.
- `crewEngine.ts`: crew reward generation and passive crew hooks.
- `rewardEngine.ts`: card reward generation by rarity, tags, and duplicate preference.
- `saveLoad.ts`: localStorage persistence and backwards-compatible normalization.

### Components

UI lives in `src/components`.

- `BattleScreen.tsx`: main combat UI, card hand, intent, pile modals, map modal, HP popups.
- `CardView.tsx`: shared card component for hand and view-only pile display.
- `EnemyIntent.tsx`: intent label.
- `RunMap.tsx`: run progress display.
- `ShipSelectScreen.tsx`: ship selection.
- `RewardScreen.tsx`, `CrewRewardScreen.tsx`, `EventScreen.tsx`, `PortScreen.tsx`: non-combat phases.

Styling is centralized in `src/styles.css`.

## Run Flow

`App.tsx` owns the current `RunState` in React state.

1. If there is no saved run, show `ShipSelectScreen`.
2. Starting a run calls `createInitialRun(shipId)`.
3. `createInitialRun` creates the master deck from the selected ship and calls `enterCurrentEncounter`.
4. `enterCurrentEncounter` checks the current encounter type:
   - battle types call `startBattle`
   - port enters `port` phase
   - event selects a random event and enters `event` phase
5. After a battle, `checkBattleEnd` moves to reward, victory, or defeat.
6. Rewards/events/ports eventually call `advanceToNextEncounter`.
7. `saveLoad.ts` saves each run update to localStorage.

## Combat Flow

Combat is pure state transformation. `BattleScreen` calls engine functions, and the returned run becomes the next app state.

### Start Of Battle

`startBattle`:

- Builds a fresh `BattleState`.
- Creates enemy combatant state from the enemy definition.
- Resets player block, statuses, and ship resources.
- Applies crew start bonuses.
- Applies ship passive.
- Draws the starting hand.

For the Cannon Ship, the ship resource is `cannonCharge`. It resets to 0, then the ship passive adds 2 Cannon Charge at battle start.

### Playing Cards

`playCard`:

- Finds the card in hand.
- Checks energy and unplayable state.
- Removes it from hand and spends energy.
- Applies each `CardEffect`.
- Applies crew/ship damage bonuses.
- Moves the card to discard or exhaust if it is a power.
- Checks battle end.

Cards are declarative. Prefer adding effects to `CardEffect` over special-casing card IDs.

### Drawing Cards

`drawCards`:

- Draws from draw pile into hand.
- If draw pile is empty, shuffles discard into draw.
- If a card has `onDrawEffects`, those effects trigger immediately and the card goes to exhaust instead of hand.

`Misfire` uses this system: when drawn, it removes 1 Cannon Charge.

### Ending Turn

`endTurn`:

- Applies end-turn powers.
- Discards the player hand.
- Reduces player statuses.
- Performs the enemy action.
- Checks battle end.
- Resets player block.
- Reduces enemy statuses.
- Refills energy and draws 5 cards.

## Resources

Resources are generic and live on `CombatantState.resources`.

Current resource:

- `cannonCharge`: max 5, initial 0.

Helpers live in `src/game/mechanics.ts`:

- `createResourceState`
- `resetResources`
- `normalizeResources`
- `getResourceAmount`
- `updateResource`
- `consumeAllResource`

Cards can interact with resources through `CardEffect`:

- `{ type: "resource", resourceId, amount }`
- damage scaling with `{ type: "resource", resourceId, multiplier, consume }`
- conditional checks like `resourceAtLeast` and `resourceGreaterThan`

## Status Effects

Statuses are generic and live on `CombatantState.statusEffects`.

Current important statuses:

- `weak`: reduces outgoing damage.
- `strength`: increases outgoing damage and persists.
- `vulnerable`: increases incoming damage.

`weak` and `strength` cancel each other in `addStatus`. For example, applying 1 Weak to a target with 1 Strength removes the Strength instead of adding Weak.

Damage modifiers use `applyDamageModifiers(amount, attacker, target)`. Enemy intent also uses this helper so displayed incoming damage matches the real attack damage.

## Powers

Power cards use:

```ts
{ type: "activatePower", powerId: "ammo_cache" }
```

Active powers are stored in `battle.activePowers`. Power definitions live in `src/data/powers.ts`.

Current power:

- `Ammo Cache`: at end of turn, gain 1 Cannon Charge.

Power cards exhaust after being played.

## Enemies

Enemies are data-driven in `src/data/enemies.ts`.

An enemy has:

- `maxHp`
- `actions`
- optional `actionPhases`

Enemy actions currently support:

- attack
- block
- attack plus block
- apply status to player
- apply status to self
- add a status card to discard pile

Bosses can switch action lists with `actionPhases`. Ghost Frigate switches behavior at 50 HP.

## Events

Events live in `src/data/events.ts`. Event choices resolve through `runEngine.ts`.

Current event effects support:

- gain a card
- choose a card
- heal
- remove a card
- crew or heal fallback
- crew or card fallback

Events can apply HP costs via `hpLoss`, but the system does not yet have persistent curses or run modifiers.

## Rewards

Card rewards are generated in `rewardEngine.ts`.

Important behavior:

- Normal and elite rewards use different rarity weights.
- Navigator crew increases reward option count.
- Reward generation prefers cards with fewer than 3 existing copies.
- Status cards are excluded from reward pools.
- Event rewards can filter by rarity and tags.

Crew rewards are generated in `crewEngine.ts`, with rarity weights and duplicate prevention.

## UI Notes

Battle UI currently includes:

- Player and enemy ship panels.
- HP bars, block, statuses, and resources.
- Enemy intent using modified damage.
- Floating HP damage/healing indicators.
- Draw/discard pile modal buttons.
- Map modal button.
- Hand cards using `CardView`.
- Captain's log.

`CardView` has a `viewOnly` mode for pile modals. Use this instead of making a second card component.

## Adding Common Features

### Add A New Card

1. Add a card definition in `src/data/cards.ts`.
2. Use existing `CardEffect` types if possible.
3. If a new effect is needed, add it to `CardEffect` in `types/game.ts`.
4. Implement the effect in `applyCardEffect` in `combatEngine.ts`.
5. Check whether it should be excluded from `rewardCardIds`.

### Add A New Enemy

1. Add an `EnemyDefinition` in `src/data/enemies.ts`.
2. Use existing `EnemyAction` types if possible.
3. Add the id to `normalEnemyIds`, `eliteEnemyIds`, or `bossEnemyIds`.
4. If needed, add an `actionPhases` entry for HP threshold behavior.

### Add A New Status

1. Add the status id to `StatusEffectId` if it is core.
2. Add behavior to `mechanics.ts`.
3. Make sure `applyDamageModifiers`, `reduceStatuses`, or `addStatus` handles it if needed.
4. UI will display any positive status automatically.

### Add A New Resource

1. Add a `ResourceDefinition`.
2. Add it to a ship's `resources`.
3. Use resource effects/scaling/conditions in cards.
4. UI will display resources automatically.

### Add A New Power

1. Add a power definition in `src/data/powers.ts`.
2. Add a card with `activatePower`.
3. Make sure the power's effects are expressible as `CardEffect`.

## Current Design Constraints

These are intentional for now:

- Keep only Cannon Ship playable.
- Keep run order fixed while tuning.
- Keep mechanics modular and data-driven.
- Prefer small, playtestable changes over new large systems.
- Do not build multiple ships until the Cannon Ship run is fun.

## Good Future Prompt Format

Useful future prompts should mention:

- The target file or system if known.
- Whether the change is data-only, engine logic, or UI.
- Whether it should affect only Cannon Ship or become reusable.
- Whether existing saves need compatibility.

Example:

> Add a new Cannon card that spends exactly 1 Cannon Charge to apply Vulnerable. Make it reusable through generic card effects if possible.

That tells the implementation to prefer `CardEffect` changes over one-off card code.

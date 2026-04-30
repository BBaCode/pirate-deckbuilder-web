Phase 1: Make runs feel like runs

Highest priority.

Goal: turn the current 3-fight demo into a replayable mini-roguelike.

Work items:

Expand to ~7 encounters per run.
Add encounter types:
normal battle
elite battle
boss battle
port/rest site
random event
Add run generation rules:
no more than 1 ports/events in a row
boss always last
at least 4 battles
1 optional elite
Add basic map/progression screen, even if linear at first.

This is the biggest “game feel” upgrade.

Phase 2: More cards + better rewards

Goal: make choices actually matter.

Work items:

Add 15–25 total cards.
Add card rarity:
common
uncommon
rare
Add card tags/effects:
attack
defense
repair
cannon
boarding
curse
Reward screen pulls from weighted card pools.
Add card unlock flags later, but don’t build account systems yet.

This gives the game strategy without needing huge systems.

Phase 3: Player ship identities

Goal: different builds/playstyles.

Example ships:

The Iron Gull — defensive/block focused.
The Crimson Wake — high-damage cannon build.
The Mist Reaver — ghost/curse/status build.
The Lucky Minnow — random effects, gold, rewards.

Work items:

Add ship selection before run.
Each ship has:
starting HP
starting deck
passive ability
Keep it to 2 ships at first.

This adds replayability fast.

Phase 4: Crew mates / relics

Goal: passive build-defining modifiers.

This is basically your “relic” system.

Examples:

Powder Monkey: first attack each turn deals +2.
Shipwright: heal 2 HP after each battle.
Navigator: see one extra reward option.
Quartermaster: start each battle with +1 energy on turn 1.

Work items:

Add crew or relics array to run state.
Add passive trigger hooks:
on battle start
on turn start
on card played
on battle won
Give crew as rewards from elites/events/ports.

This is a major depth system, but very natural to add after cards.

Phase 5: Events, ports, and lore

Goal: make it charming.

Random events:

Haunted lighthouse.
Mutiny brewing.
Merchant ship.
Siren waters.
Treasure map.
Kraken omen.

This is where lore can sneak in naturally through short event text.

Phase 6: Visual polish

I would not jump to Three.js yet.

Better order:

Better layout, spacing, typography.
Card art placeholders.
Background images.
Ship sprites.
Hit/block/heal animations.
Turn transition effects.
Pixel-art theme.
Only then consider Three.js for a cool ocean/map/home screen.

A polished 2D UI will beat a clunky Three.js experiment for this kind of game.

Phase 7: Daily run

Cool idea, but later.

The way to do it eventually:

daily seed = date string, like 2026-04-30
seeded random generator creates same run for everyone
no account needed initially
users can share “I beat today’s run”
later add leaderboard/accounts

This is a great “share with friends” feature, but it depends on having enough run variety first.

Phase 8: Accounts, badges, unlocks

Long-term.

Add only after the game is fun locally.

Would include:

accounts
saved unlocks
badges
daily run history
ship/card unlocks
maybe wallet/NFT cosmetics way later

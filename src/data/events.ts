import type { EventDefinition } from "../types/game";

export const events: EventDefinition[] = [
  {
    id: "haunted_lighthouse",
    name: "Haunted Lighthouse",
    flavorText: "A pale green flame circles the top of a ruined lighthouse. The crew swears they hear bells beneath the waves.",
    choices: [
      {
        id: "follow_light",
        label: "Follow the Light",
        description: "Gain a rare card. Lose 6 HP.",
        effect: { type: "gainCard", rarity: "rare", hpLoss: 6, resultText: "The light burns a secret into your chart." },
      },
      {
        id: "keep_distance",
        label: "Keep Your Distance",
        description: "Gain a common card.",
        effect: { type: "gainCard", rarity: "common", resultText: "Caution leaves you with something useful." },
      },
      {
        id: "send_scout",
        label: "Send a Scout",
        description: "Recruit a crew mate if available. Otherwise heal 5 HP.",
        effect: {
          type: "crewOrHeal",
          healAmount: 5,
          resultText: "Your scout returns with someone willing to sail.",
          fallbackText: "No one answers the scout, but the crew patches 5 HP.",
        },
      },
    ],
  },
  {
    id: "mutiny_brewing",
    name: "Mutiny Brewing",
    flavorText: "Whispers crawl through the lower deck. Someone has been counting rations, blades, and grudges.",
    choices: [
      {
        id: "give_speech",
        label: "Give a Speech",
        description: "Heal 6 HP.",
        effect: { type: "heal", amount: 6, resultText: "The crew rallies, and the ship feels steadier." },
      },
      {
        id: "make_example",
        label: "Make an Example",
        description: "Remove a card from your deck. Lose 4 HP.",
        effect: { type: "removeCard", hpLoss: 4, resultText: "Order is restored, but the ship pays for it." },
      },
      {
        id: "share_spoils",
        label: "Share the Spoils",
        description: "Recruit a crew mate if available. Otherwise gain an uncommon card.",
        effect: {
          type: "crewOrCard",
          rarity: "uncommon",
          resultText: "Generosity earns a loyal hand.",
          fallbackText: "No one new joins, but the spoils turn up an uncommon card.",
        },
      },
    ],
  },
  {
    id: "merchant_ship",
    name: "Merchant Ship",
    flavorText: "A lantern-lit merchant vessel drifts nearby, its captain smiling far too widely.",
    choices: [
      {
        id: "trade_supplies",
        label: "Trade Supplies",
        description: "Remove a card from your deck.",
        effect: { type: "removeCard", resultText: "The merchant takes dead weight off your hands." },
      },
      {
        id: "buy_ammunition",
        label: "Buy Ammunition",
        description: "Gain an attack or cannon card.",
        effect: {
          type: "gainCard",
          tags: ["attack", "cannon"],
          resultText: "Fresh powder and iron join your stores.",
        },
      },
      {
        id: "hire_specialist",
        label: "Hire a Specialist",
        description: "Recruit a crew mate if available.",
        effect: {
          type: "crewOrHeal",
          healAmount: 5,
          resultText: "A specialist signs on for the voyage.",
          fallbackText: "No specialists remain, so you buy 5 HP worth of supplies.",
        },
      },
    ],
  },
  {
    id: "siren_waters",
    name: "Siren Waters",
    flavorText: "The sea turns glassy and still. Somewhere beyond the fog, a song knows your name.",
    choices: [
      {
        id: "listen_closely",
        label: "Listen Closely",
        description: "Gain a utility card.",
        effect: { type: "gainCard", tags: ["utility"], resultText: "The melody teaches a strange little trick." },
      },
      {
        id: "plug_ears",
        label: "Plug Your Ears",
        description: "Heal 8 HP.",
        effect: { type: "heal", amount: 8, resultText: "You sail on, shaken but patched up." },
      },
      {
        id: "sail_toward_song",
        label: "Sail Toward the Song",
        description: "Gain a rare card. Lose 8 HP.",
        effect: { type: "gainCard", rarity: "rare", hpLoss: 8, resultText: "The song takes blood, then leaves a gift." },
      },
    ],
  },
  {
    id: "treasure_map",
    name: "Treasure Map",
    flavorText: "A bottle knocks against the hull. Inside is a map marked with an island that should not exist.",
    choices: [
      {
        id: "follow_map",
        label: "Follow the Map",
        description: "Gain a rare card.",
        effect: { type: "gainCard", rarity: "rare", resultText: "The impossible island leaves treasure behind." },
      },
      {
        id: "sell_map",
        label: "Sell the Map",
        description: "Choose 1 of 2 common cards.",
        effect: { type: "cardChoice", rarity: "common", count: 2, resultText: "The map sells for practical supplies." },
      },
      {
        id: "give_to_navigator",
        label: "Give It to the Navigator",
        description: "Recruit a crew mate if available. Otherwise heal 5 HP.",
        effect: {
          type: "crewOrHeal",
          healAmount: 5,
          resultText: "Someone with a keen eye joins the voyage.",
          fallbackText: "No navigator appears, but the crew repairs 5 HP.",
        },
      },
    ],
  },
  {
    id: "kraken_omen",
    name: "Kraken Omen",
    flavorText: "Black clouds coil above the mast. Below, something vast moves with the patience of a god.",
    choices: [
      {
        id: "prepare_cannons",
        label: "Prepare the Cannons",
        description: "Gain an attack or cannon card.",
        effect: { type: "gainCard", tags: ["attack", "cannon"], resultText: "The crew loads every gun with trembling hands." },
      },
      {
        id: "pray_deep",
        label: "Pray to the Deep",
        description: "Heal 10 HP.",
        effect: { type: "heal", amount: 10, resultText: "The deep answers with a rare moment of mercy." },
      },
      {
        id: "accept_omen",
        label: "Accept the Omen",
        description: "Gain a rare card. Lose 10 HP.",
        effect: { type: "gainCard", rarity: "rare", hpLoss: 10, resultText: "The omen carves power into the hull." },
      },
    ],
  },
];

export const eventsById = Object.fromEntries(events.map((event) => [event.id, event]));

export const NPC_DEFS = {
  merchant: {
    id: "merchant", name: "The Merchant", ch: "M", col: "#ca8a04",
    floors: [2, 3, 4],
    dialogue: {
      start: {
        text: "You survive longer than most. Trade with me. Coins mean nothing here, only blood and supplies.",
        choices: [
          { label: "Trade", next: "trade" },
          { label: "Who are you?", next: "lore" },
          { label: "Leave", next: null }
        ]
      },
      lore: {
        text: "I was a prisoner once. Now I am a purveyor of necessities. The Warden allows my existence... for now.",
        choices: [
          { label: "Trade", next: "trade" },
          { label: "Leave", next: null }
        ]
      },
      trade: { type: "TRADE", text: "What do you offer?" }
    }
  },
  prisoner: {
    id: "prisoner", name: "The Prisoner", ch: "p", col: "#9ca3af",
    floors: [1, 2],
    dialogue: {
      start: {
        text: "Please... get me out of here. I haven't eaten in days.",
        choices: [
          { label: "Give Meat", reqItem: "meat", next: "freed" },
          { label: "I have nothing.", next: null }
        ]
      },
      freed: {
        text: "Thank you... The guards, they went deeper. They carried a black gem.",
        choices: [
          { label: "Follow me.", next: "companion" }
        ]
      },
      companion: { type: "JOIN", text: "I will watch your back." }
    }
  },
  prophet: {
    id: "prophet", name: "Blind Prophet", ch: "P", col: "#9333ea",
    floors: [1, 3],
    dialogue: {
      start: {
        text: "I see you... not with eyes, but with the darkness we share. Seek the three shards. The Black Gem is the key to ascension.",
        choices: [
          { label: "What shards?", next: "shards" },
          { label: "Leave", next: null }
        ]
      },
      shards: {
        text: "One is hidden in blood. One is held by iron. One is guarded by madness. Find them.",
        choices: [
          { label: "I will.", next: null }
        ]
      }
    }
  },
  deserter: {
    id: "deserter", name: "The Deserter", ch: "D", col: "#6b7280",
    floors: [3, 4],
    dialogue: {
      start: {
        text: "Stay back! I'm not going back to the Warden. My leg is broken.",
        choices: [
          { label: "Give Healing Vial", reqItem: "potion", next: "healed" },
          { label: "Leave", next: null }
        ]
      },
      healed: {
        text: "You... thank you. The Warden is immortal as long as the altar is active. Destroy it.",
        choices: [
          { label: "Understood.", next: null }
        ]
      }
    }
  },
  child: {
    id: "child", name: "The Child", ch: "c", col: "#d1d5db",
    floors: [4],
    dialogue: {
      start: {
        text: "Have you seen my father? He wears a big crown. He locked me down here so I'd be safe.",
        choices: [
          { label: "He's the Warden?", next: "truth" },
          { label: "I'll find him.", next: null }
        ]
      },
      truth: {
        text: "He said the darkness makes us strong. But I'm just so cold.",
        choices: [
          { label: "Rest now.", next: null }
        ]
      }
    }
  },
  hollow: {
    id: "hollow", name: "The Hollow One", ch: "H", col: "#374151",
    floors: [5],
    dialogue: {
      start: {
        text: "The whispers... make them stop. Please, cut it out of my head.",
        choices: [
          { label: "Mercy Kill", next: "kill" },
          { label: "Ignore", next: null }
        ]
      },
      kill: { type: "MERCY_KILL", text: "Thank... you..." }
    }
  }
};

export const QUESTS = {
  blackGem: { name: "The Black Gem", desc: "Find 3 shards to unlock the true path.", total: 3 },
  lostScholar: { name: "Lost Scholar", desc: "Find the scholar's journal entries scattered below.", total: 4 },
  wardenOrigin: { name: "Warden's Origin", desc: "Uncover the history of this prison through carvings.", total: 3 },
};

export const LORE = {
  bestiary: {
    "Rat Beast": "Mutated by the dark. They feed on whatever falls into the depths.",
    "Hollow Guard": "Once noble protectors, their minds eroded leaving only duty and violence.",
    "Skeleton": "Bones animated by fear itself. They remember only war.",
    "Flesh Mass": "A grotesque amalgamation of those who perished in the cells.",
    "Dark Cultist": "They worship the Warden as a god. They bleed for him.",
    "Cave Troll": "Blind, deaf, but it can smell hunger and fear.",
    "Shadow Wraith": "A soul torn from its body by the Black Gem.",
    "Plague Rat": "Carriers of the Rot. A single bite means a slow death.",
    "Iron Golem": "The Warden's automated executioners.",
    "The Warden": "The architect of this prison. He locked himself in, and swallowed the key."
  },
  entries: {
    1: { title: "First Descent", text: "The door locked behind me. There is no way back up. Only deeper." },
    2: { title: "Blood Stained Note", text: "Do not trust the shadows. They have teeth." },
    3: { title: "Origin of the Gem", text: "The Black Gem controls the lower depths. Broken into three shards to prevent escape." },
    4: { title: "Scholar's Log 1", text: "The walls here bleed. Not metaphorically. I tasted it. Iron and salt." },
    5: { title: "Scholar's Log 2", text: "I found the Warden's diary. He didn't build this to keep people in. He built it to keep something OUT." },
    6: { title: "Scholar's Log 3", text: "My torch is dying. The whispers are getting louder." },
    7: { title: "Scholar's Log 4", text: "I see it now. The shape in the dark. It's beautiful." },
    8: { title: "Carving I", text: "THE STAIRS ONLY GO DOWN." },
    9: { title: "Carving II", text: "HE SACRIFICED HIS OWN CHILD." },
    10: { title: "Carving III", text: "THERE IS NO ASCENSION. ONLY THE ABYSS." },
    11: { title: "Cultist Tract", text: "Blood for the dark! Fear for the void! The Warden protects!" },
    12: { title: "Torn Page", text: "I counted 47. Then stopped." },
    13: { title: "Deserter's Confession", text: "We locked the doors. We heard them screaming. We did nothing." },
    14: { title: "Altar Etching", text: "Offer your life, and be spared the darkness." },
    15: { title: "Warning", text: "If you find this — run." },
    16: { title: "Madman's Scrawl", text: "Eyes in the walls. Teeth in the floor. They are all around us." },
    17: { title: "Merchant's Ledger", text: "Sold bread for an iron sword. He won't need it. The troll is on floor 3." },
    18: { title: "Prisoner's Tally", text: "|||| |||| |||| |||| |||| ... I forgot." },
    19: { title: "Warden's Final Order", text: "Seal the gates. Let the darkness consume them. It is the only way to contain it." },
    20: { title: "The Truth", text: "The Fear is a living thing. We are its food." }
  }
};

export const ENDING_DEFS = {
  1: { name: "A Grisly End", condition: "Died in the dungeon.", text: "Your body becomes another meal for the dark." },
  2: { name: "The True Ascent", condition: "Defeated the Warden with the Black Gem.", text: "The gem pulses. You are the Warden now." },
  3: { name: "A Coward's Escape", condition: "Fled the dungeon.", text: "You escaped, but the fear never leaves you." },
  4: { name: "Consumed by Madness", condition: "Fear reached 100%.", text: "Your mind shatters. You join the whispers." }
};

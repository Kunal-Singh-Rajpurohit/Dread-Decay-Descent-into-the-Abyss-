import { NPC_DEFS, QUESTS, LORE } from './narrative-systems.js';
// § 1 · CONSTANTS & SPRITES
// ═══════════════════════════════════════════════════════
const MW=32,MH=20,TS=24; // Increased tile size for better sprite visibility
const TR_FULL=6,TR_DIM=3,TR_DARK=2;
const T={W:0,F:1,S:2};
const PMUL={head:2.0,torso:1.0,rightArm:0.7,leftArm:0.7,rightLeg:0.6,leftLeg:0.6};
const PLAB={head:"Head",torso:"Torso",rightArm:"R.Arm",leftArm:"L.Arm",rightLeg:"R.Leg",leftLeg:"L.Leg"};
const XP_LV=[0,60,150,280,450,670];
const SCOL={BLEEDING:"#dc2626",POISONED:"#4d7c0f",STUNNED:"#d97706",BURNING:"#ea580c",WEAKENED:"#6b7280",REGEN:"#0891b2"};

const SPRITE_CONFIG = {
  bgSizeTiles: "64px 16px",
  bgSizePlayers: "64px 16px",
  bgSizeEnemies: "160px 16px",
};

// ═══════════════════════════════════════════════════════
// § 2 · ITEMS
// ═══════════════════════════════════════════════════════
const ITEMS={
  torch:    {name:"Torch",          type:"USE",   desc:"Oil and cloth. Burns out.",              eff:{torch:150}},
  torch_lg: {name:"Large Torch",    type:"USE",   desc:"Burns much longer.",                     eff:{torch:300}},
  meat:     {name:"Dried Meat",     type:"USE",   desc:"Tough. The taste is wrong.",             eff:{hunger:25}},
  bread:    {name:"Stale Bread",    type:"USE",   desc:"Hard. Still fills the belly.",           eff:{hunger:18}},
  rawmeat:  {name:"Raw Meat",       type:"USE",   desc:"Eating this raw is foolish. Hunger disagrees.",eff:{hunger:30,fear:12}},
  herbs:    {name:"Healing Herbs",  type:"USE",   desc:"Stops bleeding. Closes small wounds.",  eff:{hp:8,cureBleed:true}},
  potion:   {name:"Healing Vial",   type:"USE",   desc:"Crude tincture. Better than nothing.",  eff:{hp:22}},
  greatpot: {name:"Greater Vial",   type:"USE",   desc:"Stronger medicine. Very rare.",         eff:{hp:45}},
  bandage:  {name:"Linen Bandage",  type:"USE",   desc:"Binds wounds. Slows bleeding.",        eff:{hp:5,cureBleed:true}},
  antidote: {name:"Antidote",       type:"USE",   desc:"Clears poison from the blood.",         eff:{curePoison:true}},
  wine:     {name:"Dark Wine",      type:"USE",   desc:"Numbs the fear. For a time.",           eff:{fear:-22,hunger:8}},
  oil_flask:{name:"Oil Flask",      type:"USE",   desc:"Fuel for the torch.",                   eff:{torch:200}},
  sword:    {name:"Iron Sword",     type:"WEAPON",desc:"Standard issue. Heavy and reliable.",   stats:{atk:5}, props:{bleed:.08,crit:.10,critM:1.5}},
  fine_sword:{name:"Fine Blade",   type:"WEAPON",desc:"Expertly balanced. Rare down here.",    stats:{atk:7}, props:{bleed:.05,crit:.15,critM:1.8}},
  dagger:   {name:"Rusted Dagger", type:"WEAPON",desc:"Thin. Finds gaps in armor.",            stats:{atk:3}, props:{bleed:.05,crit:.28,critM:2.2,acc:.12}},
  axe:      {name:"Crude Axe",     type:"WEAPON",desc:"Unbalanced. Leaves terrible wounds.",   stats:{atk:7}, props:{bleed:.22,crit:.06,critM:1.3}},
  war_axe:  {name:"War Axe",       type:"WEAPON",desc:"Built for carnage.",                    stats:{atk:9}, props:{bleed:.32,crit:.08,critM:1.4}},
  spear:    {name:"Broken Spear",  type:"WEAPON",desc:"Reach. Strikes first.",                 stats:{atk:6}, props:{bleed:.10,crit:.05,critM:1.2}},
  club:     {name:"Bone Club",     type:"WEAPON",desc:"Pulverizing. May stun.",               stats:{atk:5}, props:{stun:.30,crit:.04,critM:1.1}},
  flail:    {name:"Iron Flail",    type:"WEAPON",desc:"Ignores some armor.",                   stats:{atk:8}, props:{bleed:.08,defPen:5}},
  torch_wpn:{name:"Burning Torch", type:"WEAPON",desc:"Sets things alight.",                   stats:{atk:3}, props:{burn:.38}},
  robes:    {name:"Torn Robes",    type:"ARMOR", desc:"Light fabric. Barely protects.",        stats:{def:1}},
  leather:  {name:"Leather Armor", type:"ARMOR", desc:"Rough hide. Stops light blows.",        stats:{def:3}},
  chain:    {name:"Chain Mail",    type:"ARMOR", desc:"Iron rings. Heavy but protective.",     stats:{def:5}},
  plate:    {name:"Plate Fragment",type:"ARMOR", desc:"Heavy iron. Significant protection.",   stats:{def:7}},
  helmet:   {name:"Iron Helmet",   type:"HELMET",desc:"Protects the head.",                    stats:{def:2}},
  iron_key: {name:"Iron Key",      type:"KEY",   desc:"Opens something nearby."},
  black_gem:{name:"Black Gem",     type:"MISC",  desc:"Pulsates with cold light. What is this for?"},
  old_tome: {name:"Old Tome",      type:"MISC",  desc:"Forgotten script. Unsettles you."},
  gem_shard1:{name:"Onyx Shard",   type:"QUEST", desc:"A fractured piece of something ancient."},
  gem_shard2:{name:"Void Shard",   type:"QUEST", desc:"It feels cold to the touch."},
  gem_shard3:{name:"Abyssal Shard",type:"QUEST", desc:"It whispers when you hold it close."},
};

// ═══════════════════════════════════════════════════════
// § 3 · CLASSES & ABILITIES
// ═══════════════════════════════════════════════════════
const CLS={
  soldier:  {name:"Soldier",   desc:"Hardened warrior. Strong, not built for the horrors below.", hp:45,atk:12,def:6,agi:4,hunger:80, fear:20,torch:200,items:["sword","torch","meat"],       ability:"guard", spriteIdx:0},
  rogue:    {name:"Rogue",     desc:"Quick and cunning. Fragile. Frightens easily.",              hp:30,atk:9, def:3,agi:9,hunger:70, fear:35,torch:150,items:["dagger","torch","torch","bread"],ability:"backstab", spriteIdx:1},
  scholar:  {name:"Scholar",   desc:"Studies old texts. Weak in body, careful in mind.",         hp:22,atk:5, def:2,agi:5,hunger:65, fear:15,torch:300,items:["torch","torch","herbs","bread","old_tome"],ability:"study", spriteIdx:2},
  outlander:{name:"Outlander", desc:"A survivor. Knows hunger well. Knows little else.",         hp:35,atk:8, def:4,agi:6,hunger:100,fear:25,torch:100,items:["axe","meat","meat","meat","torch"],ability:"endure", spriteIdx:3},
};
const ABLS={
  guard:    {name:"Iron Guard",  desc:"Next hit reduced by 75%.",          cd:4},
  backstab: {name:"Backstab",    desc:"Triple damage on next attack.",      cd:-1},
  study:    {name:"Study",       desc:"2× damage next hit.",               cd:3},
  endure:   {name:"Second Wind", desc:"Restore 20 HP immediately.",        cd:5},
};

// ═══════════════════════════════════════════════════════
// § 4 · ENEMIES 
// ═══════════════════════════════════════════════════════
const EDEFS={
  rat:    {name:"Rat Beast",    ch:"r",col:"#a16207",hp:12, atk:4, def:1, agi:6,fear:3, xp:8,  spriteIdx:0, loot:[{id:"rawmeat",c:.6}],
    sp:{n:"Swarm",t:.25,fn:(e)=>({dmg:3,tgt:"torso",msg:`${e.name} bites again!`})}},
  guard:  {name:"Hollow Guard", ch:"G",col:"#6b7280",hp:28, atk:8, def:5, agi:3,fear:10,xp:15, spriteIdx:1, loot:[{id:"meat",c:.35},{id:"bandage",c:.2}],
    sp:{n:"Shield Bash",t:.22,fn:(e)=>({dmg:4,tgt:"torso",msg:`${e.name} bashes you! Staggered.`,stun:true})}},
  skele:  {name:"Skeleton",     ch:"s",col:"#9ca3af",hp:20, atk:6, def:3, agi:4,fear:13,xp:12, spriteIdx:2, loot:[],
    sp:{n:"Bone Throw",t:.30,fn:(e)=>({dmg:e.atk,tgt:"torso",msg:`${e.name} hurls a bone!`,guaranteed:true})}},
  flesh:  {name:"Flesh Mass",   ch:"M",col:"#dc2626",hp:45, atk:13,def:6, agi:2,fear:28,xp:30, spriteIdx:3, loot:[{id:"rawmeat",c:.8},{id:"potion",c:.25}],
    sp:{n:"Devour",t:.18,fn:(e)=>({dmg:20,tgt:"torso",msg:`${e.name} engulfs you! DEVASTATING.`})}},
  cultist:{name:"Dark Cultist", ch:"C",col:"#7c3aed",hp:22, atk:6, def:2, agi:5,fear:18,xp:18, spriteIdx:4, loot:[{id:"wine",c:.4},{id:"antidote",c:.2}],
    sp:{n:"Dark Prayer",t:.35,fn:(e)=>({dmg:0,tgt:"torso",msg:`${e.name} chants. Fear spikes!`,fearDmg:24})}},
  troll:  {name:"Cave Troll",   ch:"T",col:"#4d7c0f",hp:60, atk:14,def:7, agi:2,fear:20,xp:35, spriteIdx:5, loot:[{id:"meat",c:.5},{id:"leather",c:.3}],
    sp:{n:"Ground Slam",t:.20,fn:(e)=>({dmg:9,tgt:"rightLeg",msg:`${e.name} slams the ground! Your legs bear it.`})}},
  wraith: {name:"Shadow Wraith",ch:"W",col:"#6d28d9",hp:18, atk:8, def:0, agi:9,fear:35,xp:28, spriteIdx:6, loot:[],
    sp:{n:"Soul Drain",t:.42,fn:(e)=>({dmg:4,tgt:"head",msg:`${e.name} reaches into your soul!`,fearDmg:20})}},
  plague: {name:"Plague Rat",   ch:"P",col:"#65a30d",hp:16, atk:5, def:1, agi:7,fear:8, xp:14, spriteIdx:7, loot:[{id:"antidote",c:.25}],
    sp:{n:"Infect",t:.40,fn:(e)=>({dmg:2,tgt:"torso",msg:`${e.name} bites deep. Something enters your blood.`,poison:true})}},
  golem:  {name:"Iron Golem",   ch:"I",col:"#64748b",hp:70, atk:11,def:12,agi:1,fear:22,xp:40, spriteIdx:8, loot:[{id:"iron_key",c:.3},{id:"chain",c:.2}],
    sp:{n:"Fortify",t:.28,fn:(e)=>({dmg:0,tgt:"torso",msg:`${e.name} hardens its shell.`,fortify:true})}},
  warden: {name:"The Warden",   ch:"Ω",col:"#c026d3",hp:130,atk:18,def:10,agi:4,fear:50,xp:250,boss:true, spriteIdx:9, loot:[{id:"black_gem",c:1},{id:"greatpot",c:1}],
    sp:{n:"Warden's Curse",t:.32,fn:(e)=>({dmg:14,tgt:"torso",msg:`The Warden's curse tears through you!`,fearDmg:18,weaken:true})}},
};
const FTABLES=[
  ["rat","rat","rat","guard","skele"],
  ["guard","skele","cultist","plague","rat"],
  ["skele","flesh","cultist","troll"],
  ["flesh","wraith","golem","troll"],
];

// ═══════════════════════════════════════════════════════
// § 5 · NARRATIVE LAYER (Quests, Lore, NPCs)
// ═══════════════════════════════════════════════════════
const LORE = {
  bestiary: {
    "Rat Beast": "Mutated by the dark. They feed on whatever falls into the depths.",
    "Hollow Guard": "Once noble protectors, their minds eroded leaving only duty and violence.",
    "The Warden": "The architect of this prison. He locked himself in, and swallowed the key."
  },
  entries: {
    1: { title: "First Descent", text: "The door locked behind me. There is no way back up. Only deeper." },
    2: { title: "Blood Stained Note", text: "Do not trust the shadows. They have teeth." },
    3: { title: "Origin of the Gem", text: "The Black Gem controls the lower depths. Broken into three shards to prevent escape." },
  }
};

const QUESTS = {
  blackGem: { name: "The Black Gem", desc: "Find 3 shards to unlock the true path.", total: 3 },
  warden: { name: "Warden's Origin", desc: "Uncover the history of this prison.", total: 3 },
};

const NPC_DEFS = {
  merchant: {
    id: "merchant", name: "The Merchant", ch: "M", col: "#ca8a04",
    floors: [2,3,4],
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
  prophet: {
    id: "prophet", name: "Blind Prophet", ch: "P", col: "#9333ea",
    floors: [1,3],
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
  }
};

// ═══════════════════════════════════════════════════════
// § 6 · EVENTS
// ═══════════════════════════════════════════════════════
const EV_DEF={
  altar:{ch:"†",col:"#7c3aed",name:"Dark Altar",desc:"An altar stained with old blood. Something watches.",
    choices:[
      {label:"Pray for mercy",  fn:(p)=>({...p,hp:Math.min(p.maxHp,p.hp+15),fear:Math.min(100,p.fear+15)},                   "Pain eases. Fear deepens.")},
      {label:"Offer blood",     fn:(p)=>({...p,hp:Math.max(1,p.hp-10),    fear:Math.max(0,p.fear-28)},                        "You bleed onto the altar. The fear retreats.")},
      {label:"Combine Shards (Black Gem Quest)", req: (p) => p.quests.blackGem === 3, fn:(p)=>[{...p, quests: {...p.quests, blackGem: 4}},"The shards fuse. A path opens downward."]},
      {label:"Walk away",       fn:(p)=>({...p},                                                                               "It feels disappointed.")},
    ]},
  well:{ch:"○",col:"#0891b2",name:"Stone Well",desc:"Dark water, still and cold.",
    choices:[
      {label:"Drink deep",  fn:(p)=>Math.random()<.55?[{...p,hunger:Math.min(100,p.hunger+32)},"The water is stale but filling."]:[{...p,statuses:[...p.statuses,{type:"POISONED",dur:14}]},"Something was in the water. Your stomach burns."]},
      {label:"Search bottom", req:(p)=>p.quests.blackGem===0, fn:(p)=>[{...p, quests:{...p.quests, blackGem:1}}, "You found an Onyx Shard in the muck!", "gem_shard1"]},
      {label:"Walk away",   fn:(p)=>[{...p},"You leave the well alone."]},
    ]},
  corpse:{ch:"✝",col:"#4b5563",name:"Fresh Corpse",desc:"A body. Still warm. What happened here?",
    choices:[
      {label:"Search body", fn:(p,drop)=>Math.random()<.6?[{...p},"You find something on the body.",drop]:[ {...p,fear:Math.min(100,p.fear+12)},"Nothing here but the smell."]},
      {label:"Leave it",    fn:(p)=>[{...p},"You leave the body in peace."]},
    ]},
  inscription:{ch:"§",col:"#78716c",name:"Carved Message",desc:"Words carved with frantic urgency.",
    choices:[
      {label:"Read it",    fn:(p)=>[{...p,fear:Math.min(100,p.fear+8), quests:{...p.quests, wardenOrigin: Math.min(3, p.quests.wardenOrigin+1)}},
        ['"They are not dead. They wait."','"THE STAIRS ONLY GO DOWN."','"I counted 47. Then stopped."','"If you find this — run."'][Math.floor(Math.random()*4)]]},
      {label:"Ignore it",  fn:(p)=>[{...p},"Some things are better unread."]},
    ]},
};

// ═══════════════════════════════════════════════════════
export { MW, MH, TS, TR_FULL, TR_DIM, TR_DARK, T, PMUL, PLAB, XP_LV, SCOL, SPRITE_CONFIG, ITEMS, CLS, ABLS, EDEFS, FTABLES, EV_DEF };
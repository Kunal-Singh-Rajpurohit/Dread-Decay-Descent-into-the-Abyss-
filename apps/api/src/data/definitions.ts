// ═══════════════════════════════════════════════════════
// DATA DEFINITIONS — used by API services + game-core
// Keep in sync with the JSX artifact (fear-and-dark-p2.jsx)
// ═══════════════════════════════════════════════════════

// ── Item definitions ────────────────────────────────────
export const ITEM_DEFS: Record<string, { name: string; type: string; desc: string; stats?: any; props?: any; eff?: any }> = {
  torch:     { name:"Torch",          type:"USE",    desc:"Oil and cloth. Burns out.",                eff:{ torch:150 }},
  torch_lg:  { name:"Large Torch",    type:"USE",    desc:"Burns much longer.",                       eff:{ torch:300 }},
  meat:      { name:"Dried Meat",     type:"USE",    desc:"Tough. The taste is wrong.",               eff:{ hunger:25 }},
  bread:     { name:"Stale Bread",    type:"USE",    desc:"Hard. Still fills the belly.",             eff:{ hunger:18 }},
  rawmeat:   { name:"Raw Meat",       type:"USE",    desc:"Eating this raw is foolish.",              eff:{ hunger:30, fear:12 }},
  herbs:     { name:"Healing Herbs",  type:"USE",    desc:"Stops bleeding. Closes wounds.",          eff:{ hp:8, cureBleed:true }},
  potion:    { name:"Healing Vial",   type:"USE",    desc:"Crude tincture. Better than nothing.",    eff:{ hp:22 }},
  greatpot:  { name:"Greater Vial",   type:"USE",    desc:"Stronger medicine. Very rare.",           eff:{ hp:45 }},
  bandage:   { name:"Linen Bandage",  type:"USE",    desc:"Binds wounds.",                           eff:{ hp:5, cureBleed:true }},
  antidote:  { name:"Antidote",       type:"USE",    desc:"Clears poison.",                          eff:{ curePoison:true }},
  wine:      { name:"Dark Wine",      type:"USE",    desc:"Numbs the fear. For a time.",             eff:{ fear:-22, hunger:8 }},
  oil_flask: { name:"Oil Flask",      type:"USE",    desc:"Fuel for the torch.",                     eff:{ torch:200 }},
  sword:     { name:"Iron Sword",     type:"WEAPON", desc:"Standard issue.",                         stats:{ atk:5 },  props:{ bleed:.08, crit:.10, critM:1.5 }},
  fine_sword:{ name:"Fine Blade",     type:"WEAPON", desc:"Expertly balanced.",                      stats:{ atk:7 },  props:{ bleed:.05, crit:.15, critM:1.8 }},
  dagger:    { name:"Rusted Dagger",  type:"WEAPON", desc:"Finds gaps in armor.",                    stats:{ atk:3 },  props:{ bleed:.05, crit:.28, critM:2.2, acc:.12 }},
  axe:       { name:"Crude Axe",      type:"WEAPON", desc:"Leaves terrible wounds.",                 stats:{ atk:7 },  props:{ bleed:.22, crit:.06, critM:1.3 }},
  war_axe:   { name:"War Axe",        type:"WEAPON", desc:"Built for carnage.",                      stats:{ atk:9 },  props:{ bleed:.32, crit:.08, critM:1.4 }},
  spear:     { name:"Broken Spear",   type:"WEAPON", desc:"Reach. Strikes first.",                   stats:{ atk:6 },  props:{ bleed:.10, crit:.05, critM:1.2 }},
  club:      { name:"Bone Club",      type:"WEAPON", desc:"May stun the enemy.",                     stats:{ atk:5 },  props:{ stun:.30, crit:.04, critM:1.1 }},
  flail:     { name:"Iron Flail",     type:"WEAPON", desc:"Ignores some armor.",                     stats:{ atk:8 },  props:{ bleed:.08, defPen:5 }},
  torch_wpn: { name:"Burning Torch",  type:"WEAPON", desc:"Sets things alight.",                     stats:{ atk:3 },  props:{ burn:.38 }},
  robes:     { name:"Torn Robes",     type:"ARMOR",  desc:"Barely protects.",                        stats:{ def:1 }},
  leather:   { name:"Leather Armor",  type:"ARMOR",  desc:"Stops light blows.",                      stats:{ def:3 }},
  chain:     { name:"Chain Mail",     type:"ARMOR",  desc:"Heavy but protective.",                   stats:{ def:5 }},
  plate:     { name:"Plate Fragment", type:"ARMOR",  desc:"Significant protection.",                 stats:{ def:7 }},
  helmet:    { name:"Iron Helmet",    type:"HELMET", desc:"Protects the head.",                      stats:{ def:2 }},
  iron_key:  { name:"Iron Key",       type:"KEY",    desc:"Opens something nearby." },
  black_gem: { name:"Black Gem",      type:"MISC",   desc:"Pulsates with cold light." },
  old_tome:  { name:"Old Tome",       type:"MISC",   desc:"Forgotten script." },
};

// ── Class definitions ──────────────────────────────────
export const CLASS_DEFS = {
  soldier:  { name:"Soldier",   hp:45,atk:12,def:6,agi:4,hunger:80, fear:20,torch:200,items:["sword","torch","meat"],      ability:"guard"   },
  rogue:    { name:"Rogue",     hp:30,atk:9, def:3,agi:9,hunger:70, fear:35,torch:150,items:["dagger","torch","torch","bread"],ability:"backstab"},
  scholar:  { name:"Scholar",   hp:22,atk:5, def:2,agi:5,hunger:65, fear:15,torch:300,items:["torch","torch","herbs","bread","old_tome"],ability:"study"},
  outlander:{ name:"Outlander", hp:35,atk:8, def:4,agi:6,hunger:100,fear:25,torch:100,items:["axe","meat","meat","meat","torch"],ability:"endure"},
};

// ── Ability definitions ────────────────────────────────
export const ABILITY_DEFS = {
  guard:    { name:"Iron Guard",  desc:"Next hit –75% damage.", cd:4  },
  backstab: { name:"Backstab",    desc:"Triple damage next attack.", cd:-1 },
  study:    { name:"Study",       desc:"2× damage next hit.", cd:3  },
  endure:   { name:"Second Wind", desc:"Restore 20 HP.", cd:5  },
};

// ── Enemy definitions ──────────────────────────────────
export const ENEMY_DEFS: Record<string, any> = {
  rat:    { name:"Rat Beast",    ch:"r",col:"#a16207",hp:12, atk:4, def:1, agi:6,fear:3, xp:8,  loot:[{id:"rawmeat",c:.6}],
    sp:{n:"Swarm",t:.25,fn:(e:any)=>({dmg:3,tgt:"torso",msg:`${e.name} bites again!`})}},
  guard:  { name:"Hollow Guard", ch:"G",col:"#6b7280",hp:28, atk:8, def:5, agi:3,fear:10,xp:15, loot:[{id:"meat",c:.35}],
    sp:{n:"Shield Bash",t:.22,fn:(e:any)=>({dmg:4,tgt:"torso",msg:`${e.name} bashes you! Staggered.`,stun:true})}},
  skele:  { name:"Skeleton",     ch:"s",col:"#9ca3af",hp:20, atk:6, def:3, agi:4,fear:13,xp:12, loot:[],
    sp:{n:"Bone Throw",t:.30,fn:(e:any)=>({dmg:e.atk,tgt:"torso",msg:`${e.name} hurls a bone!`,guaranteed:true})}},
  flesh:  { name:"Flesh Mass",   ch:"M",col:"#dc2626",hp:45, atk:13,def:6, agi:2,fear:28,xp:30, loot:[{id:"rawmeat",c:.8},{id:"potion",c:.25}],
    sp:{n:"Devour",t:.18,fn:(e:any)=>({dmg:20,tgt:"torso",msg:`${e.name} engulfs you!`})}},
  cultist:{ name:"Dark Cultist", ch:"C",col:"#7c3aed",hp:22, atk:6, def:2, agi:5,fear:18,xp:18, loot:[{id:"wine",c:.4}],
    sp:{n:"Dark Prayer",t:.35,fn:(e:any)=>({dmg:0,tgt:"torso",msg:`${e.name} chants. Fear spikes!`,fearDmg:24})}},
  troll:  { name:"Cave Troll",   ch:"T",col:"#4d7c0f",hp:60, atk:14,def:7, agi:2,fear:20,xp:35, loot:[{id:"meat",c:.5}],
    sp:{n:"Ground Slam",t:.20,fn:(e:any)=>({dmg:9,tgt:"rightLeg",msg:`${e.name} slams! Your legs take it.`})}},
  wraith: { name:"Shadow Wraith",ch:"W",col:"#6d28d9",hp:18, atk:8, def:0, agi:9,fear:35,xp:28, loot:[],
    sp:{n:"Soul Drain",t:.42,fn:(e:any)=>({dmg:4,tgt:"head",msg:`${e.name} reaches into your soul!`,fearDmg:20})}},
  plague: { name:"Plague Rat",   ch:"P",col:"#65a30d",hp:16, atk:5, def:1, agi:7,fear:8, xp:14, loot:[{id:"antidote",c:.25}],
    sp:{n:"Infect",t:.40,fn:(e:any)=>({dmg:2,tgt:"torso",msg:`${e.name} infects you.`,poison:true})}},
  golem:  { name:"Iron Golem",   ch:"I",col:"#64748b",hp:70, atk:11,def:12,agi:1,fear:22,xp:40, loot:[{id:"chain",c:.2}],
    sp:{n:"Fortify",t:.28,fn:(e:any)=>({dmg:0,tgt:"torso",msg:`${e.name} hardens.`,fortify:true})}},
  warden: { name:"The Warden",   ch:"Ω",col:"#c026d3",hp:130,atk:18,def:10,agi:4,fear:50,xp:250,boss:true,loot:[{id:"black_gem",c:1},{id:"greatpot",c:1}],
    sp:{n:"Warden's Curse",t:.32,fn:(e:any)=>({dmg:14,tgt:"torso",msg:`The Warden's curse tears through you!`,fearDmg:18,weaken:true})}},
};

// ── Floor tables ───────────────────────────────────────
export const FLOOR_TABLES: string[][] = [
  ["rat","rat","rat","guard","skele"],
  ["guard","skele","cultist","plague","rat"],
  ["skele","flesh","cultist","troll"],
  ["flesh","wraith","golem","troll"],
];

// ── Event types ────────────────────────────────────────
export const EVENT_TYPES = ["altar","well","corpse","inscription"];

// ── Item pools by floor tier ───────────────────────────
export const ITEM_POOLS = {
  early: ["torch","meat","herbs","potion","rawmeat","bandage"],
  late:  ["potion","greatpot","herbs","wine","antidote","torch_lg","oil_flask"],
};

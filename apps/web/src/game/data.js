// ═══════════════════════════════════════════════════════════════
// DATA — Phase 6
// Extracted from P5 §4–§10
// ═══════════════════════════════════════════════════════════════

import { T } from './constants.js';

// ═══════════════════════════════════════════════════════════════
// § 4 · ITEMS (expanded)
// ═══════════════════════════════════════════════════════════════
export const ITEMS = {
  torch:    {name:"Torch",          type:"USE",   desc:"Oil and cloth. Burns out.",              eff:{torch:150}},
  torch_lg: {name:"Large Torch",    type:"USE",   desc:"Burns much longer.",                     eff:{torch:300}},
  meat:     {name:"Dried Meat",     type:"USE",   desc:"Tough. The taste is wrong.",             eff:{hunger:25}},
  bread:    {name:"Stale Bread",    type:"USE",   desc:"Hard. Still fills the belly.",           eff:{hunger:18}},
  rawmeat:  {name:"Raw Meat",       type:"USE",   desc:"Foolish to eat raw. Hunger disagrees.", eff:{hunger:30,fear:12}},
  herbs:    {name:"Healing Herbs",  type:"USE",   desc:"Stops bleeding. Closes small wounds.",  eff:{hp:8,cureBleed:true}},
  potion:   {name:"Healing Vial",   type:"USE",   desc:"Crude tincture. Better than nothing.",  eff:{hp:22}},
  greatpot: {name:"Greater Vial",   type:"USE",   desc:"Stronger medicine. Very rare.",         eff:{hp:45}},
  bandage:  {name:"Linen Bandage",  type:"USE",   desc:"Binds wounds. Slows bleeding.",        eff:{hp:5,cureBleed:true}},
  antidote: {name:"Antidote",       type:"USE",   desc:"Clears poison from the blood.",         eff:{curePoison:true}},
  wine:     {name:"Dark Wine",      type:"USE",   desc:"Numbs the fear. For a time.",           eff:{fear:-22,hunger:8}},
  oil_flask:{name:"Oil Flask",      type:"USE",   desc:"Fuel for the torch.",                   eff:{torch:200}},
  frost_vial:{name:"Frost Vial",    type:"USE",   desc:"Shatters cold. Freezes nearby foes.",   eff:{freezeEnemy:true}},
  smoke_bomb:{name:"Smoke Bomb",    type:"USE",   desc:"Vanish. Guaranteed escape.",            eff:{flee:true}},
  soul_flask:{name:"Soul Flask",    type:"USE",   desc:"Drains the spirit. Cures curses.",      eff:{cureCurse:true,fear:15}},
  ration:   {name:"Iron Ration",    type:"USE",   desc:"Military issue. Sustaining.",            eff:{hunger:40,hp:5}},
  sword:    {name:"Iron Sword",     type:"WEAPON",desc:"Standard issue. Heavy and reliable.",   stats:{atk:5}, props:{bleed:.08,crit:.10,critM:1.5}},
  fine_sword:{name:"Fine Blade",   type:"WEAPON",desc:"Expertly balanced. Rare.",               stats:{atk:7}, props:{bleed:.05,crit:.15,critM:1.8}},
  dagger:   {name:"Rusted Dagger", type:"WEAPON",desc:"Thin. Finds gaps.",                     stats:{atk:3}, props:{bleed:.05,crit:.28,critM:2.2,acc:.12}},
  axe:      {name:"Crude Axe",     type:"WEAPON",desc:"Unbalanced. Terrible wounds.",           stats:{atk:7}, props:{bleed:.22,crit:.06,critM:1.3}},
  war_axe:  {name:"War Axe",       type:"WEAPON",desc:"Built for carnage.",                    stats:{atk:9}, props:{bleed:.32,crit:.08,critM:1.4}},
  spear:    {name:"Broken Spear",  type:"WEAPON",desc:"Reach. Strikes first.",                 stats:{atk:6}, props:{bleed:.10,crit:.05,critM:1.2}},
  club:     {name:"Bone Club",     type:"WEAPON",desc:"Pulverizing. May stun.",               stats:{atk:5}, props:{stun:.30,crit:.04,critM:1.1}},
  flail:    {name:"Iron Flail",    type:"WEAPON",desc:"Ignores some armor.",                   stats:{atk:8}, props:{bleed:.08,defPen:5}},
  torch_wpn:{name:"Burning Torch", type:"WEAPON",desc:"Sets things alight.",                   stats:{atk:3}, props:{burn:.38}},
  cursed_blade:{name:"Cursed Blade",type:"WEAPON",desc:"Whispers. Cuts deep, but at a cost.", stats:{atk:12}, props:{bleed:.15,crit:.20,critM:2.0,selfCurse:true}},
  holy_mace:{name:"Holy Mace",     type:"WEAPON",desc:"Burns the undead. Glows faintly.",      stats:{atk:8}, props:{holyDmg:6,stun:.15}},
  venom_dagger:{name:"Venom Fang", type:"WEAPON",desc:"Drips poison.",                         stats:{atk:4}, props:{poison:.40,crit:.22,critM:2.0}},
  robes:    {name:"Torn Robes",    type:"ARMOR", desc:"Light fabric. Barely protects.",        stats:{def:1}},
  leather:  {name:"Leather Armor", type:"ARMOR", desc:"Rough hide. Stops light blows.",        stats:{def:3}},
  chain:    {name:"Chain Mail",    type:"ARMOR", desc:"Iron rings. Heavy but protective.",     stats:{def:5}},
  plate:    {name:"Plate Fragment",type:"ARMOR", desc:"Heavy iron. Significant protection.",   stats:{def:7}},
  dark_plate:{name:"Dark Plate",   type:"ARMOR", desc:"Fused with shadow. Amplifies fear.",    stats:{def:10}, props:{fearPerStep:0.2}},
  helmet:   {name:"Iron Helmet",   type:"HELMET",desc:"Protects the head.",                    stats:{def:2}},
  crown:    {name:"Bone Crown",    type:"HELMET",desc:"Whispers of the dead.",                 stats:{def:4}, props:{fearResist:0.5}},
  iron_key: {name:"Iron Key",      type:"KEY",   desc:"Opens something nearby."},
  black_gem:{name:"Black Gem",     type:"MISC",  desc:"Pulsates with cold light."},
  old_tome: {name:"Old Tome",      type:"MISC",  desc:"Forgotten script. Unsettles you."},
  gem_shard1:{name:"Onyx Shard",   type:"QUEST", desc:"A fractured piece of something ancient."},
  gem_shard2:{name:"Void Shard",   type:"QUEST", desc:"It feels cold to the touch."},
  gem_shard3:{name:"Abyssal Shard",type:"QUEST", desc:"It whispers when you hold it close."},
  // Crafting materials
  bone:     {name:"Bone Fragment", type:"CRAFT", desc:"Broken bone. Useful somehow."},
  dark_cloth:{name:"Dark Cloth",   type:"CRAFT", desc:"Torn from something that once moved."},
  venom_gland:{name:"Venom Gland", type:"CRAFT", desc:"Drips with green ichor."},
  iron_scrap:{name:"Iron Scrap",   type:"CRAFT", desc:"Twisted metal. Still workable."},
  soul_ember:{name:"Soul Ember",   type:"CRAFT", desc:"A faint light that pulses like a heartbeat."},
};

// ═══════════════════════════════════════════════════════════════
// § 5 · CRAFTING RECIPES
// ═══════════════════════════════════════════════════════════════
export const RECIPES = [
  { name:"Bone Club",     result:"club",        ingredients:[{id:"bone",qty:2}],                                    desc:"Lash bones together." },
  { name:"Bandage",       result:"bandage",     ingredients:[{id:"dark_cloth",qty:1}],                              desc:"Wrap wounds tight." },
  { name:"Antidote",      result:"antidote",    ingredients:[{id:"venom_gland",qty:1},{id:"herbs",qty:1}],          desc:"Counter-venom." },
  { name:"Venom Fang",    result:"venom_dagger",ingredients:[{id:"dagger",qty:1},{id:"venom_gland",qty:2}],         desc:"Coat the blade." },
  { name:"Smoke Bomb",    result:"smoke_bomb",  ingredients:[{id:"dark_cloth",qty:1},{id:"soul_ember",qty:1}],      desc:"Light and run." },
  { name:"Iron Ration",   result:"ration",      ingredients:[{id:"rawmeat",qty:1},{id:"bread",qty:1}],              desc:"Combine scraps." },
  { name:"Soul Flask",    result:"soul_flask",   ingredients:[{id:"soul_ember",qty:2}],                              desc:"Trap the light." },
  { name:"Holy Mace",     result:"holy_mace",   ingredients:[{id:"club",qty:1},{id:"soul_ember",qty:2},{id:"iron_scrap",qty:1}], desc:"Blessed violence." },
  { name:"Frost Vial",    result:"frost_vial",   ingredients:[{id:"potion",qty:1},{id:"soul_ember",qty:1}],          desc:"Cold as death." },
];

// ═══════════════════════════════════════════════════════════════
// § 6 · CLASSES & ABILITIES
// ═══════════════════════════════════════════════════════════════
export const CLS = {
  soldier:  {name:"Soldier",   desc:"Hardened warrior. Strong, not built for the horrors below.", hp:45,atk:12,def:6,agi:4,hunger:80, fear:20,torch:200,items:["sword","torch","meat"],       ability:"guard"},
  rogue:    {name:"Rogue",     desc:"Quick and cunning. Fragile. Frightens easily.",              hp:30,atk:9, def:3,agi:9,hunger:70, fear:35,torch:150,items:["dagger","torch","torch","bread"],ability:"backstab"},
  scholar:  {name:"Scholar",   desc:"Studies old texts. Weak in body, careful in mind.",         hp:22,atk:5, def:2,agi:5,hunger:65, fear:15,torch:300,items:["torch","torch","herbs","bread","old_tome"],ability:"study"},
  outlander:{name:"Outlander", desc:"A survivor. Knows hunger well. Knows little else.",         hp:35,atk:8, def:4,agi:6,hunger:100,fear:25,torch:100,items:["axe","meat","meat","meat","torch"],ability:"endure"},
};

export const ABLS = {
  guard:    {name:"Iron Guard",  desc:"Next hit reduced by 75%.",      cd:4},
  backstab: {name:"Backstab",    desc:"Triple damage on next attack.",  cd:-1},
  study:    {name:"Study",       desc:"2× damage next hit.",           cd:3},
  endure:   {name:"Second Wind", desc:"Restore 20 HP immediately.",    cd:5},
};

// ═══════════════════════════════════════════════════════════════
// § 7 · ENEMIES (16 types)
// ═══════════════════════════════════════════════════════════════
export const EDEFS = {
  rat:    {name:"Rat Beast",    ch:"r",col:"#a16207",hp:12, atk:4, def:1, agi:6,fear:3, xp:8,  loot:[{id:"rawmeat",c:.6}],
    sp:{n:"Swarm",t:.25,fn:e=>({dmg:3,tgt:"torso",msg:`${e.name} bites again!`})}},
  guard:  {name:"Hollow Guard", ch:"G",col:"#6b7280",hp:28, atk:8, def:5, agi:3,fear:10,xp:15, loot:[{id:"meat",c:.35},{id:"bandage",c:.2},{id:"iron_scrap",c:.25}],
    sp:{n:"Shield Bash",t:.22,fn:e=>({dmg:4,tgt:"torso",msg:`${e.name} bashes you! Staggered.`,stun:true})}},
  skele:  {name:"Skeleton",     ch:"s",col:"#9ca3af",hp:20, atk:6, def:3, agi:4,fear:13,xp:12, loot:[{id:"bone",c:.7},{id:"bone",c:.4}],
    sp:{n:"Bone Throw",t:.30,fn:e=>({dmg:e.atk,tgt:"torso",msg:`${e.name} hurls a bone!`,guaranteed:true})}},
  flesh:  {name:"Flesh Mass",   ch:"M",col:"#dc2626",hp:45, atk:13,def:6, agi:2,fear:28,xp:30, loot:[{id:"rawmeat",c:.8},{id:"potion",c:.25},{id:"dark_cloth",c:.3}],
    sp:{n:"Devour",t:.18,fn:e=>({dmg:20,tgt:"torso",msg:`${e.name} engulfs you! DEVASTATING.`})}},
  cultist:{name:"Dark Cultist", ch:"C",col:"#7c3aed",hp:22, atk:6, def:2, agi:5,fear:18,xp:18, loot:[{id:"wine",c:.4},{id:"antidote",c:.2},{id:"soul_ember",c:.2}],
    sp:{n:"Dark Prayer",t:.35,fn:e=>({dmg:0,tgt:"torso",msg:`${e.name} chants. Fear spikes!`,fearDmg:24})}},
  troll:  {name:"Cave Troll",   ch:"T",col:"#4d7c0f",hp:60, atk:14,def:7, agi:2,fear:20,xp:35, loot:[{id:"meat",c:.5},{id:"leather",c:.3},{id:"bone",c:.6}],
    sp:{n:"Ground Slam",t:.20,fn:e=>({dmg:9,tgt:"rightLeg",msg:`${e.name} slams the ground!`})}},
  wraith: {name:"Shadow Wraith",ch:"W",col:"#6d28d9",hp:18, atk:8, def:0, agi:9,fear:35,xp:28, loot:[{id:"soul_ember",c:.5}],
    sp:{n:"Soul Drain",t:.42,fn:e=>({dmg:4,tgt:"head",msg:`${e.name} reaches into your soul!`,fearDmg:20})}},
  plague: {name:"Plague Rat",   ch:"P",col:"#65a30d",hp:16, atk:5, def:1, agi:7,fear:8, xp:14, loot:[{id:"antidote",c:.25},{id:"venom_gland",c:.4}],
    sp:{n:"Infect",t:.40,fn:e=>({dmg:2,tgt:"torso",msg:`${e.name} bites deep. Something enters your blood.`,poison:true})}},
  golem:  {name:"Iron Golem",   ch:"I",col:"#64748b",hp:70, atk:11,def:12,agi:1,fear:22,xp:40, loot:[{id:"iron_key",c:.3},{id:"chain",c:.2},{id:"iron_scrap",c:.6}],
    sp:{n:"Fortify",t:.28,fn:e=>({dmg:0,tgt:"torso",msg:`${e.name} hardens its shell.`,fortify:true})}},
  mimic:  {name:"Mimic",        ch:"!",col:"#b45309",hp:30, atk:10,def:4, agi:6,fear:25,xp:22, loot:[{id:"potion",c:.5},{id:"greatpot",c:.2}],
    sp:{n:"Surprise Bite",t:.35,fn:e=>({dmg:15,tgt:"rightArm",msg:`The chest springs to life and BITES!`,guaranteed:true})}},
  banshee:{name:"Banshee",      ch:"B",col:"#818cf8",hp:15, atk:5, def:0, agi:10,fear:45,xp:32, loot:[{id:"soul_ember",c:.6}],
    sp:{n:"Wail",t:.50,fn:e=>({dmg:0,tgt:"head",msg:`An unholy scream tears through your mind!`,fearDmg:30})}},
  spider: {name:"Cave Spider",  ch:"x",col:"#57534e",hp:14, atk:6, def:2, agi:8,fear:10,xp:12, loot:[{id:"venom_gland",c:.5},{id:"dark_cloth",c:.3}],
    sp:{n:"Web Trap",t:.38,fn:e=>({dmg:0,tgt:"leftLeg",msg:`${e.name} wraps you in sticky web!`,stun:true})}},
  infernal:{name:"Infernal",    ch:"∞",col:"#ef4444",hp:50, atk:15,def:5, agi:4,fear:30,xp:45, loot:[{id:"soul_ember",c:.8},{id:"soul_ember",c:.4}],
    sp:{n:"Hellfire",t:.30,fn:e=>({dmg:12,tgt:"torso",msg:`${e.name} erupts in flames!`,burn:true})}},
  revenant:{name:"Revenant",    ch:"R",col:"#6366f1",hp:35, atk:10,def:3, agi:5,fear:30,xp:35, loot:[{id:"dark_cloth",c:.5},{id:"bone",c:.4}],
    sp:{n:"Grave Chill",t:.32,fn:e=>({dmg:6,tgt:"torso",msg:`${e.name} breathes cold death!`,freeze:true})}},
  // BOSSES
  warden: {name:"The Warden",   ch:"Ω",col:"#c026d3",hp:130,atk:18,def:10,agi:4,fear:50,xp:250,boss:true, loot:[{id:"black_gem",c:1},{id:"greatpot",c:1}],
    sp:{n:"Warden's Curse",t:.32,fn:e=>({dmg:14,tgt:"torso",msg:`The Warden's curse tears through you!`,fearDmg:18,weaken:true})}},
  colossus:{name:"The Colossus",ch:"Θ",col:"#f97316",hp:200,atk:22,def:14,agi:2,fear:40,xp:500,boss:true, loot:[{id:"cursed_blade",c:1},{id:"greatpot",c:1},{id:"greatpot",c:1}],
    sp:{n:"Earthshatter",t:.28,fn:e=>({dmg:18,tgt:"leftLeg",msg:`The Colossus crushes the earth beneath you!`,stun:true})}},
};

export const FTABLES = [
  ["rat","rat","rat","guard","skele"],                          // Floor 1
  ["guard","skele","cultist","plague","rat"],                   // Floor 2
  ["skele","flesh","cultist","troll","spider"],                 // Floor 3
  ["flesh","wraith","golem","troll","mimic"],                   // Floor 4
  ["wraith","banshee","infernal","revenant"],                   // Floor 6
  ["infernal","revenant","golem","banshee","mimic"],            // Floor 7
  ["infernal","revenant","wraith","banshee","golem"],           // Floor 8
  ["infernal","revenant","banshee","golem","flesh"],            // Floor 9
];

// ═══════════════════════════════════════════════════════════════
// § 8 · TRAP SYSTEM
// ═══════════════════════════════════════════════════════════════
export const TRAP_TYPES = {
  spike:   { name:"Spike Trap",   dmg:8,  tgt:"rightLeg", msg:"Spikes pierce your leg!", effect:null },
  poison:  { name:"Poison Dart",  dmg:3,  tgt:"torso",    msg:"A dart strikes your chest!", effect:"POISONED" },
  fear:    { name:"Horror Sigil", dmg:0,  tgt:null,       msg:"Ancient symbols burn into your mind!", fearDmg:25 },
  teleport:{ name:"Warp Plate",   dmg:0,  tgt:null,       msg:"Reality shifts! You are elsewhere.", teleport:true },
};

// ═══════════════════════════════════════════════════════════════
// § 9 · NARRATIVE (Quests, Lore, NPCs)
// ═══════════════════════════════════════════════════════════════
export const LORE = {
  bestiary: {
    "Rat Beast":"Mutated by the dark. They feed on whatever falls.",
    "Hollow Guard":"Once noble protectors. Their minds eroded long ago.",
    "The Warden":"The architect of this prison. He locked himself in.",
    "Mimic":"Waits. Patient as stone. Opens when you reach for hope.",
    "Banshee":"The grief of the dead given form. Its scream can shatter minds.",
    "The Colossus":"A monument to war, animated by something old. It does not think.",
  },
  entries: {
    1: { title:"First Descent", text:"The door locked behind me. There is no way back up. Only deeper." },
    2: { title:"Blood Stained Note", text:"Do not trust the shadows. They have teeth." },
    3: { title:"Origin of the Gem", text:"The Black Gem controls the lower depths. Broken into three shards." },
    4: { title:"The Deep Ones", text:"Below floor 5, the architecture changes. Someone—something—built this." },
    5: { title:"The Colossus Inscription", text:"It was a god once. Now it is a door." },
  }
};

export const QUESTS = {
  blackGem:{ name:"The Black Gem", desc:"Find 3 shards to unlock the true path.", total:3 },
  warden:  { name:"Warden's Origin", desc:"Uncover the history of this prison.", total:3 },
  colossus:{ name:"The Deep Gate", desc:"Defeat the Colossus on Floor 10.", total:1 },
};

export const NPC_DEFS = {
  merchant: {
    id:"merchant", name:"The Merchant", ch:"M", col:"#ca8a04", floors:[2,3,4,7],
    dialogue: {
      start: { text:"You survive longer than most. Trade with me.", choices:[{label:"Trade",next:"trade"},{label:"Who are you?",next:"lore"},{label:"Leave",next:null}] },
      lore: { text:"I was a prisoner. Now a purveyor. The Warden allows my existence... for now.", choices:[{label:"Trade",next:"trade"},{label:"Leave",next:null}] },
      trade: { type:"TRADE", text:"What do you offer?" }
    }
  },
  prophet: {
    id:"prophet", name:"Blind Prophet", ch:"P", col:"#9333ea", floors:[1,3,6],
    dialogue: {
      start: { text:"I see you with the darkness we share. Seek the three shards.", choices:[{label:"What shards?",next:"shards"},{label:"Leave",next:null}] },
      shards: { text:"One in blood. One in iron. One in madness. Find them.", choices:[{label:"I will.",next:null}] }
    }
  },
  blacksmith: {
    id:"blacksmith", name:"The Smith", ch:"S", col:"#f97316", floors:[4,6,8],
    dialogue: {
      start: { text:"Metal sings in the deep. I make it scream. Bring me materials.", choices:[{label:"Craft",next:"craft"},{label:"How did you survive?",next:"lore"},{label:"Leave",next:null}] },
      lore: { text:"The forge keeps the dark at bay. Fire is the oldest friend of man.", choices:[{label:"Craft",next:"craft"},{label:"Leave",next:null}] },
      craft: { type:"CRAFT", text:"What shall we make?" }
    }
  },
  prisoner: {
    id:"prisoner", name:"Chained One", ch:"?", col:"#dc2626", floors:[5,8],
    dialogue: {
      start: { text:"*Chains rattle* ...kill me. Or free me. Both are mercy.", choices:[{label:"Free them",next:"free"},{label:"...Kill them",next:"kill"},{label:"Walk away",next:null}] },
      free: { text:"*They stagger upward* ...the key... floor 10... thank you...", choices:[{label:"Go.",next:null}] },
      kill: { text:"*Silence falls* ...perhaps that was the mercy they wanted.", choices:[{label:"...",next:null}] },
    }
  },
};

// ═══════════════════════════════════════════════════════════════
// § 10 · EVENTS
// ═══════════════════════════════════════════════════════════════
export const EV_DEF = {
  altar:{ch:"†",col:"#7c3aed",name:"Dark Altar",desc:"An altar stained with old blood.",
    choices:[
      {label:"Pray for mercy",  fn:p=>[{...p,hp:Math.min(p.maxHp,p.hp+15),fear:Math.min(100,p.fear+15)},"Pain eases. Fear deepens."]},
      {label:"Offer blood",     fn:p=>[{...p,hp:Math.max(1,p.hp-10),fear:Math.max(0,p.fear-28)},"You bleed onto the altar. Fear retreats."]},
      {label:"Combine Shards", req:p=>p.quests.blackGem===3, fn:p=>[{...p,quests:{...p.quests,blackGem:4}},"The shards fuse. A path opens."]},
      {label:"Walk away",       fn:p=>[{...p},"It feels disappointed."]},
    ]},
  well:{ch:"○",col:"#0891b2",name:"Stone Well",desc:"Dark water, still and cold.",
    choices:[
      {label:"Drink deep",  fn:p=>Math.random()<.55?[{...p,hunger:Math.min(100,p.hunger+32)},"The water is stale but filling."]:[{...p,statuses:[...p.statuses,{type:"POISONED",dur:14}]},"Something was in the water."]},
      {label:"Search bottom", req:p=>p.quests.blackGem===0, fn:p=>[{...p,quests:{...p.quests,blackGem:1}},"You found an Onyx Shard in the muck!","gem_shard1"]},
      {label:"Walk away",   fn:p=>[{...p},"You leave the well alone."]},
    ]},
  corpse:{ch:"✝",col:"#4b5563",name:"Fresh Corpse",desc:"A body. Still warm.",
    choices:[
      {label:"Search body", fn:(p,drop)=>Math.random()<.6?[{...p},"You find something.",drop]:[{...p,fear:Math.min(100,p.fear+12)},"Nothing but the smell."]},
      {label:"Leave it",    fn:p=>[{...p},"You leave the body in peace."]},
    ]},
  inscription:{ch:"§",col:"#78716c",name:"Carved Message",desc:"Words carved with frantic urgency.",
    choices:[
      {label:"Read it",    fn:p=>[{...p,fear:Math.min(100,p.fear+8),quests:{...p.quests,wardenOrigin:Math.min(3,p.quests.wardenOrigin+1)}},
        ['"They are not dead. They wait."','"THE STAIRS ONLY GO DOWN."','"I counted 47. Then stopped."','"If you find this — run."','"Below floor 5, the walls breathe."'][Math.floor(Math.random()*5)]]},
      {label:"Ignore it",  fn:p=>[{...p},"Some things are better unread."]},
    ]},
  fountain:{ch:"◊",col:"#38bdf8",name:"Frozen Fountain",desc:"Ice-blue water that never freezes despite the cold.",
    choices:[
      {label:"Drink",     fn:p=>[{...p,hp:Math.min(p.maxHp,p.hp+20),hunger:Math.min(100,p.hunger+15),statuses:p.statuses.filter(s=>s.type!=="POISONED")},"Pure. Cleansing. A miracle in this place."]},
      {label:"Fill flask", fn:p=>[{...p,torch:Math.min(600,p.torch+100)},"The glow sustains your torch somehow."]},
      {label:"Leave it",  fn:p=>[{...p},"You leave the fountain untouched."]},
    ]},
  cage:{ch:"▪",col:"#dc2626",name:"Iron Cage",desc:"Something inside moves feebly.",
    choices:[
      {label:"Open it",   fn:p=>Math.random()<.4?[{...p,fear:Math.min(100,p.fear+20)},"A rotted face lunges! Nothing else."]:[{...p},"Empty. Just chains and old blood.","potion"]},
      {label:"Destroy it", fn:p=>[{...p,fear:Math.min(100,p.fear+5)},"Metal screams. Whatever was inside is free now.","iron_scrap"]},
      {label:"Walk away",  fn:p=>[{...p},"The whimpering follows you."]},
    ]},
};

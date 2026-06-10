// Shared definitions for game core

export const ITEM_DEFS: Record<string, any> = {
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

export const CLASS_DEFS: Record<string, any> = {
  soldier:  {name:"Soldier",   desc:"Hardened warrior. Strong, not built for the horrors below.", hp:45,atk:12,def:6,agi:4,hunger:80, fear:20,torch:200,items:["sword","torch","meat"],       ability:"guard", spriteIdx:0},
  rogue:    {name:"Rogue",     desc:"Quick and cunning. Fragile. Frightens easily.",              hp:30,atk:9, def:3,agi:9,hunger:70, fear:35,torch:150,items:["dagger","torch","torch","bread"],ability:"backstab", spriteIdx:1},
  scholar:  {name:"Scholar",   desc:"Studies old texts. Weak in body, careful in mind.",         hp:22,atk:5, def:2,agi:5,hunger:65, fear:15,torch:300,items:["torch","torch","herbs","bread","old_tome"],ability:"study", spriteIdx:2},
  outlander:{name:"Outlander", desc:"A survivor. Knows hunger well. Knows little else.",         hp:35,atk:8, def:4,agi:6,hunger:100,fear:25,torch:100,items:["axe","meat","meat","meat","torch"],ability:"endure", spriteIdx:3},
};

export const ABILITY_DEFS: Record<string, any> = {
  guard:    {name:"Iron Guard",  desc:"Next hit reduced by 75%.",          cd:4},
  backstab: {name:"Backstab",    desc:"Triple damage on next attack.",      cd:-1},
  study:    {name:"Study",       desc:"2× damage next hit.",               cd:3},
  endure:   {name:"Second Wind", desc:"Restore 20 HP immediately.",        cd:5},
};

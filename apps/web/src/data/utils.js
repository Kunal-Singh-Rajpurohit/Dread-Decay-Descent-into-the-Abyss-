import { MW, MH, TS, TR_FULL, TR_DIM, TR_DARK, T, PMUL, PLAB, XP_LV, SCOL, SPRITE_CONFIG, ITEMS, CLS, ABLS, EDEFS, FTABLES, EV_DEF } from './gameData.js';
import { NPC_DEFS } from './narrative-systems.js';
// § 7 · PURE HELPERS
// ═══════════════════════════════════════════════════════
const rng =(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const flip=p=>Math.random()<p;
const uid =()=>Math.random().toString(36).slice(2,8);
function makeParts(hp){const mk=f=>({hp:Math.ceil(hp*f),max:Math.ceil(hp*f),severed:false});return{head:mk(.20),torso:mk(.40),rightArm:mk(.10),leftArm:mk(.10),rightLeg:mk(.10),leftLeg:mk(.10)};}
function getTR(p){return p.torch<=0?TR_DARK:p.torch<35?TR_DIM:TR_FULL;}
function getLv(xp){let l=0;XP_LV.forEach((t,i)=>{if(xp>=t)l=i;});return l;}
function getAtk(p){return p.atk+(p.weapon?ITEMS[p.weapon]?.stats?.atk||0:0);}
function getDef(p){return p.def+(p.armor?ITEMS[p.armor]?.stats?.def||0:0)+(p.helmet?ITEMS[p.helmet]?.stats?.def||0:0);}
function hasSt(p,t){return p.statuses.some(s=>s.type===t);}

function survivalTick(p){
  const out={...p,statuses:[...p.statuses]};const msgs=[];
  out.hunger=Math.max(0,out.hunger-.5);
  out.torch =Math.max(0,out.torch-1);
  if(out.hunger===0){out.hp=Math.max(0,out.hp-1);if(out.steps%6===0)msgs.push("Hunger consumes you from within...");}
  if(out.torch===0){out.fear=Math.min(100,out.fear+.4);if(out.steps%10===0)msgs.push("Darkness. Pure, absolute darkness.");}
  out.statuses=out.statuses.reduce((acc,s)=>{
    const ns={...s,dur:s.dur>0?s.dur-1:s.dur};
    if(s.type==="BLEEDING"&&out.steps%4===0){out.hp=Math.max(0,out.hp-1);if(out.steps%12===0)msgs.push("You bleed...");}
    if(s.type==="POISONED"){out.hp=Math.max(0,out.hp-2);if(out.steps%3===0)msgs.push("Poison burns.");if(ns.dur<=0)return acc;}
    if(s.type==="BURNING"){out.hp=Math.max(0,out.hp-2);out.fear=Math.min(100,out.fear+1);if(out.steps%2===0)msgs.push("You burn!");if(ns.dur<=0)return acc;}
    if(s.type==="REGEN"&&out.steps%5===0)out.hp=Math.min(out.maxHp,out.hp+1);
    if(ns.dur===0&&s.type!=="BLEEDING"&&s.type!=="REGEN")return acc;
    acc.push(ns);return acc;
  },[]);
  if(out.abilityCD>0&&out.steps%2===0)out.abilityCD=Math.max(0,out.abilityCD-1);
  return{p:out,msgs};
}

// ═══════════════════════════════════════════════════════
// § 8 · DUNGEON GENERATOR
// ═══════════════════════════════════════════════════════
function genDungeon(floor=1){
  const map=Array.from({length:MH},()=>Array(MW).fill(T.W));
  const rooms=[];
  const carve=(x,y,w,h)=>{for(let r=y;r<y+h;r++)for(let c=x;c<x+w;c++)map[r][c]=T.F;};
  const tunn=(x1,y1,x2,y2)=>{let cx=x1,cy=y1;while(cx!==x2){map[cy][cx]=T.F;cx+=cx<x2?1:-1;}while(cy!==y2){map[cy][cx]=T.F;cy+=cy<y2?1:-1;}};
  for(let att=0;att<130&&rooms.length<8;att++){
    const w=rng(4,9),h=rng(3,6),x=rng(1,MW-w-2),y=rng(1,MH-h-2);
    if(rooms.some(r=>x<r.x+r.w+1&&x+w+1>r.x&&y<r.y+r.h+1&&y+h+1>r.y))continue;
    carve(x,y,w,h);
    if(rooms.length>0){const p=rooms[rooms.length-1];tunn(~~(p.x+p.w/2),~~(p.y+p.h/2),~~(x+w/2),~~(y+h/2));}
    rooms.push({x,y,w,h});
  }
  const lr=rooms[rooms.length-1];
  const sx=~~(lr.x+lr.w/2),sy=~~(lr.y+lr.h/2);
  map[sy][sx]=T.S;
  const spawn={x:~~(rooms[0].x+rooms[0].w/2),y:~~(rooms[0].y+rooms[0].h/2)};
  const isBoss=floor===5;
  const enemies=[];
  if(isBoss){
    const d=EDEFS.warden;
    enemies.push({...JSON.parse(JSON.stringify(d)),eid:`warden_${floor}`,x:sx,y:Math.max(1,sy-2),parts:makeParts(d.hp),buffDef:0,stunned:false,bleeding:false,bossPhase:1});
  } else {
    const pool=FTABLES[Math.min(floor-1,FTABLES.length-1)];
    rooms.slice(1,-1).forEach((room,i)=>{
      if(!flip(.82))return;
      const type=pool[rng(0,pool.length-1)];
      const d=EDEFS[type];
      enemies.push({...JSON.parse(JSON.stringify(d)),type,eid:`${type}_${i}_${floor}`,x:~~(room.x+room.w/2),y:~~(room.y+room.h/2),parts:makeParts(d.hp),buffDef:0,stunned:false,bleeding:false});
    });
  }
  const gi=[];
  const base=floor<3?["torch","meat","herbs","potion","rawmeat","bandage"]:["potion","greatpot","herbs","wine","antidote","torch_lg","oil_flask"];
  rooms.slice(1).forEach((room,i)=>{if(!flip(.55))return;gi.push({gid:`gi_${i}_${floor}`,iid:base[rng(0,base.length-1)],x:room.x+1+rng(0,room.w-3),y:room.y+1+rng(0,room.h-3)});});
  if(floor>=2&&flip(.45)){const wpns=floor===2?["spear","club"]:floor===3?["flail","war_axe"]:["fine_sword","war_axe"];const rm=rooms[rng(1,rooms.length-2)];gi.push({gid:`wpn_${floor}`,iid:wpns[rng(0,wpns.length-1)],x:rm.x+1,y:rm.y+1});}
  if(floor>=2&&flip(.38)){const arms=floor===2?["leather","robes"]:floor===3?["chain","helmet"]:["plate","chain"];const rm=rooms[rng(1,rooms.length-2)];gi.push({gid:`arm_${floor}`,iid:arms[rng(0,arms.length-1)],x:rm.x+2,y:rm.y+1});}
  
  // NPC Placement
  const npcs = [];
  Object.values(NPC_DEFS).forEach(def => {
    if(def.floors.includes(floor) && flip(.6)) {
      const rm = rooms[rng(1,rooms.length-2)];
      npcs.push({ ...def, x: rm.x+2, y: rm.y+2, nid: `npc_${def.id}_${floor}` });
    }
  });

  const events=[];
  const ets=Object.keys(EV_DEF);
  rooms.slice(1,-1).forEach((room,i)=>{if(!flip(.45))return;events.push({eid:`ev_${i}_${floor}`,type:ets[rng(0,ets.length-1)],x:room.x+rng(1,room.w-2),y:room.y+rng(1,room.h-2),done:false});});
  return{map,rooms,spawn,enemies,gi,events,npcs,stair:{x:sx,y:sy},isBoss};
}

// ═══════════════════════════════════════════════════════
// § 9 · FOV
// ═══════════════════════════════════════════════════════
function computeFOV(map,px,py,r){
  const vis=new Set();const rays=Math.ceil(r*Math.PI*4);
  for(let i=0;i<rays;i++){const a=(i/rays)*Math.PI*2;let rx=px,ry=py;const dx=Math.cos(a)*.5,dy=Math.sin(a)*.5;
    for(let s=0;s<=r*2;s++){const tx=Math.round(rx),ty=Math.round(ry);if(tx<0||tx>=MW||ty<0||ty>=MH)break;vis.add(`${tx},${ty}`);if(map[ty][tx]===T.W)break;rx+=dx;ry+=dy;}}
  return vis;
}

// ═══════════════════════════════════════════════════════
// § 10 · COMBAT
// ═══════════════════════════════════════════════════════
function pAttack(player,enemy,part){
  const msgs=[];const ne=JSON.parse(JSON.stringify(enemy));let np={...player,statuses:[...player.statuses]};
  if(hasSt(np,"STUNNED")){np.statuses=np.statuses.filter(s=>s.type!=="STUNNED");return{msgs:["You are stunned! Attack fails."],ne,np,dead:false,sever:false};}
  const props=player.weapon?ITEMS[player.weapon]?.props||{}:{};
  const isWeak=hasSt(np,"WEAKENED");
  const hitP=Math.min(.95,.70+(np.agi-(ne.agi||4))*.03+(props.acc||0));
  if(!flip(hitP))return{msgs:[`You swing at the ${ne.name}'s ${PLAB[part]}... and miss!`],ne,np,dead:false,sever:false};
  const isCrit=flip(props.crit||0);const critM=isCrit?props.critM||1.5:1;
  const backstabM=np.backstabReady?(np.backstabReady=false,3):1;
  const studyM=np.studyBonus||1;np.studyBonus=1;
  const weakM=isWeak?.5:1;const eDef=Math.max(0,(ne.def+ne.buffDef)-(props.defPen||0));
  const dmg=Math.max(1,Math.floor(getAtk(np)*PMUL[part]*critM*backstabM*studyM*weakM-eDef+rng(-2,3)));
  ne.hp=Math.max(0,ne.hp-dmg);ne.parts[part].hp=Math.max(0,ne.parts[part].hp-dmg);
  msgs.push(isCrit?`✦ Critical! ${ne.name}'s ${PLAB[part]} — ${dmg} damage!`:`You strike ${ne.name}'s ${PLAB[part]} for ${dmg} damage!`);
  let sever=false;
  if(!ne.parts[part].severed&&ne.parts[part].hp===0){ne.parts[part].severed=true;sever=true;msgs.push(`The ${PLAB[part]} is severed! Blood pours.`);np.fear=Math.min(100,np.fear+8);}
  if(props.bleed&&flip(props.bleed)&&!ne.bleeding){ne.bleeding=true;msgs.push("The wound bleeds.");}
  if(props.stun&&flip(props.stun)){ne.stunned=true;msgs.push(`The blow stuns the ${ne.name}!`);}
  if(props.burn&&flip(props.burn)){np.statuses=[...np.statuses.filter(s=>s.type!=="BURNING"),{type:"BURNING",dur:4}];msgs.push("The torch sets the enemy alight — and you too!");}
  if(ne.hp<=0)msgs.push(`The ${ne.name} falls. Silence.`);
  return{msgs,ne,np,dead:ne.hp<=0,sever};
}

function eAttack(enemy,player){
  const msgs=[];const np={...player,statuses:[...player.statuses],parts:JSON.parse(JSON.stringify(player.parts))};
  let ne=JSON.parse(JSON.stringify(enemy));
  if(ne.stunned){ne.stunned=false;return{msgs:[`${ne.name} is stunned and cannot attack!`],np,ne};}
  const tgt=Object.keys(PMUL)[rng(0,5)];
  if(!flip(.65))return{msgs:[`${ne.name} lunges — and misses!`],np,ne};
  const finalDmg=np.guarding?Math.max(1,Math.floor((Math.max(1,Math.floor(enemy.atk*PMUL[tgt]-getDef(player)+rng(-2,3))))*.25)):Math.max(1,Math.floor(enemy.atk*PMUL[tgt]-getDef(player)+rng(-2,3)));
  if(np.guarding){msgs.push("Your guard holds!");np.guarding=false;}
  np.hp=Math.max(0,np.hp-finalDmg);np.parts[tgt].hp=Math.max(0,np.parts[tgt].hp-finalDmg);
  msgs.push(`${enemy.name} tears into your ${PLAB[tgt]} for ${finalDmg} damage!`);
  if(!np.parts[tgt].severed&&np.parts[tgt].hp===0){np.parts[tgt].severed=true;np.fear=Math.min(100,np.fear+20);np.statuses=[...np.statuses,{type:"BLEEDING",dur:-1}];msgs.push(`Your ${PLAB[tgt]} is severed!`);}
  return{msgs,np,ne};
}

function eSpecial(enemy,player){
  if(!enemy.sp||!flip(enemy.sp.t))return null;
  const r=enemy.sp.fn(enemy,player);const msgs=[`[${enemy.sp.n}] ${r.msg}`];
  const np={...player,statuses:[...player.statuses],parts:JSON.parse(JSON.stringify(player.parts))};
  let ne=JSON.parse(JSON.stringify(enemy));
  if(r.dmg>0){
    const tgt=r.tgt||"torso";const def=getDef(player);
    const dmg=r.guaranteed?r.dmg:Math.max(1,r.dmg-def+rng(-1,2));
    np.hp=Math.max(0,np.hp-dmg);if(np.parts[tgt])np.parts[tgt].hp=Math.max(0,np.parts[tgt].hp-dmg);
    if(np.parts[tgt]&&!np.parts[tgt].severed&&np.parts[tgt].hp===0){np.parts[tgt].severed=true;np.fear=Math.min(100,np.fear+20);np.statuses=[...np.statuses,{type:"BLEEDING",dur:-1}];msgs.push(`Your ${PLAB[tgt]} is severed!`);}
  }
  if(r.fearDmg)np.fear=Math.min(100,np.fear+r.fearDmg);
  if(r.stun)np.statuses=[...np.statuses,{type:"STUNNED",dur:1}];
  if(r.poison)np.statuses=[...np.statuses.filter(s=>s.type!=="POISONED"),{type:"POISONED",dur:14}];
  if(r.weaken)np.statuses=[...np.statuses,{type:"WEAKENED",dur:3}];
  if(r.fortify)ne.buffDef=(ne.buffDef||0)+4;
  if(ne.boss&&ne.hp<ne.maxHp*.5&&ne.bossPhase===1){ne.bossPhase=2;ne.atk+=6;msgs.push("⚡ The Warden's form SHIFTS. Something is very wrong.");}
  return{msgs,np,ne};
}

function doAbl(player,enemy,abl){
  const msgs=[];let np={...player,statuses:[...player.statuses]};
  if(abl==="guard"){np.guarding=true;msgs.push("You brace. Next hit reduced by 75%.");}
  if(abl==="backstab"){np.backstabReady=true;msgs.push("You prepare a devastating backstab...");}
  if(abl==="study"){np.studyBonus=2;msgs.push(`You study the ${enemy.name}. Next hit does 2× damage.`);}
  if(abl==="endure"){np.hp=Math.min(np.maxHp,np.hp+20);msgs.push("Second Wind! +20 HP.");}
  np.abilityCD=ABLS[abl].cd===-1?9999:ABLS[abl].cd*2;
  return{msgs,np};
}

// ═══════════════════════════════════════════════════════
// § 11 · PLAYER FACTORY
// ═══════════════════════════════════════════════════════
function makePlayer(cls){
  const c=CLS[cls];
  return{x:0,y:0,cls,name:c.name,hp:c.hp,maxHp:c.hp,atk:c.atk,def:c.def,agi:c.agi,
    hunger:c.hunger,fear:c.fear,torch:c.torch,parts:makeParts(c.hp),statuses:[],
    floor:1,steps:0,xp:0,level:1,weapon:c.items.find(id=>ITEMS[id]?.type==="WEAPON")||null,
    armor:null,helmet:null,abilityCD:0,guarding:false,backstabReady:false,studyBonus:1,
    inv:c.items.map(id=>({uid:uid(),iid:id})),
    quests: { blackGem: 0, wardenOrigin: 0 },
    journal: { lore: [1], bestiary: [], quests: ["blackGem"] }
  };
}

// ═══════════════════════════════════════════════════════
export { rng, flip, uid, makeParts, getTR, getLv, getAtk, getDef, hasSt, survivalTick, genDungeon, computeFOV, pAttack, eAttack, eSpecial, doAbl, makePlayer };
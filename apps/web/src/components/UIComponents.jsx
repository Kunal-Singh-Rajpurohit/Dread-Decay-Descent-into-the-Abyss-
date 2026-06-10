import React, { useState } from 'react';
import { MW, MH, TS, TR_FULL, TR_DIM, TR_DARK, T, PMUL, PLAB, XP_LV, SCOL, SPRITE_CONFIG, ITEMS, CLS, ABLS, EDEFS, FTABLES, EV_DEF } from './gameData.js';
import { rng, flip, uid, makeParts, getTR, getLv, getAtk, getDef, hasSt, survivalTick, genDungeon, computeFOV, pAttack, eAttack, eSpecial, doAbl, makePlayer } from './utils.js';
// § 12 · UI COMPONENTS
// ═══════════════════════════════════════════════════════
function Bar({label,val,max,hi="#16a34a",mid="#ca8a04",lo="#dc2626"}){
  const pct=Math.max(0,Math.min(100,(val/max)*100)),col=pct>60?hi:pct>30?mid:lo;
  return(<div style={{marginBottom:5}}>
    <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:col,marginBottom:1}}><span>{label}</span><span>{Math.floor(val)}/{Math.floor(max)}</span></div>
    <div style={{height:4,background:"#0d0d0d",borderRadius:2,boxShadow:"inset 0 1px 3px rgba(0,0,0,0.8)"}}><div style={{height:4,borderRadius:2,width:`${pct}%`,background:col,transition:"width .12s"}}/></div>
  </div>);
}

function SidePanel({player,floor}){
  const wpn=player.weapon?ITEMS[player.weapon]:null,arm=player.armor?ITEMS[player.armor]:null,helm=player.helmet?ITEMS[player.helmet]:null;
  const lv=getLv(player.xp),nextXP=XP_LV[Math.min(lv+1,XP_LV.length-1)];
  const abl=player.cls?ABLS[CLS[player.cls]?.ability]:null;
  return(<div style={{fontSize:10,color:"#6b7280"}}>
    <div style={{borderBottom:"1px solid #111",paddingBottom:5,marginBottom:5}}>
      <div style={{color:"#e5e7eb",fontWeight:"bold",fontSize:12,letterSpacing:".05em"}}>{player.name}</div>
      <div style={{color:"#2d2d2d"}}>Fl.{floor} · Lv.{lv} · {player.steps}st</div>
      <div style={{color:"#1a1a1a",fontSize:9}}>XP {player.xp}/{nextXP}</div>
    </div>
    <Bar label="HP"     val={player.hp}    max={player.maxHp}/>
    <Bar label="HUNGER" val={player.hunger} max={100} hi="#d97706" mid="#b45309"/>
    <Bar label="FEAR"   val={player.fear}   max={100} hi="#4b5563" mid="#7c3aed"/>
    <Bar label="TORCH"  val={player.torch}  max={300} hi="#ca8a04" mid="#92400e"/>
    <div style={{marginTop:5,paddingTop:4,borderTop:"1px solid #111",fontSize:9,color:"#374151"}}>
      <div>ATK:{getAtk(player)} DEF:{getDef(player)} AGI:{player.agi}</div>
      {wpn&&<div style={{color:"#d97706",marginTop:1}}>⚔ {wpn.name}</div>}
      {arm&&<div style={{color:"#374151",marginTop:1}}>🛡 {arm.name}</div>}
      {helm&&<div style={{color:"#374151",marginTop:1}}>⛑ {helm.name}</div>}
    </div>
    {abl&&<div style={{marginTop:3,fontSize:8,color:player.abilityCD<=0?"#1d4ed8":"#1a1a1a",borderTop:"1px solid #0d0d0d",paddingTop:3}}>
      ✦ {abl.name}{player.abilityCD>0?` [CD:${player.abilityCD}]`:" [READY]"}
    </div>}
    {player.statuses.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:2,marginTop:4}}>
      {player.statuses.map((s,i)=><span key={i} style={{fontSize:7,padding:"1px 3px",border:`1px solid ${SCOL[s.type]||"#444"}`,color:SCOL[s.type]||"#888"}}>{s.type}{s.dur>0?` ${s.dur}`:""}</span>)}
    </div>}
    {player.guarding&&<div style={{fontSize:8,color:"#0891b2",marginTop:3}}>● GUARDING</div>}
    <div style={{borderTop:"1px solid #111",paddingTop:4,marginTop:4}}>
      <div style={{fontSize:9,color:"#1f2937",marginBottom:3}}>BODY</div>
      {Object.entries(player.parts).map(([k,p])=>{
        const pct=p.severed?0:(p.hp/p.max)*100,col=p.severed?"#3a0000":pct>60?"#166534":pct>25?"#92400e":"#7f1d1d";
        return(<div key={k} style={{display:"flex",alignItems:"center",gap:3,marginBottom:2}}>
          <span style={{width:30,fontSize:8,color:"#222"}}>{PLAB[k]}</span>
          <div style={{flex:1,height:2,background:"#0a0a0a",borderRadius:1}}><div style={{height:2,width:`${pct}%`,background:col,borderRadius:1}}/></div>
          {p.severed&&<span style={{fontSize:7,color:"#7f1d1d"}}>✗</span>}
        </div>);
      })}
    </div>
  </div>);
}

function MapView({map,player,enemies,gi,events,npcs,fov,seen}){
  const getSprite = (type, obj) => {
    // Pixel art renderer with CSS sprite sheets
    let bg = "none", pos = "0px 0px", ch = "", col = "transparent";
    
    if(type === 'floor') { bg = "url('./dungeon_tiles.png')"; pos = "0px 0px"; }
    else if(type === 'wall') { bg = "url('./dungeon_tiles.png')"; pos = "-16px 0px"; }
    else if(type === 'stair') { bg = "url('./dungeon_tiles.png')"; pos = "-32px 0px"; }
    else if(type === 'door') { bg = "url('./dungeon_tiles.png')"; pos = "-48px 0px"; }
    else if(type === 'player') { bg = "url('./player_sprites.png')"; pos = `-${CLS[obj.cls].spriteIdx * 16}px 0px`; }
    else if(type === 'enemy') { 
      bg = "url('./enemy_sprites.png')"; 
      pos = `-${(obj.spriteIdx || 0) * 16}px 0px`;
    }
    else if(type === 'item') { ch="!"; col="#b45309"; }
    else if(type === 'event') { ch=EV_DEF[obj.type]?.ch; col=EV_DEF[obj.type]?.col; }
    else if(type === 'npc') { ch=obj.ch; col=obj.col; }

    // Fallback if images fail to load
    if (bg === "none") {
      if(type==='wall') { ch="▓"; col="#252525"; }
      if(type==='floor') { ch="·"; col="#161414"; }
      if(type==='stair') { ch="▼"; col="#16a34a"; }
      if(type==='player') { ch="@"; col="#f59e0b"; }
      if(type==='enemy') { ch=obj.ch; col=obj.col; }
    }

    return { bg, pos, ch, col };
  };

  return(<div style={{display:"grid",gridTemplateColumns:`repeat(${MW},${TS}px)`,lineHeight:1,flexShrink:0}}>
    {map.map((row,y)=>row.map((tile,x)=>{
      const key=`${x},${y}`,isVis=fov.has(key),wasSeen=seen.has(key);
      const isPlay=player.x===x&&player.y===y;
      const en=isVis&&enemies.find(e=>e.x===x&&e.y===y);
      const it=isVis&&gi.find(g=>g.x===x&&g.y===y);
      const ev=isVis&&events.find(e=>e.x===x&&e.y===y&&!e.done);
      const npc=isVis&&npcs.find(n=>n.x===x&&n.y===y);
      
      let renderType = tile === T.W ? 'wall' : tile === T.S ? 'stair' : 'floor';
      let objData = null;
      
      if(isPlay) { renderType = 'player'; objData = player; }
      else if(en) { renderType = 'enemy'; objData = en; }
      else if(npc) { renderType = 'npc'; objData = npc; }
      else if(ev) { renderType = 'event'; objData = ev; }
      else if(it) { renderType = 'item'; objData = it; }

      const sprite = getSprite(renderType, objData);
      
      let opacity = 1;
      if(!wasSeen&&!isVis) opacity = 0;
      else if(wasSeen&&!isVis) opacity = 0.3;

      return(<div key={key} style={{
        width:TS,height:TS,
        display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:14,color:sprite.col,fontFamily:"'Courier New',monospace",
        backgroundImage: isVis || wasSeen ? sprite.bg : "none",
        backgroundPosition: sprite.pos,
        backgroundSize: renderType === 'player' ? SPRITE_CONFIG.bgSizePlayers : renderType === 'enemy' ? SPRITE_CONFIG.bgSizeEnemies : SPRITE_CONFIG.bgSizeTiles,
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
        opacity: opacity,
        boxShadow: isVis && renderType==='floor' ? "inset 0 0 10px rgba(0,0,0,0.5)" : "none",
        filter: isVis && player.torch<35 ? "brightness(0.7) sepia(0.3)" : "none"
      }}>{sprite.bg === "none" || !sprite.bg.includes('url') ? sprite.ch : ""}</div>);
    }))}
  </div>);
}

function CombatUI({combat,player,onAction,onPart,onAbility}){
  const en=combat.enemy,wpnAtk=getAtk(player);
  const props=player.weapon?ITEMS[player.weapon]?.props||{}:{};
  const eDef=Math.max(0,en.def+(en.buffDef||0));
  const estLo=Math.max(1,~~(wpnAtk*PMUL[combat.part]-eDef-2)),estHi=Math.max(estLo,~~(wpnAtk*PMUL[combat.part]-eDef+3));
  const hpPct=Math.max(0,(en.hp/en.maxHp)*100);
  const abl=player.cls?ABLS[CLS[player.cls]?.ability]:null;
  const ablReady=player.abilityCD<=0&&!combat.ablUsed;
  return(<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.94)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Courier New',monospace"}}>
    <div style={{border:"2px solid #3a0808",borderRadius:4,background:"#030008",padding:20,width:480,maxWidth:"95vw",boxShadow:"0 0 20px rgba(153, 27, 27, 0.2)"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:10,paddingBottom:8,borderBottom:"1px solid #1a0808"}}>
        <div>
          <div style={{color:en.col,fontSize:en.boss?20:17,fontWeight:"bold"}}>{en.boss?"⚡ ":""}{en.name}{en.bossPhase===2?" [ENRAGED]":""}</div>
          <div style={{color:"#374151",fontSize:9,marginTop:2}}>ATK:{en.atk} DEF:{eDef}</div>
          <div style={{display:"flex",gap:3,marginTop:3}}>
            {en.stunned&&<span style={{fontSize:7,color:"#d97706",border:"1px solid #713f12",padding:"1px 3px"}}>STUNNED</span>}
            {en.bleeding&&<span style={{fontSize:7,color:"#dc2626",border:"1px solid #7f1d1d",padding:"1px 3px"}}>BLEEDING</span>}
          </div>
          <div style={{height:4,background:"#1a0000",borderRadius:2,marginTop:6,width:150,boxShadow:"inset 0 1px 2px #000"}}>
            <div style={{height:4,borderRadius:2,width:`${hpPct}%`,background:en.boss?"#9333ea":"#991b1b",transition:"width .2s"}}/>
          </div>
          <div style={{fontSize:8,color:"#2d2d2d",marginTop:2}}>{en.hp}/{en.maxHp}</div>
        </div>
        <div style={{textAlign:"right",fontSize:8,color:"#1f2937"}}>
          {Object.entries(en.parts).map(([k,p])=>(
            <div key={k} style={{color:p.severed?"#2a1a1a":"#1e1e1e",textDecoration:p.severed?"line-through":"none",marginBottom:1}}>{PLAB[k]}: {p.severed?"✗":`${p.hp}/${p.max}`}</div>
          ))}
        </div>
      </div>
      {(hasSt(player,"STUNNED")||hasSt(player,"WEAKENED")||player.guarding||player.backstabReady)&&(
        <div style={{display:"flex",gap:3,marginBottom:8,flexWrap:"wrap"}}>
          {hasSt(player,"STUNNED")&&<span style={{fontSize:7,color:"#d97706",border:"1px solid #713f12",padding:"1px 4px"}}>YOU: STUNNED</span>}
          {hasSt(player,"WEAKENED")&&<span style={{fontSize:7,color:"#6b7280",border:"1px solid #374151",padding:"1px 4px"}}>YOU: WEAKENED</span>}
          {player.guarding&&<span style={{fontSize:7,color:"#0891b2",border:"1px solid #0e4f63",padding:"1px 4px"}}>GUARDING (-75%)</span>}
          {player.backstabReady&&<span style={{fontSize:7,color:"#dc2626",border:"1px solid #7f1d1d",padding:"1px 4px"}}>✦ BACKSTAB READY</span>}
        </div>
      )}
      <div style={{marginBottom:8}}>
        <div style={{fontSize:8,color:"#2d2d2d",marginBottom:4,letterSpacing:".12em"}}>TARGET:</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:3}}>
          {Object.entries(PMUL).map(([k,mul])=>{const p=en.parts[k],sel=combat.part===k;return(
            <button key={k} onClick={()=>!p?.severed&&onPart(k)}
              style={{padding:"5px 2px",border:`1px solid ${sel?"#991b1b":p?.severed?"#0d0d0d":"#1a1a1a"}`,background:sel?"#180000":"transparent",color:p?.severed?"#111":sel?"#ef4444":"#374151",fontSize:9,cursor:p?.severed?"default":"pointer",fontFamily:"'Courier New',monospace",textDecoration:p?.severed?"line-through":"none"}}>
              {PLAB[k]} ×{mul}{p?.severed?" ✗":""}
            </button>
          );})}
        </div>
      </div>
      <div style={{fontSize:8,color:"#1a1a1a",marginBottom:8}}>
        Est. dmg: {estLo}–{estHi} to {PLAB[combat.part]}{props.crit?` · ${~~(props.crit*100)}% crit×${props.critM}`:""}{props.bleed?` · ${~~(props.bleed*100)}% bleed`:""}
      </div>
      <div style={{display:"flex",gap:5}}>
        <button onClick={()=>onAction("ATTACK")} style={{flex:2,padding:"9px 0",border:"1px solid #991b1b",color:hasSt(player,"STUNNED")?"#4b1a1a":"#dc2626",background:hasSt(player,"STUNNED")?"transparent":"#1a0000",cursor:"pointer",fontFamily:"'Courier New',monospace",fontSize:12,fontWeight:"bold"}}>
          {hasSt(player,"STUNNED")?"⚡ STUNNED":"⚔ ATTACK"} → {PLAB[combat.part]}
        </button>
        {abl&&<button onClick={()=>ablReady&&onAbility()} style={{flex:1,padding:"9px 0",border:`1px solid ${ablReady?"#1d4ed8":"#111"}`,color:ablReady?"#60a5fa":"#1a1a1a",background:ablReady?"#00081a":"transparent",cursor:ablReady?"pointer":"default",fontFamily:"'Courier New',monospace",fontSize:8,textAlign:"center",lineHeight:1.4}}>
          {abl.name}<br/>{ablReady?"READY":`CD:${player.abilityCD}`}
        </button>}
        <button onClick={()=>onAction("FLEE")} style={{flex:1,padding:"9px 0",border:"1px solid #1a1a1a",color:"#374151",background:"transparent",cursor:"pointer",fontFamily:"'Courier New',monospace",fontSize:12}}>FLEE</button>
      </div>
    </div>
  </div>);
}

function InvUI({player,onClose,onUse,onEquip}){
  return(<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.97)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Courier New',monospace"}}>
    <div style={{border:"2px solid #1f2937",borderRadius:4,background:"#040404",padding:18,width:400,maxWidth:"94vw",maxHeight:"82vh",overflow:"auto",boxShadow:"0 0 30px rgba(0,0,0,1)"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:10,paddingBottom:7,borderBottom:"1px solid #111"}}>
        <div style={{color:"#e5e7eb",fontWeight:"bold",fontSize:12,letterSpacing:".1em"}}>INVENTORY</div>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#374151",cursor:"pointer",fontFamily:"'Courier New',monospace",fontSize:10}}>[ESC]</button>
      </div>
      <div style={{fontSize:8,color:"#1f2937",marginBottom:8}}>ATK:{getAtk(player)} DEF:{getDef(player)} AGI:{player.agi}</div>
      {player.inv.length===0?<div style={{color:"#1f2937",fontSize:11}}>Nothing here.</div>
       :player.inv.map(ii=>{const def=ITEMS[ii.iid];if(!def)return null;
         const isEq=player.weapon===ii.iid||player.armor===ii.iid||player.helmet===ii.iid;
         return(<div key={ii.uid} style={{borderBottom:"1px solid #0a0a0a",padding:"7px 0",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
           <div style={{flex:1,marginRight:8}}>
             <div style={{fontSize:11,color:isEq?"#d97706":def.type==="QUEST"?"#9333ea":"#d1d5db"}}>{def.name}{isEq?" [EQ]":""}</div>
             <div style={{fontSize:8,color:"#2d2d2d",marginTop:2,lineHeight:1.5}}>{def.desc}</div>
             <div style={{fontSize:8,color:"#374151",marginTop:1}}>
               {def.stats?.atk&&<span>ATK +{def.stats.atk} </span>}
               {def.stats?.def&&<span>DEF +{def.stats.def} </span>}
               {def.props?.crit&&<span>CRIT {~~(def.props.crit*100)}% </span>}
               {def.props?.bleed&&<span>BLEED {~~(def.props.bleed*100)}% </span>}
               {def.eff?.hp&&<span>HP +{def.eff.hp} </span>}
               {def.eff?.hunger&&<span>Hunger +{def.eff.hunger} </span>}
             </div>
           </div>
           <div style={{display:"flex",flexDirection:"column",gap:2}}>
             {def.type==="USE"&&<button onClick={()=>onUse(ii.uid)} style={{fontSize:8,border:"1px solid #1f2937",color:"#9ca3af",background:"none",cursor:"pointer",padding:"2px 5px",fontFamily:"'Courier New',monospace"}}>USE</button>}
             {(def.type==="WEAPON"||def.type==="ARMOR"||def.type==="HELMET")&&<button onClick={()=>onEquip(ii.uid,def.type)} style={{fontSize:8,border:"1px solid #713f12",color:"#d97706",background:"none",cursor:"pointer",padding:"2px 5px",fontFamily:"'Courier New',monospace"}}>EQUIP</button>}
           </div>
         </div>);
       })}
    </div>
  </div>);
}

function JournalUI({player,onClose}){
  const [tab, setTab] = useState("quests");
  return(<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.97)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Courier New',monospace"}}>
    <div style={{border:"2px solid #1f2937",borderRadius:4,background:"#040404",padding:18,width:440,maxWidth:"94vw",height:"70vh",display:"flex",flexDirection:"column",boxShadow:"0 0 30px rgba(0,0,0,1)"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:10,paddingBottom:7,borderBottom:"1px solid #111"}}>
        <div style={{display:"flex",gap:10}}>
          {["quests","lore","bestiary"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{background:"none",border:"none",color:tab===t?"#e5e7eb":"#374151",cursor:"pointer",fontFamily:"'Courier New',monospace",fontSize:12,textTransform:"uppercase",fontWeight:tab===t?"bold":"normal",borderBottom:tab===t?"1px solid #e5e7eb":"none"}}>{t}</button>
          ))}
        </div>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#374151",cursor:"pointer",fontFamily:"'Courier New',monospace",fontSize:10}}>[ESC]</button>
      </div>
      <div style={{flex:1,overflow:"auto",paddingRight:5}}>
        {tab==="quests"&&<div>
          {player.journal.quests.map(q=>{
            const def=QUESTS[q];
            return <div key={q} style={{marginBottom:15}}>
              <div style={{color:"#9333ea",fontSize:12}}>{def.name}</div>
              <div style={{color:"#6b7280",fontSize:9,marginTop:2}}>{def.desc}</div>
              <div style={{color:"#374151",fontSize:8,marginTop:2}}>Progress: {player.quests[q]}/{def.total}</div>
            </div>
          })}
        </div>}
        {tab==="lore"&&<div>
          {player.journal.lore.map(l=>{
            const def=LORE.entries[l];
            return <div key={l} style={{marginBottom:15,borderLeft:"2px solid #374151",paddingLeft:8}}>
              <div style={{color:"#d1d5db",fontSize:11}}>{def.title}</div>
              <div style={{color:"#6b7280",fontSize:9,marginTop:4,lineHeight:1.6,fontStyle:"italic"}}>"{def.text}"</div>
            </div>
          })}
        </div>}
        {tab==="bestiary"&&<div>
          {player.journal.bestiary.length===0?<div style={{color:"#1f2937",fontSize:10}}>You have seen nothing yet.</div>:
            player.journal.bestiary.map(b=>(
              <div key={b} style={{marginBottom:15}}>
                <div style={{color:"#dc2626",fontSize:12}}>{b}</div>
                <div style={{color:"#6b7280",fontSize:9,marginTop:2}}>{LORE.bestiary[b]||"A nightmare made flesh."}</div>
              </div>
          ))}
        </div>}
      </div>
    </div>
  </div>);
}

function DialogueUI({npc, node, onChoice, onClose}){
  return(<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.95)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Courier New',monospace",zIndex:50}}>
    <div style={{border:`2px solid ${npc.col}`,borderRadius:4,background:"#020009",padding:24,width:460,maxWidth:"94vw",boxShadow:`0 0 40px ${npc.col}33`}}>
      <div style={{color:npc.col,fontSize:16,fontWeight:"bold",marginBottom:12,letterSpacing:".1em"}}>{npc.name}</div>
      <div style={{color:"#d1d5db",fontSize:11,lineHeight:1.8,marginBottom:20,fontStyle:"italic"}}>"{node.text}"</div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {node.choices.map((c,i)=>(
          <button key={i} onClick={()=>c.next?onChoice(c.next):(c.type==="TRADE"?console.log("TRADE"):onClose())} 
            style={{padding:"10px 16px",border:"1px solid #1f2937",color:"#9ca3af",background:"#080808",cursor:"pointer",fontFamily:"'Courier New',monospace",fontSize:10,textAlign:"left",transition:"all .1s"}}
            onMouseOver={e=>{e.target.style.borderColor="#374151";e.target.style.color="#e5e7eb";}} onMouseOut={e=>{e.target.style.borderColor="#1f2937";e.target.style.color="#9ca3af";}}>
            → {c.label}
          </button>
        ))}
      </div>
    </div>
  </div>);
}

function EventModal({event,onChoice}){
  const d=EV_DEF[event.type];if(!d)return null;
  return(<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.95)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Courier New',monospace"}}>
    <div style={{border:`1px solid ${d.col}`,background:"#020009",padding:20,width:400,maxWidth:"94vw"}}>
      <div style={{color:d.col,fontSize:22,textAlign:"center",marginBottom:4}}>{d.ch}</div>
      <div style={{color:"#d1d5db",fontSize:14,fontWeight:"bold",textAlign:"center",marginBottom:6}}>{d.name}</div>
      <div style={{color:"#4b5563",fontSize:10,textAlign:"center",marginBottom:16,lineHeight:1.7}}>{d.desc}</div>
      <div style={{display:"flex",flexDirection:"column",gap:4}}>
        {d.choices.map((c,i)=>(
          <button key={i} onClick={()=>onChoice(i,event)} style={{padding:"10px 16px",border:"1px solid #1f2937",color:"#9ca3af",background:"transparent",cursor:"pointer",fontFamily:"'Courier New',monospace",fontSize:11,textAlign:"left",transition:"all .1s"}}
            onMouseOver={e=>{e.target.style.borderColor="#374151";e.target.style.color="#d1d5db";}} onMouseOut={e=>{e.target.style.borderColor="#1f2937";e.target.style.color="#9ca3af";}}>
            → {c.label}
          </button>
        ))}
      </div>
    </div>
  </div>);
}

function LevelUpModal({level,onChoose}){
  const opts=[{label:"+10 Max HP  (also heals 10)",k:"hp"},{label:"+2 Attack",k:"atk"},{label:"+2 Defense",k:"def"},{label:"Clear all status effects",k:"clear"},{label:"Ability cooldown –2",k:"cd"}];
  return(<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.97)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Courier New',monospace"}}>
    <div style={{border:"1px solid #ca8a04",background:"#040200",padding:22,width:360,maxWidth:"94vw"}}>
      <div style={{color:"#ca8a04",fontSize:20,textAlign:"center",marginBottom:4}}>LEVEL UP</div>
      <div style={{color:"#d97706",fontSize:12,textAlign:"center",marginBottom:18}}>Level {level} — choose a boon:</div>
      <div style={{display:"flex",flexDirection:"column",gap:4}}>
        {opts.map(o=>(
          <button key={o.k} onClick={()=>onChoose(o.k)} style={{padding:"10px 16px",border:"1px solid #713f12",color:"#d97706",background:"transparent",cursor:"pointer",fontFamily:"'Courier New',monospace",fontSize:12,textAlign:"left",transition:"background .1s"}}
            onMouseOver={e=>e.target.style.background="#0d0700"} onMouseOut={e=>e.target.style.background="transparent"}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  </div>);
}

function DPad({onMove,onPickup,onInventory,onJournal}){
  const bs={width:40,height:40,border:"1px solid #1a1a1a",background:"#040404",color:"#374151",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",touchAction:"none",userSelect:"none",fontFamily:"monospace"};
  return(<div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
      <button style={bs} onPointerDown={e=>{e.preventDefault();onMove(0,-1);}}>▲</button>
      <div style={{display:"flex",gap:3}}>
        <button style={bs} onPointerDown={e=>{e.preventDefault();onMove(-1,0);}}>◄</button>
        <button style={bs} onPointerDown={e=>{e.preventDefault();onMove(0,1);}}>▼</button>
        <button style={bs} onPointerDown={e=>{e.preventDefault();onMove(1,0);}}>►</button>
      </div>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:3}}>
      <button style={{...bs,width:54,fontSize:9}} onPointerDown={e=>{e.preventDefault();onPickup();}}>Z·Act</button>
      <button style={{...bs,width:54,fontSize:9}} onPointerDown={e=>{e.preventDefault();onInventory();}}>I·Inv</button>
      <button style={{...bs,width:54,fontSize:9}} onPointerDown={e=>{e.preventDefault();onJournal();}}>J·Jrnl</button>
    </div>
  </div>);
}

// ═══════════════════════════════════════════════════════
export { Bar, SidePanel, MapView, CombatUI, InvUI, JournalUI, DialogueUI, EventModal, LevelUpModal, WinScreen, DeathScreen, DPad };
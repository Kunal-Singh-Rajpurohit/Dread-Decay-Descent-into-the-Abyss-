import React, { useState } from 'react';
import { ITEMS, ABLS, CLS, LORE, QUESTS, EV_DEF } from './data.js';
import { PMUL, PLAB, XP_LV, SCOL } from './constants.js';
import { getLv, getAtk, getDef, hasSt, canCraft } from './engine.js';
import { ITEM_MAP, ENEMY_MAP, ENEMY_BIG_MAP } from './renderer.js';

export function Bar({label,val,max,hi="#16a34a",mid="#ca8a04",lo="#dc2626"}){
  const pct=Math.max(0,Math.min(100,(val/max)*100)),col=pct>60?hi:pct>30?mid:lo;
  return(<div style={{marginBottom:5}}>
    <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:col,marginBottom:1}}><span>{label}</span><span>{Math.floor(val)}/{Math.floor(max)}</span></div>
    <div style={{height:4,background:"#0d0d0d",borderRadius:2,boxShadow:"inset 0 1px 3px rgba(0,0,0,0.8)"}}><div style={{height:4,borderRadius:2,width:`${pct}%`,background:col,transition:"width .12s"}}/></div>
  </div>);
}

export function SidePanel({player,floor}){
  const wpn=player.weapon?ITEMS[player.weapon]:null,arm=player.armor?ITEMS[player.armor]:null,helm=player.helmet?ITEMS[player.helmet]:null;
  const lv=getLv(player.xp),nextXP=XP_LV[Math.min(lv+1,XP_LV.length-1)];
  const abl=player.cls?ABLS[CLS[player.cls]?.ability]:null;
  
  return(<div className="side-panel-content" style={{fontSize:10,color:"#6b7280"}}>
    <div className="side-panel-section">
      <div style={{borderBottom:"1px solid #111",paddingBottom:5,marginBottom:5}}>
        <div style={{color:"#e5e7eb",fontWeight:"bold",fontSize:13,letterSpacing:".05em"}}>{player.name}</div>
        <div style={{color:"#2d2d2d", fontSize:11}}>Fl.{floor} · Lv.{lv} · {player.steps}st · K:{player.kills}</div>
        <div style={{color:"#1a1a1a",fontSize:10}}>XP {player.xp}/{nextXP}</div>
      </div>
      <Bar label="HP"     val={player.hp}    max={player.maxHp}/>
      <Bar label="HUNGER" val={player.hunger} max={100} hi="#d97706" mid="#b45309"/>
      <Bar label="FEAR"   val={player.fear}   max={100} hi="#4b5563" mid="#7c3aed"/>
      <Bar label="TORCH"  val={player.torch}  max={600} hi="#ca8a04" mid="#92400e"/>
    </div>
    
    <div className="side-panel-section" style={{fontSize:10}}>
      <div style={{paddingBottom:4,borderBottom:"1px solid #111",marginBottom:4,color:"#374151"}}>
        <div>ATK:{getAtk(player)} DEF:{getDef(player)} AGI:{player.agi}</div>
        {wpn&&<div style={{color:"#d97706",marginTop:2}}>⚔ {wpn.name}</div>}
        {arm&&<div style={{color:"#4b5563",marginTop:2}}>🛡 {arm.name}</div>}
        {helm&&<div style={{color:"#4b5563",marginTop:2}}>⛑ {helm.name}</div>}
      </div>
      {abl&&<div style={{marginTop:4,fontSize:9,color:player.abilityCD<=0?"#1d4ed8":"#1a1a1a"}}>
        ✦ {abl.name}{player.abilityCD>0?` [CD:${player.abilityCD}]`:` [Q]`}
      </div>}
      {player.statuses.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:2,marginTop:4}}>
        {player.statuses.map((s,i)=><span key={i} style={{fontSize:8,padding:"1px 4px",border:`1px solid ${SCOL[s.type]||"#444"}`,color:SCOL[s.type]||"#888",borderRadius:2}}>{s.type}{s.dur>0?` ${s.dur}`:""}</span>)}
      </div>}
    </div>

    <div className="side-panel-section">
      <div style={{fontSize:10,color:"#1f2937",marginBottom:4,fontWeight:"bold"}}>BODY PARTS</div>
      {Object.entries(player.parts).map(([k,p])=>{
        const pct=p.severed?0:(p.hp/p.max)*100,col=p.severed?"#3a0000":pct>60?"#166534":pct>25?"#92400e":"#7f1d1d";
        return(<div key={k} style={{display:"flex",alignItems:"center",gap:4,marginBottom:3}}>
          <span style={{width:35,fontSize:9,color:"#444"}}>{PLAB[k]}</span>
          <div style={{flex:1,height:4,background:"#0a0a0a",borderRadius:2}}><div style={{height:4,width:`${pct}%`,background:col,borderRadius:2}}/></div>
          {p.severed&&<span style={{fontSize:8,color:"#7f1d1d"}}>✗</span>}
        </div>);
      })}
    </div>
  </div>);
}

export function CombatUI({combat,player,onAction,onPart,onAbility}){
  const en=combat.enemy,wpnAtk=getAtk(player);
  const props=player.weapon?ITEMS[player.weapon]?.props||{}:{};
  const eDef=Math.max(0,en.def+(en.buffDef||0));
  const estLo=Math.max(1,~~(wpnAtk*PMUL[combat.part]-eDef-2)),estHi=Math.max(estLo,~~(wpnAtk*PMUL[combat.part]-eDef+3));
  const hpPct=Math.max(0,(en.hp/(en.maxHp||en.hp))*100);
  const abl=player.cls?ABLS[CLS[player.cls]?.ability]:null;
  const ablReady=player.abilityCD<=0&&!combat.ablUsed;
  
  let sprStyle = {width:28,height:28,background:"#111",borderRadius:2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:en.col,fontWeight:"bold"};
  let content = en.ch;
  if (en.type && ENEMY_BIG_MAP[en.type]) {
    const [r,c] = ENEMY_BIG_MAP[en.type];
    sprStyle = { width: 42, height: 42, borderRadius: 2, backgroundImage: "url('/enemy_sprites.png')", backgroundSize: "200% 200%", backgroundPosition: `${c*100}% ${r*100}%`, imageRendering: "pixelated", boxShadow: "0 0 10px rgba(0,0,0,0.5)" };
    content = null;
  } else if (en.type && ENEMY_MAP[en.type]) {
    const [r,c] = ENEMY_MAP[en.type];
    sprStyle = { width: 32, height: 32, borderRadius: 2, backgroundImage: "url('/enemy_sprites.png')", backgroundSize: "300% 200%", backgroundPosition: `${c*50}% ${r*100}%`, imageRendering: "pixelated", boxShadow: "0 0 10px rgba(0,0,0,0.5)" };
    content = null;
  }

  return(<div style={{position:"absolute",left:0,right:0,bottom:60,display:"flex",justifyContent:"center",fontFamily:"'Courier New',monospace",zIndex:40,pointerEvents:"none"}}>
    <div style={{pointerEvents:"auto",border:`2px solid ${en.boss?"#9333ea":"#3a0808"}`,borderRadius:4,backgroundImage:"url('/ui_panel.png')",backgroundSize:"100% 100%",imageRendering:"pixelated",padding:16,width:500,maxWidth:"95vw",boxShadow:`0 0 30px ${en.boss?"rgba(147,51,234,0.4)":"rgba(153,27,27,0.4)"}`}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:10,paddingBottom:8,borderBottom:"1px solid rgba(255,255,255,0.1)"}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={sprStyle}>{content}</div>
            <div>
              <div style={{color:en.col,fontSize:en.boss?20:17,fontWeight:"bold"}}>{en.boss?"⚡ ":""}{en.name}{en.bossPhase===2?" [ENRAGED]":""}</div>
              <div style={{color:"#374151",fontSize:9,marginTop:2}}>ATK:{en.atk} DEF:{eDef}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:3,marginTop:5}}>
            {en.stunned&&<span style={{fontSize:7,color:"#d97706",border:"1px solid #713f12",padding:"1px 3px"}}>STUNNED</span>}
            {en.bleeding&&<span style={{fontSize:7,color:"#dc2626",border:"1px solid #7f1d1d",padding:"1px 3px"}}>BLEEDING</span>}
            {en.poisoned&&<span style={{fontSize:7,color:"#4d7c0f",border:"1px solid #365314",padding:"1px 3px"}}>POISONED</span>}
          </div>
          <div style={{height:5,background:"#1a0000",borderRadius:2,marginTop:6,width:160,boxShadow:"inset 0 1px 2px #000"}}>
            <div style={{height:5,borderRadius:2,width:`${hpPct}%`,background:en.boss?"#9333ea":"#991b1b",transition:"width .2s"}}/>
          </div>
          <div style={{fontSize:8,color:"#2d2d2d",marginTop:2}}>{en.hp}/{en.maxHp||en.hp}</div>
        </div>
        <div style={{textAlign:"right",fontSize:8,color:"#1f2937"}}>
          {Object.entries(en.parts).map(([k,p])=>(
            <div key={k} style={{color:p.severed?"#2a1a1a":"#1e1e1e",textDecoration:p.severed?"line-through":"none",marginBottom:1}}>{PLAB[k]}: {p.severed?"✗":`${p.hp}/${p.max}`}</div>
          ))}
        </div>
      </div>
      {(hasSt(player,"STUNNED")||hasSt(player,"WEAKENED")||hasSt(player,"FROZEN")||player.guarding||player.backstabReady)&&(
        <div style={{display:"flex",gap:3,marginBottom:8,flexWrap:"wrap"}}>
          {hasSt(player,"STUNNED")&&<span style={{fontSize:7,color:"#d97706",border:"1px solid #713f12",padding:"1px 4px"}}>YOU: STUNNED</span>}
          {hasSt(player,"WEAKENED")&&<span style={{fontSize:7,color:"#6b7280",border:"1px solid #374151",padding:"1px 4px"}}>YOU: WEAKENED</span>}
          {hasSt(player,"FROZEN")&&<span style={{fontSize:7,color:"#38bdf8",border:"1px solid #0e7490",padding:"1px 4px"}}>YOU: FROZEN</span>}
          {player.guarding&&<span style={{fontSize:7,color:"#0891b2",border:"1px solid #0e4f63",padding:"1px 4px"}}>GUARDING (-75%)</span>}
          {player.backstabReady&&<span style={{fontSize:7,color:"#dc2626",border:"1px solid #7f1d1d",padding:"1px 4px"}}>✦ BACKSTAB</span>}
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
        Est. dmg: {estLo}–{estHi} to {PLAB[combat.part]}{props.crit?` · ${~~(props.crit*100)}% crit`:""}{props.bleed?` · ${~~(props.bleed*100)}% bleed`:""}
      </div>
      <div style={{display:"flex",gap:8,marginTop:12}}>
        <button onClick={()=>onAction("ATTACK")} className="cr-btn red" style={{flex:2}}>ATTACK</button>
        {abl&&<button onClick={()=>ablReady&&onAbility()} className="cr-btn blue" style={{flex:1,opacity:ablReady?1:0.5}}>
          {abl.name}{!ablReady?`[${player.abilityCD}]`:""}
        </button>}
        <button onClick={()=>onAction("FLEE")} className="cr-btn" style={{flex:1}}>FLEE</button>
      </div>
    </div>
  </div>);
}

export function InvUI({player,onClose,onUse,onEquip,onCraft, RECIPES}){
  const [tab, setTab]=useState("items");
  return(<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.97)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Courier New',monospace",zIndex:40}}>
    <div style={{border:"2px solid #1f2937",borderRadius:4,backgroundImage:"url('/ui_panel.png')",backgroundSize:"100% 100%",imageRendering:"pixelated",padding:18,width:440,maxWidth:"94vw",maxHeight:"85vh",display:"flex",flexDirection:"column",boxShadow:"0 0 30px rgba(0,0,0,1)"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:10,paddingBottom:7,borderBottom:"1px solid rgba(255,255,255,0.1)"}}>
        <div style={{display:"flex",gap:10}}>
          {["items","craft"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{background:"none",border:"none",color:tab===t?"#e5e7eb":"#374151",cursor:"pointer",fontFamily:"'Courier New',monospace",fontSize:12,textTransform:"uppercase",fontWeight:tab===t?"bold":"normal",borderBottom:tab===t?"1px solid #e5e7eb":"none"}}>{t}</button>
          ))}
        </div>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#374151",cursor:"pointer",fontFamily:"'Courier New',monospace",fontSize:10}}>[ESC]</button>
      </div>
      <div style={{flex:1,overflow:"auto"}}>
        {tab==="items"&&<>
          <div style={{fontSize:8,color:"#1f2937",marginBottom:8}}>ATK:{getAtk(player)} DEF:{getDef(player)} AGI:{player.agi} · {player.inv.length} items</div>
          {player.inv.length===0?<div style={{color:"#1f2937",fontSize:11}}>Nothing here.</div>
           :player.inv.map(ii=>{const def=ITEMS[ii.iid];if(!def)return null;
             const isEq=player.weapon===ii.iid||player.armor===ii.iid||player.helmet===ii.iid;
             const [row, col] = ITEM_MAP[ii.iid] || [0,0];
             return(<div key={ii.uid} style={{borderBottom:"1px solid #0a0a0a",padding:"7px 0",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
               <div style={{width:24,height:24,marginRight:8,backgroundImage:"url('/item_sprites.png')",backgroundSize:"400% 400%",backgroundPosition:`${col*33.33}% ${row*33.33}%`,imageRendering:"pixelated"}}/>
               <div style={{flex:1,marginRight:8}}>
                 <div style={{fontSize:11,color:isEq?"#d97706":def.type==="QUEST"?"#9333ea":def.type==="CRAFT"?"#22c55e":"#d1d5db"}}>{def.name}{isEq?" [EQ]":""}</div>
                 <div style={{fontSize:8,color:"#2d2d2d",marginTop:2,lineHeight:1.5}}>{def.desc}</div>
                 <div style={{fontSize:8,color:"#374151",marginTop:1}}>
                   {def.stats?.atk&&<span>ATK +{def.stats.atk} </span>}
                   {def.stats?.def&&<span>DEF +{def.stats.def} </span>}
                   {def.eff?.hp&&<span>HP +{def.eff.hp} </span>}
                   {def.eff?.hunger&&<span>Hunger +{def.eff.hunger} </span>}
                 </div>
               </div>
               <div style={{display:"flex",gap:4,marginTop:6}}>
                 {def.type==="USE"&&<button onClick={()=>onUse(ii.uid)} className="cr-btn green" style={{fontSize:10,padding:"2px 6px"}}>USE</button>}
                 {(def.type==="WEAPON"||def.type==="ARMOR"||def.type==="HELMET")&&<button onClick={()=>onEquip(ii.uid,def.type)} className={`cr-btn ${isEq?"red":"blue"}`} style={{fontSize:10,padding:"2px 6px"}}>{isEq?"UNEQUIP":"EQUIP"}</button>}
               </div>
             </div>);
           })}
        </>}
        {tab==="craft"&&<>
          <div style={{fontSize:9,color:"#374151",marginBottom:10}}>Combine materials to create new items.</div>
          {RECIPES.map((r,i)=>{
            const can=canCraft(r,player.inv);
            return(<div key={i} style={{borderBottom:"1px solid #0a0a0a",padding:"8px 0",opacity:can?1:0.35}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:11,color:can?"#22c55e":"#374151"}}>{r.name}</div>
                  <div style={{fontSize:8,color:"#2d2d2d",marginTop:2}}>{r.desc}</div>
                  <div style={{fontSize:8,color:"#4b5563",marginTop:2}}>
                    Needs: {r.ingredients.map(ing=>`${ITEMS[ing.id]?.name||ing.id} ×${ing.qty}`).join(" + ")}
                  </div>
                </div>
                {can&&<button onClick={()=>onCraft(i)} className="cr-btn green" style={{fontSize:10,padding:"3px 8px"}}>CRAFT</button>}
              </div>
            </div>);
          })}
        </>}
      </div>
    </div>
  </div>);
}

export function JournalUI({player,onClose}){
  const [tab, setTab]=useState("quests");
  return(<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.97)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Courier New',monospace",zIndex:40}}>
    <div style={{border:"2px solid #1f2937",borderRadius:4,backgroundImage:"url('/ui_panel.png')",backgroundSize:"100% 100%",imageRendering:"pixelated",padding:18,width:440,maxWidth:"94vw",height:"70vh",display:"flex",flexDirection:"column",boxShadow:"0 0 30px rgba(0,0,0,1)"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:10,paddingBottom:7,borderBottom:"1px solid rgba(255,255,255,0.1)"}}>
        <div style={{display:"flex",gap:10}}>
          {["quests","lore","bestiary"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{background:"none",border:"none",color:tab===t?"#e5e7eb":"#374151",cursor:"pointer",fontFamily:"'Courier New',monospace",fontSize:12,textTransform:"uppercase",fontWeight:tab===t?"bold":"normal",borderBottom:tab===t?"1px solid #e5e7eb":"none"}}>{t}</button>
          ))}
        </div>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#374151",cursor:"pointer",fontFamily:"'Courier New',monospace",fontSize:10}}>[ESC]</button>
      </div>
      <div style={{flex:1,overflow:"auto",paddingRight:5}}>
        {tab==="quests"&&<div>
          {player.journal.quests.map(q=>{const def=QUESTS[q];if(!def)return null;return <div key={q} style={{marginBottom:15}}>
            <div style={{color:"#9333ea",fontSize:12}}>{def.name}</div>
            <div style={{color:"#6b7280",fontSize:9,marginTop:2}}>{def.desc}</div>
            <div style={{color:"#374151",fontSize:8,marginTop:2}}>Progress: {player.quests[q]||0}/{def.total}</div>
          </div>})}
        </div>}
        {tab==="lore"&&<div>
          {player.journal.lore.map(l=>{const def=LORE.entries[l];if(!def)return null;return <div key={l} style={{marginBottom:15,borderLeft:"2px solid #374151",paddingLeft:8}}>
            <div style={{color:"#d1d5db",fontSize:11}}>{def.title}</div>
            <div style={{color:"#6b7280",fontSize:9,marginTop:4,lineHeight:1.6,fontStyle:"italic"}}>"{def.text}"</div>
          </div>})}
        </div>}
        {tab==="bestiary"&&<div>
          {player.journal.bestiary.length===0?<div style={{color:"#1f2937",fontSize:10}}>You have seen nothing yet.</div>:
            player.journal.bestiary.map(b=>(<div key={b} style={{marginBottom:15}}>
              <div style={{color:"#dc2626",fontSize:12}}>{b}</div>
              <div style={{color:"#6b7280",fontSize:9,marginTop:2}}>{LORE.bestiary[b]||"A nightmare made flesh."}</div>
            </div>))}
        </div>}
      </div>
    </div>
  </div>);
}

export function EventModal({event,onChoice,player}){
  const d=EV_DEF[event.type];if(!d)return null;
  return(<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.95)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Courier New',monospace",zIndex:40}}>
    <div style={{border:`1px solid ${d.col}`,backgroundImage:"url('/ui_panel.png')",backgroundSize:"100% 100%",imageRendering:"pixelated",padding:20,width:420,maxWidth:"94vw",boxShadow:`0 0 30px ${d.col}22`}}>
      <div style={{color:d.col,fontSize:24,textAlign:"center",marginBottom:4}}>{d.ch}</div>
      <div style={{color:"#d1d5db",fontSize:14,fontWeight:"bold",textAlign:"center",marginBottom:6}}>{d.name}</div>
      <div style={{color:"#4b5563",fontSize:10,textAlign:"center",marginBottom:16,lineHeight:1.7}}>{d.desc}</div>
        <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:15}}>
          {d.choices.map((c,i)=>{
            const locked=c.req&&!c.req(player);
            return(
          <button key={i} onClick={()=>!locked&&onChoice(i,event)} className="cr-btn" style={{textAlign:"left",opacity:locked?0.4:1}}>
            {i+1}. {c.label} {locked?"(Locked)":""}
          </button>
          )})}
        </div>
    </div>
  </div>);
}

export function DialogueUI({npc, node, onChoice, onClose}){
  return(<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.95)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Courier New',monospace",zIndex:50}}>
    <div style={{border:`2px solid ${npc.col}`,borderRadius:4,background:"#020009",padding:24,width:460,maxWidth:"94vw",boxShadow:`0 0 40px ${npc.col}33`}}>
      <div style={{color:npc.col,fontSize:16,fontWeight:"bold",marginBottom:12,letterSpacing:".1em"}}>{npc.name}</div>
      <div style={{color:"#d1d5db",fontSize:11,lineHeight:1.8,marginBottom:20,fontStyle:"italic"}}>"{node.text}"</div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {node.choices.map((c,i)=>(
          <button key={i} onClick={()=>c.next?onChoice(c.next):onClose()} 
            style={{padding:"10px 16px",border:"1px solid #1f2937",color:"#9ca3af",background:"#080808",cursor:"pointer",fontFamily:"'Courier New',monospace",fontSize:10,textAlign:"left",transition:"all .1s"}}
            onMouseOver={e=>{e.target.style.borderColor="#374151";e.target.style.color="#e5e7eb";}} onMouseOut={e=>{e.target.style.borderColor="#1f2937";e.target.style.color="#9ca3af";}}>
            → {c.label}
          </button>
        ))}
      </div>
    </div>
  </div>);
}

export function LevelUpModal({level,onChoose}){
  const opts=[{label:"+10 Max HP (also heals 10)",k:"hp"},{label:"+2 Attack",k:"atk"},{label:"+2 Defense",k:"def"},{label:"+2 Agility",k:"agi"},{label:"Clear all status effects",k:"clear"},{label:"Ability cooldown –2",k:"cd"}];
  return(<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.97)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Courier New',monospace",zIndex:40}}>
    <div style={{border:"1px solid #ca8a04",background:"#040200",padding:22,width:380,maxWidth:"94vw"}}>
      <div style={{color:"#ca8a04",fontSize:20,textAlign:"center",marginBottom:4}}>LEVEL UP</div>
      <div style={{color:"#d97706",fontSize:12,textAlign:"center",marginBottom:18}}>Level {level} — choose a boon:</div>
      <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:8}}>
        {opts.map((o, i)=>(
          <button key={o.k} onClick={()=>onChoose(o.k)} className="cr-btn" style={{textAlign:"left"}}>
            {i+1}. {o.label}
          </button>
        ))}
      </div>
    </div>
  </div>);
}

export function DPad({onMove,onPickup,onInventory,onJournal}){
  const bs={width:48,height:48,border:"2px solid #000",borderBottom:"4px solid #000",borderRadius:4,background:"linear-gradient(180deg, #374151, #1f2937)",color:"#fff",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",touchAction:"manipulation",userSelect:"none",fontFamily:"monospace",boxShadow:"0 4px 6px rgba(0,0,0,0.5)",transition:"transform 0.05s"};
  const act={...bs,width:64,fontSize:10,fontWeight:"bold"};
  
  return(<div style={{display:"flex",gap:12,alignItems:"center",flexShrink:0}}>
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
      <button style={bs} onPointerDown={e=>{e.preventDefault();onMove(0,-1);}} onPointerUp={e=>e.currentTarget.style.transform="translateY(0)"} onPointerLeave={e=>e.currentTarget.style.transform="translateY(0)"} onPointerCancel={e=>e.currentTarget.style.transform="translateY(0)"} onContextMenu={e=>e.preventDefault()}>▲</button>
      <div style={{display:"flex",gap:4}}>
        <button style={bs} onPointerDown={e=>{e.preventDefault();onMove(-1,0);}} onPointerUp={e=>e.currentTarget.style.transform="translateY(0)"} onPointerLeave={e=>e.currentTarget.style.transform="translateY(0)"} onPointerCancel={e=>e.currentTarget.style.transform="translateY(0)"} onContextMenu={e=>e.preventDefault()}>◄</button>
        <button style={bs} onPointerDown={e=>{e.preventDefault();onMove(0,1);}} onPointerUp={e=>e.currentTarget.style.transform="translateY(0)"} onPointerLeave={e=>e.currentTarget.style.transform="translateY(0)"} onPointerCancel={e=>e.currentTarget.style.transform="translateY(0)"} onContextMenu={e=>e.preventDefault()}>▼</button>
        <button style={bs} onPointerDown={e=>{e.preventDefault();onMove(1,0);}} onPointerUp={e=>e.currentTarget.style.transform="translateY(0)"} onPointerLeave={e=>e.currentTarget.style.transform="translateY(0)"} onPointerCancel={e=>e.currentTarget.style.transform="translateY(0)"} onContextMenu={e=>e.preventDefault()}>►</button>
      </div>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:4}}>
      <button style={act} onPointerDown={e=>{e.preventDefault();onPickup();}} onPointerUp={e=>e.currentTarget.style.transform="translateY(0)"} onPointerLeave={e=>e.currentTarget.style.transform="translateY(0)"} onContextMenu={e=>e.preventDefault()}>Z · ACT</button>
      <button style={act} onPointerDown={e=>{e.preventDefault();onInventory();}} onPointerUp={e=>e.currentTarget.style.transform="translateY(0)"} onPointerLeave={e=>e.currentTarget.style.transform="translateY(0)"} onContextMenu={e=>e.preventDefault()}>I · INV</button>
      <button style={act} onPointerDown={e=>{e.preventDefault();onJournal();}} onPointerUp={e=>e.currentTarget.style.transform="translateY(0)"} onPointerLeave={e=>e.currentTarget.style.transform="translateY(0)"} onContextMenu={e=>e.preventDefault()}>J · JRNL</button>
    </div>
  </div>);
}

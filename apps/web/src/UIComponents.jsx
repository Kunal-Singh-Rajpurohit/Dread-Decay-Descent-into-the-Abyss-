import React, { useState } from 'react';
import { ITEMS, CLS, ABLS, PMUL, PLAB, LORE, QUESTS, NPC_DEFS, EV_DEF, SPRITE_CONFIG } from './data.js';
import { getAtk, getDef, hasSt, getSprite } from './utils.js';

// § 9 · FOV
// ═══════════════════════════════════════════════════════
export function computeFOV(map,px,py,r){
  const vis=new Set();const rays=Math.ceil(r*Math.PI*4);
  for(let i=0;i<rays;i++){const a=(i/rays)*Math.PI*2;let rx=px,ry=py;const dx=Math.cos(a)*.5,dy=Math.sin(a)*.5;
    for(let s=0;s<=r*2;s++){const tx=Math.round(rx),ty=Math.round(ry);if(tx<0||tx>=MW||ty<0||ty>=MH)break;vis.add(`${tx},${ty}`);if(map[ty][tx]===T.W)break;rx+=dx;ry+=dy;}}
  return vis;
}

// ═══════════════════════════════════════════════════════

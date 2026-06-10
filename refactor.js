const fs = require('fs');

const code = fs.readFileSync('apps/web/src/App.jsx', 'utf8');

const s1 = code.lastIndexOf('//', code.indexOf('1 '));
const s7 = code.lastIndexOf('//', code.indexOf('PURE HELPERS'));
const s8 = code.lastIndexOf('//', code.indexOf('8 '));
const s9 = code.lastIndexOf('//', code.indexOf('9 '));
const s10 = code.lastIndexOf('//', code.indexOf('10 '));
const s11 = code.lastIndexOf('//', code.indexOf('11 '));
const s12 = code.lastIndexOf('//', code.indexOf('12 '));

// data.js
let gameDataCode = code.substring(s1, s7);
gameDataCode = gameDataCode.replace(/^const /gm, 'export const ');
fs.writeFileSync('apps/web/src/data.js', gameDataCode);

// utils.js
let utilsCode = "import { ITEMS, LORE, QUESTS, NPC_DEFS, EV_DEF, SPRITE_CONFIG, PMUL, PLAB, TR_DARK, TR_DIM, TR_FULL, XP_LV, T, FTABLES, EDEFS, CLS, ABLS } from './data.js';\n\n";
utilsCode += code.substring(s7, s9);
utilsCode += '\n' + code.substring(s11, s12);
utilsCode = utilsCode.replace(/^const /gm, 'export const ').replace(/^function /gm, 'export function ');
fs.writeFileSync('apps/web/src/utils.js', utilsCode);

// UIComponents.jsx
let uiCode = "import React, { useState } from 'react';\n";
uiCode += "import { ITEMS, CLS, ABLS, PMUL, PLAB, LORE, QUESTS, NPC_DEFS, EV_DEF, SPRITE_CONFIG } from './data.js';\n";
uiCode += "import { getAtk, getDef, hasSt, getSprite } from './utils.js';\n\n";
uiCode += code.substring(s9, s10).replace(/^function /gm, 'export function ');
fs.writeFileSync('apps/web/src/UIComponents.jsx', uiCode);

// New App.jsx
let newApp = code.substring(0, s1);
newApp += "import { MW, MH, TS, T, SPRITE_CONFIG, ITEMS, CLS, ABLS, EDEFS, FTABLES, LORE, QUESTS, NPC_DEFS, EV_DEF, PMUL, PLAB } from './data.js';\n";
newApp += "import { rng, flip, uid, makeParts, getTR, getLv, getAtk, getDef, hasSt, survivalTick, genDungeon, createPlayer } from './utils.js';\n";
newApp += "import { getSprite, MapView, CombatUI, InvUI, JournalUI, DialogueUI, EventModal, LevelUpUI, WinScreen, DeathScreen } from './UIComponents.jsx';\n\n";
newApp += code.substring(s12);
fs.writeFileSync('apps/web/src/App.jsx', newApp);

console.log('Refactor complete');

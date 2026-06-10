// ─── renderer.js ─── Canvas-based pixel-art renderer ───────────────────────
import { MW, MH, TS, T } from './constants.js';

/* ── Tile palette ──────────────────────────────────────────────────────────── */
const WALL_BASE   = ['#1a1a2e', '#16162a', '#1e1e32'];
const WALL_MORTAR = ['#2a1a1a', '#251818'];
const FLOOR_BASE  = ['#0d0d0d', '#0f0e0e', '#0c0b0b'];
const FLOOR_DOT   = '#1a1818';
const STAIR_BASE  = '#0f3a1a';
const STAIR_LINE  = '#1a6b2e';
const DOOR_WOOD   = '#4a3520';
const DOOR_HANDLE = '#c9a227';
const UNSEEN_COL  = '#020202';

/* ── Deterministic hash for tile variety ───────────────────────────────────── */
function tileHash(x, y, n) { return ((x * 7 + y * 13) & 0x7fffffff) % n; }

/* ── Sprites ───────────────────────────────────────────────────────────────── */
const SPRITES = {
  dungeon: new Image(),
  player: new Image(),
  enemy: new Image(),
  items: new Image()
};
SPRITES.dungeon.src = '/dungeon_tiles_v2.png';
SPRITES.player.src = '/player_sprites.png';
SPRITES.enemy.src = '/enemy_sprites.png';
SPRITES.items.src = '/item_sprites.png';

const ENEMY_MAP = {
  rat: [0,0], plague: [0,0], spider: [0,0],
  skele: [0,1], guard: [0,1], revenant: [0,1],
  cultist: [0,2], wraith: [0,2], banshee: [0,2], mimic: [0,2]
};
const ENEMY_BIG_MAP = {
  flesh: [1,0], troll: [1,0], golem: [1,0], colossus: [1,0],
  warden: [1,1], infernal: [1,1]
};
const PLAYER_MAP = {
  soldier: [0,0], rogue: [0,1],
  scholar: [1,0], outlander: [1,1]
};
const ITEM_MAP = {
  potion: [0,0], greatpot: [0,0], frost_vial: [0,0], antidote: [0,0],
  sword: [0,1], fine_sword: [0,1], cursed_blade: [0,1],
  plate: [0,2], dark_plate: [0,2], chain: [0,2], leather: [0,2], robes: [0,2],
  old_tome: [0,3],
  smoke_bomb: [1,0],
  meat: [1,1], rawmeat: [1,1], ration: [1,1], bread: [1,1],
  torch: [1,2], torch_lg: [1,2], torch_wpn: [1,2], oil_flask: [1,2],
  iron_key: [1,3],
  bone: [2,0], crown: [2,0],
  black_gem: [2,1], soul_flask: [2,1], soul_ember: [2,1],
  coin: [2,2],
  dagger: [2,3], venom_dagger: [2,3],
  bow: [3,0],
  arrow: [3,1],
  staff: [3,2], holy_mace: [3,2],
  amulet: [3,3], gem_shard1: [3,3], gem_shard2: [3,3], gem_shard3: [3,3],
  helmet: [0,2], axe: [0,1], war_axe: [0,1], spear: [0,1], club: [0,1], flail: [0,1]
};

/* ── Draw a pixel-art wall tile ────────────────────────────────────────────── */
function drawWall(ctx, px, py, x, y) {
  if (SPRITES.dungeon.complete && SPRITES.dungeon.width > 0) {
    const sw = SPRITES.dungeon.width / 4, sh = SPRITES.dungeon.height / 4;
    const col = tileHash(x, y, 4);
    ctx.drawImage(SPRITES.dungeon, col*sw, 2*sh, sw, sh, px, py, TS, TS);
    return;
  }
  const v = tileHash(x, y, WALL_BASE.length);
  ctx.fillStyle = WALL_BASE[v];
  ctx.fillRect(px, py, TS, TS);

  // Mortar / brick pattern
  const mv = tileHash(x + 3, y + 5, WALL_MORTAR.length);
  ctx.fillStyle = WALL_MORTAR[mv];
  ctx.fillRect(px, py + 5, TS, 1);
  ctx.fillRect(px, py + 11, TS, 1);
  ctx.fillRect(px, py + 17, TS, 1);
  const off = (y & 1) ? 6 : 0;
  ctx.fillRect(px + ((7 + off) % TS), py, 1, 5);
  ctx.fillRect(px + ((15 + off) % TS), py, 1, 6);
  ctx.fillRect(px + ((11 + off) % TS), py + 11, 1, 6);

  if (tileHash(x, y, 7) === 0) {
    ctx.fillStyle = '#121020';
    ctx.fillRect(px + tileHash(x, y + 1, 14) + 3, py + 2, 1, 4);
    ctx.fillRect(px + tileHash(x, y + 1, 14) + 4, py + 5, 1, 3);
  }
}

/* ── Draw a pixel-art floor tile ───────────────────────────────────────────── */
function drawFloor(ctx, px, py, x, y) {
  if (SPRITES.dungeon.complete && SPRITES.dungeon.width > 0) {
    const sw = SPRITES.dungeon.width / 4, sh = SPRITES.dungeon.height / 4;
    const isCracked = tileHash(x, y, 5) === 0;
    const isBones = tileHash(x, y, 15) === 0;
    const row = isBones ? 1 : 0;
    const col = isBones ? 3 : isCracked ? tileHash(x,y,2)+1 : 0;
    ctx.drawImage(SPRITES.dungeon, col*sw, row*sh, sw, sh, px, py, TS, TS);
    return;
  }
  const v = tileHash(x, y, FLOOR_BASE.length);
  ctx.fillStyle = FLOOR_BASE[v];
  ctx.fillRect(px, py, TS, TS);

  if (tileHash(x + 1, y, 4) === 0) {
    ctx.fillStyle = FLOOR_DOT;
    ctx.fillRect(px + tileHash(x, y + 2, TS - 2) + 1, py + tileHash(x + 3, y, TS - 2) + 1, 1, 1);
  }
  if (tileHash(x, y + 1, 5) === 0) {
    ctx.fillStyle = FLOOR_DOT;
    ctx.fillRect(px + tileHash(x + 4, y, TS - 2) + 1, py + tileHash(x, y + 5, TS - 2) + 1, 1, 1);
  }
  if (tileHash(x + 2, y + 3, 11) === 0) {
    ctx.fillStyle = '#151212';
    const cx = px + tileHash(x, y + 7, 12) + 3;
    const cy = py + tileHash(x + 9, y, 10) + 4;
    ctx.fillRect(cx, cy, 3, 1);
    ctx.fillRect(cx + 2, cy + 1, 1, 2);
  }
  if (tileHash(x + 5, y + 5, 19) === 0) {
    ctx.fillStyle = '#3a0808';
    ctx.fillRect(px + tileHash(x, y + 8, 16) + 2, py + tileHash(x + 6, y, 16) + 2, 2, 2);
  }
}

/* ── Draw stair tile ───────────────────────────────────────────────────────── */
function drawStairs(ctx, px, py) {
  if (SPRITES.dungeon.complete && SPRITES.dungeon.width > 0) {
    const sw = SPRITES.dungeon.width / 4, sh = SPRITES.dungeon.height / 4;
    ctx.drawImage(SPRITES.dungeon, 2*sw, 3*sh, sw, sh, px, py, TS, TS);
    return;
  }
  ctx.fillStyle = STAIR_BASE;
  ctx.fillRect(px, py, TS, TS);
  ctx.fillStyle = STAIR_LINE;
  ctx.fillRect(px + 2, py + 5, TS - 4, 1);
  ctx.fillRect(px + 2, py + 11, TS - 4, 1);
  ctx.fillRect(px + 2, py + 17, TS - 4, 1);
}

/* ── Draw door tile ────────────────────────────────────────────────────────── */
function drawDoor(ctx, px, py) {
  if (SPRITES.dungeon.complete && SPRITES.dungeon.width > 0) {
    const sw = SPRITES.dungeon.width / 4, sh = SPRITES.dungeon.height / 4;
    ctx.drawImage(SPRITES.dungeon, 0, 3*sh, sw, sh, px, py, TS, TS);
    return;
  }
  ctx.fillStyle = DOOR_WOOD;
  ctx.fillRect(px + 2, py + 1, TS - 4, TS - 2);
  ctx.fillStyle = '#3a2815';
  ctx.fillRect(px + 7, py + 1, 1, TS - 2);
  ctx.fillRect(px + 14, py + 1, 1, TS - 2);
  ctx.fillStyle = DOOR_HANDLE;
  ctx.fillRect(px + 15, py + 10, 2, 2);
}

/* ── Draw trap tile ────────────────────────────────────────────────────────── */
function drawTrap(ctx, px, py, revealed) {
  if (SPRITES.dungeon.complete && SPRITES.dungeon.width > 0) {
    const sw = SPRITES.dungeon.width / 4, sh = SPRITES.dungeon.height / 4;
    if (revealed) {
      ctx.drawImage(SPRITES.dungeon, 3*sw, 2*sh, sw, sh, px, py, TS, TS);
    } else {
      ctx.drawImage(SPRITES.dungeon, 0, 0, sw, sh, px, py, TS, TS); // Floor
    }
    return;
  }
  ctx.fillStyle = FLOOR_BASE[0];
  ctx.fillRect(px, py, TS, TS);
  if (revealed) {
    ctx.fillStyle = 'rgba(180,30,30,0.25)';
    ctx.fillRect(px + 4, py + 4, TS - 8, TS - 8);
    ctx.fillStyle = 'rgba(200,40,40,0.4)';
    ctx.fillRect(px + 8, py + 6, 1, 1);
    ctx.fillRect(px + 12, py + 14, 1, 1);
    ctx.fillRect(px + 6, py + 12, 1, 1);
  }
}
export { SPRITES, ENEMY_MAP, ENEMY_BIG_MAP, PLAYER_MAP, ITEM_MAP };

/* ═══════════════════════════════════════════════════════════════════════════ */
/* ── Main render function ──────────────────────────────────────────────────  */
/* ═══════════════════════════════════════════════════════════════════════════ */

let currentCamX = null;
let currentCamY = null;
let currentPx = null;
let currentPy = null;

export function drawFrame(canvas, state) {
  const ctx = canvas.getContext('2d');
  const {
    map, player, enemies, gi, events, npcs, traps,
    fov, seen, shake, dNums, particles, t
  } = state;

  function drawText(ctx, text, x, y, isDmg = false) {
    ctx.save();
    if (isDmg) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#000';
      ctx.strokeText(text, x, y);
    } else {
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
    }
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  const rect = canvas.parentElement.getBoundingClientRect();
  const W = rect.width;
  const H = rect.height;
  canvas.width  = W;
  canvas.height = H;
  ctx.imageSmoothingEnabled = false;

  // ── Clear ──
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  // ── Smooth Player Interpolation ──
  if (player) {
    const targetPx = player.x * TS + TS / 2;
    const targetPy = player.y * TS + TS / 2;
    
    if (currentPx === null || Math.abs(currentPx - targetPx) > TS * 3 || Math.abs(currentPy - targetPy) > TS * 3) {
      // Teleport if moving large distances (e.g. changing floors)
      currentPx = targetPx;
      currentPy = targetPy;
    } else {
      // Smoothly walk
      currentPx += (targetPx - currentPx) * 0.25;
      currentPy += (targetPy - currentPy) * 0.25;
    }
  }

  // ── Camera offset & clamping ──
  const mapW = MW * TS;
  const mapH = MH * TS;

  let targetCamX = 0, targetCamY = 0;
  if (player) {
    // Center on smoothed player position
    let tCx = W / 2 - currentPx;
    let tCy = H / 2 - currentPy;
    
    // Clamp camera so it doesn't show black edges
    if (W >= mapW) tCx = (W - mapW) / 2; // Center horizontally if screen is wider than map
    else tCx = Math.max(W - mapW, Math.min(0, tCx));
    
    if (H >= mapH) tCy = (H - mapH) / 2; // Center vertically if screen is taller than map
    else tCy = Math.max(H - mapH, Math.min(0, tCy));
    
    targetCamX = tCx;
    targetCamY = tCy;
  }

  if (currentCamX === null || (player && (Math.abs(player.x * TS + TS / 2 - currentPx) > TS * 3))) {
    currentCamX = targetCamX;
    currentCamY = targetCamY;
  } else {
    currentCamX += (targetCamX - currentCamX) * 0.25;
    currentCamY += (targetCamY - currentCamY) * 0.25;
  }

  const camX = Math.round(currentCamX);
  const camY = Math.round(currentCamY);

  // ── Screen shake ──
  const sx = shake ? (Math.random() - 0.5) * shake * 2 : 0;
  const sy = shake ? (Math.random() - 0.5) * shake * 2 : 0;
  ctx.save();
  ctx.translate(sx + camX, sy + camY);

  // ── Build reveal-status lookup for traps ──
  const trapMap = {};
  if (traps) {
    for (const tr of traps) {
      trapMap[`${tr.x},${tr.y}`] = tr;
    }
  }

  // ══════════ Pass 1: Tiles ══════════
  for (let y = 0; y < MH; y++) {
    for (let x = 0; x < MW; x++) {
      const key = `${x},${y}`;
      const inFov  = fov && fov.has(key);
      const wasSeen = seen && seen.has(key);

      if (!inFov && !wasSeen) {
        // Never seen — pure darkness
        ctx.fillStyle = UNSEEN_COL;
        ctx.fillRect(x * TS, y * TS, TS, TS);
        continue;
      }

      const tile = map[y]?.[x];
      const px = x * TS;
      const py = y * TS;

      // Draw base tile
      switch (tile) {
        case T.W:  drawWall(ctx, px, py, x, y);  break;
        case T.F:  drawFloor(ctx, px, py, x, y); break;
        case T.S:  drawStairs(ctx, px, py);       break;
        case T.D:  drawDoor(ctx, px, py);         break;
        case T.TR: {
          const trap = trapMap[key];
          drawTrap(ctx, px, py, trap?.revealed);
          break;
        }
        default:   drawFloor(ctx, px, py, x, y); break;
      }

      // Fog-of-war for previously seen (not currently in FOV)
      if (!inFov && wasSeen) {
        ctx.fillStyle = 'rgba(0,0,0,0.78)';
        ctx.fillRect(px, py, TS, TS);
      }
    }
  }

  // ══════════ Pass 2: Entities (only in FOV) ══════════

  // Items
  if (gi) {
    for (const item of gi) {
      const key = `${item.x},${item.y}`;
      if (!fov || !fov.has(key)) continue;
      const pulse = 0.65 + 0.35 * Math.sin(t * 0.06 + item.x * 3);
      ctx.globalAlpha = pulse;

      if (SPRITES.items.complete && SPRITES.items.width > 0 && item.iid) {
        const sw = SPRITES.items.width / 4, sh = SPRITES.items.height / 4;
        const [row, col] = ITEM_MAP[item.iid] || [0,0]; // default to potion
        const iBob = Math.sin(t * 0.1 + item.x + item.y * 3) * 2.5;
        ctx.drawImage(SPRITES.items, col*sw, row*sh, sw, sh, item.x * TS, item.y * TS + iBob, TS, TS);
      } else {
        ctx.font = '14px "VT323", monospace';
        ctx.fillStyle = '#f59e0b';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const iBob = Math.sin(t * 0.1 + item.x + item.y * 3) * 2.5;
        drawText(ctx, '!', item.x * TS + TS / 2, item.y * TS + TS / 2 + iBob);
      }
      ctx.globalAlpha = 1;
    }
  }

  // Revealed traps
  if (traps) {
    for (const tr of traps) {
      if (!tr.revealed) continue;
      const key = `${tr.x},${tr.y}`;
      if (!fov || !fov.has(key)) continue;
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.08 + tr.x * 5);
      ctx.globalAlpha = pulse;
      ctx.font = '13px "VT323", monospace';
      ctx.fillStyle = '#ef4444';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      drawText(ctx, '▲', tr.x * TS + TS / 2, tr.y * TS + TS / 2);
      ctx.globalAlpha = 1;
    }
  }

  // Events
  if (events) {
    for (const ev of events) {
      if (ev.done) continue;
      const key = `${ev.x},${ev.y}`;
      if (!fov || !fov.has(key)) continue;
      const pulse = 0.55 + 0.45 * Math.sin(t * 0.05 + ev.x * 2 + ev.y);
      ctx.globalAlpha = pulse;
      ctx.font = '14px "VT323", monospace';
      ctx.fillStyle = '#a78bfa';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      drawText(ctx, '?', ev.x * TS + TS / 2, ev.y * TS + TS / 2);
      ctx.globalAlpha = 1;
    }
  }

  // NPCs
  if (npcs) {
    for (const npc of npcs) {
      const key = `${npc.x},${npc.y}`;
      if (!fov || !fov.has(key)) continue;
      const pulse = 0.6 + 0.4 * Math.sin(t * 0.04);
      ctx.globalAlpha = pulse;
      ctx.font = 'bold 15px "VT323", monospace';
      ctx.fillStyle = npc.col || '#60a5fa';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      drawText(ctx, npc.ch || '?', npc.x * TS + TS / 2, npc.y * TS + TS / 2);
      ctx.globalAlpha = 1;
    }
  }

  // Enemies
  if (enemies) {
    for (const en of enemies) {
      const key = `${en.x},${en.y}`;
      if (!fov || !fov.has(key)) continue;

      // Disguised mimics render as items
      if (en.disguised) {
        const pulse = 0.65 + 0.35 * Math.sin(t * 0.06 + en.x * 3);
        ctx.globalAlpha = pulse;
        ctx.font = '14px "VT323", monospace';
        ctx.fillStyle = '#f59e0b';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        drawText(ctx, '!', en.x * TS + TS / 2, en.y * TS + TS / 2);
        ctx.globalAlpha = 1;
        continue;
      }

      const ex = en.x * TS + TS / 2;
      const eBob = Math.sin(t * 0.07 + en.x * 4 + en.y) * 1.5;
      const ey = en.y * TS + TS / 2 + eBob;

      // Boss radial aura
      if (en.boss) {
        const auraR = TS * 0.7 + Math.sin(t * 0.06) * 3;
        const grad = ctx.createRadialGradient(ex, ey, 0, ex, ey, auraR);
        grad.addColorStop(0, 'rgba(220,38,38,0.18)');
        grad.addColorStop(1, 'rgba(220,38,38,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(ex - auraR, ey - auraR, auraR * 2, auraR * 2);
      }

      // Low HP pulse glow
      const lowHp = en.hp !== undefined && en.maxHp && (en.hp / en.maxHp) < 0.3;
      if (lowHp) {
        const glowA = 0.12 + 0.1 * Math.sin(t * 0.15);
        ctx.fillStyle = `rgba(255,60,60,${glowA})`;
        ctx.fillRect(ex - TS / 2, ey - TS / 2, TS, TS);
      }

      // CR-style Floating Health Bar
      if (en.hp !== undefined && en.maxHp) {
        const hpPct = Math.max(0, en.hp / en.maxHp);
        const barW = TS - 2;
        const barH = 4;
        const bx = ex - barW / 2;
        const by = ey - TS / 2 - 6;
        ctx.fillStyle = '#000';
        ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
        ctx.fillStyle = en.boss ? '#a855f7' : '#ef4444';
        ctx.fillRect(bx, by, barW * hpPct, barH);
        ctx.fillStyle = '#000';
        for (let s = 1; s < en.maxHp / 10; s++) {
          const sx = bx + (barW * (s * 10 / en.maxHp));
          if (sx < bx + barW) ctx.fillRect(sx, by, 1, barH);
        }
      }

      if (SPRITES.enemy.complete && SPRITES.enemy.width > 0 && en.type) {
        const breathe = 1 + Math.sin(t * 0.05 + en.x) * 0.05;
        if (ENEMY_BIG_MAP[en.type]) {
          const sw = SPRITES.enemy.width / 2, sh = SPRITES.enemy.height / 2;
          const [row, col] = ENEMY_BIG_MAP[en.type];
          ctx.drawImage(SPRITES.enemy, col*sw, row*sh, sw, sh, ex - TS*breathe, ey - TS*breathe, TS*2*breathe, TS*2*breathe);
        } else {
          const sw = SPRITES.enemy.width / 3, sh = SPRITES.enemy.height / 2;
          const mapCoord = ENEMY_MAP[en.type] || [0,1];
          ctx.drawImage(SPRITES.enemy, mapCoord[1]*sw, mapCoord[0]*sh, sw, sh, ex - (TS/2)*breathe, ey - (TS/2)*breathe, TS*breathe, TS*breathe);
        }
      } else {
        ctx.font = 'bold 15px "VT323", monospace';
        ctx.fillStyle = en.col || '#ef4444';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        drawText(ctx, en.ch || 'E', ex, ey);
      }
    }
  }

  // Other Players
  if (state.otherPlayers) {
    for (const op of state.otherPlayers) {
      if (!fov || !fov.has(`${op.x},${op.y}`)) continue;
      const opx = op.x * TS + TS / 2;
      const opy = op.y * TS + TS / 2;
      ctx.globalAlpha = 0.7;
      if (SPRITES.player.complete && SPRITES.player.width > 0 && op.cls) {
        const sw = SPRITES.player.width / 2, sh = SPRITES.player.height / 2;
        const [row, col] = PLAYER_MAP[op.cls] || [0,0];
        ctx.drawImage(SPRITES.player, col*sw, row*sh, sw, sh, opx - TS/2, opy - TS/2, TS, TS);
      } else {
        ctx.font = 'bold 16px "VT323", monospace';
        ctx.fillStyle = '#6b7280';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        drawText(ctx, '@', opx, opy);
      }
      ctx.globalAlpha = 1;
    }
  }

  // Player
  if (player) {
    const px = currentPx !== null ? currentPx : player.x * TS + TS / 2;
    const bob = Math.sin(t * 0.12) * 0.5;
    const py = (currentPy !== null ? currentPy : player.y * TS + TS / 2) + bob;

    // Radial glow halo
    const haloR = TS * 0.65;
    const halo = ctx.createRadialGradient(px, py, 0, px, py, haloR);
    halo.addColorStop(0, 'rgba(245,158,11,0.15)');
    halo.addColorStop(1, 'rgba(245,158,11,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(px - haloR, py - haloR, haloR * 2, haloR * 2);

    // The @ character or sprite
    if (SPRITES.player.complete && SPRITES.player.width > 0 && player.cls) {
      const sw = SPRITES.player.width / 2, sh = SPRITES.player.height / 2;
      const mapCoord = PLAYER_MAP[player.cls] || [0,0];
      ctx.drawImage(SPRITES.player, mapCoord[1]*sw, mapCoord[0]*sh, sw, sh, px - TS/2, py - TS/2 - 4, TS, TS + 4);
    } else {
      ctx.font = 'bold 16px "VT323", monospace';
      ctx.fillStyle = '#f5a623';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      drawText(ctx, '@', px, py);
    }
  }

  // ══════════ Pass 3: Particles ══════════
  if (particles && particles.length) {
    for (const p of particles) {
      if (p.life <= 0) continue;
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  // ══════════ Pass 4: Torch lighting overlay ══════════
  if (player) {
    const torchVal = player.torch ?? 0;
    let radius;
    if (torchVal === 0) radius = 2 * TS;
    else if (torchVal < 35) radius = 3 * TS;
    else radius = 7 * TS;

    // Organic flicker
    const flicker = Math.sin(t * 0.05) * 0.35 + Math.sin(t * 0.13) * 0.2;
    const r = radius + flicker * TS * 0.5;

    const wobbleX = Math.cos(t * 0.08) * 3;
    const wobbleY = Math.sin(t * 0.11) * 3;
    const bob = Math.sin(t * 0.12) * 0.5; // match player bob
    const cx = (currentPx !== null ? currentPx : player.x * TS + TS / 2) + wobbleX;
    const cy = (currentPy !== null ? currentPy : player.y * TS + TS / 2) + bob + wobbleY;

    // Darkness radial gradient
    const dark = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    dark.addColorStop(0,    'rgba(0,0,0,0)');
    dark.addColorStop(0.35, 'rgba(0,0,0,0.05)');
    dark.addColorStop(0.65, 'rgba(0,0,0,0.65)');
    dark.addColorStop(1,    'rgba(0,0,0,0.97)');
    ctx.fillStyle = dark;
    ctx.fillRect(-camX - 20, -camY - 20, W + 40, H + 40);

    // Warm amber tint (or cold blue when torch=0)
    const tintR = r * 0.6;
    const tint = ctx.createRadialGradient(cx, cy, 0, cx, cy, tintR);
    if (torchVal === 0) {
      tint.addColorStop(0, 'rgba(80,120,200,0.06)');
      tint.addColorStop(1, 'rgba(80,120,200,0)');
    } else {
      tint.addColorStop(0, 'rgba(255,140,0,0.06)');
      tint.addColorStop(1, 'rgba(255,140,0,0)');
    }
    ctx.fillStyle = tint;
    ctx.fillRect(-camX - 20, -camY - 20, W + 40, H + 40);
  }

  // ══════════ Pass 5: Floating damage numbers ══════════
  if (dNums) {
    for (const d of dNums) {
      if (d.frame >= 40) continue;
      const progress = d.frame / 40;
      const alpha = 1 - Math.pow(progress, 3);
      const rise = Math.sin(progress * Math.PI / 2) * 25;
      
      let scale = 1;
      if (d.frame < 10) scale = 1 + (10 - d.frame) * 0.12;

      ctx.globalAlpha = Math.max(0, alpha);

      if (d.crit) {
        ctx.font = `bold ${Math.floor(26 * scale)}px "VT323", monospace`;
        ctx.fillStyle = d.color || '#fbbf24';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        drawText(ctx, `✦${d.value}`, d.cx, d.cy - rise, true);
      } else {
        ctx.font = `bold ${Math.floor(20 * scale)}px "VT323", monospace`;
        ctx.fillStyle = d.color || '#ef4444';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        drawText(ctx, `${d.value}`, d.cx, d.cy - rise, true);
      }
      ctx.globalAlpha = 1;
    }
  }

  // Restore camera translation, but keep shake for screen effects
  ctx.restore();
  ctx.save();
  ctx.translate(sx, sy);

  // ══════════ Pass 6: Fear vignette (Screen Space) ══════════
  if (player) {
    const fearPct = (player.fear ?? 0) / 100;
    if (fearPct > 0.4) {
      const intensity = ((fearPct - 0.4) / 0.6) * 0.35;
      const pulse = intensity * (0.8 + 0.2 * Math.sin(t * 0.07));
      const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W,H) * 0.25, W / 2, H / 2, Math.min(W,H) * 0.7);
      vig.addColorStop(0, 'rgba(120,0,0,0)');
      vig.addColorStop(1, `rgba(120,0,0,${pulse})`);
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);
    }
  }

  // ══════════ Pass 7: Ambient Fog (Screen Space) ══════════
  ctx.globalAlpha = 0.06;
  const fx = t * 0.3;
  const fy = Math.sin(t * 0.015) * 40;
  for (let i = 0; i < 4; i++) {
    const fogCx = ((fx * (i + 1) * 1.5 + i * 200) % (W + 400)) - 200;
    const fogCy = (H / 2) + fy + (i * 50 - 100);
    const fgrad = ctx.createRadialGradient(fogCx, fogCy, 0, fogCx, fogCy, 250);
    fgrad.addColorStop(0, 'rgba(150, 160, 180, 0.4)');
    fgrad.addColorStop(1, 'rgba(150, 160, 180, 0)');
    ctx.fillStyle = fgrad;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.globalAlpha = 1.0;
  ctx.restore();
}

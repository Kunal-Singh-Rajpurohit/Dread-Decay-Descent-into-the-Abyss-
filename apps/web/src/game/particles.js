// ─── particles.js ─── Particle system for visual effects ──────────────────
import { TS } from './constants.js';

/* ── Helpers ───────────────────────────────────────────────────────────────── */
function rand(lo, hi) { return lo + Math.random() * (hi - lo); }
function pick(arr)     { return arr[(Math.random() * arr.length) | 0]; }

/* ── Particle class (plain object factory) ─────────────────────────────────  */
function mkParticle(x, y, vx, vy, life, color, size, gravity = 0) {
  return { x, y, vx, vy, life, maxLife: life, color, size, gravity };
}

/* ── Emitter definitions ───────────────────────────────────────────────────  */
const EMITTERS = {
  torch(px, py) {
    return [mkParticle(
      px, py,
      rand(-0.2, 0.2), rand(-0.8, -0.2),
      (15 + Math.random() * 10) | 0,
      pick(['#fbbf24', '#f59e0b', '#d97706', '#ef4444']),
      rand(0.5, 1.5),
      -0.02 // floats up slightly
    )];
  },
  blood(px, py) {
    const count = 8 + (Math.random() * 5) | 0; // 8-12
    const out = [];
    const colors = ['#dc2626', '#991b1b', '#7f1d1d'];
    for (let i = 0; i < count; i++) {
      out.push(mkParticle(
        px, py,
        rand(-1.5, 1.5), rand(-2, 0.5),
        (20 + Math.random() * 16) | 0,
        pick(colors),
        rand(1, 2.5),
        0.08 // gravity
      ));
    }
    return out;
  },

  crit(px, py) {
    const count = 15 + (Math.random() * 6) | 0; // 15-20
    const out = [];
    const colors = ['#fbbf24', '#f59e0b', '#d97706'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = rand(1.5, 3.5);
      out.push(mkParticle(
        px, py,
        Math.cos(angle) * speed, Math.sin(angle) * speed,
        (15 + Math.random() * 11) | 0,
        pick(colors),
        rand(1, 3)
      ));
    }
    return out;
  },

  flame(px, py) {
    const count = 3 + (Math.random() * 3) | 0; // 3-5
    const out = [];
    const colors = ['#ff9500', '#ff6b00', '#ff4500'];
    for (let i = 0; i < count; i++) {
      out.push(mkParticle(
        px + rand(-4, 4), py + rand(-2, 2),
        rand(-0.2, 0.2), rand(-0.8, -0.3),
        (15 + Math.random() * 11) | 0,
        pick(colors),
        rand(1, 2)
      ));
    }
    return out;
  },

  dust(px, py) {
    const count = 2 + (Math.random() * 2) | 0; // 2-3
    const out = [];
    const colors = ['#4a4a4a', '#3a3a3a', '#555555'];
    for (let i = 0; i < count; i++) {
      out.push(mkParticle(
        px + rand(-3, 3), py,
        rand(-0.4, 0.4), rand(0.1, 0.4),
        (10 + Math.random() * 11) | 0,
        pick(colors),
        rand(1, 2)
      ));
    }
    return out;
  },

  soul(px, py) {
    const count = 6 + (Math.random() * 3) | 0; // 6-8
    const out = [];
    const colors = ['#9333ea', '#7c3aed', '#6d28d9'];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      out.push(mkParticle(
        px, py,
        Math.cos(angle) * 0.8, Math.sin(angle) * 0.8,
        (30 + Math.random() * 21) | 0,
        pick(colors),
        rand(1.5, 2.5)
      ));
    }
    return out;
  },

  death(px, py) {
    const count = 20 + (Math.random() * 11) | 0; // 20-30
    const out = [];
    const colors = ['#dc2626', '#991b1b', '#7f1d1d', '#1a0505', '#2d0a0a'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = rand(0.8, 3);
      out.push(mkParticle(
        px, py,
        Math.cos(angle) * speed, Math.sin(angle) * speed,
        (25 + Math.random() * 16) | 0,
        pick(colors),
        rand(1, 3),
        0.05
      ));
    }
    return out;
  },

  heal(px, py) {
    const count = 5 + (Math.random() * 4) | 0; // 5-8
    const out = [];
    const colors = ['#22c55e', '#16a34a'];
    for (let i = 0; i < count; i++) {
      out.push(mkParticle(
        px + rand(-5, 5), py,
        rand(-0.2, 0.2), rand(-0.6, -0.2),
        (20 + Math.random() * 11) | 0,
        pick(colors),
        rand(1, 2.5)
      ));
    }
    return out;
  },

  levelup(px, py) {
    const count = 15 + (Math.random() * 6) | 0; // 15-20
    const out = [];
    const colors = ['#fbbf24', '#f59e0b', '#ffffff', '#fef3c7'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = rand(1, 3);
      out.push(mkParticle(
        px, py,
        Math.cos(angle) * speed, Math.sin(angle) * speed,
        (30 + Math.random() * 16) | 0,
        pick(colors),
        rand(1.5, 3)
      ));
    }
    return out;
  },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/* ── Particle System ───────────────────────────────────────────────────────  */
/* ═══════════════════════════════════════════════════════════════════════════ */
export class ParticleSystem {
  constructor() {
    /** @type {Array<{x:number,y:number,vx:number,vy:number,life:number,maxLife:number,color:string,size:number,gravity:number,swirlPhase?:number}>} */
    this._particles = [];
  }

  /**
   * Emit a burst of particles at tile coordinates.
   * @param {'blood'|'crit'|'flame'|'dust'|'soul'|'death'|'heal'|'levelup'} type
   * @param {number} tileX - Tile x
   * @param {number} tileY - Tile y
   * @param {object} [opts] - unused reserved
   */
  emit(type, tileX, tileY, opts) {
    const emitter = EMITTERS[type];
    if (!emitter) return;
    const px = tileX * TS + TS / 2;
    const py = tileY * TS + TS / 2;
    const spawned = emitter(px, py);

    // Add swirl metadata for soul particles
    if (type === 'soul') {
      for (let i = 0; i < spawned.length; i++) {
        spawned[i].swirlPhase = (i / spawned.length) * Math.PI * 2;
        spawned[i]._originX = px;
        spawned[i]._originY = py;
      }
    }

    this._particles.push(...spawned);
  }

  /** Advance all particles one frame, removing dead ones. */
  update() {
    for (let i = this._particles.length - 1; i >= 0; i--) {
      const p = this._particles[i];
      p.life--;
      if (p.life <= 0) {
        // Swap-remove
        this._particles[i] = this._particles[this._particles.length - 1];
        this._particles.pop();
        continue;
      }

      // Soul particles swirl in circular pattern
      if (p.swirlPhase !== undefined) {
        const age = p.maxLife - p.life;
        const r = 6 + age * 0.3;
        p.x = p._originX + Math.cos(p.swirlPhase + age * 0.15) * r;
        p.y = p._originY + Math.sin(p.swirlPhase + age * 0.15) * r - age * 0.2;
      } else {
        p.x += p.vx;
        p.y += p.vy;
        if (p.gravity) p.vy += p.gravity;
      }
    }
  }

  /**
   * Render all live particles on a canvas context.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    for (const p of this._particles) {
      if (p.life <= 0) continue;
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  /** Get live particle array (for passing into render state). */
  get particles() {
    return this._particles;
  }
}

// ═══════════════════════════════════════════════════════════════
// ACHIEVEMENTS — Phase 6
// ═══════════════════════════════════════════════════════════════

export const ACHIEVEMENTS = [
  {id:'first_blood',    name:'First Blood',       desc:'Kill your first enemy.',          icon:'🗡️', cat:'Combat'},
  {id:'butcher',        name:'Butcher',            desc:'Kill 25 enemies.',               icon:'⚔️', cat:'Combat'},
  {id:'surgeon',        name:'Surgeon',            desc:'Sever 10 body parts.',           icon:'✂️', cat:'Combat'},
  {id:'warden_slayer',  name:'Warden Slayer',      desc:'Defeat The Warden on Floor 5.',  icon:'⚡', cat:'Combat'},
  {id:'colossus_fall',  name:'Colossus Falls',     desc:'Defeat The Colossus on Floor 10.',icon:'Θ',  cat:'Combat'},
  {id:'deep_diver',     name:'Deep Diver',         desc:'Reach Floor 5.',                 icon:'▼',  cat:'Explore'},
  {id:'abyss_walker',   name:'Abyss Walker',       desc:'Reach Floor 10.',                icon:'◈',  cat:'Explore'},
  {id:'hoarder',        name:'Hoarder',            desc:'Carry 15 items at once.',        icon:'📦', cat:'Explore'},
  {id:'starving',       name:'Starving',           desc:'Reach 0 hunger and survive.',    icon:'🦴', cat:'Survive'},
  {id:'fearless',       name:'Fearless',           desc:'Complete Floor 5 with fear < 20.',icon:'😐', cat:'Survive'},
  {id:'alchemist',      name:'Alchemist',          desc:'Craft 5 items.',                 icon:'⚗️', cat:'Survive'},
  {id:'scholar_path',   name:'Scholar\'s Path',    desc:'Collect 5 lore entries.',         icon:'📖', cat:'Lore'},
];

export class AchievementTracker {
  constructor() {
    this.unlocked = this._load(); // Load from localStorage
    this.pending = [];  // Recently unlocked, for toast display
    this.stats = { kills: 0, severs: 0, crafts: 0, maxItems: 0 };
  }
  _load() { try { return JSON.parse(localStorage.getItem('fd_achievements') || '[]'); } catch { return []; } }
  _save() { try { localStorage.setItem('fd_achievements', JSON.stringify(this.unlocked)); } catch {} }
  
  unlock(id) {
    if (this.unlocked.includes(id)) return false;
    this.unlocked.push(id);
    this.pending.push(id);
    this._save();
    return true;
  }
  
  popPending() {
    if (this.pending.length === 0) return null;
    return this.pending.shift();
  }
  
  isUnlocked(id) { return this.unlocked.includes(id); }
  getAll() { return ACHIEVEMENTS.map(a => ({...a, unlocked: this.unlocked.includes(a.id)})); }
  getUnlockedCount() { return this.unlocked.length; }
  
  // Call after game events to check conditions
  check(event, data) {
    // event types: 'kill', 'sever', 'floor', 'craft', 'inventory', 'boss_kill', 'lore'
    // Returns array of newly unlocked achievement IDs
    const newly = [];
    if (event === 'kill') {
      this.stats.kills++;
      if (this.stats.kills >= 1) this.unlock('first_blood') && newly.push('first_blood');
      if (this.stats.kills >= 25) this.unlock('butcher') && newly.push('butcher');
    }
    if (event === 'sever') {
      this.stats.severs++;
      if (this.stats.severs >= 10) this.unlock('surgeon') && newly.push('surgeon');
    }
    if (event === 'floor') {
      if (data.floor >= 5) this.unlock('deep_diver') && newly.push('deep_diver');
      if (data.floor >= 10) this.unlock('abyss_walker') && newly.push('abyss_walker');
    }
    if (event === 'boss_kill') {
      if (data.boss === 'warden') this.unlock('warden_slayer') && newly.push('warden_slayer');
      if (data.boss === 'colossus') this.unlock('colossus_fall') && newly.push('colossus_fall');
    }
    if (event === 'craft') {
      this.stats.crafts++;
      if (this.stats.crafts >= 5) this.unlock('alchemist') && newly.push('alchemist');
    }
    if (event === 'inventory') {
      if (data.count >= 15) this.unlock('hoarder') && newly.push('hoarder');
    }
    if (event === 'survive') {
      if (data.hunger <= 0) this.unlock('starving') && newly.push('starving');
      if (data.floor >= 5 && data.fear < 20) this.unlock('fearless') && newly.push('fearless');
    }
    if (event === 'lore') {
      if (data.count >= 5) this.unlock('scholar_path') && newly.push('scholar_path');
    }
    return newly;
  }
}

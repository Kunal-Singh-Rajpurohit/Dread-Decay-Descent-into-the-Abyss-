import type { PlayerState } from "../types/index.js";

export function survivalTick(p: PlayerState): { p: PlayerState; msgs: string[] } {
  const out: PlayerState = { ...p, statuses: [...p.statuses] };
  const msgs: string[] = [];

  out.hunger = Math.max(0, out.hunger - 0.5);
  out.torch  = Math.max(0, out.torch  - 1);

  if (out.hunger === 0) {
    out.hp = Math.max(0, out.hp - 1);
    if (out.steps % 6 === 0) msgs.push("Hunger consumes you from within...");
  }
  if (out.torch === 0) {
    out.fear = Math.min(100, out.fear + 0.4);
    if (out.steps % 10 === 0) msgs.push("Darkness. Pure, absolute darkness.");
  }

  // Status effect ticks
  out.statuses = out.statuses.reduce<typeof out.statuses>((acc, s) => {
    const ns = { ...s, dur: s.dur > 0 ? s.dur - 1 : s.dur };

    if (s.type === "BLEEDING" && out.steps % 4 === 0) {
      out.hp = Math.max(0, out.hp - 1);
      if (out.steps % 12 === 0) msgs.push("You bleed...");
    }
    if (s.type === "POISONED") {
      out.hp = Math.max(0, out.hp - 2);
      if (out.steps % 3 === 0) msgs.push("Poison burns.");
      if (ns.dur <= 0) return acc;
    }
    if (s.type === "BURNING") {
      out.hp = Math.max(0, out.hp - 2);
      out.fear = Math.min(100, out.fear + 1);
      if (out.steps % 2 === 0) msgs.push("You burn!");
      if (ns.dur <= 0) return acc;
    }
    if (s.type === "REGEN" && out.steps % 5 === 0) {
      out.hp = Math.min(out.maxHp, out.hp + 1);
    }
    if (s.type === "STUNNED" || s.type === "WEAKENED") {
      if (ns.dur <= 0) return acc;
    }

    acc.push(ns);
    return acc;
  }, []);

  // Ability cooldown ticks every 2 steps
  if (out.abilityCD > 0 && out.steps % 2 === 0) {
    out.abilityCD = Math.max(0, out.abilityCD - 1);
  }

  return { p: out, msgs };
}

export function getTorchRadius(p: PlayerState): number {
  if (p.torch <= 0)  return 2;
  if (p.torch < 35)  return 3;
  return 6;
}

export function getPlayerLevel(xp: number): number {
  const XP_LV = [0, 60, 150, 280, 450, 670];
  let level = 0;
  XP_LV.forEach((t, i) => { if (xp >= t) level = i; });
  return level;
}

export function applyLevelUpChoice(
  player: PlayerState,
  choice: "hp" | "atk" | "def" | "clear" | "cd"
): PlayerState {
  const np: PlayerState = JSON.parse(JSON.stringify(player));
  if (choice === "hp")    { np.maxHp += 10; np.hp = Math.min(np.maxHp, np.hp + 10); }
  if (choice === "atk")   np.atk  += 2;
  if (choice === "def")   np.def  += 2;
  if (choice === "clear") np.statuses = [];
  if (choice === "cd")    np.abilityCD = Math.max(0, np.abilityCD - 2);
  return np;
}

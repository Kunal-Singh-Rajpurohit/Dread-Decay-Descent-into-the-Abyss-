// ═══════════════════════════════════════════════════════════════
// CONSTANTS — Phase 6
// Extracted from P5 §1
// ═══════════════════════════════════════════════════════════════

export const MW = 40, MH = 24, TS = 22;
export const TR_FULL = 7, TR_DIM = 3, TR_DARK = 2;
export const T = { W: 0, F: 1, S: 2, D: 3, TR: 4 }; // Wall, Floor, Stair, Door, Trap
export const PMUL = { head: 2.0, torso: 1.0, rightArm: 0.7, leftArm: 0.7, rightLeg: 0.6, leftLeg: 0.6 };
export const PLAB = { head: "Head", torso: "Torso", rightArm: "R.Arm", leftArm: "L.Arm", rightLeg: "R.Leg", leftLeg: "L.Leg" };
export const XP_LV = [0, 60, 150, 280, 450, 670, 950, 1300, 1700, 2200];
export const SCOL = {
  BLEEDING: "#dc2626",
  POISONED: "#4d7c0f",
  STUNNED: "#d97706",
  BURNING: "#ea580c",
  WEAKENED: "#6b7280",
  REGEN: "#0891b2",
  CURSED: "#7c3aed",
  FROZEN: "#38bdf8"
};
export const MAX_FLOOR = 10;

import { useEffect, useCallback, useRef } from "react";
import { useGameStore } from "../store/gameStore.js";

/**
 * useGameInput — wires WASD / Arrow keys (desktop) and swipe gestures
 * (mobile) to the game store's move/pickup/inventory actions.
 *
 * Attach to the top-level game component. Automatically disables when a
 * modal (combat, inventory, event, level-up) is visible.
 */
export function useGameInput() {
  const move      = useGameStore(s => s.move);
  const doPickup  = useGameStore(s => s.pickupItem);
  const setShowInv= useGameStore(s => s.setShowInv);
  const combat    = useGameStore(s => s.combat);
  const showInv   = useGameStore(s => s.showInv);
  const evModal   = useGameStore(s => s.evModal);
  const lvModal   = useGameStore(s => s.lvModal);
  const screen    = useGameStore(s => s.screen);
  const gameState = useGameStore(s => s.gameState);

  const blocked = !!(combat || showInv || evModal || lvModal || screen !== "game");

  // ── Keyboard ────────────────────────────────────────
  useEffect(() => {
    const DIR: Record<string, [number, number]> = {
      ArrowUp: [0,-1], ArrowDown: [0,1], ArrowLeft: [-1,0], ArrowRight: [1,0],
      w: [0,-1], s: [0,1], a: [-1,0], d: [1,0],
      W: [0,-1], S: [0,1], A: [-1,0], D: [1,0],
    };

    const handler = (e: KeyboardEvent) => {
      if (screen !== "game") return;

      // Inventory open — only ESC closes it
      if (showInv) {
        if (e.key === "Escape" || e.key === "i") setShowInv(false);
        return;
      }
      if (combat || evModal || lvModal) return;

      if (DIR[e.key]) {
        e.preventDefault();
        const [dx, dy] = DIR[e.key];
        move(dx, dy);
        return;
      }

      if (e.key === "i" || e.key === "I") {
        setShowInv(true);
        return;
      }

      if (e.key === "." || e.key === "z" || e.key === "Z") {
        // Find item at player position
        if (!gameState) return;
        const { x, y } = gameState.player;
        const item = gameState.dungeon.gi.find(g => g.x === x && g.y === y);
        if (item) doPickup(item.gid);
        else move(0, 0); // wait
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [screen, blocked, combat, showInv, evModal, lvModal, gameState, move, doPickup, setShowInv]);

  // ── Touch / Swipe ───────────────────────────────────
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const MIN_SWIPE  = 30; // px

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current || blocked) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;

    if (Math.abs(dx) < MIN_SWIPE && Math.abs(dy) < MIN_SWIPE) return;

    if (Math.abs(dx) >= Math.abs(dy)) {
      move(dx > 0 ? 1 : -1, 0);
    } else {
      move(0, dy > 0 ? 1 : -1);
    }
  }, [blocked, move]);

  return { onTouchStart, onTouchEnd };
}

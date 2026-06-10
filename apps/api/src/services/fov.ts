import type { TileMap } from "@fear/game-core/types";

const MW = 32, MH = 20;

/**
 * Raycasting FOV — returns a Set of "x,y" tile keys visible from (px, py)
 * within the given radius. Walls block sight.
 */
export function computeFOV(
  map:    TileMap,
  px:     number,
  py:     number,
  radius: number,
): Set<string> {
  const vis  = new Set<string>();
  const rays = Math.ceil(radius * Math.PI * 4);

  for (let i = 0; i < rays; i++) {
    const a  = (i / rays) * Math.PI * 2;
    let   rx = px, ry = py;
    const dx = Math.cos(a) * 0.5;
    const dy = Math.sin(a) * 0.5;

    for (let step = 0; step <= radius * 2; step++) {
      const tx = Math.round(rx), ty = Math.round(ry);
      if (tx < 0 || tx >= MW || ty < 0 || ty >= MH) break;
      vis.add(`${tx},${ty}`);
      if (map[ty][tx] === 0 /* WALL */) break;
      rx += dx;
      ry += dy;
    }
  }

  return vis;
}

/** Merge new visible tiles into the "ever seen" array */
export function mergeSeen(seen: string[], newVisible: Set<string>): string[] {
  const set = new Set(seen);
  newVisible.forEach(k => set.add(k));
  return Array.from(set);
}

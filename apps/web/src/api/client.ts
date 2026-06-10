import type {
  GameState, GameAction, ActionResponse,
  CharacterClass,
} from "@fear/game-core/types";

// ── Base ──────────────────────────────────────────────
const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

async function req<T>(
  method: string,
  path:   string,
  body?:  unknown,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include", // send httpOnly cookie
    headers: body ? { "Content-Type": "application/json" } : {},
    body:    body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────
export const auth = {
  register: (email: string, username: string, password: string) =>
    req<{ ok: boolean; userId: string; username: string }>(
      "POST", "/auth/register", { email, username, password }
    ),

  login: (email: string, password: string) =>
    req<{ ok: boolean; userId: string; username: string }>(
      "POST", "/auth/login", { email, password }
    ),

  me: () =>
    req<{ ok: boolean; userId: string; username: string }>("GET", "/auth/me"),

  logout: () => req<{ ok: boolean }>("DELETE", "/auth/logout"),
};

// ── Saves ─────────────────────────────────────────────
export interface SaveMeta {
  id:             string;
  slotIndex:      number;
  status:         "alive" | "dead" | "won";
  characterClass: CharacterClass;
  characterName:  string;
  floorReached:   number;
  level:          number;
  xp:             number;
  playtimeSeconds:number;
  updatedAt:      string;
}

export const savesApi = {
  list: () =>
    req<{ ok: boolean; saves: SaveMeta[] }>("GET", "/saves"),

  create: (slotIndex: number, characterClass: CharacterClass) =>
    req<{ ok: boolean; saveId: string; state: GameState }>(
      "POST", "/saves", { slotIndex, characterClass }
    ),

  load: (saveId: string) =>
    req<{ ok: boolean; save: { id: string; state: GameState } }>(
      "GET", `/saves/${saveId}`
    ),

  // Push full state (for non-combat actions resolved client-side)
  checkpoint: (saveId: string, state: GameState, playtimeSeconds: number) =>
    req<{ ok: boolean }>("PUT", `/saves/${saveId}`, { state, playtimeSeconds }),

  delete: (saveId: string) =>
    req<{ ok: boolean }>("DELETE", `/saves/${saveId}`),

  recordDeath: (saveId: string, causeOfDeath: string, killedBy?: string) =>
    req<{ ok: boolean }>("POST", `/saves/${saveId}/death`, { causeOfDeath, killedBy }),
};

// ── Game actions (server-authoritative) ───────────────
export const gameApi = {
  action: (saveId: string, action: Omit<GameAction, "saveId">) =>
    req<ActionResponse>("POST", "/game/action", {
      saveId,
      action: { ...action, saveId },
    }),
};

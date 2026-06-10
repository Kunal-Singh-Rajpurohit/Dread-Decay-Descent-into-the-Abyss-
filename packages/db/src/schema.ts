import {
  pgTable, uuid, text, integer, jsonb,
  timestamp, boolean, index, uniqueIndex
} from "drizzle-orm/pg-core";

// ═══════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════
export const users = pgTable("users", {
  id:           uuid("id").primaryKey().defaultRandom(),
  email:        text("email").notNull().unique(),
  username:     text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
  lastLoginAt:  timestamp("last_login_at"),
}, (t) => ({
  emailIdx:    uniqueIndex("users_email_idx").on(t.email),
  usernameIdx: uniqueIndex("users_username_idx").on(t.username),
}));

// ═══════════════════════════════════════════════════════
// SAVES  (max 3 per user — enforced in app logic)
// ═══════════════════════════════════════════════════════
export const saves = pgTable("saves", {
  id:             uuid("id").primaryKey().defaultRandom(),
  userId:         uuid("user_id")
                    .references(() => users.id, { onDelete: "cascade" })
                    .notNull(),
  slotIndex:      integer("slot_index").notNull().default(0), // 0 | 1 | 2

  // Status
  status:         text("status").notNull().default("alive"),
  // 'alive' | 'dead' | 'won'

  // Character snapshot (for lobby display — full state is in `state`)
  characterClass: text("character_class").notNull(),
  characterName:  text("character_name").notNull(),
  floorReached:   integer("floor_reached").notNull().default(1),
  level:          integer("level").notNull().default(1),
  xp:             integer("xp").notNull().default(0),
  playtimeSeconds:integer("playtime_seconds").notNull().default(0),

  // Full serialised game state — player, dungeon map, enemies, items, events
  state:          jsonb("state").notNull(),

  createdAt:      timestamp("created_at").defaultNow().notNull(),
  updatedAt:      timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  userSlotIdx: uniqueIndex("saves_user_slot_idx").on(t.userId, t.slotIndex),
  userIdx:     index("saves_user_idx").on(t.userId),
}));

// ═══════════════════════════════════════════════════════
// DEATH LOGS  (permanent record, even after save deletion)
// ═══════════════════════════════════════════════════════
export const deathLogs = pgTable("death_logs", {
  id:             uuid("id").primaryKey().defaultRandom(),
  userId:         uuid("user_id")
                    .references(() => users.id, { onDelete: "set null" }),
  username:       text("username").notNull(),
  characterClass: text("character_class").notNull(),
  floorReached:   integer("floor_reached").notNull(),
  stepsWalked:    integer("steps_walked").notNull(),
  xpEarned:       integer("xp_earned").notNull(),
  causeOfDeath:   text("cause_of_death").notNull(), // 'hp' | 'fear' | 'hunger'
  killedBy:       text("killed_by"),                // enemy name if applicable
  diedAt:         timestamp("died_at").defaultNow().notNull(),
});

// ═══════════════════════════════════════════════════════
// LEADERBOARD  (deepest floor clears only)
// ═══════════════════════════════════════════════════════
export const leaderboard = pgTable("leaderboard", {
  id:             uuid("id").primaryKey().defaultRandom(),
  userId:         uuid("user_id")
                    .references(() => users.id, { onDelete: "set null" }),
  username:       text("username").notNull(),
  characterClass: text("character_class").notNull(),
  floorReached:   integer("floor_reached").notNull(),
  xpEarned:       integer("xp_earned").notNull(),
  wonGame:        boolean("won_game").notNull().default(false),
  achievedAt:     timestamp("achieved_at").defaultNow().notNull(),
}, (t) => ({
  floorIdx: index("leaderboard_floor_idx").on(t.floorReached),
}));

// ── Types inferred from schema ──────────────────────────
export type User         = typeof users.$inferSelect;
export type NewUser      = typeof users.$inferInsert;
export type Save         = typeof saves.$inferSelect;
export type NewSave      = typeof saves.$inferInsert;
export type DeathLog     = typeof deathLogs.$inferSelect;
export type NewDeathLog  = typeof deathLogs.$inferInsert;

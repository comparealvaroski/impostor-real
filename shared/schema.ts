import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const players = pgTable("players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  sessionId: text("session_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rooms = pgTable("rooms", {
  id: varchar("id").primaryKey(),
  hostId: varchar("host_id").notNull(),
  maxPlayers: integer("max_players").notNull().default(6),
  impostorCount: integer("impostor_count").notNull().default(1),
  voteTime: integer("vote_time").notNull().default(60),
  isActive: boolean("is_active").notNull().default(true),
  currentRound: integer("current_round").notNull().default(0),
  gameState: text("game_state").notNull().default("waiting"), // waiting, playing, voting, results, finished
  currentFootballer: text("current_footballer"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const roomPlayers = pgTable("room_players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull(),
  playerId: varchar("player_id").notNull(),
  isImpostor: boolean("is_impostor").notNull().default(false),
  isAlive: boolean("is_alive").notNull().default(true),
  isHost: boolean("is_host").notNull().default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const votes = pgTable("votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull(),
  round: integer("round").notNull(),
  voterId: varchar("voter_id").notNull(),
  targetId: varchar("target_id"), // null for skip vote
  createdAt: timestamp("created_at").defaultNow(),
});

export const gameStats = pgTable("game_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: varchar("player_id").notNull(),
  gamesPlayed: integer("games_played").notNull().default(0),
  gamesWon: integer("games_won").notNull().default(0),
  impostorGames: integer("impostor_games").notNull().default(0),
  impostorWins: integer("impostor_wins").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Zod schemas
export const insertPlayerSchema = createInsertSchema(players).omit({ id: true, createdAt: true });
export const insertRoomSchema = createInsertSchema(rooms).omit({ id: true, createdAt: true, currentRound: true, gameState: true, currentFootballer: true, isActive: true });
export const insertRoomPlayerSchema = createInsertSchema(roomPlayers).omit({ id: true, joinedAt: true });
export const insertVoteSchema = createInsertSchema(votes).omit({ id: true, createdAt: true });
export const insertGameStatsSchema = createInsertSchema(gameStats).omit({ id: true, updatedAt: true });

// Types
export type Player = typeof players.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type RoomPlayer = typeof roomPlayers.$inferSelect;
export type InsertRoomPlayer = z.infer<typeof insertRoomPlayerSchema>;
export type Vote = typeof votes.$inferSelect;
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type GameStats = typeof gameStats.$inferSelect;
export type InsertGameStats = z.infer<typeof insertGameStatsSchema>;

// Additional types for game logic
export type GameState = "waiting" | "playing" | "voting" | "results" | "finished";
export type PlayerRole = "impostor" | "player";

export interface FootballPlayer {
  id: string;
  name: string;
  position: string;
  country: string;
  imageUrl: string;
  hints: string[];
}

export interface GameMessage {
  type: "player_joined" | "player_left" | "game_started" | "role_assigned" | "voting_started" | "vote_cast" | "round_ended" | "game_ended" | "error";
  payload: any;
  timestamp: number;
}

export interface RoomState {
  room: Room;
  players: (RoomPlayer & { player: Player })[];
  currentFootballer?: FootballPlayer;
  votes?: Vote[];
}

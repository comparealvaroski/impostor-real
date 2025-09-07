import { type Player, type InsertPlayer, type Room, type InsertRoom, type RoomPlayer, type InsertRoomPlayer, type Vote, type InsertVote, type GameStats, type InsertGameStats, type RoomState } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Player methods
  getPlayer(id: string): Promise<Player | undefined>;
  getPlayerBySessionId(sessionId: string): Promise<Player | undefined>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: string, updates: Partial<Player>): Promise<Player | undefined>;

  // Room methods
  getRoom(id: string): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: string, updates: Partial<Room>): Promise<Room | undefined>;
  deleteRoom(id: string): Promise<boolean>;
  getActiveRooms(): Promise<Room[]>;

  // Room player methods
  getRoomPlayers(roomId: string): Promise<(RoomPlayer & { player: Player })[]>;
  addPlayerToRoom(roomPlayer: InsertRoomPlayer): Promise<RoomPlayer>;
  removePlayerFromRoom(roomId: string, playerId: string): Promise<boolean>;
  updateRoomPlayer(roomId: string, playerId: string, updates: Partial<RoomPlayer>): Promise<RoomPlayer | undefined>;
  getRoomPlayer(roomId: string, playerId: string): Promise<RoomPlayer | undefined>;

  // Vote methods
  getVotes(roomId: string, round: number): Promise<Vote[]>;
  castVote(vote: InsertVote): Promise<Vote>;
  clearVotes(roomId: string, round: number): Promise<boolean>;

  // Game stats methods
  getGameStats(playerId: string): Promise<GameStats | undefined>;
  updateGameStats(playerId: string, updates: Partial<GameStats>): Promise<GameStats>;
  
  // Helper methods
  getRoomState(roomId: string): Promise<RoomState | undefined>;
}

export class MemStorage implements IStorage {
  private players: Map<string, Player> = new Map();
  private rooms: Map<string, Room> = new Map();
  private roomPlayers: Map<string, RoomPlayer[]> = new Map();
  private votes: Map<string, Vote[]> = new Map();
  private gameStats: Map<string, GameStats> = new Map();

  // Player methods
  async getPlayer(id: string): Promise<Player | undefined> {
    return this.players.get(id);
  }

  async getPlayerBySessionId(sessionId: string): Promise<Player | undefined> {
    return Array.from(this.players.values()).find(player => player.sessionId === sessionId);
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const id = randomUUID();
    const player: Player = { 
      ...insertPlayer, 
      id, 
      createdAt: new Date() 
    };
    this.players.set(id, player);
    return player;
  }

  async updatePlayer(id: string, updates: Partial<Player>): Promise<Player | undefined> {
    const player = this.players.get(id);
    if (!player) return undefined;
    
    const updatedPlayer = { ...player, ...updates };
    this.players.set(id, updatedPlayer);
    return updatedPlayer;
  }

  // Room methods
  async getRoom(id: string): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const id = this.generateRoomCode();
    const room: Room = {
      ...insertRoom,
      id,
      currentRound: 0,
      gameState: "waiting",
      currentFootballer: null,
      isActive: true,
      createdAt: new Date()
    };
    this.rooms.set(id, room);
    this.roomPlayers.set(id, []);
    return room;
  }

  async updateRoom(id: string, updates: Partial<Room>): Promise<Room | undefined> {
    const room = this.rooms.get(id);
    if (!room) return undefined;
    
    const updatedRoom = { ...room, ...updates };
    this.rooms.set(id, updatedRoom);
    return updatedRoom;
  }

  async deleteRoom(id: string): Promise<boolean> {
    const deleted = this.rooms.delete(id);
    this.roomPlayers.delete(id);
    this.votes.delete(id);
    return deleted;
  }

  async getActiveRooms(): Promise<Room[]> {
    return Array.from(this.rooms.values()).filter(room => room.isActive);
  }

  // Room player methods
  async getRoomPlayers(roomId: string): Promise<(RoomPlayer & { player: Player })[]> {
    const roomPlayersList = this.roomPlayers.get(roomId) || [];
    return roomPlayersList.map(rp => ({
      ...rp,
      player: this.players.get(rp.playerId)!
    })).filter(rp => rp.player);
  }

  async addPlayerToRoom(insertRoomPlayer: InsertRoomPlayer): Promise<RoomPlayer> {
    const id = randomUUID();
    const roomPlayer: RoomPlayer = {
      ...insertRoomPlayer,
      id,
      joinedAt: new Date()
    };
    
    const roomPlayersList = this.roomPlayers.get(insertRoomPlayer.roomId) || [];
    roomPlayersList.push(roomPlayer);
    this.roomPlayers.set(insertRoomPlayer.roomId, roomPlayersList);
    
    return roomPlayer;
  }

  async removePlayerFromRoom(roomId: string, playerId: string): Promise<boolean> {
    const roomPlayersList = this.roomPlayers.get(roomId) || [];
    const index = roomPlayersList.findIndex(rp => rp.playerId === playerId);
    
    if (index === -1) return false;
    
    roomPlayersList.splice(index, 1);
    this.roomPlayers.set(roomId, roomPlayersList);
    return true;
  }

  async updateRoomPlayer(roomId: string, playerId: string, updates: Partial<RoomPlayer>): Promise<RoomPlayer | undefined> {
    const roomPlayersList = this.roomPlayers.get(roomId) || [];
    const roomPlayer = roomPlayersList.find(rp => rp.playerId === playerId);
    
    if (!roomPlayer) return undefined;
    
    Object.assign(roomPlayer, updates);
    return roomPlayer;
  }

  async getRoomPlayer(roomId: string, playerId: string): Promise<RoomPlayer | undefined> {
    const roomPlayersList = this.roomPlayers.get(roomId) || [];
    return roomPlayersList.find(rp => rp.playerId === playerId);
  }

  // Vote methods
  async getVotes(roomId: string, round: number): Promise<Vote[]> {
    const votesList = this.votes.get(roomId) || [];
    return votesList.filter(vote => vote.round === round);
  }

  async castVote(insertVote: InsertVote): Promise<Vote> {
    const id = randomUUID();
    const vote: Vote = {
      ...insertVote,
      id,
      createdAt: new Date()
    };
    
    const votesList = this.votes.get(insertVote.roomId) || [];
    votesList.push(vote);
    this.votes.set(insertVote.roomId, votesList);
    
    return vote;
  }

  async clearVotes(roomId: string, round: number): Promise<boolean> {
    const votesList = this.votes.get(roomId) || [];
    const filteredVotes = votesList.filter(vote => vote.round !== round);
    this.votes.set(roomId, filteredVotes);
    return true;
  }

  // Game stats methods
  async getGameStats(playerId: string): Promise<GameStats | undefined> {
    return this.gameStats.get(playerId);
  }

  async updateGameStats(playerId: string, updates: Partial<GameStats>): Promise<GameStats> {
    const existing = this.gameStats.get(playerId);
    const stats: GameStats = existing ? 
      { ...existing, ...updates, updatedAt: new Date() } :
      {
        id: randomUUID(),
        playerId,
        gamesPlayed: 0,
        gamesWon: 0,
        impostorGames: 0,
        impostorWins: 0,
        updatedAt: new Date(),
        ...updates
      };
    
    this.gameStats.set(playerId, stats);
    return stats;
  }

  // Helper methods
  async getRoomState(roomId: string): Promise<RoomState | undefined> {
    const room = await this.getRoom(roomId);
    if (!room) return undefined;
    
    const players = await this.getRoomPlayers(roomId);
    const votes = await this.getVotes(roomId, room.currentRound);
    
    return {
      room,
      players,
      votes
    };
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Check if code already exists
    if (this.rooms.has(result)) {
      return this.generateRoomCode();
    }
    return result;
  }
}

export const storage = new MemStorage();

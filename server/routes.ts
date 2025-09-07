import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertPlayerSchema, insertRoomSchema, insertVoteSchema, type GameMessage, type RoomState, type FootballPlayer } from "@shared/schema";
import { footballPlayers } from "../client/src/lib/football-players";

interface ExtendedWebSocket extends WebSocket {
  playerId?: string;
  roomId?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time communication
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store active connections
  const connections = new Map<string, ExtendedWebSocket>();
  const roomConnections = new Map<string, Set<string>>();

  wss.on('connection', (ws: ExtendedWebSocket) => {
    console.log('Client connected');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await handleWebSocketMessage(ws, message);
      } catch (error) {
        console.error('WebSocket message error:', error);
        sendToClient(ws, {
          type: 'error',
          payload: { message: 'Invalid message format' },
          timestamp: Date.now()
        });
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
      handlePlayerDisconnect(ws);
    });
  });

  async function handleWebSocketMessage(ws: ExtendedWebSocket, message: any) {
    const { type, payload } = message;

    switch (type) {
      case 'join_room':
        await handleJoinRoom(ws, payload);
        break;
      case 'create_room':
        await handleCreateRoom(ws, payload);
        break;
      case 'start_game':
        await handleStartGame(ws, payload);
        break;
      case 'cast_vote':
        await handleCastVote(ws, payload);
        break;
      case 'next_round':
        await handleNextRound(ws, payload);
        break;
      default:
        sendToClient(ws, {
          type: 'error',
          payload: { message: 'Unknown message type' },
          timestamp: Date.now()
        });
    }
  }

  async function handleJoinRoom(ws: ExtendedWebSocket, payload: { playerName: string; roomId: string; sessionId?: string }) {
    try {
      const { playerName, roomId, sessionId } = payload;

      // Get or create player
      let player = sessionId ? await storage.getPlayerBySessionId(sessionId) : undefined;
      if (!player) {
        player = await storage.createPlayer({ name: playerName, sessionId: sessionId || generateSessionId() });
      }

      // Check if room exists
      const room = await storage.getRoom(roomId);
      if (!room) {
        sendToClient(ws, {
          type: 'error',
          payload: { message: 'Room not found' },
          timestamp: Date.now()
        });
        return;
      }

      // Check if room is full
      const roomPlayers = await storage.getRoomPlayers(roomId);
      if (roomPlayers.length >= room.maxPlayers) {
        sendToClient(ws, {
          type: 'error',
          payload: { message: 'Room is full' },
          timestamp: Date.now()
        });
        return;
      }

      // Check if player is already in room
      const existingRoomPlayer = await storage.getRoomPlayer(roomId, player.id);
      if (!existingRoomPlayer) {
        await storage.addPlayerToRoom({
          roomId,
          playerId: player.id,
          isImpostor: false,
          isAlive: true,
          isHost: false
        });
      }

      // Set up WebSocket connection
      ws.playerId = player.id;
      ws.roomId = roomId;
      connections.set(player.id, ws);

      if (!roomConnections.has(roomId)) {
        roomConnections.set(roomId, new Set());
      }
      roomConnections.get(roomId)!.add(player.id);

      // Send room state to all players in room
      const roomState = await storage.getRoomState(roomId);
      broadcastToRoom(roomId, {
        type: 'player_joined',
        payload: { roomState, joinedPlayer: player },
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Join room error:', error);
      sendToClient(ws, {
        type: 'error',
        payload: { message: 'Failed to join room' },
        timestamp: Date.now()
      });
    }
  }

  async function handleCreateRoom(ws: ExtendedWebSocket, payload: { playerName: string; maxPlayers: number; impostorCount: number; voteTime: number; sessionId?: string }) {
    try {
      const { playerName, maxPlayers, impostorCount, voteTime, sessionId } = payload;

      // Get or create player
      let player = sessionId ? await storage.getPlayerBySessionId(sessionId) : undefined;
      if (!player) {
        player = await storage.createPlayer({ name: playerName, sessionId: sessionId || generateSessionId() });
      }

      // Create room
      const room = await storage.createRoom({
        hostId: player.id,
        maxPlayers,
        impostorCount,
        voteTime
      });

      // Add host to room
      await storage.addPlayerToRoom({
        roomId: room.id,
        playerId: player.id,
        isImpostor: false,
        isAlive: true,
        isHost: true
      });

      // Set up WebSocket connection
      ws.playerId = player.id;
      ws.roomId = room.id;
      connections.set(player.id, ws);

      if (!roomConnections.has(room.id)) {
        roomConnections.set(room.id, new Set());
      }
      roomConnections.get(room.id)!.add(player.id);

      // Send room state
      const roomState = await storage.getRoomState(room.id);
      sendToClient(ws, {
        type: 'room_created',
        payload: { roomState },
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Create room error:', error);
      sendToClient(ws, {
        type: 'error',
        payload: { message: 'Failed to create room' },
        timestamp: Date.now()
      });
    }
  }

  async function handleStartGame(ws: ExtendedWebSocket, payload: { roomId: string }) {
    try {
      const { roomId } = payload;
      const room = await storage.getRoom(roomId);
      const roomPlayers = await storage.getRoomPlayers(roomId);

      if (!room || !roomPlayers.find(rp => rp.playerId === ws.playerId && rp.isHost)) {
        sendToClient(ws, {
          type: 'error',
          payload: { message: 'Not authorized to start game' },
          timestamp: Date.now()
        });
        return;
      }

      if (roomPlayers.length < 3) {
        sendToClient(ws, {
          type: 'error',
          payload: { message: 'Need at least 3 players to start' },
          timestamp: Date.now()
        });
        return;
      }

      // Assign roles randomly
      const shuffledPlayers = [...roomPlayers].sort(() => Math.random() - 0.5);
      for (let i = 0; i < room.impostorCount; i++) {
        await storage.updateRoomPlayer(roomId, shuffledPlayers[i].playerId, { isImpostor: true });
      }

      // Select random footballer
      const footballer = footballPlayers[Math.floor(Math.random() * footballPlayers.length)];

      // Update room state
      await storage.updateRoom(roomId, {
        gameState: "playing",
        currentRound: 1,
        currentFootballer: JSON.stringify(footballer)
      });

      // Send role assignments
      const updatedRoomPlayers = await storage.getRoomPlayers(roomId);
      for (const roomPlayer of updatedRoomPlayers) {
        const playerWs = connections.get(roomPlayer.playerId);
        if (playerWs) {
          sendToClient(playerWs, {
            type: 'role_assigned',
            payload: {
              isImpostor: roomPlayer.isImpostor,
              footballer: roomPlayer.isImpostor ? 
                { ...footballer, imageUrl: undefined } : // Impostors don't get image
                footballer,
              hint: roomPlayer.isImpostor ? 
                footballer.hints[Math.floor(Math.random() * footballer.hints.length)] : 
                undefined
            },
            timestamp: Date.now()
          });
        }
      }

      // Broadcast game started
      const roomState = await storage.getRoomState(roomId);
      broadcastToRoom(roomId, {
        type: 'game_started',
        payload: { roomState },
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Start game error:', error);
      sendToClient(ws, {
        type: 'error',
        payload: { message: 'Failed to start game' },
        timestamp: Date.now()
      });
    }
  }

  async function handleCastVote(ws: ExtendedWebSocket, payload: { roomId: string; targetId?: string }) {
    try {
      const { roomId, targetId } = payload;
      const room = await storage.getRoom(roomId);
      
      if (!room || room.gameState !== 'voting') {
        sendToClient(ws, {
          type: 'error',
          payload: { message: 'Voting not active' },
          timestamp: Date.now()
        });
        return;
      }

      // Cast vote
      await storage.castVote({
        roomId,
        round: room.currentRound,
        voterId: ws.playerId!,
        targetId
      });

      // Check if all votes are in
      const roomPlayers = await storage.getRoomPlayers(roomId);
      const alivePlayers = roomPlayers.filter(rp => rp.isAlive);
      const votes = await storage.getVotes(roomId, room.currentRound);

      if (votes.length >= alivePlayers.length) {
        // Process votes
        await processVotingResults(roomId);
      }

      const roomState = await storage.getRoomState(roomId);
      broadcastToRoom(roomId, {
        type: 'vote_cast',
        payload: { roomState },
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Cast vote error:', error);
      sendToClient(ws, {
        type: 'error',
        payload: { message: 'Failed to cast vote' },
        timestamp: Date.now()
      });
    }
  }

  async function handleNextRound(ws: ExtendedWebSocket, payload: { roomId: string }) {
    try {
      const { roomId } = payload;
      const room = await storage.getRoom(roomId);
      
      if (!room) return;

      // Check if game should continue
      const roomPlayers = await storage.getRoomPlayers(roomId);
      const alivePlayers = roomPlayers.filter(rp => rp.isAlive);
      const aliveImpostors = alivePlayers.filter(rp => rp.isImpostor);
      const aliveInnocents = alivePlayers.filter(rp => !rp.isImpostor);

      if (aliveImpostors.length === 0) {
        // Innocents win
        await endGame(roomId, false);
        return;
      }

      if (aliveImpostors.length >= aliveInnocents.length) {
        // Impostors win
        await endGame(roomId, true);
        return;
      }

      // Continue to next round
      const footballer = footballPlayers[Math.floor(Math.random() * footballPlayers.length)];
      await storage.updateRoom(roomId, {
        gameState: "playing",
        currentRound: room.currentRound + 1,
        currentFootballer: JSON.stringify(footballer)
      });

      // Clear previous votes
      await storage.clearVotes(roomId, room.currentRound);

      const roomState = await storage.getRoomState(roomId);
      broadcastToRoom(roomId, {
        type: 'round_started',
        payload: { roomState, footballer },
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Next round error:', error);
    }
  }

  async function processVotingResults(roomId: string) {
    const room = await storage.getRoom(roomId);
    if (!room) return;

    const votes = await storage.getVotes(roomId, room.currentRound);
    const voteCounts = new Map<string, number>();

    // Count votes
    votes.forEach(vote => {
      if (vote.targetId) {
        voteCounts.set(vote.targetId, (voteCounts.get(vote.targetId) || 0) + 1);
      }
    });

    // Find player with most votes
    let eliminatedPlayerId: string | null = null;
    let maxVotes = 0;
    let tieCount = 0;

    voteCounts.forEach((count, playerId) => {
      if (count > maxVotes) {
        maxVotes = count;
        eliminatedPlayerId = playerId;
        tieCount = 1;
      } else if (count === maxVotes) {
        tieCount++;
      }
    });

    // If tie or no votes, no elimination
    if (tieCount > 1 || maxVotes === 0) {
      eliminatedPlayerId = null;
    }

    // Eliminate player if applicable
    if (eliminatedPlayerId) {
      await storage.updateRoomPlayer(roomId, eliminatedPlayerId, { isAlive: false });
    }

    // Update room state
    await storage.updateRoom(roomId, { gameState: "results" });

    const roomState = await storage.getRoomState(roomId);
    broadcastToRoom(roomId, {
      type: 'round_ended',
      payload: { 
        roomState, 
        eliminatedPlayerId,
        voteCounts: Object.fromEntries(voteCounts)
      },
      timestamp: Date.now()
    });
  }

  async function endGame(roomId: string, impostorsWin: boolean) {
    await storage.updateRoom(roomId, { gameState: "finished" });

    // Update player stats
    const roomPlayers = await storage.getRoomPlayers(roomId);
    for (const roomPlayer of roomPlayers) {
      const currentStats = await storage.getGameStats(roomPlayer.playerId) || {
        gamesPlayed: 0,
        gamesWon: 0,
        impostorGames: 0,
        impostorWins: 0
      };

      const won = roomPlayer.isImpostor ? impostorsWin : !impostorsWin;
      
      await storage.updateGameStats(roomPlayer.playerId, {
        gamesPlayed: currentStats.gamesPlayed + 1,
        gamesWon: currentStats.gamesWon + (won ? 1 : 0),
        impostorGames: currentStats.impostorGames + (roomPlayer.isImpostor ? 1 : 0),
        impostorWins: currentStats.impostorWins + (roomPlayer.isImpostor && won ? 1 : 0)
      });
    }

    const roomState = await storage.getRoomState(roomId);
    broadcastToRoom(roomId, {
      type: 'game_ended',
      payload: { roomState, impostorsWin },
      timestamp: Date.now()
    });
  }

  function handlePlayerDisconnect(ws: ExtendedWebSocket) {
    if (ws.playerId) {
      connections.delete(ws.playerId);
    }
    if (ws.roomId && ws.playerId) {
      const roomConnections_ = roomConnections.get(ws.roomId);
      if (roomConnections_) {
        roomConnections_.delete(ws.playerId);
        
        // Broadcast player left
        broadcastToRoom(ws.roomId, {
          type: 'player_left',
          payload: { playerId: ws.playerId },
          timestamp: Date.now()
        });
      }
    }
  }

  function sendToClient(ws: ExtendedWebSocket, message: GameMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  function broadcastToRoom(roomId: string, message: GameMessage) {
    const roomConnections_ = roomConnections.get(roomId);
    if (roomConnections_) {
      roomConnections_.forEach(playerId => {
        const ws = connections.get(playerId);
        if (ws) {
          sendToClient(ws, message);
        }
      });
    }
  }

  function generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substr(2, 9);
  }

  // REST API routes
  app.get('/api/stats/:playerId', async (req, res) => {
    try {
      const stats = await storage.getGameStats(req.params.playerId);
      res.json(stats || { gamesPlayed: 0, gamesWon: 0, impostorGames: 0, impostorWins: 0 });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get stats' });
    }
  });

  app.post('/api/voting/:roomId', async (req, res) => {
    try {
      const { roomId } = req.params;
      await storage.updateRoom(roomId, { gameState: "voting" });
      
      const roomState = await storage.getRoomState(roomId);
      
      // Broadcast voting started
      broadcastToRoom(roomId, {
        type: 'voting_started',
        payload: { roomState },
        timestamp: Date.now()
      });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to start voting' });
    }
  });

  return httpServer;
}

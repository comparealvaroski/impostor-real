import { type RoomState, type FootballPlayer } from "@shared/schema";

export function getPlayerColor(index: number): string {
  const colors = [
    'bg-blue-500',
    'bg-purple-500', 
    'bg-pink-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500'
  ];
  return colors[index % colors.length];
}

export function getPlayerInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function generateSessionId(): string {
  return 'session_' + Math.random().toString(36).substr(2, 9);
}

export function calculateWinRate(gamesWon: number, gamesPlayed: number): number {
  if (gamesPlayed === 0) return 0;
  return Math.round((gamesWon / gamesPlayed) * 100);
}

export function getGameStatus(roomState: RoomState): {
  canStart: boolean;
  message: string;
} {
  const playerCount = roomState.players.length;
  const maxPlayers = roomState.room.maxPlayers;
  
  if (playerCount < 3) {
    return {
      canStart: false,
      message: `Necesitas al menos 3 jugadores (${playerCount}/3)`
    };
  }
  
  if (playerCount >= maxPlayers) {
    return {
      canStart: true,
      message: `Sala llena (${playerCount}/${maxPlayers})`
    };
  }
  
  return {
    canStart: true,
    message: `${playerCount}/${maxPlayers} jugadores`
  };
}

export function processVotingResults(votes: { [key: string]: number }): {
  eliminatedPlayerId: string | null;
  maxVotes: number;
  hasTie: boolean;
} {
  const entries = Object.entries(votes);
  
  if (entries.length === 0) {
    return { eliminatedPlayerId: null, maxVotes: 0, hasTie: false };
  }
  
  const maxVotes = Math.max(...entries.map(([_, count]) => count));
  const playersWithMaxVotes = entries.filter(([_, count]) => count === maxVotes);
  
  const hasTie = playersWithMaxVotes.length > 1;
  const eliminatedPlayerId = hasTie ? null : playersWithMaxVotes[0][0];
  
  return { eliminatedPlayerId, maxVotes, hasTie };
}

export function checkWinCondition(roomState: RoomState): {
  gameEnded: boolean;
  impostorsWin: boolean;
  reason: string;
} {
  const alivePlayers = roomState.players.filter(p => p.isAlive);
  const aliveImpostors = alivePlayers.filter(p => p.isImpostor);
  const aliveInnocents = alivePlayers.filter(p => !p.isImpostor);
  
  if (aliveImpostors.length === 0) {
    return {
      gameEnded: true,
      impostorsWin: false,
      reason: 'Todos los impostores han sido eliminados'
    };
  }
  
  if (aliveImpostors.length >= aliveInnocents.length) {
    return {
      gameEnded: true,
      impostorsWin: true,
      reason: 'Los impostores son mayoría'
    };
  }
  
  return {
    gameEnded: false,
    impostorsWin: false,
    reason: ''
  };
}

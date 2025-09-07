import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlayerCard } from "@/components/ui/player-card";
import { RoleAssignment } from "@/components/game/role-assignment";
import { Voting } from "@/components/game/voting";
import { Results } from "@/components/game/results";
import { useWebSocket } from "@/hooks/use-websocket";
import { type RoomState, type FootballPlayer } from "@shared/schema";
import { formatTime, checkWinCondition } from "@/lib/game-logic";
import { apiRequest } from "@/lib/queryClient";

interface GameProps {
  roomId: string;
}

type GamePhase = "role_assignment" | "playing" | "voting" | "results" | "finished";

interface GameData {
  isImpostor: boolean;
  footballer?: FootballPlayer;
  hint?: string;
}

export default function Game({ roomId }: GameProps) {
  const [, setLocation] = useLocation();
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>("");
  const [gamePhase, setGamePhase] = useState<GamePhase>("role_assignment");
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [voteCounts, setVoteCounts] = useState<{ [key: string]: number }>({});
  const [hasVoted, setHasVoted] = useState(false);
  const [eliminatedPlayerId, setEliminatedPlayerId] = useState<string>();
  const [gameEnded, setGameEnded] = useState(false);
  const [impostorsWin, setImpostorsWin] = useState(false);
  
  const { sendMessage, addMessageHandler, removeMessageHandler, isConnected } = useWebSocket();

  useEffect(() => {
    const sessionId = localStorage.getItem('sessionId');
    
    if (!sessionId) {
      setLocation('/');
      return;
    }

    // Set up message handlers
    addMessageHandler('role_assigned', (payload) => {
      setGameData({
        isImpostor: payload.isImpostor,
        footballer: payload.footballer,
        hint: payload.hint
      });
      setGamePhase("role_assignment");
    });

    addMessageHandler('game_started', (payload) => {
      setRoomState(payload.roomState);
      const player = payload.roomState.players.find((p: any) => p.player.sessionId === sessionId);
      if (player) {
        setCurrentPlayerId(player.playerId);
      }
    });

    addMessageHandler('voting_started', (payload) => {
      setRoomState(payload.roomState);
      setGamePhase("voting");
      setTimeLeft(payload.roomState.room.voteTime);
      setHasVoted(false);
      setVoteCounts({});
    });

    addMessageHandler('vote_cast', (payload) => {
      setRoomState(payload.roomState);
      // Update vote counts
      const counts: { [key: string]: number } = {};
      payload.roomState.votes?.forEach((vote: any) => {
        if (vote.targetId) {
          counts[vote.targetId] = (counts[vote.targetId] || 0) + 1;
        }
      });
      setVoteCounts(counts);
    });

    addMessageHandler('round_ended', (payload) => {
      setRoomState(payload.roomState);
      setEliminatedPlayerId(payload.eliminatedPlayerId);
      setVoteCounts(payload.voteCounts || {});
      
      const winCondition = checkWinCondition(payload.roomState);
      if (winCondition.gameEnded) {
        setGameEnded(true);
        setImpostorsWin(winCondition.impostorsWin);
        setGamePhase("finished");
      } else {
        setGamePhase("results");
      }
    });

    addMessageHandler('round_started', (payload) => {
      setRoomState(payload.roomState);
      setGamePhase("playing");
      setEliminatedPlayerId(undefined);
      setVoteCounts({});
      setHasVoted(false);
    });

    addMessageHandler('game_ended', (payload) => {
      setRoomState(payload.roomState);
      setGameEnded(true);
      setImpostorsWin(payload.impostorsWin);
      setGamePhase("finished");
    });

    addMessageHandler('error', (payload) => {
      alert(payload.message);
    });

    return () => {
      removeMessageHandler('role_assigned');
      removeMessageHandler('game_started');
      removeMessageHandler('voting_started');
      removeMessageHandler('vote_cast');
      removeMessageHandler('round_ended');
      removeMessageHandler('round_started');
      removeMessageHandler('game_ended');
      removeMessageHandler('error');
    };
  }, [roomId, sendMessage, addMessageHandler, removeMessageHandler, setLocation]);

  // Timer effect for voting
  useEffect(() => {
    if (gamePhase === "voting" && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gamePhase, timeLeft]);

  const handleContinueFromRoleAssignment = () => {
    setGamePhase("playing");
  };

  const handleStartVoting = async () => {
    try {
      await apiRequest('POST', `/api/voting/${roomId}`);
    } catch (error) {
      console.error('Failed to start voting:', error);
    }
  };

  const handleVote = (targetId?: string) => {
    if (hasVoted) return;
    
    setHasVoted(true);
    sendMessage('cast_vote', { roomId, targetId });
  };

  const handleNextRound = () => {
    if (gameEnded) {
      setLocation(`/lobby/${roomId}`);
    } else {
      sendMessage('next_round', { roomId });
    }
  };

  const handleBackToLobby = () => {
    setLocation(`/lobby/${roomId}`);
  };

  if (!roomState || !gameData) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Cargando juego...</p>
        </div>
      </div>
    );
  }

  // Role Assignment Phase
  if (gamePhase === "role_assignment" && gameData.footballer) {
    return (
      <RoleAssignment
        isImpostor={gameData.isImpostor}
        footballer={gameData.footballer}
        hint={gameData.hint}
        onContinue={handleContinueFromRoleAssignment}
      />
    );
  }

  // Voting Phase
  if (gamePhase === "voting") {
    return (
      <Voting
        roomState={roomState}
        currentPlayerId={currentPlayerId}
        timeLeft={timeLeft}
        onVote={handleVote}
        hasVoted={hasVoted}
        voteCounts={voteCounts}
      />
    );
  }

  // Results Phase
  if (gamePhase === "results" || gamePhase === "finished") {
    return (
      <Results
        roomState={roomState}
        eliminatedPlayerId={eliminatedPlayerId}
        voteCounts={voteCounts}
        onNextRound={handleNextRound}
        gameEnded={gameEnded}
        impostorsWin={impostorsWin}
        currentPlayerId={currentPlayerId}
      />
    );
  }

  // Playing Phase
  const alivePlayers = roomState.players.filter(p => p.isAlive);
  const currentPlayer = roomState.players.find(p => p.playerId === currentPlayerId);
  const isHost = currentPlayer?.isHost;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold">Ronda {roomState.room.currentRound}</h2>
              <div className="text-sm text-muted-foreground">
                Futbolista: {gameData.footballer?.name}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span className="text-sm" data-testid="game-status">
                {alivePlayers.length} jugadores vivos • 
                {roomState.players.filter(p => p.isAlive && p.isImpostor).length} impostores
              </span>
            </div>
          </CardContent>
        </Card>
        
        {/* Current Footballer Info */}
        {gameData.footballer && (
          <Card>
            <CardContent className="p-4 text-center">
              <h3 className="font-semibold mb-4">Información del Futbolista</h3>
              
              {gameData.isImpostor ? (
                <div>
                  <p className="text-2xl font-bold text-primary mb-2">
                    {gameData.footballer.name}
                  </p>
                  <p className="text-muted-foreground mb-4">
                    {gameData.footballer.position} • {gameData.footballer.country}
                  </p>
                  {gameData.hint && (
                    <div className="bg-destructive/20 text-destructive rounded-lg p-3">
                      <p className="text-sm font-medium">Tu pista:</p>
                      <p className="font-semibold">"{gameData.hint}"</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {gameData.footballer.imageUrl && (
                    <img 
                      src={gameData.footballer.imageUrl} 
                      alt={gameData.footballer.name}
                      className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-primary"
                    />
                  )}
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {gameData.footballer.name}
                    </p>
                    <p className="text-muted-foreground">
                      {gameData.footballer.position} • {gameData.footballer.country}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Players List */}
        <div className="space-y-3">
          <h3 className="font-semibold">Jugadores</h3>
          
          {alivePlayers.map((roomPlayer, index) => (
            <PlayerCard
              key={roomPlayer.playerId}
              roomPlayer={roomPlayer}
              index={index}
              currentPlayerId={currentPlayerId}
            />
          ))}
        </div>
        
        {/* Action Buttons */}
        <div className="space-y-3">
          {isHost && (
            <Button 
              onClick={handleStartVoting} 
              className="w-full py-4 px-6 text-lg"
              data-testid="start-voting-button"
            >
              <i className="fas fa-vote-yea mr-2" />
              Iniciar Votación
            </Button>
          )}
          
          <Button 
            onClick={handleBackToLobby} 
            variant="outline"
            className="w-full py-3 px-6"
            data-testid="back-to-lobby-button"
          >
            <i className="fas fa-arrow-left mr-2" />
            Volver al Lobby
          </Button>
        </div>
      </div>
    </div>
  );
}

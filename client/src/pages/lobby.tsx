import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlayerCard } from "@/components/ui/player-card";
import { useWebSocket } from "@/hooks/use-websocket";
import { type RoomState } from "@shared/schema";
import { getGameStatus } from "@/lib/game-logic";

interface LobbyProps {
  roomId: string;
}

export default function Lobby({ roomId }: LobbyProps) {
  const [, setLocation] = useLocation();
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>("");
  
  const { sendMessage, addMessageHandler, removeMessageHandler, isConnected } = useWebSocket();

  useEffect(() => {
    const sessionId = localStorage.getItem('sessionId');
    const playerName = localStorage.getItem('playerName');
    
    if (!sessionId || !playerName) {
      setLocation('/');
      return;
    }

    // Set up message handlers
    addMessageHandler('player_joined', (payload) => {
      setRoomState(payload.roomState);
      // Find current player ID
      const player = payload.roomState.players.find((p: any) => p.player.sessionId === sessionId);
      if (player) {
        setCurrentPlayerId(player.playerId);
      }
    });

    addMessageHandler('room_created', (payload) => {
      setRoomState(payload.roomState);
      const player = payload.roomState.players.find((p: any) => p.player.sessionId === sessionId);
      if (player) {
        setCurrentPlayerId(player.playerId);
      }
    });

    addMessageHandler('player_left', (payload) => {
      if (roomState) {
        const updatedPlayers = roomState.players.filter(p => p.playerId !== payload.playerId);
        setRoomState({
          ...roomState,
          players: updatedPlayers
        });
      }
    });

    addMessageHandler('game_started', (payload) => {
      setLocation(`/game/${roomId}`);
    });

    addMessageHandler('error', (payload) => {
      alert(payload.message);
      if (payload.message.includes('not found')) {
        setLocation('/');
      }
    });

    // If coming from create/join page, the connection should already be established
    // Otherwise, try to rejoin
    if (!roomState && isConnected) {
      sendMessage('join_room', {
        playerName,
        roomId,
        sessionId
      });
    }

    return () => {
      removeMessageHandler('player_joined');
      removeMessageHandler('room_created');
      removeMessageHandler('player_left');
      removeMessageHandler('game_started');
      removeMessageHandler('error');
    };
  }, [roomId, isConnected, sendMessage, addMessageHandler, removeMessageHandler, setLocation, roomState]);

  const handleStartGame = () => {
    sendMessage('start_game', { roomId });
  };

  const handleLeaveRoom = () => {
    setLocation('/');
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    // Could add a toast notification here
  };

  if (!roomState) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Conectando a la sala...</p>
        </div>
      </div>
    );
  }

  const isHost = roomState.players.find(p => p.playerId === currentPlayerId)?.isHost;
  const gameStatus = getGameStatus(roomState);

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Sala de Espera</h2>
          <Card>
            <CardContent className="p-4">
              <p className="text-muted-foreground text-sm">Código de Sala</p>
              <p className="text-3xl font-mono font-bold tracking-widest" data-testid="room-code">
                {roomState.room.id}
              </p>
              <button 
                onClick={copyRoomCode}
                className="text-primary text-sm mt-2 hover:underline"
                data-testid="copy-code-button"
              >
                <i className="fas fa-copy mr-1" />
                Copiar código
              </button>
            </CardContent>
          </Card>
        </div>
        
        {/* Players List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              Jugadores ({roomState.players.length}/{roomState.room.maxPlayers})
            </h3>
            <div className="text-sm text-muted-foreground">
              {roomState.room.impostorCount} {roomState.room.impostorCount === 1 ? 'impostor' : 'impostores'}
            </div>
          </div>
          
          <div className="space-y-3">
            {roomState.players.map((roomPlayer, index) => (
              <PlayerCard
                key={roomPlayer.playerId}
                roomPlayer={roomPlayer}
                index={index}
                currentPlayerId={currentPlayerId}
              />
            ))}
            
            {/* Empty Slots */}
            {Array.from({ 
              length: roomState.room.maxPlayers - roomState.players.length 
            }).map((_, index) => (
              <Card key={`empty-${index}`} className="border-2 border-dashed border-border">
                <CardContent className="p-4 text-center text-muted-foreground">
                  <i className="fas fa-plus text-2xl mb-2" />
                  <p>Esperando jugadores...</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Game Settings Summary */}
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold mb-2">Configuración</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Tiempo de votación: {roomState.room.voteTime}s</p>
              <p>Impostores: {roomState.room.impostorCount}</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Action Buttons */}
        <div className="space-y-3">
          {isHost && (
            <Button 
              onClick={handleStartGame} 
              disabled={!gameStatus.canStart}
              className="w-full py-4 px-6 text-lg"
              data-testid="start-game-button"
            >
              <i className="fas fa-play mr-2" />
              {gameStatus.canStart ? 'Iniciar Partida' : gameStatus.message}
            </Button>
          )}
          
          {!isHost && (
            <div className="text-center p-4 bg-muted/20 rounded-lg">
              <p className="text-muted-foreground">
                {gameStatus.canStart 
                  ? "Esperando que el anfitrión inicie la partida..."
                  : gameStatus.message
                }
              </p>
            </div>
          )}
          
          <Button 
            onClick={handleLeaveRoom} 
            variant="destructive"
            className="w-full py-3 px-6"
            data-testid="leave-room-button"
          >
            <i className="fas fa-sign-out-alt mr-2" />
            Salir de la Sala
          </Button>
        </div>
      </div>
    </div>
  );
}

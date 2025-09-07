import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWebSocket } from "@/hooks/use-websocket";
import { generateSessionId } from "@/lib/game-logic";

export default function JoinGame() {
  const [, setLocation] = useLocation();
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const { sendMessage, addMessageHandler, removeMessageHandler } = useWebSocket();

  const handleJoinRoom = () => {
    if (!playerName.trim() || !roomCode.trim()) return;

    setIsJoining(true);
    
    const sessionId = localStorage.getItem('sessionId') || generateSessionId();
    localStorage.setItem('sessionId', sessionId);
    localStorage.setItem('playerName', playerName);

    // Add handler for player joined response
    addMessageHandler('player_joined', (payload) => {
      setIsJoining(false);
      setLocation(`/lobby/${roomCode.toUpperCase()}`);
    });

    addMessageHandler('error', (payload) => {
      setIsJoining(false);
      alert(payload.message);
    });

    sendMessage('join_room', {
      playerName: playerName.trim(),
      roomId: roomCode.toUpperCase(),
      sessionId
    });
  };

  const handleQuickJoin = () => {
    // For now, just show a message - could implement finding available rooms
    alert("Función de partida rápida no disponible aún");
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button 
            onClick={() => setLocation("/")} 
            className="text-muted-foreground hover:text-foreground"
            data-testid="back-button"
          >
            <i className="fas fa-arrow-left text-xl" />
          </button>
          <h2 className="text-2xl font-bold">Unirse a Partida</h2>
        </div>
        
        {/* Player Name */}
        <div className="space-y-2">
          <Label htmlFor="playerName" className="text-sm font-medium text-muted-foreground">
            Tu Nombre
          </Label>
          <Input
            id="playerName"
            type="text"
            placeholder="Ingresa tu nombre"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            data-testid="input-player-name"
          />
        </div>
        
        {/* Room Code */}
        <div className="space-y-2">
          <Label htmlFor="roomCode" className="text-sm font-medium text-muted-foreground">
            Código de Sala
          </Label>
          <Input
            id="roomCode"
            type="text"
            placeholder="Ejemplo: ABC123"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            className="text-center text-2xl font-mono uppercase tracking-widest"
            maxLength={6}
            data-testid="input-room-code"
          />
        </div>
        
        {/* Join Button */}
        <Button 
          onClick={handleJoinRoom} 
          disabled={!playerName.trim() || !roomCode.trim() || isJoining}
          className="w-full py-4 px-6 text-lg"
          data-testid="button-join-room"
        >
          <i className="fas fa-sign-in-alt mr-2" />
          {isJoining ? 'Uniéndose...' : 'Unirse'}
        </Button>
        
        {/* Quick Join */}
        <div className="text-center">
          <p className="text-muted-foreground mb-4">O únete a una partida rápida</p>
          <Button 
            variant="secondary" 
            onClick={handleQuickJoin}
            className="py-3 px-6"
            data-testid="button-quick-join"
          >
            <i className="fas fa-random mr-2" />
            Partida Rápida
          </Button>
        </div>
      </div>
    </div>
  );
}

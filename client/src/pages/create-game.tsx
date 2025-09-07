import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useWebSocket } from "@/hooks/use-websocket";
import { generateSessionId } from "@/lib/game-logic";

export default function CreateGame() {
  const [, setLocation] = useLocation();
  const [playerName, setPlayerName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [impostorCount, setImpostorCount] = useState(1);
  const [voteTime, setVoteTime] = useState(60);
  const [isCreating, setIsCreating] = useState(false);

  const { sendMessage, addMessageHandler, removeMessageHandler } = useWebSocket();

  const handleCreateRoom = () => {
    if (!playerName.trim()) return;

    setIsCreating(true);
    
    const sessionId = localStorage.getItem('sessionId') || generateSessionId();
    localStorage.setItem('sessionId', sessionId);
    localStorage.setItem('playerName', playerName);

    // Add handler for room created response
    addMessageHandler('room_created', (payload) => {
      setIsCreating(false);
      setLocation(`/lobby/${payload.roomState.room.id}`);
    });

    addMessageHandler('error', (payload) => {
      setIsCreating(false);
      alert(payload.message);
    });

    sendMessage('create_room', {
      playerName: playerName.trim(),
      maxPlayers,
      impostorCount,
      voteTime,
      sessionId
    });
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
          <h2 className="text-2xl font-bold">Crear Partida</h2>
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
        
        {/* Game Settings */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <h3 className="font-semibold text-lg">Configuración</h3>
            
            {/* Number of Players */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-muted-foreground">
                Número de Jugadores
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {[3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <Button
                    key={num}
                    variant={maxPlayers === num ? "default" : "secondary"}
                    className="py-2 font-medium"
                    onClick={() => setMaxPlayers(num)}
                    data-testid={`max-players-${num}`}
                  >
                    {num}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Number of Impostors */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-muted-foreground">
                Número de Impostores
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].filter(num => num <= Math.floor(maxPlayers / 2)).map((num) => (
                  <Button
                    key={num}
                    variant={impostorCount === num ? "destructive" : "secondary"}
                    className="py-2 font-medium"
                    onClick={() => setImpostorCount(num)}
                    data-testid={`impostor-count-${num}`}
                  >
                    {num}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Vote Time */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-muted-foreground">
                Tiempo de Votación
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {[30, 60, 90].map((seconds) => (
                  <Button
                    key={seconds}
                    variant={voteTime === seconds ? "default" : "secondary"}
                    className="py-2 font-medium"
                    onClick={() => setVoteTime(seconds)}
                    data-testid={`vote-time-${seconds}`}
                  >
                    {seconds}s
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Create Button */}
        <Button 
          onClick={handleCreateRoom} 
          disabled={!playerName.trim() || isCreating}
          className="w-full py-4 px-6 text-lg"
          data-testid="button-create-room"
        >
          <i className="fas fa-rocket mr-2" />
          {isCreating ? 'Creando...' : 'Crear Partida'}
        </Button>
      </div>
    </div>
  );
}

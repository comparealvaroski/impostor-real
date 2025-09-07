import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlayerCard } from "@/components/ui/player-card";
import { type RoomState } from "@shared/schema";
import { formatTime } from "@/lib/game-logic";

interface VotingProps {
  roomState: RoomState;
  currentPlayerId: string;
  timeLeft: number;
  onVote: (targetId?: string) => void;
  hasVoted: boolean;
  voteCounts: { [key: string]: number };
}

export function Voting({ 
  roomState, 
  currentPlayerId, 
  timeLeft, 
  onVote, 
  hasVoted,
  voteCounts 
}: VotingProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | undefined>();
  
  const alivePlayers = roomState.players.filter(p => p.isAlive && p.playerId !== currentPlayerId);
  const totalVotes = Object.values(voteCounts).reduce((sum, count) => sum + count, 0);
  const totalPlayers = roomState.players.filter(p => p.isAlive).length;

  const handleVote = () => {
    onVote(selectedPlayerId);
    setSelectedPlayerId(undefined);
  };

  const handleSkipVote = () => {
    onVote();
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="bg-destructive/20 border border-destructive rounded-lg p-4 text-center">
          <h2 className="text-xl font-bold text-destructive" data-testid="voting-title">
            Votación en Curso
          </h2>
          <p className="text-sm text-muted-foreground mt-1" data-testid="time-left">
            Tiempo restante: {formatTime(timeLeft)}
          </p>
        </div>
        
        {/* Voting Question */}
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-muted-foreground mb-2">¿Quién crees que es el impostor?</p>
            <p className="text-sm text-muted-foreground">Vota por el jugador más sospechoso</p>
          </CardContent>
        </Card>
        
        {/* Voting Options */}
        <div className="space-y-3">
          <h3 className="font-semibold">Votar por:</h3>
          
          {alivePlayers.map((roomPlayer, index) => (
            <PlayerCard
              key={roomPlayer.playerId}
              roomPlayer={roomPlayer}
              index={index}
              onClick={() => !hasVoted && setSelectedPlayerId(roomPlayer.playerId)}
              voteCount={voteCounts[roomPlayer.playerId] || 0}
              isSelected={selectedPlayerId === roomPlayer.playerId}
              className={hasVoted ? 'cursor-not-allowed opacity-75' : ''}
            />
          ))}
          
          {/* Vote Actions */}
          <div className="space-y-3 pt-4">
            {!hasVoted && (
              <>
                <Button
                  onClick={handleVote}
                  disabled={!selectedPlayerId}
                  className="w-full py-4 px-6 text-lg"
                  data-testid="vote-button"
                >
                  <i className="fas fa-vote-yea mr-2" />
                  Votar {selectedPlayerId && `por ${roomState.players.find(p => p.playerId === selectedPlayerId)?.player.name}`}
                </Button>
                
                <Button
                  onClick={handleSkipVote}
                  variant="secondary"
                  className="w-full py-4 px-6"
                  data-testid="skip-vote-button"
                >
                  <i className="fas fa-forward mr-2" />
                  Saltar Votación
                </Button>
              </>
            )}
            
            {hasVoted && (
              <div className="text-center p-4 bg-primary/20 rounded-lg">
                <p className="font-medium text-primary">Has votado</p>
                <p className="text-sm text-muted-foreground">Esperando a otros jugadores...</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Vote Status */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Votos emitidos:</span>
              <span className="text-sm text-muted-foreground" data-testid="vote-progress">
                {totalVotes}/{totalPlayers}
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(totalVotes / totalPlayers) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

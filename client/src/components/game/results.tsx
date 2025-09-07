import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlayerCard } from "@/components/ui/player-card";
import { type RoomState } from "@shared/schema";

interface ResultsProps {
  roomState: RoomState;
  eliminatedPlayerId?: string;
  voteCounts: { [key: string]: number };
  onNextRound: () => void;
  gameEnded?: boolean;
  impostorsWin?: boolean;
  currentPlayerId: string;
}

export function Results({ 
  roomState, 
  eliminatedPlayerId, 
  voteCounts, 
  onNextRound, 
  gameEnded = false,
  impostorsWin = false,
  currentPlayerId 
}: ResultsProps) {
  const eliminatedPlayer = eliminatedPlayerId 
    ? roomState.players.find(p => p.playerId === eliminatedPlayerId)
    : null;

  const alivePlayers = roomState.players.filter(p => p.isAlive);
  const aliveImpostors = alivePlayers.filter(p => p.isImpostor);
  const aliveInnocents = alivePlayers.filter(p => !p.isImpostor);

  const impostors = roomState.players.filter(p => p.isImpostor);
  const innocents = roomState.players.filter(p => !p.isImpostor);

  if (gameEnded) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-md mx-auto space-y-6">
          {/* Game Over Header */}
          <div className="text-center space-y-4">
            <div className={`w-24 h-24 mx-auto ${impostorsWin ? 'bg-destructive' : 'bg-primary'} rounded-full flex items-center justify-center`}>
              <i className={`fas ${impostorsWin ? 'fa-mask' : 'fa-shield-alt'} text-${impostorsWin ? 'destructive' : 'primary'}-foreground text-4xl`} />
            </div>
            <h2 className={`text-3xl font-bold ${impostorsWin ? 'text-destructive' : 'text-primary'}`} data-testid="game-result">
              {impostorsWin ? '¡Impostores Ganan!' : '¡Jugadores Ganan!'}
            </h2>
            <p className="text-lg text-muted-foreground">
              {impostorsWin 
                ? 'Los impostores han engañado a todos' 
                : 'Los impostores han sido descubiertos'
              }
            </p>
          </div>
          
          {/* Final Player List */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-lg text-center">Resultados Finales</h3>
              
              {/* Impostors */}
              <div className="space-y-3">
                <h4 className="text-destructive font-semibold">Impostores:</h4>
                {impostors.map((roomPlayer, index) => (
                  <PlayerCard
                    key={roomPlayer.playerId}
                    roomPlayer={roomPlayer}
                    index={index}
                    currentPlayerId={currentPlayerId}
                    showRole={true}
                    className="bg-destructive/20"
                  />
                ))}
              </div>
              
              {/* Innocent Players */}
              <div className="space-y-3">
                <h4 className="text-primary font-semibold">Jugadores Inocentes:</h4>
                {innocents.map((roomPlayer, index) => (
                  <PlayerCard
                    key={roomPlayer.playerId}
                    roomPlayer={roomPlayer}
                    index={index + impostors.length}
                    currentPlayerId={currentPlayerId}
                    showRole={true}
                    className="bg-secondary"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={onNextRound} 
              className="w-full py-4 px-6 text-lg"
              data-testid="play-again-button"
            >
              <i className="fas fa-redo mr-2" />
              Jugar de Nuevo
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center space-y-8">
        {/* Result Header */}
        <div className="space-y-4">
          {eliminatedPlayer ? (
            <>
              <div className="w-24 h-24 mx-auto bg-destructive rounded-full flex items-center justify-center">
                <i className="fas fa-times text-destructive-foreground text-4xl" />
              </div>
              <h2 className="text-3xl font-bold text-destructive" data-testid="elimination-result">
                ¡{eliminatedPlayer.player.name} Eliminado!
              </h2>
              <p className="text-lg text-muted-foreground">
                {eliminatedPlayer.player.name} era {eliminatedPlayer.isImpostor ? 'IMPOSTOR' : 'JUGADOR INOCENTE'}
              </p>
            </>
          ) : (
            <>
              <div className="w-24 h-24 mx-auto bg-secondary rounded-full flex items-center justify-center">
                <i className="fas fa-equals text-secondary-foreground text-4xl" />
              </div>
              <h2 className="text-3xl font-bold text-muted-foreground">¡Empate!</h2>
              <p className="text-lg text-muted-foreground">No se eliminó a nadie esta ronda</p>
            </>
          )}
        </div>
        
        {/* Voting Results */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-lg">Resultados de la Votación</h3>
            <div className="space-y-2">
              {Object.entries(voteCounts)
                .filter(([_, count]) => count > 0)
                .sort(([_, a], [__, b]) => b - a)
                .map(([playerId, count]) => {
                  const player = roomState.players.find(p => p.playerId === playerId);
                  return (
                    <div key={playerId} className="flex items-center justify-between">
                      <span>{player?.player.name}</span>
                      <span className={count === Math.max(...Object.values(voteCounts)) ? 'text-destructive font-semibold' : 'text-muted-foreground'}>
                        {count} {count === 1 ? 'voto' : 'votos'}
                      </span>
                    </div>
                  );
                })}
              {Object.values(voteCounts).every(count => count === 0) && (
                <p className="text-muted-foreground text-center">No se emitieron votos</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Game Status */}
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground mb-2">Estado del juego:</p>
            <p className="font-semibold" data-testid="game-status">
              {alivePlayers.length} jugadores restantes • {aliveImpostors.length} impostores
            </p>
            {aliveImpostors.length >= aliveInnocents.length && (
              <div className="mt-4 p-3 bg-destructive/20 rounded-lg">
                <p className="text-destructive font-semibold">¡Los impostores pueden ganar!</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Button 
          onClick={onNextRound} 
          className="w-full py-4 px-6 text-lg"
          data-testid="next-round-button"
        >
          <i className="fas fa-play mr-2" />
          Siguiente Ronda
        </Button>
      </div>
    </div>
  );
}

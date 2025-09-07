import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { calculateWinRate } from "@/lib/game-logic";
import { type GameStats } from "@shared/schema";

export default function Stats() {
  const [, setLocation] = useLocation();
  const [currentPlayerId, setCurrentPlayerId] = useState<string>("");

  useEffect(() => {
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      setLocation('/');
      return;
    }
    
    // For now, we'll use the session ID as player ID for stats
    // In a real implementation, you'd map session to player ID
    setCurrentPlayerId(sessionId);
  }, [setLocation]);

  const { data: stats, isLoading } = useQuery<GameStats>({
    queryKey: ['/api/stats', currentPlayerId],
    enabled: !!currentPlayerId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  const gameStats = stats || {
    gamesPlayed: 0,
    gamesWon: 0,
    impostorGames: 0,
    impostorWins: 0
  };

  const totalWinRate = calculateWinRate(gameStats.gamesWon, gameStats.gamesPlayed);
  const impostorWinRate = calculateWinRate(gameStats.impostorWins, gameStats.impostorGames);
  const playerGames = gameStats.gamesPlayed - gameStats.impostorGames;
  const playerWins = gameStats.gamesWon - gameStats.impostorWins;
  const playerWinRate = calculateWinRate(playerWins, playerGames);

  // Mock recent games data - in a real app this would come from the backend
  const recentGames = [
    { role: 'impostor', result: 'win', time: '2h', opponents: 5 },
    { role: 'player', result: 'loss', time: '5h', opponents: 2 },
    { role: 'player', result: 'win', time: '1d', opponents: 1 }
  ];

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
          <h2 className="text-2xl font-bold">Estadísticas</h2>
        </div>
        
        {/* Overall Stats */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-lg">Estadísticas Generales</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary" data-testid="games-played">
                  {gameStats.gamesPlayed}
                </p>
                <p className="text-sm text-muted-foreground">Partidas Jugadas</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary" data-testid="games-won">
                  {gameStats.gamesWon}
                </p>
                <p className="text-sm text-muted-foreground">Victorias Totales</p>
              </div>
            </div>
            <div className="text-center pt-2">
              <p className="text-2xl font-bold text-primary" data-testid="total-win-rate">
                {totalWinRate}%
              </p>
              <p className="text-sm text-muted-foreground">Tasa de Victoria</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Role Stats */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-lg">Por Rol</h3>
            
            {/* Impostor Stats */}
            <div className="bg-destructive/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-destructive">Como Impostor</h4>
                <i className="fas fa-mask text-destructive" />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-destructive" data-testid="impostor-games">
                    {gameStats.impostorGames}
                  </p>
                  <p className="text-xs text-muted-foreground">Partidas</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-destructive" data-testid="impostor-wins">
                    {gameStats.impostorWins}
                  </p>
                  <p className="text-xs text-muted-foreground">Victorias</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-destructive" data-testid="impostor-win-rate">
                    {impostorWinRate}%
                  </p>
                  <p className="text-xs text-muted-foreground">Éxito</p>
                </div>
              </div>
            </div>
            
            {/* Player Stats */}
            <div className="bg-primary/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-primary">Como Jugador</h4>
                <i className="fas fa-shield-alt text-primary" />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-primary" data-testid="player-games">
                    {playerGames}
                  </p>
                  <p className="text-xs text-muted-foreground">Partidas</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-primary" data-testid="player-wins">
                    {playerWins}
                  </p>
                  <p className="text-xs text-muted-foreground">Victorias</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-primary" data-testid="player-win-rate">
                    {playerWinRate}%
                  </p>
                  <p className="text-xs text-muted-foreground">Éxito</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Games */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-lg">Partidas Recientes</h3>
            {gameStats.gamesPlayed === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-gamepad text-4xl text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aún no has jugado ninguna partida</p>
                <Button 
                  onClick={() => setLocation('/')}
                  className="mt-4"
                  data-testid="start-playing-button"
                >
                  <i className="fas fa-play mr-2" />
                  Comenzar a Jugar
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentGames.slice(0, Math.min(3, gameStats.gamesPlayed)).map((game, index) => (
                  <div 
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      game.result === 'win' ? 'bg-primary/20' : 'bg-secondary/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <i className={`fas ${game.role === 'impostor' ? 'fa-mask text-destructive' : 'fa-shield-alt text-primary'}`} />
                      <div>
                        <p className="text-sm font-medium capitalize">{game.role}</p>
                        <p className="text-xs text-muted-foreground">
                          vs. {game.opponents} {game.role === 'impostor' ? 'jugadores' : 'impostores'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${
                        game.result === 'win' ? 'text-primary' : 'text-destructive'
                      }`}>
                        {game.result === 'win' ? 'Victoria' : 'Derrota'}
                      </p>
                      <p className="text-xs text-muted-foreground">Hace {game.time}</p>
                    </div>
                  </div>
                ))}
                
                {gameStats.gamesPlayed > 3 && (
                  <div className="text-center pt-2">
                    <p className="text-sm text-muted-foreground">
                      Y {gameStats.gamesPlayed - 3} partidas más...
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

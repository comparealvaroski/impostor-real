import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [, setLocation] = useLocation();
  const [onlineCount] = useState(1247); // Mock online count

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 football-bg">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-primary rounded-full flex items-center justify-center">
            <i className="fas fa-futbol text-primary-foreground text-3xl" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">Fútbol Impostor</h1>
          <p className="text-muted-foreground text-lg">¿Podrás descubrir al impostor?</p>
        </div>
        
        {/* Main Actions */}
        <div className="space-y-4">
          <Button 
            onClick={() => setLocation("/create-game")} 
            className="w-full py-4 px-6 text-lg"
            data-testid="create-game-button"
          >
            <i className="fas fa-plus mr-2" />
            Crear Partida
          </Button>
          
          <Button 
            onClick={() => setLocation("/join-game")} 
            variant="secondary"
            className="w-full py-4 px-6 text-lg"
            data-testid="join-game-button"
          >
            <i className="fas fa-sign-in-alt mr-2" />
            Unirse a Partida
          </Button>
          
          <Button 
            onClick={() => setLocation("/stats")} 
            variant="outline"
            className="w-full py-4 px-6 text-lg"
            data-testid="stats-button"
          >
            <i className="fas fa-chart-bar mr-2" />
            Estadísticas
          </Button>
        </div>
        
        {/* Online Status */}
        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-primary rounded-full pulse-green" />
          <span data-testid="online-count">{onlineCount.toLocaleString()} jugadores online</span>
        </div>
      </div>
    </div>
  );
}

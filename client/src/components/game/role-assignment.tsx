import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { type FootballPlayer } from "@shared/schema";

interface RoleAssignmentProps {
  isImpostor: boolean;
  footballer: FootballPlayer;
  hint?: string;
  onContinue: () => void;
}

export function RoleAssignment({ isImpostor, footballer, hint, onContinue }: RoleAssignmentProps) {
  return (
    <div className="min-h-screen p-4 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center space-y-8">
        <div className="space-y-4">
          <div className={`w-24 h-24 mx-auto ${isImpostor ? 'bg-destructive' : 'bg-primary'} rounded-full flex items-center justify-center animate-pulse`}>
            <i className={`fas ${isImpostor ? 'fa-mask' : 'fa-shield-alt'} text-${isImpostor ? 'destructive' : 'primary'}-foreground text-4xl`} />
          </div>
          <h2 className={`text-3xl font-bold ${isImpostor ? 'text-destructive' : 'text-primary'}`}>
            {isImpostor ? '¡Eres IMPOSTOR!' : 'Eres JUGADOR'}
          </h2>
          <p className="text-lg text-muted-foreground">
            {isImpostor ? 'Tu misión es engañar a los demás jugadores' : 'Encuentra a los impostores'}
          </p>
        </div>
        
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-lg">El futbolista de esta ronda:</h3>
            <div className="text-center space-y-4">
              {!isImpostor && footballer.imageUrl && (
                <img 
                  src={footballer.imageUrl} 
                  alt={footballer.name}
                  className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-primary"
                  data-testid="footballer-image"
                />
              )}
              <div>
                <p className="text-2xl font-bold text-primary" data-testid="footballer-name">
                  {footballer.name}
                </p>
                <p className="text-muted-foreground">
                  {footballer.position} • {footballer.country}
                </p>
              </div>
              
              {isImpostor && hint && (
                <div>
                  <p className="text-muted-foreground">Tu pista:</p>
                  <p className="text-lg font-medium bg-destructive/20 text-destructive rounded-lg p-3 mt-2" data-testid="impostor-hint">
                    "{hint}"
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {isImpostor 
              ? "Los otros jugadores pueden ver su imagen y nombre"
              : "Los impostores solo tienen una pista"
            }
          </p>
          <p className="text-sm text-muted-foreground">
            {isImpostor 
              ? "¡Usa tu pista sabiamente!"
              : "¡Descubre quién no sabe quién es!"
            }
          </p>
        </div>
        
        <Button 
          onClick={onContinue} 
          className="w-full py-4 px-6 text-lg"
          data-testid="continue-button"
        >
          <i className={`fas ${isImpostor ? 'fa-eye' : 'fa-search'} mr-2`} />
          Entendido
        </Button>
      </div>
    </div>
  );
}

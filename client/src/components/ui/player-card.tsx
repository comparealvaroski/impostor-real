import { type RoomPlayer, type Player } from "@shared/schema";
import { getPlayerColor, getPlayerInitial } from "@/lib/game-logic";

interface PlayerCardProps {
  roomPlayer: RoomPlayer & { player: Player };
  index: number;
  currentPlayerId?: string;
  showRole?: boolean;
  onClick?: () => void;
  voteCount?: number;
  isSelected?: boolean;
  className?: string;
}

export function PlayerCard({ 
  roomPlayer, 
  index, 
  currentPlayerId, 
  showRole = false,
  onClick,
  voteCount,
  isSelected = false,
  className = ""
}: PlayerCardProps) {
  const isCurrentPlayer = roomPlayer.playerId === currentPlayerId;
  const color = getPlayerColor(index);
  const initial = getPlayerInitial(roomPlayer.player.name);
  
  return (
    <div 
      className={`
        player-card bg-card rounded-lg p-4 flex items-center space-x-3 
        ${onClick ? 'cursor-pointer hover:bg-primary/20 transition-colors' : ''} 
        ${isSelected ? 'border-2 border-primary bg-primary/20' : ''} 
        ${!roomPlayer.isAlive ? 'opacity-50' : ''} 
        ${className}
      `}
      onClick={onClick}
      data-testid={`player-card-${roomPlayer.playerId}`}
    >
      <div className={`w-10 h-10 ${color} rounded-full flex items-center justify-center`}>
        <span className="text-white font-semibold text-sm">{initial}</span>
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">
            {roomPlayer.player.name} 
            {isCurrentPlayer && " (Tú)"}
          </p>
          {roomPlayer.isHost && (
            <i className="fas fa-crown text-yellow-500 text-sm" />
          )}
          {!roomPlayer.isAlive && (
            <span className="text-destructive text-xs">Eliminado</span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {roomPlayer.isHost ? (
            <p className="text-sm text-primary">Anfitrión</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {roomPlayer.isAlive ? "Conectado" : "Eliminado"}
            </p>
          )}
          
          {showRole && (
            <span className={`text-xs px-2 py-1 rounded ${
              roomPlayer.isImpostor 
                ? 'bg-destructive text-destructive-foreground' 
                : 'bg-primary text-primary-foreground'
            }`}>
              {roomPlayer.isImpostor ? 'Impostor' : 'Jugador'}
            </span>
          )}
        </div>
        
        {voteCount !== undefined && (
          <p className="text-sm text-muted-foreground">
            {voteCount} {voteCount === 1 ? 'voto' : 'votos'}
          </p>
        )}
      </div>
      
      {roomPlayer.isAlive && !voteCount && (
        <div className="w-3 h-3 bg-primary rounded-full pulse-green" />
      )}
      
      {voteCount !== undefined && voteCount > 0 && (
        <div className="flex space-x-1">
          {Array.from({ length: Math.min(voteCount, 5) }).map((_, i) => (
            <div key={i} className="w-2 h-2 bg-destructive rounded-full" />
          ))}
          {voteCount > 5 && (
            <span className="text-xs text-destructive font-bold">+{voteCount - 5}</span>
          )}
        </div>
      )}
    </div>
  );
}

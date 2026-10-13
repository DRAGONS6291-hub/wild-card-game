'use client';
import { Button } from "@/components/ui/button";
import { Trophy } from 'lucide-react';
import React, { useEffect } from 'react';
import { useSound } from '@/hooks/useSound';

interface GameOverDisplayProps { 
  winner: string | { name: string }; 
  onPlayAgain: () => void; 
}

const ConfettiPiece = ({ id, style }: { id: number; style: React.CSSProperties }) => (
  <div key={id} className="absolute w-2 h-4 rounded-full" style={style}></div>
);

export function GameOverDisplay({ winner, onPlayAgain }: GameOverDisplayProps) {
  const { playVictory, playDefeat } = useSound();

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).showMonetagAd) {
      (window as any).showMonetagAd();
    }

    let winnerName = '';
    if (typeof winner === 'string') winnerName = winner;
    else if (winner && typeof winner === 'object' && 'name' in winner) winnerName = winner.name;
    
    if (winnerName === 'player') {
      playVictory();
    } else {
      playDefeat();
    }
  }, [winner, playVictory, playDefeat]);

  let winnerName = '';
  if (typeof winner === 'string') winnerName = winner;
  else if (winner && typeof winner === 'object' && 'name' in winner) winnerName = winner.name;
  const message = winnerName === 'player' ? 'Félicitations, vous avez gagné !' : `${winnerName} a gagné la partie !`;
  
  const confetti = Array.from({ length: 100 }).map((_, i) => {
    const style: React.CSSProperties = { 
      left: `${Math.random() * 100}%`, 
      animation: `fall ${Math.random() * 3 + 2}s linear ${Math.random() * 2}s infinite`, 
      backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`, 
      opacity: Math.random() * 0.5 + 0.5, 
      transform: `rotate(${Math.random() * 360}deg)` 
    };
    return <ConfettiPiece key={i} id={i} style={style} />;
  });

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 animate-in fade-in-50">
      <style>{`@keyframes fall { 0% { transform: translateY(-10vh) rotate(0deg); } 100% { transform: translateY(110vh) rotate(720deg); } }`}</style>
      {confetti}
      <div className="bg-background p-8 rounded-lg shadow-2xl text-center z-10 max-w-md">
        <Trophy className="w-16 h-16 mx-auto text-yellow-400 mb-4" />
        <h2 className="text-4xl font-bold mb-4">{message}</h2>
        
        <div className="my-6 p-4 bg-gray-100 rounded border-2 border-dashed border-gray-300">
          <p className="text-sm text-gray-500 mb-2">Publicité</p>
          <div id="monetag-banner"></div>
        </div>

        <Button onClick={onPlayAgain} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
          Rejouer
        </Button>
      </div>
    </div>
  );
}
'use client';
import { Button } from "@/components/ui/button";
import { Trophy, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useSound } from '@/hooks/useSound';
import { BannerAd } from '@/components/ads/BannerAd';

interface GameOverDisplayProps { 
  winner: string | { name: string }; 
  onPlayAgain: () => void; 
}

const ConfettiPiece = ({ id, style }: { id: number; style: React.CSSProperties }) => (
  <div key={id} className="absolute w-2 h-4 rounded-full" style={style}></div>
);

export function GameOverDisplay({ winner, onPlayAgain }: GameOverDisplayProps) {
  const { playVictory, playDefeat } = useSound();
  const [isAdLoading, setIsAdLoading] = useState(false);

  useEffect(() => {
    let winnerName = '';
    if (typeof winner === 'string') winnerName = winner;
    else if (winner && typeof winner === 'object' && 'name' in winner) winnerName = winner.name;
    
    if (winnerName === 'player') {
      playVictory();
    } else {
      playDefeat();
    }
  }, [winner, playVictory, playDefeat]);

  // 🎯 Fonction personnalisée pour le bouton Rejouer
  const handlePlayAgain = () => {
    setIsAdLoading(true);
    
    // 1. Injecter le script de la Vignette (Format 1) au moment précis du clic
    const script = document.createElement('script');
    script.dataset.zone = '12026343';
    script.src = 'https://n6wxm.com/vignette.min.js';
    document.body.appendChild(script);

    // 2. Attendre 5 secondes pour laisser la pub s'afficher, puis lancer la partie
    setTimeout(() => {
      onPlayAgain();
      setIsAdLoading(false);
      
      // 3. Nettoyer le script pour éviter les conflits ou doublons au prochain clic
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    }, 5000);
  };

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
      <div className="bg-white p-8 rounded-2xl shadow-2xl text-center z-10 max-w-md border-4 border-yellow-400 w-[90%]">
        <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
        <h2 className="text-3xl font-black mb-4 text-gray-800">{message}</h2>
        
        {/* 🎯 Format 2 : Bannière discrète (In-Page Push / Tag) */}
        <div className="my-6 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden">
          <p className="text-xs text-gray-400 mb-2 font-bold uppercase tracking-wider">Publicité</p>
          <BannerAd />
        </div>

        <Button 
          onClick={handlePlayAgain} 
          disabled={isAdLoading}
          size="lg" 
          className="bg-gradient-to-b from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-black border-b-4 border-yellow-800 shadow-lg w-full py-6 text-lg flex items-center justify-center gap-2"
        >
          {isAdLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Chargement de la partie...
            </>
          ) : (
            'Rejouer'
          )}
        </Button>
      </div>
    </div>
  );
}
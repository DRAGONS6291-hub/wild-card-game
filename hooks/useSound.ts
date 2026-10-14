'use client';
import { useCallback, useEffect, useRef } from 'react';

// Chemins des fichiers audio
const SOUNDS = {
  card: '/sounds/card.mp3',
  victory: '/sounds/victory.mp3',
  defeat: '/sounds/defeat.mp3',
  menuClick: '/sounds/menu-click.mp3',
};

export function useSound() {
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  // Précharger les sons au montage du composant
  useEffect(() => {
    Object.entries(SOUNDS).forEach(([key, src]) => {
      const audio = new Audio(src);
      audio.preload = 'auto';
      audio.volume = 0.5;
      audioRefs.current[key] = audio;
    });
  }, []);

  const playSound = useCallback((soundKey: string) => {
    const audio = audioRefs.current[soundKey];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Ignorer les erreurs si l'utilisateur n'a pas encore interagi
      });
    }
  }, []);

  const playCard = useCallback(() => playSound('card'), [playSound]);
  const playVictory = useCallback(() => playSound('victory'), [playSound]);
  const playDefeat = useCallback(() => playSound('defeat'), [playSound]);
  const playMenuClick = useCallback(() => playSound('menuClick'), [playSound]);

  return { 
    playCard, 
    playVictory, 
    playDefeat, 
    playMenuClick,
  };
}
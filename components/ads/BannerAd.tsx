'use client';
import { useEffect, useState } from 'react';

export function BannerAd() {
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (hasLoaded) return;
    
    // 🎯 Format 2 : Tag / Bannière
    const script = document.createElement('script');
    script.dataset.zone = '12026344';
    script.src = 'https://nap5k.com/tag.min.js';
    script.async = true;
    
    // On l'ajoute au body (comme le demande le script Monetag)
    document.body.appendChild(script);
    setHasLoaded(true);
  }, [hasLoaded]);

  // Ce composant est invisible, il sert juste à charger le script de manière contrôlée
  return null; 
}
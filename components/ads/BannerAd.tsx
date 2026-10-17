'use client';

import { useEffect, useRef } from 'react';

interface BannerAdProps {
  zoneId: string;
  width?: string;
  height?: string;
}

export function BannerAd({ zoneId, width = '300px', height = '250px' }: BannerAdProps) {
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    // On reproduit exactement la logique du script Monetag fourni
    const script = document.createElement('script');
    script.dataset.zone = zoneId;
    script.src = 'https://nap5k.com/tag.min.js'; // URL du format In-Page Push
    
    script.onerror = () => {
      console.warn('Publicité bloquée (Adblocker ou problème réseau)');
    };

    // Le script Monetag s'attache au body ou au documentElement
    const target = document.body || document.documentElement;
    target.appendChild(script);

    // Nettoyage quand on quitte l'écran pour éviter les fuites de mémoire
    return () => {
      if (target.contains(script)) {
        target.removeChild(script);
      }
      hasLoaded.current = false;
    };
  }, [zoneId]);

  return (
    <div 
      className="flex flex-col items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
      style={{ width: width, minHeight: height, minWidth: width }}
    >
      <span className="text-gray-400 text-xs font-bold uppercase mb-1">Publicité</span>
      <span className="text-gray-400 text-[10px] text-center px-2">
        (Le format In-Page Push peut s'afficher légèrement en dehors de ce cadre)
      </span>
    </div>
  );
}
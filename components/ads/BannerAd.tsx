'use client';

import { useEffect, useRef } from 'react';

interface BannerAdProps {
  zoneId: string;
  width?: string;
  height?: string;
}

export function BannerAd({ zoneId, width = '300px', height = '250px' }: BannerAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (!containerRef.current || scriptLoaded.current) return;

    scriptLoaded.current = true;
    const container = containerRef.current;

    // Vider le conteneur
    container.innerHTML = '';

    // Créer le script Monetag
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `https://syndication.exdynsrv.com/splash.php?idzone=${zoneId}`;
    script.async = true;
    
    // Gestion des erreurs
    script.onerror = () => {
      console.error(`❌ Erreur chargement pub Monetag zone ${zoneId}`);
      container.innerHTML = '<p class="text-gray-400 text-xs">Pub indisponible</p>';
    };

    container.appendChild(script);

    return () => {
      if (container) {
        container.innerHTML = '';
      }
      scriptLoaded.current = false;
    };
  }, [zoneId]);

  return (
    <div 
      ref={containerRef}
      className="flex items-center justify-center bg-gray-100 rounded-lg border border-gray-300"
      style={{ 
        width: width, 
        minHeight: height,
        minWidth: width 
      }}
    >
      <span className="text-gray-400 text-xs select-none">Chargement...</span>
    </div>
  );
}
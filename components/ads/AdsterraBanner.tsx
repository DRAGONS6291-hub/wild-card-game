'use client';

import { useEffect, useRef } from 'react';

interface AdsterraBannerProps {
  type: 'banner300x250' | 'banner728x90' | 'native';
}

export function AdsterraBanner({ type }: AdsterraBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current || !containerRef.current) return;
    hasLoaded.current = true;

    const container = containerRef.current;
    container.innerHTML = '';

    // Configuration selon le type
    const configs = {
      banner300x250: {
        key: '6e08001f3622d8b183b5cd0a831c851d',
        width: 300,
        height: 250,
        scriptSrc: 'https://bauval.org/22/6e08001f3622d8b183b5cd0a831c851d',
      },
      banner728x90: {
        key: '891ec742513a22088025defe366dd7ee',
        width: 728,
        height: 90,
        scriptSrc: 'https://bauval.org/22/891ec742513a22088025defe366dd7ee',
      },
      native: {
        scriptSrc: 'https://bauval.org/21/c7a60751572f72a8ad44b05c3f09e61f',
        containerId: 'container-c7a60751572f72a8ad44b05c3f09e61f',
      },
    };

    const config = configs[type];

    if (type === 'native') {
      // Format Native Banner
      const script = document.createElement('script');
      script.async = true;
      script.src = config.scriptSrc;
      container.id = config.containerId;
      container.appendChild(script);
    } else {
      // Format Banner classique (300x250 ou 728x90)
      const atOptionsScript = document.createElement('script');
      atOptionsScript.innerHTML = `
        atOptions = {
          'key': '${config.key}',
          'format': 'iframe',
          'height': ${config.height},
          'width': ${config.width},
          'params': {}
        };
      `;
      container.appendChild(atOptionsScript);

      const invokeScript = document.createElement('script');
      invokeScript.src = config.scriptSrc;
      container.appendChild(invokeScript);
    }

    return () => {
      if (container) {
        container.innerHTML = '';
      }
      hasLoaded.current = false;
    };
  }, [type]);

  const dimensions = type === 'banner300x250' 
    ? { width: '300px', height: '250px' }
    : type === 'banner728x90'
    ? { width: '728px', height: '90px' }
    : { width: '100%', height: 'auto' };

  return (
    <div 
      ref={containerRef}
      className="flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden"
      style={{ 
        width: dimensions.width, 
        minHeight: dimensions.height,
        minWidth: dimensions.width 
      }}
    >
      <span className="text-gray-400 text-xs select-none">Chargement...</span>
    </div>
  );
}
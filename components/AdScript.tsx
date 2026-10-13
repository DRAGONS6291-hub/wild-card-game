'use client';
import { useEffect } from 'react';

export function AdScript() {
  useEffect(() => {
    // Remplace 'TON_SITE_ID' par ton vrai ID Monetag
    const script = document.createElement('script');
    script.src = 'https://syndication.exdynsrv.com/splash.php?idzone=TON_SITE_ID';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return null;
}
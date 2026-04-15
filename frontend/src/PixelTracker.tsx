import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { API_BASE } from './config';

export const PixelTracker: React.FC = () => {
  const location = useLocation();
  const injected = useRef(false);

  // Inject script tags once on mount
  useEffect(() => {
    if (injected.current) return;
    injected.current = true;

    fetch(`${API_BASE}/api/settings/public`)
      .then(r => r.json())
      .then(data => {
        // A Tag do Google agora está fixada diretamente no index.html para o Google Ads detectar na hora.        // Meta Pixel
        if (data.metaPixelId) {
          const pixelId = data.metaPixelId.trim();
          const metaScript = document.createElement('script');
          metaScript.innerHTML = `
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
            document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `;
          document.head.appendChild(metaScript);
        }
      })
      .catch(() => {});
  }, []);

  // Track page views on route changes
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'PageView');
    }
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'pageview',
        page: location.pathname + location.search,
      });
    }
  }, [location]);

  return null;
};

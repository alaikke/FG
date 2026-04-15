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
        // Google Tag (gtag.js)
        if (data.googleTagId) {
          const tags = data.googleTagId.split(',').map((t: string) => t.trim()).filter(Boolean);
          if (tags.length > 0) {
            const primaryId = tags[0];
            const script = document.createElement('script');
            script.src = `https://www.googletagmanager.com/gtag/js?id=${primaryId}`;
            script.async = true;
            document.head.appendChild(script);

            const inlineScript = document.createElement('script');
            let configCalls = tags.map((id: string) => `gtag('config', '${id}');`).join('\n            ');
            inlineScript.innerHTML = `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              ${configCalls}
            `;
            document.head.appendChild(inlineScript);
            
            // Salva na window para usarmos nos page_views depois
            (window as any)._activeGtms = tags;
          }
        }

        // Meta Pixel
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
    const url = location.pathname + location.search;

    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'PageView');
    }

    if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function' && (window as any)._activeGtms) {
      (window as any)._activeGtms.forEach((id: string) => {
        (window as any).gtag('config', id, {
          page_path: url,
        });
      });
    } else if (typeof window !== 'undefined' && (window as any).dataLayer) {
      // Fallback para GTM clássico
      (window as any).dataLayer.push({
        event: 'pageview',
        page: url,
      });
    }
  }, [location]);

  return null;
};

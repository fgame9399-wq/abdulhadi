import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 no-print">
      {!isOnline ? (
        <div className="flex items-center gap-2 bg-neutral-900/90 text-white px-3.5 py-2 rounded-xl shadow-lg border border-neutral-700 text-xs">
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
          <span>وضع عدم الاتصال — يمكنك استخدام التطبيق وتسجيل البيانات بشكل طبيعي.</span>
        </div>
      ) : showReconnected ? (
        <div className="flex items-center gap-2 bg-emerald-700 text-white px-3.5 py-2 rounded-xl shadow-lg text-xs">
          <Wifi className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>تم استعادة الات بالإنترنت.</span>
        </div>
      ) : null}
    </div>
  );
};

import { useState, useEffect } from 'react';
import './CollectionBanner.css';

function getCountdown(launchDate) {
  const diff = new Date(launchDate) - new Date();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${h}س ${String(m).padStart(2, '0')}د ${String(s).padStart(2, '0')}ث`;
}

export default function CollectionBanner({ collections = [], onViewCollection }) {
  const [, setTick] = useState(0);

  // أحدث كولكشن فيها showBanner = true
  const active = [...collections]
    .filter(c => c.showBanner && c.launchDate)
    .sort((a, b) => new Date(b.launchDate) - new Date(a.launchDate))[0];

  const isFuture = active && new Date(active.launchDate) > new Date();

  useEffect(() => {
    if (!isFuture) return;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [isFuture, active?.id]);

  if (!active) return null;

  const countdown = getCountdown(active.launchDate);

  return (
    <div className="collection-banner">
      {countdown ? (
        /* ── عداد تنازلي ── */
        <div className="cb-inner cb-inner--countdown">
          <span className="cb-sparkle">✨</span>
          <span className="cb-text">
            كولكشن <strong>{active.name}</strong> تصل خلال:
          </span>
          <span className="cb-timer">{countdown}</span>
        </div>
      ) : (
        /* ── وصل الوقت ── */
        <div className="cb-inner cb-inner--arrived">
          <span className="cb-text">
            وصلت كولكشن <strong>{active.name}</strong> الآن!
          </span>
          <button
            className="cb-view-btn"
            onClick={() => onViewCollection(active.name)}
          >
            استعرضي الكولكشن ←
          </button>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { getAnnouncements } from '../../services/api';
import './AnnouncementBar.css';

export default function AnnouncementBar() {
  const [text, setText] = useState('');

  useEffect(() => {
    getAnnouncements()
      .then(res => {
        if (res.data.length) {
          setText(res.data.map(a => a.text).join('   ✦   '));
        }
      })
      .catch(() => {});
  }, []);

  if (!text) return null;

  return (
    <div className="announcement-bar" role="marquee">
      {/* نسختان من النص لضمان الحلقة المستمرة */}
      <div className="announcement-track">
        <span>{text}</span>
        <span aria-hidden="true">{text}</span>
        <span aria-hidden="true">{text}</span>
        <span aria-hidden="true">{text}</span>
        <span aria-hidden="true">{text}</span>
        <span aria-hidden="true">{text}</span>

      </div>
    </div>
  );
}

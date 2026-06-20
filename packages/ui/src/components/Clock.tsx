/**
 * A small glass clock for the dashboard's top bar. Honors the user's 12/24-hour
 * and time-zone preferences (Settings → Customize). Display-only — never used
 * for prayer times (that's an app concern, CLAUDE.md §13).
 */
import { useEffect, useState } from 'react';
import { usePrefs } from '../lib/prefs';

function format(now: Date, clock24h: boolean, tz: string): { time: string; date: string } {
  const timeOpts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: !clock24h };
  const dateOpts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
  try {
    const zone = tz || undefined;
    return {
      time: new Intl.DateTimeFormat(undefined, { ...timeOpts, timeZone: zone }).format(now),
      date: new Intl.DateTimeFormat(undefined, { ...dateOpts, timeZone: zone }).format(now),
    };
  } catch {
    // Invalid/unknown time zone → fall back to the device's local zone.
    return {
      time: new Intl.DateTimeFormat(undefined, timeOpts).format(now),
      date: new Intl.DateTimeFormat(undefined, dateOpts).format(now),
    };
  }
}

export function Clock() {
  const prefs = usePrefs();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!prefs.showClock) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [prefs.showClock]);

  if (!prefs.showClock) return null;
  const { time, date } = format(now, prefs.clock24h, prefs.timezone);

  return (
    <div className="clock-widget glass-raised" role="group" aria-label="Clock">
      <span className="clock-time">{time}</span>
      <span className="clock-date">{date}</span>
    </div>
  );
}

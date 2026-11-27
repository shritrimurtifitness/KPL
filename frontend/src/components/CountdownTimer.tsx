import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface CountdownTimerProps {
  expiresAt: string;
  onExpire?: () => void;
}

export const parseUtcDate = (dateStr: string): number => {
  if (!dateStr) return 0;
  let iso = dateStr.trim();
  // If the ISO string lacks timezone offset (no Z and no + or - time offset), treat as UTC
  if (!iso.endsWith('Z') && !iso.includes('+') && !/[0-9]-[0-9]{2}:[0-9]{2}$/.test(iso)) {
    iso += 'Z';
  }
  const parsed = new Date(iso).getTime();
  return isNaN(parsed) ? 0 : parsed;
};

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ expiresAt, onExpire }) => {
  const calculateRemaining = () => {
    const target = parseUtcDate(expiresAt);
    if (!target) return 0;
    return Math.max(0, target - Date.now());
  };

  const [timeLeftMs, setTimeLeftMs] = useState<number>(calculateRemaining);

  useEffect(() => {
    const target = parseUtcDate(expiresAt);
    const initialRemaining = Math.max(0, target - Date.now());
    setTimeLeftMs(initialRemaining);

    if (initialRemaining <= 0) {
      return;
    }

    const interval = setInterval(() => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setTimeLeftMs(0);
        clearInterval(interval);
        if (onExpire) onExpire();
      } else {
        setTimeLeftMs(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const totalSeconds = Math.floor(timeLeftMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const isExpired = timeLeftMs <= 0;
  const isUrgent = totalSeconds < 180; // Less than 3 minutes

  if (isExpired) {
    return (
      <div className="flex items-center space-x-2 text-rose-400 bg-rose-950/40 border border-rose-800/60 px-4 py-2.5 rounded-xl text-sm font-semibold">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>Reservation Expired! Your slot has been released.</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl border transition-colors ${
        isUrgent
          ? 'bg-amber-950/40 border-amber-800/60 text-amber-400 animate-pulse'
          : 'bg-emerald-950/40 border-emerald-800/50 text-emerald-400'
      }`}
    >
      <Clock className="w-5 h-5 shrink-0" />
      <div className="flex flex-col">
        <span className="text-xs uppercase font-medium tracking-wider text-slate-300">
          Slot Reservation Window
        </span>
        <span className="font-mono text-lg font-bold">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs text-slate-400 ml-auto hidden sm:inline">
        Complete payment before timer expires
      </span>
    </div>
  );
};

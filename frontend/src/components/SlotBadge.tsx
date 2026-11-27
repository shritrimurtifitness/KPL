import React from 'react';

interface SlotBadgeProps {
  availableSlots: number;
  totalCapacity: number;
  occupiedCount: number;
  isOpen: boolean;
}

export const SlotBadge: React.FC<SlotBadgeProps> = ({
  availableSlots,
  totalCapacity,
  occupiedCount,
  isOpen,
}) => {
  const percentage = Math.min(100, Math.round((occupiedCount / (totalCapacity || 120)) * 100));

  let statusBg = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
  let badgeColor = 'bg-emerald-500';
  let statusText = `${availableSlots} Slots Available`;

  if (!isOpen || availableSlots <= 0) {
    statusBg = 'bg-rose-500/10 border-rose-500/30 text-rose-400';
    badgeColor = 'bg-rose-500';
    statusText = 'Registration Closed / Full';
  } else if (availableSlots <= 15) {
    statusBg = 'bg-amber-500/10 border-amber-500/30 text-amber-400';
    badgeColor = 'bg-amber-500';
    statusText = `Fast Filling! Only ${availableSlots} Left`;
  }

  return (
    <div className="flex flex-col space-y-2">
      <div className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold ${statusBg}`}>
        <span className={`w-2 h-2 rounded-full ${badgeColor} animate-pulse`} />
        <span>{statusText}</span>
        <span className="text-slate-500">|</span>
        <span className="text-slate-300">
          {occupiedCount} / {totalCapacity} Filled
        </span>
      </div>

      {/* Mini Progress Bar */}
      <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            percentage >= 90 ? 'bg-rose-500' : percentage >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

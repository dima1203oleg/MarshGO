import React from 'react';

export const TrainBusHeaderBadge: React.FC<{ className?: string }> = ({ className = 'h-14 w-28' }) => {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-sky-100 to-blue-200/60 dark:from-slate-800 dark:via-blue-950/40 dark:to-slate-800 p-1 flex items-center justify-center border border-blue-200/50 dark:border-slate-700/60 shadow-xs ${className}`}>
      <svg viewBox="0 0 120 60" fill="none" className="w-full h-full object-contain" xmlns="http://www.w3.org/2000/svg">
        {/* Speed lines */}
        <line x1="10" y1="52" x2="110" y2="52" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4 4" />

        {/* High-speed Train (Left / Background) */}
        <g transform="translate(10, 8)">
          {/* Nose curve */}
          <path
            d="M5 38C5 28 12 14 26 14H50V38H5Z"
            fill="#0284C7"
          />
          <path
            d="M10 24C12 18 18 15 26 15H36V26H10V24Z"
            fill="#E0F2FE"
          />
          <rect x="38" y="15" width="10" height="11" rx="1" fill="#E0F2FE" />
          {/* Yellow headlight */}
          <circle cx="9" cy="34" r="2.5" fill="#FACC15" />
          <line x1="5" y1="30" x2="50" y2="30" stroke="#0369A1" strokeWidth="1.5" />
        </g>

        {/* Modern Bus (Right / Foreground) */}
        <g transform="translate(52, 14)">
          <rect x="2" y="4" width="46" height="28" rx="4" fill="#0066FF" />
          {/* Windshield & Windows */}
          <rect x="5" y="7" width="12" height="12" rx="2" fill="#E0F2FE" />
          <rect x="19" y="7" width="11" height="12" rx="2" fill="#E0F2FE" />
          <rect x="32" y="7" width="13" height="12" rx="2" fill="#E0F2FE" />
          {/* Headlights */}
          <rect x="5" y="24" width="4" height="3" rx="1" fill="#FEF08A" />
          <rect x="41" y="24" width="4" height="3" rx="1" fill="#FEF08A" />
          {/* Wheels */}
          <circle cx="14" cy="34" r="4.5" fill="#0F172A" />
          <circle cx="14" cy="34" r="1.8" fill="#94A3B8" />
          <circle cx="38" cy="34" r="4.5" fill="#0F172A" />
          <circle cx="38" cy="34" r="1.8" fill="#94A3B8" />
        </g>
      </svg>
    </div>
  );
};

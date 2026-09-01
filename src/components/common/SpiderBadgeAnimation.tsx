import React, { useState } from 'react';
import { useApp } from '../../state/AppContext';

export const SpiderBadgeAnimation: React.FC = () => {
  const { verificationResult, activeEvent } = useApp();
  const [isHovered, setIsHovered] = useState(false);
  const isVerified = verificationResult.status === 'PASSED';
  const isHighAlert = activeEvent.severity === 'Critical' || activeEvent.severity === 'High';

  return (
    <div
      className="relative flex flex-col items-center justify-end px-3 pt-4 pb-3 mt-auto cursor-pointer group select-none overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="CASCADE Spider Sentinel — Monitoring infrastructure grid topology in real-time"
    >
      {/* Subtle City Skyline Vector Background */}
      <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none opacity-20 flex items-end justify-center">
        <svg viewBox="0 0 200 60" className="w-full h-full fill-slate-400">
          <rect x="10" y="25" width="16" height="35" rx="1" />
          <rect x="30" y="10" width="22" height="50" rx="1" />
          <rect x="56" y="30" width="14" height="30" rx="1" />
          <rect x="74" y="18" width="24" height="42" rx="1" />
          <polygon points="110,8 102,60 118,60" />
          <rect x="122" y="22" width="18" height="38" rx="1" />
          <rect x="144" y="35" width="20" height="25" rx="1" />
          <rect x="168" y="15" width="22" height="45" rx="1" />
        </svg>
      </div>

      {/* Spider Web Silk Line */}
      <div className="absolute top-0 w-[1px] h-9 bg-gradient-to-b from-slate-300 to-rose-400 group-hover:from-rose-400 group-hover:to-rose-600 transition-colors animate-web-pulse" />

      {/* Subtle Spider Sentinel Vector Icon */}
      <div
        className={`relative z-10 transition-transform duration-300 ${
          isHovered ? 'scale-110 -translate-y-0.5' : 'animate-spider-swing'
        }`}
      >
        <svg
          width="54"
          height="64"
          viewBox="0 0 60 70"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-sm transition-all duration-300"
        >
          {/* Subtle Web lines radiating */}
          <path
            d="M30 0 V20 M12 12 L30 20 L48 12 M18 24 L30 20 L42 24"
            stroke={isHighAlert ? '#f43f5e' : '#cbd5e1'}
            strokeWidth="0.8"
            strokeDasharray="2 2"
            opacity="0.5"
          />

          {/* Mask / Head */}
          <ellipse cx="30" cy="24" rx="12" ry="14" fill="#dc2626" />

          {/* Torso & Suit */}
          <ellipse cx="30" cy="48" rx="13" ry="17" fill="#dc2626" />
          <path d="M18 42 C18 53 21 60 25 64 C21 57 20 48 21 42 Z" fill="#1e3a8a" />
          <path d="M42 42 C42 53 39 60 35 64 C39 57 40 48 39 42 Z" fill="#1e3a8a" />

          {/* Webbing Lines on Mask */}
          <path
            d="M30 11 V37 M19 20 C24 23 36 23 41 20 M19 28 C24 31 36 31 41 28"
            stroke="#0f172a"
            strokeWidth="0.65"
            opacity="0.75"
          />

          {/* Webbing Lines on Torso */}
          <path
            d="M30 33 V64 M23 38 C27 42 33 42 37 38 M20 48 C26 52 34 52 40 48 M23 58 C27 60 33 60 37 58"
            stroke="#0f172a"
            strokeWidth="0.65"
            opacity="0.75"
          />

          {/* Chest Spider Emblem */}
          <path
            d="M30 43 L28 46 L30 49 L32 46 Z M28 45 L22 41 M28 47 L21 49 M29 48 L23 53 M32 45 L38 41 M32 47 L39 49 M31 48 L37 53"
            stroke="#0f172a"
            strokeWidth="1.3"
            strokeLinecap="round"
          />

          {/* Spider Eyes (Lenses) */}
          <path
            d="M22 21 C25 20 28 24 27 28 C24 28 22 25 22 21 Z"
            fill={isVerified ? '#ffffff' : '#f8fafc'}
            stroke="#0f172a"
            strokeWidth="1.4"
          />
          <path
            d="M38 21 C35 20 32 24 33 28 C36 28 38 25 38 21 Z"
            fill={isVerified ? '#ffffff' : '#f8fafc'}
            stroke="#0f172a"
            strokeWidth="1.4"
          />

          {/* Eye Sheen */}
          <circle cx="25" cy="24" r="1" fill={isVerified ? '#38bdf8' : '#e2e8f0'} />
          <circle cx="35" cy="24" r="1" fill={isVerified ? '#38bdf8' : '#e2e8f0'} />
        </svg>
      </div>

      {/* Mini status pill below mascot */}
      <div className="relative z-10 mt-1 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100/90 border border-slate-200 text-[9.5px] font-semibold text-slate-600 group-hover:border-rose-300 group-hover:text-rose-600 transition-colors shadow-2xs">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isVerified ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500 animate-ping'
          }`}
        />
        <span>{isVerified ? 'Sentinel Guard: Active' : 'Cascade Alert'}</span>
      </div>
    </div>
  );
};


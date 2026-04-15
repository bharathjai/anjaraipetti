import { useId } from "react";

export default function BrandHatMark({ className = "h-full w-full" }) {
  const gradientId = useId();

  return (
    <svg viewBox="0 0 220 80" className={className}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f1c997" stopOpacity="0.45" />
          <stop offset="50%" stopColor="#d0843e" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#8a4a22" stopOpacity="0.32" />
        </linearGradient>
      </defs>
      <path
        d="M36 60c0-14 8-20 17-20 2-12 12-18 23-15 5-7 13-11 23-11 15 0 27 10 30 24 8-3 18 3 20 13 11 1 17 7 17 17H36z"
        fill={`url(#${gradientId})`}
      />
      <path d="M37 60h149" stroke="#8a4a22" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.35" />
      <path
        d="M56 42c4 0 7-3 7-7M85 30c5 0 8-3 8-8M121 27c5 0 8-3 8-8"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.45"
      />
    </svg>
  );
}

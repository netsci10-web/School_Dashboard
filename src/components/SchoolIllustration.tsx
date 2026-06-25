import React from "react";

export default function SchoolIllustration() {
  return (
    <div className="absolute top-[40px] right-[80px] w-[140px] h-[140px] z-10 pointer-events-none sm:w-[90px] sm:h-[90px] sm:top-[20px] sm:right-[20px] md:w-[120px] md:h-[120px] md:top-[30px] md:right-[40px] lg:w-[140px] lg:h-[140px]">
      <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Left Tree */}
        <rect x="15" y="90" width="8" height="30" rx="2" fill="#8B6F47" />
        <ellipse cx="19" cy="78" rx="16" ry="22" fill="#5DAE6B" />
        <ellipse cx="14" cy="82" rx="12" ry="16" fill="#4A9B58" />

        {/* Right Tree */}
        <rect x="135" y="95" width="7" height="25" rx="2" fill="#8B6F47" />
        <ellipse cx="138" cy="84" rx="14" ry="18" fill="#5DAE6B" />
        <ellipse cx="142" cy="88" rx="10" ry="14" fill="#4A9B58" />

        {/* School Building Main */}
        <rect x="35" y="65" width="90" height="55" rx="3" fill="#F5E6C8" />
        <rect x="35" y="65" width="90" height="55" rx="3" stroke="#D4C4A0" strokeWidth="1" />

        {/* Roof */}
        <path d="M30 68 L80 30 L130 68Z" fill="#E8524A" />
        <path d="M30 68 L80 30 L130 68Z" stroke="#D4443C" strokeWidth="1" />

        {/* Clock Tower / Bell */}
        <rect x="75" y="22" width="10" height="12" rx="1" fill="#FFD93D" />
        <polygon points="80,14 74,22 86,22" fill="#FFD93D" />

        {/* Clock Face */}
        <circle cx="80" cy="50" r="10" fill="white" stroke="#D4C4A0" strokeWidth="1.5" />
        <line x1="80" y1="50" x2="80" y2="43" stroke="#555" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="80" y1="50" x2="85" y2="52" stroke="#555" strokeWidth="1.5" strokeLinecap="round" />

        {/* Windows */}
        <rect x="42" y="75" width="14" height="14" rx="2" fill="#87CEEB" stroke="#D4C4A0" strokeWidth="1" />
        <line x1="49" y1="75" x2="49" y2="89" stroke="#D4C4A0" strokeWidth="0.8" />
        <line x1="42" y1="82" x2="56" y2="82" stroke="#D4C4A0" strokeWidth="0.8" />

        <rect x="62" y="75" width="14" height="14" rx="2" fill="#87CEEB" stroke="#D4C4A0" strokeWidth="1" />
        <line x1="69" y1="75" x2="69" y2="89" stroke="#D4C4A0" strokeWidth="0.8" />
        <line x1="62" y1="82" x2="76" y2="82" stroke="#D4C4A0" strokeWidth="0.8" />

        <rect x="104" y="75" width="14" height="14" rx="2" fill="#87CEEB" stroke="#D4C4A0" strokeWidth="1" />
        <line x1="111" y1="75" x2="111" y2="89" stroke="#D4C4A0" strokeWidth="0.8" />
        <line x1="104" y1="82" x2="118" y2="82" stroke="#D4C4A0" strokeWidth="0.8" />

        {/* Door */}
        <rect x="84" y="96" width="16" height="24" rx="8 8 0 0" fill="#6B4226" />
        <circle cx="96" cy="110" r="1.5" fill="#FFD93D" />

        {/* Grass ground */}
        <ellipse cx="80" cy="122" rx="70" ry="6" fill="#7BC67E" />
        <ellipse cx="80" cy="124" rx="75" ry="5" fill="#6AB86D" />

        {/* Clouds */}
        <ellipse cx="30" cy="25" rx="18" ry="8" fill="white" opacity="0.8" />
        <ellipse cx="140" cy="20" rx="14" ry="6" fill="white" opacity="0.7" />
      </svg>
    </div>
  );
}

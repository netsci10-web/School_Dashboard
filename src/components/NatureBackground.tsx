import React from "react";

export default function NatureBackground() {
  return (
    <div className="fixed inset-0 w-full h-full -z-10 pointer-events-none overflow-hidden bg-gradient-to-b from-[#eaf5f0] via-[#f2f8f5] to-[#f7faf9]">
      {/* Left Mountain / Clouds SVG */}
      <div className="absolute top-0 left-0 w-[350px] h-[300px] opacity-70 sm:w-[200px] sm:h-[180px] md:w-[280px] md:h-[240px] lg:w-[350px] lg:h-[300px]">
        <svg viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <ellipse cx="60" cy="0" rx="200" ry="120" fill="url(#cloudL1)" />
          <path d="M0 320 L0 140 Q30 80 80 100 Q130 50 180 90 Q220 40 270 80 Q310 60 350 100 Q380 130 400 160 L400 320Z" fill="url(#mountainL1)" />
          <path d="M0 320 L0 180 Q40 130 100 160 Q150 110 200 140 Q250 100 300 140 L350 320Z" fill="url(#mountainL2)" />
          <path d="M0 320 L0 220 Q50 180 120 210 Q180 170 250 200 L300 320Z" fill="url(#mountainL3)" />
          <defs>
            <linearGradient id="cloudL1" x1="0" y1="0" x2="200" y2="120">
              <stop offset="0%" stopColor="#b8dce8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#d4eef5" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="mountainL1" x1="100" y1="40" x2="100" y2="320">
              <stop offset="0%" stopColor="#8cc5a8" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#b5dcc5" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="mountainL2" x1="80" y1="100" x2="80" y2="320">
              <stop offset="0%" stopColor="#a3d4b7" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#c8e6d2" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="mountainL3" x1="60" y1="170" x2="60" y2="320">
              <stop offset="0%" stopColor="#bce0cb" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ddf0e3" stopOpacity="0.05" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Right Mountain / Clouds SVG */}
      <div className="absolute top-0 right-0 w-[300px] h-[280px] opacity-60 sm:w-[180px] sm:h-[160px] md:w-[240px] md:h-[220px] lg:w-[300px] lg:h-[280px]">
        <svg viewBox="0 0 350 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <ellipse cx="300" cy="0" rx="180" ry="100" fill="url(#cloudR1)" />
          <path d="M0 160 Q40 80 100 110 Q150 50 200 80 Q250 30 300 70 Q330 50 350 80 L350 300 L0 300Z" fill="url(#mountainR1)" />
          <path d="M50 300 Q80 140 150 170 Q200 120 260 150 Q310 110 350 140 L350 300Z" fill="url(#mountainR2)" />
          <path d="M100 300 Q140 200 200 220 Q260 180 320 210 L350 300Z" fill="url(#mountainR3)" />
          <defs>
            <linearGradient id="cloudR1" x1="200" y1="0" x2="350" y2="100">
              <stop offset="0%" stopColor="#a8d1e0" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#c8e4ef" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="mountainR1" x1="200" y1="30" x2="200" y2="300">
              <stop offset="0%" stopColor="#7fbfdb" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#b5d8e8" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="mountainR2" x1="200" y1="110" x2="200" y2="300">
              <stop offset="0%" stopColor="#95cada" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#c5e2ed" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="mountainR3" x1="220" y1="180" x2="220" y2="300">
              <stop offset="0%" stopColor="#a8d5e2" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#d5ebf2" stopOpacity="0.03" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Mid Left Decors */}
      <div className="absolute top-[40%] left-0 w-[200px] h-[250px] -translate-y-1/2 opacity-50 sm:w-[120px] sm:h-[160px] md:w-[160px] md:h-[200px] lg:w-[200px] lg:h-[250px]">
        <svg viewBox="0 0 200 250" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M0 0 Q20 40 10 80 Q30 60 50 90 Q40 120 20 140 Q35 130 60 150 Q30 180 0 200 L0 0Z" fill="url(#midL1)" />
          <ellipse cx="0" cy="100" rx="80" ry="60" fill="url(#midL2)" />
          <ellipse cx="10" cy="160" rx="60" ry="40" fill="url(#midL3)" />
          <defs>
            <linearGradient id="midL1" x1="0" y1="0" x2="60" y2="200">
              <stop offset="0%" stopColor="#8cc5a8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#b5dcc5" stopOpacity="0.1" />
            </linearGradient>
            <radialGradient id="midL2" cx="0" cy="0.5" r="1">
              <stop offset="0%" stopColor="#a3d4b7" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#c8e6d2" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="midL3" cx="0.1" cy="0.5" r="1">
              <stop offset="0%" stopColor="#90c8ae" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#c5e3d0" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* Mid Right Decors */}
      <div className="absolute top-[45%] right-0 w-[180px] h-[220px] -translate-y-1/2 opacity-45 sm:w-[110px] sm:h-[140px] md:w-[140px] md:h-[180px] lg:w-[180px] lg:h-[220px]">
        <svg viewBox="0 0 180 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M180 20 Q160 50 170 90 Q150 70 130 100 Q145 130 165 150 Q140 140 120 160 Q150 190 180 210 L180 20Z" fill="url(#midR1)" />
          <ellipse cx="180" cy="110" rx="70" ry="55" fill="url(#midR2)" />
          <defs>
            <linearGradient id="midR1" x1="180" y1="20" x2="120" y2="210">
              <stop offset="0%" stopColor="#7fbfdb" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#b5d8e8" stopOpacity="0.08" />
            </linearGradient>
            <radialGradient id="midR2" cx="1" cy="0.5" r="1">
              <stop offset="0%" stopColor="#95cada" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#c5e2ed" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* Bottom Left SVG */}
      <div className="absolute bottom-0 left-0 w-[400px] h-[300px] opacity-55 sm:w-[250px] sm:h-[200px] md:w-[320px] md:h-[240px] lg:w-[400px] lg:h-[300px]">
        <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <ellipse cx="50" cy="300" rx="180" ry="100" fill="url(#blCloud1)" />
          <path d="M0 120 Q40 160 30 200 Q60 170 90 190 Q120 150 160 180 Q190 140 230 170 Q200 220 160 250 Q100 280 0 300 L0 120Z" fill="url(#blMtn1)" />
          <path d="M0 180 Q50 200 40 240 Q80 210 120 230 Q100 260 60 280 L0 300 L0 180Z" fill="url(#blMtn2)" />
          <ellipse cx="200" cy="280" rx="120" ry="40" fill="url(#blGrass)" />
          <defs>
            <radialGradient id="blCloud1" cx="0.2" cy="1" r="1">
              <stop offset="0%" stopColor="#b8dce8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#d4eef5" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="blMtn1" x1="0" y1="120" x2="100" y2="300">
              <stop offset="0%" stopColor="#8cc5a8" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#bce0cb" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="blMtn2" x1="0" y1="180" x2="60" y2="300">
              <stop offset="0%" stopColor="#a3d4b7" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#d0ebd8" stopOpacity="0.05" />
            </linearGradient>
            <radialGradient id="blGrass" cx="0.5" cy="0.8" r="0.8">
              <stop offset="0%" stopColor="#a8d5b8" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#c8e6d2" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* Bottom Right SVG */}
      <div className="absolute bottom-0 right-0 w-[380px] h-[280px] opacity-50 sm:w-[230px] sm:h-[180px] md:w-[300px] md:h-[220px] lg:w-[380px] lg:h-[280px]">
        <svg viewBox="0 0 380 280" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <ellipse cx="330" cy="280" rx="160" ry="90" fill="url(#brCloud1)" />
          <path d="M380 100 Q340 140 350 180 Q310 150 270 170 Q240 140 200 160 Q230 200 270 230 Q320 260 380 280 L380 100Z" fill="url(#brMtn1)" />
          <path d="M380 170 Q340 190 350 230 Q310 210 270 230 Q300 260 340 270 L380 280 L380 170Z" fill="url(#brMtn2)" />
          <defs>
            <radialGradient id="brCloud1" cx="0.85" cy="1" r="1">
              <stop offset="0%" stopColor="#a8d1e0" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#c8e4ef" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="brMtn1" x1="380" y1="100" x2="280" y2="280">
              <stop offset="0%" stopColor="#7fbfdb" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#b5d8e8" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="brMtn2" x1="380" y1="170" x2="300" y2="280">
              <stop offset="0%" stopColor="#95cada" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#c5e2ed" stopOpacity="0.05" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

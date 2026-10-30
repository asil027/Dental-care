import React from 'react';

/**
 * Premium Modern Dental Care Brand Logo
 * Features a stylized 3D layered tooth with an enamel shine curve and radiant sparkle stars.
 */
export default function BrandLogo({
  variant = 'dark', // 'dark' (navy on light background) or 'light' (white on dark background)
  size = 'md', // 'sm', 'md', 'lg', 'xl'
  showTagline = true,
  clinicName = 'Dental Care',
  tagline = 'Healthy Smiles, Brighter Future',
  className = ''
}) {
  const isLight = variant === 'light';

  // Sizing maps
  const iconSizes = {
    sm: 'w-8 h-8 p-1.5',
    md: 'w-10 h-10 p-2',
    lg: 'w-12 h-12 p-2.5',
    xl: 'w-16 h-16 p-3'
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  const taglineSizes = {
    sm: 'text-[9px]',
    md: 'text-[11px]',
    lg: 'text-xs',
    xl: 'text-sm'
  };

  // Split clinic name for dual-color stylish display
  const words = (clinicName || 'Dental Care').trim().split(' ');
  const firstWord = words[0] || 'Dental';
  const restWords = words.slice(1).join(' ') || 'Care';

  return (
    <div className={`flex items-center gap-3 select-none group ${className}`}>
      {/* Stylized Modern Emblem */}
      <div
        className={`relative shrink-0 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 ${
          iconSizes[size] || iconSizes.md
        } ${
          isLight
            ? 'bg-gradient-to-br from-white/15 to-white/5 border border-white/20 shadow-lg shadow-black/10 backdrop-blur-sm'
            : 'bg-gradient-to-br from-blue-50 via-white to-sky-100 border border-blue-200/80 shadow-md shadow-blue-500/10'
        }`}
      >
        {/* Glow ambient highlight */}
        <div
          className={`absolute inset-0 rounded-2xl opacity-60 blur-sm pointer-events-none transition-opacity group-hover:opacity-100 ${
            isLight
              ? 'bg-gradient-to-tr from-cyan-400/20 to-blue-400/20'
              : 'bg-gradient-to-tr from-sky-300/40 to-blue-500/20'
          }`}
        />

        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative z-10 drop-shadow-sm"
        >
          <defs>
            {/* Main Tooth Body Gradient */}
            <linearGradient id="dcToothGrad" x1="8" y1="6" x2="40" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="45%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#092C59" />
            </linearGradient>

            {/* Light Variant Tooth Gradient for Dark Themes */}
            <linearGradient id="dcToothLightGrad" x1="8" y1="6" x2="40" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#BAE6FD" />
              <stop offset="100%" stopColor="#38BDF8" />
            </linearGradient>

            {/* Enamel Highlight Sweep */}
            <linearGradient id="dcEnamelSweep" x1="12" y1="10" x2="36" y2="34" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
              <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>

            {/* Sparkle Gold/Diamond Gradient */}
            <linearGradient id="dcSparkleGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#38BDF8" />
            </linearGradient>
          </defs>

          {/* Main Anatomical Stylized Tooth */}
          <path
            d="M 24 10 C 19 5, 8 7, 8 18 C 8 26, 11 33, 14 41 C 15.5 44, 18 43, 19 39 C 20.5 34, 23 27, 24 27 C 25 27, 27.5 34, 29 39 C 30 43, 32.5 44, 34 41 C 37 33, 40 26, 40 18 C 40 7, 29 5, 24 10 Z"
            fill={isLight ? 'url(#dcToothLightGrad)' : 'url(#dcToothGrad)'}
          />

          {/* Inner Modern Smile Arc (Enamel Wave) */}
          <path
            d="M 14 19 C 17 25, 31 25, 34 19 C 31 22, 17 22, 14 19 Z"
            fill="#FFFFFF"
            fillOpacity={isLight ? 0.9 : 0.8}
          />

          {/* Glossy Upper Left Crown Highlight */}
          <path
            d="M 11 15 C 11 11, 16 9, 21 10 C 17 11, 13 13, 12 17 C 11.5 19, 11 17, 11 15 Z"
            fill="url(#dcEnamelSweep)"
          />

          {/* Large Brilliant Sparkle Star (✦) Top Right */}
          <path
            d="M 37 3 C 37 6.5, 39 8.5, 42.5 8.5 C 39 8.5, 37 10.5, 37 14 C 37 10.5, 35 8.5, 31.5 8.5 C 35 8.5, 37 6.5, 37 3 Z"
            fill="url(#dcSparkleGrad)"
            className="animate-pulse"
          />

          {/* Small Delicate Accent Sparkle (✦) Top Left */}
          <path
            d="M 9 6 C 9 7.8, 10 8.8, 11.8 8.8 C 10 8.8, 9 9.8, 9 11.6 C 9 9.8, 8 8.8, 6.2 8.8 C 8 8.8, 9 7.8, 9 6 Z"
            fill="#67E8F9"
          />
        </svg>
      </div>

      {/* Modern Typographic Wordmark */}
      <div className="leading-tight">
        <div
          className={`font-black tracking-tight flex items-baseline gap-1.5 ${
            titleSizes[size] || titleSizes.md
          }`}
        >
          <span className={isLight ? 'text-white' : 'text-[#092C59]'}>
            {firstWord}
          </span>
          {restWords && (
            <span
              className={`text-transparent bg-clip-text ${
                isLight
                  ? 'bg-gradient-to-r from-cyan-300 via-sky-200 to-white'
                  : 'bg-gradient-to-r from-[#0284C7] to-[#0756A6]'
              }`}
            >
              {restWords}
            </span>
          )}
          {/* Subtle Aesthetic Accent Pip */}
          <span
            className={`w-1.5 h-1.5 rounded-full inline-block transition-transform group-hover:scale-125 ${
              isLight ? 'bg-cyan-300 shadow-sm shadow-cyan-300/50' : 'bg-[#0284C7]'
            }`}
          />
        </div>

        {showTagline && (
          <div
            className={`font-semibold tracking-wider uppercase transition-colors -mt-0.5 ${
              taglineSizes[size] || taglineSizes.md
            } ${isLight ? 'text-blue-200/80' : 'text-slate-400 group-hover:text-slate-600'}`}
          >
            {tagline}
          </div>
        )}
      </div>
    </div>
  );
}


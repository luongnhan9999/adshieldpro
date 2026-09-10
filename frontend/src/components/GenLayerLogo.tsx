import React from 'react';

interface GenLayerLogoProps {
  className?: string;
  glow?: boolean;
}

export const GenLayerLogo: React.FC<GenLayerLogoProps> = ({ className = 'w-5 h-5', glow = false }) => {
  return (
    <span className={`inline-flex items-center justify-center relative shrink-0 ${glow ? 'group' : ''}`}>
      {glow && (
        <span className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-teal-400 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-300 pointer-events-none" />
      )}
      <img
        src="/genlayer-white.png"
        alt="GenLayer"
        className={`relative object-contain select-none pointer-events-none ${className}`}
      />
    </span>
  );
};

import React from 'react';

interface StageBadgeProps {
  name: string;
  color?: string;
  className?: string;
}

// Convert hex to RGBA with specific opacity
function hexToRgba(hex: string, alpha: number): string {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Darken a hex color for readable text on light backgrounds
function getReadableColor(hex: string): string {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  let r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  let g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  let b = parseInt(cleanHex.substring(4, 6), 16) || 0;

  // Darken by 35% for contrast
  r = Math.floor(Math.max(0, r * 0.65));
  g = Math.floor(Math.max(0, g * 0.65));
  b = Math.floor(Math.max(0, b * 0.65));

  return `rgb(${r}, ${g}, ${b})`;
}

export const StageBadge: React.FC<StageBadgeProps> = ({
  name,
  color = '#3B82F6',
  className = '',
}) => {
  const backgroundColor = hexToRgba(color, 0.14);
  const textColor = getReadableColor(color);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${className}`}
      style={{
        backgroundColor,
        color: textColor,
        borderColor: hexToRgba(color, 0.28),
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {name}
    </span>
  );
};

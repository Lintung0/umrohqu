export function IslamicPattern({ className = "", opacity = 0.06 }: { className?: string; opacity?: number }) {
  return (
    <svg
      className={`pointer-events-none ${className}`}
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="islamic-pattern"
          x="0"
          y="0"
          width="80"
          height="80"
          patternUnits="userSpaceOnUse"
        >
          {/* 8-pointed star */}
          <polygon
            points="40,8 46,26 64,20 50,34 64,48 46,42 40,60 34,42 16,48 30,34 16,20 34,26"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity={opacity}
          />
          {/* Inner octagon */}
          <polygon
            points="40,20 52,26 52,38 40,44 28,38 28,26"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            opacity={opacity * 0.7}
          />
          {/* Center diamond */}
          <polygon
            points="40,28 46,32 40,36 34,32"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            opacity={opacity * 0.5}
          />
          {/* Corner dots */}
          <circle cx="0" cy="0" r="2" fill="currentColor" opacity={opacity * 0.3} />
          <circle cx="80" cy="0" r="2" fill="currentColor" opacity={opacity * 0.3} />
          <circle cx="0" cy="80" r="2" fill="currentColor" opacity={opacity * 0.3} />
          <circle cx="80" cy="80" r="2" fill="currentColor" opacity={opacity * 0.3} />
          {/* Connecting lines */}
          <line x1="0" y1="0" x2="16" y2="20" stroke="currentColor" strokeWidth="0.3" opacity={opacity * 0.4} />
          <line x1="80" y1="0" x2="64" y2="20" stroke="currentColor" strokeWidth="0.3" opacity={opacity * 0.4} />
          <line x1="0" y1="80" x2="16" y2="48" stroke="currentColor" strokeWidth="0.3" opacity={opacity * 0.4} />
          <line x1="80" y1="80" x2="64" y2="48" stroke="currentColor" strokeWidth="0.3" opacity={opacity * 0.4} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#islamic-pattern)" />
    </svg>
  );
}

export function IslamicDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <svg width="24" height="24" viewBox="0 0 24 24" className="text-primary/40 shrink-0">
        <polygon
          points="12,2 16,8 22,8 18,14 22,20 16,20 12,22 8,20 2,20 6,14 2,8 8,8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
        <polygon
          points="12,8 14.5,10.5 14.5,14.5 12,17 9.5,14.5 9.5,10.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
        />
      </svg>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
    </div>
  );
}

export function IslamicCorner({ className = "", position = "top-left" }: { className?: string; position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" }) {
  const transforms: Record<string, string> = {
    "top-left": "",
    "top-right": "scale(-1, 1)",
    "bottom-left": "scale(1, -1)",
    "bottom-right": "scale(-1, -1)",
  };

  return (
    <svg
      className={`text-primary/15 ${className}`}
      width="120"
      height="120"
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: transforms[position] }}
    >
      <polygon
        points="60,10 70,35 95,25 80,50 95,75 70,65 60,90 50,65 25,75 40,50 25,25 50,35"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <polygon
        points="60,30 68,42 80,38 72,50 80,62 68,58 60,70 52,58 40,62 48,50 40,38 52,42"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.8"
      />
      <circle cx="60" cy="50" r="4" fill="none" stroke="currentColor" strokeWidth="0.6" />
      <line x1="10" y1="10" x2="25" y2="25" stroke="currentColor" strokeWidth="0.5" />
      <line x1="10" y1="10" x2="50" y2="10" stroke="currentColor" strokeWidth="0.5" />
      <line x1="10" y1="10" x2="10" y2="50" stroke="currentColor" strokeWidth="0.5" />
    </svg>
  );
}

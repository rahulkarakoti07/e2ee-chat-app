import React, { useRef, useState } from 'react';

interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glowColor?: 'cyan' | 'purple' | 'emerald';
  className?: string;
  spotlight?: boolean;
}

export const GlowCard: React.FC<GlowCardProps> = ({
  children,
  glowColor = 'cyan',
  className = '',
  spotlight = true,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !spotlight) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const glowRgba =
    glowColor === 'purple'
      ? 'rgba(153, 69, 255, 0.22)'
      : glowColor === 'emerald'
      ? 'rgba(16, 185, 129, 0.22)'
      : 'rgba(0, 240, 255, 0.22)';

  const borderHover =
    glowColor === 'purple'
      ? 'hover:border-[#9945ff]/40'
      : glowColor === 'emerald'
      ? 'hover:border-[#10b981]/40'
      : 'hover:border-[#00f0ff]/40';

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0d14]/70 backdrop-blur-xl transition-all duration-300 ${borderHover} ${className}`}
      {...props}
    >
      {/* Dynamic Cursor Spotlight Radial Gradient */}
      {spotlight && (
        <div
          className="pointer-events-none absolute -inset-px transition-opacity duration-300"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, ${glowRgba}, transparent 70%)`,
          }}
        />
      )}

      {/* Content wrapper with relative positioning */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

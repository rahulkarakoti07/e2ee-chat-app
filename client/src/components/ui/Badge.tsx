import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'purple' | 'emerald' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
  pulse?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'cyan',
  size = 'sm',
  pulse = false,
  className = '',
}) => {
  const variantStyles = {
    cyan: 'bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]/30',
    purple: 'bg-[#9945ff]/10 text-[#9945ff] border-[#9945ff]/30',
    emerald: 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30',
    danger: 'bg-[#ff3366]/10 text-[#ff3366] border-[#ff3366]/30',
    neutral: 'bg-white/[0.05] text-slate-300 border-white/10',
  }[variant];

  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border backdrop-blur-md font-mono ${variantStyles} ${sizeStyles} ${className}`}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
        </span>
      )}
      {children}
    </span>
  );
};

import { Stethoscope } from 'lucide-react';

type BrandMarkProps = {
  tone?: 'light' | 'dark';
  compact?: boolean;
  className?: string;
};

export function BrandMark({ tone = 'dark', compact = false, className = '' }: BrandMarkProps) {
  const isLight = tone === 'light';

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div className={`flex h-8 w-8 items-center justify-center rounded-[8px] ${isLight ? 'bg-white text-[#202124]' : 'bg-[#202124] text-white'}`}>
        <Stethoscope size={17} strokeWidth={2.15} />
      </div>
      {!compact && (
        <span className={`text-[19px] font-semibold tracking-normal ${isLight ? 'text-white' : 'text-[#202124]'}`}>
          Doctor Tech
        </span>
      )}
    </div>
  );
}

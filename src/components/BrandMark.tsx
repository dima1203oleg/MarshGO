type BrandMarkProps = {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeClasses = {
  sm: 'h-9 w-9 rounded-xl text-base',
  md: 'h-11 w-11 rounded-2xl text-xl',
  lg: 'h-[4.4rem] w-[4.4rem] rounded-[1.4rem] text-3xl',
} satisfies Record<NonNullable<BrandMarkProps['size']>, string>;

/** Shared MARSHGO app mark matching the V4 design system (01_Головна.png) */
export function BrandMark({ size = 'md', className = '' }: BrandMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-grid shrink-0 place-items-center bg-[#1769ED] font-black text-white shadow-md shadow-blue-500/25 select-none ${sizeClasses[size]} ${className}`}
    >
      <span className="leading-none tracking-tight">M</span>
    </span>
  );
}

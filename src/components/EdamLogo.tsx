interface EdamLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const EdamLogo = ({ 
  className = '', 
  size = 36,
  showText = false 
}: EdamLogoProps) => {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <img 
        src="/edam-logo.png" 
        alt="e-DAM Logo" 
        style={{ width: size, height: size }}
        className="object-contain filter drop-shadow-[0_0_10px_rgba(192,38,255,0.7)]"
      />
      {showText && (
        <div className="flex flex-col">
          <span className="text-white font-extrabold tracking-wider text-sm leading-tight">
            e-DAM <span className="text-primary font-light">IARE</span>
          </span>
          <span className="text-white/60 font-semibold tracking-[0.25em] text-[9px] uppercase">
            Technical Community
          </span>
        </div>
      )}
    </div>
  );
};

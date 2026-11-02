import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  className = "",
  disabled,
  ...props
}) => {
  const variantStyles = {
    primary: "bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-lg shadow-[#8B5CF6]/25 border border-[#A855F7]/30",
    secondary: "bg-white/10 hover:bg-white/15 text-white border border-white/10",
    outline: "bg-transparent hover:bg-white/5 text-white border border-[#8B5CF6]/40 hover:border-[#8B5CF6]",
    ghost: "bg-transparent hover:bg-white/5 text-[#928A9F] hover:text-white border-transparent",
    danger: "bg-rose-600 hover:bg-rose-700 text-white border border-rose-500/40",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs font-semibold rounded-md",
    md: "px-4 py-2 text-sm font-semibold rounded-lg",
    lg: "px-6 py-3 text-base font-bold rounded-xl",
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      ) : null}
      {children}
    </button>
  );
};


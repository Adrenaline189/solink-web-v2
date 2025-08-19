"use client";

import * as React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Support the classic outline look in addition to existing variants */
  variant?: "secondary" | "ghost" | "outline";
};

export function Button({
  variant = "secondary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

  const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
    secondary:
      "bg-slate-900 text-white border border-slate-800 hover:bg-slate-800 focus:ring-slate-700",
    ghost:
      "bg-transparent text-slate-200 hover:bg-slate-900/50 border border-transparent focus:ring-slate-700",
    outline:
      "bg-transparent text-slate-200 border border-slate-700 hover:bg-slate-900/60 focus:ring-slate-700",
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

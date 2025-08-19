import * as React from "react";
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "secondary" | "ghost" };
export function Button({ variant, className = "", ...rest }: Props) {
  const base = "rounded-2xl px-4 py-2 text-sm font-medium transition";
  const primary = "bg-blue-600 hover:bg-blue-500 text-white";
  const secondary = "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700";
  const ghost = "bg-transparent border border-slate-800 hover:bg-slate-800/40 text-slate-200";
  const style = variant==="secondary" ? secondary : variant==="ghost" ? ghost : primary;
  return <button {...rest} className={`${base} ${style} ${className}`} />;
}

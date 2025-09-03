// components/Aurora.tsx
import React from "react";

type Props = { className?: string; };

export default function Aurora({ className = "" }: Props) {
  return (
    <div className={`aurora ${className}`} aria-hidden="true">
      <div className="aurora__layer aurora__b1" />
      <div className="aurora__layer aurora__b2" />
      <div className="aurora__layer aurora__b3" />
    </div>
  );
}

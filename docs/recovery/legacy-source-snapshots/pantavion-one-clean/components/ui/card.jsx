import * as React from "react";

export function Card({ className = "", children }) {
  return (
    <div
      className={`rounded-xl border border-slate-700 bg-slate-900/50 shadow-md ${className}`}
    >
      {children}
    </div>
  );
}

export function CardContent({ className = "", children }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

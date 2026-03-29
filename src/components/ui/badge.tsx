import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "outline" | "success" | "warning" }) {
  const styles = {
    default: "bg-slate-900 text-white",
    outline: "border border-slate-200 bg-white text-slate-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-800",
  }[variant];

  return (
    <span
      className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-medium", styles, className)}
      {...props}
    />
  );
}

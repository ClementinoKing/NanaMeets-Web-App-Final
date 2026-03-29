import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthCardProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthCard({ eyebrow, title, description, children, footer }: AuthCardProps) {
  return (
    <Card className="overflow-hidden border-white/70 bg-white/88">
      <CardHeader className="space-y-4 border-b border-slate-100/80 bg-white/70">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#e84056,_#f59e0b)] text-sm font-semibold text-white shadow-[0_16px_36px_-20px_rgba(232,64,86,0.95)]">
            NM
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{eyebrow}</p>
            <p className="text-sm font-medium text-slate-700">NanaMeets Web</p>
          </div>
        </div>
        <div className="space-y-2 text-center sm:text-left">
          <CardTitle className="text-3xl tracking-tight sm:text-4xl">{title}</CardTitle>
          <CardDescription className="max-w-md text-sm leading-6 sm:text-base">{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-6">{children}</CardContent>
      {footer ? <div className="border-t border-slate-100 px-6 py-5 text-center">{footer}</div> : null}
    </Card>
  );
}

import type { ReactNode } from "react";

export default function OnboardingLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(233,64,87,0.12),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(15,118,110,0.08),_transparent_24%),linear-gradient(180deg,_#fffdfb_0%,_#f8fafc_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(255,255,255,0.58)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.58)_1px,transparent_1px)] bg-[size:30px_30px] opacity-25" />
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-2xl flex-col justify-center">
        {children}
      </div>
    </main>
  );
}

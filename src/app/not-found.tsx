import Link from "next/link";
import { Heart, Home } from "lucide-react";

export default function NotFound() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#191919] text-white">
      <style>{`
        @keyframes heartPulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.95;
          }
          50% {
            transform: scale(1.08);
            opacity: 1;
          }
        }
      `}</style>
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(255,255,255,0.12),transparent_14%),radial-gradient(circle_at_50%_48%,rgba(233,64,87,0.16),transparent_24%),radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.06),transparent_16%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.05),transparent_14%),radial-gradient(circle_at_50%_80%,rgba(255,255,255,0.04),transparent_18%),linear-gradient(180deg,#191919_0%,#121212_55%,#191919_100%)]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:42px_42px] opacity-18"
        aria-hidden="true"
      />
      <div className="absolute left-10 top-16 h-32 w-32 rounded-full bg-[#E94057]/10 blur-3xl" />
      <div className="absolute right-8 top-24 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
      <div className="absolute bottom-14 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-white/6 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6 py-10">
        <section className="w-full max-w-2xl text-center">
          <div className="mx-auto flex items-center justify-center gap-4 sm:gap-6">
            <span className="text-[8rem] font-black leading-none tracking-[-0.12em] text-white sm:text-[10rem]">
              4
            </span>
            <div className="relative flex h-40 w-40 items-center justify-center sm:h-48 sm:w-48">
              <div className="absolute inset-0 rounded-full bg-white/8 shadow-[0_0_80px_rgba(255,255,255,0.08)] backdrop-blur" />
              <div className="absolute inset-4 rounded-full border border-white/10 bg-white/5" />
              <div className="absolute inset-10 rounded-full bg-white/92 shadow-[0_0_40px_rgba(255,255,255,0.22)]" />
              <Heart
                className="relative h-14 w-14 text-[#E94057]"
                style={{ animation: "heartPulse 1.5s ease-in-out infinite" }}
                fill="currentColor"
              />
            </div>
            <span className="text-[8rem] font-black leading-none tracking-[-0.12em] text-white sm:text-[10rem]">
              4
            </span>
          </div>

          <p className="mt-10 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            This profile is no longer available.
          </p>

          <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-white/65 sm:text-lg">
            The page you&apos;re looking for may have been removed or moved. Let&apos;s get you back
            to NanaMeets.
          </p>

          <div className="mt-10">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#E94057] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_45px_-18px_rgba(233,64,87,0.9)] transition hover:-translate-y-0.5 hover:bg-[#f24f66]"
            >
              <Home className="h-4 w-4" />
              Back home
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

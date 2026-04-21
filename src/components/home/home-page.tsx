"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Download, MessageCircle, Users } from "lucide-react";
import { PwaInstallPrompt } from "@/components/pwa/install-prompt";

const stats = [
  {
    icon: Users,
    value: 2000,
    suffix: "+",
    description: "Active users connecting across Malawi every month",
  },
  {
    icon: CalendarDays,
    value: 250,
    suffix: "+",
    description: "Events hosted and discovered through the platform",
  },
  {
    icon: MessageCircle,
    value: 80000,
    suffix: "+",
    description: "Conversations started, turning connections into real friendships",
  },
  {
    icon: Download,
    value: 2500,
    suffix: "+",
    description: "App installs and growing every week",
  },
] as const;

type AnimatedNumberProps = {
  value: number;
  suffix?: string;
  duration?: number;
};

function AnimatedNumber({ value, suffix = "", duration = 1500 }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const hasAnimatedRef = useRef(false);
  const formatter = useMemo(() => new Intl.NumberFormat("en-US"), []);

  useEffect(() => {
    const node = elementRef.current;
    if (!node) {
      return undefined;
    }

    if (typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const nextValue = Math.floor(progress * value);

      setDisplayValue(nextValue);

      if (progress < 1) {
        frameRef.current = window.requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimatedRef.current) {
          hasAnimatedRef.current = true;
          frameRef.current = window.requestAnimationFrame(animate);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.45 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();

      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [duration, value]);

  useEffect(
    () => () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    },
    []
  );

  return (
    <div ref={elementRef} className="text-3xl font-extrabold tracking-tight text-white" aria-live="polite">
      {formatter.format(displayValue)}
      {suffix}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="antialiased text-gray-100 bg-black overflow-x-hidden snap-y snap-mandatory">
      <style>{`
        html, body {
          background-color: #000000 !important;
          scroll-behavior: smooth;
        }
        .hero-overlay {
          background: linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.72) 62%, rgba(0,0,0,1) 100%);
        }
        .nav-pill {
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .cta-glow {
          box-shadow: 0 8px 30px rgba(233, 64, 87, 0.25);
        }
        .cursive-font {
          font-family: 'Brush Script MT', cursive, 'Dancing Script', cursive;
        }
        .btn-primary {
          background: linear-gradient(135deg, #E94057 0%, #ff6b7a 100%);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(233, 64, 87, 0.4);
        }
        .store-btn {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .store-btn:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        .text-glow {
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
        }
        .nav-link {
          position: relative;
          transition: all 0.3s ease;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 2px;
          background: #E94057;
          transition: width 0.3s ease;
        }
        .nav-link:hover::after {
          width: 100%;
        }
      `}</style>

      <header className="relative min-h-screen overflow-hidden snap-start bg-black">
        <div className="absolute inset-0">
          <Image
            src="/images/hero_img.png"
            alt="Nana Meets hero image"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
        </div>
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(233,64,87,0.3),transparent_28%),radial-gradient(circle_at_20%_30%,rgba(239,168,69,0.18),transparent_25%),linear-gradient(180deg,rgba(8,8,8,0.72)_0%,rgba(0,0,0,0.92)_100%)]"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:32px_32px] opacity-10"
          aria-hidden="true"
        />

        <nav className="relative z-30 px-6 py-6">
          <div className="hidden md:flex items-center justify-center">
            <div className="nav-pill flex w-4/5 items-center justify-between rounded-full bg-white/10 px-8 py-4 mx-auto">
              <Link href="/" className="flex items-center" aria-label="NanaMeets home">
                <Image
                  src="/Nanameets_L.svg"
                  alt="Nana Meets"
                  width={190}
                  height={52}
                  className="h-12 w-auto"
                  priority
                />
              </Link>

              <div className="flex items-center gap-8">
                <Link href="/privacy" className="nav-link font-semibold text-white/80 hover:text-white">
                  Privacy
                </Link>
                <Link href="/terms" className="nav-link font-semibold text-white/80 hover:text-white">
                  Terms
                </Link>
                <Link
                  href="/login"
                  className="btn-primary ml-4 inline-block rounded-full px-6 py-2 font-semibold text-white shadow-lg"
                >
                  Join Today!
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="relative z-30 flex min-h-[65vh] items-center justify-center px-6 pt-16 md:items-start md:pt-[28rem]">
          <div className="relative z-30 max-w-3xl px-0 text-center sm:px-8 lg:px-0" data-aos="fade-up">
            <div className="mb-8 md:hidden">
              <Image
                src="/Nanameets.svg"
                alt="Nana Meets"
                width={360}
                height={120}
                className="mx-auto h-40 w-auto"
                priority
              />
            </div>

            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-glow sm:text-5xl md:text-6xl">
              <span className="block">
                Swipe, Match, <span className="text-rose-400">Connect.</span>
              </span>
            </h1>

            <p className="mx-auto mt-8 max-w-2xl text-lg font-medium leading-relaxed text-white/90 sm:text-xl">
              Nana Meets helps you find real connections nearby. It&apos;s safe, simple, and built for
              people who want meaningful dates, not endless matching.
            </p>

            <div className="mt-12 flex flex-col items-center justify-center gap-6">
              <Link
                href="#download"
                className="btn-primary cta-glow inline-flex items-center justify-center rounded-full px-12 py-5 text-lg font-semibold text-white shadow-2xl"
              >
                Get the app
              </Link>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent" />
      </header>

      <section
        id="stats"
        className="relative flex min-h-screen snap-start items-center justify-center overflow-hidden bg-black px-6 py-20 text-white"
      >
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute -left-24 -top-24 h-[36rem] w-[36rem] rounded-full bg-rose-500/15 blur-[180px]" />
        </div>

        <div className="relative z-10 w-full">
          <div className="mx-auto mb-12 max-w-5xl text-center">
            <p className="mb-4 text-sm uppercase tracking-[0.4em] text-white/60">Community Impact</p>
            <h2 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
              Trusted by thousands building real connections
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-base text-white/75 sm:text-lg">
              Strong engagement across the Nana Meets ecosystem shows how real people, events, and
              businesses thrive together.
            </p>
          </div>

          <div className="relative mx-auto mt-6 max-w-5xl px-2 sm:px-4">
            <div
              className="absolute inset-x-8 -top-10 h-32 bg-gradient-to-b from-white/15 via-white/5 to-transparent blur-3xl opacity-60"
              aria-hidden="true"
            />
            <div className="relative rounded-[32px] border border-white/10 bg-white/5 shadow-[0_28px_80px_-26px_rgba(0,0,0,0.85)] backdrop-blur-[18px]">
              <div className="grid grid-cols-1 gap-x-10 gap-y-8 px-8 py-10 sm:grid-cols-2 sm:px-10 lg:grid-cols-4">
                {stats.map(({ icon: Icon, value, suffix, description }) => (
                  <div key={description} className="flex flex-col items-center space-y-4 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/12 shadow-inner shadow-black/40">
                      <Icon className="h-7 w-7" aria-hidden="true" />
                    </div>
                    <div>
                      <AnimatedNumber value={value} suffix={suffix} />
                      <p className="mt-2 text-sm font-medium leading-relaxed text-white/75 sm:text-[15px]">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="download"
        className="relative flex min-h-screen snap-start items-center justify-center overflow-hidden bg-black px-6 py-16 text-white"
      >
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div
            className="absolute bottom-0 left-0 h-[48rem] w-[48rem] rounded-full bg-[#E94057]/20 blur-[200px]"
          />
          <div className="absolute -right-48 -top-48 h-[48rem] w-[48rem] rounded-full bg-yellow-500/20 blur-[200px]" />
        </div>

        <div className="relative z-10 px-6 py-16 text-center">
          <h2 className="mb-16 text-3xl font-bold leading-tight sm:text-4xl md:text-6xl">
            <span className="block">Download the app</span>
            <span className="block">and start connecting</span>
          </h2>

          <div className="mx-auto mb-10 max-w-3xl">
            <PwaInstallPrompt variant="banner" />
          </div>

          <div className="mb-12 flex flex-col items-center justify-center gap-8 sm:flex-row">
            <a
              href="https://play.google.com/store/apps/details?id=com.nanameets.nanameets&hl=en-US&pli=1"
              target="_blank"
              rel="noopener noreferrer"
              className="store-btn inline-flex items-center gap-4 rounded-full bg-white px-10 py-5 shadow-xl"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" className="text-gray-800" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"
                />
              </svg>
              <div className="text-left">
                <div className="text-xs font-medium text-gray-500">GET IT ON</div>
                <div className="text-lg font-bold text-black">Google Play</div>
              </div>
            </a>

            <div className="relative">
              <div className="store-btn inline-flex cursor-not-allowed items-center gap-4 rounded-full bg-white px-10 py-5 opacity-60 shadow-xl">
                <svg width="28" height="28" viewBox="0 0 24 24" className="text-gray-800" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z"
                  />
                </svg>
                <div className="text-left">
                  <div className="text-xs font-medium text-gray-500">Download on the</div>
                  <div className="text-lg font-bold text-black">App Store</div>
                </div>
              </div>
              <div className="absolute -right-2 -top-2 rounded-full border-2 border-white bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                Coming Soon
              </div>
            </div>
          </div>

          <div className="py-16 pt-24 text-center">
            <div className="mb-4 flex flex-col items-center justify-center gap-6 md:flex-row">
              <div className="flex items-center gap-6">
                <Link href="/privacy" className="text-xl text-white transition-colors hover:underline">
                  Privacy
                </Link>
                <Link href="/terms" className="text-xl text-white transition-colors hover:underline">
                  Terms of Use
                </Link>
                <Link href="#help" className="text-xl text-white transition-colors hover:underline">
                  Help
                </Link>
              </div>
            </div>

            <div className="text-center">
              <p className="mb-2 text-lg text-gray-300">
                © 2025 Nana Meets. By{" "}
                <a
                  href="https://paliponse.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-white underline transition-colors hover:text-gray-300"
                >
                  Paliponse Technologies
                </a>
                . All rights reserved.
              </p>
              <p className="flex items-center justify-center pt-2 text-lg">
                <span className="mr-3 inline-flex items-center text-[#E94057]">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <a
                  href="mailto:hello@nanameets.com"
                  className="inline-block rounded-full bg-white/10 px-4 py-2 font-semibold text-white transition-all duration-300 hover:scale-105 hover:bg-white/20"
                >
                  hello@nanameets.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

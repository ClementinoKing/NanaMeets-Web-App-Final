"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type MobileNavItem = {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
};

const NAV_ITEMS: MobileNavItem[] = [
  { href: "/dashboard", label: "Home", icon: "/svg/Home.svg", exact: true },
  { href: "/dashboard/discover", label: "Explore", icon: "/svg/Explore.svg" },
  { href: "/dashboard/likes", label: "Likes", icon: "/svg/Likes.svg" },
  { href: "/dashboard/inbox", label: "Chats", icon: "/svg/Messages.svg" },
  { href: "/dashboard/profile", label: "Profile", icon: "/svg/Profile.svg" },
];

function isActivePath(pathname: string, item: MobileNavItem) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[linear-gradient(180deg,rgba(10,10,10,0.72),rgba(5,5,5,0.96))] px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur-xl md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1 rounded-[1.6rem] border border-white/10 bg-white/[0.04] px-1.5 py-1.5 shadow-[0_-12px_40px_rgba(0,0,0,0.35)]">
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item);

          return (
            <Link
              key={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 rounded-[1.05rem] px-1 py-2 text-[0.64rem] font-semibold tracking-[0.18em] transition",
                active ? "bg-[#ff5f7d]/15 text-white shadow-[0_10px_22px_rgba(255,95,125,0.15)]" : "text-white/55 hover:bg-white/5 hover:text-white/85",
              )}
              href={item.href}
            >
              <span
                className={cn(
                  "flex items-center justify-center transition",
                  active ? "h-10 w-10 rounded-[1rem] bg-[#ff5f7d]/18" : "h-7 w-7 rounded-none bg-transparent",
                )}
              >
                <Image
                  alt=""
                  aria-hidden="true"
                  className={cn(
                    "select-none object-contain brightness-0 invert",
                    active ? "h-5 w-5 opacity-100" : "h-5 w-5 opacity-70",
                  )}
                  height={20}
                  src={item.icon}
                  width={20}
                />
              </span>
              <span className="text-[0.58rem] uppercase tracking-[0.18em]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

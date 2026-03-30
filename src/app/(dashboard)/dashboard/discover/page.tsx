import Image from "next/image";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const exploreCards = [
  {
    title: "Hangout Hubs",
    description: "Join casual meetups, shared spaces, and community moments.",
    imageSrc: "/images/disco-ball.png",
    imageAlt: "Disco ball for Hangout Hubs",
  },
  {
    title: "Event Links",
    description: "Discover events, socials, and places to connect in real life.",
    imageSrc: "/images/red-carpet.png",
    imageAlt: "Red carpet for Event Links",
  },
] as const;

export default async function DiscoverPage() {
  const { supabase, user } = await getServerAuthSession();

  if (!user || !supabase) {
    redirect("/login");
  }

  return (
    <section className="min-h-[calc(100vh-2rem)] bg-[#0c0c0c] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <header className="pt-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">Let&apos;s Explore</h1>
          <p className="mt-3 max-w-2xl text-lg leading-8 text-white/65 sm:text-xl">
            Match with people through Hangout Hubs, Event Links, and shared relationship goals.
          </p>
        </header>

        <div className="grid gap-6">
          {exploreCards.map((card) => (
            <article
              key={card.title}
              className="flex min-h-[280px] flex-col items-center justify-center rounded-[2rem] border-2 border-[#e44d69] bg-[#23161a] px-8 py-10 text-center shadow-[0_18px_45px_rgba(0,0,0,0.35)] transition-transform duration-200 hover:-translate-y-0.5 hover:border-[#ff5f7d]"
            >
              <div className="relative h-28 w-28 sm:h-32 sm:w-32">
                <Image
                  alt={card.imageAlt}
                  className="object-contain"
                  fill
                  priority
                  sizes="(max-width: 640px) 112px, 128px"
                  src={card.imageSrc}
                />
              </div>

              <h2 className="mt-6 text-2xl font-semibold tracking-tight text-white sm:text-[2rem]">
                {card.title}
              </h2>
              <p className="mt-3 max-w-md text-base leading-7 text-white/65 sm:text-lg">{card.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

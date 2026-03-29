import Image from "next/image";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageComposer } from "@/components/dashboard/message-composer";
import { getServerAuthSession } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const { supabase, user } = await getServerAuthSession();

  if (!user || !supabase) {
    redirect("/login");
  }

  const [{ data: profile }, { data: people }] = await Promise.all([
    supabase
      .from("profile")
      .select("f_name,email,city,area,bio,interests,profile_pic")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("profile")
      .select("user_id,f_name,email,city,area,bio,interests,profile_pic")
      .neq("user_id", user.id)
      .limit(8),
  ]);

  const interests = profile?.interests ?? [];

  return (
    <section className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Discover</CardTitle>
          <CardDescription>
            Browse profiles from the shared NanaMeets database and start a conversation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-3xl bg-slate-950 p-5 text-white">
            <p className="text-sm uppercase tracking-[0.24em] text-white/60">Your identity</p>
            <p className="mt-2 text-xl font-semibold">{profile?.f_name ?? user.email}</p>
            <p className="mt-2 text-sm text-white/70">{profile?.bio ?? "Set up your bio in Settings."}</p>
            <p className="mt-4 text-sm text-white/70">{[profile?.city, profile?.area].filter(Boolean).join(" · ") || "Add a city or area to make the profile feel local."}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700">Your interests</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {interests.length ? (
                interests.map((interest) => (
                  <span key={interest} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
                    {interest}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-500">Add interests in Settings to personalize your profile.</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {(people ?? []).map((person) => (
              <Card key={person.user_id} className="bg-white/90">
                <CardContent className="space-y-3 px-5 py-5">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                      {person.profile_pic ? (
                        <Image
                          alt={person.f_name ?? "Profile"}
                          className="object-cover"
                          fill
                          loading="lazy"
                          sizes="44px"
                          src={person.profile_pic}
                        />
                      ) : (
                        (person.f_name ?? "NM").slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-950">{person.f_name ?? "NanaMeets member"}</p>
                      <p className="text-xs text-slate-500">{[person.city, person.area].filter(Boolean).join(" · ") || "Location not set"}</p>
                    </div>
                  </div>
                  <p className="line-clamp-3 text-sm leading-6 text-slate-600">{person.bio ?? "No bio yet."}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Start a message</CardTitle>
          <CardDescription>Send a direct message using a recipient email or user ID.</CardDescription>
        </CardHeader>
        <CardContent>
          <MessageComposer />
        </CardContent>
      </Card>
    </section>
  );
}

import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { getServerAuthSession } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { supabase, user } = await getServerAuthSession();

  if (!user || !supabase) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profile")
    .select("id,user_id,f_name,email,gender,city,area,bio,relationship_goals,interests,height,comu_style,love_style,education,zodiac,drinking,smoking,workout,pets,job_title,company,profile_pic,picture2,picture3,created_at")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Manage the profile data that powers your NanaMeets user platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-6 text-slate-600">
          <p>
            This form edits the <code className="rounded bg-slate-100 px-1.5 py-0.5">profile</code> row tied to your account.
          </p>
          <p>
            Supabase RLS keeps it private to you while the mobile app and web app both read the same
            row.
          </p>
          <div className="rounded-3xl border border-slate-200 bg-white p-4 text-slate-700">
            <p className="font-medium text-slate-950">Current account</p>
            <p>{profile?.email ?? user.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edit profile</CardTitle>
          <CardDescription>Keep your name, location, interests, and profile details current.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm userId={user.id} email={user.email ?? ""} profile={profile} />
        </CardContent>
      </Card>
    </section>
  );
}

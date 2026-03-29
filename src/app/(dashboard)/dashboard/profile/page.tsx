import { redirect } from "next/navigation";
import { ProfileEditor } from "@/components/dashboard/profile-editor";
import { loadCurrentProfile } from "@/lib/current-profile";
import { getServerAuthSession } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { supabase, user } = await getServerAuthSession();

  if (!user || !supabase) {
    redirect("/login");
  }

  const { profile } = await loadCurrentProfile(supabase, {
    email: user.email ?? null,
    userId: user.id,
  });

  return <ProfileEditor email={user.email ?? ""} profile={profile} userId={user.id} />;
}

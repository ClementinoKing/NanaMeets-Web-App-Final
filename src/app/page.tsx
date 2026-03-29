import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/supabase/server";
import HomePage from "@/components/home/home-page";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { supabase, user } = await getServerAuthSession();

  if (user && supabase) {
    const { data: profile } = await supabase
      .from("profile")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    redirect(profile ? "/dashboard" : "/create-profile");
  }

  return <HomePage />;
}

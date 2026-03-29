import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export const dynamic = "force-dynamic";

export default async function CreateProfilePage() {
  const { supabase, user } = await getServerAuthSession();

  if (!user || !supabase) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profile")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile) {
    redirect("/dashboard");
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col px-1 py-2 sm:px-0">
      <header className="mt-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Let&apos;s Get You Started
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
          Complete a few quick steps to finish your profile.
        </p>
      </header>

      <div className="mt-8">
        <OnboardingWizard userId={user.id} email={user.email ?? ""} />
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Trash2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Delete Your NanaMeets Account",
  description:
    "Public account deletion page for NanaMeets with instructions on how to request deletion.",
  robots: {
    index: false,
    follow: true,
  },
};

export const dynamic = "force-static";

const deletionSteps = [
  "Open the app and choose Delete Account.",
  "Confirm the deletion action.",
  "Your account and profile will be deleted.",
];

export default function DeleteAccountPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(233,64,87,0.14),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(15,118,110,0.08),_transparent_24%),linear-gradient(180deg,_#fffdfb_0%,_#f8fafc_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(255,255,255,0.55)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.55)_1px,transparent_1px)] bg-[size:30px_30px] opacity-30" />
      <div className="absolute left-0 top-0 -z-10 h-80 w-80 rounded-full bg-[#E94057]/15 blur-3xl" />
      <div className="absolute bottom-0 right-0 -z-10 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl flex-col justify-center">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/85 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.28)] backdrop-blur">
          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="p-8 sm:p-10 lg:p-12">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#E94057]/15 bg-[#E94057]/10 px-4 py-2 text-sm font-semibold text-[#B53045]">
                <ShieldCheck className="h-4 w-4" />
                Official account deletion page
              </div>

              <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Delete your NanaMeets account
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                This page is public, read-only, and available from anywhere. If you delete your
                NanaMeets account, your account will be deleted.
              </p>

              <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start gap-3">
                  <Trash2 className="mt-0.5 h-5 w-5 text-teal-700" />
                  <div>
                    <p className="font-semibold text-slate-900">What happens when you delete it</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Your profile and account data will be removed, except where retention is
                      required for legal, security, or financial recordkeeping purposes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h2 className="text-xl font-semibold text-slate-900">How to request deletion</h2>
                <ol className="mt-4 space-y-4">
                  {deletionSteps.map((step, index) => (
                    <li key={step} className="flex gap-4 rounded-2xl border border-slate-200 p-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E94057] text-sm font-bold text-white">
                        {index + 1}
                      </div>
                      <p className="pt-1 text-sm leading-6 text-slate-700">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/privacy"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50"
                >
                  Review privacy policy
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <aside className="border-t border-slate-200 bg-slate-50 p-8 sm:p-10 lg:border-l lg:border-t-0 lg:p-12">
              <div className="rounded-[1.5rem] border border-white bg-white p-6 shadow-sm">
                <div className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  Required details
                </div>

                <div className="mt-5 space-y-4 text-sm leading-6 text-slate-600">
                  <p>To help us verify the request, include:</p>
                  <ul className="space-y-3">
                    <li className="rounded-xl bg-slate-50 px-4 py-3">
                      Full name on the account
                    </li>
                    <li className="rounded-xl bg-slate-50 px-4 py-3">
                      Email address or phone number used to sign up
                    </li>
                    <li className="rounded-xl bg-slate-50 px-4 py-3">
                      A short note confirming that you want the account deleted
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-900 p-6 text-white">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/65">
                  Page status
                </p>
                <p className="mt-3 text-lg font-semibold">Active and publicly accessible</p>
                <p className="mt-2 text-sm leading-6 text-white/75">
                  This route is intentionally read-only so it can satisfy account deletion policy
                  checks and be reached from inside the app.
                </p>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

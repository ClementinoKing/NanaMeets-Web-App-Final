import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function SubscriptionReturnPage({
  searchParams,
}: Readonly<{
  searchParams?: Record<string, string | string[] | undefined>;
}>) {
  const status = typeof searchParams?.status === "string" ? searchParams.status : "failed";

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,90,116,0.18),_transparent_30%),linear-gradient(180deg,#09090b_0%,#111827_100%)] px-4 py-10 text-white">
      <Card className="w-full max-w-xl border-white/10 bg-white/5 text-white shadow-[0_30px_120px_-64px_rgba(0,0,0,0.85)]">
        <CardHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
            <AlertTriangle className="h-6 w-6 text-amber-300" />
          </div>
          <CardTitle className="text-2xl text-white">
            {status === "failed" ? "Payment did not complete" : "Payment cancelled"}
          </CardTitle>
          <CardDescription className="text-white/70">
            PayChangu returned you from checkout before the subscription could be activated.
            You can try again whenever you are ready.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ff5a74] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#e84a66]"
            href="/dashboard/subscription"
          >
            <RefreshCw className="h-4.5 w-4.5" />
            Try another plan
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

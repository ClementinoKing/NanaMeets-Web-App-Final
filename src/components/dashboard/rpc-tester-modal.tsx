"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getOppositeGenderFilter, type GenderFilter } from "@/lib/gender-filter";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type RpcName = "get_unswiped_users2" | "get_unswiped_users";

interface RpcTesterModalProps {
  userId: string;
  currentGender: string | null;
  currentLat: number | null;
  currentLng: number | null;
}

export function RpcTesterModal({
  userId,
  currentGender,
  currentLat,
  currentLng,
}: RpcTesterModalProps) {
  const supabase = getSupabaseBrowserClient();
  const [isOpen, setIsOpen] = useState(false);
  const [rpcName, setRpcName] = useState<RpcName>("get_unswiped_users2");
  const [useCoords, setUseCoords] = useState(true);
  const [useGenderFilter, setUseGenderFilter] = useState(true);
  const [limitCount, setLimitCount] = useState("24");
  const [minAge, setMinAge] = useState("18");
  const [maxAge, setMaxAge] = useState("60");
  const [manualLat, setManualLat] = useState(currentLat?.toString() ?? "");
  const [manualLng, setManualLng] = useState(currentLng?.toString() ?? "");
  const [status, setStatus] = useState<string>("Idle");
  const [result, setResult] = useState<string>("Run the RPC to inspect the response.");
  const [filterGender, setFilterGender] = useState<GenderFilter>(getOppositeGenderFilter(currentGender));

  const effectiveParams = useMemo(() => {
    const latitude = useCoords ? currentLat : Number(manualLat);
    const longitude = useCoords ? currentLng : Number(manualLng);

    return {
      current_lat: Number.isFinite(latitude) ? (latitude as number) : null,
      current_lng: Number.isFinite(longitude) ? (longitude as number) : null,
      current_user_id: userId,
      filter_gender: useGenderFilter ? filterGender || null : null,
      limit_count: Number(limitCount) || 24,
      min_age: Number(minAge) || 18,
      max_age: Number(maxAge) || 60,
    };
  }, [
    currentLat,
    currentLng,
    filterGender,
    limitCount,
    manualLat,
    manualLng,
    maxAge,
    minAge,
    useCoords,
    useGenderFilter,
    userId,
  ]);

  const runRpc = async () => {
    if (!supabase) {
      setStatus("Supabase client unavailable");
      setResult("");
      return;
    }

    setStatus(`Running ${rpcName}...`);
    setResult(JSON.stringify(effectiveParams, null, 2));

    const { data, error } = await supabase.rpc(rpcName, effectiveParams as never);

    if (error) {
      setStatus(`Error ${error.code ?? ""}`.trim());
      setResult(JSON.stringify(error, null, 2));
      return;
    }

    const rows = Array.isArray(data) ? data : [];
    setStatus(`Success: ${rows.length} row(s)`);
    setResult(JSON.stringify(rows, null, 2));
  };

  return (
    <>
      <Button
        className="fixed bottom-4 right-4 z-[60] rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white shadow-[0_18px_40px_rgba(15,23,42,0.28)] hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        Test RPC
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.24)] dark:border-white/10 dark:bg-[#0c0c0c]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-white/10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-white/35">
                  RPC tester
                </p>
                <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
                  Run swipe RPC
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-white/55">
                  Use this to inspect the raw response from Supabase.
                </p>
              </div>
              <button
                className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-500 transition hover:bg-slate-50 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                Close
              </button>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-white/75">RPC name</span>
                    <select
                      className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-slate-900/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
                      value={rpcName}
                      onChange={(event) => setRpcName(event.target.value as RpcName)}
                    >
                      <option value="get_unswiped_users2">get_unswiped_users2</option>
                      <option value="get_unswiped_users">get_unswiped_users</option>
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-white/75">Limit</span>
                    <Input value={limitCount} onChange={(event) => setLimitCount(event.target.value)} />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-white/75">Min age</span>
                    <Input value={minAge} onChange={(event) => setMinAge(event.target.value)} />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-white/75">Max age</span>
                    <Input value={maxAge} onChange={(event) => setMaxAge(event.target.value)} />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-white/75">Gender filter</span>
                    <select
                      className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-slate-900/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
                      value={filterGender}
                      onChange={(event) => setFilterGender(event.target.value as "Male" | "Female" | "")}
                    >
                      <option value="">Any</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-white/75">Coords</span>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={manualLat}
                        onChange={(event) => setManualLat(event.target.value)}
                        disabled={useCoords}
                        placeholder="lat"
                      />
                      <Input
                        value={manualLng}
                        onChange={(event) => setManualLng(event.target.value)}
                        disabled={useCoords}
                        placeholder="lng"
                      />
                    </div>
                  </label>
                </div>

                <div className="flex flex-wrap gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-white/65">
                    <input
                      checked={useCoords}
                      onChange={(event) => setUseCoords(event.target.checked)}
                      type="checkbox"
                    />
                    Use profile coords
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-white/65">
                    <input
                      checked={useGenderFilter}
                      onChange={(event) => setUseGenderFilter(event.target.checked)}
                      type="checkbox"
                    />
                    Apply gender filter
                  </label>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={runRpc} type="button">
                    Run RPC
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRpcName("get_unswiped_users2");
                      setUseCoords(true);
                      setUseGenderFilter(true);
                      setLimitCount("24");
                      setMinAge("18");
                      setMaxAge("60");
                      setFilterGender(getOppositeGenderFilter(currentGender));
                      setManualLat(currentLat?.toString() ?? "");
                      setManualLng(currentLng?.toString() ?? "");
                      setStatus("Reset");
                      setResult("Run the RPC to inspect the response.");
                    }}
                    type="button"
                  >
                    Reset
                  </Button>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-white/55">
                  Current user: <span className="font-semibold">{userId}</span>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-white/55">
                  Status: <span className="font-semibold">{status}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white dark:border-white/10">
                  Raw response
                </div>
                <Textarea
                  className="min-h-[440px] font-mono text-xs leading-6"
                  readOnly
                  value={result}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

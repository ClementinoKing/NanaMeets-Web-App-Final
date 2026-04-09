"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const confirmPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be 72 characters or fewer"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type ConfirmPasswordValues = z.infer<typeof confirmPasswordSchema>;
type ConfirmMode = "checking" | "recovery" | "invalid";

export function ResetPasswordConfirmForm() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [mode, setMode] = useState<ConfirmMode>("checking");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordForm = useForm<ConfirmPasswordValues>({
    resolver: zodResolver(confirmPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isActive = true;

    const bootstrapRecoveryState = async () => {
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (!isActive) {
          return;
        }

        if (error) {
          setMode("invalid");
          return;
        }

        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
        setMode("recovery");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isActive) {
        return;
      }

      setMode(session ? "recovery" : "invalid");
    };

    void bootstrapRecoveryState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isActive) {
        return;
      }

      if (event === "PASSWORD_RECOVERY" && session) {
        setMode("recovery");
      }
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const onUpdatePassword = async (values: ConfirmPasswordValues) => {
    if (!supabase) {
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (error) {
      toast.error("We could not update your password. Try the link again.");
      return;
    }

    await supabase.auth.signOut();
    router.replace("/login?reset=1");
    router.refresh();
  };

  if (!supabase) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
        Set the Supabase environment variables to enable password recovery.
      </div>
    );
  }

  if (mode === "checking") {
    return (
      <div className="flex items-center justify-center gap-3 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking your reset link...
      </div>
    );
  }

  if (mode === "invalid") {
    return (
      <div className="grid gap-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm leading-6 text-slate-600 shadow-sm">
          This password reset link is missing or expired. Please request a fresh one from the reset page.
        </div>
        <Button
          className="h-12 w-full rounded-2xl border-0 bg-[linear-gradient(135deg,_#e84056,_#f38aa0)] text-base font-semibold text-white shadow-[0_16px_36px_-18px_rgba(232,64,86,0.95)] transition hover:translate-y-[-1px] hover:opacity-95"
          onClick={() => router.replace("/resetPassword")}
          type="button"
        >
          Go to Reset Page
        </Button>
      </div>
    );
  }

  return (
    <form className="grid gap-4" onSubmit={passwordForm.handleSubmit(onUpdatePassword)}>
      <div className="rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm leading-6 text-slate-600 shadow-sm">
        Choose a strong new password for your account.
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">New Password</span>
        <div className="relative">
          <Input
            autoComplete="new-password"
            className="pr-12"
            placeholder="New Password"
            type={showPassword ? "text" : "password"}
            {...passwordForm.register("password")}
          />
          <button
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 transition hover:text-slate-950"
            onClick={() => setShowPassword((current) => !current)}
            type="button"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {passwordForm.formState.errors.password ? (
          <span className="text-sm text-[#c2410c]">{passwordForm.formState.errors.password.message}</span>
        ) : null}
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">Confirm New Password</span>
        <div className="relative">
          <Input
            autoComplete="new-password"
            className="pr-12"
            placeholder="Confirm New Password"
            type={showConfirmPassword ? "text" : "password"}
            {...passwordForm.register("confirmPassword")}
          />
          <button
            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 transition hover:text-slate-950"
            onClick={() => setShowConfirmPassword((current) => !current)}
            type="button"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {passwordForm.formState.errors.confirmPassword ? (
          <span className="text-sm text-[#c2410c]">
            {passwordForm.formState.errors.confirmPassword.message}
          </span>
        ) : null}
      </label>

      <Button
        className="h-12 w-full rounded-2xl border-0 bg-[linear-gradient(135deg,_#e84056,_#f38aa0)] text-base font-semibold text-white shadow-[0_16px_36px_-18px_rgba(232,64,86,0.95)] transition hover:translate-y-[-1px] hover:opacity-95"
        disabled={passwordForm.formState.isSubmitting}
        type="submit"
      >
        {passwordForm.formState.isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LockKeyhole className="h-4 w-4" />
        )}
        {passwordForm.formState.isSubmitting ? "Updating..." : "Update Password"}
      </Button>
    </form>
  );
}

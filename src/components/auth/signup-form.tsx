"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { signupSchema, type SignupValues } from "@/lib/validators/auth";

export function SignupForm() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      acceptedTerms: false,
    },
  });

  if (!supabase) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Set the Supabase environment variables to enable account creation.
      </div>
    );
  }

  const onGoogleSignIn = async () => {
    setFormError(null);
    setIsGoogleLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setFormError("We could not start Google sign-in right now.");
      setIsGoogleLoading(false);
    }
  };

  const onSubmit = async (values: SignupValues) => {
    setFormError(null);

    const nameFromEmail = values.email.split("@")[0]?.replace(/[._-]+/g, " ").trim() || "NanaMeets User";
    const fullName = nameFromEmail
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      const message = error.message.toLowerCase();

      if (message.includes("already registered") || message.includes("already exists")) {
        form.setError("email", {
          type: "manual",
          message: "An account with this email already exists.",
        });
      } else {
        setFormError(error.message);
      }

      return;
    }

    if (data.session) {
      router.replace("/create-profile");
      router.refresh();
      return;
    }

    form.reset();
    router.replace("/login?registered=1");
    router.refresh();
  };

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">Email</span>
        <Input autoComplete="email" placeholder="Email" type="email" {...form.register("email")} />
        {form.formState.errors.email ? (
          <span className="text-sm text-[#c2410c]">{form.formState.errors.email.message}</span>
        ) : null}
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">Password</span>
        <div className="relative">
          <Input
            autoComplete="new-password"
            className="pr-12"
            placeholder="Password"
            type={showPassword ? "text" : "password"}
            {...form.register("password")}
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
        {form.formState.errors.password ? (
          <span className="text-sm text-[#c2410c]">{form.formState.errors.password.message}</span>
        ) : null}
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">Confirm Password</span>
        <div className="relative">
          <Input
            autoComplete="new-password"
            className="pr-12"
            placeholder="Confirm Password"
            type={showConfirmPassword ? "text" : "password"}
            {...form.register("confirmPassword")}
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
        {form.formState.errors.confirmPassword ? (
          <span className="text-sm text-[#c2410c]">{form.formState.errors.confirmPassword.message}</span>
        ) : null}
      </label>

      <label className="flex items-center gap-3 rounded-2xl border border-transparent px-1 py-1 text-sm text-slate-600">
        <input
          className="h-5 w-5 rounded border-slate-300 text-rose-500 accent-rose-500 focus:ring-rose-500"
          type="checkbox"
          {...form.register("acceptedTerms")}
        />
        <span>
          I agree to the{" "}
          <span className="font-semibold text-rose-500">Terms and Conditions</span>
        </span>
      </label>
      {form.formState.errors.acceptedTerms ? (
        <span className="text-sm text-[#c2410c]">{form.formState.errors.acceptedTerms.message}</span>
      ) : null}

      {formError ? <p className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-800">{formError}</p> : null}

      <Button
        className="h-12 w-full rounded-2xl border-0 bg-[linear-gradient(135deg,_#e84056,_#f38aa0)] text-base font-semibold text-white shadow-[0_16px_36px_-18px_rgba(232,64,86,0.95)] transition hover:translate-y-[-1px] hover:opacity-95"
        disabled={form.formState.isSubmitting}
        type="submit"
      >
        {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
        {form.formState.isSubmitting ? "Signing up..." : "Sign Up"}
      </Button>

      <div className="flex items-center gap-4 py-2">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-sm text-slate-500">or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <Button
        className="h-12 w-full rounded-2xl border border-slate-300 bg-white text-base font-semibold text-slate-700 shadow-[0_10px_26px_-20px_rgba(15,23,42,0.35)] transition hover:bg-slate-50"
        disabled={isGoogleLoading}
        onClick={onGoogleSignIn}
        type="button"
        variant="outline"
      >
        {isGoogleLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <GoogleMark />
        )}
        Continue with Google
      </Button>
    </form>
  );
}

function GoogleMark() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.23c0-.78-.07-1.53-.2-2.26H12v4.28h5.92a5.09 5.09 0 0 1-2.21 3.34v2.78h3.57c2.08-1.92 3.28-4.75 3.28-8.14Z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.78c-.99.66-2.22 1.06-3.71 1.06-2.85 0-5.27-1.93-6.14-4.52H2.19v2.84A11 11 0 0 0 12 23Z"
        fill="#34A853"
      />
      <path
        d="M5.86 14.1a6.58 6.58 0 0 1 0-4.2V7.06H2.19a11.01 11.01 0 0 0 0 9.88l3.67-2.84Z"
        fill="#FBBC05"
      />
      <path
        d="M12 4.79c1.62 0 3.07.56 4.22 1.65l3.16-3.16C17.46 1.59 14.97.5 12 .5A10.98 10.98 0 0 0 2.19 7.06l3.67 2.84C6.73 6.72 9.15 4.79 12 4.79Z"
        fill="#EA4335"
      />
    </svg>
  );
}

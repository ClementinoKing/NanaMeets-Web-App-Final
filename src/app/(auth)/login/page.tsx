import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

interface LoginPageProps {
  searchParams?: Promise<{
    registered?: string;
    error?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const registered = resolvedSearchParams.registered === "1";
  const oauthError = resolvedSearchParams.error === "oauth";

  return (
    <section className="mx-auto flex w-full max-w-md flex-col px-1 py-2 sm:px-0">
      <div className="mt-8 flex justify-center">
        <Image
          alt="NanaMeets"
          className="h-auto w-[96px] select-none sm:w-[108px]"
          height={110}
          priority
          src="/Nanameets.svg"
          width={300}
        />
      </div>

      <header className="mt-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Login to continue
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
          Access your account to continue connecting.
        </p>
      </header>

      <div className="mt-8">
        <LoginForm oauthError={oauthError} registered={registered} />
      </div>

      <p className="mt-8 text-center text-sm text-slate-600">
        Don&apos;t have an account?{" "}
        <Link className="font-semibold text-rose-500 transition hover:text-rose-600" href="/signup">
          Sign Up
        </Link>
      </p>
    </section>
  );
}

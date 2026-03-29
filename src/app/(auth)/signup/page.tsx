import Image from "next/image";
import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
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
          Let&apos;s Get You Started
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
          Fill in your info. Your soulmate is waiting.
        </p>
      </header>

      <div className="mt-8">
        <SignupForm />
      </div>

      <p className="mt-8 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link className="font-semibold text-rose-500 transition hover:text-rose-600" href="/login">
          Sign In
        </Link>
      </p>
    </section>
  );
}

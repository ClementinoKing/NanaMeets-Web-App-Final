import Image from "next/image";
import { ResetPasswordBackLink } from "@/components/auth/reset-password-back-link";
import { ResetPasswordConfirmForm } from "@/components/auth/reset-password-confirm-form";

export default function ResetPasswordConfirmPage() {
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
          Confirm your password
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
          Use the link from your email to choose a new password.
        </p>
      </header>

      <div className="mt-8">
        <ResetPasswordConfirmForm />
      </div>

      <p className="mt-8 text-center text-sm text-slate-600">
        Remembered it?{" "}
        <ResetPasswordBackLink />
      </p>
    </section>
  );
}

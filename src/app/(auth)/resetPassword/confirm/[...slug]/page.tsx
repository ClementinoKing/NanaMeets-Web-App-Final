import { redirect } from "next/navigation";

interface ResetPasswordConfirmFallbackPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ResetPasswordConfirmFallbackPage({
  searchParams,
}: ResetPasswordConfirmFallbackPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        query.append(key, item);
      }
      continue;
    }

    if (typeof value === "string") {
      query.set(key, value);
    }
  }

  redirect(`/resetPassword/confirm${query.toString() ? `?${query.toString()}` : ""}`);
}

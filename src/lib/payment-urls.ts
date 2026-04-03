export function getPaymentCallbackUrl(tier?: string, userId?: string, fallbackOrigin?: string) {
  const configured = process.env.NEXT_PUBLIC_PAYMENT_CALLBACK_URL?.trim();
  const url = configured
    ? new URL(configured)
    : fallbackOrigin
      ? new URL("/subscription/callback", fallbackOrigin)
      : null;

  if (!url) {
    return "/subscription/callback";
  }

  if (tier) {
    url.searchParams.set("tier", tier);
  }

  if (userId) {
    url.searchParams.set("uid", userId);
  }

  return url.toString();
}

export function getPaymentReturnUrl(tier?: string, userId?: string, fallbackOrigin?: string) {
  const configured = process.env.NEXT_PUBLIC_PAYMENT_RETURN_URL?.trim();
  const url = configured
    ? new URL(configured)
    : fallbackOrigin
      ? new URL("/subscription/return", fallbackOrigin)
      : null;

  if (!url) {
    return "/subscription/return";
  }

  if (tier) {
    url.searchParams.set("tier", tier);
  }

  if (userId) {
    url.searchParams.set("uid", userId);
  }

  return url.toString();
}

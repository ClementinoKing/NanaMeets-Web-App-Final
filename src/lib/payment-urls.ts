export function getPaymentCallbackUrl(fallbackOrigin?: string) {
  const configured = process.env.NEXT_PUBLIC_PAYMENT_CALLBACK_URL?.trim();

  if (configured) {
    return configured;
  }

  if (fallbackOrigin) {
    return new URL("/subscription/callback", fallbackOrigin).toString();
  }

  return "/subscription/callback";
}

export function getPaymentReturnUrl(fallbackOrigin?: string) {
  const configured = process.env.NEXT_PUBLIC_PAYMENT_RETURN_URL?.trim();

  if (configured) {
    return configured;
  }

  if (fallbackOrigin) {
    return new URL("/subscription/return", fallbackOrigin).toString();
  }

  return "/subscription/return";
}

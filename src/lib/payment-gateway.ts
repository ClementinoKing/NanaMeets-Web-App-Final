type PaymentInitResponse = {
  status?: string;
  message?: string;
  error?: string;
  checkoutUrl?: string;
  txRef?: string;
  data?: {
    checkout_url?: string;
    tx_ref?: string;
  };
};

function getPaymentInitUrl() {
  return process.env.NEXT_PUBLIC_PAYMENT_INIT_URL?.trim() || "/api/payment-init";
}

function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || null;
}

export async function requestPaymentCheckout(payload: unknown, contextLabel: string) {
  const initUrl = getPaymentInitUrl();

  let response: Response;
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const supabaseAnonKey = getSupabaseAnonKey();
    if (supabaseAnonKey) {
      headers.apikey = supabaseAnonKey;
      headers.Authorization = `Bearer ${supabaseAnonKey}`;
    }

    response = await fetch(initUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network request failed";
    throw new Error(`${contextLabel} failed: cannot reach payment init endpoint (${initUrl}). ${message}`);
  }

  const bodyText = await response.text();
  let body: PaymentInitResponse | null = null;

  try {
    body = bodyText ? (JSON.parse(bodyText) as PaymentInitResponse) : null;
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new Error(body?.error || body?.message || bodyText || `${contextLabel} failed`);
  }

  const checkoutUrl = body?.checkoutUrl || body?.data?.checkout_url;

  if (!checkoutUrl) {
    throw new Error(`${contextLabel} failed: invalid checkout response`);
  }

  return {
    checkoutUrl,
    txRef: body?.txRef || body?.data?.tx_ref || null,
    raw: body,
  };
}

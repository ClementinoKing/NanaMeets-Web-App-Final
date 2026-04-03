"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type SubscriptionPaymentModalProps = {
  open: boolean;
  checkoutUrl: string | null;
  onClose: () => void;
  onSuccess: (finalUrl: string) => void;
  onCancel?: (finalUrl: string | null) => void;
};

function isSuccessUrl(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl);
    const status = parsed.searchParams.get("status")?.toLowerCase() ?? "";
    return parsed.pathname === "/dashboard/subscription" && status === "success";
  } catch {
    return false;
  }
}

function isCancelUrl(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl);
    const status = parsed.searchParams.get("status")?.toLowerCase() ?? "";
    return (
      parsed.pathname === "/subscription/return" ||
      status === "cancelled" ||
      status === "failed" ||
      status === "error"
    );
  } catch {
    return false;
  }
}

export function SubscriptionPaymentModal({
  open,
  checkoutUrl,
  onClose,
  onSuccess,
  onCancel,
}: SubscriptionPaymentModalProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (!open || !checkoutUrl) {
      return undefined;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      const data = event.data as { type?: string; txRef?: string; tier?: string; status?: string } | undefined;
      if (data?.type === "nanameets-payment-success" && data.status === "success") {
        onSuccess(`message:${data.txRef ?? checkoutUrl}`);
      }
    };

    const check = () => {
      const iframe = iframeRef.current;
      if (!iframe) {
        return;
      }

      try {
        const href = iframe.contentWindow?.location.href ?? null;
        if (!href) {
          return;
        }

        if (isSuccessUrl(href)) {
          onSuccess(href);
          return;
        }

        if (isCancelUrl(href)) {
          onCancel?.(href);
          return;
        }
      } catch {
        // Still on the cross-origin checkout page. Wait for the redirect back to our app.
      }
    };

    const intervalId = window.setInterval(check, 750);
    check();
    window.addEventListener("message", handleMessage);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("message", handleMessage);
    };
  }, [checkoutUrl, onCancel, onSuccess, open]);

  if (!open || !checkoutUrl) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-3 py-4 backdrop-blur-sm">
      <Card className="relative flex h-[min(92vh,920px)] w-full max-w-6xl flex-col overflow-hidden border-white/10 bg-[#09090b] text-white shadow-[0_32px_120px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-white/55">Payment modal</p>
            <p className="mt-1 text-sm text-white/75">Loading secure checkout...</p>
          </div>
          <Button
            className="rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={onClose}
            type="button"
            variant="ghost"
          >
            <X className="h-4.5 w-4.5" />
          </Button>
        </div>

        <div className="relative min-h-0 flex-1 bg-[#050505]">
          <iframe
            ref={iframeRef}
            title="PayChangu checkout"
            src={checkoutUrl}
            className="h-full w-full border-0"
            allow="payment"
            onLoad={() => {
              try {
                const href = iframeRef.current?.contentWindow?.location.href ?? null;
                if (href) {
                  if (isSuccessUrl(href)) {
                    onSuccess(href);
                  } else if (isCancelUrl(href)) {
                    onCancel?.(href);
                  }
                }
              } catch {
                // Ignore cross-origin load steps; we'll inspect again after redirect back.
              }
            }}
          />
        </div>
      </Card>
    </div>
  );
}

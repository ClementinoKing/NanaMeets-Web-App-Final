export type SubscriptionCheckoutState = {
  tier: string;
  userId: string;
};

const STORAGE_KEY = "nanameets.subscription.checkout";

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage;
}

export function saveSubscriptionCheckoutState(state: SubscriptionCheckoutState) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function readSubscriptionCheckoutState() {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SubscriptionCheckoutState> | null;
    const tier = typeof parsed?.tier === "string" ? parsed.tier.trim() : "";
    const userId = typeof parsed?.userId === "string" ? parsed.userId.trim() : "";

    if (!tier && !userId) {
      return null;
    }

    return {
      tier,
      userId,
    };
  } catch {
    return null;
  }
}

export function clearSubscriptionCheckoutState() {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.removeItem(STORAGE_KEY);
}

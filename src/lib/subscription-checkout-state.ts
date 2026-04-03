export type SubscriptionCheckoutState = {
  tier: string;
  userId: string;
};

const STORAGE_KEY = "nanameets.subscription.checkout";

function getStorages() {
  if (typeof window === "undefined") {
    return [];
  }

  return [window.localStorage, window.sessionStorage];
}

export function saveSubscriptionCheckoutState(state: SubscriptionCheckoutState) {
  const storages = getStorages();

  if (storages.length === 0) {
    return;
  }

  const raw = JSON.stringify(state);
  for (const storage of storages) {
    try {
      storage.setItem(STORAGE_KEY, raw);
    } catch {
      // Ignore storage quota or privacy-mode failures and keep going.
    }
  }
}

export function readSubscriptionCheckoutState() {
  const storages = getStorages();

  if (storages.length === 0) {
    return null;
  }

  for (const storage of storages) {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      continue;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<SubscriptionCheckoutState> | null;
      const tier = typeof parsed?.tier === "string" ? parsed.tier.trim() : "";
      const userId = typeof parsed?.userId === "string" ? parsed.userId.trim() : "";

      if (!tier && !userId) {
        continue;
      }

      return {
        tier,
        userId,
      };
    } catch {
      // Try the next storage fallback.
    }
  }

  return null;
}

export function clearSubscriptionCheckoutState() {
  const storages = getStorages();

  if (storages.length === 0) {
    return;
  }

  for (const storage of storages) {
    try {
      storage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage cleanup failures.
    }
  }
}

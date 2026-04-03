"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { SwipeProfile } from "@/components/dashboard/swipe-deck";
import { SubscriptionPromptModal } from "@/components/dashboard/subscription-prompt-modal";
import type { SubscriptionPlan } from "@/lib/subscriptions";

const SwipeDeck = dynamic(
  () => import("@/components/dashboard/swipe-deck").then((module) => module.SwipeDeck),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto flex min-h-[76vh] w-full max-w-[560px] items-center justify-center rounded-[1.75rem] border border-white/10 bg-[#090909] shadow-[0_20px_80px_rgba(0,0,0,0.65)]" />
    ),
  },
);

interface SwipeDeckHostProps {
  profiles: SwipeProfile[];
  currentUserId: string;
  canDirectMessageUsers: boolean;
  subscriptionPlans: SubscriptionPlan[];
}

export function SwipeDeckHost({ profiles, currentUserId, canDirectMessageUsers, subscriptionPlans }: SwipeDeckHostProps) {
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  return (
    <>
      <SwipeDeck
        canDirectMessageUsers={canDirectMessageUsers}
        currentUserId={currentUserId}
        onRequestSubscription={() => setShowSubscriptionModal(true)}
        profiles={profiles}
      />
      <SubscriptionPromptModal
        onClose={() => setShowSubscriptionModal(false)}
        open={showSubscriptionModal}
        plans={subscriptionPlans}
        userId={currentUserId}
      />
    </>
  );
}

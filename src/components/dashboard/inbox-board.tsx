"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export interface Conversation {
  userId: string;
  name: string;
  email: string | null;
  profilePic: string | null;
  latestMessage: string | null;
  latestAt: string;
  sentByMe: boolean;
}

interface InboxBoardProps {
  conversations: Conversation[];
}

export function InboxBoard({ conversations }: InboxBoardProps) {
  if (!conversations.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-6 text-sm text-slate-600">
        No conversations yet. Send a message from Discover to get started.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {conversations.map((conversation) => (
        <Card key={conversation.userId} className="bg-white/90">
          <CardContent className="flex items-start gap-4 px-5 py-5">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
              {conversation.profilePic ? (
                <Image
                  alt={conversation.name}
                  className="object-cover"
                  fill
                  loading="lazy"
                  sizes="48px"
                  src={conversation.profilePic}
                />
              ) : (
                conversation.name.slice(0, 2).toUpperCase()
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-slate-950">{conversation.name}</p>
                <Badge variant="outline">{conversation.sentByMe ? "Outgoing" : "Incoming"}</Badge>
              </div>
              <p className="truncate text-sm text-slate-500">{conversation.email ?? "No email provided"}</p>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                {conversation.latestMessage ?? "No message text yet."}
              </p>
            </div>

            <div className="text-right text-xs text-slate-500">
              {new Date(conversation.latestAt).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

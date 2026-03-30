"use client";

import { useEffect, useRef, useState } from "react";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const COMMON_DATING_EMOJIS = ["💘", "❤️", "😍", "😘", "🥂", "🌹", "✨", "💞", "😏", "👋🏽", "💬", "🔥"];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  className?: string;
}

export function EmojiPicker({ onSelect, className }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current) {
        return;
      }

      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <Button
        aria-label="Add emoji"
        aria-expanded={open}
        className="h-10 w-10 shrink-0 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        size="icon"
        type="button"
        variant="ghost"
        onClick={() => setOpen((value) => !value)}
      >
        <Smile className="h-4 w-4" />
      </Button>

      {open ? (
        <div className="absolute bottom-[calc(100%+0.75rem)] left-0 z-30 w-[16rem] overflow-hidden rounded-[1.2rem] border border-border/70 bg-[#141414] shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
          <div className="border-b border-border/70 px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Quick Emojis</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Tap one to add it to your message</p>
          </div>

          <div className="grid grid-cols-4 gap-2 p-3">
            {COMMON_DATING_EMOJIS.map((emoji) => (
              <Button
                key={emoji}
                aria-label={`Insert ${emoji}`}
                className="h-12 rounded-[0.95rem] text-[1.3rem] hover:bg-white/5"
                type="button"
                variant="ghost"
                onClick={() => {
                  onSelect(emoji);
                  setOpen(false);
                }}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

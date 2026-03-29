"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType, InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import Image from "next/image";
import {
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  Heart,
  Images,
  MapPin,
  Plus,
  Ruler,
  Sparkles,
  Star,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MALAWI_AREAS, MALAWI_DISTRICTS } from "@/lib/malawi-locations";
import type { CurrentProfileRow } from "@/lib/current-profile";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { saveProfileRow } from "@/lib/profile-write";
import { uploadManyToR2 } from "@/lib/r2";
import { toast } from "sonner";

type PhotoSlot = {
  existingUrl: string | null;
  file: File | null;
  previewUrl: string | null;
};

const RELATIONSHIP_GOALS = [
  { value: "Long-term partner", emoji: "💘", label: "Long-term partner" },
  { value: "Long-term, but short-term Ok", emoji: "😍", label: "Long-term, but short-term Ok" },
  { value: "Short-term, but long-term Ok", emoji: "🥂", label: "Short-term, but long-term Ok" },
  { value: "Short-term fun", emoji: "🎉", label: "Short-term fun" },
  { value: "New friends", emoji: "👋", label: "New friends" },
  { value: "Still figuring it out", emoji: "🤔", label: "Still figuring it out" },
] as const;

const COMMUNICATION_STYLES = ["Big time texter", "Phone caller", "Video caller", "Bad texter", "Better in person"] as const;
const LOVE_LANGUAGES = ["Thoughtful gestures", "Presents", "Touch", "Compliments", "Time together"] as const;
const EDUCATION_LEVELS = ["Bachelor degree", "PhD", "On a graduate programme", "Master degree"] as const;
const ZODIAC_SIGNS = [
  "Capricorn",
  "Aquarius",
  "Pisces",
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
] as const;

const DRINKING_OPTIONS = ["Not for me", "Sober curious", "On special occasions", "Only the weekend", "Most nights"] as const;
const SMOKING_OPTIONS = ["Social smoker", "Non-smoker", "Smoker", "Trying to quit"] as const;
const WORKOUT_OPTIONS = ["Every day", "Often", "Sometimes", "Never"] as const;
const PETS_OPTIONS = ["Dog", "Cat", "Bird", "Fish", "Don't have but love", "Other"] as const;

const INTEREST_OPTIONS = [
  "Art & Painting",
  "Astrology",
  "Baking",
  "Basketball",
  "Beach Walks",
  "Board Games",
  "Camping",
  "Candlelight Dinner",
  "Chilling at the Lake",
  "Christianity",
  "Coffee Lovers",
  "Comedy",
  "Community Work",
  "Concerts",
  "Cooking",
  "Cycling",
  "Dancing",
  "Deep Conversations",
  "Entrepreneurship",
  "Farming",
  "Fashion",
  "Fishing",
  "Foodie",
  "Football",
  "Gym",
  "Hiking",
  "Islamic Faith",
  "Karaoke",
  "Live Music",
  "Love",
  "Martial Arts",
  "Meditation",
  "Mindfulness",
  "Movies & Series",
  "Music",
  "Nature",
  "Personal Development",
  "Photography",
  "Podcasts",
  "Poetry",
  "Puzzles",
  "Reading",
  "Road Trips",
  "Running",
  "Shopping",
  "Skiing",
  "Spirituality",
  "Stand-up Comedy",
  "Surprise Gifts",
  "Swimming",
  "Tennis",
  "Theater",
  "Traveling",
  "Vegan Lifestyle",
  "Video Gaming",
  "Volunteering",
  "Wildlife",
  "Wine Tasting",
  "Writing",
  "Yoga",
] as const;

const MAX_INTERESTS = 5;

interface ProfileEditorProps {
  userId: string;
  email: string;
  profile: CurrentProfileRow | null;
}

function describeSupabaseError(error: unknown) {
  if (!error) {
    return "Failed to save profile";
  }

  if (typeof error === "object" && error !== null) {
    const maybeError = error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };

    const parts = [maybeError.message, maybeError.details, maybeError.hint].filter(
      (part): part is string => Boolean(part && part.trim())
    );

    if (parts.length > 0) {
      return parts.join(" ");
    }

    if (maybeError.code) {
      return `Supabase error ${maybeError.code}`;
    }
  }

  return error instanceof Error ? error.message : "Failed to save profile";
}

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <Icon className="h-5 w-5 shrink-0 text-[#ff486f]" />
      <h2 className="font-heading text-[1rem] font-medium tracking-tight text-white sm:text-[1.15rem]">
        {title}
      </h2>
    </div>
  );
}

function DarkInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Input
      {...props}
      className={cn(
        "h-11 border-white/25 bg-[#232323] px-3.5 text-[0.92rem] text-white placeholder:text-white/35 focus:border-[#ff486f] focus:ring-[#ff486f]/20",
        props.className
      )}
    />
  );
}

function DarkTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Textarea
      {...props}
      className={cn(
        "min-h-[132px] border-white/25 bg-[#232323] px-3.5 py-2.5 text-[0.92rem] text-white placeholder:text-white/35 focus:border-[#ff486f] focus:ring-[#ff486f]/20",
        props.className
      )}
    />
  );
}

function SearchableDropdown({
  placeholder,
  value,
  onChange,
  options,
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = normalizedQuery
    ? options.filter((option) => option.toLowerCase().includes(normalizedQuery))
    : options;

  return (
    <div ref={rootRef} className="relative">
      <Input
        autoComplete="off"
        className="h-11 border-white/25 bg-[#232323] px-3.5 text-[0.92rem] text-white placeholder:text-white/35 focus:border-[#ff486f] focus:ring-[#ff486f]/20"
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setQuery(value);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
          }

          if (event.key === "Enter" && filteredOptions[0]) {
            event.preventDefault();
            onChange(filteredOptions[0]);
            setQuery(filteredOptions[0]);
            setOpen(false);
          }
        }}
        placeholder={placeholder}
        role="combobox"
        value={open ? query : value}
      />

      {open ? (
        <div className="absolute z-20 mt-2 max-h-56 w-full overflow-auto rounded-[1rem] border border-white/10 bg-[#1f1f1f] py-1 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
          {filteredOptions.length ? (
            filteredOptions.map((option) => (
              <button
                key={option}
                className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-[0.9rem] text-white/85 transition hover:bg-white/[0.08] hover:text-white"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(option);
                  setQuery(option);
                  setOpen(false);
                }}
                type="button"
              >
                <span>{option}</span>
              </button>
            ))
          ) : (
            <div className="px-3.5 py-2.5 text-[0.9rem] text-white/45">No matches found</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function RelationshipGoalsModal({
  open,
  value,
  onClose,
  onSelect,
}: {
  open: boolean;
  value: string;
  onClose: () => void;
  onSelect: (value: string) => void;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl rounded-[2rem] bg-[#111] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.65)] sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          aria-label="Close relationship goals picker"
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/8 text-white/80 transition hover:bg-white/12 hover:text-white"
          onClick={onClose}
          type="button"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 pt-8 text-center">
          <h3 className="text-[1.45rem] font-semibold tracking-tight text-white sm:text-[2rem]">
            What are you looking for?
          </h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {RELATIONSHIP_GOALS.map((goal) => {
            const selected = goal.value === value;

            return (
              <button
                key={goal.value}
                className={cn(
                  "flex min-h-[122px] flex-col items-center justify-center gap-3 rounded-[1.5rem] border px-4 py-5 text-center text-white transition",
                  selected
                    ? "border-[#ff4b6f] bg-[#4b2328] shadow-[0_0_0_1px_rgba(255,75,111,0.25)]"
                    : "border-white/8 bg-[#232323] hover:border-white/14 hover:bg-[#2a2a2a]"
                )}
                onClick={() => {
                  onSelect(goal.value);
                  onClose();
                }}
                type="button"
              >
                <span className="text-[2rem] leading-none">{goal.emoji}</span>
                <span className="max-w-[220px] text-[1.05rem] font-medium leading-tight sm:text-[1.15rem]">
                  {goal.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SelectionChipGroup({
  title,
  options,
  selected,
  onSelect,
}: {
  title: string;
  options: readonly string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-4 py-4">
      <div className="mb-4 text-[1rem] font-semibold text-white sm:text-[1.15rem]">{title}</div>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => {
          const isSelected = option === selected;

          return (
            <button
              key={option}
              className={cn(
                "rounded-full px-4 py-3 text-[0.98rem] transition",
                isSelected
                  ? "bg-[#ff4b6f] text-white shadow-[0_0_0_1px_rgba(255,75,111,0.25)]"
                  : "bg-white/8 text-white/92 hover:bg-white/12"
              )}
              onClick={() => onSelect(option)}
              type="button"
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MoreAboutModal({
  open,
  communicationStyle,
  loveLanguage,
  educationLevel,
  zodiacSign,
  onClose,
  onChangeCommunicationStyle,
  onChangeLoveLanguage,
  onChangeEducationLevel,
  onChangeZodiacSign,
}: {
  open: boolean;
  communicationStyle: string;
  loveLanguage: string;
  educationLevel: string;
  zodiacSign: string;
  onClose: () => void;
  onChangeCommunicationStyle: (value: string) => void;
  onChangeLoveLanguage: (value: string) => void;
  onChangeEducationLevel: (value: string) => void;
  onChangeZodiacSign: (value: string) => void;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 px-4 py-5 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-auto w-full max-w-4xl rounded-[2rem] bg-[#111] p-4 shadow-[0_30px_100px_rgba(0,0,0,0.7)] sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <button
            aria-label="Close more about you picker"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/8 text-white/80 transition hover:bg-white/12 hover:text-white"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="text-center">
            <h3 className="text-[1.35rem] font-semibold tracking-tight text-white sm:text-[1.8rem]">
              More About You
            </h3>
            <p className="mt-1 text-[0.95rem] text-white/55">Changed a few things over time, we got you.</p>
          </div>

          <Button
            className="h-10 rounded-full bg-[linear-gradient(135deg,#ff486f,#ea2f7b)] px-5 text-sm font-semibold text-white hover:opacity-95"
            onClick={onClose}
            type="button"
          >
            Done
          </Button>
        </div>

        <div className="grid gap-4">
          <SelectionChipGroup
            onSelect={onChangeCommunicationStyle}
            options={COMMUNICATION_STYLES}
            selected={communicationStyle}
            title="Communication style?"
          />
          <SelectionChipGroup
            onSelect={onChangeLoveLanguage}
            options={LOVE_LANGUAGES}
            selected={loveLanguage}
            title="Love language"
          />
          <SelectionChipGroup
            onSelect={onChangeEducationLevel}
            options={EDUCATION_LEVELS}
            selected={educationLevel}
            title="Education level?"
          />
          <SelectionChipGroup
            onSelect={onChangeZodiacSign}
            options={ZODIAC_SIGNS}
            selected={zodiacSign}
            title="What's your star sign?"
          />
        </div>
      </div>
    </div>
  );
}

function LifestyleModal({
  open,
  drinking,
  smoking,
  workout,
  pets,
  onClose,
  onChangeDrinking,
  onChangeSmoking,
  onChangeWorkout,
  onChangePets,
}: {
  open: boolean;
  drinking: string;
  smoking: string;
  workout: string;
  pets: string;
  onClose: () => void;
  onChangeDrinking: (value: string) => void;
  onChangeSmoking: (value: string) => void;
  onChangeWorkout: (value: string) => void;
  onChangePets: (value: string) => void;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 px-4 py-5 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-auto w-full max-w-4xl rounded-[2rem] bg-[#111] p-4 shadow-[0_30px_100px_rgba(0,0,0,0.7)] sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <button
            aria-label="Close lifestyle picker"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/8 text-white/80 transition hover:bg-white/12 hover:text-white"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="text-center">
            <h3 className="text-[1.35rem] font-semibold tracking-tight text-white sm:text-[1.8rem]">
              Lifestyle habits.
            </h3>
            <p className="mt-1 text-[0.95rem] text-white/55">Changes some habits? you can change them here too.</p>
          </div>

          <Button
            className="h-10 rounded-full bg-[linear-gradient(135deg,#ff486f,#ea2f7b)] px-5 text-sm font-semibold text-white hover:opacity-95"
            onClick={onClose}
            type="button"
          >
            Done
          </Button>
        </div>

        <div className="grid gap-5">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-4 py-4">
            <div className="mb-4 text-[1rem] font-semibold text-white sm:text-[1.15rem]">How often do you drink?</div>
            <div className="flex flex-wrap gap-3">
              {DRINKING_OPTIONS.map((option) => {
                const selected = option === drinking;
                return (
                  <button
                    key={option}
                    className={cn(
                      "rounded-full px-4 py-3 text-[0.98rem] transition",
                      selected
                        ? "bg-[#ff4b6f] text-white shadow-[0_0_0_1px_rgba(255,75,111,0.25)]"
                        : "bg-white/8 text-white/92 hover:bg-white/12"
                    )}
                    onClick={() => onChangeDrinking(option)}
                    type="button"
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px w-full bg-white/12" />

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-4 py-4">
            <div className="mb-4 text-[1rem] font-semibold text-white sm:text-[1.15rem]">How often do you smoke?</div>
            <div className="flex flex-wrap gap-3">
              {SMOKING_OPTIONS.map((option) => {
                const selected = option === smoking;
                return (
                  <button
                    key={option}
                    className={cn(
                      "rounded-full px-4 py-3 text-[0.98rem] transition",
                      selected
                        ? "bg-[#ff4b6f] text-white shadow-[0_0_0_1px_rgba(255,75,111,0.25)]"
                        : "bg-white/8 text-white/92 hover:bg-white/12"
                    )}
                    onClick={() => onChangeSmoking(option)}
                    type="button"
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px w-full bg-white/12" />

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-4 py-4">
            <div className="mb-4 text-[1rem] font-semibold text-white sm:text-[1.15rem]">Do you exercise?</div>
            <div className="flex flex-wrap gap-3">
              {WORKOUT_OPTIONS.map((option) => {
                const selected = option === workout;
                return (
                  <button
                    key={option}
                    className={cn(
                      "rounded-full px-4 py-3 text-[0.98rem] transition",
                      selected
                        ? "bg-[#ff4b6f] text-white shadow-[0_0_0_1px_rgba(255,75,111,0.25)]"
                        : "bg-white/8 text-white/92 hover:bg-white/12"
                    )}
                    onClick={() => onChangeWorkout(option)}
                    type="button"
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px w-full bg-white/12" />

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-4 py-4">
            <div className="mb-4 text-[1rem] font-semibold text-white sm:text-[1.15rem]">Do you have any pets?</div>
            <div className="flex flex-wrap gap-3">
              {PETS_OPTIONS.map((option) => {
                const selected = option === pets;
                return (
                  <button
                    key={option}
                    className={cn(
                      "rounded-full px-4 py-3 text-[0.98rem] transition",
                      selected
                        ? "bg-[#ff4b6f] text-white shadow-[0_0_0_1px_rgba(255,75,111,0.25)]"
                        : "bg-white/8 text-white/92 hover:bg-white/12"
                    )}
                    onClick={() => onChangePets(option)}
                    type="button"
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InterestsModal({
  open,
  selectedValues,
  onClose,
  onToggle,
}: {
  open: boolean;
  selectedValues: string[];
  onClose: () => void;
  onToggle: (value: string) => void;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-[2rem] bg-[#111] p-4 shadow-[0_30px_100px_rgba(0,0,0,0.7)] sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <button
            aria-label="Close interests picker"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/8 text-white/80 transition hover:bg-white/12 hover:text-white"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="text-center">
            <h3 className="text-[1.35rem] font-semibold tracking-tight text-white sm:text-[1.8rem]">
              Select Interests
            </h3>
            <p className="mt-1 text-[0.95rem] text-white/55">Choose up to {MAX_INTERESTS}</p>
          </div>

          <Button
            className="h-10 rounded-full bg-[linear-gradient(135deg,#ff486f,#ea2f7b)] px-5 text-sm font-semibold text-white hover:opacity-95"
            onClick={onClose}
            type="button"
          >
            Done
          </Button>
        </div>

        <p className="mx-auto max-w-2xl px-2 pb-4 text-center text-[0.95rem] leading-6 text-white/70 sm:text-[1.02rem]">
          Discover shared passions and connect with like-minded people. Explore interests that bring
          you closer to meaningful relationships.
        </p>

        <div className="mb-4 rounded-[1.25rem] bg-white/5 px-4 py-3 text-center text-[0.95rem] text-white/70">
          Select up to {MAX_INTERESTS} interests below
          <span className="ml-2 text-white/40">
            ({selectedValues.length}/{MAX_INTERESTS})
          </span>
        </div>

        <div className="max-h-[62vh] overflow-auto pr-1">
          <div className="flex flex-wrap gap-3">
            {INTEREST_OPTIONS.map((interest) => {
              const selected = selectedValues.includes(interest);
              const disabled = !selected && selectedValues.length >= MAX_INTERESTS;

              return (
                <button
                  key={interest}
                  className={cn(
                    "rounded-full px-4 py-2.5 text-[0.95rem] font-medium transition",
                    selected
                      ? "bg-[#ff4b6f] text-white shadow-[0_0_0_1px_rgba(255,75,111,0.25)]"
                      : "bg-white/8 text-white/92 hover:bg-white/12",
                    disabled ? "cursor-not-allowed opacity-45 hover:bg-white/8" : ""
                  )}
                  disabled={disabled}
                  onClick={() => {
                    if (disabled) {
                      toast.warning(`You can only select up to ${MAX_INTERESTS} interests`);
                      return;
                    }
                    onToggle(interest);
                  }}
                  type="button"
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function PhotoSlotView({
  slot,
  index,
  onChange,
  onRemove,
}: {
  slot: PhotoSlot;
  index: number;
  onChange: (file: File | null) => void;
  onRemove: () => void;
}) {
  const preview = slot.previewUrl ?? slot.existingUrl;

  return (
    <label className="group relative block aspect-[3/4] cursor-pointer overflow-hidden rounded-[1.25rem] bg-[#232323]">
      <input
        accept="image/*"
        className="hidden"
        type="file"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
      {preview ? (
        <Image alt={`Profile photo ${index + 1}`} className="object-cover" fill sizes="(max-width: 768px) 33vw, 18vw" src={preview} />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2.5 text-white/45">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5">
            <Plus className="h-4.5 w-4.5" />
          </div>
          <span className="text-[0.7rem] font-medium tracking-wide">Add photo {index + 1}</span>
        </div>
      )}

      {preview ? (
        <button
          className="absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
          onClick={(event) => {
            event.preventDefault();
            onRemove();
          }}
          type="button"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      ) : null}
    </label>
  );
}

export function ProfileEditor({ userId, email, profile }: ProfileEditorProps) {
  const profilePic = profile?.profile_pic ?? null;
  const picture2 = profile?.picture2 ?? null;
  const picture3 = profile?.picture3 ?? null;
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState(profile?.f_name ?? "");
  const [gender, setGender] = useState(profile?.gender ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [area, setArea] = useState(profile?.area ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [relationshipGoals, setRelationshipGoals] = useState(profile?.relationship_goals ?? "");
  const [relationshipGoalsOpen, setRelationshipGoalsOpen] = useState(false);
  const [interests, setInterests] = useState(profile?.interests?.join(", ") ?? "");
  const [interestsOpen, setInterestsOpen] = useState(false);
  const [height, setHeight] = useState(profile?.height?.toString() ?? "");
  const [comuStyle, setComuStyle] = useState(profile?.comu_style ?? "");
  const [loveStyle, setLoveStyle] = useState(profile?.love_style ?? "");
  const [education, setEducation] = useState(profile?.education ?? "");
  const [zodiac, setZodiac] = useState(profile?.zodiac ?? "");
  const [moreAboutOpen, setMoreAboutOpen] = useState(false);
  const [lifestyleOpen, setLifestyleOpen] = useState(false);
  const [drinking, setDrinking] = useState(profile?.drinking ?? "");
  const [smoking, setSmoking] = useState(profile?.smoking ?? "");
  const [workout, setWorkout] = useState(profile?.workout ?? "");
  const [pets, setPets] = useState(profile?.pets ?? "");
  const [jobTitle, setJobTitle] = useState(profile?.job_title ?? "");
  const [company, setCompany] = useState(profile?.company ?? "");
  const [photoSlots, setPhotoSlots] = useState<PhotoSlot[]>(() => [
    { existingUrl: profilePic, file: null, previewUrl: null },
    { existingUrl: picture2, file: null, previewUrl: null },
    { existingUrl: picture3, file: null, previewUrl: null },
  ]);
  const [autosaveNonce, setAutosaveNonce] = useState(0);
  const selectedInterests = useMemo(
    () =>
      interests
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
        .slice(0, MAX_INTERESTS),
    [interests]
  );
  const profileSnapshot = useMemo(
    () =>
      JSON.stringify({
        fullName,
        gender,
        city,
        area,
        bio,
        relationshipGoals,
        interests,
        height,
        comuStyle,
        loveStyle,
        education,
        zodiac,
        drinking,
        smoking,
        workout,
        pets,
        jobTitle,
        company,
        photoSlots: photoSlots.map((slot) => ({ existingUrl: slot.existingUrl, file: Boolean(slot.file) })),
      }),
    [
      area,
      bio,
      city,
      company,
      comuStyle,
      drinking,
      education,
      fullName,
      gender,
      height,
      interests,
      jobTitle,
      loveStyle,
      pets,
      photoSlots,
      relationshipGoals,
      smoking,
      workout,
      zodiac,
    ]
  );
  const lastSavedSnapshotRef = useRef(profileSnapshot);
  const saveInFlightRef = useRef(false);
  const pendingSaveRef = useRef(false);
  const autosaveReadyRef = useRef(false);

  useEffect(() => {
    autosaveReadyRef.current = true;
  }, []);

  const completion = useMemo(() => {
    return [
      fullName,
      gender,
      city,
      area,
      bio,
      relationshipGoals,
      interests,
      height,
      comuStyle,
      loveStyle,
      education,
      zodiac,
      drinking,
      smoking,
      workout,
      pets,
      jobTitle,
      company,
      photoSlots.some((slot) => Boolean(slot.previewUrl ?? slot.existingUrl)),
    ].filter(Boolean).length;
  }, [
    area,
    bio,
    city,
    company,
    comuStyle,
    drinking,
    education,
    fullName,
    gender,
    height,
    interests,
    jobTitle,
    loveStyle,
    photoSlots,
    pets,
    relationshipGoals,
    smoking,
    workout,
    zodiac,
  ]);
  const completionPercent = Math.round((completion / 19) * 100);

  const toggleInterest = (interest: string) => {
    setInterests((current) => {
      const currentValues = current
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);

      if (currentValues.includes(interest)) {
        return currentValues.filter((value) => value !== interest).join(", ");
      }

      if (currentValues.length >= MAX_INTERESTS) {
        toast.warning(`You can only select up to ${MAX_INTERESTS} interests`);
        return currentValues.join(", ");
      }

      return [...currentValues, interest].join(", ");
    });
  };

  useEffect(() => {
    return () => {
      photoSlots.forEach((slot) => {
        if (slot.previewUrl) {
          URL.revokeObjectURL(slot.previewUrl);
        }
      });
    };
  }, [photoSlots]);

  const updateSlot = (index: number, file: File | null) => {
    setPhotoSlots((current) => {
      const next = [...current];
      const existing = next[index];

      if (existing.previewUrl) {
        URL.revokeObjectURL(existing.previewUrl);
      }

      if (!file) {
        next[index] = {
          existingUrl: null,
          file: null,
          previewUrl: null,
        };
        return next;
      }

      next[index] = {
        existingUrl: existing.existingUrl,
        file,
        previewUrl: URL.createObjectURL(file),
      };
      return next;
    });
  };

  const removeSlot = (index: number) => {
    setPhotoSlots((current) => {
      const next = [...current];
      const existing = next[index];

      if (existing.previewUrl) {
        URL.revokeObjectURL(existing.previewUrl);
      }

      next[index] = {
        existingUrl: null,
        file: null,
        previewUrl: null,
      };
      return next;
    });
  };

  useEffect(() => {
    if (!autosaveReadyRef.current) {
      return;
    }

    if (profileSnapshot === lastSavedSnapshotRef.current) {
      return;
    }

    const timeout = window.setTimeout(() => {
      if (saveInFlightRef.current) {
        pendingSaveRef.current = true;
        return;
      }

      const runSave = async () => {
        saveInFlightRef.current = true;
        setError(null);

        try {
          const supabase = getSupabaseBrowserClient();

          if (!supabase) {
            const message = "Set the Supabase environment variables to edit the profile.";
            setError(message);
            toast.error(message, { id: "profile-autosave" });
            return;
          }

          const keepExisting = (nextValue: string, existingValue: string | null | undefined) =>
            nextValue.trim() || existingValue || null;
          const keepExistingArray = (nextValue: string, existingValue: string[] | null | undefined) =>
            nextValue.trim()
              ? nextValue
                  .split(",")
                  .map((entry) => entry.trim())
                  .filter(Boolean)
              : existingValue ?? [];

          const filesToUpload = photoSlots.flatMap((slot) => (slot.file ? [slot.file] : []));
          const uploadedUrls = filesToUpload.length
            ? await uploadManyToR2(filesToUpload, { prefix: `profiles/${userId}` })
            : [];
          let uploadIndex = 0;

          const resolvedPhotoUrls = photoSlots.map((slot) => {
            if (slot.file) {
              return uploadedUrls[uploadIndex++] ?? slot.existingUrl;
            }

            return slot.existingUrl;
          });

          const parsedHeight = height ? Number(height) : null;

          await saveProfileRow(supabase, {
            user_id: userId,
            email,
            f_name: keepExisting(fullName, profile?.f_name),
            gender: keepExisting(gender, profile?.gender),
            city: keepExisting(city, profile?.city),
            area: keepExisting(area, profile?.area),
            bio: keepExisting(bio, profile?.bio),
            relationship_goals: keepExisting(relationshipGoals, profile?.relationship_goals),
            interests: keepExistingArray(interests, profile?.interests),
            height: Number.isFinite(parsedHeight) ? parsedHeight : profile?.height ?? null,
            comu_style: keepExisting(comuStyle, profile?.comu_style),
            love_style: keepExisting(loveStyle, profile?.love_style),
            education: keepExisting(education, profile?.education),
            zodiac: keepExisting(zodiac, profile?.zodiac),
            drinking: keepExisting(drinking, profile?.drinking),
            smoking: keepExisting(smoking, profile?.smoking),
            workout: keepExisting(workout, profile?.workout),
            pets: keepExisting(pets, profile?.pets),
            job_title: keepExisting(jobTitle, profile?.job_title),
            company: keepExisting(company, profile?.company),
            profile_pic: resolvedPhotoUrls[0] ?? null,
            picture2: resolvedPhotoUrls[1] ?? null,
            picture3: resolvedPhotoUrls[2] ?? null,
          });

          lastSavedSnapshotRef.current = profileSnapshot;
          toast.success("Profile saved", { id: "profile-autosave" });
        } catch (saveError) {
          const message = describeSupabaseError(saveError);
          setError(message);
          toast.error(message, { id: "profile-autosave" });
        } finally {
          saveInFlightRef.current = false;

          if (pendingSaveRef.current) {
            pendingSaveRef.current = false;
            setAutosaveNonce((value) => value + 1);
          }
        }
      };

      void runSave();
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [
    area,
    autosaveNonce,
    bio,
    city,
    company,
    comuStyle,
    drinking,
    education,
    email,
    fullName,
    gender,
    height,
    interests,
    jobTitle,
    loveStyle,
    pets,
    photoSlots,
    profile,
    profileSnapshot,
    relationshipGoals,
    smoking,
    workout,
    userId,
    zodiac,
  ]);

  return (
    <section className="min-h-[calc(100vh-8rem)] bg-black px-0 py-0 text-white">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-[1.5rem] bg-[#262626] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.3)]">
            <SectionTitle icon={Images} title="Pictures" />

            <div className="mb-3 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-[0.85rem] text-white/75">
              <span>Profile completion</span>
              <span className="font-semibold text-white">{completionPercent}%</span>
            </div>

            {error ? (
              <div className="mb-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            <div className="grid grid-cols-3 gap-2.5">
              {photoSlots.map((slot, index) => (
                <PhotoSlotView
                  key={index}
                  index={index}
                  onChange={(file) => updateSlot(index, file)}
                  onRemove={() => removeSlot(index)}
                  slot={slot}
                />
              ))}
            </div>

            <div className="mt-6">
              <SectionTitle icon={User} title="About Me" />
              <DarkTextarea
                placeholder="Tell us about yourself..."
                value={bio}
                onChange={(event) => setBio(event.target.value)}
              />
            </div>

            <div className="mt-6">
              <SectionTitle icon={Heart} title="Relationship Goals" />
              <button
                className="flex w-full items-center justify-between gap-3 rounded-[1rem] border border-white/20 bg-[#232323] px-3.5 py-3.5 text-left transition hover:border-white/30 hover:bg-[#262626]"
                onClick={() => setRelationshipGoalsOpen(true)}
                type="button"
              >
                <span className="text-[0.9rem] text-white/50">Looking for</span>
                <span className="flex items-center gap-2 text-[0.95rem] text-white/85">
                  {relationshipGoals || "Select a goal"}
                  <ChevronRight className="h-4.5 w-4.5 text-[#ff486f]" />
                </span>
              </button>
            </div>

            <div className="mt-6">
              <SectionTitle icon={Sparkles} title="Interests" />
              <button
                className="flex w-full flex-wrap items-center justify-between gap-3 rounded-[1rem] border border-white/20 bg-[#232323] px-3.5 py-3.5 text-left transition hover:border-white/30 hover:bg-[#262626]"
                onClick={() => setInterestsOpen(true)}
                type="button"
              >
                <span className="flex min-w-0 flex-1 flex-wrap items-center justify-start gap-2">
                  {selectedInterests.length ? (
                    selectedInterests.map((interest) => (
                      <span
                        key={interest}
                        className="rounded-full bg-white/8 px-3 py-1 text-[0.85rem] text-white/85"
                      >
                        {interest}
                      </span>
                    ))
                  ) : (
                    <span className="text-[0.95rem] text-white/60">Choose interests</span>
                  )}
                </span>
              </button>
            </div>

            <div className="mt-6">
              <SectionTitle icon={Ruler} title="Height" />
              <DarkInput
                placeholder="00.00cm"
                value={height}
                onChange={(event) => setHeight(event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4">
            <button
              className="rounded-[1.5rem] bg-[#262626] p-4 text-left shadow-[0_18px_60px_rgba(0,0,0,0.3)] transition hover:bg-[#2a2a2a]"
              onClick={() => setMoreAboutOpen(true)}
              type="button"
            >
              <SectionTitle icon={Star} title="More about me" />
              <div className="rounded-[1rem] border border-white/10 bg-[#232323] px-3.5 py-3.5">
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-[0.92rem] text-white/70">Communication style</span>
                  <span className="flex min-w-0 items-center gap-2 text-[0.92rem] text-white/90">
                    <span className="truncate">{comuStyle || "Select style"}</span>
                    <ChevronRight className="h-4.5 w-4.5 shrink-0 text-[#ff486f]" />
                  </span>
                </div>
                <div className="h-px w-full bg-white/10" />
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-[0.92rem] text-white/70">Love language</span>
                  <span className="flex min-w-0 items-center gap-2 text-[0.92rem] text-white/90">
                    <span className="truncate">{loveStyle || "Select language"}</span>
                    <ChevronRight className="h-4.5 w-4.5 shrink-0 text-[#ff486f]" />
                  </span>
                </div>
                <div className="h-px w-full bg-white/10" />
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-[0.92rem] text-white/70">Education level</span>
                  <span className="flex min-w-0 items-center gap-2 text-[0.92rem] text-white/90">
                    <span className="truncate">{education || "Select level"}</span>
                    <ChevronRight className="h-4.5 w-4.5 shrink-0 text-[#ff486f]" />
                  </span>
                </div>
                <div className="h-px w-full bg-white/10" />
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-[0.92rem] text-white/70">Zodiac</span>
                  <span className="flex min-w-0 items-center gap-2 text-[0.92rem] text-white/90">
                    <span className="truncate">{zodiac || "Select sign"}</span>
                    <ChevronRight className="h-4.5 w-4.5 shrink-0 text-[#ff486f]" />
                  </span>
                </div>
              </div>
            </button>

            <button
              className="rounded-[1.5rem] bg-[#262626] p-4 text-left shadow-[0_18px_60px_rgba(0,0,0,0.3)] transition hover:bg-[#2a2a2a]"
              onClick={() => setLifestyleOpen(true)}
              type="button"
            >
              <SectionTitle icon={Heart} title="Lifestyle" />
              <div className="rounded-[1rem] border border-white/10 bg-[#232323] px-3.5 py-2.5">
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-[0.92rem] text-white/70">Drinking</span>
                  <span className="flex min-w-0 items-center gap-2 text-[0.92rem] text-white/90">
                    <span className="truncate">{drinking || "Select drinking"}</span>
                    <ChevronRight className="h-4.5 w-4.5 shrink-0 text-[#ff486f]" />
                  </span>
                </div>
                <div className="h-px w-full bg-white/10" />
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-[0.92rem] text-white/70">Smoking</span>
                  <span className="flex min-w-0 items-center gap-2 text-[0.92rem] text-white/90">
                    <span className="truncate">{smoking || "Select smoking"}</span>
                    <ChevronRight className="h-4.5 w-4.5 shrink-0 text-[#ff486f]" />
                  </span>
                </div>
                <div className="h-px w-full bg-white/10" />
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-[0.92rem] text-white/70">Workout</span>
                  <span className="flex min-w-0 items-center gap-2 text-[0.92rem] text-white/90">
                    <span className="truncate">{workout || "Select workout"}</span>
                    <ChevronRight className="h-4.5 w-4.5 shrink-0 text-[#ff486f]" />
                  </span>
                </div>
                <div className="h-px w-full bg-white/10" />
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-[0.92rem] text-white/70">Pets</span>
                  <span className="flex min-w-0 items-center gap-2 text-[0.92rem] text-white/90">
                    <span className="truncate">{pets || "Select pets"}</span>
                    <ChevronRight className="h-4.5 w-4.5 shrink-0 text-[#ff486f]" />
                  </span>
                </div>
              </div>
            </button>

            <div className="rounded-[1.5rem] bg-[#262626] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.3)]">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <SectionTitle icon={MapPin} title="District" />
                  <SearchableDropdown
                    onChange={setCity}
                    options={MALAWI_DISTRICTS}
                    placeholder="Search district"
                    value={city}
                  />
                </div>

                <div>
                  <SectionTitle icon={BriefcaseBusiness} title="Job Title" />
                  <DarkInput
                    placeholder="Select District"
                    value={jobTitle}
                    onChange={(event) => setJobTitle(event.target.value)}
                  />
                </div>

                <div>
                  <SectionTitle icon={MapPin} title="Location" />
                  <SearchableDropdown
                    onChange={setArea}
                    options={MALAWI_AREAS}
                    placeholder="Search area"
                    value={area}
                  />
                </div>

                <div>
                  <SectionTitle icon={Building2} title="Company" />
                  <DarkInput
                    placeholder="Enter location..."
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-[#262626] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.3)]">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-[0.85rem] font-medium text-white/80">Full name</span>
                  <DarkInput value={fullName} onChange={(event) => setFullName(event.target.value)} />
                </label>

                <label className="grid gap-2">
                  <span className="text-[0.85rem] font-medium text-white/80">Gender</span>
                  <select
                    className="h-11 rounded-2xl border border-white/25 bg-[#232323] px-4 text-sm text-white outline-none transition focus:border-[#ff486f] focus:ring-2 focus:ring-[#ff486f]/20"
                    value={gender}
                    onChange={(event) => setGender(event.target.value)}
                  >
                    <option className="bg-[#232323]" value="">
                      Select gender
                    </option>
                    <option className="bg-[#232323]" value="Male">
                      Male
                    </option>
                    <option className="bg-[#232323]" value="Female">
                      Female
                    </option>
                  </select>
                </label>
              </div>
            </div>

          </div>
        </div>
      </div>

      <RelationshipGoalsModal
        onClose={() => setRelationshipGoalsOpen(false)}
        onSelect={setRelationshipGoals}
        open={relationshipGoalsOpen}
        value={relationshipGoals}
      />

      <InterestsModal
        open={interestsOpen}
        onClose={() => setInterestsOpen(false)}
        onToggle={toggleInterest}
        selectedValues={selectedInterests}
      />

      <MoreAboutModal
        communicationStyle={comuStyle}
        educationLevel={education}
        loveLanguage={loveStyle}
        onChangeCommunicationStyle={setComuStyle}
        onChangeEducationLevel={setEducation}
        onChangeLoveLanguage={setLoveStyle}
        onChangeZodiacSign={setZodiac}
        onClose={() => setMoreAboutOpen(false)}
        open={moreAboutOpen}
        zodiacSign={zodiac}
      />

      <LifestyleModal
        drinking={drinking}
        onChangeDrinking={setDrinking}
        onChangePets={setPets}
        onChangeSmoking={setSmoking}
        onChangeWorkout={setWorkout}
        onClose={() => setLifestyleOpen(false)}
        open={lifestyleOpen}
        pets={pets}
        smoking={smoking}
        workout={workout}
      />
    </section>
  );
}

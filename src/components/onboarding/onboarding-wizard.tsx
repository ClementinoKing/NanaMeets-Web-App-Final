"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Loader2, MapPin, Plus, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentUserSafely } from "@/lib/supabase/browser-auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { saveProfileRow } from "@/lib/profile-write";
import { uploadManyToR2 } from "@/lib/r2";

type PhotoSlot = {
  file: File;
  previewUrl: string;
};

function describeSupabaseError(error: unknown) {
  if (!error) {
    return "Failed to create your profile";
  }

  if (typeof error === "object" && error !== null) {
    const maybeError = error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };

    const parts = [maybeError.message, maybeError.details, maybeError.hint].filter(
      (part): part is string => Boolean(part && part.trim()),
    );

    if (parts.length > 0) {
      return parts.join(" ");
    }

    if (maybeError.code) {
      return `Supabase error ${maybeError.code}`;
    }
  }

  return error instanceof Error ? error.message : "Failed to create your profile";
}

const STEPS = [
  "name",
  "gender",
  "dob",
  "lookingFor",
  "photos",
  "location",
] as const;

const LOOKING_FOR_OPTIONS = [
  { emoji: "💘", label: "Long-term partner" },
  { emoji: "😍", label: "Long-term, but short-term Ok" },
  { emoji: "🥂", label: "Short-term, but long-term Ok" },
  { emoji: "🎉", label: "Short-term fun" },
  { emoji: "👋🏽", label: "New friends" },
  { emoji: "🤔", label: "Still figuring it out" },
];

interface OnboardingWizardProps {
  userId: string;
  email: string;
}

export function OnboardingWizard({ userId, email }: OnboardingWizardProps) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const derivedName = useMemo(() => {
    const localPart = email.split("@")[0] ?? "NanaMeets";
    return localPart
      .replace(/[._-]+/g, " ")
      .trim()
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }, [email]);

  const [currentStep, setCurrentStep] = useState(0);
  const [fullName, setFullName] = useState(derivedName);
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [photos, setPhotos] = useState<(PhotoSlot | null)[]>([null, null, null]);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!supabase) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Set the Supabase environment variables to enable onboarding.
      </div>
    );
  }

  const progress = (currentStep + 1) / STEPS.length;
  const getAge = (dateString: string) => {
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1;
    }

    return age;
  };

  const setPhotoSlot = (index: number, file: File | null) => {
    setPhotos((current) => {
      const next = [...current];

      if (!file) {
        next[index] = null;
        return next;
      }

      const previewUrl = URL.createObjectURL(file);
      next[index] = { file, previewUrl };
      return next;
    });
  };

  const validateCurrentStep = () => {
    switch (STEPS[currentStep]) {
      case "name":
        if (!fullName.trim()) {
          setFormError("Please enter your name");
          return false;
        }
        return true;
      case "gender":
        if (!gender) {
          setFormError("Please select your gender");
          return false;
        }
        return true;
      case "dob":
        if (!dob) {
          setFormError("Please select your date of birth");
          return false;
        }
        if (getAge(dob) < 18) {
          setFormError("You must be at least 18 years old to use this app");
          return false;
        }
        return true;
      case "lookingFor":
        if (!lookingFor) {
          setFormError("Please select what you're looking for");
          return false;
        }
        return true;
      case "photos":
        if (photos.filter(Boolean).length < 3) {
          setFormError("Please upload 3 photos");
          return false;
        }
        return true;
      case "location":
        if (lat === null || lng === null) {
          setFormError("Please capture your current location");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const uploadPhotos = async () => {
    const files = photos.flatMap((slot) => (slot ? [slot.file] : []));
    return uploadManyToR2(files, { prefix: `profiles/${userId}` });
  };

  const useCurrentLocation = () => {
    setFormError(null);

    if (!navigator.geolocation) {
      setFormError("Your browser does not support location access");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setIsLocating(false);
      },
      () => {
        setFormError("We could not access your location. You can try again from this step.");
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleNext = async () => {
    setFormError(null);

    if (!validateCurrentStep()) {
      return;
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep((value) => value + 1);
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await getCurrentUserSafely(supabase);

      if (!user) {
        throw new Error("User not authenticated");
      }

      const uploadedUrls = await uploadPhotos();
      const profilePayload = {
        user_id: user.id,
        f_name: fullName.trim(),
        gender,
        dob,
        age: getAge(dob),
        relationship_goals: lookingFor,
        profile_pic: uploadedUrls[0] ?? null,
        picture2: uploadedUrls[1] ?? null,
        picture3: uploadedUrls[2] ?? null,
        verified: false,
        email,
      };

      await saveProfileRow(supabase, profilePayload);

      if (lat !== null && lng !== null) {
        const { error: locationError } = await supabase
          .from("profile")
          .update({
            lat,
            lng,
          })
          .eq("user_id", user.id);

        if (locationError) {
          console.warn("Unable to save profile location", locationError);
        }
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setFormError(describeSupabaseError(error));
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setFormError(null);
    setCurrentStep((value) => Math.max(0, value - 1));
  };

  const stepTitle = {
    name: "What is your name?",
    gender: "What is your gender?",
    dob: "What is your date of birth?",
    lookingFor: "What are you looking for?",
    photos: "Add your recent pics",
    location: "Find Connections Near You",
    about: "Tell people a little more",
  }[STEPS[currentStep]];

  const stepSubtitle = {
    name: "This is the name people will see on your profile.",
    gender: "Pick the option that best describes you.",
    dob: "We only show your age, not your birthday.",
    lookingFor: "Choose the vibe you want to bring into NanaMeets.",
    photos: "You can replace your photos later in Profile.",
    location: "Capture your current location so nearby matches can be tuned more accurately.",
  }[STEPS[currentStep]];

  return (
    <section className="overflow-hidden rounded-[32px] border border-white/70 bg-white/90 shadow-[0_28px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur">
      <div className="border-b border-slate-100/90 px-5 py-5 sm:px-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[linear-gradient(135deg,_#e84056,_#f38aa0)] transition-all duration-300"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
              Step {currentStep + 1} of {STEPS.length}
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-500">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 px-5 py-6 sm:px-8 sm:py-8">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            {stepTitle}
          </h2>
          <p className="text-sm leading-6 text-slate-500 sm:text-base">{stepSubtitle}</p>
        </div>

        {formError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-800">
            {formError}
          </div>
        ) : null}

        <div className="grid gap-5">
          {STEPS[currentStep] === "name" ? (
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Full name</span>
              <Input
                autoComplete="name"
                placeholder="Your full name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </label>
          ) : null}

          {STEPS[currentStep] === "gender" ? (
            <div className="grid grid-cols-2 gap-3">
              {["Male", "Female"].map((option) => (
                <button
                  key={option}
                  className={`rounded-3xl border px-4 py-5 text-left transition ${
                    gender === option
                      ? "border-rose-500 bg-rose-50 shadow-[0_14px_34px_-24px_rgba(232,64,86,0.9)]"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                  onClick={() => setGender(option)}
                  type="button"
                >
                  <div className="text-4xl leading-none">{option === "Male" ? "♂" : "♀"}</div>
                  <p className="mt-3 text-base font-semibold text-slate-950">{option}</p>
                </button>
              ))}
            </div>
          ) : null}

          {STEPS[currentStep] === "dob" ? (
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Date of birth</span>
              <Input
                max={`${new Date().getFullYear() - 18}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(
                  new Date().getDate()
                ).padStart(2, "0")}`}
                type="date"
                value={dob}
                onChange={(event) => setDob(event.target.value)}
              />
              <span className="text-xs text-slate-500">We only show your age, not your birthday.</span>
            </label>
          ) : null}

          {STEPS[currentStep] === "lookingFor" ? (
            <div className="grid grid-cols-2 gap-3">
              {LOOKING_FOR_OPTIONS.map((option) => {
                const active = lookingFor === option.label;

                return (
                  <button
                    key={option.label}
                    className={`flex items-center gap-3 rounded-3xl border px-4 py-4 text-left transition ${
                      active
                        ? "border-rose-500 bg-rose-50 shadow-[0_14px_34px_-24px_rgba(232,64,86,0.9)]"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                    onClick={() => setLookingFor(option.label)}
                    type="button"
                  >
                    <span className="text-2xl">{option.emoji}</span>
                    <span className={`text-sm font-medium ${active ? "text-slate-950" : "text-slate-700"}`}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}

          {STEPS[currentStep] === "photos" ? (
            <div className="grid gap-4">
              <div className="grid grid-cols-3 gap-3">
                {photos.map((slot, index) => (
                  <label
                    key={index}
                    className="group relative flex aspect-[3/4] cursor-pointer items-center justify-center overflow-hidden rounded-3xl border border-dashed border-slate-300 bg-slate-50 transition hover:border-rose-300 hover:bg-rose-50/50"
                  >
                    <input
                      accept="image/*"
                      className="hidden"
                      type="file"
                      onChange={(event) => setPhotoSlot(index, event.target.files?.[0] ?? null)}
                    />
                    {slot ? (
                      <Image
                        alt={`Profile photo ${index + 1}`}
                        className="h-full w-full object-cover"
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        src={slot.previewUrl}
                        unoptimized
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-500">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-rose-500 shadow-sm ring-1 ring-slate-200 group-hover:ring-rose-200">
                          <Plus className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-medium">Photo {index + 1}</span>
                      </div>
                    )}
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-500">Upload 3 clear photos so people can get a real feel for you.</p>
            </div>
          ) : null}

          {STEPS[currentStep] === "location" ? (
            <div className="grid gap-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                  <MapPin className="h-6 w-6" />
                </div>
                <p className="mt-4 text-sm text-slate-600">
                  Use your browser location so nearby matches can be tuned more accurately.
                </p>
                <Button
                  className="mt-4"
                  disabled={isLocating}
                  onClick={useCurrentLocation}
                  type="button"
                  variant="outline"
                >
                  {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                  {lat && lng ? "Location Captured" : "Use Current Location"}
                </Button>
                {lat && lng ? (
                  <p className="mt-3 text-xs text-emerald-600">
                    Location saved from your browser: {lat.toFixed(4)}, {lng.toFixed(4)}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <Button
            className="h-12 rounded-2xl border border-slate-200 bg-white px-5 text-slate-700 shadow-sm hover:bg-slate-50"
            disabled={currentStep === 0 || isSubmitting}
            onClick={handleBack}
            type="button"
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <Button
            className="h-12 rounded-2xl border-0 bg-[linear-gradient(135deg,_#e84056,_#f38aa0)] px-6 text-base font-semibold text-white shadow-[0_16px_36px_-18px_rgba(232,64,86,0.95)] transition hover:translate-y-[-1px] hover:opacity-95"
            disabled={isSubmitting}
            onClick={handleNext}
            type="button"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : currentStep === STEPS.length - 1 ? (
              "Finish"
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}

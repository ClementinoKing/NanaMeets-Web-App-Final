"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { Database } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { saveProfileRow } from "@/lib/profile-write";
import { profileFormSchema, type ProfileFormValues } from "@/lib/validators/profile";

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
      (part): part is string => Boolean(part && part.trim()),
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

type ProfileRow = Database["public"]["Tables"]["profile"]["Row"];
type ProfileFormSource = Pick<
  ProfileRow,
  | "f_name"
  | "gender"
  | "city"
  | "area"
  | "bio"
  | "relationship_goals"
  | "interests"
  | "height"
  | "comu_style"
  | "love_style"
  | "education"
  | "zodiac"
  | "drinking"
  | "smoking"
  | "workout"
  | "pets"
  | "job_title"
  | "company"
> & {
  email?: string | null;
};

interface ProfileFormProps {
  userId: string;
  email: string;
  profile: ProfileFormSource | null;
}

export function ProfileForm({ userId, email, profile }: ProfileFormProps) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: profile?.f_name ?? "",
      gender: profile?.gender ?? "",
      city: profile?.city ?? "",
      area: profile?.area ?? "",
      bio: profile?.bio ?? "",
      relationshipGoals: profile?.relationship_goals ?? "",
      interests: profile?.interests?.join(", ") ?? "",
      height: profile?.height?.toString() ?? "",
      comuStyle: profile?.comu_style ?? "",
      loveStyle: profile?.love_style ?? "",
      education: profile?.education ?? "",
      zodiac: profile?.zodiac ?? "",
      drinking: profile?.drinking ?? "",
      smoking: profile?.smoking ?? "",
      workout: profile?.workout ?? "",
      pets: profile?.pets ?? "",
      jobTitle: profile?.job_title ?? "",
      company: profile?.company ?? "",
    },
  });

  if (!supabase) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Set the Supabase environment variables to edit the profile.
      </div>
    );
  }

  const onSubmit = async (values: ProfileFormValues) => {
    setFormError(null);
    setSaved(false);

    const parsedHeight = values.height ? Number(values.height) : null;

    try {
      await saveProfileRow(supabase, {
        user_id: userId,
        f_name: values.fullName,
        gender: values.gender?.trim() || null,
        email,
        city: values.city?.trim() || null,
        area: values.area?.trim() || null,
        bio: values.bio?.trim() || null,
        relationship_goals: values.relationshipGoals?.trim() || null,
        interests: values.interests
          ? values.interests
              .split(",")
              .map((entry) => entry.trim())
              .filter(Boolean)
          : [],
        height: Number.isFinite(parsedHeight) ? parsedHeight : null,
        comu_style: values.comuStyle?.trim() || null,
        love_style: values.loveStyle?.trim() || null,
        education: values.education?.trim() || null,
        zodiac: values.zodiac?.trim() || null,
        drinking: values.drinking?.trim() || null,
        smoking: values.smoking?.trim() || null,
        workout: values.workout?.trim() || null,
        pets: values.pets?.trim() || null,
        job_title: values.jobTitle?.trim() || null,
        company: values.company?.trim() || null,
      });
    } catch (error) {
      setFormError(describeSupabaseError(error));
      return;
    }

    setSaved(true);
    router.refresh();
  };

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      {saved ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Profile updated.
        </div>
      ) : null}

      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">Full name</span>
        <Input autoComplete="name" {...form.register("fullName")} />
        {form.formState.errors.fullName ? (
          <span className="text-sm text-[#c2410c]">{form.formState.errors.fullName.message}</span>
        ) : null}
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Gender</span>
          <Input placeholder="Woman, man, non-binary..." {...form.register("gender")} />
          {form.formState.errors.gender ? (
            <span className="text-sm text-[#c2410c]">{form.formState.errors.gender.message}</span>
          ) : null}
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">City</span>
          <Input placeholder="Lilongwe" {...form.register("city")} />
          {form.formState.errors.city ? (
            <span className="text-sm text-[#c2410c]">{form.formState.errors.city.message}</span>
          ) : null}
        </label>
      </div>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Bio</span>
          <Textarea placeholder="Tell people what you like building or meeting about." {...form.register("bio")} />
          {form.formState.errors.bio ? (
            <span className="text-sm text-[#c2410c]">{form.formState.errors.bio.message}</span>
        ) : null}
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">Interests</span>
        <Input placeholder="events, design, startups, music" {...form.register("interests")} />
        <span className="text-xs text-slate-500">Comma separated. We turn this into a list for you.</span>
        {form.formState.errors.interests ? (
          <span className="text-sm text-[#c2410c]">{form.formState.errors.interests.message as string}</span>
        ) : null}
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Relationship goals</span>
          <Input placeholder="Dating, connection, friends..." {...form.register("relationshipGoals")} />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Area</span>
          <Input placeholder="Area or neighborhood" {...form.register("area")} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Height</span>
          <Input placeholder="170" {...form.register("height")} />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Education</span>
          <Input placeholder="University, diploma..." {...form.register("education")} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Job title</span>
          <Input placeholder="Designer, founder..." {...form.register("jobTitle")} />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Company</span>
          <Input placeholder="Company name" {...form.register("company")} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Communication style</span>
          <Input placeholder="Direct, thoughtful..." {...form.register("comuStyle")} />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Love style</span>
          <Input placeholder="Words of affirmation..." {...form.register("loveStyle")} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Zodiac</span>
          <Input placeholder="Leo" {...form.register("zodiac")} />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Pets</span>
          <Input placeholder="Dog person..." {...form.register("pets")} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Drinking</span>
          <Input placeholder="Rarely, socially..." {...form.register("drinking")} />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Smoking</span>
          <Input placeholder="No, sometimes..." {...form.register("smoking")} />
        </label>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">Workout</span>
        <Input placeholder="Gym, running, yoga..." {...form.register("workout")} />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">Email</span>
        <Input value={email} readOnly />
      </label>

      {formError ? <p className="text-sm text-[#c2410c]">{formError}</p> : null}

      <Button className="w-fit" disabled={form.formState.isSubmitting} type="submit">
        {form.formState.isSubmitting ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
}

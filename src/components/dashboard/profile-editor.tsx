"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType, InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { useRouter } from "next/navigation";
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
import type { Database } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MALAWI_AREAS, MALAWI_DISTRICTS } from "@/lib/malawi-locations";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { saveProfileRow } from "@/lib/profile-write";
import { uploadManyToR2 } from "@/lib/r2";
import { toast } from "sonner";

type ProfileRow = Database["public"]["Tables"]["profile"]["Row"];

type PhotoSlot = {
  existingUrl: string | null;
  file: File | null;
  previewUrl: string | null;
};

interface ProfileEditorProps {
  userId: string;
  email: string;
  profile: ProfileRow | null;
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

function EditableRow({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/10 py-2.5 last:border-b-0">
      <span className="text-[0.92rem] text-white/85">{label}</span>
      <div className="flex min-w-0 items-center gap-2.5">
        <input
          className="w-full bg-transparent text-right text-[0.9rem] text-white/75 outline-none placeholder:text-white/30"
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          value={value}
        />
        <ChevronRight className="h-4.5 w-4.5 shrink-0 text-[#ff486f]" />
      </div>
    </div>
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
  const router = useRouter();
  const profilePic = profile?.profile_pic ?? null;
  const picture2 = profile?.picture2 ?? null;
  const picture3 = profile?.picture3 ?? null;
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState(profile?.f_name ?? "");
  const [gender, setGender] = useState(profile?.gender ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [area, setArea] = useState(profile?.area ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [relationshipGoals, setRelationshipGoals] = useState(profile?.relationship_goals ?? "");
  const [interests, setInterests] = useState(profile?.interests?.join(", ") ?? "");
  const [height, setHeight] = useState(profile?.height?.toString() ?? "");
  const [comuStyle, setComuStyle] = useState(profile?.comu_style ?? "");
  const [loveStyle, setLoveStyle] = useState(profile?.love_style ?? "");
  const [education, setEducation] = useState(profile?.education ?? "");
  const [zodiac, setZodiac] = useState(profile?.zodiac ?? "");
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

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        const message = "Set the Supabase environment variables to edit the profile.";
        setError(message);
        toast.error(message);
        return;
      }

      const keepExisting = (nextValue: string, existingValue: string | null) =>
        nextValue.trim() || existingValue || null;
      const keepExistingArray = (nextValue: string, existingValue: string[] | null) =>
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

      setSaved(true);
      toast.success("Profile updated successfully");
      router.refresh();
    } catch (saveError) {
      const message = describeSupabaseError(saveError);
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

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
              <div className="rounded-[1rem] border border-white/20 bg-[#232323] px-3.5 py-3.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[0.9rem] text-white/50">Looking for</span>
                  <select
                    className="w-full max-w-[250px] bg-transparent text-right text-[0.9rem] text-white/80 outline-none"
                    value={relationshipGoals}
                    onChange={(event) => setRelationshipGoals(event.target.value)}
                  >
                    <option className="bg-[#232323]" value="">
                      Select a goal
                    </option>
                    <option className="bg-[#232323]" value="Long-term partner">
                      Long-term partner
                    </option>
                    <option className="bg-[#232323]" value="Long-term, but short-term Ok">
                      Long-term, but short-term Ok
                    </option>
                    <option className="bg-[#232323]" value="Short-term, but long-term Ok">
                      Short-term, but long-term Ok
                    </option>
                    <option className="bg-[#232323]" value="Short-term fun">
                      Short-term fun
                    </option>
                    <option className="bg-[#232323]" value="New friends">
                      New friends
                    </option>
                    <option className="bg-[#232323]" value="Still figuring it out">
                      Still figuring it out
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <SectionTitle icon={Sparkles} title="Interests" />
              <DarkInput
                placeholder="Select interests..."
                value={interests}
                onChange={(event) => setInterests(event.target.value)}
              />
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
            <div className="rounded-[1.5rem] bg-[#262626] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.3)]">
              <SectionTitle icon={Star} title="More about me" />
              <div className="rounded-[1rem] border border-white/35 bg-[#232323] px-3.5">
                <EditableRow
                  label="Communication style"
                  onChange={setComuStyle}
                  placeholder="add style"
                  value={comuStyle}
                />
                <EditableRow
                  label="Love language"
                  onChange={setLoveStyle}
                  placeholder="add love language"
                  value={loveStyle}
                />
                <EditableRow
                  label="Education level"
                  onChange={setEducation}
                  placeholder="add education level"
                  value={education}
                />
                <EditableRow
                  label="Zodiac"
                  onChange={setZodiac}
                  placeholder="add zodiac sign"
                  value={zodiac}
                />
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-[#262626] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.3)]">
              <SectionTitle icon={Heart} title="Lifestyle" />
              <div className="rounded-[1rem] border border-white/20 bg-[#232323] px-3.5">
                <EditableRow label="Drinking" onChange={setDrinking} placeholder="add drinking" value={drinking} />
                <EditableRow label="Smoking" onChange={setSmoking} placeholder="add smoking" value={smoking} />
                <EditableRow label="Workout" onChange={setWorkout} placeholder="add workout" value={workout} />
                <EditableRow label="Pets" onChange={setPets} placeholder="add pets" value={pets} />
              </div>
            </div>

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
                  <DarkInput value={gender} onChange={(event) => setGender(event.target.value)} />
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Button
                className="h-12 rounded-2xl border-0 bg-[linear-gradient(135deg,#ff486f,#ea2f7b)] px-6 text-base font-semibold text-white shadow-[0_16px_36px_-18px_rgba(232,64,86,0.95)] transition hover:translate-y-[-1px] hover:opacity-95"
                disabled={saving}
                onClick={handleSave}
                type="button"
              >
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

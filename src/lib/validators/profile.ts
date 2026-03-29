import { z } from "zod";

export const profileFormSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  gender: z.string().trim().max(40, "Gender must be 40 characters or fewer").optional(),
  city: z.string().trim().max(80, "City must be 80 characters or fewer").optional(),
  area: z.string().trim().max(80, "Area must be 80 characters or fewer").optional(),
  bio: z.string().trim().max(280, "Bio must be 280 characters or fewer").optional(),
  relationshipGoals: z.string().trim().max(120, "Keep this short").optional(),
  interests: z.string().trim().max(180, "Keep interests under 180 characters").optional(),
  height: z.string().trim().max(8, "Height must be 8 characters or fewer").optional(),
  comuStyle: z.string().trim().max(80, "Communication style must be 80 characters or fewer").optional(),
  loveStyle: z.string().trim().max(80, "Love style must be 80 characters or fewer").optional(),
  education: z.string().trim().max(80, "Education must be 80 characters or fewer").optional(),
  zodiac: z.string().trim().max(40, "Zodiac must be 40 characters or fewer").optional(),
  drinking: z.string().trim().max(40, "Drinking must be 40 characters or fewer").optional(),
  smoking: z.string().trim().max(40, "Smoking must be 40 characters or fewer").optional(),
  workout: z.string().trim().max(40, "Workout must be 40 characters or fewer").optional(),
  pets: z.string().trim().max(40, "Pets must be 40 characters or fewer").optional(),
  jobTitle: z.string().trim().max(80, "Job title must be 80 characters or fewer").optional(),
  company: z.string().trim().max(80, "Company must be 80 characters or fewer").optional(),
});

export const messageSchema = z.object({
  recipientLookup: z.string().trim().min(1, "Enter a user ID or email address"),
  message: z.string().trim().min(1, "Message is required").max(280, "Message must be 280 characters or fewer"),
});

export type ProfileFormValues = z.input<typeof profileFormSchema>;
export type MessageValues = z.infer<typeof messageSchema>;

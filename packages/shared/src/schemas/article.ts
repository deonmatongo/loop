import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const CreateArticleSchema = z.object({
  title: z.string().min(1).max(256),
  slug: z
    .string()
    .min(1)
    .max(128)
    .regex(slugRegex, "Slug must be lowercase letters, numbers, and hyphens only"),
  content: z.string(),
});

export const UpdateArticleSchema = z.object({
  title: z.string().min(1).max(256).optional(),
  content: z.string().optional(),
  changeSummary: z.string().max(256).optional(),
  publish: z.boolean().optional(),
});

export type CreateArticleInput = z.infer<typeof CreateArticleSchema>;
export type UpdateArticleInput = z.infer<typeof UpdateArticleSchema>;

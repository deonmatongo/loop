import { z } from "zod";

export const CreatePlaybookSchema = z.object({
  title: z.string().min(1).max(256),
  description: z.string().max(1024).optional(),
});

export const UpdatePlaybookSchema = z.object({
  title: z.string().min(1).max(256).optional(),
  description: z.string().max(1024).optional(),
});

export const AddPlaybookItemSchema = z.object({
  articleId: z.string().cuid(),
  position: z.number().int().min(1),
});

export const ReorderPlaybookSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().cuid(),
      position: z.number().int().min(1),
    })
  ),
});

export type CreatePlaybookInput = z.infer<typeof CreatePlaybookSchema>;
export type UpdatePlaybookInput = z.infer<typeof UpdatePlaybookSchema>;
export type AddPlaybookItemInput = z.infer<typeof AddPlaybookItemSchema>;
export type ReorderPlaybookInput = z.infer<typeof ReorderPlaybookSchema>;

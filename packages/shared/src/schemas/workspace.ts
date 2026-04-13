import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(2).max(64),
  slug: z
    .string()
    .min(3)
    .max(48)
    .regex(slugRegex, "Slug must be lowercase letters, numbers, and hyphens only"),
});

export const UpdateWorkspaceSchema = z.object({
  name: z.string().min(2).max(64).optional(),
});

export const InviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["OWNER", "EDITOR", "VIEWER"]),
});

export const UpdateMemberRoleSchema = z.object({
  role: z.enum(["OWNER", "EDITOR", "VIEWER"]),
});

export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof UpdateWorkspaceSchema>;
export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof UpdateMemberRoleSchema>;

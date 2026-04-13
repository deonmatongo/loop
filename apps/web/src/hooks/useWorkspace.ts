import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import type { CreateWorkspaceInput } from "@loop/shared";

type Workspace = {
  id: string;
  slug: string;
  name: string;
  plan: "FREE" | "PRO";
  role: "OWNER" | "EDITOR" | "VIEWER";
};

export function useWorkspaces() {
  return useQuery<{ workspaces: Workspace[] }>({
    queryKey: ["workspaces"],
    queryFn: () => api.get("/workspaces"),
  });
}

export function useWorkspace(slug: string) {
  return useQuery({
    queryKey: ["workspaces", slug],
    queryFn: () => api.get<{ workspace: Workspace; role: string }>(`/workspaces/${slug}`),
    enabled: !!slug,
  });
}

export function useCreateWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWorkspaceInput) => api.post<{ workspace: Workspace }>("/workspaces", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workspaces"] }),
  });
}

export function useMembers(slug: string) {
  return useQuery({
    queryKey: ["workspaces", slug, "members"],
    queryFn: () =>
      api.get<{
        members: {
          id: string;
          role: string;
          user: { id: string; email: string; displayName: string; avatarUrl: string | null };
        }[];
      }>(`/workspaces/${slug}/members`),
    enabled: !!slug,
  });
}

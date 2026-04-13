import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import type { CreatePlaybookInput } from "@loop/shared";

type PlaybookSummary = {
  id: string;
  title: string;
  description: string | null;
  _count: { items: number };
};

type PlaybookItem = {
  id: string;
  position: number;
  completed: boolean;
  article: { id: string; slug: string; title: string; publishedAt: string | null };
};

type Playbook = PlaybookSummary & { items: PlaybookItem[] };

export function usePlaybooks(workspaceSlug: string) {
  return useQuery({
    queryKey: ["workspaces", workspaceSlug, "playbooks"],
    queryFn: () =>
      api.get<{ playbooks: PlaybookSummary[] }>(`/workspaces/${workspaceSlug}/playbooks`),
    enabled: !!workspaceSlug,
  });
}

export function usePlaybook(workspaceSlug: string, playbookId: string) {
  return useQuery({
    queryKey: ["workspaces", workspaceSlug, "playbooks", playbookId],
    queryFn: () =>
      api.get<{ playbook: Playbook }>(`/workspaces/${workspaceSlug}/playbooks/${playbookId}`),
    enabled: !!workspaceSlug && !!playbookId,
  });
}

export function useCreatePlaybook(workspaceSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePlaybookInput) =>
      api.post<{ playbook: PlaybookSummary }>(`/workspaces/${workspaceSlug}/playbooks`, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["workspaces", workspaceSlug, "playbooks"] }),
  });
}

export function useCompleteArticle(workspaceSlug: string, playbookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ articleId, completed }: { articleId: string; completed: boolean }) =>
      completed
        ? api.post(`/workspaces/${workspaceSlug}/playbooks/${playbookId}/complete/${articleId}`)
        : api.delete(`/workspaces/${workspaceSlug}/playbooks/${playbookId}/complete/${articleId}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["workspaces", workspaceSlug, "playbooks", playbookId] }),
  });
}

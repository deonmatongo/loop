import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import type { CreateArticleInput, UpdateArticleInput } from "@loop/shared";

type ArticleSummary = {
  id: string;
  slug: string;
  title: string;
  publishedAt: string | null;
  updatedAt: string;
  _count: { versions: number };
};

type Article = ArticleSummary & { content: string; createdAt: string };

export function useArticles(workspaceSlug: string) {
  return useQuery({
    queryKey: ["workspaces", workspaceSlug, "articles"],
    queryFn: () =>
      api.get<{ articles: ArticleSummary[] }>(`/workspaces/${workspaceSlug}/articles`),
    enabled: !!workspaceSlug,
  });
}

export function useArticle(workspaceSlug: string, articleSlug: string) {
  return useQuery({
    queryKey: ["workspaces", workspaceSlug, "articles", articleSlug],
    queryFn: () =>
      api.get<{ article: Article }>(`/workspaces/${workspaceSlug}/articles/${articleSlug}`),
    enabled: !!workspaceSlug && !!articleSlug,
  });
}

export function useArticleVersions(workspaceSlug: string, articleSlug: string) {
  return useQuery({
    queryKey: ["workspaces", workspaceSlug, "articles", articleSlug, "versions"],
    queryFn: () =>
      api.get<{ versions: { versionNumber: number; title: string; createdAt: string; changeSummary: string | null; author: { displayName: string } }[] }>(
        `/workspaces/${workspaceSlug}/articles/${articleSlug}/versions`
      ),
    enabled: !!workspaceSlug && !!articleSlug,
  });
}

export function useCreateArticle(workspaceSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateArticleInput) =>
      api.post<{ article: Article }>(`/workspaces/${workspaceSlug}/articles`, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["workspaces", workspaceSlug, "articles"] }),
  });
}

export function useUpdateArticle(workspaceSlug: string, articleSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateArticleInput) =>
      api.patch<{ article: Article }>(
        `/workspaces/${workspaceSlug}/articles/${articleSlug}`,
        data
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workspaces", workspaceSlug, "articles"] });
    },
  });
}

export function useSearch(workspaceSlug: string, query: string) {
  return useQuery({
    queryKey: ["workspaces", workspaceSlug, "search", query],
    queryFn: () =>
      api.get<{ results: { id: string; slug: string; title: string }[] }>(
        `/workspaces/${workspaceSlug}/search?q=${encodeURIComponent(query)}`
      ),
    enabled: query.length >= 2,
  });
}

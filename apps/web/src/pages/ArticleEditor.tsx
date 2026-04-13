import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout.js";
import { useArticle, useCreateArticle, useUpdateArticle } from "../hooks/useArticles.js";

export default function ArticleEditor() {
  const { workspaceSlug, articleSlug } = useParams<{
    workspaceSlug: string;
    articleSlug?: string;
  }>();
  const navigate = useNavigate();
  const isNew = !articleSlug;

  const { data } = useArticle(workspaceSlug!, articleSlug ?? "");
  const createArticle = useCreateArticle(workspaceSlug!);
  const updateArticle = useUpdateArticle(workspaceSlug!, articleSlug ?? "");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [changeSummary, setChangeSummary] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (data?.article) {
      setTitle(data.article.title);
      setSlug(data.article.slug);
      setContent(data.article.content);
    }
  }, [data]);

  // Auto-generate slug from title when creating
  useEffect(() => {
    if (isNew && title) {
      setSlug(
        title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .slice(0, 128)
      );
    }
  }, [isNew, title]);

  const handleSubmit = async (e: React.FormEvent, publish?: boolean) => {
    e.preventDefault();
    setError("");
    try {
      if (isNew) {
        const res = await createArticle.mutateAsync({ title, slug, content });
        navigate(`/${workspaceSlug}/articles/${res.article.slug}`);
      } else {
        await updateArticle.mutateAsync({
          title,
          content,
          changeSummary: changeSummary || undefined,
          publish,
        });
        navigate(`/${workspaceSlug}/articles/${articleSlug}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  };

  const isPending = createArticle.isPending || updateArticle.isPending;

  return (
    <Layout>
      <div className="max-w-3xl">
        <h1 className="mb-6">{isNew ? "New article" : "Edit article"}</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              className="input text-lg font-medium"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Article title"
              required
            />
          </div>

          {isNew && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                className="input font-mono text-sm"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="article-slug"
                pattern="[a-z0-9\-]+"
                required
              />
            </div>
          )}

          {!isNew && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Change summary <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                className="input text-sm"
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                placeholder="What changed?"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content <span className="text-gray-400 font-normal">(Markdown)</span>
            </label>
            <textarea
              className="input font-mono text-sm min-h-[400px] resize-y"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="# My article&#10;&#10;Write in Markdown..."
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" className="btn-primary" disabled={isPending}>
              {isPending ? "Saving..." : "Save draft"}
            </button>
            {!isNew && (
              <button
                type="button"
                className="btn-secondary"
                disabled={isPending}
                onClick={(e) => handleSubmit(e as unknown as React.FormEvent, true)}
              >
                Save & publish
              </button>
            )}
          </div>
        </form>
      </div>
    </Layout>
  );
}

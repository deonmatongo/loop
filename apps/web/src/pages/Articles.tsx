import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "../components/Layout.js";
import { useArticles, useSearch } from "../hooks/useArticles.js";

export default function Articles() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const [query, setQuery] = useState("");
  const { data: articlesData, isLoading } = useArticles(workspaceSlug!);
  const { data: searchData } = useSearch(workspaceSlug!, query);

  const displaying = query.length >= 2 ? searchData?.results ?? [] : (articlesData?.articles ?? []);

  return (
    <Layout>
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h1>Articles</h1>
          <Link to={`/${workspaceSlug}/articles/new`} className="btn-primary">
            New article
          </Link>
        </div>

        <div className="mb-4">
          <input
            className="input"
            placeholder="Search articles..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {isLoading && <p className="text-gray-500 text-sm">Loading...</p>}

        <div className="card divide-y divide-gray-100">
          {displaying.length === 0 && !isLoading && (
            <p className="p-6 text-sm text-gray-400 text-center">
              {query ? "No articles match your search." : "No articles yet. Create your first one."}
            </p>
          )}
          {displaying.map((a) => (
            <div key={a.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <Link
                  to={`/${workspaceSlug}/articles/${a.slug}`}
                  className="font-medium text-gray-900 hover:text-brand-600"
                >
                  {a.title}
                </Link>
                <div className="flex items-center gap-2 mt-0.5">
                  {"publishedAt" in a && (
                    <span
                      className={`badge ${
                        (a as { publishedAt: string | null }).publishedAt
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {(a as { publishedAt: string | null }).publishedAt ? "Published" : "Draft"}
                    </span>
                  )}
                  {"updatedAt" in a && (
                    <span className="text-xs text-gray-400">
                      {new Date((a as { updatedAt: string }).updatedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <Link
                to={`/${workspaceSlug}/articles/${a.slug}/edit`}
                className="text-sm text-gray-500 hover:text-brand-600"
              >
                Edit
              </Link>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

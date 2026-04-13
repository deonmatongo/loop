import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Layout } from "../components/Layout.js";
import { useArticle, useArticleVersions } from "../hooks/useArticles.js";

export default function ArticleView() {
  const { workspaceSlug, articleSlug } = useParams<{
    workspaceSlug: string;
    articleSlug: string;
  }>();
  const { data, isLoading } = useArticle(workspaceSlug!, articleSlug!);
  const { data: versionsData } = useArticleVersions(workspaceSlug!, articleSlug!);
  const [showHistory, setShowHistory] = useState(false);

  if (isLoading) return <Layout><p className="text-gray-500">Loading...</p></Layout>;
  if (!data) return <Layout><p className="text-red-500">Article not found.</p></Layout>;

  const { article } = data;

  return (
    <Layout>
      <div className="max-w-3xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <Link
              to={`/${workspaceSlug}/articles`}
              className="text-sm text-gray-500 hover:text-brand-600 mb-2 inline-block"
            >
              ← Articles
            </Link>
            <h1>{article.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span
                className={`badge ${
                  article.publishedAt
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {article.publishedAt ? "Published" : "Draft"}
              </span>
              <span className="text-sm text-gray-400">
                Updated {new Date(article.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="btn-secondary text-xs"
            >
              {showHistory ? "Hide history" : "Version history"}
            </button>
            <Link
              to={`/${workspaceSlug}/articles/${articleSlug}/edit`}
              className="btn-primary text-xs"
            >
              Edit
            </Link>
          </div>
        </div>

        {showHistory && versionsData && (
          <div className="card mb-6 p-4">
            <h3 className="text-sm font-semibold mb-3">Version history</h3>
            <div className="space-y-2">
              {versionsData.versions.map((v) => (
                <div key={v.versionNumber} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded mr-2">
                      v{v.versionNumber}
                    </span>
                    <span className="text-gray-600">{v.changeSummary ?? "No summary"}</span>
                  </div>
                  <div className="text-right text-gray-400 text-xs">
                    <span>{v.author.displayName}</span>
                    <span className="ml-2">{new Date(v.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card p-8 prose prose-gray max-w-none">
          <ReactMarkdown>{article.content}</ReactMarkdown>
        </div>
      </div>
    </Layout>
  );
}

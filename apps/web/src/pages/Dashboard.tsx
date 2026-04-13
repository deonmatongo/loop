import { useParams, Link } from "react-router-dom";
import { Layout } from "../components/Layout.js";
import { useWorkspace } from "../hooks/useWorkspace.js";
import { useArticles } from "../hooks/useArticles.js";
import { usePlaybooks } from "../hooks/usePlaybooks.js";

export default function Dashboard() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const { data: wsData } = useWorkspace(workspaceSlug!);
  const { data: articlesData } = useArticles(workspaceSlug!);
  const { data: playbooksData } = usePlaybooks(workspaceSlug!);

  return (
    <Layout>
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1>{wsData?.workspace.name ?? "Dashboard"}</h1>
          <p className="text-gray-500 mt-1">
            Welcome back. Here's an overview of your knowledge base.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card p-5">
            <p className="text-sm text-gray-500">Articles</p>
            <p className="text-3xl font-bold mt-1">{articlesData?.articles.length ?? "—"}</p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-gray-500">Playbooks</p>
            <p className="text-3xl font-bold mt-1">{playbooksData?.playbooks.length ?? "—"}</p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-gray-500">Plan</p>
            <p className="text-3xl font-bold mt-1">{wsData?.workspace.plan ?? "—"}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold">Recent articles</h2>
              <Link to={`/${workspaceSlug}/articles`} className="text-sm text-brand-600 hover:underline">
                View all
              </Link>
            </div>
            <div className="card divide-y divide-gray-100">
              {articlesData?.articles.slice(0, 5).map((a) => (
                <Link
                  key={a.id}
                  to={`/${workspaceSlug}/articles/${a.slug}`}
                  className="block px-4 py-3 hover:bg-gray-50"
                >
                  <p className="text-sm font-medium text-gray-900">{a.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {a.publishedAt ? "Published" : "Draft"} ·{" "}
                    {new Date(a.updatedAt).toLocaleDateString()}
                  </p>
                </Link>
              ))}
              {!articlesData?.articles.length && (
                <p className="px-4 py-6 text-sm text-gray-400 text-center">No articles yet.</p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold">Playbooks</h2>
              <Link to={`/${workspaceSlug}/playbooks`} className="text-sm text-brand-600 hover:underline">
                View all
              </Link>
            </div>
            <div className="card divide-y divide-gray-100">
              {playbooksData?.playbooks.slice(0, 5).map((p) => (
                <Link
                  key={p.id}
                  to={`/${workspaceSlug}/playbooks/${p.id}`}
                  className="block px-4 py-3 hover:bg-gray-50"
                >
                  <p className="text-sm font-medium text-gray-900">{p.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{p._count.items} articles</p>
                </Link>
              ))}
              {!playbooksData?.playbooks.length && (
                <p className="px-4 py-6 text-sm text-gray-400 text-center">No playbooks yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

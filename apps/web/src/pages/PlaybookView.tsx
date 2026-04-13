import { useParams, Link } from "react-router-dom";
import { Layout } from "../components/Layout.js";
import { usePlaybook, useCompleteArticle } from "../hooks/usePlaybooks.js";

export default function PlaybookView() {
  const { workspaceSlug, playbookId } = useParams<{
    workspaceSlug: string;
    playbookId: string;
  }>();
  const { data, isLoading } = usePlaybook(workspaceSlug!, playbookId!);
  const completeArticle = useCompleteArticle(workspaceSlug!, playbookId!);

  if (isLoading) return <Layout><p className="text-gray-500">Loading...</p></Layout>;
  if (!data) return <Layout><p className="text-red-500">Playbook not found.</p></Layout>;

  const { playbook } = data;
  const completedCount = playbook.items.filter((i) => i.completed).length;
  const total = playbook.items.length;
  const progressPct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <Layout>
      <div className="max-w-2xl">
        <Link
          to={`/${workspaceSlug}/playbooks`}
          className="text-sm text-gray-500 hover:text-brand-600 mb-4 inline-block"
        >
          ← Playbooks
        </Link>

        <h1 className="mb-1">{playbook.title}</h1>
        {playbook.description && (
          <p className="text-gray-500 mb-4">{playbook.description}</p>
        )}

        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">
              {completedCount}/{total} completed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-brand-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          {playbook.items.map((item) => (
            <div key={item.id} className="card p-4 flex items-center gap-4">
              <button
                onClick={() =>
                  completeArticle.mutate({ articleId: item.articleId, completed: !item.completed })
                }
                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  item.completed
                    ? "bg-brand-600 border-brand-600 text-white"
                    : "border-gray-300 hover:border-brand-400"
                }`}
                aria-label={item.completed ? "Mark incomplete" : "Mark complete"}
              >
                {item.completed && (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                  </svg>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${item.completed ? "line-through text-gray-400" : "text-gray-900"}`}>
                  <span className="text-gray-400 text-sm mr-2">{item.position}.</span>
                  {item.article.title}
                </p>
              </div>
              <Link
                to={`/${workspaceSlug}/articles/${item.article.slug}`}
                className="text-sm text-brand-600 hover:underline flex-shrink-0"
              >
                Read →
              </Link>
            </div>
          ))}

          {total === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">
              No articles in this playbook yet. Add some from the editor.
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
}

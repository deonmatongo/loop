import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "../components/Layout.js";
import { usePlaybooks, useCreatePlaybook } from "../hooks/usePlaybooks.js";

export default function Playbooks() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const { data, isLoading } = usePlaybooks(workspaceSlug!);
  const create = useCreatePlaybook(workspaceSlug!);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await create.mutateAsync({
        title: fd.get("title") as string,
        description: (fd.get("description") as string) || undefined,
      });
      setShowForm(false);
      window.location.href = `/${workspaceSlug}/playbooks/${res.playbook.id}`;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create playbook");
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h1>Playbooks</h1>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            New playbook
          </button>
        </div>

        {showForm && (
          <div className="card p-5 mb-6">
            <h2 className="mb-4">New playbook</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input name="title" className="input" placeholder="New employee onboarding" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input name="description" className="input" placeholder="What is this playbook for?" />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <button type="submit" className="btn-primary" disabled={create.isPending}>
                  {create.isPending ? "Creating..." : "Create"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {isLoading && <p className="text-gray-500">Loading...</p>}

        <div className="space-y-3">
          {data?.playbooks.map((p) => (
            <Link
              key={p.id}
              to={`/${workspaceSlug}/playbooks/${p.id}`}
              className="card p-4 flex items-center justify-between hover:border-brand-300 transition-colors"
            >
              <div>
                <p className="font-medium text-gray-900">{p.title}</p>
                {p.description && (
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{p.description}</p>
                )}
              </div>
              <span className="text-sm text-gray-400 flex-shrink-0 ml-4">
                {p._count.items} articles
              </span>
            </Link>
          ))}
          {!isLoading && !data?.playbooks.length && (
            <p className="text-sm text-gray-400 text-center py-8">No playbooks yet.</p>
          )}
        </div>
      </div>
    </Layout>
  );
}

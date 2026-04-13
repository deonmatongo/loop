import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWorkspaces, useCreateWorkspace } from "../hooks/useWorkspace.js";
import { CreateWorkspaceSchema } from "@loop/shared";

export default function WorkspaceSelect() {
  const { data, isLoading } = useWorkspaces();
  const create = useCreateWorkspace();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const parsed = CreateWorkspaceSchema.safeParse({
      name: fd.get("name"),
      slug: fd.get("slug"),
    });
    if (!parsed.success) {
      setError(Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? "Invalid input");
      return;
    }
    try {
      const res = await create.mutateAsync(parsed.data);
      navigate(`/${res.workspace.slug}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create workspace");
    }
  };

  if (isLoading) return <div className="p-8 text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="card w-full max-w-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Your workspaces</h1>

        {data?.workspaces.length === 0 && (
          <p className="text-gray-500 mb-4 text-sm">You haven't joined any workspaces yet.</p>
        )}

        <div className="space-y-2 mb-6">
          {data?.workspaces.map((ws) => (
            <Link
              key={ws.id}
              to={`/${ws.slug}`}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-colors"
            >
              <div>
                <p className="font-medium text-gray-900">{ws.name}</p>
                <p className="text-xs text-gray-500">/{ws.slug}</p>
              </div>
              <span className={`badge ${ws.plan === "PRO" ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-600"}`}>
                {ws.plan}
              </span>
            </Link>
          ))}
        </div>

        {!showForm ? (
          <button onClick={() => setShowForm(true)} className="btn-primary w-full">
            Create a workspace
          </button>
        ) : (
          <form onSubmit={handleCreate} className="space-y-3 border-t pt-4">
            <h2 className="font-semibold text-gray-900">New workspace</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input name="name" className="input" placeholder="Acme Corp" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
              <input name="slug" className="input" placeholder="acme-corp" pattern="[a-z0-9\-]+" required />
              <p className="text-xs text-gray-400 mt-1">Lowercase letters, numbers, hyphens only</p>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex-1" disabled={create.isPending}>
                {create.isPending ? "Creating..." : "Create"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

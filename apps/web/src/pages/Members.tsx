import { useState } from "react";
import { useParams } from "react-router-dom";
import { Layout } from "../components/Layout.js";
import { useMembers } from "../hooks/useWorkspace.js";
import { useMe } from "../hooks/useAuth.js";
import { api } from "../lib/api.js";
import { useQueryClient } from "@tanstack/react-query";

export default function Members() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const { data: membersData, isLoading } = useMembers(workspaceSlug!);
  const { data: meData } = useMe();
  const qc = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"EDITOR" | "VIEWER">("VIEWER");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const myMembership = membersData?.members.find((m) => m.user.id === meData?.user.id);
  const isOwner = myMembership?.role === "OWNER";

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await api.post(`/workspaces/${workspaceSlug}/members`, {
        email: inviteEmail,
        role: inviteRole,
      });
      setSuccess(`${inviteEmail} added successfully.`);
      setInviteEmail("");
      qc.invalidateQueries({ queryKey: ["workspaces", workspaceSlug, "members"] });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm("Remove this member?")) return;
    try {
      await api.delete(`/workspaces/${workspaceSlug}/members/${userId}`);
      qc.invalidateQueries({ queryKey: ["workspaces", workspaceSlug, "members"] });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl">
        <h1 className="mb-6">Members</h1>

        {isOwner && (
          <div className="card p-5 mb-6">
            <h2 className="mb-4">Invite a member</h2>
            <form onSubmit={handleInvite} className="flex gap-2">
              <input
                className="input flex-1"
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
              <select
                className="input w-32"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "EDITOR" | "VIEWER")}
              >
                <option value="VIEWER">Viewer</option>
                <option value="EDITOR">Editor</option>
              </select>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "..." : "Invite"}
              </button>
            </form>
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            {success && <p className="text-sm text-green-600 mt-2">{success}</p>}
            <p className="text-xs text-gray-400 mt-2">
              The user must already have a Loop account. You can invite new users once email is wired up.
            </p>
          </div>
        )}

        {isLoading && <p className="text-gray-500">Loading...</p>}

        <div className="card divide-y divide-gray-100">
          {membersData?.members.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium text-gray-900">{m.user.displayName}</p>
                <p className="text-sm text-gray-500">{m.user.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`badge ${
                  m.role === "OWNER"
                    ? "bg-brand-100 text-brand-700"
                    : m.role === "EDITOR"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {m.role}
                </span>
                {isOwner && m.user.id !== meData?.user.id && (
                  <button
                    onClick={() => handleRemove(m.user.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

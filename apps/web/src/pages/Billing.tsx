import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Layout } from "../components/Layout.js";
import { useWorkspace } from "../hooks/useWorkspace.js";
import { api } from "../lib/api.js";

export default function Billing() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const [searchParams] = useSearchParams();
  const { data } = useWorkspace(workspaceSlug!);
  const [loading, setLoading] = useState(false);

  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");
  const isPro = data?.workspace.plan === "PRO";

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await api.post<{ url: string }>(
        `/workspaces/${workspaceSlug}/billing/checkout`
      );
      window.location.href = res.url;
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to start checkout");
      setLoading(false);
    }
  };

  const handleManage = async () => {
    setLoading(true);
    try {
      const res = await api.post<{ url: string }>(
        `/workspaces/${workspaceSlug}/billing/portal`
      );
      window.location.href = res.url;
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to open portal");
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-lg">
        <h1 className="mb-6">Billing</h1>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-sm text-green-700">
            Upgrade successful. Welcome to Loop Pro!
          </div>
        )}
        {canceled && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-sm text-yellow-700">
            Checkout was canceled. Your plan has not changed.
          </div>
        )}

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2>Current plan</h2>
              <p className="text-gray-500 text-sm mt-1">{data?.workspace.name}</p>
            </div>
            <span className={`badge text-base px-3 py-1 ${isPro ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-600"}`}>
              {data?.workspace.plan ?? "..."}
            </span>
          </div>

          {isPro ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                You're on the Pro plan. Manage your subscription, update payment details, or cancel below.
              </p>
              <button onClick={handleManage} className="btn-secondary" disabled={loading}>
                {loading ? "Loading..." : "Manage subscription"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2 text-sm text-gray-600">
                <p className="font-medium text-gray-900">Upgrade to Pro</p>
                <ul className="space-y-1 ml-2">
                  <li>✓ Unlimited articles</li>
                  <li>✓ Full-text search across all content</li>
                  <li>✓ Priority support</li>
                </ul>
              </div>
              <button onClick={handleUpgrade} className="btn-primary" disabled={loading}>
                {loading ? "Loading..." : "Upgrade to Pro — $29/mo"}
              </button>
              <p className="text-xs text-gray-400">
                Test mode: use card <code className="bg-gray-100 px-1 rounded">4242 4242 4242 4242</code>
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

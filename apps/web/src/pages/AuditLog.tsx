import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "../components/Layout.js";
import { api } from "../lib/api.js";

type LogEntry = {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  createdAt: string;
  metadata: Record<string, unknown> | null;
  actor: { id: string; displayName: string; avatarUrl: string | null } | null;
};

export default function AuditLog() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["workspaces", workspaceSlug, "audit", page],
    queryFn: () =>
      api.get<{ logs: LogEntry[]; total: number; pages: number }>(
        `/workspaces/${workspaceSlug}/audit?page=${page}`
      ),
  });

  return (
    <Layout>
      <div className="max-w-4xl">
        <h1 className="mb-6">Audit Log</h1>

        {isLoading && <p className="text-gray-500">Loading...</p>}
        {isError && <p className="text-red-500">You need OWNER access to view the audit log.</p>}

        {data && (
          <>
            <div className="card divide-y divide-gray-100 mb-4">
              {data.logs.map((log) => (
                <div key={log.id} className="px-4 py-3 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
                        {log.action}
                      </span>
                      <span className="text-sm text-gray-500">
                        {log.actor?.displayName ?? "System"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {log.resourceType}/{log.resourceId}
                      {log.metadata && (
                        <span className="ml-2 text-gray-300">
                          {JSON.stringify(log.metadata)}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-4">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
              {data.logs.length === 0 && (
                <p className="px-4 py-6 text-sm text-gray-400 text-center">No audit log entries yet.</p>
              )}
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{data.total} total events</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary py-1 px-2 text-xs"
                >
                  Previous
                </button>
                <span className="px-2 py-1">
                  {page} / {data.pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                  disabled={page >= data.pages}
                  className="btn-secondary py-1 px-2 text-xs"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

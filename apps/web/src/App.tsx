import { Routes, Route, Navigate } from "react-router-dom";
import { useMe } from "./hooks/useAuth.js";
import Login from "./pages/Login.js";
import Register from "./pages/Register.js";
import Dashboard from "./pages/Dashboard.js";
import Articles from "./pages/Articles.js";
import ArticleView from "./pages/ArticleView.js";
import ArticleEditor from "./pages/ArticleEditor.js";
import Playbooks from "./pages/Playbooks.js";
import PlaybookView from "./pages/PlaybookView.js";
import Members from "./pages/Members.js";
import AuditLog from "./pages/AuditLog.js";
import Billing from "./pages/Billing.js";
import WorkspaceSelect from "./pages/WorkspaceSelect.js";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { data, isLoading, isError } = useMe();
  if (isLoading) return <div className="p-8 text-gray-500">Loading...</div>;
  if (isError || !data) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/"
        element={
          <RequireAuth>
            <WorkspaceSelect />
          </RequireAuth>
        }
      />

      <Route
        path="/:workspaceSlug"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/:workspaceSlug/articles"
        element={
          <RequireAuth>
            <Articles />
          </RequireAuth>
        }
      />
      <Route
        path="/:workspaceSlug/articles/new"
        element={
          <RequireAuth>
            <ArticleEditor />
          </RequireAuth>
        }
      />
      <Route
        path="/:workspaceSlug/articles/:articleSlug/edit"
        element={
          <RequireAuth>
            <ArticleEditor />
          </RequireAuth>
        }
      />
      <Route
        path="/:workspaceSlug/articles/:articleSlug"
        element={
          <RequireAuth>
            <ArticleView />
          </RequireAuth>
        }
      />
      <Route
        path="/:workspaceSlug/playbooks"
        element={
          <RequireAuth>
            <Playbooks />
          </RequireAuth>
        }
      />
      <Route
        path="/:workspaceSlug/playbooks/:playbookId"
        element={
          <RequireAuth>
            <PlaybookView />
          </RequireAuth>
        }
      />
      <Route
        path="/:workspaceSlug/members"
        element={
          <RequireAuth>
            <Members />
          </RequireAuth>
        }
      />
      <Route
        path="/:workspaceSlug/audit"
        element={
          <RequireAuth>
            <AuditLog />
          </RequireAuth>
        }
      />
      <Route
        path="/:workspaceSlug/settings/billing"
        element={
          <RequireAuth>
            <Billing />
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

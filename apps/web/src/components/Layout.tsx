import { Link, useParams, useNavigate } from "react-router-dom";
import { useMe, useLogout } from "../hooks/useAuth.js";
import { useWorkspaces } from "../hooks/useWorkspace.js";

export function Layout({ children }: { children: React.ReactNode }) {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const { data: meData } = useMe();
  const { data: wsData } = useWorkspaces();
  const logout = useLogout();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout.mutateAsync();
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <span className="text-lg font-bold text-brand-600">Loop</span>
        </div>

        {/* Workspace switcher */}
        {wsData?.workspaces && wsData.workspaces.length > 0 && (
          <div className="p-3 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Workspaces</p>
            {wsData.workspaces.map((ws) => (
              <Link
                key={ws.id}
                to={`/${ws.slug}`}
                className={`block px-2 py-1.5 rounded text-sm ${
                  ws.slug === workspaceSlug
                    ? "bg-brand-50 text-brand-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {ws.name}
              </Link>
            ))}
          </div>
        )}

        {/* Nav items */}
        {workspaceSlug && (
          <nav className="flex-1 p-3 space-y-1">
            <NavLink to={`/${workspaceSlug}`} exact>Dashboard</NavLink>
            <NavLink to={`/${workspaceSlug}/articles`}>Articles</NavLink>
            <NavLink to={`/${workspaceSlug}/playbooks`}>Playbooks</NavLink>
            <NavLink to={`/${workspaceSlug}/members`}>Members</NavLink>
            <NavLink to={`/${workspaceSlug}/audit`}>Audit Log</NavLink>
            <NavLink to={`/${workspaceSlug}/settings/billing`}>Billing</NavLink>
          </nav>
        )}

        {/* User section */}
        <div className="p-4 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-900 truncate">
            {meData?.user.displayName}
          </p>
          <p className="text-xs text-gray-500 truncate">{meData?.user.email}</p>
          <button onClick={handleLogout} className="mt-2 text-xs text-gray-500 hover:text-red-600">
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}

function NavLink({
  to,
  children,
  exact,
}: {
  to: string;
  children: React.ReactNode;
  exact?: boolean;
}) {
  const { pathname } = window.location;
  const active = exact ? pathname === to : pathname.startsWith(to);
  return (
    <Link
      to={to}
      className={`block px-3 py-2 rounded-md text-sm ${
        active
          ? "bg-brand-50 text-brand-700 font-medium"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      {children}
    </Link>
  );
}

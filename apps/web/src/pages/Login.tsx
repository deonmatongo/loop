import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLogin } from "../hooks/useAuth.js";
import { LoginSchema } from "@loop/shared";

const DEMO_ACCOUNTS = [
  { label: "Owner", email: "alice@example.com", password: "password123" },
  { label: "Editor", email: "bob@example.com", password: "password123" },
];

export default function Login() {
  const navigate = useNavigate();
  const login = useLogin();
  const [error, setError] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");

  const fillDemo = (email: string, password: string) => {
    setEmailValue(email);
    setPasswordValue(password);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const parsed = LoginSchema.safeParse({
      email: fd.get("email"),
      password: fd.get("password"),
    });
    if (!parsed.success) {
      setError("Please enter a valid email and password.");
      return;
    }
    try {
      await login.mutateAsync(parsed.data);
      navigate("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Sign in to Loop</h1>
        <p className="text-sm text-gray-500 mb-6">
          Don't have an account?{" "}
          <Link to="/register" className="text-brand-600 hover:underline">
            Create one
          </Link>
        </p>

        {/* Demo credentials */}
        <div className="rounded-lg border border-brand-100 bg-brand-50 p-4 mb-6">
          <p className="text-xs font-semibold text-brand-700 uppercase tracking-wider mb-3">
            Demo accounts
          </p>
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((account) => (
              <div key={account.email} className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium text-gray-700">{account.label}</span>
                  <span className="text-gray-400 mx-1.5">·</span>
                  <span className="font-mono text-gray-600 text-xs">{account.email}</span>
                  <span className="text-gray-400 mx-1.5">/</span>
                  <span className="font-mono text-gray-600 text-xs">{account.password}</span>
                </div>
                <button
                  type="button"
                  onClick={() => fillDemo(account.email, account.password)}
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium flex-shrink-0 ml-2"
                >
                  Use
                </button>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              name="email"
              type="email"
              className="input"
              placeholder="you@example.com"
              value={emailValue}
              onChange={(e) => setEmailValue(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              name="password"
              type="password"
              className="input"
              placeholder="••••••••"
              value={passwordValue}
              onChange={(e) => setPasswordValue(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" className="btn-primary w-full" disabled={login.isPending}>
            {login.isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

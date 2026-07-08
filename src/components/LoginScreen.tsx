import React, { useState } from "react";
import { api, debugAuthState } from "../utils/api";
import { User } from "../types";
import { KeyRound, Mail, ShieldAlert, Laptop, Eye, EyeOff, CheckCircle2, UserCheck } from "lucide-react";

interface LoginScreenProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all credentials.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("[Login] Attempting login...");
      const data = await api.login({ email, password });
      console.log("[Login] Login response received, storing token...");
      localStorage.setItem("tgh_token", data.token);
      localStorage.setItem("tgh_user", JSON.stringify(data.user));
      debugAuthState();
      console.log("[Login] Token stored, calling onLoginSuccess...");
      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      console.error("[Login] Login failed:", err.message);
      setError(err.message || "Failed to authenticate. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (autoEmail: string, autoPass: string) => {
    setEmail(autoEmail);
    setPassword(autoPass);
    setError(null);
  };

  return (
    <div id="login-container" className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-4 selection:bg-teal-500 selection:text-white font-sans relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(13,148,136,0.04),transparent_50%)] pointer-events-none" />

      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-8 relative z-10 transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-700">

        {/* Header LOGO / Text */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-450 p-2.5 flex items-center justify-center shadow-lg shadow-teal-500/10 mb-3">
            <Laptop className="h-full w-full text-white stroke-[2.5]" id="login-logo-icon" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 font-sans">
            TGH Asset Hub
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enterprise Asset Management & Lifecycles
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div id="login-error-alert" className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-700 dark:text-rose-400 leading-relaxed font-mono">
              {error}
            </div>
          </div>
        )}

        {/* Login Form */}
        <form id="login-form-element" onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="h-4 w-4" />
              </span>
              <input
                id="login-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@tgh.com"
                className="block w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm font-sans"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Password
              </label>

            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="h-4 w-4" />
              </span>
              <input
                id="login-password-input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm font-mono"
                required
              />
              <button
                id="password-toggle-btn"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold py-3 px-4 rounded-xl hover:opacity-95 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all duration-200 shadow-md shadow-teal-500/15 disabled:opacity-50 text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

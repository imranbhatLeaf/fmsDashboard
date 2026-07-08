import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logomain.avif";
import asssrLogo from "../assets/asssr.avif";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";

const DB = "#1b3358";
const DB_HOVER = "#152849";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed.");

      login({ username: data.username, role: data.role });
      navigate(data.role === "admin" ? "/admin" : "/registrar");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 font-sans" style={{ background: "#f4f2ed" }}>

      {/* Logo / wordmark */}
      <div className="mb-10 text-center flex flex-col items-center">
        <div className="flex gap-4 mb-4">
          <div className="inline-flex items-center justify-center w-24 h-24">
            <img src={logo} alt="AFMS Logo" className="w-full h-full object-contain" />
          </div>
          <div className="inline-flex items-center justify-center w-24 h-24">
            <img src={asssrLogo} alt="ASSSR Logo" className="w-full h-full object-contain" />
          </div>
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight" style={{ color: DB }}>AFMS 2026</h1>
        <p className="text-sm mt-1" style={{ color: "#8899aa", fontFamily: "Tahoma, Geneva, sans-serif" }}>
          Financial Management System
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: "#dde3ec" }}>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-7 space-y-5">
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-5 font-semibold" style={{ color: "#aab", fontFamily: "Tahoma, Geneva, sans-serif" }}>
              Sign in to your account
            </p>

            {/* Username */}
            <div className="flex flex-col gap-1.5 mb-4">
              <label htmlFor="username" className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#7a8baa" }}>
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                required
                className="rounded-lg px-3 py-2.5 text-sm bg-white transition-colors"
                style={{ border: "1px solid #d0d8e8", color: DB, outline: "none" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = DB; e.currentTarget.style.boxShadow = `0 0 0 1px ${DB}`; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#d0d8e8"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#7a8baa" }}>
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  required
                  className="w-full rounded-lg px-3 py-2.5 pr-10 text-sm bg-white transition-colors"
                  style={{ border: "1px solid #d0d8e8", color: DB, outline: "none" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = DB; e.currentTarget.style.boxShadow = `0 0 0 1px ${DB}`; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#d0d8e8"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors focus-visible:outline-none"
                  style={{ color: "#bbc" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = DB)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#bbc")}
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg px-3.5 py-3 border" style={{ background: "#f5f7fb", borderColor: "#dde3ec" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0" style={{ color: DB }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <p className="text-xs leading-relaxed" style={{ color: "#334" }}>{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white text-sm font-bold py-2.5 rounded-lg transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ background: DB }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = DB_HOVER; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = DB; }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Signing in…
              </span>
            ) : (
              `Sign in`
            )}
          </button>
        </form>
      </div>

      <p className="mt-6 text-xs text-center" style={{ color: "#bbc", fontFamily: "Tahoma, Geneva, sans-serif" }}>
        AFMS 2026 · Internal use only
      </p>
    </div>
  );
}

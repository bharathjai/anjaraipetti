import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/runtime";

const ADMIN_TOKEN_KEY = "anj_admin_token";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Recovery States
  const [forgotMode, setForgotMode] = useState("login"); // "login", "forgot", "reset"
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setError(payload.message || "Invalid credentials");
        return;
      }
      localStorage.setItem(ADMIN_TOKEN_KEY, payload.token);
      navigate("/admin/orders");
    } catch (_error) {
      setError("Unable to login right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setError(payload.message || "Failed to send OTP. Check admin email.");
        return;
      }
      setSuccessMessage(payload.message || "OTP has been sent to your email.");
      setForgotMode("reset");
    } catch (_error) {
      setError("Unable to process request right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setError(payload.message || "Invalid OTP or failed to reset password.");
        return;
      }
      setSuccessMessage("Password reset successfully! Please login with your new password.");
      setForgotMode("login");
      setPassword("");
      setOtp("");
      setNewPassword("");
    } catch (_error) {
      setError("Unable to process request right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto flex min-h-[75vh] w-full max-w-4xl items-center justify-center px-6 py-20 md:px-10">
      {forgotMode === "login" && (
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleLogin}
          className="w-full max-w-lg rounded-3xl border border-truffle/10 bg-white/75 p-8 shadow-luxe backdrop-blur-xl"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-cocoa/70">Admin Access</p>
          <h1 className="mt-2 font-display text-5xl text-espresso">Login</h1>

          {successMessage ? (
            <p className="mt-4 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-2xl font-medium">
              {successMessage}
            </p>
          ) : null}
          {error ? (
            <p className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-2.5 rounded-2xl font-medium">
              {error}
            </p>
          ) : null}

          <div className="mt-6">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-cocoa/70">Admin Email</label>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-xl border border-truffle/20 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-cocoa"
              placeholder="admin@anjaraipetti.com"
              type="email"
              required
            />
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-cocoa/70">Password</label>
              <button
                type="button"
                onClick={() => {
                  setForgotMode("forgot");
                  setError("");
                  setSuccessMessage("");
                }}
                className="text-xs font-semibold text-cocoa hover:underline outline-none"
              >
                Forgot Password?
              </button>
            </div>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-xl border border-truffle/20 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-cocoa"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-full bg-truffle px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-porcelain disabled:cursor-not-allowed disabled:opacity-65 transition hover:bg-espresso"
          >
            {loading ? "Logging in..." : "Login as Admin"}
          </button>
        </motion.form>
      )}

      {forgotMode === "forgot" && (
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSendOtp}
          className="w-full max-w-lg rounded-3xl border border-truffle/10 bg-white/75 p-8 shadow-luxe backdrop-blur-xl"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-cocoa/70">Admin Access</p>
          <h1 className="mt-2 font-display text-4xl text-espresso">Forgot Password</h1>
          <p className="mt-2 text-sm text-truffle/70 leading-relaxed">
            Enter your admin email address below. We'll send you an OTP to verify your identity and reset your password.
          </p>

          {error ? (
            <p className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-2.5 rounded-2xl font-medium">
              {error}
            </p>
          ) : null}

          <div className="mt-6">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-cocoa/70">Admin Email</label>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-xl border border-truffle/20 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-cocoa"
              placeholder="admin@anjaraipetti.com"
              type="email"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-full bg-truffle px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-porcelain disabled:cursor-not-allowed disabled:opacity-65 transition hover:bg-espresso"
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setForgotMode("login");
                setError("");
                setSuccessMessage("");
              }}
              className="text-xs font-semibold text-cocoa hover:underline outline-none"
            >
              Back to Login
            </button>
          </div>
        </motion.form>
      )}

      {forgotMode === "reset" && (
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleResetPassword}
          className="w-full max-w-lg rounded-3xl border border-truffle/10 bg-white/75 p-8 shadow-luxe backdrop-blur-xl"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-cocoa/70">Admin Access</p>
          <h1 className="mt-2 font-display text-4xl text-espresso">Reset Password</h1>
          <p className="mt-2 text-sm text-truffle/70 leading-relaxed">
            Enter the 6-digit OTP code sent to your email and choose a new password.
          </p>

          {successMessage ? (
            <p className="mt-4 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-2xl font-medium">
              {successMessage}
            </p>
          ) : null}
          {error ? (
            <p className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-2.5 rounded-2xl font-medium">
              {error}
            </p>
          ) : null}

          <div className="mt-6">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-cocoa/70">Admin Email</label>
            <input
              value={email}
              disabled
              className="mt-1 w-full rounded-xl border border-truffle/20 bg-truffle/5 px-4 py-3 text-sm outline-none cursor-not-allowed text-truffle/50"
            />
          </div>

          <div className="mt-4">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-cocoa/70">OTP Verification Code</label>
            <input
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              className="mt-1 w-full rounded-xl border border-truffle/20 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-cocoa font-mono tracking-widest text-center"
              placeholder="000000"
              maxLength={6}
              required
            />
          </div>

          <div className="mt-4">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-cocoa/70">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="mt-1 w-full rounded-xl border border-truffle/20 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-cocoa"
              placeholder="Min 4 characters"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-full bg-truffle px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-porcelain disabled:cursor-not-allowed disabled:opacity-65 transition hover:bg-espresso"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setForgotMode("login");
                setError("");
                setSuccessMessage("");
              }}
              className="text-xs font-semibold text-cocoa hover:underline outline-none"
            >
              Back to Login
            </button>
          </div>
        </motion.form>
      )}
    </section>
  );
}

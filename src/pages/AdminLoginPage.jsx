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

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
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

  return (
    <section className="mx-auto flex min-h-[75vh] w-full max-w-4xl items-center justify-center px-6 py-20 md:px-10">
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleLogin}
        className="w-full max-w-lg rounded-3xl border border-truffle/10 bg-white/75 p-8 shadow-luxe backdrop-blur-xl"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-cocoa/70">Admin Access</p>
        <h1 className="mt-2 font-display text-5xl text-espresso">Login</h1>

        <div className="mt-6">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-cocoa/70">Admin Email</label>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-xl border border-truffle/20 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-cocoa"
            placeholder="admin@anjaraipetti.com"
          />
        </div>
        <div className="mt-4">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-cocoa/70">Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-xl border border-truffle/20 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-cocoa"
          />
        </div>

        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-full bg-truffle px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-porcelain disabled:cursor-not-allowed disabled:opacity-65"
        >
          {loading ? "Logging in..." : "Login as Admin"}
        </button>
      </motion.form>
    </section>
  );
}

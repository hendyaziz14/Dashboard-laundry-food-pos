import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TbWashMachine, TbToolsKitchen2 } from "react-icons/tb";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Gagal masuk. Periksa kembali username dan password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 font-body">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-laundry-light text-laundry">
            <TbWashMachine size={22} />
          </span>
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-food-light text-food">
            <TbToolsKitchen2 size={22} />
          </span>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <h1 className="font-display text-xl font-bold text-ink text-center">Masuk ke Dashboard</h1>
          <p className="mt-1 text-center text-sm text-slate-500">Laundry &amp; Food POS</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-laundry focus:outline-none"
                placeholder="admin"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-laundry focus:outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            {error && <p className="text-sm text-rose-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-ink py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-400">
            Default: admin / admin123 (ubah di file .env backend)
          </p>
        </div>
      </div>
    </div>
  );
}

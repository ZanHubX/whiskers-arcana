
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminLogin } from "../../services/adminApi";
import "./admin.css";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await adminLogin(email.trim(), password);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to log in."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login-page">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <div className="admin-login-symbol">✦</div>

        <p className="admin-eyebrow">WHISKERS & WHISPERS ARCANA</p>
        <h1>Admin Portal</h1>
        <p className="admin-login-description">
          Sign in to manage bookings and payments.
        </p>

        {error && (
          <div className="admin-login-error" role="alert">
            {error}
          </div>
        )}

        <label className="admin-login-label" htmlFor="admin-email">
          Email address
        </label>
        <input
          id="admin-email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@example.com"
          required
        />

        <label className="admin-login-label" htmlFor="admin-password">
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
          required
        />

        <button
          className="admin-login-submit"
          type="submit"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign In →"}
        </button>

        <Link className="admin-login-back" to="/">
          ← Back to customer website
        </Link>
      </form>
    </main>
  );
}

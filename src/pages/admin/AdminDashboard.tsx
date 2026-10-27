
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminRequest } from "../../services/adminApi";
import "./admin.css";

type DashboardStats = {
  total_bookings: number;
  pending_bookings: number;
  confirmed_bookings: number;
  total_revenue: number;
  currency: string;
};

type RecentBooking = {
  id: number;
  booking_reference: string;
  customer_name: string;
  email: string | null;
  telegram_username: string | null;
  reading_type: string;
  amount: number | string;
  currency: string;
  status: string;
  scheduled_at: string;
  created_at: string;
};

type DashboardResponse = {
  stats: DashboardStats;
  recent_bookings: RecentBooking[];
};

const initialStats: DashboardStats = {
  total_bookings: 0,
  pending_bookings: 0,
  confirmed_bookings: 0,
  total_revenue: 0,
  currency: "MMK",
};

const statDefinitions = [
  {
    key: "total_bookings",
    label: "Total Bookings",
    icon: "▤",
  },
  {
    key: "pending_bookings",
    label: "Pending Bookings",
    icon: "◷",
  },
  {
    key: "confirmed_bookings",
    label: "Confirmed Bookings",
    icon: "✓",
  },
  {
    key: "total_revenue",
    label: "Total Revenue",
    icon: "$",
  },
] as const;

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value || "—";
  }

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStatus(status: string) {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function statusClass(status: string) {
  return status.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const result = await adminRequest<DashboardResponse>(
          "/admin/dashboard"
        );

        if (
          !result ||
          !result.stats ||
          !Array.isArray(result.recent_bookings)
        ) {
          throw new Error("The dashboard API returned an unexpected response.");
        }

        if (cancelled) return;

        setStats(result.stats);
        setRecentBookings(result.recent_bookings);
      } catch (err) {
        if (cancelled) return;

        setError(
          err instanceof Error
            ? err.message
            : "Could not load dashboard data."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  function getStatValue(key: (typeof statDefinitions)[number]["key"]) {
    if (loading && !error) return "—";

    if (key === "total_revenue") {
      return `${Number(stats.total_revenue).toLocaleString()} ${stats.currency}`;
    }

    return stats[key].toLocaleString();
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-icon">✦</span>
          <div>
            <strong>WHISKERS</strong>
            <small>ADMIN PORTAL</small>
          </div>
        </div>

        <p className="admin-nav-label">WORKSPACE</p>

        <nav className="admin-nav">
          <Link className="admin-nav-item active" to="/admin">
            <span>▦</span> Overview
          </Link>

          <Link className="admin-nav-item" to="/admin/bookings">
            <span>▤</span> Bookings
          </Link>

          <Link className="admin-nav-item" to="/admin/payments">
            <span>◇</span> Payments
          </Link>

          <Link
            className="admin-nav-item"
            to="/admin/reading-packages"
          >
            <span>✧</span> Reading Packages
          </Link>

          <Link
            className="admin-nav-item"
            to="/admin/payment-methods"
          >
            <span>＄</span> Payment Methods
          </Link>
        </nav>

        <div className="admin-sidebar-footer">
          <span className="admin-avatar">A</span>
          <div>
            <strong>Administrator</strong>
            <small>Admin workspace</small>
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-eyebrow">
              WHISKERS &amp; WHISPERS ARCANA
            </p>
            <h1>Dashboard Overview</h1>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              className="admin-view-site"
              onClick={() => setRefreshKey((value) => value + 1)}
              disabled={loading}
            >
              {loading ? "Loading..." : "↻ Refresh"}
            </button>

            <Link className="admin-view-site" to="/">
              View Customer Site ↗
            </Link>
          </div>
        </header>

        <section className="admin-welcome">
          <div>
            <p className="admin-eyebrow">YOUR WORKSPACE</p>
            <h2>Welcome back, Admin ✦</h2>
            <p>
              Manage customer bookings and payment verification from one place.
            </p>
          </div>

          <span className="admin-welcome-symbol">☾</span>
        </section>

        {error && (
          <section
            role="alert"
            style={{
              marginBottom: 20,
              padding: 18,
              border: "1px solid #fecaca",
              borderRadius: 12,
              background: "#fff1f2",
              color: "#991b1b",
            }}
          >
            <strong>Could not load dashboard</strong>
            <p style={{ margin: "8px 0" }}>{error}</p>
            <p style={{ margin: "8px 0" }}>
              Check that Laravel is running, the admin session is valid, and
              the dashboard route exists.
            </p>
            <button
              type="button"
              onClick={() => setRefreshKey((value) => value + 1)}
            >
              Try again
            </button>
          </section>
        )}

        <section className="admin-stats">
          {statDefinitions.map((stat) => (
            <article className="admin-stat-card" key={stat.key}>
              <div className="admin-stat-top">
                <span>{stat.label}</span>
                <span className="admin-stat-icon">{stat.icon}</span>
              </div>

              <strong className="admin-stat-value">
                {error ? "—" : getStatValue(stat.key)}
              </strong>

              <small>
                {error
                  ? "API connection failed"
                  : loading
                    ? "Loading from Laravel..."
                    : "Live database data"}
              </small>
            </article>
          ))}
        </section>

        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>Recent Bookings</h2>
              <p>Latest customer booking activity.</p>
            </div>

            <Link to="/admin/bookings">View all →</Link>
          </div>

          {loading && !error && (
            <div className="admin-empty">
              <p>Loading recent bookings...</p>
            </div>
          )}

          {!loading && !error && recentBookings.length === 0 && (
            <div className="admin-empty">
              <span className="admin-empty-icon">✧</span>
              <h3>No bookings found</h3>
              <p>New customer bookings will appear here.</p>
            </div>
          )}

          {!error && recentBookings.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left",
                }}
              >
                <thead>
                  <tr>
                    <th style={{ padding: 12 }}>Customer</th>
                    <th style={{ padding: 12 }}>Reading</th>
                    <th style={{ padding: 12 }}>Amount</th>
                    <th style={{ padding: 12 }}>Status</th>
                    <th style={{ padding: 12 }}>Created</th>
                  </tr>
                </thead>

                <tbody>
                  {recentBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td style={{ padding: 12 }}>
                        <strong>{booking.customer_name}</strong>
                        <small
                          style={{
                            display: "block",
                            marginTop: 5,
                            overflowWrap: "anywhere",
                          }}
                        >
                          {booking.booking_reference}
                        </small>
                      </td>

                      <td style={{ padding: 12 }}>
                        {booking.reading_type}
                      </td>

                      <td style={{ padding: 12, whiteSpace: "nowrap" }}>
                        {Number(booking.amount).toLocaleString()}{" "}
                        {booking.currency}
                      </td>

                      <td style={{ padding: 12 }}>
                        <span
                          className={`admin-status-badge admin-status-${statusClass(
                            booking.status
                          )}`}
                        >
                          {formatStatus(booking.status)}
                        </span>
                      </td>

                      <td style={{ padding: 12, whiteSpace: "nowrap" }}>
                        {formatDate(booking.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

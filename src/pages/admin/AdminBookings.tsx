
import { useCallback, useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { adminRequest } from "../../services/adminApi";
import "./admin.css";

type Booking = {
  id: number;
  booking_reference: string;
  customer_name: string;
  telegram_username: string | null;
  email: string | null;
  customer_type: string;
  reading_type: string;
  amount: number | string;
  currency: string;
  status: string;
  scheduled_at: string;
  created_at: string;
};

type PaginatedBookings = {
  data: Booking[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
};

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending_payment", label: "Pending payment" },
  { value: "pending_review", label: "Pending review" },
  { value: "confirmed", label: "Confirmed" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAmount(amount: number | string, currency: string) {
  const value = Number(amount);

  if (!Number.isFinite(value)) return `${amount} ${currency}`;

  return `${value.toLocaleString()} ${currency}`;
}

function statusClass(status: string) {
  return status.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function humanizeStatus(status: string) {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <Link to="/admin" className="admin-brand admin-brand-link">
        <span className="admin-brand-icon">✦</span>
        <span className="admin-brand-copy">
          <strong>WHISKERS</strong>
          <small>ADMIN PORTAL</small>
        </span>
      </Link>

      <p className="admin-nav-label">WORKSPACE</p>

      <nav className="admin-nav" aria-label="Admin navigation">
        <NavLink
          to="/admin"
          end
          className={({ isActive }) =>
            `admin-nav-item${isActive ? " active" : ""}`
          }
        >
          <span aria-hidden="true">▦</span>
          Overview
        </NavLink>

        <NavLink
          to="/admin/bookings"
          className={({ isActive }) =>
            `admin-nav-item${isActive ? " active" : ""}`
          }
        >
          <span aria-hidden="true">▤</span>
          Bookings
        </NavLink>

        <NavLink
          to="/admin/payments"
          className={({ isActive }) =>
            `admin-nav-item${isActive ? " active" : ""}`
          }
        >
          <span aria-hidden="true">◇</span>
          Payments
        </NavLink>

        <NavLink
          to="/admin/packages"
          className={({ isActive }) =>
            `admin-nav-item${isActive ? " active" : ""}`
          }
        >
          <span aria-hidden="true">✧</span>
          Reading Packages
        </NavLink>
        <Link
  className="admin-nav-item"
  to="/admin/payment-methods"
>
  <span>＄</span> Payment Methods
</Link>
      </nav>

      <div className="admin-sidebar-footer">
        <span className="admin-avatar">A</span>
        <span>
          <strong>Administrator</strong>
          <small>Admin workspace</small>
        </span>
      </div>
    </aside>
  );
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    from: null as number | null,
    to: null as number | null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (status) {
        params.set("status", status);
      }

      const result = await adminRequest<PaginatedBookings>(
        `/admin/bookings?${params.toString()}`
      );

      if (!result || !Array.isArray(result.data)) {
        throw new Error(
          "The API response format is unexpected. Expected a paginated bookings response."
        );
      }

      setBookings(result.data);

      setPagination({
        currentPage: result.current_page ?? page,
        lastPage: Math.max(1, result.last_page ?? 1),
        total: result.total ?? result.data.length,
        from: result.from ?? null,
        to: result.to ?? null,
      });
    } catch (err) {
      setBookings([]);

      setPagination({
        currentPage: 1,
        lastPage: 1,
        total: 0,
        from: null,
        to: null,
      });

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load bookings. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, status, refreshKey]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function handleStatusChange(value: string) {
    setPage(1);
    setStatus(value);
  }

  function handlePerPageChange(value: string) {
    setPage(1);
    setPerPage(Number(value));
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setStatus("");
    setPage(1);
  }

  async function handleDelete(booking: Booking) {
    const confirmed = window.confirm(
      `Delete booking ${booking.booking_reference || `#${booking.id}`}?\n\n` +
        `Customer: ${booking.customer_name}\n\n` +
        "This action cannot be undone. Bookings with payment history " +
        "or protected statuses will not be deleted."
    );

    if (!confirmed) return;

    setDeletingId(booking.id);
    setActionError("");
    setActionMessage("");

    try {
      const result = await adminRequest<{ message: string }>(
        `/admin/bookings/${booking.id}`,
        { method: "DELETE" }
      );

      setActionMessage(result.message || "Booking deleted successfully.");

      // Reload the current page; if its only row was deleted, move back a page.
      if (bookings.length === 1 && page > 1) {
        setPage((current) => Math.max(1, current - 1));
      } else {
        setRefreshKey((current) => current + 1);
      }
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Unable to delete this booking. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="admin-shell admin-bookings-shell">
      <AdminSidebar />

      <div className="admin-main admin-bookings-main">
        <header className="admin-page-header admin-bookings-header">
          <div>
            <p className="admin-eyebrow">WHISKERS &amp; WHISPERS ARCANA</p>
            <h1>Bookings</h1>
            <p className="admin-page-description">
              View and search customer reading bookings.
            </p>
          </div>

          <div className="admin-bookings-header-actions">
            <Link to="/" className="admin-button admin-button-secondary">
              View site ↗
            </Link>

            <button
              type="button"
              className="admin-button admin-button-primary"
              onClick={() => setRefreshKey((value) => value + 1)}
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </header>

        <section className="admin-bookings-summary">
          <div className="admin-summary-card">
            <span>Total matching bookings</span>
            <strong>
              {loading ? "—" : pagination.total.toLocaleString()}
            </strong>
          </div>

          <div className="admin-summary-card">
            <span>Current page</span>
            <strong>
              {loading
                ? "—"
                : `${pagination.currentPage} / ${pagination.lastPage}`}
            </strong>
          </div>
        </section>

        <section className="admin-panel admin-bookings-panel">
          <form className="admin-bookings-filters" onSubmit={handleSearch}>
            <div className="admin-filter-search">
              <label htmlFor="booking-search">Search bookings</label>
              <input
                id="booking-search"
                type="search"
                placeholder="Name, reference, email or Telegram"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </div>

            <div className="admin-filter-status">
              <label htmlFor="booking-status">
                Payment / booking status
              </label>
              <select
                id="booking-status"
                value={status}
                onChange={(event) => handleStatusChange(event.target.value)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-filter-actions">
              <button
                type="submit"
                className="admin-button admin-button-primary"
              >
                Search
              </button>

              <button
                type="button"
                className="admin-button admin-button-secondary"
                onClick={clearFilters}
              >
                Clear
              </button>
            </div>
          </form>

          {actionError && (
            <div className="admin-error" role="alert">
              <strong>Could not delete booking</strong>
              <p>{actionError}</p>
            </div>
          )}

          {actionMessage && (
            <div className="admin-success" role="status">
              {actionMessage}
            </div>
          )}

          {error && (
            <div className="admin-error" role="alert">
              <strong>Could not load bookings</strong>
              <p>{error}</p>
              <p>
                Check that you are logged in as an admin and that the Laravel
                API is running.
              </p>
              <button
                type="button"
                className="admin-button admin-button-secondary"
                onClick={() => setRefreshKey((value) => value + 1)}
              >
                Try again
              </button>
            </div>
          )}

          {loading && (
            <div className="admin-loading" role="status">
              Loading bookings from the API...
            </div>
          )}

          {!loading && !error && bookings.length === 0 && (
            <div className="admin-empty-state">
              <h2>No bookings found</h2>
              <p>
                There are no bookings matching these filters. New customer
                bookings will appear here when they are saved by the backend.
              </p>
            </div>
          )}

          {!error && bookings.length > 0 && (
            <>
              <div className="admin-table-meta">
                Showing{" "}
                <strong>
                  {pagination.from ?? 0}–{pagination.to ?? bookings.length}
                </strong>{" "}
                of <strong>{pagination.total}</strong> bookings
              </div>

              <div className="admin-table-wrapper">
                <table className="admin-table admin-bookings-table">
                  <thead>
                    <tr>
                      <th>Booking</th>
                      <th>Customer</th>
                      <th>Reading</th>
                      <th>Scheduled date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking.id}>
                        <td>
                          <strong>
                            {booking.booking_reference || `#${booking.id}`}
                          </strong>
                          <span className="admin-table-subtext">
                            Created {formatDate(booking.created_at)}
                          </span>
                        </td>

                        <td>
                          <strong>{booking.customer_name}</strong>

                          {booking.email && (
                            <span className="admin-table-subtext">
                              {booking.email}
                            </span>
                          )}

                          {booking.telegram_username && (
                            <span className="admin-table-subtext">
                              Telegram: {booking.telegram_username}
                            </span>
                          )}

                          <span className="admin-table-subtext">
                            {booking.customer_type === "overseas"
                              ? "Overseas"
                              : "Local"}
                          </span>
                        </td>

                        <td>{booking.reading_type}</td>

                        <td>{formatDate(booking.scheduled_at)}</td>

                        <td>
                          <strong>
                            {formatAmount(booking.amount, booking.currency)}
                          </strong>
                        </td>

                        <td>
                          <span
                            className={`admin-status-badge admin-status-${statusClass(
                              booking.status
                            )}`}
                          >
                            {humanizeStatus(booking.status)}
                          </span>
                        </td>

                        
<td>
  <button
    type="button"
    className="admin-button admin-button-secondary admin-booking-delete-button"
    disabled={loading || deletingId !== null}
    onClick={() => void handleDelete(booking)}
  >
    {deletingId === booking.id ? "Deleting..." : "Delete"}
  </button>
</td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="admin-pagination">
                <label className="admin-per-page">
                  Rows per page
                  <select
                    value={perPage}
                    onChange={(event) =>
                      handlePerPageChange(event.target.value)
                    }
                  >
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </label>

                <div className="admin-pagination-controls">
                  <button
                    type="button"
                    className="admin-button admin-button-secondary"
                    disabled={loading || page <= 1}
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                  >
                    Previous
                  </button>

                  <span>
                    Page {pagination.currentPage} of {pagination.lastPage}
                  </span>

                  <button
                    type="button"
                    className="admin-button admin-button-secondary"
                    disabled={loading || page >= pagination.lastPage}
                    onClick={() =>
                      setPage((current) =>
                        Math.min(pagination.lastPage, current + 1)
                      )
                    }
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

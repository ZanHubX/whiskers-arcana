import { useCallback, useEffect, useMemo, useState } from "react";
import {
  adminRequest,
  adminRequestBlob,
} from "../../services/adminApi";
import "./admin-payments.css";

type PaymentBooking = {
  id?: number;
  booking_reference: string;
  customer_name: string;
  email: string | null;
  reading_type: string;
  status: string;
};

type PaymentMethodInfo = {
  id: number;
  name: string;
};

type Payment = {
  id: number;
  booking_id: number;
  amount: number | string;
  currency: string;
  transaction_reference: string | null;
  status: "pending" | "approved" | "rejected" | string;
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
  booking: PaymentBooking | null;
  payment_method: PaymentMethodInfo | null;
};

type PaginatedPayments = {
  data: Payment[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
};

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
  const number = Number(amount);

  return Number.isFinite(number)
    ? `${number.toLocaleString()} ${currency}`
    : `${amount} ${currency}`;
}

function statusClass(status: string) {
  return status.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function humanizeStatus(status: string) {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const navItems = [
  { label: "Overview", href: "/admin", icon: "▦" },
  { label: "Bookings", href: "/admin/bookings", icon: "▤" },
  { label: "Payments", href: "/admin/payments", icon: "◇" },
  {
    label: "Reading Packages",
    href: "/admin/packages",
    icon: "✧",
  },
  {
    label: "Payment Methods",
    href: "/admin/payment-methods",
    icon: "$",
  },
];

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    from: null as number | null,
    to: null as number | null,
  });

  const [selectedPayment, setSelectedPayment] =
    useState<Payment | null>(null);
  const [proofUrl, setProofUrl] = useState("");
  const [proofLoading, setProofLoading] = useState(false);
  const [proofError, setProofError] = useState("");

  const [rejectingPayment, setRejectingPayment] =
    useState<Payment | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  const currentPath = window.location.pathname;

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError("");
    setActionError("");

    try {
      const result = await adminRequest<PaginatedPayments>(
        `/admin/payments?page=${page}`
      );

      if (!result || !Array.isArray(result.data)) {
        throw new Error("Unexpected payment API response.");
      }

      setPayments(result.data);

      setPagination({
        currentPage: result.current_page ?? page,
        lastPage: Math.max(1, result.last_page ?? 1),
        total: result.total ?? result.data.length,
        from: result.from ?? null,
        to: result.to ?? null,
      });
    } catch (err) {
      setPayments([]);
      setError(
        err instanceof Error ? err.message : "Unable to load payments."
      );
    } finally {
      setLoading(false);
    }
  }, [page, refreshKey]);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";

    async function loadProof() {
      if (!selectedPayment) {
        setProofUrl("");
        setProofError("");
        setProofLoading(false);
        return;
      }

      setProofUrl("");
      setProofError("");
      setProofLoading(true);

      
      try {
        const blob = await adminRequestBlob(
          `/admin/payments/${selectedPayment.id}/proof`
        );

        if (cancelled) return;

        if (blob.size === 0) {
          throw new Error("The receipt image response is empty.");
        }

        // The diagnostic showed a leading 0x0A before the JPEG signature.
        // Find the actual JPEG start marker and remove any leading bytes.
        const bytes = new Uint8Array(await blob.arrayBuffer());
        let start = -1;

        for (let i = 0; i < bytes.length - 2; i++) {
          if (
            bytes[i] === 0xff &&
            bytes[i + 1] === 0xd8 &&
            bytes[i + 2] === 0xff
          ) {
            start = i;
            break;
          }
        }

        if (start === -1) {
          throw new Error(
            `A valid JPEG signature was not found. Response type: ${
              blob.type || "unknown"
            }, size: ${blob.size} bytes.`
          );
        }

        const cleanBlob = new Blob(
          [bytes.slice(start)],
          { type: "image/jpeg" }
        );

        objectUrl = URL.createObjectURL(cleanBlob);
        setProofUrl(objectUrl);
            } catch (err) {
        if (!cancelled) {
          setProofError(
            err instanceof Error
              ? err.message
              : "Unable to load the payment receipt."
          );
        }
      } finally {
        if (!cancelled) {
          setProofLoading(false);
        }
      }
    }


    void loadProof();

    return () => {
      cancelled = true;

      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [selectedPayment]);

  const visiblePayments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const matchesStatus =
        statusFilter === "all" || payment.status === statusFilter;

      const booking = payment.booking;

      const searchableText = [
        payment.id,
        payment.transaction_reference,
        payment.payment_method?.name,
        booking?.booking_reference,
        booking?.customer_name,
        booking?.email,
        booking?.reading_type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!query || searchableText.includes(query));
    });
  }, [payments, search, statusFilter]);

  const pendingCount = payments.filter(
    (payment) => payment.status === "pending"
  ).length;

  const approvedCount = payments.filter(
    (payment) => payment.status === "approved"
  ).length;

  const rejectedCount = payments.filter(
    (payment) => payment.status === "rejected"
  ).length;

  async function handleApprove(payment: Payment) {
    const confirmed = window.confirm(
      `Approve payment #${payment.id} for ${
        payment.booking?.customer_name || "this customer"
      }?\n\nThe related booking will be marked as confirmed.`
    );

    if (!confirmed) return;

    setSubmittingAction(true);
    setActionError("");
    setSuccessMessage("");

    try {
      const result = await adminRequest<{ message: string }>(
        `/admin/payments/${payment.id}/approve`,
        { method: "PATCH" }
      );

      setSuccessMessage(result.message || "Payment approved successfully.");
      setSelectedPayment(null);
      setRejectingPayment(null);
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to approve payment."
      );
    } finally {
      setSubmittingAction(false);
    }
  }

  function openRejectDialog(payment: Payment) {
    setSelectedPayment(null);
    setRejectingPayment(payment);
    setRejectionReason("");
    setActionError("");
    setSuccessMessage("");
  }

  async function handleReject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!rejectingPayment) return;

    const reason = rejectionReason.trim();

    if (!reason) {
      setActionError("Please enter a reason for rejecting this payment.");
      return;
    }

    setSubmittingAction(true);
    setActionError("");
    setSuccessMessage("");

    try {
      const result = await adminRequest<{ message: string }>(
        `/admin/payments/${rejectingPayment.id}/reject`,
        {
          method: "PATCH",
          body: JSON.stringify({ rejection_reason: reason }),
        }
      );

      setSuccessMessage(result.message || "Payment rejected.");
      setRejectingPayment(null);
      setRejectionReason("");
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to reject payment."
      );
    } finally {
      setSubmittingAction(false);
    }
  }

  async function handleDeletePayment(payment: Payment) {
    const confirmed = window.confirm(
      `PERMANENTLY DELETE payment #${payment.id}?\n\n` +
        `Customer: ${payment.booking?.customer_name || "Unknown customer"}\n` +
        `Booking: ${payment.booking?.booking_reference || "Unknown"}\n` +
        `Amount: ${formatAmount(payment.amount, payment.currency)}\n` +
        `Status: ${payment.status}\n\n` +
        "This deletes the payment database record only. " +
        "The booking and receipt file will be kept. " +
        "This action cannot be undone. Continue only for dummy/test data."
    );

    if (!confirmed) return;

    setSubmittingAction(true);
    setActionError("");
    setSuccessMessage("");

    try {
      const result = await adminRequest<{ message: string }>(
        `/admin/payments/${payment.id}`,
        { method: "DELETE" }
      );

      setSuccessMessage(result.message || `Payment #${payment.id} deleted.`);

      setSelectedPayment((current) =>
        current?.id === payment.id ? null : current
      );

      setRejectingPayment((current) =>
        current?.id === payment.id ? null : current
      );

      if (payments.length === 1 && page > 1) {
        setPage((current) => Math.max(1, current - 1));
      } else {
        setRefreshKey((value) => value + 1);
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to delete payment."
      );
    } finally {
      setSubmittingAction(false);
    }
  }

  return (
    <div className="wwa-admin-layout">
      <aside className="wwa-admin-sidebar">
        <a href="/admin" className="wwa-admin-brand">
          <span className="wwa-admin-brand-icon">✦</span>
          <span>
            <strong>WHISKERS</strong>
            <small>ADMIN PORTAL</small>
          </span>
        </a>

        <p className="wwa-admin-nav-heading">WORKSPACE</p>

        <nav className="wwa-admin-nav">
          {navItems.map((item) => {
            const active = currentPath === item.href;

            return (
              <a
                key={item.href}
                href={item.href}
                className={`wwa-admin-nav-link ${
                  active ? "active" : ""
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="wwa-admin-profile">
          <span className="wwa-admin-avatar">A</span>
          <span>
            <strong>Administrator</strong>
            <small>Admin workspace</small>
          </span>
        </div>
      </aside>

      <main className="admin-payments-page">
        <header className="payments-page-header">
          <div>
            <p className="payments-eyebrow">
              WHISKERS &amp; WHISPERS ARCANA
            </p>
            <h1>Payment Review</h1>
            <p className="payments-description">
              Review customer receipts and approve or reject submitted payments.
            </p>
          </div>

          <button
            type="button"
            className="payments-button payments-button-primary"
            disabled={loading}
            onClick={() => setRefreshKey((value) => value + 1)}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        {successMessage && (
          <div className="payments-alert payments-alert-success" role="status">
            {successMessage}
            <button
              type="button"
              onClick={() => setSuccessMessage("")}
              aria-label="Dismiss success message"
            >
              ×
            </button>
          </div>
        )}

        {actionError && !rejectingPayment && (
          <div className="payments-alert payments-alert-error" role="alert">
            {actionError}
            <button
              type="button"
              onClick={() => setActionError("")}
              aria-label="Dismiss error message"
            >
              ×
            </button>
          </div>
        )}

        <section className="payments-stats">
          <div className="payments-stat-card">
            <span>Pending on this page</span>
            <strong>{loading ? "—" : pendingCount}</strong>
          </div>
          <div className="payments-stat-card">
            <span>Approved on this page</span>
            <strong>{loading ? "—" : approvedCount}</strong>
          </div>
          <div className="payments-stat-card">
            <span>Rejected on this page</span>
            <strong>{loading ? "—" : rejectedCount}</strong>
          </div>
          <div className="payments-stat-card">
            <span>Total payments</span>
            <strong>
              {loading ? "—" : pagination.total.toLocaleString()}
            </strong>
          </div>
        </section>

        <section className="payments-panel">
          <div className="payments-panel-header">
            <div>
              <h2>Submitted Payments</h2>
              <p>Open a receipt to review the payment details.</p>
            </div>
          </div>

          <div className="payments-filters">
            <div className="payments-search-field">
              <label htmlFor="payment-search">Search this page</label>
              <input
                id="payment-search"
                type="search"
                placeholder="Customer, booking reference, transaction..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="payments-status-field">
              <label htmlFor="payment-status">Status</label>
              <select
                id="payment-status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="payments-alert payments-alert-error" role="alert">
              <strong>Could not load payments.</strong>
              <p>{error}</p>
              <button
                type="button"
                className="payments-button payments-button-secondary"
                onClick={() => setRefreshKey((value) => value + 1)}
              >
                Try again
              </button>
            </div>
          )}

          {loading && (
            <div className="payments-empty-state" role="status">
              Loading payments...
            </div>
          )}

          {!loading && !error && visiblePayments.length === 0 && (
            <div className="payments-empty-state">
              <h3>No payments found</h3>
              <p>There are no payments matching your filters on this page.</p>
            </div>
          )}

          {!loading && !error && visiblePayments.length > 0 && (
            <>
              <div className="payments-table-wrap">
                <table className="payments-table">
                  <thead>
                    <tr>
                      <th>Payment</th>
                      <th>Customer / Booking</th>
                      <th>Payment method</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {visiblePayments.map((payment) => (
                      <tr key={payment.id}>
                        <td>
                          <strong>#{payment.id}</strong>
                          <span className="payments-subtext">
                            {payment.transaction_reference ||
                              "No transaction ref"}
                          </span>
                        </td>

                        <td>
                          <strong>
                            {payment.booking?.customer_name ||
                              "Unknown customer"}
                          </strong>
                          <span className="payments-subtext">
                            {payment.booking?.booking_reference ||
                              "No booking reference"}
                          </span>
                          <span className="payments-subtext">
                            {payment.booking?.reading_type ||
                              "Reading not available"}
                          </span>
                          {payment.booking?.email && (
                            <span className="payments-subtext">
                              {payment.booking.email}
                            </span>
                          )}
                        </td>

                        <td>{payment.payment_method?.name || "—"}</td>

                        <td>
                          <strong>
                            {formatAmount(payment.amount, payment.currency)}
                          </strong>
                        </td>

                        <td>
                          <span
                            className={`payments-status payments-status-${statusClass(
                              payment.status
                            )}`}
                          >
                            {humanizeStatus(payment.status)}
                          </span>
                          {payment.rejection_reason && (
                            <span className="payments-subtext">
                              Reason: {payment.rejection_reason}
                            </span>
                          )}
                        </td>

                        <td>{formatDate(payment.created_at)}</td>

                        <td>
                          <div className="payments-row-actions">
                            <button
                              type="button"
                              className="payments-button payments-button-secondary"
                              onClick={() => setSelectedPayment(payment)}
                            >
                              View receipt
                            </button>

                            {payment.status === "pending" && (
                              <>
                                <button
                                  type="button"
                                  className="payments-button payments-button-approve"
                                  disabled={submittingAction}
                                  onClick={() => void handleApprove(payment)}
                                >
                                  Approve
                                </button>

                                <button
                                  type="button"
                                  className="payments-button payments-button-reject"
                                  disabled={submittingAction}
                                  onClick={() => openRejectDialog(payment)}
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              className="payments-button payments-button-reject"
                              disabled={submittingAction}
                              onClick={() => void handleDeletePayment(payment)}
                            >
                              {submittingAction ? "Working..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="payments-pagination">
                <span>
                  Showing {pagination.from ?? 0}–
                  {pagination.to ?? payments.length} of {pagination.total}{" "}
                  payments
                </span>

                <div className="payments-pagination-actions">
                  <button
                    type="button"
                    className="payments-button payments-button-secondary"
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
                    className="payments-button payments-button-secondary"
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

        {selectedPayment && (
          <div
            className="payments-modal-backdrop"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setSelectedPayment(null);
              }
            }}
          >
            <section
              className="payments-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="payment-detail-title"
            >
              <header className="payments-modal-header">
                <div>
                  <p className="payments-eyebrow">
                    PAYMENT #{selectedPayment.id}
                  </p>
                  <h2 id="payment-detail-title">Payment details</h2>
                </div>

                <button
                  type="button"
                  className="payments-close-button"
                  onClick={() => setSelectedPayment(null)}
                  aria-label="Close payment details"
                >
                  ×
                </button>
              </header>

              <div className="payments-detail-grid">
                <div>
                  <span>Customer</span>
                  <strong>
                    {selectedPayment.booking?.customer_name || "Unknown"}
                  </strong>
                </div>
                <div>
                  <span>Booking reference</span>
                  <strong>
                    {selectedPayment.booking?.booking_reference || "—"}
                  </strong>
                </div>
                <div>
                  <span>Reading type</span>
                  <strong>
                    {selectedPayment.booking?.reading_type || "—"}
                  </strong>
                </div>
                <div>
                  <span>Payment method</span>
                  <strong>
                    {selectedPayment.payment_method?.name || "—"}
                  </strong>
                </div>
                <div>
                  <span>Transaction reference</span>
                  <strong>
                    {selectedPayment.transaction_reference || "—"}
                  </strong>
                </div>
                <div>
                  <span>Amount</span>
                  <strong>
                    {formatAmount(
                      selectedPayment.amount,
                      selectedPayment.currency
                    )}
                  </strong>
                </div>
                <div>
                  <span>Submitted</span>
                  <strong>{formatDate(selectedPayment.created_at)}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>{humanizeStatus(selectedPayment.status)}</strong>
                </div>
              </div>

              <div className="payments-proof-section">
                <h3>Payment receipt</h3>

                {proofLoading && (
                  <div className="payments-proof-placeholder">
                    Loading secure receipt...
                  </div>
                )}

                {proofError && (
                  <div className="payments-alert payments-alert-error">
                    {proofError}
                  </div>
                )}

                {proofUrl && (
                  <a
                    className="payments-proof-link"
                    href={proofUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open full-size receipt
                  </a>
                )}

                {proofUrl && (
                  <img
                    className="payments-proof-image"
                    src={proofUrl}
                    alt={`Payment receipt for payment ${selectedPayment.id}`}
                    onLoad={(event) => {
                      const image = event.currentTarget;
                      console.info("Receipt image loaded successfully:", {
                        paymentId: selectedPayment.id,
                        naturalWidth: image.naturalWidth,
                        naturalHeight: image.naturalHeight,
                        src: image.src,
                      });
                    }}
                    onError={(event) => {
                      const image = event.currentTarget;
                      console.error("Receipt image failed to render:", {
                        paymentId: selectedPayment.id,
                        naturalWidth: image.naturalWidth,
                        naturalHeight: image.naturalHeight,
                        src: image.src,
                      });
                      setProofError(
                        "The receipt data was downloaded, but the browser could not display it. Check the Console for 'Receipt image failed to render'."
                      );
                    }}
                  />
                )}
              </div>

              {selectedPayment.status === "pending" && (
                <footer className="payments-modal-actions">
                  <button
                    type="button"
                    className="payments-button payments-button-reject"
                    disabled={submittingAction}
                    onClick={() => openRejectDialog(selectedPayment)}
                  >
                    Reject payment
                  </button>

                  <button
                    type="button"
                    className="payments-button payments-button-approve"
                    disabled={submittingAction}
                    onClick={() => void handleApprove(selectedPayment)}
                  >
                    {submittingAction
                      ? "Processing..."
                      : "Approve payment"}
                  </button>
                </footer>
              )}
            </section>
          </div>
        )}

        {rejectingPayment && (
          <div className="payments-modal-backdrop">
            <section
              className="payments-modal payments-reject-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="reject-payment-title"
            >
              <header className="payments-modal-header">
                <div>
                  <p className="payments-eyebrow">
                    PAYMENT #{rejectingPayment.id}
                  </p>
                  <h2 id="reject-payment-title">Reject payment</h2>
                </div>

                <button
                  type="button"
                  className="payments-close-button"
                  disabled={submittingAction}
                  onClick={() => {
                    setRejectingPayment(null);
                    setActionError("");
                  }}
                  aria-label="Close reject dialog"
                >
                  ×
                </button>
              </header>

              <p className="payments-reject-description">
                Enter a clear reason so the customer knows why the receipt was
                rejected and can submit a new one.
              </p>

              {actionError && (
                <div className="payments-alert payments-alert-error">
                  {actionError}
                </div>
              )}

              <form onSubmit={handleReject}>
                <label htmlFor="rejection-reason">Rejection reason</label>
                <textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  maxLength={1000}
                  rows={5}
                  placeholder="For example: The transaction reference does not match the receipt."
                  required
                />

                <div className="payments-reject-footer">
                  <span>{rejectionReason.length}/1000</span>

                  <div className="payments-row-actions">
                    <button
                      type="button"
                      className="payments-button payments-button-secondary"
                      disabled={submittingAction}
                      onClick={() => {
                        setRejectingPayment(null);
                        setActionError("");
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="payments-button payments-button-reject"
                      disabled={
                        submittingAction || !rejectionReason.trim()
                      }
                    >
                      {submittingAction
                        ? "Rejecting..."
                        : "Confirm rejection"}
                    </button>
                  </div>
                </div>
              </form>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
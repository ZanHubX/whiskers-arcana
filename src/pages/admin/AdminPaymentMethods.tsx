import { useEffect, useState } from "react";
import type { FormEvent, CSSProperties } from "react";
import { Link } from "react-router-dom";
import { adminRequest } from "../../services/adminApi";
import type { PaymentMethod } from "../../services/adminApi";
import "./admin.css";

type PaymentMethodForm = {
  name: string;
  account_name: string;
  account_number: string;
  instructions: string;
  sort_order: string;
  is_active: boolean;
  qr_code: File | null;
};

const emptyForm: PaymentMethodForm = {
  name: "",
  account_name: "",
  account_number: "",
  instructions: "",
  sort_order: "0",
  is_active: true,
  qr_code: null,
};

const fieldStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #ded8e9",
  borderRadius: 10,
  padding: "11px 12px",
  font: "inherit",
  background: "#fff",
  color: "#29243a",
};

const labelStyle: CSSProperties = {
  display: "grid",
  gap: 7,
  fontSize: 13,
  fontWeight: 600,
  color: "#554b67",
};

export default function AdminPaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [form, setForm] = useState<PaymentMethodForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadMethods() {
    setLoading(true);
    setError("");

    try {
      const result = await adminRequest<
        PaymentMethod[] | { data: PaymentMethod[] }
      >("/admin/payment-methods");

      setMethods(Array.isArray(result) ? result : result.data ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load payment methods."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMethods();
  }, []);

  function updateField<K extends keyof PaymentMethodForm>(
    key: K,
    value: PaymentMethodForm[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function startEdit(method: PaymentMethod) {
    setEditingId(method.id);
    setForm({
      name: method.name ?? "",
      account_name: method.account_name ?? "",
      account_number: method.account_number ?? "",
      instructions: method.instructions ?? "",
      sort_order: String(method.sort_order ?? 0),
      is_active: Boolean(method.is_active),
      qr_code: null,
    });
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setNotice("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = new FormData();
      payload.append("name", form.name.trim());
      payload.append("account_name", form.account_name.trim());
      payload.append("account_number", form.account_number.trim());
      payload.append("instructions", form.instructions.trim());
      payload.append("sort_order", String(Number(form.sort_order) || 0));
      payload.append("is_active", form.is_active ? "1" : "0");

      if (form.qr_code) payload.append("qr_code", form.qr_code);

      if (editingId === null) {
        await adminRequest<PaymentMethod>("/admin/payment-methods", {
          method: "POST",
          body: payload,
        });
        setNotice("Payment method created successfully.");
      } else {
        // Laravel multipart form updates are commonly handled with method spoofing.
        payload.append("_method", "PUT");
        await adminRequest<PaymentMethod>(
          `/admin/payment-methods/${editingId}`,
          {
            method: "POST",
            body: payload,
          }
        );
        setNotice("Payment method updated successfully.");
      }

      setEditingId(null);
      setForm(emptyForm);
      await loadMethods();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save payment method."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(method: PaymentMethod) {
    setError("");
    setNotice("");

    try {
      await adminRequest<PaymentMethod>(
        `/admin/payment-methods/${method.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: method.name,
            account_name: method.account_name ?? "",
            account_number: method.account_number ?? "",
            instructions: method.instructions ?? "",
            sort_order: method.sort_order ?? 0,
            is_active: !method.is_active,
          }),
        }
      );

      setNotice(
        `${method.name} is now ${method.is_active ? "inactive" : "active"}.`
      );
      await loadMethods();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update status."
      );
    }
  }

  async function deleteMethod(method: PaymentMethod) {
    if (
      !window.confirm(
        `Delete "${method.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setError("");
    setNotice("");

    try {
      await adminRequest<void>(`/admin/payment-methods/${method.id}`, {
        method: "DELETE",
      });

      setNotice(`${method.name} deleted.`);
      if (editingId === method.id) resetForm();
      await loadMethods();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete payment method."
      );
    }
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
          <Link className="admin-nav-item" to="/admin">
            <span>▦</span> Overview
          </Link>
          <Link className="admin-nav-item" to="/admin/bookings">
            <span>▤</span> Bookings
          </Link>
          <Link className="admin-nav-item" to="/admin/payments">
            <span>◇</span> Payments
          </Link>
          <Link className="admin-nav-item" to="/admin/reading-packages">
            <span>✧</span> Reading Packages
          </Link>
          <Link className="admin-nav-item active" to="/admin/payment-methods">
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
            <p className="admin-eyebrow">WHISKERS &amp; WHISPERS ARCANA</p>
            <h1>Payment Methods</h1>
            <p style={{ color: "#81768f", marginTop: 8 }}>
              Manage the payment details customers see during booking.
            </p>
          </div>
          <button
            type="button"
            className="admin-view-site"
            onClick={() => void loadMethods()}
          >
            Refresh
          </button>
        </header>

        {error && (
          <div
            role="alert"
            style={{
              background: "#fff0f0",
              color: "#a52b3b",
              padding: 12,
              borderRadius: 10,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}
        {notice && (
          <div
            role="status"
            style={{
              background: "#ecfbf2",
              color: "#176b43",
              padding: 12,
              borderRadius: 10,
              marginBottom: 16,
            }}
          >
            {notice}
          </div>
        )}

        <section
          className="admin-panel"
          style={{ padding: 24, marginBottom: 22 }}
        >
          <div className="admin-panel-heading">
            <div>
              <h2>
                {editingId === null
                  ? "Add Payment Method"
                  : `Edit Payment Method #${editingId}`}
              </h2>
              <p>Set the account details customers should use to pay.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                gap: 16,
              }}
            >
              <label style={labelStyle}>
                Payment method name *
                <input
                  style={fieldStyle}
                  required
                  value={form.name}
                  placeholder="KBZPay"
                  onChange={(event) => updateField("name", event.target.value)}
                />
              </label>

              <label style={labelStyle}>
                Account name
                <input
                  style={fieldStyle}
                  value={form.account_name}
                  placeholder="Account holder name"
                  onChange={(event) =>
                    updateField("account_name", event.target.value)
                  }
                />
              </label>

              <label style={labelStyle}>
                Account number / phone number
                <input
                  style={fieldStyle}
                  value={form.account_number}
                  placeholder="09xxxxxxxxx"
                  onChange={(event) =>
                    updateField("account_number", event.target.value)
                  }
                />
              </label>

              <label style={labelStyle}>
                Display order
                <input
                  style={fieldStyle}
                  type="number"
                  min="0"
                  value={form.sort_order}
                  onChange={(event) =>
                    updateField("sort_order", event.target.value)
                  }
                />
              </label>
            </div>

            <label style={labelStyle}>
              Payment instructions
              <textarea
                style={{ ...fieldStyle, minHeight: 100, resize: "vertical" }}
                value={form.instructions}
                placeholder="Instructions customers should follow..."
                onChange={(event) =>
                  updateField("instructions", event.target.value)
                }
              />
            </label>

            <label style={labelStyle}>
              QR Code image
              {editingId !== null && (
                <span style={{ fontWeight: 400 }}>
                  Optional — leave empty to keep the current QR code.
                </span>
              )}
              <input
                style={{ ...fieldStyle, padding: 8 }}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) =>
                  updateField("qr_code", event.target.files?.[0] ?? null)
                }
              />
              <small style={{ fontWeight: 400, color: "#81768f" }}>
                PNG, JPG or WEBP. Backend must accept the upload field named
                `qr_code`.
              </small>
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "#554b67",
                fontSize: 14,
              }}
            >
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) =>
                  updateField("is_active", event.target.checked)
                }
              />
              Active — show this payment method to customers
            </label>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  border: 0,
                  borderRadius: 10,
                  padding: "12px 18px",
                  background: "#7960b5",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: saving ? "wait" : "pointer",
                }}
              >
                {saving
                  ? "Saving..."
                  : editingId === null
                    ? "Add Payment Method"
                    : "Save Changes"}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    border: "1px solid #ded8e9",
                    borderRadius: 10,
                    padding: "12px 18px",
                    background: "#fff",
                    color: "#554b67",
                    fontWeight: 600,
                  }}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="admin-panel" style={{ padding: 24 }}>
          <div className="admin-panel-heading">
            <div>
              <h2>Saved Payment Methods</h2>
              <p>Active methods are available to customers.</p>
            </div>
            <strong>{methods.length} total</strong>
          </div>

          {loading ? (
            <p style={{ color: "#81768f" }}>Loading payment methods...</p>
          ) : methods.length === 0 ? (
            <div className="admin-empty">
              <span className="admin-empty-icon">✧</span>
              <h3>No payment methods found</h3>
              <p>Add KBZPay or another method using the form above.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {methods.map((method) => (
                <article
                  key={method.id}
                  style={{
                    border: "1px solid #eee8f5",
                    borderRadius: 14,
                    padding: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 18,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ minWidth: 220, flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <strong style={{ color: "#302740", fontSize: 16 }}>
                        {method.name}
                      </strong>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          borderRadius: 20,
                          padding: "4px 8px",
                          background: method.is_active ? "#e3f8ec" : "#f1edf5",
                          color: method.is_active ? "#177245" : "#766b83",
                        }}
                      >
                        {method.is_active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </div>
                    <p style={{ margin: "8px 0 3px", color: "#554b67" }}>
                      Account name: {method.account_name || "Not set"}
                    </p>
                    <p style={{ margin: 0, color: "#554b67" }}>
                      Account number: {method.account_number || "Not set"}
                    </p>
                    {method.instructions && (
                      <p
                        style={{
                          margin: "8px 0 0",
                          color: "#81768f",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {method.instructions}
                      </p>
                    )}
                    <small
                      style={{
                        display: "block",
                        marginTop: 8,
                        color: "#9a8fab",
                      }}
                    >
                      Display order: {method.sort_order} · ID: {method.id}
                    </small>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => startEdit(method)}
                      style={{
                        border: "1px solid #ded8e9",
                        borderRadius: 9,
                        padding: "9px 12px",
                        background: "#fff",
                        color: "#554b67",
                        fontWeight: 600,
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggleActive(method)}
                      style={{
                        border: "1px solid #ded8e9",
                        borderRadius: 9,
                        padding: "9px 12px",
                        background: "#fff",
                        color: "#554b67",
                        fontWeight: 600,
                      }}
                    >
                      {method.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteMethod(method)}
                      style={{
                        border: 0,
                        borderRadius: 9,
                        padding: "9px 12px",
                        background: "#c94355",
                        color: "#fff",
                        fontWeight: 600,
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

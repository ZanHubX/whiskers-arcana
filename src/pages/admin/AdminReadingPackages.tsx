
import { useCallback, useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { adminRequest } from "../../services/adminApi";
import "./admin.css";

type ReadingPackage = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  local_price: number | string;
  overseas_price: number | string;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

type PackageForm = {
  name: string;
  slug: string;
  description: string;
  local_price: string;
  overseas_price: string;
  is_active: boolean;
  sort_order: string;
};

const EMPTY_FORM: PackageForm = {
  name: "",
  slug: "",
  description: "",
  local_price: "",
  overseas_price: "",
  is_active: true,
  sort_order: "0",
};

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
          to="/admin/reading-packages"
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

function formatPrice(value: number | string) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return String(value);
  }

  return amount.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

export default function AdminReadingPackages() {
  const [packages, setPackages] = useState<ReadingPackage[]>([]);
  const [form, setForm] = useState<PackageForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionId, setActionId] = useState<number | null>(null);

  const loadPackages = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await adminRequest<
        ReadingPackage[] | { data: ReadingPackage[] }
      >("/admin/reading-packages");

      const list = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : null;

      if (!list) {
        throw new Error(
          "Unexpected API response. Expected a reading packages list.",
        );
      }

      setPackages(list);
    } catch (err) {
      setPackages([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPackages();
  }, [loadPackages, refreshKey]);

  const visiblePackages = packages.filter((item) => {
    const term = search.trim().toLowerCase();

    const matchesSearch =
      !term ||
      item.name.toLowerCase().includes(term) ||
      item.slug.toLowerCase().includes(term) ||
      (item.description ?? "").toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && item.is_active) ||
      (statusFilter === "inactive" && !item.is_active);

    return matchesSearch && matchesStatus;
  });

  const activeCount = packages.filter((item) => item.is_active).length;
  const inactiveCount = packages.length - activeCount;

  function updateField<K extends keyof PackageForm>(
    key: K,
    value: PackageForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  function startEditing(item: ReadingPackage) {
    setEditingId(item.id);

    setForm({
      name: item.name,
      slug: item.slug,
      description: item.description ?? "",
      local_price: String(item.local_price),
      overseas_price: String(item.overseas_price),
      is_active: item.is_active,
      sort_order: String(item.sort_order ?? 0),
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const name = form.name.trim();
    const slug = createSlug(form.slug.trim() || name);
    const localPrice = Number(form.local_price);
    const overseasPrice = Number(form.overseas_price);
    const sortOrder = Number(form.sort_order);

    if (!name) {
      setError("Please enter a package name.");
      return;
    }

    if (
      form.local_price.trim() === "" ||
      !Number.isFinite(localPrice) ||
      localPrice < 0
    ) {
      setError("Please enter a valid Local price (0 or more).");
      return;
    }

    if (
      form.overseas_price.trim() === "" ||
      !Number.isFinite(overseasPrice) ||
      overseasPrice < 0
    ) {
      setError("Please enter a valid Overseas price (0 or more).");
      return;
    }

    if (
      form.sort_order.trim() === "" ||
      !Number.isInteger(sortOrder) ||
      sortOrder < 0
    ) {
      setError("Sort order must be a whole number of 0 or more.");
      return;
    }

    const payload = {
      name,
      slug,
      description: form.description.trim() || null,
      local_price: localPrice,
      overseas_price: overseasPrice,
      is_active: form.is_active,
      sort_order: sortOrder,
    };

    setSaving(true);

    try {
      if (editingId !== null) {
        await adminRequest(`/admin/reading-packages/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        setSuccess("Reading package updated successfully.");
      } else {
        await adminRequest("/admin/reading-packages", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setSuccess("Reading package created successfully.");
      }

      resetForm();
      setRefreshKey((current) => current + 1);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(item: ReadingPackage) {
    const nextStatus = !item.is_active;
    const action = nextStatus ? "activate" : "deactivate";

    if (!window.confirm(`Are you sure you want to ${action} "${item.name}"?`)) {
      return;
    }

    setActionId(item.id);
    setError("");
    setSuccess("");

    try {
      await adminRequest(
        `/admin/reading-packages/${item.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            is_active: nextStatus,
          }),
        },
      );

      setSuccess(
        nextStatus
          ? "Reading package activated successfully."
          : "Reading package deactivated successfully.",
      );

      setRefreshKey((current) => current + 1);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionId(null);
    }
  }

  async function deletePackage(item: ReadingPackage) {
    const confirmed = window.confirm(
      `Delete "${item.name}" permanently? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setActionId(item.id);
    setError("");
    setSuccess("");

    try {
      await adminRequest(`/admin/reading-packages/${item.id}`, {
        method: "DELETE",
      });

      if (editingId === item.id) {
        resetForm();
      }

      setSuccess("Reading package deleted successfully.");
      setRefreshKey((current) => current + 1);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="admin-shell admin-packages-shell">
      <AdminSidebar />

      <main className="admin-main admin-packages-main">
        <header className="admin-page-header admin-packages-header">
          <div>
            <p className="admin-eyebrow">
              WHISKERS &amp; WHISPERS ARCANA
            </p>
            <h1>Reading Packages</h1>
            <p className="admin-page-description">
              Create packages, manage prices, and control which readings
              appear on your public website.
            </p>
          </div>

          <div className="admin-packages-header-actions">
            <Link to="/" className="admin-button admin-button-secondary">
              View site ↗
            </Link>

            <button
              type="button"
              className="admin-button admin-button-primary"
              onClick={() => setRefreshKey((current) => current + 1)}
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </header>

        <section className="admin-packages-summary">
          <article className="admin-summary-card">
            <span>Total packages</span>
            <strong>{loading ? "—" : packages.length}</strong>
          </article>

          <article className="admin-summary-card">
            <span>Active packages</span>
            <strong>{loading ? "—" : activeCount}</strong>
          </article>

          <article className="admin-summary-card">
            <span>Inactive packages</span>
            <strong>{loading ? "—" : inactiveCount}</strong>
          </article>
        </section>

        {error && (
          <div className="admin-error admin-packages-message" role="alert">
            <strong>Something went wrong</strong>
            <p>{error}</p>
            <button
              type="button"
              className="admin-button admin-button-secondary"
              onClick={() => setRefreshKey((current) => current + 1)}
            >
              Try again
            </button>
          </div>
        )}

        {success && (
          <div className="admin-packages-success" role="status">
            <span>✓</span>
            <p>{success}</p>
            <button
              type="button"
              aria-label="Dismiss success message"
              onClick={() => setSuccess("")}
            >
              ×
            </button>
          </div>
        )}

        <section className="admin-panel admin-packages-form-panel">
          <div className="admin-packages-section-heading">
            <div>
              <p className="admin-eyebrow">
                {editingId !== null ? "EDIT PACKAGE" : "PACKAGE SETUP"}
              </p>
              <h2>
                {editingId !== null
                  ? "Update reading package"
                  : "Create a reading package"}
              </h2>
              <p>
                Set the package details and prices for Local and Overseas
                customers.
              </p>
            </div>

            {editingId !== null && (
              <button
                type="button"
                className="admin-button admin-button-secondary"
                onClick={resetForm}
              >
                Cancel edit
              </button>
            )}
          </div>

          <form className="admin-packages-form" onSubmit={handleSubmit}>
            <div className="admin-packages-field admin-packages-field-wide">
              <label htmlFor="package-name">Package name *</label>
              <input
                id="package-name"
                type="text"
                maxLength={255}
                value={form.name}
                onChange={(event) => {
                  const name = event.target.value;
                  setForm((current) => ({
                    ...current,
                    name,
                    ...(editingId === null && !current.slug.trim()
                      ? { slug: createSlug(name) }
                      : {}),
                  }));
                }}
                placeholder="e.g. Single Question Reading"
                required
              />
            </div>

            <div className="admin-packages-field admin-packages-field-wide">
              <label htmlFor="package-slug">Package slug</label>
              <input
                id="package-slug"
                type="text"
                maxLength={255}
                value={form.slug}
                onChange={(event) =>
                  updateField("slug", createSlug(event.target.value))
                }
                placeholder="single-question-reading"
              />
              <small>
                Used as a unique internal identifier. Leave blank to generate
                it from the package name.
              </small>
            </div>

            <div className="admin-packages-field admin-packages-field-wide">
              <label htmlFor="package-description">Description</label>
              <textarea
                id="package-description"
                rows={4}
                maxLength={5000}
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                placeholder="Describe what customers can expect from this reading..."
              />
            </div>

            <div className="admin-packages-field">
              <label htmlFor="package-local-price">Local price (MMK) *</label>
              <input
                id="package-local-price"
                type="number"
                min="0"
                step="0.01"
                value={form.local_price}
                onChange={(event) =>
                  updateField("local_price", event.target.value)
                }
                placeholder="5000"
                required
              />
            </div>

            <div className="admin-packages-field">
              <label htmlFor="package-overseas-price">
                Overseas price (MMK) *
              </label>
              <input
                id="package-overseas-price"
                type="number"
                min="0"
                step="0.01"
                value={form.overseas_price}
                onChange={(event) =>
                  updateField("overseas_price", event.target.value)
                }
                placeholder="10000"
                required
              />
            </div>

            <div className="admin-packages-field">
              <label htmlFor="package-sort-order">Display order</label>
              <input
                id="package-sort-order"
                type="number"
                min="0"
                step="1"
                value={form.sort_order}
                onChange={(event) =>
                  updateField("sort_order", event.target.value)
                }
                required
              />
              <small>Lower numbers appear first.</small>
            </div>

            <div className="admin-packages-field admin-packages-status-field">
              <span className="admin-packages-label">Package visibility</span>
              <label className="admin-packages-checkbox">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) =>
                    updateField("is_active", event.target.checked)
                  }
                />
                <span>
                  <strong>{form.is_active ? "Active" : "Inactive"}</strong>
                  <small>
                    {form.is_active
                      ? "Available to customers on the public site."
                      : "Hidden from the public package list."}
                  </small>
                </span>
              </label>
            </div>

            <div className="admin-packages-form-actions">
              <button
                type="submit"
                className="admin-button admin-button-primary"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId !== null
                    ? "Save changes"
                    : "Create package"}
              </button>

              <button
                type="button"
                className="admin-button admin-button-secondary"
                onClick={resetForm}
                disabled={saving}
              >
                Clear form
              </button>
            </div>
          </form>
        </section>

        <section className="admin-panel admin-packages-list-panel">
          <div className="admin-packages-section-heading">
            <div>
              <p className="admin-eyebrow">YOUR CATALOGUE</p>
              <h2>All reading packages</h2>
              <p>Review and manage packages stored in your database.</p>
            </div>
          </div>

          <div className="admin-packages-toolbar">
            <div className="admin-packages-search">
              <label htmlFor="package-search">Search packages</label>
              <input
                id="package-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, slug or description..."
              />
            </div>

            <div className="admin-packages-filter">
              <label htmlFor="package-status-filter">Status</label>
              <select
                id="package-status-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">All packages</option>
                <option value="active">Active only</option>
                <option value="inactive">Inactive only</option>
              </select>
            </div>
          </div>

          {loading && (
            <div className="admin-loading" role="status">
              Loading reading packages from the API...
            </div>
          )}

          {!loading && !error && visiblePackages.length === 0 && (
            <div className="admin-empty-state">
              <h2>No reading packages found</h2>
              <p>
                Try changing your search or status filter, or create a new
                package using the form above.
              </p>
            </div>
          )}

          {!loading && visiblePackages.length > 0 && (
            <>
              <div className="admin-table-meta">
                Showing <strong>{visiblePackages.length}</strong> of{" "}
                <strong>{packages.length}</strong> packages
              </div>

              <div className="admin-table-wrapper">
                <table className="admin-table admin-packages-table">
                  <thead>
                    <tr>
                      <th>Package</th>
                      <th>Local price</th>
                      <th>Overseas price</th>
                      <th>Order</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {visiblePackages.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="admin-packages-name-cell">
                            <strong>{item.name}</strong>
                            <span className="admin-table-subtext">
                              {item.slug}
                            </span>
                            {item.description && (
                              <span className="admin-packages-description">
                                {item.description}
                              </span>
                            )}
                          </div>
                        </td>

                        <td>
                          <strong>
                            {formatPrice(item.local_price)} MMK
                          </strong>
                        </td>

                        <td>
                          <strong>
                            {formatPrice(item.overseas_price)} MMK
                          </strong>
                        </td>

                        <td>{item.sort_order}</td>

                        <td>
                          <span
                            className={`admin-packages-status ${
                              item.is_active
                                ? "is-active"
                                : "is-inactive"
                            }`}
                          >
                            <span className="admin-packages-status-dot" />
                            {item.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td>
                          <div className="admin-packages-row-actions">
                            <button
                              type="button"
                              className="admin-button admin-button-secondary admin-packages-action-button"
                              onClick={() => startEditing(item)}
                              disabled={actionId === item.id || saving}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="admin-button admin-button-secondary admin-packages-action-button"
                              onClick={() => void toggleStatus(item)}
                              disabled={actionId === item.id || saving}
                            >
                              {actionId === item.id
                                ? "Please wait..."
                                : item.is_active
                                  ? "Deactivate"
                                  : "Activate"}
                            </button>

                            <button
                              type="button"
                              className="admin-button admin-packages-delete-button"
                              onClick={() => void deletePackage(item)}
                              disabled={actionId === item.id || saving}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

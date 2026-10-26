
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { verifyAdminSession } from "../../services/adminApi";

export default function ProtectedAdminRoute() {
  const [status, setStatus] = useState<"checking" | "valid" | "invalid">(
    "checking"
  );

  useEffect(() => {
    let active = true;

    verifyAdminSession()
      .then(() => {
        if (active) setStatus("valid");
      })
      .catch(() => {
        localStorage.removeItem("wwa_admin_token");
        localStorage.removeItem("wwa_admin_user");

        if (active) setStatus("invalid");
      });

    return () => {
      active = false;
    };
  }, []);

  if (status === "checking") {
    return <div style={{ padding: 40 }}>Verifying admin session...</div>;
  }

  if (status === "invalid") {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import App from "./App";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminReadingPackages from "./pages/admin/AdminReadingPackages";
import AdminPaymentMethods from "./pages/admin/AdminPaymentMethods";
import ProtectedAdminRoute from "./pages/admin/ProtectedAdminRoute";

export default function RootRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer website */}
        <Route path="/" element={<App />} />
        <Route path="/readings" element={<App />} />
        <Route path="/booking" element={<App />} />

        {/* Admin login */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected admin pages */}
        <Route element={<ProtectedAdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/bookings" element={<AdminBookings />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
          <Route path="/admin/packages" element={<AdminReadingPackages />} />
          <Route
            path="/admin/payment-methods"
            element={<AdminPaymentMethods />}
          />
        </Route>

        {/* Unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

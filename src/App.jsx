/**
 * App.jsx — Route definitions
 *
 * Routes:
 *   /login                → LoginPage        (public)
 *   /                     → PortalPickerPage  (protected — choose EMS or AHS)
 *   /ems                  → HomePage          (protected — EMS sessions list)
 *   /ems/session/:id      → SessionPage       (protected — EMS live monitoring)
 *   /ahs                  → HomePage          (protected — AHS sessions list)
 *   /ahs/:id              → AHSPage           (protected — AHS image review)
 *
 * Navbar + Footer are provided once by AppLayout (see layouts/AppLayout.jsx).
 * ProtectedRoute redirects unauthenticated users to /login.
 * Routes are wrapped in ErrorBoundary so a single screen error does not unmount the router.
 */

import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import AppLayout from "./layouts/AppLayout";
import ProtectedRoute from "./layouts/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import PortalPickerPage from "./pages/PortalPickerPage";
import HomePage from "./pages/HomePage";
import SessionPage from "./pages/SessionPage";
import AHSPage from "./pages/AHSPage";

export default function App() {
  const location = useLocation();

  return (
    <ErrorBoundary key={location.pathname}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route index element={<PortalPickerPage />} />
            <Route
              path="ems"
              element={<HomePage portalName="EMS Portal" sessionBasePath="/ems/session" />}
            />
            <Route path="ems/session/:sessionId" element={<SessionPage />} />
            <Route
              path="ahs"
              element={<HomePage portalName="AHS Portal" sessionBasePath="/ahs" />}
            />
            <Route path="ahs/:sessionId" element={<AHSPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}

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
 * ProtectedRoute redirects unauthenticated users to /login.
 */

import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import LoginPage         from "./pages/LoginPage";
import PortalPickerPage  from "./pages/PortalPickerPage";
import HomePage          from "./pages/HomePage";
import SessionPage       from "./pages/SessionPage";
import AHSPage           from "./pages/AHSPage";

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Portal picker — post-login landing */}
      <Route path="/" element={
        <ProtectedRoute><PortalPickerPage /></ProtectedRoute>
      } />

      {/* EMS Portal */}
      <Route path="/ems" element={
        <ProtectedRoute>
          <HomePage portalName="EMS Portal" sessionBasePath="/ems/session" />
        </ProtectedRoute>
      } />
      <Route path="/ems/session/:sessionId" element={
        <ProtectedRoute><SessionPage /></ProtectedRoute>
      } />

      {/* AHS Portal */}
      <Route path="/ahs" element={
        <ProtectedRoute>
          <HomePage portalName="AHS Portal" sessionBasePath="/ahs" />
        </ProtectedRoute>
      } />
      <Route path="/ahs/:sessionId" element={
        <ProtectedRoute><AHSPage /></ProtectedRoute>
      } />

      {/* Catch-all → portal picker */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

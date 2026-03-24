/**
 * App.jsx — Route definitions
 *
 * Three routes:
 *   /login           → LoginPage   (public)
 *   /                → HomePage    (protected)
 *   /session/:id     → SessionPage (protected)
 *
 * ProtectedRoute redirects unauthenticated users to /login.
 */

import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import LoginPage   from "./pages/LoginPage";
import HomePage    from "./pages/HomePage";
import SessionPage from "./pages/SessionPage";
import AHSPage         from "./pages/AHSPage";
import AHSLandingPage  from "./pages/AHSLandingPage.jsx";

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/" element={
        <ProtectedRoute><HomePage /></ProtectedRoute>
      } />

      <Route path="/session/:sessionId" element={
        <ProtectedRoute><SessionPage /></ProtectedRoute>
      } />

      <Route path="/ahs" element={
        <ProtectedRoute><AHSLandingPage /></ProtectedRoute>
      } />

      <Route path="/ahs/:sessionId" element={
        <ProtectedRoute><AHSPage /></ProtectedRoute>
      } />

      {/* Catch-all → home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
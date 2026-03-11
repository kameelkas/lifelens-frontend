/**
 * client.js — LifeLens API Client
 *
 * Every fetch call in the app goes through here.
 * The API URL comes from the .env file — never hardcoded elsewhere.
 *
 * All functions throw on non-OK responses so callers can catch errors.
 */

const BASE_URL = import.meta.env.VITE_API_URL;

// Read token from localStorage — set by AuthContext on login
function getToken() {
  return localStorage.getItem("lifelens_token");
}

// Standard auth headers used by every protected request
function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

// ==========================
// AUTH
// ==========================

export function login(username, password) {
  return request("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
}

// ==========================
// SESSIONS
// ==========================

export function fetchSessions() {
  return request("/sessions", { headers: authHeaders() });
}

export function fetchActiveSession() {
  return request("/sessions/active", { headers: authHeaders() });
}

// ==========================
// SESSION DATA
// ==========================

export function fetchMedications(sessionId) {
  return request(`/sessions/${sessionId}/medications`, { headers: authHeaders() });
}

export function fetchInterventions(sessionId) {
  return request(`/sessions/${sessionId}/interventions`, { headers: authHeaders() });
}

export function fetchInjuries(sessionId) {
  return request(`/sessions/${sessionId}/injuries`, { headers: authHeaders() });
}
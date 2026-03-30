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
    const body = await res.json().catch((err) => {
      console.error(err);
      return {};
    });
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

export function fetchVisual(sessionId, deviceId) {
  return request(`/sessions/${sessionId}/visual?device_id=${deviceId}`, { headers: authHeaders() });
}

// ==========================
// IMAGES
// ==========================

/**
 * Fetch raw encrypted bytes for an image.
 * The frontend renders these as pixel noise (anonymized view).
 */
export async function fetchImageEncrypted(sessionId, imageId, deviceId) {
  const res = await fetch(
    `${BASE_URL}/sessions/${sessionId}/images/${imageId}?device_id=${deviceId}`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
  return res.arrayBuffer();
}

/**
 * Fetch a decrypted image for medical staff (uses Bearer token).
 * Returns a blob URL ready for use in <img src={...}>.
 */
export async function fetchDecryptedImage(sessionId, imageId, deviceId) {
  const res = await fetch(
    `${BASE_URL}/sessions/${sessionId}/images/${imageId}/decrypt?device_id=${deviceId}`,
    { method: "POST", headers: authHeaders() }
  );
  if (!res.ok) throw new Error(`Decryption failed: ${res.status}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

/**
 * Fetch a decrypted image for the AHS portal (uses AHS password header).
 * Returns a blob URL ready for use in <img src={...}>.
 */
export async function fetchAHSImage(sessionId, imageId, deviceId, ahsPassword) {
  const res = await fetch(
    `${BASE_URL}/sessions/${sessionId}/images/${imageId}/decrypt-ahs?device_id=${deviceId}`,
    {
      method: "POST",
      headers: {
        ...authHeaders(),
        "AHS-Password": ahsPassword,
      },
    }
  );
  if (!res.ok) throw new Error(`AHS decryption failed: ${res.status}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export function fetchImages(sessionId, deviceId) {
  return request(`/sessions/${sessionId}/images?device_id=${deviceId}`, {
    headers: authHeaders(),
  });
}
/**
 * useSSE.js
 *
 * Opens and maintains an SSE connection to GET /events.
 * Calls onEvent(event) whenever a message arrives.
 * Automatically closes the connection when the component unmounts.
 * Auto-logs out if the server becomes unreachable (3 consecutive errors).
 *
 * Usage:
 *   useSSE((event) => {
 *     if (event.data_type === "medx") { ... }
 *   });
 */
import { useEffect, useRef } from "react";
import { useAuth } from "../auth/AuthContext";

const BASE_URL = import.meta.env.VITE_API_URL;

export default function useSSE(onEvent) {
  const { logout } = useAuth();
  const errorCount = useRef(0);

  useEffect(() => {
    const token = localStorage.getItem("lifelens_token");
    if (!token) return;

    // EventSource doesn't support custom headers, so we pass the token
    // as a query parameter. The backend reads it from there.
    const url = `${BASE_URL}/events?token=${token}`;
    const source = new EventSource(url);

    source.onmessage = (e) => {
      errorCount.current = 0;  // reset on successful message
      try {
        const event = JSON.parse(e.data);
        onEvent(event);
      } catch {
        // Ignore malformed events
      }
    };

    source.onerror = () => {
      errorCount.current += 1;
      if (errorCount.current >= 3) {
        source.close();
        logout();
      }
    };

    return () => source.close();
  }, []);
}
/**
 * useSSE.js
 *
 * Opens and maintains an SSE connection to GET /events.
 * Calls onEvent(event) whenever a message arrives.
 * Automatically closes the connection when the component unmounts.
 *
 * Usage:
 *   useSSE((event) => {
 *     if (event.data_type === "medx") { ... }
 *   });
 */

import { useEffect } from "react";

const BASE_URL = import.meta.env.VITE_API_URL;

export default function useSSE(onEvent) {
  useEffect(() => {
    const token = localStorage.getItem("lifelens_token");
    if (!token) return;

    // EventSource doesn't support custom headers, so we pass the token
    // as a query parameter. The backend reads it from there.
    const url = `${BASE_URL}/events?token=${token}`;
    const source = new EventSource(url);

    source.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        onEvent(event);
      } catch {
        // Ignore malformed events
      }
    };

    source.onerror = () => {
      // Browser will automatically retry — no action needed
    };

    return () => source.close();
  }, []);
}
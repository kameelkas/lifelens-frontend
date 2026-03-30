/**
 * useSSE.js
 *
 * Opens and maintains an SSE connection to GET /events.
 * Calls the latest onEvent(event) whenever a message arrives (ref-backed, no reconnect per render).
 * Automatically closes the connection when the component unmounts.
 * Auto-logs out if the server becomes unreachable (3 consecutive errors), or immediately on 401.
 * Uses fetch + Authorization header instead of EventSource to avoid
 * exposing the token in the URL.
 *
 * Note: Unlike browser EventSource, this client does not auto-reconnect if the stream ends;
 * users may need to refresh after a long idle server disconnect.
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
  const onEventRef = useRef(onEvent);

  onEventRef.current = onEvent;

  useEffect(() => {
    const token = localStorage.getItem("lifelens_token");
    if (!token) return;

    const controller = new AbortController();

    function bumpErrorOrLogout(status) {
      if (status === 401) {
        logout();
        return;
      }

      errorCount.current += 1;

      if (errorCount.current >= 3) {
        logout();
      }
    }

    async function connect() {
      try {
        const response = await fetch(`${BASE_URL}/events`, {
          cache: "no-store",
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!response.ok) {
          bumpErrorOrLogout(response.status);
          return;
        }

        if (!response.body) {
          bumpErrorOrLogout(0);
          return;
        }

        errorCount.current = 0;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();

          if (value) buffer += decoder.decode(value, { stream: true });
          if (done) buffer += decoder.decode();

          const lines = buffer.split("\n");

          if (!done) {
            buffer = lines.pop() ?? "";
          } else {
            buffer = "";
          }

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const event = JSON.parse(line.slice(6).trim());
                errorCount.current = 0;
                onEventRef.current?.(event);
              } catch {
                // Ignore malformed events
              }
            }
          }

          if (done) break;
        }
      } catch (err) {
        if (err.name === "AbortError") return;

        errorCount.current += 1;

        if (errorCount.current >= 3) {
          logout();
        }
      }
    }

    connect();

    return () => controller.abort();
  }, []);
}
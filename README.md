# LifeLens Frontend

Single-page app for **real-time medical session monitoring** and related workflows. It talks to a **separate backend** over HTTP (REST + Server-Sent Events). This repository contains **only the React UI**.

## Features

- **Authentication** — Login with username/password; JWT stored in `localStorage` and sent as `Authorization: Bearer …` on protected requests.
- **Portal picker** — After login, choose **EMS** or **AHS** workflow.
- **EMS portal** — Session list and **live session view** with timeline, body map, medications/interventions, visual data, and real-time updates via SSE (`/events`).
- **AHS portal** — Session list and **image review** with encrypted preview and decrypted views where the API allows (including AHS-specific decrypt when configured).
- **Theming** — Light/dark support via app theme context.
- **Error boundaries** — Route-level boundaries so a single screen error does not tear down the whole router.

## Tech stack

- React 18, React Router v6  
- Vite 5  
- Tailwind CSS 3, PostCSS, Autoprefixer  
- npm (`package-lock.json`)

## Requirements

- **Node.js** (LTS recommended) and npm  
- A running **LifeLens API** (not in this repo)

## Configuration

Create a `.env` file in the project root (this file is not committed):

```env
VITE_API_URL=https://your-api-host.example
```

`VITE_API_URL` is **inlined at build/dev time**. After changing it, restart the dev server or run a new build.

Without a valid API URL, requests will fail (e.g. network / “Failed to fetch”) — expected if you only run the frontend.

## Scripts

| Command           | Description                          |
|-------------------|--------------------------------------|
| `npm install`     | Install dependencies                 |
| `npm run dev`     | Dev server (default: `http://localhost:5173`) |
| `npm run build`   | Production build → `dist/`         |
| `npm run preview` | Serve the production build locally   |

## High-level API usage

The UI expects a backend that implements the routes used in `src/api/client.js`, including for example:

- `POST /login` — returns `{ token, username }`  
- `GET /sessions`, `GET /sessions/active` — Bearer auth  
- Session-scoped resources: medications, interventions, visual data, images (including decrypt endpoints where used)  
- `GET /events` — SSE stream (consumed with `fetch` + `Authorization`, not `EventSource`)

Exact contracts belong in your API documentation; this frontend is built against that service.

## Project layout (overview)

```
src/
  api/client.js       # All HTTP calls; uses VITE_API_URL
  auth/               # Auth context + token persistence
  components/         # Shared UI (e.g. BodyMap, Timeline, Navbar)
  hooks/useSSE.js     # SSE client for live events
  layouts/            # App shell, protected routes
  pages/              # Login, portals, home, session, AHS
  theme/              # Theme provider
  utils/              # Time, session display helpers
```

## Contributing / quality

There is **no ESLint or test script** in `package.json` today. Use your team’s preferred checks if you add them.

## License / privacy

Treat this as **healthcare-related software**: follow your organization’s policies for deployment, access control, and handling of patient or session data. The backend owns authorization and data rules; this repo is the browser client only.

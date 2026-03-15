# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

LifeLens is a **frontend-only** React SPA (Single Page Application) for real-time medical/healthcare session monitoring. It connects to an **external backend API** (not included in this repository) via the `VITE_API_URL` environment variable.

### Tech stack

- React 18 + React Router v6
- Vite 5 (dev server / bundler)
- Tailwind CSS 3 + PostCSS + Autoprefixer
- npm (lockfile: `package-lock.json`)

### Running the app

- `npm run dev` — starts Vite dev server (default: http://localhost:5173)
- `npm run build` — production build to `dist/`
- `npm run preview` — preview the production build locally

### Key caveats

- **No backend in this repo.** The app requires `VITE_API_URL` pointing to an external backend. Without it, API calls will fail with "Failed to fetch". This is expected behavior when running the frontend alone.
- **No lint or test scripts** are defined in `package.json`. There is no ESLint config or test framework set up.
- **No `.env` file is committed.** To configure the API URL, create `.env` in the project root with `VITE_API_URL=<backend-url>`. Vite reads this at dev/build time.
- The `VITE_API_URL` value is baked into the build at compile time (via `import.meta.env`), so changing it requires restarting the dev server or rebuilding.

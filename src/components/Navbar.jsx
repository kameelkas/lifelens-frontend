import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function LogoMark({ logoSrc }) {
  if (logoSrc) {
    return (
      <img
        src={logoSrc}
        alt="LifeLens logo"
        className="h-8 w-8 rounded"
      />
    );
  }

  // Placeholder to reserve space for the real logo asset.
  return (
    <div
      className="h-8 w-8 rounded bg-brand-gold/20 flex items-center justify-center text-brand-gold font-bold"
      aria-hidden="true"
    >
      L
    </div>
  );
}

export default function Navbar({ logoSrc, brandTo = "/" }) {
  const { token, user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-app-bg/90 backdrop-blur border-b border-muted/50 flex items-center justify-between px-8 py-4">
      <div className="flex items-center gap-6 min-w-0">
        <Link
          to={brandTo}
          className="flex items-center gap-3 hover:opacity-90 transition-opacity"
        >
          <LogoMark logoSrc={logoSrc} />
          <span className="text-brand-gold text-xl font-semibold whitespace-nowrap">
            LifeLens
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {token && (
          <>
            <span className="text-muted text-base whitespace-nowrap capitalize">User: <b>{user}</b></span>
            <button
              type="button"
              onClick={logout}
              className="text-muted text-base hover:text-brand-gold transition-all duration-300 ease-in-out hover:underline underline-offset-4"
            >
              Sign out
            </button>
          </>
        )}
      </div>
    </header>
  );
}


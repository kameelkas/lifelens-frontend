import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import lifelensMark from "../assets/lifelens-mark.png";

function LogoMark({ logoSrc }) {
  const src = logoSrc || lifelensMark;

  return (
    <div className="h-12 w-12 sm:h-14 sm:w-14 overflow-hidden rounded">
      <img
        src={src}
        alt="LifeLens logo"
        className="h-full w-full object-contain"
      />
    </div>
  );
}

export default function Navbar({ logoSrc, brandTo = "/" }) {
  const { token, user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-app-bg/90 backdrop-blur border-b border-muted/50 px-4 sm:px-8 py-2">
      <div className="mx-auto w-full max-w-6xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <Link
          to={brandTo}
          className="flex items-center hover:opacity-90 transition-opacity min-w-0"
        >
          <LogoMark logoSrc={logoSrc} />
          <span className="ml-3 text-brand-gold text-xl sm:text-2xl font-semibold whitespace-nowrap">
            LifeLens
          </span>
        </Link>

        {token && (
          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
            <span className="text-muted text-sm sm:text-base whitespace-nowrap capitalize">
              <span className="hidden sm:inline">User: </span>
              <b className="font-semibold">{user}</b>
            </span>
            <button
              type="button"
              onClick={logout}
              className="text-muted text-sm sm:text-base hover:text-brand-gold transition-all duration-300 ease-in-out hover:underline underline-offset-4 whitespace-nowrap"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}


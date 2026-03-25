import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import lifelensMark from "../assets/lifelens-mark.png";

function LogoMark({ logoSrc }) {
  const src = logoSrc || lifelensMark;

  return (
    <div className="h-16 w-16 overflow-hidden rounded">
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
    <header className="sticky top-0 z-50 bg-app-bg/90 backdrop-blur border-b border-muted/50 h-16 flex items-center justify-between px-8">
      <div className="flex items-center gap-6 min-w-0">
        <Link
          to={brandTo}
          className="flex items-center hover:opacity-90 transition-opacity"
        >
          <LogoMark logoSrc={logoSrc} />
          <span className="ml-3 text-brand-gold text-2xl font-semibold whitespace-nowrap">
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


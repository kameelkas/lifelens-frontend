import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../theme/ThemeContext";
import lifelensMark from "../assets/lifelens-mark.png";

function LogoMark({ logoSrc }) {
  const src = logoSrc || lifelensMark;

  return (
    <div className="h-12 w-12 sm:h-14 sm:w-14 overflow-hidden rounded-full">
      <img
        src={src}
        alt="LifeLens logo"
        className="h-full w-full object-contain"
      />
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="p-1.5 rounded-lg text-muted hover:text-brand-gold transition-colors"
    >
      {isDark ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.758 17.303a.75.75 0 0 0-1.061-1.06l-1.591 1.59a.75.75 0 0 0 1.06 1.061l1.591-1.59ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.697 7.757a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 0 0-1.061 1.06l1.59 1.591Z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69.75.75 0 0 1 .981.98 10.503 10.503 0 0 1-9.694 6.46c-5.799 0-10.5-4.7-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 0 1 .818.162Z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
}

export default function Navbar() {
  const { token, user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-transparent backdrop-blur-3xl sm:px-8 px-2 py-1">
      <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <Link
          to='/'
          className="flex items-center hover:opacity-90 transition-opacity min-w-0"
        >
          <LogoMark />
          <span className="ml-3 text-brand-gold text-2xl font-semibold whitespace-nowrap">
            LifeLens
          </span>
        </Link>

        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
          <ThemeToggle />
          {token && (
            <>
              <span className="text-muted text-sm sm:text-base whitespace-nowrap capitalize">
                <span className="hidden sm:inline">User: </span>
                <b className="font-semibold text-lg">{user}</b>
              </span>
              <button
                type="button"
                onClick={logout}
                className="text-muted text-lg hover:text-brand-gold transition-all duration-300 ease-in-out hover:underline underline-offset-4 whitespace-nowrap"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}


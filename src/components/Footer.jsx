import STARSLogo from "../assets/STARS.png";
import uofcShield from "../assets/uofc-shield.png";

export default function Footer({ year = new Date().getFullYear() }) {
  return (
    <footer className="fixed bottom-0 inset-x-0 z-40 bg-transparent backdrop-blur-3xl px-2 sm:px-8 py-3">
      <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-6">
        <p className="text-muted text-xs sm:text-sm">
          © {year} LifeLens. All rights reserved.
        </p>

        <div
          className="flex flex-wrap items-center gap-3 sm:gap-4"
          aria-label="Partner logos"
        >
          <img
            src={STARSLogo}
            alt="STARS"
            className="h-8 w-auto rounded-full max-h-9 max-w-[min(11rem,42vw)] object-contain sm:h-9"
          />
          <img
            src={uofcShield}
            alt="University of Calgary coat of arms"
            className="h-9 w-auto rounded-full max-h-10 max-w-[min(5rem,28vw)] object-contain sm:h-10"
          />
        </div>
      </div>
    </footer>
  );
}

import STARSLogo from "../assets/STARS.png";
import uofcShield from "../assets/uofc-shield.png";

export default function Footer({ year = new Date().getFullYear() }) {
  return (
    <footer className="fixed bottom-0 inset-x-0 z-40 bg-transparent backdrop-blur-3xl px-2 sm:px-8 py-3">
      <div className="mx-auto flex w-full min-w-0 max-w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p className="min-w-0 text-center text-muted text-xs sm:text-left sm:text-sm">
          © {year} LifeLens. All rights reserved.
        </p>

        <div
          className="flex min-w-0 max-w-full flex-wrap items-center justify-center gap-2 sm:justify-end sm:gap-4"
          aria-label="Partner logos"
        >
          <img
            src={STARSLogo}
            alt="STARS"
            className="h-7 w-auto max-h-8 shrink-0 rounded-full object-contain sm:h-9 sm:max-h-9 max-w-[min(10rem,70vw)] sm:max-w-[min(11rem,40vw)]"
          />
          <img
            src={uofcShield}
            alt="University of Calgary coat of arms"
            className="h-8 w-auto max-h-9 shrink-0 rounded-full object-contain sm:h-10 sm:max-h-10 max-w-[min(4.5rem,22vw)] sm:max-w-[min(5rem,26vw)]"
          />
        </div>
      </div>
    </footer>
  );
}

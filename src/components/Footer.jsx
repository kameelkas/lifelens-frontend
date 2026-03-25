export default function Footer({
  year = new Date().getFullYear(),
  logoCount = 3,
}) {
  return (
    <footer className="fixed bottom-0 inset-x-0 z-40 bg-transparent backdrop-blur-3xl px-2 sm:px-8 py-3">
      <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-6">
        <p className="text-muted text-xs sm:text-sm">
          © {year} LifeLens. All rights reserved.
        </p>

        <div className="flex items-center gap-2 sm:gap-3" aria-label="Additional logos">
          {Array.from({ length: logoCount }).map((_, idx) => (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={idx}
              className="h-7 w-7 sm:h-8 sm:w-8 rounded bg-brand-gold/20"
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    </footer>
  );
}


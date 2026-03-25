export default function Footer({
  year = new Date().getFullYear(),
  logoCount = 3,
}) {
  return (
    <footer className="fixed bottom-0 inset-x-0 z-40 bg-app-bg/90 backdrop-blur border-t border-muted/50 px-8 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-6 flex-wrap">
        <p className="text-muted text-sm">
          © {year} LifeLens. All rights reserved.
        </p>

        <div className="flex items-center gap-3" aria-label="Additional logos">
          {Array.from({ length: logoCount }).map((_, idx) => (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={idx}
              className="h-8 w-8 rounded bg-brand-gold/20"
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    </footer>
  );
}


'use client';

const contributorSlots = ['Contributor 01', 'Contributor 02', 'Contributor 03', 'Contributor 04', 'Contributor 05'];

export default function AppFooter() {
  return (
    <footer
      className="theme-card mt-4 px-5 py-6"
      style={{
        background: 'linear-gradient(180deg, color-mix(in srgb, var(--surface-soft) 96%, transparent) 0%, color-mix(in srgb, var(--surface) 92%, transparent) 100%)',
      }}
    >
      <p className="theme-kicker">contributors</p>
      <div className="mt-4 flex flex-wrap gap-2.5">
        {contributorSlots.map((name) => (
          <span
            key={name}
            className="rounded-full px-3 py-1 font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface"
            style={{
              background: 'color-mix(in srgb, var(--surface-elevated) 88%, transparent)',
              border: '1px solid var(--border)',
            }}
          >
            {name}
          </span>
        ))}
      </div>
      <p className="mt-4 text-sm leading-6 text-on-surface-variant">
        Built to make the daily grind feel a little more alive. Drop the five contributor names here whenever you&apos;re ready.
      </p>
    </footer>
  );
}

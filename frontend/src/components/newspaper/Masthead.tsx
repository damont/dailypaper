interface MastheadProps {
  newspaperName: string
  date: string
  onPrevDay: () => void
  onNextDay: () => void
  onToday: () => void
  isToday: boolean
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function Masthead({ newspaperName, date, onPrevDay, onNextDay, onToday, isToday }: MastheadProps) {
  return (
    <div className="text-center py-6 border-b-4 border-double border-[var(--text-primary)]">
      <h1
        className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight uppercase text-[var(--text-primary)]"
        style={{ fontFamily: 'var(--font-headline)' }}
      >
        {newspaperName}
      </h1>
      <div className="flex items-center justify-center gap-4 mt-2">
        <button
          onClick={onPrevDay}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl px-2"
          aria-label="Previous day"
        >
          &larr;
        </button>
        <span
          className="text-sm sm:text-base text-[var(--text-secondary)] italic"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {formatDate(date)}
        </span>
        <button
          onClick={onNextDay}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl px-2"
          aria-label="Next day"
        >
          &rarr;
        </button>
      </div>
      {!isToday && (
        <button
          onClick={onToday}
          className="mt-2 text-xs text-[var(--accent)] hover:underline"
        >
          Back to Today
        </button>
      )}
      <div className="mt-3 border-t border-[var(--border-color)]" />
    </div>
  )
}

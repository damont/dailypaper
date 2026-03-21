export default function EmptyEdition() {
  return (
    <div className="text-center py-16">
      <p
        className="text-2xl text-[var(--text-muted)] italic"
        style={{ fontFamily: 'var(--font-headline)' }}
      >
        No edition published for this date.
      </p>
      <p className="text-sm text-[var(--text-muted)] mt-2" style={{ fontFamily: 'var(--font-body)' }}>
        Content can be pushed via the API for today or future dates.
      </p>
    </div>
  )
}

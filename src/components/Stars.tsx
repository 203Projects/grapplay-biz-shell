// 별점 표시 (읽기) + 별점 입력 (클릭)

export function Stars({ n, className = '' }: { n: number; className?: string }) {
  const full = Math.round(n)
  return (
    <span className={`text-amber-400 ${className}`}>
      {'★'.repeat(full)}
      <span className="text-slate-300">{'★'.repeat(Math.max(0, 5 - full))}</span>
    </span>
  )
}

export function StarInput({
  value,
  onChange,
}: {
  value: number
  onChange: (n: number) => void
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="text-2xl leading-none transition hover:scale-110"
          aria-label={`${n}점`}
        >
          <span className={n <= value ? 'text-amber-400' : 'text-slate-300'}>★</span>
        </button>
      ))}
    </div>
  )
}

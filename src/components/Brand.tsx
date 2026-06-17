// Wordmark da marca. `size` controla a escala do texto.
export function Brand({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const text =
    size === 'lg' ? 'text-4xl' : size === 'sm' ? 'text-xl' : 'text-2xl'
  const dot =
    size === 'lg' ? 'w-3 h-3' : size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'

  return (
    <div className={`flex items-center gap-2 font-display font-extrabold ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-glow">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none">
          <path
            d="M9 18l6-6-6-6"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className={`tracking-tight text-white ${text}`}>
        Quizz
        <span className={`ml-0.5 inline-block rounded-full bg-lime-300 ${dot}`} />
      </span>
    </div>
  )
}

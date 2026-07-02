import Image from 'next/image'

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
  const logoBox =
    size === 'lg' ? 'h-11 w-11' : size === 'sm' ? 'h-7 w-7' : 'h-9 w-9'
  const logoPx = size === 'lg' ? 44 : size === 'sm' ? 28 : 36
  const dot =
    size === 'lg' ? 'w-3 h-3' : size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'

  return (
    <div className={`flex items-center gap-2 font-display font-extrabold ${className}`}>
      <span className={`flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 p-1 shadow-glow ${logoBox}`}>
        <Image
          src="/terrena.avif"
          alt="Terrena"
          width={logoPx}
          height={logoPx}
          className="h-full w-full object-contain"
          priority
        />
      </span>
      <span className={`tracking-tight text-white ${text}`}>
        Quizz
        <span className={`ml-0.5 inline-block rounded-full bg-brand-400 ${dot}`} />
      </span>
    </div>
  )
}

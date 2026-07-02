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
  // Caixa arredondada com a mesma proporção da logo (167x32), esticando a
  // largura para a logo preencher toda a altura sem cortar nem sobrar.
  const logoBox = size === 'lg' ? 'h-11' : size === 'sm' ? 'h-7' : 'h-9'
  const dot =
    size === 'lg' ? 'w-3 h-3' : size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'

  return (
    <div className={`flex items-center gap-2 font-display font-extrabold ${className}`}>
      <span className={`flex shrink-0 items-center justify-center aspect-[167/32] rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-glow ${logoBox}`}>
        <Image
          src="/terrena.avif"
          alt="Terrena"
          width={167}
          height={32}
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

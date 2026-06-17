// Fonte única de verdade para as 4 alternativas: cor + forma (estilo Kahoot).
// index 0 = triângulo vermelho, 1 = losango azul, 2 = círculo dourado, 3 = quadrado verde.

export const ANSWER_COLORS = [
  { bg: 'bg-answer-red', hex: '#e21b3c' },
  { bg: 'bg-answer-blue', hex: '#1368ce' },
  { bg: 'bg-answer-yellow', hex: '#d89e00' },
  { bg: 'bg-answer-green', hex: '#26890c' },
] as const

export function answerColor(index: number) {
  // Normaliza índices negativos/fora do intervalo para nunca retornar undefined.
  const n = ANSWER_COLORS.length
  return ANSWER_COLORS[(((index % n) + n) % n)]
}

export function AnswerShape({
  index,
  className = 'w-6 h-6',
}: {
  index: number
  className?: string
}) {
  const fill = 'white'
  switch (((index % 4) + 4) % 4) {
    case 0: // triângulo
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path d="M12 3 L22 21 H2 Z" fill={fill} />
        </svg>
      )
    case 1: // losango
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path d="M12 2 L22 12 L12 22 L2 12 Z" fill={fill} />
        </svg>
      )
    case 2: // círculo
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <circle cx="12" cy="12" r="10" fill={fill} />
        </svg>
      )
    default: // quadrado
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <rect x="3" y="3" width="18" height="18" rx="3" fill={fill} />
        </svg>
      )
  }
}

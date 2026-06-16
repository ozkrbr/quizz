import { Participant } from '@/types/types'
import { fetchMyParticipant, getUserId, joinGame } from '@/lib/api'
import { Brand } from '@/components/Brand'
import { FormEvent, useEffect, useState } from 'react'

export default function Lobby({
  gameId,
  onRegisterCompleted,
}: {
  gameId: string
  onRegisterCompleted: (participant: Participant) => void
}) {
  const [participant, setParticipant] = useState<Participant | null>(null)

  useEffect(() => {
    const fetchParticipant = async () => {
      try {
        const participantData = await fetchMyParticipant(gameId, getUserId())
        if (participantData) {
          setParticipant(participantData)
          onRegisterCompleted(participantData)
        }
      } catch (e: any) {
        alert(e.message)
      }
    }

    fetchParticipant()
  }, [gameId, onRegisterCompleted])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-10">
      <div className="mb-8 animate-fade-up">
        <Brand size="lg" />
      </div>

      <div className="w-full max-w-md animate-pop-in">
        {!participant && (
          <Register
            gameId={gameId}
            onRegisterCompleted={(participant) => {
              onRegisterCompleted(participant)
              setParticipant(participant)
            }}
          />
        )}

        {participant && <Waiting nickname={participant.nickname} />}
      </div>
    </div>
  )
}

function Register({
  onRegisterCompleted,
  gameId,
}: {
  onRegisterCompleted: (player: Participant) => void
  gameId: string
}) {
  const [nickname, setNickname] = useState('')
  const [sending, setSending] = useState(false)

  const onFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!nickname.trim()) return
    setSending(true)

    try {
      const participant = await joinGame(gameId, nickname.trim(), getUserId())
      onRegisterCompleted(participant)
    } catch (e: any) {
      setSending(false)
      return alert(e.message)
    }
  }

  return (
    <div className="glass rounded-3xl p-7 shadow-glow">
      <h1 className="text-center font-display text-2xl font-extrabold text-white">
        Entrar no jogo
      </h1>
      <p className="mt-1 text-center text-sm text-white/60">
        Escolha um apelido para aparecer no placar
      </p>

      <form onSubmit={onFormSubmit} className="mt-6 space-y-4">
        <input
          className="w-full rounded-2xl border border-white/15 bg-white/95 px-5 py-4 text-center font-display text-xl font-bold text-slate-900 outline-none transition focus:ring-4 focus:ring-brand-500/50"
          type="text"
          autoFocus
          value={nickname}
          onChange={(val) => setNickname(val.currentTarget.value)}
          placeholder="Seu apelido"
          maxLength={20}
        />
        <button disabled={sending} className="btn-brand w-full text-lg">
          {sending ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}

function Waiting({ nickname }: { nickname: string }) {
  return (
    <div className="glass rounded-3xl p-8 text-center shadow-glow">
      <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-brand-500/40 animate-pulse-ring" />
        <span className="absolute inset-0 rounded-full bg-brand-500/40 animate-pulse-ring animation-delay-500" />
        <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-3xl font-extrabold text-white shadow-glow">
          {nickname.charAt(0).toUpperCase()}
        </span>
      </div>

      <h1 className="font-display text-2xl font-extrabold text-white">
        Tudo certo, {nickname}!
      </h1>
      <p className="mx-auto mt-2 max-w-xs text-sm text-white/60">
        Seu apelido já apareceu na tela do apresentador. Aguarde o início do
        jogo.
      </p>

      <div className="mt-6 flex items-center justify-center gap-1.5">
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-white/70" />
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-white/70 animation-delay-150" />
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-white/70 animation-delay-300" />
      </div>
    </div>
  )
}

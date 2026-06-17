'use client'

import { Participant } from '@/types/types'
import { kickParticipant, updateGame } from '@/lib/api'
import { Brand } from '@/components/Brand'
import { useQRCode } from 'next-qrcode'
import { useEffect, useState } from 'react'

const CHIP_COLORS = [
  'from-emerald-400 to-brand-700',
  'from-teal-400 to-cyan-700',
  'from-lime-400 to-emerald-700',
  'from-amber-400 to-orange-600',
  'from-sky-500 to-teal-600',
]

export default function Lobby({
  participants: participants,
  gameId,
}: {
  participants: Participant[]
  gameId: string
}) {
  const { Canvas } = useQRCode()

  // Definido só no cliente para evitar mismatch de hidratação (SSR não tem window).
  const [origin, setOrigin] = useState('')
  useEffect(() => setOrigin(window.location.origin), [])
  const joinUrl = `${origin}/game/${gameId}`

  const onClickStartGame = async () => {
    try {
      await updateGame(gameId, { phase: 'quiz' })
    } catch (e: any) {
      return alert(e.message)
    }
  }

  const onKick = async (id: string) => {
    try {
      await kickParticipant(id)
    } catch (e: any) {
      alert(e.message)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-5">
        <Brand />
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 font-display font-bold text-white">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
          {participants.length}{' '}
          <span className="font-normal text-white/60">
            {participants.length === 1 ? 'jogador' : 'jogadores'}
          </span>
        </div>
      </header>

      <div className="flex flex-grow flex-col gap-6 px-6 pb-6 lg:flex-row">
        {/* Painel de entrada */}
        <div className="glass flex flex-col items-center justify-center gap-5 rounded-3xl p-7 text-center shadow-glow lg:w-96 lg:shrink-0">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-300">
              Para entrar
            </p>
            <h2 className="mt-1 font-display text-2xl font-extrabold text-white">
              Aponte a câmera
            </h2>
          </div>
          <div className="flex h-[264px] w-[264px] items-center justify-center overflow-hidden rounded-2xl bg-white p-3 shadow-glow">
            {origin ? (
              <Canvas
                text={joinUrl}
                options={{
                  errorCorrectionLevel: 'M',
                  margin: 2,
                  scale: 4,
                  width: 240,
                }}
              />
            ) : (
              <div className="h-[240px] w-[240px] animate-pulse rounded-xl bg-slate-200" />
            )}
          </div>
          <div className="w-full">
            <p className="text-xs text-white/50">ou acesse</p>
            <p className="mt-1 break-all rounded-xl bg-black/30 px-3 py-2 font-mono text-xs text-white/80">
              {origin}/game/…
            </p>
          </div>
        </div>

        {/* Jogadores */}
        <div className="glass flex flex-grow flex-col rounded-3xl p-7">
          <h1 className="font-display text-3xl font-extrabold text-white">
            Sala de espera
          </h1>
          <p className="mt-1 text-white/60">
            Os jogadores aparecem aqui assim que entram.
          </p>

          <div className="mt-6 flex flex-grow content-start flex-wrap gap-3">
            {participants.length === 0 && (
              <div className="flex w-full flex-grow flex-col items-center justify-center gap-3 text-white/40">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 animate-bounce rounded-full bg-white/40" />
                  <span className="h-3 w-3 animate-bounce rounded-full bg-white/40 animation-delay-150" />
                  <span className="h-3 w-3 animate-bounce rounded-full bg-white/40 animation-delay-300" />
                </div>
                <p>Aguardando jogadores…</p>
              </div>
            )}
            {participants.map((participant, i) => (
              <div
                key={participant.id}
                className={`group flex animate-pop-in items-center gap-2 rounded-full bg-gradient-to-br ${
                  CHIP_COLORS[i % CHIP_COLORS.length]
                } py-2 pl-2 pr-2 font-display font-bold text-white shadow-answer`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/25 text-sm">
                  {participant.nickname.charAt(0).toUpperCase()}
                </span>
                <span className="pr-1">{participant.nickname}</span>
                <button
                  onClick={() => onKick(participant.id)}
                  title={`Remover ${participant.nickname}`}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-black/20 text-white/70 transition hover:bg-black/40 hover:text-white"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-3.5 w-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <button
            className="btn-brand mt-6 w-full text-lg disabled:opacity-40"
            onClick={onClickStartGame}
            disabled={participants.length === 0}
          >
            Iniciar jogo
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

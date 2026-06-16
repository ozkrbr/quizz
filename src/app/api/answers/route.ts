import { NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { publish } from '@/lib/realtime'

export const dynamic = 'force-dynamic'

// Registra a resposta de um participante e publica para o host (que conta as
// respostas em tempo real). Equivale a:
// supabase.from('answers').insert({...})  + realtime INSERT em answers
export async function POST(req: Request) {
  const { game_id, participant_id, question_id, choice_id, score } =
    (await req.json()) ?? {}

  if (!game_id || !participant_id || !question_id || score == null) {
    return NextResponse.json(
      { error: 'game_id, participant_id, question_id e score são obrigatórios' },
      { status: 400 }
    )
  }

  let answer
  try {
    answer = await queryOne(
      `insert into answers (participant_id, question_id, choice_id, score)
       values ($1, $2, $3, $4)
       returning *`,
      [participant_id, question_id, choice_id ?? null, score]
    )
  } catch (e: any) {
    // unique (participant_id, question_id) -> já respondeu esta pergunta
    if (e?.code === '23505') {
      return NextResponse.json(
        { error: 'Você já respondeu esta pergunta' },
        { status: 409 }
      )
    }
    throw e
  }

  publish(game_id, { type: 'answer', payload: answer })
  return NextResponse.json(answer, { status: 201 })
}

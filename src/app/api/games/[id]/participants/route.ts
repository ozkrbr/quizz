import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { publish } from '@/lib/realtime'

export const dynamic = 'force-dynamic'

// Lista os participantes da partida (ordenados por entrada). Se o query param
// `userId` for informado, devolve apenas o participante daquele usuário (ou
// null) — usado pelo lobby do jogador para saber se já está inscrito.
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const userId = new URL(req.url).searchParams.get('userId')

  if (userId) {
    const participant = await queryOne(
      `select * from participants where game_id = $1 and user_id = $2`,
      [params.id, userId]
    )
    return NextResponse.json(participant)
  }

  const participants = await query(
    `select * from participants where game_id = $1 order by created_at`,
    [params.id]
  )
  return NextResponse.json(participants)
}

// Registra um novo participante e o publica para o host. Equivale a:
// supabase.from('participants').insert({ nickname, game_id, user_id })  + realtime INSERT
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { nickname, user_id } = (await req.json()) ?? {}

  if (!nickname || !user_id) {
    return NextResponse.json(
      { error: 'nickname e user_id são obrigatórios' },
      { status: 400 }
    )
  }

  let participant
  try {
    participant = await queryOne(
      `insert into participants (nickname, game_id, user_id)
       values ($1, $2, $3)
       returning *`,
      [nickname, params.id, user_id]
    )
  } catch (e: any) {
    // unique (game_id, user_id) violado -> já registrado
    if (e?.code === '23505') {
      participant = await queryOne(
        `select * from participants where game_id = $1 and user_id = $2`,
        [params.id, user_id]
      )
      return NextResponse.json(participant)
    }
    throw e
  }

  publish(params.id, { type: 'participant', payload: participant })
  return NextResponse.json(participant, { status: 201 })
}

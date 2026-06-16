import { NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Cria uma nova partida. Equivale a:
// supabase.from('games').insert({ quiz_set_id }).select().single()
export async function POST(req: Request) {
  const body = await req.json()
  const { quiz_set_id, host_user_id } = body ?? {}

  if (!quiz_set_id) {
    return NextResponse.json({ error: 'quiz_set_id é obrigatório' }, { status: 400 })
  }

  const game = await queryOne(
    `insert into games (quiz_set_id, host_user_id)
     values ($1, $2)
     returning *`,
    [quiz_set_id, host_user_id ?? null]
  )

  return NextResponse.json(game, { status: 201 })
}

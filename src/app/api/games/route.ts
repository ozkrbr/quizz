import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Lista as partidas (mais recentes primeiro) com nome do quiz, nº de jogadores
// e o placar do vencedor — usado em "Partidas anteriores".
export async function GET() {
  const games = await query(
    `select g.id,
            g.created_at,
            g.phase,
            g.quiz_set_id,
            qs.name as quiz_name,
            (select count(*) from participants p where p.game_id = g.id) as participant_count,
            (select gr.nickname
               from game_results gr
              where gr.game_id = g.id
              order by gr.total_score desc
              limit 1) as winner_nickname
       from games g
       join quiz_sets qs on qs.id = g.quiz_set_id
      order by g.created_at desc`
  )
  return NextResponse.json(games)
}

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

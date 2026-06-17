import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { publish } from '@/lib/realtime'

export const dynamic = 'force-dynamic'

// Retorna uma partida pelo id. Equivale a:
// supabase.from('games').select().eq('id', id).single()
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const game = await queryOne(`select * from games where id = $1`, [params.id])
  if (!game) {
    return NextResponse.json({ error: 'Partida não encontrada' }, { status: 404 })
  }
  return NextResponse.json(game)
}

// Atualiza a partida (fase, pergunta atual, revelação) e publica o novo estado
// para os clientes inscritos. Equivale a:
// supabase.from('games').update({...}).eq('id', id)  +  realtime UPDATE
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json()

  // Apenas colunas permitidas, montadas dinamicamente.
  const allowed = [
    'phase',
    'current_question_sequence',
    'is_answer_revealed',
  ] as const

  const sets: string[] = []
  const values: any[] = []
  for (const key of allowed) {
    if (key in body) {
      values.push(body[key])
      sets.push(`${key} = $${values.length}`)
    }
  }

  if (sets.length === 0) {
    return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
  }

  values.push(params.id)
  const game = await queryOne(
    `update games set ${sets.join(', ')} where id = $${values.length} returning *`,
    values
  )

  if (!game) {
    return NextResponse.json({ error: 'Partida não encontrada' }, { status: 404 })
  }

  publish(params.id, { type: 'game', payload: game })
  return NextResponse.json(game)
}

// Exclui uma partida (participantes e respostas caem em cascata pela FK).
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const rows = await query(`delete from games where id = $1 returning id`, [
    params.id,
  ])
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Partida não encontrada' }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}

import { NextResponse } from 'next/server'
import { queryOne, withTransaction } from '@/lib/db'
import { getQuizSet, insertQuestions, validateQuizInput } from '@/lib/quizzes'

export const dynamic = 'force-dynamic'

// Busca um quiz set (com perguntas/alternativas) — usado pelo editor.
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const quizSet = await getQuizSet(params.id)
  if (!quizSet) {
    return NextResponse.json({ error: 'Quiz não encontrado' }, { status: 404 })
  }
  return NextResponse.json(quizSet)
}

// Atualiza um quiz set. As perguntas/alternativas são substituídas por
// completo (mais simples e previsível que um diff). Atenção: isso remove as
// respostas de partidas anteriores que apontavam para as perguntas antigas.
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const input = await req.json()
  const error = validateQuizInput(input)
  if (error) return NextResponse.json({ error }, { status: 400 })

  const updated = await withTransaction(async (client) => {
    const { rows } = await client.query(
      `update quiz_sets set name = $1, description = $2 where id = $3 returning *`,
      [input.name.trim(), input.description?.trim() || null, params.id]
    )
    if (rows.length === 0) return null

    // Remove as perguntas antigas (choices caem em cascata) e recria.
    await client.query(`delete from questions where quiz_set_id = $1`, [
      params.id,
    ])
    await insertQuestions(client, params.id, input.questions)
    return rows[0]
  })

  if (!updated) {
    return NextResponse.json({ error: 'Quiz não encontrado' }, { status: 404 })
  }
  return NextResponse.json(updated)
}

// Remove um quiz set (perguntas, alternativas e jogos relacionados caem em
// cascata pela FK).
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const deleted = await queryOne(
    `delete from quiz_sets where id = $1 returning id`,
    [params.id]
  )
  if (!deleted) {
    return NextResponse.json({ error: 'Quiz não encontrado' }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}

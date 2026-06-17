import { NextResponse } from 'next/server'
import { withTransaction } from '@/lib/db'
import {
  answerTimeOf,
  autoAdvanceOf,
  insertQuestions,
  listQuizSets,
  validateQuizInput,
} from '@/lib/quizzes'

export const dynamic = 'force-dynamic'

// Lista todos os quiz sets com perguntas e alternativas aninhadas.
export async function GET() {
  return NextResponse.json(await listQuizSets())
}

// Cria um quiz set completo (nome + perguntas + alternativas).
export async function POST(req: Request) {
  const input = await req.json()
  const error = validateQuizInput(input)
  if (error) return NextResponse.json({ error }, { status: 400 })

  const created = await withTransaction(async (client) => {
    const { rows } = await client.query(
      `insert into quiz_sets (name, description, answer_time, auto_advance)
       values ($1, $2, $3, $4) returning *`,
      [
        input.name.trim(),
        input.description?.trim() || null,
        answerTimeOf(input),
        autoAdvanceOf(input),
      ]
    )
    const quizSet = rows[0]
    await insertQuestions(client, quizSet.id, input.questions)
    return quizSet
  })

  return NextResponse.json(created, { status: 201 })
}

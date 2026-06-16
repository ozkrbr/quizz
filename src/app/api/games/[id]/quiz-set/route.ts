import { NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Retorna o quiz set da partida com perguntas e alternativas aninhadas,
// ordenadas por "order". Equivale a:
// supabase.from('quiz_sets').select('*, questions(*, choices(*))').eq('id', quizSetId)
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const quizSet = await queryOne(
    `select qs.*,
            coalesce(
              (
                select json_agg(q order by q."order")
                from (
                  select question.*,
                         coalesce(
                           (
                             select json_agg(c order by c.created_at)
                             from choices c
                             where c.question_id = question.id
                           ),
                           '[]'::json
                         ) as choices
                  from questions question
                  where question.quiz_set_id = qs.id
                ) q
              ),
              '[]'::json
            ) as questions
     from quiz_sets qs
     where qs.id = (select quiz_set_id from games where id = $1)`,
    [params.id]
  )

  if (!quizSet) {
    return NextResponse.json({ error: 'Quiz set não encontrado' }, { status: 404 })
  }
  return NextResponse.json(quizSet)
}

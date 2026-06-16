import 'server-only'
import { PoolClient } from 'pg'
import { query, queryOne } from './db'

// Tipos de entrada para criar/editar um quiz (vindos do editor no cliente).
export type ChoiceInput = { body: string; is_correct: boolean }
export type QuestionInput = {
  body: string
  image_url?: string | null
  choices: ChoiceInput[]
}
export type QuizSetInput = {
  name: string
  description?: string | null
  questions: QuestionInput[]
}

// Fragmento SQL que agrega perguntas + alternativas aninhadas, ordenadas.
// Reutilizado para listar e para buscar um quiz. `qs` é o alias de quiz_sets.
export const QUESTIONS_AGGREGATE = `
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
  ) as questions`

/** Lista todos os quiz sets com perguntas/alternativas aninhadas. */
export async function listQuizSets() {
  return query(
    `select qs.*, ${QUESTIONS_AGGREGATE}
     from quiz_sets qs
     order by qs.created_at desc`
  )
}

/** Busca um quiz set pelo id, com perguntas/alternativas aninhadas. */
export async function getQuizSet(id: string) {
  return queryOne(
    `select qs.*, ${QUESTIONS_AGGREGATE}
     from quiz_sets qs
     where qs.id = $1`,
    [id]
  )
}

/** Valida a entrada do editor. Retorna mensagem de erro ou null se ok. */
export function validateQuizInput(input: any): string | null {
  if (!input || typeof input !== 'object') return 'Dados inválidos'
  if (!input.name || !String(input.name).trim()) return 'O nome é obrigatório'
  if (!Array.isArray(input.questions) || input.questions.length === 0)
    return 'Adicione pelo menos uma pergunta'

  for (const [i, q] of input.questions.entries()) {
    if (!q.body || !String(q.body).trim())
      return `A pergunta ${i + 1} está sem enunciado`
    const choices = Array.isArray(q.choices) ? q.choices : []
    const filled = choices.filter((c: any) => c.body && String(c.body).trim())
    if (filled.length < 2)
      return `A pergunta ${i + 1} precisa de pelo menos 2 alternativas`
    if (!filled.some((c: any) => c.is_correct))
      return `Marque a alternativa correta da pergunta ${i + 1}`
  }
  return null
}

/** Insere as perguntas e alternativas de um quiz (dentro de uma transação).
 *  A ordem das perguntas segue a ordem do array. Alternativas vazias são
 *  ignoradas. */
export async function insertQuestions(
  client: PoolClient,
  quizSetId: string,
  questions: QuestionInput[]
) {
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    const { rows } = await client.query(
      `insert into questions (body, "order", quiz_set_id, image_url)
       values ($1, $2, $3, $4) returning id`,
      [q.body.trim(), i, quizSetId, q.image_url?.trim() || null]
    )
    const questionId = rows[0].id

    const choices = q.choices.filter((c) => c.body && c.body.trim())
    for (const c of choices) {
      await client.query(
        `insert into choices (question_id, body, is_correct)
         values ($1, $2, $3)`,
        [questionId, c.body.trim(), !!c.is_correct]
      )
    }
  }
}

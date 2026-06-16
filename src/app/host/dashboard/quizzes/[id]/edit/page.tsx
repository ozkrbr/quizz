import QuizEditor from '@/components/QuizEditor'
import { getQuizSet } from '@/lib/quizzes'
import { QuizSet } from '@/types/types'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function EditQuizPage({
  params,
}: {
  params: { id: string }
}) {
  const quiz = await getQuizSet(params.id)
  if (!quiz) notFound()
  return <QuizEditor initial={quiz as QuizSet} />
}

import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Placar final da partida. Equivale a:
// supabase.from('game_results').select().eq('game_id', id).order('total_score', desc)
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const results = await query(
    `select participant_id, nickname, total_score, game_id
     from game_results
     where game_id = $1
     order by total_score desc`,
    [params.id]
  )
  return NextResponse.json(results)
}

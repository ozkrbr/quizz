import { NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { publish } from '@/lib/realtime'

export const dynamic = 'force-dynamic'

// Remove (expulsa) um participante e avisa a partida — o host tira da lista e o
// próprio jogador recebe a tela de "removido".
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const deleted = await queryOne<{ id: string; game_id: string }>(
    `delete from participants where id = $1 returning id, game_id`,
    [params.id]
  )
  if (!deleted) {
    return NextResponse.json(
      { error: 'Participante não encontrado' },
      { status: 404 }
    )
  }

  publish(deleted.game_id, {
    type: 'kick',
    payload: { participantId: deleted.id },
  })
  return NextResponse.json({ ok: true })
}

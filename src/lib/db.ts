import 'server-only'
import { Pool, PoolClient } from 'pg'

// Pool único reutilizado entre requisições (evita esgotar conexões no dev,
// onde os módulos podem ser recarregados a cada hot-reload).
const globalForPg = globalThis as unknown as { pgPool?: Pool }

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  })

if (process.env.NODE_ENV !== 'production') globalForPg.pgPool = pool

/** Executa uma query e devolve as linhas tipadas. */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const res = await pool.query(text, params)
  return res.rows as T[]
}

/** Executa uma query esperando no máximo uma linha (ou null). */
export async function queryOne<T = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows[0] ?? null
}

/** Executa `fn` dentro de uma transação (BEGIN/COMMIT, ROLLBACK em erro). */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

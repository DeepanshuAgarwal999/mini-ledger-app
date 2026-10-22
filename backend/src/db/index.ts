import pg from 'pg';

// Return DATE columns as plain 'YYYY-MM-DD' strings instead of local-midnight Date objects.
pg.types.setTypeParser(pg.types.builtins.DATE, (value) => value);

/** The minimal surface the app needs; satisfied by pg.Pool and by pg-mem in tests. */
export interface Db {
  query<R extends pg.QueryResultRow = any>(text: string, params?: unknown[]): Promise<pg.QueryResult<R>>;
}

export function createPool(connectionString: string): pg.Pool {
  return new pg.Pool({ connectionString });
}

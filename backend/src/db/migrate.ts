import { loadConfig } from '../config.js';
import { createPool } from './index.js';
import { migrate } from './schema.js';

const pool = createPool(loadConfig().databaseUrl);
try {
  await migrate(pool);
  console.log('Database schema is up to date.');
} finally {
  await pool.end();
}

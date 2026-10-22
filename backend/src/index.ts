import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { createPool } from './db/index.js';
import { migrate } from './db/schema.js';

const config = loadConfig();
const pool = createPool(config.databaseUrl);
await migrate(pool);

const app = createApp({ db: pool, config });
const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`MiniLedger API listening on http://localhost:${config.port}`);
});

const shutdown = () => server.close(() => void pool.end());
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

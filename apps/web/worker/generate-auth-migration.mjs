import { DatabaseSync } from 'node:sqlite';
import { writeFile } from 'node:fs/promises';
import { getMigrations } from 'better-auth/db/migration';

const database = new DatabaseSync(':memory:');
const migration = await getMigrations({ database,
  user: { additionalFields: { displayName: { type: 'string', required: false, defaultValue: '' } } },
  rateLimit: { enabled: true, storage: 'database' }
});
await writeFile(new URL('../migrations/0001_auth.sql', import.meta.url), await migration.compileMigrations());
database.close();

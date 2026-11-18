import { readFile, writeFile } from 'node:fs/promises';
const auth = await readFile(new URL('../migrations/0001_auth.sql', import.meta.url), 'utf8');
const inbox = await readFile(new URL('../migrations/0002_inbox.sql', import.meta.url), 'utf8');
const schema = (auth + '\n' + inbox).replace(/create table /gi, 'CREATE TABLE IF NOT EXISTS ').replace(/create index /gi, 'CREATE INDEX IF NOT EXISTS ');
await writeFile(new URL('./dashboard-bootstrap.sql', import.meta.url), `-- Initial setup for a NEW, empty Cloudflare inbox database only.
-- No test users or passwords are included. Stop and inspect any console error.
${schema}
CREATE TABLE IF NOT EXISTS d1_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL);
INSERT OR IGNORE INTO d1_migrations (name) VALUES ('0001_auth.sql');
INSERT OR IGNORE INTO d1_migrations (name) VALUES ('0002_inbox.sql');
`);

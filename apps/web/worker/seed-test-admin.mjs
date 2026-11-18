import { hashPassword } from 'better-auth/crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Deliberately local-only. This file never belongs in a remote migration or bootstrap.
const project = fileURLToPath(new URL('../', import.meta.url));
await mkdir(new URL('../.wrangler/', import.meta.url), { recursive: true });
const password = await hashPassword('Local-test-only-42!');
const timestamp = Date.now();
const sqlFile = fileURLToPath(new URL('../.wrangler/test-admin.sql', import.meta.url));
await writeFile(sqlFile, `
INSERT OR IGNORE INTO user (id,name,email,emailVerified,createdAt,updatedAt,displayName)
VALUES ('local-inbox-test-admin','Test moderator','moderator@woodstop.test',1,${timestamp},${timestamp},'Test moderator');
INSERT OR IGNORE INTO account (id,accountId,providerId,userId,password,createdAt,updatedAt)
VALUES ('local-inbox-test-account','local-inbox-test-admin','credential','local-inbox-test-admin','${password}',${timestamp},${timestamp});
`);
execFileSync(process.execPath, [fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url)),
  'd1', 'execute', 'woodstop-inbox', '--local', '--config', 'wrangler.local.jsonc', '--file', sqlFile], { cwd: project, stdio: 'inherit' });

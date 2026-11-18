-- Initial setup for a NEW, empty Cloudflare inbox database only.
-- No test users or passwords are included. Stop and inspect any console error.
CREATE TABLE IF NOT EXISTS "user" ("id" text not null primary key, "name" text not null, "email" text not null unique, "emailVerified" integer not null, "image" text, "createdAt" date not null, "updatedAt" date not null, "displayName" text);

CREATE TABLE IF NOT EXISTS "session" ("id" text not null primary key, "expiresAt" date not null, "token" text not null unique, "createdAt" date not null, "updatedAt" date not null, "ipAddress" text, "userAgent" text, "userId" text not null references "user" ("id") on delete cascade);

CREATE TABLE IF NOT EXISTS "account" ("id" text not null primary key, "accountId" text not null, "providerId" text not null, "userId" text not null references "user" ("id") on delete cascade, "accessToken" text, "refreshToken" text, "idToken" text, "accessTokenExpiresAt" date, "refreshTokenExpiresAt" date, "scope" text, "password" text, "createdAt" date not null, "updatedAt" date not null);

CREATE TABLE IF NOT EXISTS "verification" ("id" text not null primary key, "identifier" text not null, "value" text not null, "expiresAt" date not null, "createdAt" date not null, "updatedAt" date not null);

CREATE TABLE IF NOT EXISTS "rateLimit" ("id" text not null primary key, "key" text not null unique, "count" integer not null, "lastRequest" bigint not null);

CREATE INDEX IF NOT EXISTS "session_userId_idx" on "session" ("userId");

CREATE INDEX IF NOT EXISTS "account_userId_idx" on "account" ("userId");

CREATE INDEX IF NOT EXISTS "verification_identifier_idx" on "verification" ("identifier");
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id),
  content_json TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
  rejection_reason TEXT,
  approved_slug TEXT UNIQUE,
  revision INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_id TEXT REFERENCES submissions(id)
);
CREATE INDEX IF NOT EXISTS submissions_owner ON submissions(user_id, created_at);
CREATE INDEX IF NOT EXISTS submissions_queue ON submissions(status, created_at);
CREATE TABLE IF NOT EXISTS submission_photos (
  id TEXT NOT NULL,
  submission_id TEXT NOT NULL REFERENCES submissions(id),
  content_type TEXT NOT NULL,
  bytes BLOB NOT NULL,
  PRIMARY KEY (submission_id, id)
);
CREATE INDEX IF NOT EXISTS submission_photos_owner ON submission_photos(submission_id);
CREATE TABLE IF NOT EXISTS moderation_actions (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id),
  admin_id TEXT NOT NULL REFERENCES user(id),
  action TEXT NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL
);
-- This is only populated when both the local-only switch and localhost URL are present.
CREATE TABLE IF NOT EXISTS dev_mail (email TEXT PRIMARY KEY, url TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS d1_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL);
INSERT OR IGNORE INTO d1_migrations (name) VALUES ('0001_auth.sql');
INSERT OR IGNORE INTO d1_migrations (name) VALUES ('0002_inbox.sql');

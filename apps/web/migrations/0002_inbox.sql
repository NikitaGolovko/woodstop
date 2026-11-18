CREATE TABLE submissions (
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
CREATE INDEX submissions_owner ON submissions(user_id, created_at);
CREATE INDEX submissions_queue ON submissions(status, created_at);
CREATE TABLE submission_photos (
  id TEXT NOT NULL,
  submission_id TEXT NOT NULL REFERENCES submissions(id),
  content_type TEXT NOT NULL,
  bytes BLOB NOT NULL,
  PRIMARY KEY (submission_id, id)
);
CREATE INDEX submission_photos_owner ON submission_photos(submission_id);
CREATE TABLE moderation_actions (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id),
  admin_id TEXT NOT NULL REFERENCES user(id),
  action TEXT NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL
);
-- This is only populated when both the local-only switch and localhost URL are present.
CREATE TABLE dev_mail (email TEXT PRIMARY KEY, url TEXT NOT NULL);

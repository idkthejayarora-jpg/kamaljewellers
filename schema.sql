-- Site content lives here rather than in KV.
--
-- KV is eventually consistent and its reads carry a 60-second minimum edge
-- cache, so a Studio save could take up to a minute to show on the live site —
-- which is exactly the "saving is slow / not tied together" problem. D1 is
-- strongly consistent, so a save is visible on the very next request.
CREATE TABLE IF NOT EXISTS site_content (
  id         TEXT PRIMARY KEY,       -- always 'main'; one row
  json       TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Analytics events for the Studio → Stats panel.
--
-- Deliberately holds nothing that identifies a person: no IP, no name, no
-- precise location. `session` is a random id kept in sessionStorage that dies
-- when the tab closes — enough to tell one visit from two, useless for
-- tracking anyone across sites. Location is the city Cloudflare already
-- attaches to the request, so there's no permission prompt and no lat/long.
--
-- Apply with:
--   npx wrangler d1 execute <DB_NAME> --remote --file=schema.sql

CREATE TABLE IF NOT EXISTS events (
  id         TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,          -- ISO timestamp
  type       TEXT NOT NULL,          -- 'view' | 'tap'
  label      TEXT,                   -- collection id, link label, button name
  path       TEXT,                   -- page the event happened on
  session    TEXT,                   -- anonymous per-tab id
  city       TEXT,
  region     TEXT,
  country    TEXT,
  device     TEXT                    -- 'mobile' | 'desktop'
);

CREATE INDEX IF NOT EXISTS idx_events_created ON events (created_at);
CREATE INDEX IF NOT EXISTS idx_events_type    ON events (type, label);
CREATE INDEX IF NOT EXISTS idx_events_session ON events (session);

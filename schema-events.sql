-- Analytics events for the Studio → Stats panel.
--
-- Deliberately holds nothing that identifies a person: no IP, no name, no
-- precise location. `session` is a random id kept in sessionStorage that dies
-- when the tab closes — enough to tell one visit from two, useless for
-- tracking anyone across sites. Location is the city Cloudflare already
-- attaches to the request, so there's no permission prompt and no lat/long.
--
-- Apply with:
--   npx wrangler d1 execute <DB_NAME> --remote --file=schema-events.sql

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

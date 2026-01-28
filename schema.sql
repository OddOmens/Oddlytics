-- Events table: stores all analytics events
CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_name TEXT NOT NULL,
  app_id TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  platform TEXT DEFAULT 'iOS',
  metadata TEXT,  -- JSON string for flexible event data
  session_id TEXT, -- Random UUID per app launch
  user_id TEXT     -- Persistent anonymous UUID
);

-- Indexes for fast queries
CREATE INDEX idx_timestamp ON events(timestamp);
CREATE INDEX idx_app_id ON events(app_id);
CREATE INDEX idx_event_name ON events(event_name);

-- View: Event counts by app
CREATE VIEW event_counts_by_app AS
SELECT
  app_id,
  COUNT(*) as total_events,
  COUNT(DISTINCT session_id) as total_sessions,
  MIN(timestamp) as first_seen,
  MAX(timestamp) as last_seen
FROM events
GROUP BY app_id;

-- View: Top events across all apps
CREATE VIEW top_events AS
SELECT
  event_name,
  COUNT(*) as count,
  COUNT(DISTINCT app_id) as app_count
FROM events
GROUP BY event_name;

-- Event Aliases: Custom display names for events per app
CREATE TABLE event_aliases (
  app_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  alias TEXT NOT NULL,
  PRIMARY KEY (app_id, event_name)
);

-- App Settings: Custom configurations per app (like icons)
CREATE TABLE app_settings (
  app_id TEXT PRIMARY KEY,
  icon_url TEXT,
  display_name TEXT
);

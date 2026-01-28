import type { Env } from './types';

export async function getOverview(db: D1Database) {
  const totalEvents = await db.prepare(
    'SELECT COUNT(*) as count FROM events'
  ).first<{ count: number }>();

  const appsList = await db.prepare(
    'SELECT app_id, total_events, total_sessions, first_seen, last_seen FROM event_counts_by_app'
  ).all();

  const topEvents = await db.prepare(
    'SELECT event_name, count FROM top_events LIMIT 10'
  ).all();

  return {
    total_events: totalEvents?.count || 0,
    apps: appsList.results || [],
    top_events: topEvents.results || []
  };
}

export async function getEventStats(
  db: D1Database,
  appId?: string,
  startDate?: string,
  endDate?: string
) {
  let query = 'SELECT event_name, COUNT(*) as count FROM events';
  const conditions: string[] = [];
  const params: any[] = [];

  if (appId) {
    conditions.push('app_id = ?');
    params.push(appId);
  }

  if (startDate) {
    conditions.push('timestamp >= ?');
    params.push(startDate);
  }

  if (endDate) {
    conditions.push('timestamp <= ?');
    params.push(endDate);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' GROUP BY event_name ORDER BY count DESC';

  const stmt = db.prepare(query);
  const result = await stmt.bind(...params).all();

  return result.results || [];
}

export async function getTimeline(
  db: D1Database,
  appId?: string,
  days: number = 7
) {
  let query = `
    SELECT
      DATE(timestamp) as date,
      COUNT(*) as count
    FROM events
    WHERE timestamp >= datetime('now', '-${days} days')
  `;

  const params: any[] = [];

  if (appId) {
    query += ' AND app_id = ?';
    params.push(appId);
  }

  query += ' GROUP BY DATE(timestamp) ORDER BY date ASC';

  const stmt = db.prepare(query);
  const result = await stmt.bind(...params).all();

  return result.results || [];
}

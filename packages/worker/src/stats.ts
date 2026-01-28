import type { Env } from './types';

export async function getOverview(db: D1Database) {
  const totalEvents = await db.prepare(
    'SELECT COUNT(*) as count FROM events'
  ).first<{ count: number }>();

  const appsList = await db.prepare(
    'SELECT app_id, total_events, total_sessions, first_seen, last_seen FROM event_counts_by_app'
  ).all();

  const topEvents = await db.prepare(
    'SELECT event_name, count FROM top_events ORDER BY count DESC LIMIT 10'
  ).all();

  return {
    total_events: totalEvents?.count || 0,
    apps: appsList.results || [],
    top_events: topEvents.results || []
  };
}

const isValidDate = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) && dateStr.match(/^\d{4}-\d{2}-\d{2}/) !== null;
};

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
    if (!isValidDate(startDate)) {
      throw new Error('Invalid start_date format. Use YYYY-MM-DD');
    }
    conditions.push('timestamp >= ?');
    params.push(startDate);
  }

  if (endDate) {
    if (!isValidDate(endDate)) {
      throw new Error('Invalid end_date format. Use YYYY-MM-DD');
    }
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
  // Validate days parameter
  if (isNaN(days) || days < 1 || days > 365) {
    throw new Error('Invalid days parameter. Must be between 1 and 365');
  }

  // Use parameterized query for days to prevent SQL injection
  let query = `
    SELECT
      DATE(timestamp) as date,
      COUNT(*) as count
    FROM events
    WHERE timestamp >= datetime('now', '-' || ? || ' days')
  `;

  const params: any[] = [days.toString()];

  if (appId) {
    query += ' AND app_id = ?';
    params.push(appId);
  }

  query += ' GROUP BY DATE(timestamp) ORDER BY date ASC';

  const stmt = db.prepare(query);
  const result = await stmt.bind(...params).all();

  return result.results || [];
}

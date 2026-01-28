import type { Env } from './types';

export async function getOverview(db: D1Database) {
  const totalEvents = await db.prepare(
    'SELECT COUNT(*) as count FROM events'
  ).first<{ count: number }>();

  const totalUsers = await db.prepare(
    'SELECT COUNT(DISTINCT user_id) as count FROM events'
  ).first<{ count: number }>();

  const appsList = await db.prepare(
    'SELECT app_id, total_events, total_sessions, first_seen, last_seen FROM event_counts_by_app'
  ).all();

  const topEvents = await db.prepare(
    'SELECT event_name, count FROM top_events ORDER BY count DESC LIMIT 10'
  ).all();

  return {
    total_events: totalEvents?.count || 0,
    total_users: totalUsers?.count || 0,
    apps: appsList.results || [],
    top_events: topEvents.results || []
  };
}

const isValidDate = (dateStr: string): boolean => {
  // Check format first with strict regex (must match entire string)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  // Then validate it's a real date
  const date = new Date(dateStr + 'T00:00:00Z');
  return !isNaN(date.getTime());
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

  // Calculate cutoff date in JavaScript to avoid SQL injection
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffStr = cutoffDate.toISOString().split('T')[0]; // YYYY-MM-DD format

  let query = `
    SELECT
      DATE(timestamp) as date,
      COUNT(*) as count
    FROM events
    WHERE date(timestamp) >= ?
  `;

  const params: any[] = [cutoffStr];

  if (appId) {
    query += ' AND app_id = ?';
    params.push(appId);
  }

  query += ' GROUP BY DATE(timestamp) ORDER BY date ASC';

  const stmt = db.prepare(query);
  const result = await stmt.bind(...params).all();

  return result.results || [];
}

export async function getUsers(
  db: D1Database,
  limit: number = 50,
  offset: number = 0,
  search?: string
) {
  let query = `
    SELECT
      user_id,
      COUNT(*) as total_events,
      COUNT(DISTINCT session_id) as total_sessions,
      MIN(timestamp) as first_seen,
      MAX(timestamp) as last_seen,
      (SELECT app_id FROM events e2 WHERE e2.user_id = e1.user_id ORDER BY timestamp DESC LIMIT 1) as last_app
    FROM events e1
    WHERE user_id IS NOT NULL
  `;

  const params: any[] = [];

  if (search) {
    query += ' AND user_id LIKE ?';
    params.push(`%${search}%`);
  }

  query += ' GROUP BY user_id ORDER BY last_seen DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const stmt = db.prepare(query);
  const result = await stmt.bind(...params).all();

  // Get total count for pagination
  let countQuery = 'SELECT COUNT(DISTINCT user_id) as count FROM events WHERE user_id IS NOT NULL';
  const countParams: any[] = [];

  if (search) {
    countQuery += ' AND user_id LIKE ?';
    countParams.push(`%${search}%`);
  }

  const total = await db.prepare(countQuery).bind(...countParams).first<{ count: number }>();

  return {
    users: result.results || [],
    pagination: {
      total: total?.count || 0,
      limit,
      offset
    }
  };
}

export async function getUserDetails(db: D1Database, userId: string) {
  // Aggregate stats
  const stats = await db.prepare(`
    SELECT
      COUNT(*) as total_events,
      COUNT(DISTINCT session_id) as total_sessions,
      COUNT(DISTINCT app_id) as total_apps,
      MIN(timestamp) as first_seen,
      MAX(timestamp) as last_seen
    FROM events
    WHERE user_id = ?
  `).bind(userId).first();

  if (!stats) return null;

  // Apps used
  const apps = await db.prepare(`
    SELECT
      app_id,
      COUNT(*) as event_count,
      MAX(timestamp) as last_used
    FROM events
    WHERE user_id = ?
    GROUP BY app_id
    ORDER BY last_used DESC
  `).bind(userId).all();

  return {
    user_id: userId,
    stats: stats,
    apps: apps.results || []
  };
}

export async function getUserActivity(
  db: D1Database,
  userId: string,
  appId?: string,
  limit: number = 50
) {
  let query = `
    SELECT
      id,
      event_name,
      app_id,
      timestamp,
      platform,
      session_id,
      metadata
    FROM events
    WHERE user_id = ?
  `;

  const params: any[] = [userId];

  if (appId) {
    query += ' AND app_id = ?';
    params.push(appId);
  }

  query += ' ORDER BY timestamp DESC LIMIT ?';
  params.push(limit);

  const results = await db.prepare(query).bind(...params).all();

  // Parse metadata JSON
  const events = (results.results || []).map((e: any) => ({
    ...e,
    metadata: e.metadata ? JSON.parse(e.metadata) : null
  }));

  return events;
}

// ALIASES

export async function getAliases(db: D1Database, appId?: string) {
  let query = 'SELECT app_id, event_name, alias FROM event_aliases';
  const params: any[] = [];

  if (appId) {
    query += ' WHERE app_id = ?';
    params.push(appId);
  }

  const result = await db.prepare(query).bind(...params).all();
  return result.results || [];
}

export async function upsertAlias(db: D1Database, appId: string, eventName: string, alias: string) {
  await db.prepare(`
    INSERT INTO event_aliases (app_id, event_name, alias)
    VALUES (?, ?, ?)
    ON CONFLICT(app_id, event_name) DO UPDATE SET alias = excluded.alias
  `).bind(appId, eventName, alias).run();
}

export async function deleteAlias(db: D1Database, appId: string, eventName: string) {
  await db.prepare('DELETE FROM event_aliases WHERE app_id = ? AND event_name = ?')
    .bind(appId, eventName)
    .run();
}

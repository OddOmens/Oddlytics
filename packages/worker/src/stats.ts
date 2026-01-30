import type { Env } from './types';

export async function getOverview(db: D1Database, days: number = 0) {
  let whereClause = '';
  const params: any[] = [];

  let previousTotalEvents = 0;

  if (days > 0) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];
    whereClause = ' WHERE date(timestamp) >= ?';
    params.push(cutoffStr);

    // Calculate previous period
    const previousStartParams: any[] = [];
    const previousStartDate = new Date(cutoffDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);
    const previousStartStr = previousStartDate.toISOString().split('T')[0];

    // Previous period: [previousStart, cutoff)
    const prevWhereClause = ' WHERE date(timestamp) >= ? AND date(timestamp) < ?';
    previousStartParams.push(previousStartStr, cutoffStr);

    const prevResult = await db.prepare(
      `SELECT COUNT(*) as count FROM events${prevWhereClause}`
    ).bind(...previousStartParams).first<{ count: number }>();

    previousTotalEvents = prevResult?.count || 0;
  }

  const totalEvents = await db.prepare(
    `SELECT COUNT(*) as count FROM events${whereClause}`
  ).bind(...params).first<{ count: number }>();

  const totalUsers = await db.prepare(
    `SELECT COUNT(DISTINCT user_id) as count FROM events${whereClause}`
  ).bind(...params).first<{ count: number }>();

  let appsList: any;
  try {
    appsList = await db.prepare(`
      SELECT 
        a.app_id, 
        a.total_events, 
        a.total_sessions, 
        a.first_seen, 
        a.last_seen,
        s.icon_url,
        s.display_name
      FROM event_counts_by_app a
      LEFT JOIN app_settings s ON a.app_id = s.app_id
    `).all();
  } catch (error) {
    if (error instanceof Error && error.message.includes('no such table: app_settings')) {
      appsList = await db.prepare('SELECT app_id, total_events, total_sessions, first_seen, last_seen FROM event_counts_by_app').all();
    } else {
      throw error;
    }
  }

  const topEvents = await db.prepare(
    'SELECT event_name, count FROM top_events ORDER BY count DESC LIMIT 10'
  ).all();

  return {
    total_events: totalEvents?.count || 0,
    previous_total_events: previousTotalEvents,
    total_users: totalUsers?.count || 0,
    apps: appsList.results || [],
    top_events: topEvents.results || []
  };
}

export async function getAppSettings(db: D1Database, appId: string) {
  return db.prepare('SELECT * FROM app_settings WHERE app_id = ?').bind(appId).first();
}

export async function upsertAppSettings(db: D1Database, appId: string, settings: { icon_url?: string, display_name?: string }) {
  await db.prepare(`
    INSERT INTO app_settings (app_id, icon_url, display_name)
    VALUES (?, ?, ?)
    ON CONFLICT(app_id) DO UPDATE SET 
      icon_url = COALESCE(excluded.icon_url, app_settings.icon_url),
      display_name = COALESCE(excluded.display_name, app_settings.display_name)
  `).bind(appId, settings.icon_url || null, settings.display_name || null).run();
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
      COUNT(*) as count,
      COUNT(DISTINCT user_id) as user_count
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

export async function getAppStats(db: D1Database, appId: string) {
  const stats = await db.prepare(`
    SELECT
      COUNT(*) as total_events,
      COUNT(DISTINCT user_id) as total_users,
      COUNT(DISTINCT session_id) as total_sessions
    FROM events
    WHERE app_id = ?
  `).bind(appId).first();

  return stats;
}

export async function getUsers(
  db: D1Database,
  limit: number = 50,
  offset: number = 0,
  search?: string,
  appId?: string
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

  if (appId) {
    query += ' AND app_id = ?';
    params.push(appId);
  }

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

  if (appId) {
    countQuery += ' AND app_id = ?';
    countParams.push(appId);
  }

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

export async function getGroups(db: D1Database, appId: string) {
  // Query to get event counts grouped by metadata.group
  // aggregated by group name AND event name
  const query = `
    SELECT 
      json_extract(metadata, '$.group') as group_name,
      event_name,
      COUNT(*) as count
    FROM events
    WHERE app_id = ? 
      AND json_extract(metadata, '$.group') IS NOT NULL
      AND json_extract(metadata, '$.group') != ''
    GROUP BY group_name, event_name
    ORDER BY count DESC
  `;

  const result = await db.prepare(query).bind(appId).all();

  // Post-process to structure as Group[]
  const groupsMap = new Map<string, { name: string, count: number }[]>();

  (result.results || []).forEach((row: any) => {
    const groupName = row.group_name;
    if (!groupsMap.has(groupName)) {
      groupsMap.set(groupName, []);
    }
    groupsMap.get(groupName)?.push({
      name: row.event_name,
      count: row.count
    });
  });

  return Array.from(groupsMap.entries()).map(([name, events]) => ({
    name,
    events: events.sort((a, b) => b.count - a.count)
  })).sort((a, b) => a.name.localeCompare(b.name));
}

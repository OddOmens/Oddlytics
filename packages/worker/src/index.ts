import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, TrackEventRequest, TrackBatchRequest } from './types';
import { getOverview, getEventStats, getTimeline, getUsers, getUserDetails, getUserActivity, getAliases, upsertAlias, deleteAlias, getAppStats } from './stats';

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for SwiftUI apps
// Note: origin '*' allows any domain. For production, consider restricting to specific domains.
// Native iOS apps typically don't send Origin headers, so '*' is appropriate for mobile SDKs.
app.use('/*', cors({
  origin: '*',
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'X-API-KEY'],
}));

// Health check
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    service: 'oddlytics-api',
    version: '1.0.0'
  });
});

// Track single event or batch
app.post('/track', async (c) => {
  // Authenticate
  const apiKey = c.req.header('X-API-KEY');
  if (!apiKey || apiKey !== c.env.AUTH_KEY) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await c.req.json();

    // Validate batch structure
    const isBatch = 'events' in body;
    if (isBatch && !Array.isArray(body.events)) {
      return c.json({ error: 'events must be an array' }, 400);
    }

    const events: TrackEventRequest[] = isBatch
      ? body.events
      : [body];

    // Validate non-empty
    if (!events || events.length === 0) {
      return c.json({ error: 'No events provided' }, 400);
    }

    // Validate batch size
    const MAX_BATCH_SIZE = 100;
    if (events.length > MAX_BATCH_SIZE) {
      return c.json({
        error: `Batch too large. Maximum: ${MAX_BATCH_SIZE} events`
      }, 400);
    }

    // Validate events
    for (const event of events) {
      // Check required fields are non-empty strings
      if (!event.event || typeof event.event !== 'string' || event.event.trim().length === 0) {
        return c.json({ error: 'event must be a non-empty string' }, 400);
      }
      if (!event.app_id || typeof event.app_id !== 'string' || event.app_id.trim().length === 0) {
        return c.json({ error: 'app_id must be a non-empty string' }, 400);
      }
      if (!event.session_id || typeof event.session_id !== 'string' || event.session_id.trim().length === 0) {
        return c.json({ error: 'session_id must be a non-empty string' }, 400);
      }

      // Validate optional platform field
      if (event.platform && typeof event.platform !== 'string') {
        return c.json({ error: 'platform must be a string' }, 400);
      }

      // Validate string lengths
      if (event.event.length > 255) {
        return c.json({ error: 'event name too long (max 255 chars)' }, 400);
      }
      if (event.app_id.length > 255) {
        return c.json({ error: 'app_id too long (max 255 chars)' }, 400);
      }
      if (event.session_id.length > 255) {
        return c.json({ error: 'session_id too long (max 255 chars)' }, 400);
      }

      // Validate metadata size
      if (event.metadata) {
        const metadataStr = JSON.stringify(event.metadata);
        const maxSize = 10 * 1024; // 10KB limit
        if (metadataStr.length > maxSize) {
          return c.json({
            error: `Metadata too large. Maximum size: ${maxSize} bytes`
          }, 400);
        }
      }
    }

    // Insert events into D1
    const statements = events.map(event => {
      // Use provided timestamp or current time
      const timestamp = event.timestamp
        ? new Date(event.timestamp * 1000).toISOString().replace('T', ' ').replace('Z', '')
        : new Date().toISOString().replace('T', ' ').replace('Z', '');

      return c.env.DB.prepare(
        'INSERT INTO events (event_name, app_id, platform, metadata, session_id, user_id, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        event.event,
        event.app_id,
        event.platform || 'iOS',
        JSON.stringify(event.metadata || {}),
        event.session_id,
        event.user_id || null,
        timestamp
      );
    });

    // Batch insert
    await c.env.DB.batch(statements);

    return c.json({
      success: true,
      count: events.length
    });

  } catch (error) {
    console.error('Track error:', error);

    // Only include details in development
    const isDev = c.env.ENVIRONMENT !== 'production';

    return c.json({
      error: 'Internal server error',
      ...(isDev && { message: error instanceof Error ? error.message : 'Unknown error' })
    }, 500);
  }
});

// Stats endpoints - require authentication for consistency with /track endpoint
app.get('/stats/overview', async (c) => {
  try {
    const daysParam = c.req.query('days') || 'all';
    let days = 0; // 0 will indicate 'all'
    if (daysParam.endsWith('d')) {
      days = parseInt(daysParam, 10);
    } else if (daysParam === 'all') {
      days = 0; // Explicitly set to 0 for 'all'
    } else {
      // Attempt to parse as a number directly if no 'd' suffix
      const parsedDays = parseInt(daysParam, 10);
      if (!isNaN(parsedDays)) {
        days = parsedDays;
      }
    }

    const data = await getOverview(c.env.DB, days);
    return c.json(data);
  } catch (error) {
    console.error('Overview error:', error);
    const isDev = c.env.ENVIRONMENT !== 'production';
    return c.json({
      error: 'Failed to fetch overview',
      ...(isDev && { message: error instanceof Error ? error.message : 'Unknown error' })
    }, 500);
  }
});

app.get('/stats/events', async (c) => {


  try {
    const appId = c.req.query('app_id');
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');

    const data = await getEventStats(c.env.DB, appId, startDate, endDate);
    return c.json({ events: data });
  } catch (error) {
    console.error('Events stats error:', error);
    const isDev = c.env.ENVIRONMENT !== 'production';

    // Return 400 for validation errors, 500 for others
    const isValidationError = error instanceof Error && error.message.includes('Invalid');
    const statusCode = isValidationError ? 400 : 500;

    return c.json({
      error: isValidationError ? error.message : 'Failed to fetch event stats',
      ...(isDev && !isValidationError && { message: error instanceof Error ? error.message : 'Unknown error' })
    }, statusCode);
  }
});

app.get('/stats/app/:appId', async (c) => {
  try {
    const appId = c.req.param('appId');
    const data = await getAppStats(c.env.DB, appId);
    return c.json(data);
  } catch (error) {
    console.error('App stats error:', error);
    return c.json({ error: 'Failed to fetch app stats' }, 500);
  }
});

app.get('/stats/timeline', async (c) => {


  try {
    const appId = c.req.query('app_id');
    const daysParam = c.req.query('days') || '7';
    const days = parseInt(daysParam, 10);

    // Validation is now in getTimeline, but we check here for better error messages
    if (isNaN(days)) {
      return c.json({ error: 'days parameter must be a number' }, 400);
    }

    const data = await getTimeline(c.env.DB, appId, days);
    return c.json({ timeline: data });
  } catch (error) {
    console.error('Timeline error:', error);
    const isDev = c.env.ENVIRONMENT !== 'production';

    // Return 400 for validation errors, 500 for others
    const isValidationError = error instanceof Error && error.message.includes('Invalid');
    const statusCode = isValidationError ? 400 : 500;

    return c.json({
      error: isValidationError ? error.message : 'Failed to fetch timeline',
      ...(isDev && !isValidationError && { message: error instanceof Error ? error.message : 'Unknown error' })
    }, statusCode);
  }
});

app.get('/stats/users', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '50', 10);
    const offset = parseInt(c.req.query('offset') || '0', 10);
    const search = c.req.query('search');
    const appId = c.req.query('app_id');

    const data = await getUsers(c.env.DB, limit, offset, search, appId);
    return c.json(data);
  } catch (error) {
    console.error('Users error:', error);
    const isDev = c.env.ENVIRONMENT !== 'production';
    return c.json({
      error: 'Failed to fetch users',
      ...(isDev && { message: error instanceof Error ? error.message : 'Unknown error' })
    }, 500);
  }
});

app.get('/stats/users/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const data = await getUserDetails(c.env.DB, userId);

    if (!data) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json(data);
  } catch (error) {
    console.error('User details error:', error);
    const isDev = c.env.ENVIRONMENT !== 'production';
    return c.json({
      error: 'Failed to fetch user details',
      ...(isDev && { message: error instanceof Error ? error.message : 'Unknown error' })
    }, 500);
  }
});

app.get('/stats/users/:userId/activity', async (c) => {
  try {
    const userId = c.req.param('userId');
    const appId = c.req.query('app_id');
    const limit = parseInt(c.req.query('limit') || '50', 10);

    const data = await getUserActivity(c.env.DB, userId, appId, limit);
    return c.json({ events: data });
  } catch (error) {
    console.error('User activity error:', error);
    const isDev = c.env.ENVIRONMENT !== 'production';
    return c.json({
      error: 'Failed to fetch user activity',
      ...(isDev && { message: error instanceof Error ? error.message : 'Unknown error' })
    }, 500);
  }
});

// Alias Endpoints

app.get('/aliases', async (c) => {
  try {
    const appId = c.req.query('app_id');
    const aliases = await getAliases(c.env.DB, appId);
    return c.json({ aliases });
  } catch (error) {
    console.error('Get aliases error:', error);
    return c.json({ error: 'Failed to fetch aliases' }, 500);
  }
});

app.post('/aliases', async (c) => {
  const apiKey = c.req.header('X-API-KEY');
  if (!apiKey || apiKey !== c.env.AUTH_KEY) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await c.req.json();
    const { app_id, event_name, alias } = body;

    if (!app_id || !event_name || !alias) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    await upsertAlias(c.env.DB, app_id, event_name, alias);
    return c.json({ success: true });
  } catch (error) {
    console.error('Upsert alias error:', error);
    return c.json({ error: 'Failed to save alias' }, 500);
  }
});

app.delete('/aliases', async (c) => {
  const apiKey = c.req.header('X-API-KEY');
  if (!apiKey || apiKey !== c.env.AUTH_KEY) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await c.req.json();
    const { app_id, event_name } = body;

    if (!app_id || !event_name) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    await deleteAlias(c.env.DB, app_id, event_name);
    return c.json({ success: true });
  } catch (error) {
    console.error('Delete alias error:', error);
    return c.json({ error: 'Failed to delete alias' }, 500);
  }
});

// Delete Endpoints

app.delete('/events/:eventId', async (c) => {
  const apiKey = c.req.header('X-API-KEY');
  if (!apiKey || apiKey !== c.env.AUTH_KEY) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const eventId = c.req.param('eventId');
    const result = await c.env.DB.prepare('DELETE FROM events WHERE id = ?')
      .bind(parseInt(eventId, 10))
      .run();

    if (result.meta.changes === 0) {
      return c.json({ error: 'Event not found' }, 404);
    }

    return c.json({ success: true, deleted: result.meta.changes });
  } catch (error) {
    console.error('Delete event error:', error);
    const isDev = c.env.ENVIRONMENT !== 'production';
    return c.json({
      error: 'Failed to delete event',
      ...(isDev && { message: error instanceof Error ? error.message : 'Unknown error' })
    }, 500);
  }
});

app.delete('/users/:userId', async (c) => {
  const apiKey = c.req.header('X-API-KEY');
  if (!apiKey || apiKey !== c.env.AUTH_KEY) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const userId = c.req.param('userId');
    const result = await c.env.DB.prepare('DELETE FROM events WHERE user_id = ?')
      .bind(userId)
      .run();

    return c.json({ success: true, deleted: result.meta.changes });
  } catch (error) {
    console.error('Delete user events error:', error);
    const isDev = c.env.ENVIRONMENT !== 'production';
    return c.json({
      error: 'Failed to delete user events',
      ...(isDev && { message: error instanceof Error ? error.message : 'Unknown error' })
    }, 500);
  }
});

app.delete('/apps/:appId', async (c) => {
  const apiKey = c.req.header('X-API-KEY');
  if (!apiKey || apiKey !== c.env.AUTH_KEY) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const appId = c.req.param('appId');
    const result = await c.env.DB.prepare('DELETE FROM events WHERE app_id = ?')
      .bind(appId)
      .run();

    return c.json({ success: true, deleted: result.meta.changes });
  } catch (error) {
    console.error('Delete app events error:', error);
    const isDev = c.env.ENVIRONMENT !== 'production';
    return c.json({
      error: 'Failed to delete app events',
      ...(isDev && { message: error instanceof Error ? error.message : 'Unknown error' })
    }, 500);
  }
});

export default app;

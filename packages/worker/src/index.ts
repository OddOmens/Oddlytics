import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, TrackEventRequest, TrackBatchRequest } from './types';

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
    const statements = events.map(event =>
      c.env.DB.prepare(
        'INSERT INTO events (event_name, app_id, platform, metadata, session_id) VALUES (?, ?, ?, ?, ?)'
      ).bind(
        event.event,
        event.app_id,
        event.platform || 'iOS',
        JSON.stringify(event.metadata || {}),
        event.session_id
      )
    );

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

export default app;

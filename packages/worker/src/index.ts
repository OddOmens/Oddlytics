import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, TrackEventRequest, TrackBatchRequest } from './types';

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for SwiftUI apps
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

    // Check if batch or single event
    const isBatch = 'events' in body;
    const events: TrackEventRequest[] = isBatch
      ? (body as TrackBatchRequest).events
      : [body as TrackEventRequest];

    // Validate events
    for (const event of events) {
      if (!event.event || !event.app_id || !event.session_id) {
        return c.json({
          error: 'Missing required fields: event, app_id, session_id'
        }, 400);
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
    return c.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default app;

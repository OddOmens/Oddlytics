export interface Env {
  DB: D1Database;
  AUTH_KEY: string;
  ENVIRONMENT: string;
}

export interface TrackEventRequest {
  event: string;
  app_id: string;
  platform?: string;
  metadata?: Record<string, any>;
  session_id: string;
  user_id?: string;
  timestamp?: number; // Unix timestamp
}

export interface TrackBatchRequest {
  events: TrackEventRequest[];
}

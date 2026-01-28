export interface App {
    app_id: string;
    total_events: number;
    total_sessions: number;
    first_seen: string;
    last_seen: string;
}

export interface TopEvent {
    event_name: string;
    count: number;
    app_count?: number;
}

export interface Overview {
    total_events: number;
    previous_total_events?: number;
    total_users?: number;
    apps: App[];
    top_events: TopEvent[];
}

export interface EventStat {
    event_name: string;
    count: number;
}

export interface TimelinePoint {
    date: string;
    count: number;
}

export interface User {
    user_id: string;
    total_events: number;
    total_sessions: number;
    first_seen: string;
    last_seen: string;
    last_app?: string;
}

export interface UserDetail {
    user_id: string;
    stats: {
        total_events: number;
        total_sessions: number;
        total_apps: number;
        first_seen: string;
        last_seen: string;
    };
    apps: {
        app_id: string;
        event_count: number;
        last_used: string;
    }[];
}

export interface ActivityEvent {
    id: number;
    event_name: string;
    app_id: string;
    timestamp: string;
    platform: string;
    session_id: string;
    metadata?: any;
}

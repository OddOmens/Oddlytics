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

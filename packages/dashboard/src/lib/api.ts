import type { Overview, EventStat, TimelinePoint } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

export async function getOverview(): Promise<Overview> {
    const response = await fetch(`${API_URL}/stats/overview`, {
        cache: 'no-store', // Always fetch fresh data
    });

    if (!response.ok) {
        throw new Error('Failed to fetch overview');
    }

    return response.json();
}

export async function getEventStats(params?: {
    appId?: string;
    startDate?: string;
    endDate?: string;
}): Promise<EventStat[]> {
    const searchParams = new URLSearchParams();

    if (params?.appId) searchParams.set('app_id', params.appId);
    if (params?.startDate) searchParams.set('start_date', params.startDate);
    if (params?.endDate) searchParams.set('end_date', params.endDate);

    const url = `${API_URL}/stats/events?${searchParams.toString()}`;
    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) {
        throw new Error('Failed to fetch event stats');
    }

    const data = await response.json();
    return data.events;
}

export async function getTimeline(params?: {
    appId?: string;
    days?: number;
}): Promise<TimelinePoint[]> {
    const searchParams = new URLSearchParams();

    if (params?.appId) searchParams.set('app_id', params.appId);
    if (params?.days) searchParams.set('days', params.days.toString());

    const url = `${API_URL}/stats/timeline?${searchParams.toString()}`;
    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) {
        throw new Error('Failed to fetch timeline');
    }

    const data = await response.json();
    return data.timeline;
}

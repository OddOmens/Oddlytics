import { Overview, EventStat, User } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'oddlytics-local-key';

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
    const headers = {
        'X-API-KEY': API_KEY,
        'Content-Type': 'application/json',
        ...options?.headers,
    };

    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `API Error: ${response.statusText}`);
    }

    return response.json();
}

export const api = {
    getOverview: async (days?: string) => {
        const query = days ? `?days=${days}` : '';
        return fetchApi<Overview>(`/stats/overview${query}`);
    },

    getEventStats: async ({ appId, startDate, endDate }: { appId?: string, startDate?: string, endDate?: string }) => {
        const params = new URLSearchParams();
        if (appId) params.append('app_id', appId);
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        return fetchApi<any[]>(`/stats/events?${params}`).then((res: any) => res.events);
    },

    getTimeline: async ({ appId, days }: { appId?: string, days?: number }) => {
        const params = new URLSearchParams();
        if (appId) params.append('app_id', appId);
        if (days) params.append('days', days.toString());
        return fetchApi<any[]>(`/stats/timeline?${params}`).then((res: any) => res.timeline);
    },

    getAppStats: async (appId: string) => {
        return fetchApi<any>(`/stats/app/${appId}`);
    },

    getUsers: async (limit = 50, offset = 0, search = '', appId?: string) => {
        const params = new URLSearchParams({
            limit: limit.toString(),
            offset: offset.toString(),
        });
        if (search) params.append('search', search);
        if (appId) params.append('app_id', appId);

        return fetchApi<{ users: any[], pagination: any }>(`/stats/users?${params}`);
    },

    getUserDetails: async (userId: string) => {
        return fetchApi<any>(`/stats/users/${userId}`);
    },

    getUserActivity: async (userId: string, limit = 50, appId?: string) => {
        const params = new URLSearchParams({ limit: limit.toString() });
        if (appId) params.append('app_id', appId);

        return fetchApi<{ events: any[] }>(`/stats/users/${userId}/activity?${params}`);
    },

    getAliases: async (appId?: string) => {
        const params = new URLSearchParams();
        if (appId) params.append('app_id', appId);
        return fetchApi<{ aliases: any[] }>(`/aliases?${params}`);
    },

    upsertAlias: async (appId: string, eventName: string, alias: string) => {
        return fetchApi('/aliases', {
            method: 'POST',
            body: JSON.stringify({ app_id: appId, event_name: eventName, alias })
        });
    },

    deleteAlias: async (appId: string, eventName: string) => {
        return fetchApi('/aliases', {
            method: 'DELETE',
            body: JSON.stringify({ app_id: appId, event_name: eventName })
        });
    }
};

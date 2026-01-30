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
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `API Error: ${response.statusText} (${response.status})`;
        throw new Error(errorMessage);
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

    getGroups: async (appId: string) => {
        return fetchApi<{ groups: any[] }>(`/stats/groups?app_id=${encodeURIComponent(appId)}`).then(res => res.groups);
    },

    getAppStats: async (appId: string) => {
        return fetchApi<any>(`/stats/app/${encodeURIComponent(appId)}`);
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
    },

    deleteEvent: async (eventId: number) => {
        return fetchApi<{ success: boolean, deleted: number }>(`/events/${eventId}`, {
            method: 'DELETE'
        });
    },

    deleteUser: async (userId: string) => {
        return fetchApi<{ success: boolean, deleted: number }>(`/users/${encodeURIComponent(userId)}`, {
            method: 'DELETE'
        });
    },

    deleteApp: async (appId: string) => {
        return fetchApi<{ success: boolean, deleted: number }>(`/apps/${encodeURIComponent(appId)}`, {
            method: 'DELETE'
        });
    },

    getAppSettings: async (appId: string) => {
        return fetchApi<{ app_id: string, icon_url: string | null, display_name: string | null }>(`/stats/app/${encodeURIComponent(appId)}/settings`);
    },

    updateAppSettings: async (appId: string, settings: { icon_url?: string | null, display_name?: string | null }) => {
        return fetchApi(`/stats/app/${encodeURIComponent(appId)}/settings`, {
            method: 'POST',
            body: JSON.stringify(settings)
        });
    }
};

import { ActivityEvent } from './types';

export function groupActivityEvents(events: ActivityEvent[]) {
    // Group consecutive identical events
    const groupedActivity: (ActivityEvent & { count?: number, groupStart?: string })[] = [];

    events.forEach((event, index) => {
        const prev = groupedActivity[groupedActivity.length - 1];

        if (prev &&
            prev.event_name === event.event_name &&
            prev.app_id === event.app_id &&
            // Check timestamps within reasonable window (e.g. 5 minutes)
            (new Date(prev.timestamp).getTime() - new Date(event.timestamp).getTime() < 300000) &&
            // Check metadata equality
            JSON.stringify(prev.metadata || {}) === JSON.stringify(event.metadata || {})
        ) {
            prev.count = (prev.count || 1) + 1;
            prev.groupStart = event.timestamp; // Update start time of group
        } else {
            groupedActivity.push({ ...event, count: 1 });
        }
    });

    return groupedActivity;
}

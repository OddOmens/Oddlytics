import { Card, Title, BarList, Grid } from '@tremor/react';
import { StatsCard } from './StatsCard';
import type { Overview } from '@/lib/types';

interface OverviewProps {
    data: Overview;
}

export function Overview({ data }: OverviewProps) {
    const totalApps = data.apps.length;
    const totalSessions = data.apps.reduce((sum, app) => sum + app.total_sessions, 0);

    const topEventsData = data.top_events.map(event => ({
        name: event.event_name,
        value: event.count,
    }));

    const appsData = data.apps.map(app => ({
        name: app.app_id,
        value: app.total_events,
    }));

    return (
        <div className="space-y-6">
            <Grid numItemsSm={2} numItemsLg={3} className="gap-6">
                <StatsCard
                    title="Total Events"
                    value={data.total_events}
                    description="All time"
                />
                <StatsCard
                    title="Apps Tracked"
                    value={totalApps}
                />
                <StatsCard
                    title="Total Sessions"
                    value={totalSessions}
                />
            </Grid>

            <Grid numItemsSm={1} numItemsLg={2} className="gap-6">
                <Card>
                    <Title>Top Events</Title>
                    <BarList
                        data={topEventsData}
                        className="mt-4"
                        showAnimation
                    />
                </Card>

                <Card>
                    <Title>Events by App</Title>
                    <BarList
                        data={appsData}
                        className="mt-4"
                        showAnimation
                    />
                </Card>
            </Grid>
        </div>
    );
}

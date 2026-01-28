'use client';

import { useEffect, useState } from 'react';
import { getEventStats, getTimeline } from '@/lib/api';
import { Header } from '@/components/layout/Shell';
import { StatsCard } from '@/components/StatsCard';
import { AreaChart, BarList } from '@tremor/react';
import { Activity, Clock, Calendar } from 'lucide-react';
import type { EventStat, TimelinePoint } from '@/lib/types';

export function AppDashboard({ appId }: { appId: string }) {
    const [events, setEvents] = useState<EventStat[]>([]);
    const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            getEventStats({ appId }),
            // Default to 14 days for chart
            getTimeline({ appId, days: 14 })
        ]).then(([eventsData, timelineData]) => {
            setEvents(eventsData);
            setTimeline(timelineData);
        }).catch(err => {
            console.error("Failed to fetch app data", err);
        }).finally(() => setLoading(false));
    }, [appId]);

    const totalEvents = events.reduce((sum, e) => sum + e.count, 0);

    if (loading) return (
        <div>
            <Header title={appId} />
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        </div>
    );

    return (
        <div>
            <Header title={appId} />

            <div className="grid grid-cols-12 gap-6">
                {/* Main Stats */}
                <div className="col-span-12 md:col-span-4">
                    <StatsCard
                        title="Total Events"
                        value={totalEvents}
                        icon={<Activity size={20} />}
                        description="All time events"
                    />
                </div>
                <div className="col-span-12 md:col-span-4">
                    <StatsCard
                        title="Top Event"
                        value={events[0]?.event_name || '-'}
                        icon={<Clock size={20} />}
                        description={events[0] ? `${events[0].count} times` : 'No data'}
                    />
                </div>
                <div className="col-span-12 md:col-span-4">
                    <StatsCard
                        title="Data Points"
                        value={timeline.length}
                        icon={<Calendar size={20} />}
                        description="Days with activity"
                    />
                </div>

                {/* Timeline Chart */}
                <div className="col-span-12 lg:col-span-8 bg-white rounded-3xl p-6 shadow-soft">
                    <h3 className="font-bold text-lg mb-4">Events (Last 14 Days)</h3>
                    <AreaChart
                        className="h-72 mt-4"
                        data={timeline}
                        index="date"
                        categories={["count"]}
                        colors={["orange"]}
                        showAnimation={true}
                        showLegend={false}
                        showGridLines={false}
                        yAxisWidth={40}
                    />
                </div>

                {/* Event List */}
                <div className="col-span-12 lg:col-span-4 bg-white rounded-3xl p-6 shadow-soft">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">Top Events</h3>
                        <span className="text-xs text-gray-400">All time</span>
                    </div>
                    <BarList
                        data={events.map(e => ({ name: e.event_name, value: e.count }))}
                        className="mt-2"
                        showAnimation={true}
                        color="orange"
                    />
                </div>
            </div>
        </div>
    );
}

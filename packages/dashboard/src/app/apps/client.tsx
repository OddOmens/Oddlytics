'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/Shell';
import { StatsCard } from '@/components/StatsCard';
import { AreaChart, BarList } from '@tremor/react';
import { Activity, Clock, Calendar, Users, ArrowRight } from 'lucide-react';
import type { EventStat, TimelinePoint, User } from '@/lib/types';
import { useSettings } from '@/lib/settings';
import { useAliases } from '@/lib/alias';
import { Pencil, X, Check } from 'lucide-react';
import { Dialog, DialogPanel, Title, Text, Card } from '@tremor/react';
import Link from 'next/link';

export function AppDashboard({ appId }: { appId: string }) {
    const { formatEventName } = useSettings();
    const { getAlias, saveAlias } = useAliases();
    const [events, setEvents] = useState<EventStat[]>([]);
    const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [recentUsers, setRecentUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Alias Editing State
    const [editingEvent, setEditingEvent] = useState<{ original: string, current: string } | null>(null);
    const [isSavingAlias, setIsSavingAlias] = useState(false);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            api.getEventStats({ appId }),
            // Default to 14 days for chart
            api.getTimeline({ appId, days: 14 }),
            api.getAppStats(appId),
            api.getUsers(5, 0, '', appId)
        ]).then(([eventsData, timelineData, statsData, usersData]) => {
            setEvents(eventsData);
            setTimeline(timelineData);
            setStats(statsData);
            setRecentUsers(usersData.users);
        }).catch(err => {
            console.error("Failed to fetch app data", err);
        }).finally(() => setLoading(false));
    }, [appId]);

    const getDisplayName = (eventName: string) => {
        const alias = getAlias(appId, eventName);
        if (alias) return alias;
        return formatEventName(eventName);
    };

    const handleSaveAlias = async () => {
        if (!editingEvent) return;
        setIsSavingAlias(true);
        await saveAlias(appId, editingEvent.original, editingEvent.current);
        setIsSavingAlias(false);
        setEditingEvent(null);
    };

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
                <div className="col-span-12 md:col-span-4 lg:col-span-3">
                    <StatsCard
                        title="Total Events"
                        value={totalEvents}
                        icon={<Activity size={20} />}
                        description="All time events"
                    />
                </div>
                <div className="col-span-12 md:col-span-4 lg:col-span-3">
                    <StatsCard
                        title="Unique Users"
                        value={stats?.total_users || 0}
                        icon={<Users size={20} />}
                        description="Across all sessions"
                    />
                </div>
                <div className="col-span-12 md:col-span-4 lg:col-span-3">
                    <StatsCard
                        title="Top Event"
                        value={events[0] ? getDisplayName(events[0].event_name) : '-'}
                        icon={<Clock size={20} />}
                        description={events[0] ? `${events[0].count} times` : 'No data'}
                    />
                </div>
                <div className="col-span-12 md:col-span-4 lg:col-span-3">
                    <StatsCard
                        title="Timeline Peaks"
                        value={Math.max(...timeline.map(p => p.count), 0)}
                        icon={<Calendar size={20} />}
                        description="Highest daily activity"
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
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg">Top Events</h3>
                        <span className="text-xs text-gray-400">All time</span>
                    </div>

                    <div className="space-y-4">
                        {events.map((e) => {
                            const maxVal = events[0]?.count || 1;
                            const percentage = Math.round((e.count / maxVal) * 100);
                            const displayName = getDisplayName(e.event_name);

                            return (
                                <div key={e.event_name} className="group">
                                    <div className="flex justify-between text-sm mb-1.5 items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-700">{displayName}</span>
                                            <button
                                                onClick={() => setEditingEvent({ original: e.event_name, current: displayName })}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-primary transition-all scale-90 hover:scale-100"
                                                title="Rename event"
                                            >
                                                <Pencil size={12} />
                                            </button>
                                        </div>
                                        <span className="text-gray-500 font-mono text-xs">{e.count.toLocaleString()}</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-orange-500 rounded-full transition-all duration-500 ease-out"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Recent Users for this App */}
                <div className="col-span-12 bg-white rounded-3xl p-6 shadow-soft">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <Users size={20} className="text-gray-400" />
                            <h3 className="font-bold text-lg">Recent Users</h3>
                        </div>
                        <Link
                            href={`/users?app_id=${appId}`}
                            className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                        >
                            View all users <ArrowRight size={14} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {recentUsers.map((user) => (
                            <Link key={user.user_id} href={`/users/detail?id=${user.user_id}`}>
                                <div className="p-4 rounded-2xl border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-all text-center">
                                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mx-auto mb-3">
                                        <Users size={20} />
                                    </div>
                                    <div className="font-mono text-[10px] text-gray-500 truncate mb-1" title={user.user_id}>
                                        {user.user_id}
                                    </div>
                                    <div className="text-sm font-semibold text-gray-900">
                                        {user.total_events} events
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-1">
                                        Seen {new Date(user.last_seen).toLocaleDateString()}
                                    </div>
                                </div>
                            </Link>
                        ))}
                        {recentUsers.length === 0 && (
                            <div className="col-span-full py-10 text-center text-gray-400 text-sm">
                                No users found for this app.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Alias Modal */}
            <Dialog open={!!editingEvent} onClose={() => setEditingEvent(null)} static={true}>
                <DialogPanel className="max-w-sm bg-white">
                    <Title>Rename Event</Title>
                    <Text className="mb-4">
                        Set a custom display name for this event.
                        Original: <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">{editingEvent?.original}</span>
                    </Text>

                    <input
                        type="text"
                        value={editingEvent?.current || ''}
                        onChange={(e) => setEditingEvent(prev => prev ? { ...prev, current: e.target.value } : null)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl mb-6 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        placeholder="Enter display name..."
                        autoFocus
                    />

                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setEditingEvent(null)}
                            className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveAlias}
                            disabled={isSavingAlias}
                            className="px-4 py-2 text-sm font-medium bg-black text-white rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSavingAlias ? 'Saving...' : 'Save Name'}
                        </button>
                    </div>
                </DialogPanel>
            </Dialog>
        </div>
    );
}

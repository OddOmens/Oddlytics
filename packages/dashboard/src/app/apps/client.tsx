'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/Shell';
import { StatsCard } from '@/components/StatsCard';
import { AreaChart, BarList } from '@tremor/react';
import { Activity, Clock, Calendar, Users, ArrowRight, Trash2, Smartphone } from 'lucide-react';
import type { EventStat, TimelinePoint, User } from '@/lib/types';
import { useSettings } from '@/lib/settings';
import { useAliases } from '@/lib/alias';
import { Pencil, X, Check } from 'lucide-react';
import { Dialog, DialogPanel, Title, Text, Card } from '@tremor/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ActivityHeatmap } from '@/components/ActivityHeatmap';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Tooltip } from '@/components/ui/Tooltip';
import { toast } from 'sonner';

export function AppDashboard({ appId }: { appId: string }) {
    const [events, setEvents] = useState<EventStat[]>([]);
    const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
    const [history, setHistory] = useState<TimelinePoint[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [recentUsers, setRecentUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Alias Editing State
    const [editingEvent, setEditingEvent] = useState<{ original: string, current: string } | null>(null);
    const [isSavingAlias, setIsSavingAlias] = useState(false);

    // Delete State
    const [deleteAppConfirm, setDeleteAppConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Customize State
    const [isCustomizing, setIsCustomizing] = useState(false);
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [iconUrl, setIconUrl] = useState<string>('');
    const [displayName, setDisplayName] = useState<string>('');

    const { formatEventName } = useSettings();
    const { getAlias, saveAlias } = useAliases();
    const router = useRouter();

    useEffect(() => {
        setLoading(true);
        Promise.all([
            api.getEventStats({ appId }),
            api.getTimeline({ appId, days: 14 }), // For AreaChart
            api.getTimeline({ appId, days: 365 }), // For Heatmap
            api.getAppStats(appId),
            api.getUsers(5, 0, '', appId),
            api.getAppSettings(appId)
        ]).then(([eventsData, timelineData, historyData, statsData, usersData, settingsData]) => {
            setEvents(eventsData);
            setTimeline(timelineData);
            setHistory(historyData);
            setStats(statsData);
            setRecentUsers(usersData.users);
            if (settingsData) {
                setIconUrl(settingsData.icon_url || '');
                setDisplayName(settingsData.display_name || '');
            }
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

    const handleSaveSettings = async () => {
        setIsSavingSettings(true);
        try {
            await api.updateAppSettings(appId, { icon_url: iconUrl || null, display_name: displayName || null });
            toast.success('App settings updated');
            setIsCustomizing(false);
            window.location.reload();
        } catch (error) {
            console.error('Failed to update app settings:', error);
            toast.error('Failed to update app settings');
        } finally {
            setIsSavingSettings(false);
        }
    };

    const handleDeleteApp = async () => {
        setIsDeleting(true);
        try {
            await api.deleteApp(appId);
            router.push('/');
        } catch (error) {
            console.error('Failed to delete app:', error);
            toast.error('Failed to delete app data. Please try again.');
            setIsDeleting(false);
        }
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
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    {iconUrl ? (
                        <div className="w-12 h-12 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                            <img src={iconUrl} alt={appId} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
                            <Smartphone size={24} />
                        </div>
                    )}
                    <Header title={displayName || appId} />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsCustomizing(true)}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-black bg-white border border-gray-200 rounded-xl transition-all flex items-center gap-2 shadow-sm"
                    >
                        <Pencil size={16} />
                        Customize App
                    </button>
                    <button
                        onClick={() => setDeleteAppConfirm(true)}
                        className="px-4 py-2 text-sm font-medium text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 rounded-xl transition-all flex items-center gap-2"
                    >
                        <Trash2 size={16} />
                        Delete App Data
                    </button>
                </div>
            </div>

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

                {/* Timeline & Heatmap */}
                <div className="col-span-12 space-y-6">
                    <div className="bg-white rounded-3xl p-6 shadow-soft">
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

                    <div className="bg-white rounded-3xl p-6 shadow-soft">
                        <ActivityHeatmap data={history} />
                    </div>
                </div>

                {/* All Events List */}
                <div className="col-span-12 bg-white rounded-3xl p-6 shadow-soft">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg">All Events</h3>
                        <span className="text-xs text-gray-400">Ordered by frequency</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                        {events.map((e) => {
                            const maxVal = events[0]?.count || 1;
                            const percentage = Math.round((e.count / maxVal) * 100);
                            const displayName = getDisplayName(e.event_name);

                            return (
                                <div key={e.event_name} className="group">
                                    <div className="flex justify-between text-sm mb-1.5 items-center">
                                        <div className="flex items-center gap-2 truncate">
                                            <span className="font-medium text-gray-700 truncate" title={displayName}>{displayName}</span>
                                            <Tooltip content="Rename event">
                                                <button
                                                    onClick={() => setEditingEvent({ original: e.event_name, current: displayName })}
                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-primary transition-all scale-90 hover:scale-100 flex-shrink-0"
                                                >
                                                    <Pencil size={12} />
                                                </button>
                                            </Tooltip>
                                        </div>
                                        <span className="text-gray-500 font-mono text-xs ml-2">{e.count.toLocaleString()}</span>
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
                    {events.length === 0 && (
                        <div className="py-10 text-center text-gray-400 text-sm">
                            No events found for this app.
                        </div>
                    )}
                </div>
            </div>

            {/* Customize App Modal */}
            <Dialog open={isCustomizing} onClose={() => setIsCustomizing(false)} static={true}>
                <DialogPanel className="max-w-md bg-white">
                    <Title>Customize App</Title>
                    <Text className="mb-6">
                        Personalize how this app appears in your dashboard and sidebar.
                    </Text>

                    <div className="space-y-4 mb-8">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Display Name</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                placeholder="App Display Name (e.g. My Awesome App)"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Icon Image URL</label>
                            <input
                                type="text"
                                value={iconUrl}
                                onChange={(e) => setIconUrl(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                placeholder="https://example.com/icon.png"
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Provide an absolute URL to a square image (PNG/JPG/SVG).</p>
                        </div>

                        {iconUrl && (
                            <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-center">
                                <div className="text-center">
                                    <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-tight font-bold">Preview</p>
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-soft mx-auto">
                                        <img src={iconUrl} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setIsCustomizing(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveSettings}
                            disabled={isSavingSettings}
                            className="px-4 py-2 text-sm font-medium bg-black text-white rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                        >
                            {isSavingSettings ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </DialogPanel>
            </Dialog>

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

            {/* Delete App Dialog */}
            <DeleteConfirmDialog
                open={deleteAppConfirm}
                onClose={() => setDeleteAppConfirm(false)}
                onConfirm={handleDeleteApp}
                title="Delete App Data"
                message={`Delete all events for app "${appId}"? This will permanently delete ${totalEvents.toLocaleString()} events. This cannot be undone.`}
                isDeleting={isDeleting}
            />
        </div>
    );
}

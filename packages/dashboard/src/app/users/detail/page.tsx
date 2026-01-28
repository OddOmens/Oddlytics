'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { UserDetail, ActivityEvent } from '@/lib/types';
import { Header } from '@/components/layout/Shell';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    Calendar,
    Activity,
    Smartphone,
    Clock,
    Filter,
    ChevronDown
} from 'lucide-react';
import { useSettings } from '@/lib/settings';

function UserDetailsContent() {
    const { formatEventName } = useSettings();
    const searchParams = useSearchParams();
    const userId = searchParams.get('id');
    const [user, setUser] = useState<UserDetail | null>(null);
    const [activity, setActivity] = useState<ActivityEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState<string>('');

    useEffect(() => {
        if (userId) {
            loadData();
        }
    }, [userId, selectedApp]);

    async function loadData() {
        setLoading(true);
        try {
            const [userData, activityData] = await Promise.all([
                api.getUserDetails(userId as string),
                api.getUserActivity(userId as string, 50, selectedApp)
            ]);
            setUser(userData);
            setActivity(activityData.events);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    if (loading && !user) {
        return (
            <main className="p-6 md:p-10 max-w-7xl mx-auto">
                <div className="h-8 w-48 bg-gray-100 rounded-xl mb-10 animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 bg-gray-100 rounded-3xl animate-pulse" />
                    ))}
                </div>
            </main>
        );
    }

    if (!user) {
        return (
            <main className="p-6 md:p-10 max-w-7xl mx-auto text-center py-20">
                <p className="text-gray-400">User not found</p>
            </main>
        );
    }

    return (
        <main className="p-6 md:p-10 max-w-7xl mx-auto pb-20">
            <div className="mb-8">
                <Header title="User Details" />
                <h2 className="font-mono text-xl text-gray-500 breal-all">
                    {user.user_id}
                </h2>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard
                    label="Total Events"
                    value={user.stats.total_events.toLocaleString()}
                    icon={Activity}
                />
                <StatCard
                    label="Sessions"
                    value={user.stats.total_sessions.toLocaleString()}
                    icon={Clock}
                />
                <StatCard
                    label="Apps Used"
                    value={user.stats.total_apps.toString()}
                    icon={Smartphone}
                />
                <StatCard
                    label="First Seen"
                    value={new Date(user.stats.first_seen).toLocaleDateString()}
                    icon={Calendar}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Apps List */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-lg font-medium mb-4">Apps</h3>
                    {user.apps.map((app) => (
                        <div
                            key={app.app_id}
                            onClick={() => setSelectedApp(selectedApp === app.app_id ? '' : app.app_id)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer ${selectedApp === app.app_id
                                ? 'bg-black text-white border-black'
                                : 'bg-white border-gray-100 hover:border-gray-200'
                                }`}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-medium truncate pr-2">{app.app_id}</span>
                                <span className={`text-xs ${selectedApp === app.app_id ? 'text-gray-400' : 'text-gray-400'}`}>
                                    {new Date(app.last_used).toLocaleDateString()}
                                </span>
                            </div>
                            <div className={`text-sm ${selectedApp === app.app_id ? 'text-gray-400' : 'text-gray-500'}`}>
                                {app.event_count.toLocaleString()} events
                            </div>
                        </div>
                    ))}
                </div>

                {/* Activity Feed */}
                <div className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-medium">Recent Activity</h3>
                        {selectedApp && (
                            <button
                                onClick={() => setSelectedApp('')}
                                className="text-sm text-gray-400 hover:text-black hover:underline"
                            >
                                Clear Filter
                            </button>
                        )}
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-100 p-2">
                        {activity.length === 0 ? (
                            <div className="text-center py-20 text-gray-400">
                                No activity found
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {activity.map((event) => (
                                    <div key={event.id} className="p-4 hover:bg-gray-50 transition-colors rounded-xl">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-medium text-gray-900">
                                                {formatEventName(event.event_name)}
                                            </span>
                                            <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                                                {new Date(event.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                                            <span>{event.app_id}</span>
                                            <span>•</span>
                                            <span>{event.platform}</span>
                                        </div>
                                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                                            <div className="bg-gray-50 rounded-lg p-2 text-xs font-mono text-gray-600 overflow-x-auto">
                                                {JSON.stringify(event.metadata, null, 2)}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}

export default function UserDetailsPage() {
    return (
        <Suspense fallback={
            <main className="p-6 md:p-10 max-w-7xl mx-auto">
                <div className="h-8 w-48 bg-gray-100 rounded-xl mb-10 animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 bg-gray-100 rounded-3xl animate-pulse" />
                    ))}
                </div>
            </main>
        }>
            <UserDetailsContent />
        </Suspense>
    );
}

function StatCard({ label, value, icon: Icon }: { label: string, value: string, icon: any }) {
    return (
        <div className="bg-white p-5 rounded-3xl border border-gray-100">
            <div className="flex items-center gap-2 mb-2 text-gray-400">
                <Icon size={16} />
                <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
            </div>
            <div className="text-2xl font-semibold">{value}</div>
        </div>
    );
}

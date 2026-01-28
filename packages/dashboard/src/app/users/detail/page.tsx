'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { UserDetail, ActivityEvent } from '@/lib/types';
import { Header } from '@/components/layout/Shell';
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    Calendar,
    Activity,
    Smartphone,
    Clock,
    Search as SearchIcon,
    Code,
    Eye,
    ExternalLink,
    Copy,
    Check,
    Trash2
} from 'lucide-react';
import { useSettings } from '@/lib/settings';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { groupActivityEvents } from '@/lib/activity-utils';
import { Tooltip } from '@/components/ui/Tooltip';
import { toast } from 'sonner';

function UserDetailsContent() {
    const { formatEventName } = useSettings();
    const searchParams = useSearchParams();
    const router = useRouter();
    const userId = searchParams.get('id');
    const [user, setUser] = useState<UserDetail | null>(null);
    const [activity, setActivity] = useState<ActivityEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState<string>('');

    // Delete state
    const [deleteEventId, setDeleteEventId] = useState<number | null>(null);
    const [deleteUserConfirm, setDeleteUserConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

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

    async function handleDeleteEvent() {
        if (!deleteEventId) return;
        setIsDeleting(true);
        try {
            await api.deleteEvent(deleteEventId);
            setActivity(activity.filter(e => e.id !== deleteEventId));
            setDeleteEventId(null);
            toast.success('Event deleted successfully');
        } catch (error) {
            console.error('Failed to delete event:', error);
            toast.error('Failed to delete event. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    }

    async function handleDeleteUser() {
        if (!userId) return;
        setIsDeleting(true);
        try {
            await api.deleteUser(userId);
            toast.success('User data deleted successfully');
            router.push('/users');
        } catch (error) {
            console.error('Failed to delete user:', error);
            toast.error('Failed to delete user. Please try again.');
            setIsDeleting(false);
        }
    }

    if (loading && !user) {
        return (
            <main className="p-6 md:p-10 max-w-7xl mx-auto">
                <div className="h-8 w-48 bg-gray-100 dark:bg-gray-800 rounded-xl mb-10 animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-3xl animate-pulse" />
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
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <span className="hover:text-gray-900 dark:hover:text-gray-300 cursor-pointer">Users</span>
                    <span>/</span>
                    <span>Details</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="font-mono text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 break-all">
                                {user.user_id}
                            </h1>
                            <Tooltip content="Copy User ID">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(user.user_id);
                                        toast.success('User ID copied to clipboard');
                                    }}
                                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <Copy size={16} />
                                </button>
                            </Tooltip>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1.5">
                                <Clock size={16} />
                                <span>Last seen {new Date(user.stats.last_seen).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Calendar size={16} />
                                <span>First seen {new Date(user.stats.first_seen).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-md">
                                <Smartphone size={14} />
                                <span>{user.stats.total_apps} App{user.stats.total_apps !== 1 ? 's' : ''}</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setDeleteUserConfirm(true)}
                        className="px-4 py-2 text-sm font-medium text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 rounded-xl transition-all flex items-center gap-2"
                    >
                        <Trash2 size={16} />
                        Delete User Data
                    </button>
                </div>
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
                                ? 'bg-black text-white border-black dark:bg-primary dark:border-primary'
                                : 'bg-white border-gray-100 hover:border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-600'
                                }`}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <span className={`font-medium truncate pr-2 ${selectedApp === app.app_id ? 'text-white' : 'dark:text-gray-200'}`}>{app.app_id}</span>
                                <span className={`text-xs ${selectedApp === app.app_id ? 'text-gray-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                    {new Date(app.last_used).toLocaleDateString()}
                                </span>
                            </div>
                            <div className={`text-sm ${selectedApp === app.app_id ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
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

                    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-2">
                        {activity.length === 0 ? (
                            <div className="text-center py-20 text-gray-400">
                                No activity found
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50 dark:divide-gray-700">
                                {(() => {
                                    const groupedActivity = groupActivityEvents(activity);

                                    return groupedActivity.map((event) => (
                                        <div key={event.id} className="group p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-xl">
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                                        {formatEventName(event.event_name)}
                                                    </span>
                                                    {event.count && event.count > 1 && (
                                                        <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-[10px] font-bold rounded-full">
                                                            {event.count}x
                                                        </span>
                                                    )}
                                                    <Tooltip content="Delete event">
                                                        <button
                                                            onClick={() => setDeleteEventId(event.id)}
                                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all scale-90 hover:scale-100"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </Tooltip>
                                                </div>
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
                                                <MetadataViewer data={event.metadata} />
                                            )}
                                        </div>
                                    ));
                                })()}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Event Dialog */}
            <DeleteConfirmDialog
                open={deleteEventId !== null}
                onClose={() => setDeleteEventId(null)}
                onConfirm={handleDeleteEvent}
                title="Delete Event"
                message="Delete this event? This cannot be undone."
                isDeleting={isDeleting}
            />

            {/* Delete User Dialog */}
            <DeleteConfirmDialog
                open={deleteUserConfirm}
                onClose={() => setDeleteUserConfirm(false)}
                onConfirm={handleDeleteUser}
                title="Delete User Data"
                message={`Delete all events for user ${userId}? This will permanently delete ${user?.stats.total_events.toLocaleString()} events. This cannot be undone.`}
                isDeleting={isDeleting}
            />
        </main>
    );
}

export default function UserDetailsPage() {
    return (
        <Suspense fallback={
            <main className="p-6 md:p-10 max-w-7xl mx-auto">
                <div className="h-8 w-48 bg-gray-100 dark:bg-gray-800 rounded-xl mb-10 animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-3xl animate-pulse" />
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
        <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2 text-gray-400 dark:text-gray-500">
                <Icon size={16} />
                <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
            </div>
            <div className="text-2xl font-semibold dark:text-white">{value}</div>
        </div>
    );
}

function MetadataViewer({ data }: { data: any }) {
    const [mode, setMode] = useState<'visual' | 'json'>('visual');
    const [search, setSearch] = useState('');
    const [copied, setCopied] = useState(false);

    if (!data || Object.keys(data).length === 0) return null;

    const entries = Object.entries(data).filter(([key, value]) => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return key.toLowerCase().includes(searchLower) ||
            String(value).toLowerCase().includes(searchLower);
    });

    const copyToClipboard = () => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        setCopied(true);
        toast.success('JSON copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    // Helper to determine value type and render appropriately
    const renderValue = (key: string, value: any) => {
        const stringVal = String(value);

        // 1. Boolean / Toggle
        if (typeof value === 'boolean' || stringVal === 'true' || stringVal === 'false') {
            const isActive = stringVal === 'true' || value === true;
            return (
                <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${isActive
                    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                    : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                    }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="capitalize">{isActive ? 'True' : 'False'}</span>
                </div>
            );
        }

        // 2. URL
        if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))) {
            return (
                <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400"
                    onClick={(e) => e.stopPropagation()}
                >
                    <span className="truncate max-w-[200px]">{value}</span>
                    <ExternalLink size={10} />
                </a>
            );
        }

        // 3. Color (Hex/RGB)
        if (typeof value === 'string' && (value.match(/^#[0-9A-F]{3,6}$/i) || value.match(/^rgb/i))) {
            return (
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded border border-gray-200 dark:border-gray-700 shadow-sm" style={{ backgroundColor: value }} />
                    <span className="font-mono text-gray-600 dark:text-gray-300">{value}</span>
                </div>
            );
        }

        // 4. Arrays / Comma-separated lists (Tags)
        if (Array.isArray(value) || (typeof value === 'string' && value.includes(',') && !value.includes(' '))) {
            const items = Array.isArray(value) ? value : value.split(',');
            return (
                <div className="flex flex-wrap gap-1">
                    {items.map((item: string, i: number) => (
                        <span key={i} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded text-xs border border-gray-200 dark:border-gray-700">
                            {item.trim()}
                        </span>
                    ))}
                </div>
            );
        }

        // 5. Default String/Number
        return <span className="text-gray-900 dark:text-gray-200 break-all">{stringVal}</span>;
    };

    return (
        <div className="mt-2 bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                        type="text"
                        placeholder="Search properties..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                    />
                </div>
                <div className="flex items-center gap-1">
                    <Tooltip content="Copy Raw JSON">
                        <button
                            onClick={copyToClipboard}
                            className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                        </button>
                    </Tooltip>
                    <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />
                    <button
                        onClick={() => setMode('visual')}
                        className={`p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium ${mode === 'visual'
                            ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                            : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                            }`}
                    >
                        <Eye size={14} />
                        <span className="hidden sm:inline">Visual</span>
                    </button>
                    <button
                        onClick={() => setMode('json')}
                        className={`p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium ${mode === 'json'
                            ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                            : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                            }`}
                    >
                        <Code size={14} />
                        <span className="hidden sm:inline">JSON</span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {mode === 'visual' ? (
                <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                    <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100 dark:border-gray-700">
                            <tr>
                                <th className="px-3 py-2 w-1/3 sm:w-1/4">Key</th>
                                <th className="px-3 py-2">Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {entries.length > 0 ? (
                                entries.map(([key, value]) => (
                                    <tr key={key} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-3 py-2 align-top text-gray-500 dark:text-gray-400 font-mono text-[11px] pt-2.5">
                                            {key}
                                        </td>
                                        <td className="px-3 py-2 align-top text-[11px]">
                                            {renderValue(key, value)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={2} className="px-3 py-8 text-center text-gray-400">
                                        No properties found matching "{search}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="p-3 bg-gray-50 dark:bg-gray-950 overflow-auto max-h-[300px]">
                    <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}

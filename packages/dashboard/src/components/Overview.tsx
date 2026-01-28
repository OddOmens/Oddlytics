'use client';

import { BarChart, DonutChart } from '@tremor/react';
import { StatsCard } from './StatsCard';
import type { Overview } from '@/lib/types';
import { Smartphone, Activity, Users, Globe, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useSettings } from '@/lib/settings';
import { useAliases } from '@/lib/alias';
import { Tooltip } from '@/components/ui/Tooltip';

interface OverviewProps {
    data: Overview;
}

export function Overview({ data }: OverviewProps) {
    const { apps, top_events, total_events, total_users } = data;
    const { getAlias } = useAliases();
    const { prettyEventNames, formatEventName } = useSettings();

    const getDisplayName = (eventName: string, appId?: string) => {
        if (appId) {
            const alias = getAlias(appId, eventName);
            if (alias) return alias;
        }
        return prettyEventNames ? formatEventName(eventName) : eventName;
    };

    const totalApps = apps.length;
    const totalSessions = apps.reduce((sum, app) => sum + app.total_sessions, 0);

    const topEventsData = top_events.map(event => ({
        name: getDisplayName(event.event_name),
        value: event.count,
    }));

    const appsData = apps.map(app => ({
        name: app.app_id,
        value: app.total_events,
    }));

    return (
        <div className="grid grid-cols-12 gap-6 auto-rows-[minmax(180px,auto)]">

            {/* Hero / Greeting Card - Spans full width or large chunk */}
            <div className="col-span-12 lg:col-span-8 bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-soft flex flex-col justify-center relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-4xl font-bold mb-2">Hey, Welcome back! 👋</h2>
                    <p className="text-gray-500 text-lg mb-6 max-w-md">
                        Here's what's happening with your apps today. You have {data.total_events} new events tracked.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <div className="bg-primary/10 text-primary dark:bg-primary/20 px-4 py-2 rounded-full text-sm font-semibold">
                            {totalApps} Active Apps
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-full text-sm font-semibold">
                            {totalSessions} Sessions
                        </div>
                        <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-full text-sm font-semibold">
                            {data.total_users || 0} Users
                        </div>
                    </div>
                </div>
                {/* Abstract shape decoration */}
                <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
                <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Main Stats Card (Black variant like reference) */}
            <div className="col-span-12 md:col-span-6 lg:col-span-4">
                <div className="h-full">
                    {(() => {
                        let trendValue = 0;
                        let isPositive = true;

                        if (data.previous_total_events && data.previous_total_events > 0) {
                            const diff = data.total_events - data.previous_total_events;
                            trendValue = Math.round((diff / data.previous_total_events) * 100);
                            isPositive = diff >= 0;
                        } else if (data.total_events > 0 && (!data.previous_total_events || data.previous_total_events === 0)) {
                            // If we have events now but none before, that's technically 100% growth or infinite
                            trendValue = 100;
                            isPositive = true;
                        }

                        return (
                            <StatsCard
                                title="Total Events"
                                value={data.total_events}
                                description="Lifetime events captured"
                                variant="white"
                                trend={data.previous_total_events !== undefined ? { value: Math.abs(trendValue), isPositive } : undefined}
                                icon={<Activity size={20} />}
                                className="h-full"
                            />
                        );
                    })()}
                </div>
            </div>

            {/* App List / "Visa" Card style */}
            <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-soft flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg dark:text-white">Your Apps</h3>
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-500 dark:text-gray-400">{totalApps}</span>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                    {data.apps.map(app => (
                        <Link key={app.app_id} href={`/apps?id=${encodeURIComponent(app.app_id)}`} className="block group">
                            <div className="p-4 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-primary/30 dark:hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 group-hover:bg-white dark:group-hover:bg-gray-600 group-hover:text-primary transition-colors shadow-sm">
                                        <Smartphone size={18} />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-sm dark:text-gray-200">{app.app_id}</div>
                                        <div className="text-xs text-gray-400 dark:text-gray-500">{app.total_events} events</div>
                                    </div>
                                </div>
                                <ArrowRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-primary transition-colors" />
                            </div>
                        </Link>
                    ))}

                    {data.apps.length === 0 && (
                        <div className="text-center text-gray-400 py-8 text-sm">
                            No apps connected yet.
                        </div>
                    )}
                </div>
            </div>

            {/* Charts Section */}
            <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-soft">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg dark:text-white">Top Events</h3>
                    <button className="text-xs text-gray-400 hover:text-black dark:hover:text-white">View all</button>
                </div>
                <DonutChart
                    className="mt-6 h-40"
                    data={topEventsData}
                    category="value"
                    index="name"
                    colors={["violet", "indigo", "rose", "cyan", "amber"]}
                    showAnimation={true}
                    variant="pie"
                />
                <div className="mt-6 space-y-2">
                    {topEventsData.slice(0, 3).map((e, i) => {
                        const colors = ["bg-violet-500", "bg-indigo-500", "bg-rose-500", "bg-cyan-500", "bg-amber-500"];
                        const colorClass = colors[i] || "bg-gray-400";

                        return (
                            <div key={i} className="flex justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${colorClass}`} />
                                    <Tooltip content={e.name}>
                                        <span className="text-gray-600 dark:text-gray-400 truncate max-w-[150px]">{e.name}</span>
                                    </Tooltip>
                                </div>
                                <span className="font-medium dark:text-gray-200">{e.value}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="col-span-12 lg:col-span-4 bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-soft">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg dark:text-white">Activity</h3>
                    <div className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-lg">Weekly</div>
                </div>
                <BarChart
                    className="mt-4 h-48"
                    data={appsData}
                    index="name"
                    categories={["value"]}
                    colors={["violet"]}
                    yAxisWidth={0}
                    showAnimation={true}
                    showLegend={false}
                />
            </div>

        </div >
    );
}

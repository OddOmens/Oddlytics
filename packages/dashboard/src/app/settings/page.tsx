'use client';

import { Header } from '@/components/layout/Shell';
import { useSettings } from '@/lib/settings';
import clsx from 'clsx';
import { Settings as SettingsIcon, Type, Clock, Layout } from 'lucide-react';

export default function SettingsPage() {
    const {
        prettyEventNames, setPrettyEventNames,
        defaultTimeRange, setDefaultTimeRange,
        compactMode, setCompactMode
    } = useSettings();

    return (
        <div>
            <Header title="Settings" />

            <div className="max-w-2xl bg-white rounded-3xl p-8 shadow-soft">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <SettingsIcon size={24} className="text-gray-400" />
                    General Preferences
                </h3>

                <div className="space-y-6">
                    {/* Setting Item */}
                    <div className="flex items-center justify-between pb-6 border-b border-gray-100 last:border-0">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                <Type size={20} />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900">Pretty Format Event Names</h4>
                                <p className="text-sm text-gray-500 mt-1 max-w-sm">
                                    Automatically format event names from 'text_hello_event' to 'Text Hello Event' for better readability.
                                </p>
                            </div>
                        </div>

                        <div
                            onClick={() => setPrettyEventNames(!prettyEventNames)}
                            className={clsx(
                                prettyEventNames ? 'bg-primary' : 'bg-gray-200',
                                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none'
                            )}
                        >
                            <span
                                aria-hidden="true"
                                className={clsx(
                                    prettyEventNames ? 'translate-x-5' : 'translate-x-0',
                                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                                )}
                            />
                        </div>
                    </div>

                    {/* Default Time Range */}
                    <div className="flex items-center justify-between pb-6 border-b border-gray-100 last:border-0">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Clock size={20} />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900">Default Time Range</h4>
                                <p className="text-sm text-gray-500 mt-1 max-w-sm">
                                    Set the default duration for analytics charts and summaries.
                                </p>
                            </div>
                        </div>

                        <select
                            value={defaultTimeRange}
                            onChange={(e) => setDefaultTimeRange(e.target.value)}
                            className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                        >
                            <option value="24h">Last 24 Hours</option>
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="90d">Last 90 Days</option>
                        </select>
                    </div>

                    {/* Compact Mode */}
                    <div className="flex items-center justify-between pb-6 border-b border-gray-100 last:border-0">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                <Layout size={20} />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900">Compact Mode</h4>
                                <p className="text-sm text-gray-500 mt-1 max-w-sm">
                                    Reduce whitespace in lists and tables for higher data density.
                                </p>
                            </div>
                        </div>

                        <div
                            onClick={() => setCompactMode(!compactMode)}
                            className={clsx(
                                compactMode ? 'bg-primary' : 'bg-gray-200',
                                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none'
                            )}
                        >
                            <span
                                aria-hidden="true"
                                className={clsx(
                                    compactMode ? 'translate-x-5' : 'translate-x-0',
                                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                                )}
                            />
                        </div>
                    </div>

                    <div className="pt-2 text-xs text-center text-gray-400">
                        Oddlytics Dashboard v1.0.0
                    </div>
                </div>
            </div>
        </div>
    );
}

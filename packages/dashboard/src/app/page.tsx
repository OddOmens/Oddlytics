'use client';

import { useEffect, useState } from 'react';
import { getOverview } from '@/lib/api';
import { Overview } from '@/components/Overview';
import type { Overview as OverviewType } from '@/lib/types';

export default function Home() {
    const [data, setData] = useState<OverviewType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        getOverview()
            .then(setData)
            .catch((err) => {
                console.error('Failed to load data:', err);
                setError(true);
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="text-slate-600 dark:text-slate-400">Loading analytics...</div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                    Dashboard
                </h2>
                <p className="text-red-600">
                    Failed to load analytics data. Make sure the API is running.
                </p>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                Dashboard
            </h2>
            <Overview data={data} />
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { getOverview } from '@/lib/api';
import { Overview } from '@/components/Overview';
import { Header } from '@/components/layout/Shell';
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
                <Header title="Overview" />
                <p className="text-red-400 bg-red-50 p-4 rounded-xl inline-block">
                    Failed to load analytics data. Make sure the API is running.
                </p>
            </div>
        );
    }

    return (
        <div>
            <Header title="Overview" />
            <Overview data={data} />
        </div>
    );
}

'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppDashboard } from './client';

// We replaced the dynamic route with a query-parameter based route
// because Next.js `output: export` doesn't support dynamic routes without generateStaticParams
// and we don't know the app IDs ahead of time.
// URL will be /apps?id=MyAppName instead of /apps/MyAppName

function AppsPageContent() {
    const searchParams = useSearchParams();
    const appId = searchParams.get('id');

    if (!appId) {
        return (
            <div className="flex h-[50vh] items-center justify-center text-gray-400">
                No app selected. Search or select an app from the home page.
            </div>
        );
    }

    return <AppDashboard appId={appId} />;
}

export default function AppsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AppsPageContent />
        </Suspense>
    );
}

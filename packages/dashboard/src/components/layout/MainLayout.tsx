'use client';

import { useSettings } from '@/lib/settings';
import { Sidebar } from '@/components/layout/Shell';

export function MainLayout({ children }: { children: React.ReactNode }) {
    const { compactMode } = useSettings();

    return (
        <div className={compactMode ? 'compact-mode' : ''}>
            <Sidebar />
            <main className="pl-24 pr-8 py-8 min-h-screen transition-all duration-300">
                <div className="max-w-[1600px] mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}

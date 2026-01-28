import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { App } from '@/lib/types';
import { Smartphone, LayoutDashboard, Users, Settings } from 'lucide-react';
import Link from 'next/link';

export function Sidebar() {
    const [apps, setApps] = useState<App[]>([]);

    useEffect(() => {
        api.getOverview('all').then(data => {
            setApps(data.apps || []);
        }).catch(err => {
            console.error('Failed to fetch apps for sidebar:', err);
        });
    }, []);

    return (
        <aside
            className="fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col z-50 w-20"
        >
            <div className="flex flex-col items-center py-8 h-full relative">
                {/* Logo */}
                <div className="mb-10 p-3 bg-black rounded-xl text-white font-bold text-xl flex items-center justify-center shrink-0 w-10 h-10">
                    Od
                </div>

                <nav className="flex flex-col gap-4 w-full px-2 items-center overflow-y-auto no-scrollbar pb-20">
                    <SidebarItem href="/" icon={LayoutDashboard} label="Overview" />
                    <SidebarItem href="/users" icon={Users} label="Users" />

                    <div className="w-8 h-[1px] bg-gray-100 dark:bg-gray-800 my-2" />

                    {apps.map(app => (
                        <SidebarItem
                            key={app.app_id}
                            href={`/apps?id=${encodeURIComponent(app.app_id)}`}
                            icon={app.icon_url ? null : Smartphone}
                            imageUrl={app.icon_url}
                            label={app.display_name || app.app_id}
                        />
                    ))}
                </nav>

                <div className="mt-auto flex flex-col gap-4 w-full px-2 pb-4 items-center bg-white dark:bg-gray-900 pt-4 border-t border-gray-50 dark:border-gray-800">
                    <SidebarItem href="/settings" icon={Settings} label="Settings" />
                </div>
            </div>
        </aside>
    );
}

function SidebarItem({
    href,
    icon: Icon,
    imageUrl,
    label,
}: {
    href: string;
    icon: any;
    imageUrl?: string | null;
    label: string;
}) {
    return (
        <Link
            href={href}
            title={label}
            className="flex items-center justify-center rounded-xl transition-all hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white w-12 h-12 shrink-0 group"
        >
            {imageUrl ? (
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800 group-hover:border-primary/50 transition-colors shadow-sm bg-white dark:bg-gray-950">
                    <img src={imageUrl} alt={label} className="w-full h-full object-cover" />
                </div>
            ) : Icon ? (
                <Icon size={24} className="shrink-0" />
            ) : null}
        </Link>
    );
}

export function Header({ title }: { title: string }) {
    return (
        <header className="flex justify-between items-center mb-10 pl-2">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Analytics Dashboard</p>
            </div>

            <div className="flex items-center gap-4">
                {/* Future: Global search and quick actions */}
            </div>
        </header>
    );
}

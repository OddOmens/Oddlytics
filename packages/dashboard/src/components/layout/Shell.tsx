'use client';

import { useState } from 'react';

import {
    LayoutDashboard,
    Settings,
    Bell,
    Search,
    Plus,
    Mic,
    PieChart,
    Users,
    User,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

export function Sidebar() {
    return (
        <aside
            className="fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col z-50 w-64"
        >
            <div className="flex flex-col items-center py-8 h-full relative">
                {/* Logo */}
                <div className="mb-10 p-3 bg-black rounded-xl text-white font-bold text-xl flex items-center justify-center shrink-0">
                    Od
                </div>

                <nav className="flex flex-col gap-4 w-full px-4">
                    <SidebarItem href="/" icon={LayoutDashboard} label="Overview" />
                    <SidebarItem href="/users" icon={Users} label="Users" />
                </nav>

                <div className="mt-auto flex flex-col gap-4 w-full px-4 pb-4">
                    <SidebarItem href="/settings" icon={Settings} label="Settings" />
                </div>
            </div>
        </aside>
    );
}

function SidebarItem({
    href,
    icon: Icon,
    label,
}: {
    href: string;
    icon: any;
    label: string;
}) {
    return (
        <Link
            href={href}
            className="flex items-center gap-4 p-3 rounded-xl transition-colors whitespace-nowrap overflow-hidden justify-start hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
        >
            <Icon size={20} className="shrink-0" />
            <span className="font-medium">
                {label}
            </span>
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

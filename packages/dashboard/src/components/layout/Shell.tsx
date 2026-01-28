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
    const [expanded, setExpanded] = useState(false);

    return (
        <aside
            className={`fixed left-0 top-0 h-full bg-white border-r border-gray-100 flex flex-col transition-all duration-300 z-50 ${expanded ? 'w-64' : 'w-20'}`}
        >
            <div className="flex flex-col items-center py-8 h-full relative">
                {/* Logo */}
                <div className="mb-10 p-3 bg-black rounded-xl text-white font-bold text-xl flex items-center justify-center shrink-0">
                    Od
                </div>

                <nav className="flex flex-col gap-4 w-full px-4">
                    <SidebarItem href="/" icon={LayoutDashboard} label="Overview" expanded={expanded} />
                    <SidebarItem href="/users" icon={Users} label="Users" expanded={expanded} />
                </nav>

                <div className="mt-auto flex flex-col gap-4 w-full px-4 pb-4">
                    <SidebarItem href="/settings" icon={Settings} label="Settings" expanded={expanded} />
                    {/* Expand Toggle */}
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="p-3 text-gray-400 hover:text-black hover:bg-gray-50 rounded-xl transition-colors flex items-center justify-center w-full"
                    >
                        {expanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                    </button>
                </div>
            </div>
        </aside>
    );
}

function SidebarItem({
    href,
    icon: Icon,
    label,
    expanded
}: {
    href: string;
    icon: any;
    label: string;
    expanded: boolean;
}) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-4 p-3 rounded-xl transition-colors whitespace-nowrap overflow-hidden ${expanded ? 'justify-start' : 'justify-center'
                } hover:bg-gray-50 text-gray-500 hover:text-black`}
        >
            <Icon size={20} className="shrink-0" />
            {expanded && (
                <span className="font-medium animate-in fade-in slide-in-from-left-2 duration-200">
                    {label}
                </span>
            )}
        </Link>
    );
}

export function Header({ title }: { title: string }) {
    return (
        <header className="flex justify-between items-center mb-10 pl-2">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                <p className="text-gray-500 mt-1">Analytics Dashboard</p>
            </div>

            <div className="flex items-center gap-4">
                {/* Future: Global search and quick actions */}
            </div>
        </header>
    );
}

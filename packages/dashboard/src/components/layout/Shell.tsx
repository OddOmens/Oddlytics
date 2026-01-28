'use client';

import {
    LayoutDashboard,
    Settings,
    Bell,
    Search,
    Plus,
    Mic,
    PieChart,
    User
} from 'lucide-react';
import Link from 'next/link';

export function Sidebar() {
    return (
        <aside className="fixed left-0 top-0 h-full w-20 bg-white border-r border-gray-100 flex flex-col items-center py-8 z-50">
            <div className="mb-10 p-3 bg-black rounded-xl text-white font-bold text-xl">
                Od
            </div>

            <nav className="flex flex-col gap-6 w-full items-center">
                <Link href="/" className="p-3 bg-gray-100 rounded-xl text-black hover:bg-gray-200 transition-colors">
                    <LayoutDashboard size={20} />
                </Link>
                <Link href="/settings" className="p-3 text-gray-400 hover:text-black hover:bg-gray-50 rounded-xl transition-colors">
                    <Settings size={20} />
                </Link>
            </nav>

            <div className="mt-auto flex flex-col gap-6 items-center">
                {/* Placeholder for future notifications */}
            </div>
        </aside>
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

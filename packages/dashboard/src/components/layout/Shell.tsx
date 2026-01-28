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
                <button className="p-3 text-gray-400 hover:text-black hover:bg-gray-50 rounded-xl transition-colors">
                    <PieChart size={20} />
                </button>
                <button className="p-3 text-gray-400 hover:text-black hover:bg-gray-50 rounded-xl transition-colors">
                    <User size={20} />
                </button>
                <button className="p-3 text-gray-400 hover:text-black hover:bg-gray-50 rounded-xl transition-colors">
                    <Settings size={20} />
                </button>
            </nav>

            <div className="mt-auto flex flex-col gap-6 items-center">
                <button className="p-3 text-gray-400 hover:text-black hover:bg-gray-50 rounded-xl transition-colors">
                    <Bell size={20} />
                </button>
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                    K
                </div>
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
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="pl-12 pr-4 py-3 rounded-full border-none bg-white shadow-soft w-64 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>
                <button className="w-12 h-12 rounded-full bg-white shadow-soft flex items-center justify-center text-gray-600 hover:text-primary transition-colors">
                    <Mic size={20} />
                </button>
                <button className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center shadow-lg hover:bg-gray-800 transition-colors">
                    <Plus size={24} />
                </button>
            </div>
        </header>
    );
}

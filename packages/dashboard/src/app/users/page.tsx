'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { User } from '@/lib/types';
import { Header } from '@/components/layout/Shell';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, User as UserIcon } from 'lucide-react';
import { Card } from '@tremor/react';

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [offset, setOffset] = useState(0);
    const [total, setTotal] = useState(0);
    const LIMIT = 50;

    useEffect(() => {
        loadUsers();
    }, [offset, search]);

    async function loadUsers() {
        setLoading(true);
        try {
            const data = await api.getUsers(LIMIT, offset, search);
            setUsers(data.users);
            setTotal(data.pagination.total);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="p-6 md:p-10 max-w-7xl mx-auto mb-20">
            <Header title="Users" />

            <div className="mb-6 flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search by User ID..."
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setOffset(0);
                        }}
                    />
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-40 bg-gray-100 rounded-3xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.map((user) => (
                        <Link key={user.user_id} href={`/users/${user.user_id}`}>
                            <div className="group p-6 bg-white rounded-3xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer h-full">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                        <UserIcon size={24} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-400">
                                        {user.total_events} events
                                    </span>
                                </div>
                                <h3 className="font-mono text-sm mb-1 text-gray-900 truncate" title={user.user_id}>
                                    {user.user_id}
                                </h3>
                                <p className="text-xs text-gray-400">
                                    Last seen {new Date(user.last_seen).toLocaleDateString()}
                                </p>
                                {user.last_app && (
                                    <div className="mt-4 inline-block px-2 py-1 bg-gray-50 rounded-lg text-xs font-medium text-gray-500">
                                        {user.last_app}
                                    </div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {!loading && users.length === 0 && (
                <div className="text-center py-20">
                    <p className="text-gray-400">No users found</p>
                </div>
            )}

            {total > LIMIT && (
                <div className="mt-8 flex justify-center gap-2">
                    <button
                        disabled={offset === 0}
                        onClick={() => setOffset(Math.max(0, offset - LIMIT))}
                        className="p-2 rounded-xl disabled:opacity-30 hover:bg-gray-100"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="py-2 px-4 text-sm text-gray-500">
                        Page {Math.floor(offset / LIMIT) + 1} of {Math.ceil(total / LIMIT)}
                    </span>
                    <button
                        disabled={offset + LIMIT >= total}
                        onClick={() => setOffset(offset + LIMIT)}
                        className="p-2 rounded-xl disabled:opacity-30 hover:bg-gray-100"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
        </main>
    );
}

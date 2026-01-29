import { Tooltip } from '@/components/ui/Tooltip';
import clsx from 'clsx';
import { useMemo } from 'react';

interface ActivityHeatmapProps {
    data: { date: string; count: number, user_count?: number }[];
    year?: number;
}

export function ActivityHeatmap({ data, year = new Date().getFullYear() }: ActivityHeatmapProps) {
    // Generate all days for the last 365 days
    const days = useMemo(() => {
        const today = new Date();
        const days = [];
        // Start from 365 days ago
        for (let i = 364; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const point = data.find(d => d.date === dateStr);
            days.push({
                date: dateStr,
                dateObj: date,
                count: point?.count || 0,
                user_count: point?.user_count || 0
            });
        }
        return days;
    }, [data]);

    // Calculate levels for coloring (0-4) based on user_count (active users)
    // If user_count is 0 but events > 0 (legacy data), maybe fallback to events? 
    // But user asked to track "if any user used the app". 
    // Let's rely on user_count.
    const maxCount = Math.max(...days.map(d => d.user_count), 1);

    // Split into weeks (cols)
    const weeks = useMemo(() => {
        const weeks: (typeof days)[] = [];
        let currentWeek: typeof days = [];

        days.forEach((day, i) => {
            currentWeek.push(day);
            // End of week or last day
            if (currentWeek.length === 7 || i === days.length - 1) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
        });
        return weeks;
    }, [days]);

    const getLevel = (count: number) => {
        if (count === 0) return 0;
        if (count >= maxCount) return 4;
        // Simple quartile bucket
        const ratio = count / maxCount;
        if (ratio > 0.75) return 4;
        if (ratio > 0.5) return 3;
        if (ratio > 0.25) return 2;
        return 1;
    };

    const getColor = (level: number) => {
        switch (level) {
            case 0: return 'bg-gray-100 dark:bg-gray-800';
            case 1: return 'bg-orange-200 dark:bg-orange-900/40';
            case 2: return 'bg-orange-300 dark:bg-orange-800/60';
            case 3: return 'bg-orange-400 dark:bg-orange-600';
            case 4: return 'bg-orange-500 dark:bg-orange-500';
            default: return 'bg-gray-100';
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Daily Active Users</h3>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>Less</span>
                    <div className="flex gap-1">
                        <div className="w-2.5 h-2.5 rounded-sm bg-gray-100 dark:bg-gray-800" />
                        <div className="w-2.5 h-2.5 rounded-sm bg-orange-200 dark:bg-orange-900/40" />
                        <div className="w-2.5 h-2.5 rounded-sm bg-orange-300 dark:bg-orange-800/60" />
                        <div className="w-2.5 h-2.5 rounded-sm bg-orange-400 dark:bg-orange-600" />
                        <div className="w-2.5 h-2.5 rounded-sm bg-orange-500 dark:bg-orange-500" />
                    </div>
                    <span>More</span>
                </div>
            </div>

            <div className="overflow-x-auto no-scrollbar pb-2">
                <div className="flex gap-1 min-w-max">
                    {weeks.map((week, i) => (
                        <div key={i} className="flex flex-col gap-1">
                            {week.map(day => (
                                <Tooltip key={day.date} content={
                                    <div className="text-center">
                                        <div className="font-bold">{day.user_count} Users</div>
                                        <div className="text-xs opacity-80">{day.count} Events</div>
                                        <div className="text-[10px] opacity-60 mt-1">{day.date}</div>
                                    </div>
                                }>
                                    <div
                                        className={clsx(
                                            "w-2.5 h-2.5 rounded-sm transition-colors hover:ring-1 hover:ring-black/20 dark:hover:ring-white/20",
                                            getColor(getLevel(day.user_count))
                                        )}
                                    />
                                </Tooltip>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

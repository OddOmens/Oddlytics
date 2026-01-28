import { Card, Metric, Text } from '@tremor/react';
import clsx from 'clsx';
import { ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    description?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    icon?: React.ReactNode;
    className?: string; // Allow grid positioning classes
    variant?: 'white' | 'black';
}

export function StatsCard({
    title,
    value,
    description,
    trend,
    icon,
    className,
    variant = 'white'
}: StatsCardProps) {
    const isBlack = variant === 'black';

    return (
        <div className={clsx(
            "rounded-3xl p-6 flex flex-col justify-between relative shadow-soft transition-transform hover:scale-[1.01] duration-300",
            isBlack
                ? "bg-black text-white dark:bg-[#0a0a0a]"
                : "bg-white text-gray-900 dark:bg-gray-800 dark:text-white",
            className
        )}>
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    {icon && (
                        <div className={clsx(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            isBlack ? "bg-white/10" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                        )}>
                            {icon}
                        </div>
                    )}
                    <span className={clsx("font-medium", isBlack ? "text-gray-300" : "text-gray-500 dark:text-gray-400")}>
                        {title}
                    </span>
                </div>
                <button className={clsx(
                    "p-1 rounded-full",
                    isBlack ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-100 text-gray-400"
                )}>
                    <MoreHorizontal size={20} />
                </button>
            </div>

            <div>
                <h3 className="text-3xl font-bold mb-2 tracking-tight">{value.toLocaleString()}</h3>
                {description && (
                    <p className={clsx("text-sm", isBlack ? "text-gray-400" : "text-gray-500 dark:text-gray-400")}>
                        {description}
                    </p>
                )}
            </div>

            {trend && (
                <div className="mt-4 flex items-center gap-2">
                    <div className={clsx(
                        "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                        trend.isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                        {trend.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {Math.abs(trend.value)}%
                    </div>
                    <span className={clsx("text-xs", isBlack ? "text-gray-500" : "text-gray-400 dark:text-gray-500")}>vs last month</span>
                </div>
            )}
        </div>
    );
}

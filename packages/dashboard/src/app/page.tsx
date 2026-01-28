import { getOverview } from '@/lib/api';
import { Overview } from '@/components/Overview';

export default async function Home() {
    try {
        const data = await getOverview();

        return (
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                    Dashboard
                </h2>
                <Overview data={data} />
            </div>
        );
    } catch (error) {
        return (
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                    Dashboard
                </h2>
                <p className="text-red-600">
                    Failed to load analytics data. Make sure the API is running.
                </p>
            </div>
        );
    }
}

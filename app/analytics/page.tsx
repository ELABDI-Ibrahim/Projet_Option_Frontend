'use client';

import { useATS } from '@/lib/ats-context';
import { AnalyticsTab } from '@/components/analytics-tab';

export default function AnalyticsPage() {
    const { candidates, jobOffers } = useATS();

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 pt-0 h-full flex flex-col overflow-y-auto">
            <AnalyticsTab candidates={candidates} jobOffers={jobOffers} />
        </div>
    );
}

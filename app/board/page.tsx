'use client';

import { useATS } from '@/lib/ats-context';
import { JobBoardTab } from '@/components/job-board-tab';

export default function JobBoardPage() {
    const { jobOffers, addJobOffer, updateJobStatus } = useATS();

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 pt-0">
            <JobBoardTab
                jobOffers={jobOffers}
                onAddJobOffer={addJobOffer}
                onToggleOfferStatus={updateJobStatus}
            />
        </div>
    );
}

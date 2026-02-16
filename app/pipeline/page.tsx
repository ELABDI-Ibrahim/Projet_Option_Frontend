'use client';

import { useATS } from '@/lib/ats-context';
import { PipelineTab } from '@/components/pipeline-tab';

export default function PipelinePage() {
    const { candidates, jobOffers, updateCandidateStatus, updateCandidateStage } = useATS();

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 pt-0 h-full flex flex-col overflow-hidden">
            <PipelineTab
                jobOffers={jobOffers}
                candidates={candidates}
                onUpdateStage={updateCandidateStage}
                onUpdateStatus={updateCandidateStatus}
                onUpdateRound={() => Promise.resolve()}
            />
        </div>
    );
}

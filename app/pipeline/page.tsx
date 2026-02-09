'use client';

import { useATS } from '@/lib/ats-context';
import { PipelineTab } from '@/components/pipeline-tab';

export default function PipelinePage() {
    const { candidates, jobOffers, updateCandidateStatus, updateCandidateStage } = useATS();

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 pt-0">
            <PipelineTab
                candidates={candidates}
                jobOffers={jobOffers}
                onUpdateStatus={updateCandidateStatus}
                onUpdateRound={() => { }}
                onUpdateStage={updateCandidateStage}
            />
        </div>
    );
}

'use client';

import { useATS } from '@/lib/ats-context';
import { OffersTab } from '@/components/offers-tab';

export default function OffersPage() {
    const {
        jobOffers,
        candidates,
        addCandidate,
        scoreCandidates,
        updateJobRounds,
        updateJobStatus,
        updateCandidateResume,
        updateCandidateLinkedIn
    } = useATS();

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 pt-0">
            <OffersTab
                jobOffers={jobOffers}
                candidates={candidates}
                onAddCandidate={addCandidate}
                onScoreCandidates={scoreCandidates}
                onEnrichCandidate={() => { }}
                onUpdateRounds={updateJobRounds}
                onToggleOfferStatus={updateJobStatus}
                onEnrichWithLinkedIn={updateCandidateResume}
                onUpdateCandidateLinkedIn={updateCandidateLinkedIn}
            />
        </div>
    );
}

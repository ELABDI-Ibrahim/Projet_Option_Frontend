'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Briefcase, ListTodo, TrendingUp, Settings, FileText } from "lucide-react";
import { OffersTab } from '@/components/offers-tab';
import { JobBoardTab } from '@/components/job-board-tab';
import { PipelineTab } from '@/components/pipeline-tab';
import { AnalyticsTab } from '@/components/analytics-tab';
import { MOCK_CANDIDATES, MOCK_JOB_OFFERS } from '@/lib/mock-data';
import type { Candidate, JobOffer, Round } from '@/lib/mock-data';

export default function ATSApp() {
  const [candidates, setCandidates] = useState<Candidate[]>(MOCK_CANDIDATES);
  const [jobOffers, setJobOffers] = useState<JobOffer[]>(MOCK_JOB_OFFERS);

  const handleAddJobOffer = (jobData: Omit<JobOffer, 'id'>) => {
    const newJob: JobOffer = {
      ...jobData,
      id: `job-${Date.now()}`
    };
    setJobOffers([...jobOffers, newJob]);
  };

  const handleScoreCandidates = (jobId: string) => {
    // Only score candidates for the selected job offer
    setCandidates(candidates.map(candidate => {
      if (candidate.jobOfferId === jobId) {
        return {
          ...candidate,
          score: Math.floor(Math.random() * 100) + 1
        };
      }
      return candidate;
    }));
  };

  const handleEnrichCandidate = (candidateId: string) => {
    setCandidates(candidates.map(c => {
      if (c.id === candidateId && !c.enriched) {
        return {
          ...c,
          enriched: true,
          about: c.about || 'Enriched profile with additional LinkedIn data and insights.'
        };
      }
      return c;
    }));
  };

  const handleAddCandidate = (candidate: Candidate) => {
    setCandidates([...candidates, candidate]);
  };

  const handleUpdateStatus = (candidateId: string, status: 'Pending' | 'Next Round' | 'Declined') => {
    setCandidates(candidates.map(c => 
      c.id === candidateId ? { ...c, status } : c
    ));
  };

  const handleUpdateRound = (candidateId: string, roundIndex: number) => {
    setCandidates(candidates.map(c => 
      c.id === candidateId ? { ...c, currentRound: roundIndex } : c
    ));
  };

  const handleUpdateRounds = (jobId: string, rounds: Round[]) => {
    setJobOffers(jobOffers.map(job => 
      job.id === jobId ? { ...job, rounds } : job
    ));
  };

  const handleEnrichWithLinkedIn = (candidateId: string, linkedinData: any) => {
    console.log('[v0] Updating candidate with LinkedIn data:', candidateId, linkedinData);
    setCandidates(candidates.map(c => 
      c.id === candidateId ? { ...c, linkedinData, enriched: true } : c
    ));
  };

  const handleToggleOfferStatus = (jobId: string) => {
    setJobOffers(jobOffers.map(job => {
      if (job.id === jobId) {
        return {
          ...job,
          status: job.status === 'Open' ? 'Closed' : 'Open'
        };
      }
      return job;
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white p-2.5 rounded-lg shadow-sm">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">CVthèque ATS</h1>
                <p className="text-sm text-slate-500 mt-0.5">Applicant Tracking & Resume Management</p>
              </div>
            </div>
            <div className="flex gap-2 text-sm">
              <div className="bg-blue-50 px-3 py-2 rounded-lg text-blue-700 font-medium">
                {candidates.length} Candidates
              </div>
              <div className="bg-green-50 px-3 py-2 rounded-lg text-green-700 font-medium">
                {jobOffers.length} Open Roles
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6">

        {/* Tabs */}
        <Tabs defaultValue="offers" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-white p-1 border border-slate-200 rounded-lg shadow-sm">
            <TabsTrigger 
              value="offers" 
              className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-all"
            >
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">Offers</span>
            </TabsTrigger>
            <TabsTrigger 
              value="board" 
              className="gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white rounded-md transition-all"
            >
              <ListTodo className="w-4 h-4" />
              <span className="hidden sm:inline">Job Board</span>
            </TabsTrigger>
            <TabsTrigger 
              value="pipeline" 
              className="gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-md transition-all"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Pipeline</span>
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="gap-2 data-[state=active]:bg-orange-600 data-[state=active]:text-white rounded-md transition-all"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Offers & Candidates Tab */}
          <TabsContent value="offers" className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200 rounded-xl p-4 text-sm">
              <p className="font-semibold text-blue-900">Select & Score Candidates</p>
              <p className="mt-1 text-blue-800 text-xs">Choose a job offer to view applicants. Use automated scoring to rank candidates by skill match.</p>
            </div>
            <OffersTab
              jobOffers={jobOffers}
              candidates={candidates}
              onAddCandidate={handleAddCandidate}
              onScoreCandidates={handleScoreCandidates}
              onEnrichCandidate={handleEnrichCandidate}
              onUpdateRounds={handleUpdateRounds}
              onToggleOfferStatus={handleToggleOfferStatus}
              onEnrichWithLinkedIn={handleEnrichWithLinkedIn}
            />
          </TabsContent>

          {/* Job Board Tab */}
          <TabsContent value="board" className="space-y-4">
            <div className="bg-gradient-to-r from-green-50 to-green-100/50 border border-green-200 rounded-xl p-4 text-sm">
              <p className="font-semibold text-green-900">Manage Job Offers</p>
              <p className="mt-1 text-green-800 text-xs">View all open positions and create new job offers for your recruitment pipeline.</p>
            </div>
            <JobBoardTab 
              jobOffers={jobOffers} 
              onAddJobOffer={handleAddJobOffer}
              onToggleOfferStatus={handleToggleOfferStatus}
            />
          </TabsContent>

          {/* Pipeline Tab */}
          <TabsContent value="pipeline" className="space-y-4">
            <div className="bg-gradient-to-r from-purple-50 to-purple-100/50 border border-purple-200 rounded-xl p-4 text-sm">
              <p className="font-semibold text-purple-900">Manage Hiring Pipeline</p>
              <p className="mt-1 text-purple-800 text-xs">Select a job, then move candidates through stages: Pending Review → Next Round → Declined.</p>
            </div>
            <PipelineTab
              candidates={candidates}
              jobOffers={jobOffers}
              onUpdateStatus={handleUpdateStatus}
              onUpdateRound={handleUpdateRound}
            />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-200 rounded-xl p-4 text-sm">
              <p className="font-semibold text-orange-900">Recruitment Analytics</p>
              <p className="mt-1 text-orange-800 text-xs">Track metrics: candidate sources, pipeline stages, skills distribution, and hiring performance.</p>
            </div>
            <AnalyticsTab candidates={candidates} jobOffers={jobOffers} />
          </TabsContent>
        </Tabs>

      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 text-center text-sm text-slate-600">
          <p>Recruitment System Status: <span className="font-semibold text-blue-600">{candidates.length} Active Candidates</span> • <span className="font-semibold text-green-600">{jobOffers.length} Open Positions</span></p>
        </div>
      </div>
    </div>
  );
}

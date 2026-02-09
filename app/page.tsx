'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, ListTodo, TrendingUp, Settings } from "lucide-react";
import { OffersTab } from '@/components/offers-tab';
import { JobBoardTab } from '@/components/job-board-tab';
import { PipelineTab } from '@/components/pipeline-tab';
import { AnalyticsTab } from '@/components/analytics-tab';
import * as db from '@/lib/db-service';
import type { Candidate, JobOffer, Round } from '@/lib/mock-data';

export default function ATSApp() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobOffers, setJobOffers] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [jobsData, applicationsData] = await Promise.all([
        db.getJobOffers(),
        db.getApplications()
      ]);

      // Transform job offers with skills from first candidate's resume
      const transformedJobs = await Promise.all(
        jobsData.map(async (job) => {
          const stages = await db.getPipelineStages(job.id);
          const jobApps = applicationsData.filter(app => app.job_offer_id === job.id);
          
          // Extract skills from job applications' resumes
          const allSkills = jobApps
            .map(app => app.resume?.parsed_data?.skills || [])
            .flat()
            .filter((skill, index, self) => self.indexOf(skill) === index)
            .slice(0, 5); // Top 5 most common skills
          
          return {
            id: job.id,
            title: job.title,
            description: job.description || '',
            status: job.status as 'Open' | 'Closed',
            skills_required: allSkills,
            rounds: stages.map(s => ({ id: s.id, name: s.name, order: s.stage_order }))
          };
        })
      );

      // Transform applications to candidates with full resume data
      const transformedCandidates = applicationsData.map(app => {
        const parsedData = app.resume?.parsed_data || {};
        
        return {
          id: app.id,
          jobOfferId: app.job_offer_id,
          source: (app.candidate?.source || 'upload') as 'LinkedIn' | 'Local' | 'CVthèque',
          score: 0,
          status: app.status === 'applied' ? 'Pending' as const : 
                  app.status === 'next_round' ? 'Next Round' as const : 'Declined' as const,
          currentRound: 0,
          name: app.candidate?.full_name || parsedData.name || '',
          location: app.candidate?.location || parsedData.location || '',
          about: parsedData.summary || parsedData.about || '',
          linkedin_url: app.candidate?.linkedin_url || parsedData.linkedin_url || '',
          open_to_work: true,
          experiences: parsedData.experiences || [],
          educations: parsedData.educations || [],
          skills: parsedData.skills || [],
          enriched: app.resume?.enriched || false,
          // Store resume_id and candidate_id for reference
          resume_id: app.resume?.id,
          candidate_id: app.candidate?.id
        } as any;
      });

      setJobOffers(transformedJobs);
      setCandidates(transformedCandidates);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleAddJobOffer = async (jobData: Omit<JobOffer, 'id'>) => {
    const companies = await db.supabase.from('companies').select('*').limit(1);
    const companyId = companies.data?.[0]?.id;
    
    const newJob = await db.createJobOffer({
      company_id: companyId,
      title: jobData.title,
      description: jobData.description,
      status: 'Open'
    });
    
    await loadData();
  };

  const handleScoreCandidates = async (jobId: string) => {
    setCandidates(candidates.map(candidate => {
      if (candidate.jobOfferId === jobId) {
        return { ...candidate, score: Math.floor(Math.random() * 100) + 1 };
      }
      return candidate;
    }));
  };

  const handleAddCandidate = async (candidate: Candidate) => {
    try {
      console.log('[DB] Creating candidate:', candidate.name);

      // Get parsed data (if available)
      const parsedData = (candidate as any).parsed_data || {
        name: candidate.name,
        email: candidate.about,
        location: candidate.location,
        linkedin_url: candidate.linkedin_url,
        summary: candidate.about,
        experiences: candidate.experiences,
        educations: candidate.educations,
        skills: (candidate as any).skills || []
      };

      // Create candidate in database
      const newCandidate = await db.createCandidate({
        full_name: candidate.name,
        email: parsedData.email || null,
        phone: parsedData.phone || null,
        location: candidate.location,
        linkedin_url: candidate.linkedin_url || null,
        source: candidate.source
      });

      console.log('[DB] Candidate created:', newCandidate.id);

      // Create resume with full parsed data
      const resume = await db.createResume({
        candidate_id: newCandidate.id,
        parsed_data: parsedData,
        source: candidate.source,
        enriched: candidate.enriched
      });

      console.log('[DB] Resume created:', resume.id);

      // Create application if job is selected
      if (candidate.jobOfferId) {
        await db.createApplication({
          job_offer_id: candidate.jobOfferId,
          candidate_id: newCandidate.id,
          resume_id: resume.id,
          status: 'applied'
        });
        console.log('[DB] Application created');
      }

      // Reload data from database
      await loadData();
    } catch (error) {
      console.error('[DB] Error adding candidate:', error);
    }
  };

  const handleUpdateStatus = async (candidateId: string, status: 'Pending' | 'Next Round' | 'Declined') => {
    const dbStatus = status === 'Pending' ? 'applied' : 
                     status === 'Next Round' ? 'next_round' : 'declined';
    await db.updateApplicationStatus(candidateId, dbStatus as any);
    await loadData();
  };

  const handleUpdateRounds = async (jobId: string, rounds: Round[]) => {
    await db.updatePipelineStages(jobId, rounds.map(r => ({
      job_offer_id: jobId,
      name: r.name,
      stage_order: r.order
    })));
    await loadData();
  };

  const handleToggleOfferStatus = async (jobId: string) => {
    const job = jobOffers.find(j => j.id === jobId);
    if (job) {
      await db.updateJobOfferStatus(jobId, job.status === 'Open' ? 'Closed' : 'Open');
      await loadData();
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
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
        <Tabs defaultValue="offers" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-white p-1 border border-slate-200 rounded-lg shadow-sm">
            <TabsTrigger value="offers" className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-all">
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">Offers</span>
            </TabsTrigger>
            <TabsTrigger value="board" className="gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white rounded-md transition-all">
              <ListTodo className="w-4 h-4" />
              <span className="hidden sm:inline">Job Board</span>
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-md transition-all">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Pipeline</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2 data-[state=active]:bg-orange-600 data-[state=active]:text-white rounded-md transition-all">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="offers" className="space-y-4">
            <OffersTab
              jobOffers={jobOffers}
              candidates={candidates}
              onAddCandidate={handleAddCandidate}
              onScoreCandidates={handleScoreCandidates}
              onEnrichCandidate={() => {}}
              onUpdateRounds={handleUpdateRounds}
              onToggleOfferStatus={handleToggleOfferStatus}
              onEnrichWithLinkedIn={() => {}}
            />
          </TabsContent>

          <TabsContent value="board" className="space-y-4">
            <JobBoardTab 
              jobOffers={jobOffers} 
              onAddJobOffer={handleAddJobOffer}
              onToggleOfferStatus={handleToggleOfferStatus}
            />
          </TabsContent>

          <TabsContent value="pipeline" className="space-y-4">
            <PipelineTab
              candidates={candidates}
              jobOffers={jobOffers}
              onUpdateStatus={handleUpdateStatus}
              onUpdateRound={() => {}}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsTab candidates={candidates} jobOffers={jobOffers} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
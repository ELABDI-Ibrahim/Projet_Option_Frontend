"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as db from './db-service';
import { Candidate, JobOffer, Round } from './types';

interface ATSContextType {
    candidates: Candidate[];
    jobOffers: JobOffer[];
    loading: boolean;
    refreshData: () => Promise<void>;
    addJobOffer: (jobData: Omit<JobOffer, 'id'>) => Promise<void>;
    updateJobStatus: (jobId: string) => Promise<void>;
    addCandidate: (candidate: any) => Promise<void>;
    updateCandidateStatus: (candidateId: string, status: 'Pending' | 'Next Round' | 'Declined') => Promise<void>;
    updateCandidateStage: (candidateId: string, stageId: string) => Promise<void>;
    updateJobRounds: (jobId: string, rounds: Round[]) => Promise<void>;
    scoreCandidates: (jobId: string) => Promise<void>;
    updateCandidateResume: (candidateId: string, updates: any) => Promise<void>;
}

const ATSContext = createContext<ATSContextType | undefined>(undefined);

export function ATSProvider({ children }: { children: React.ReactNode }) {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [jobOffers, setJobOffers] = useState<JobOffer[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [jobsData, candidatesData, applicationsData] = await Promise.all([
                db.getJobOffers(),
                db.getCandidates(),
                db.getApplications()
            ]);

            // Transform job offers with their stages and skills
            const transformedJobs = await Promise.all(
                jobsData.map(async (job) => {
                    const stages = await db.getPipelineStages(job.id);
                    const jobApps = applicationsData.filter(app => app.job_offer_id === job.id);

                    // Flatten skills to strings to avoid "Objects are not valid as React child" error
                    const allSkills = jobApps
                        .map(app => app.resume?.parsed_data?.skills || [])
                        .flat()
                        .flatMap((skill: any) => {
                            if (typeof skill === 'string') return skill;
                            if (typeof skill === 'object' && skill.items && Array.isArray(skill.items)) {
                                return skill.items;
                            }
                            return [];
                        })
                        .filter((skill, index, self) => self.indexOf(skill) === index)
                        .slice(0, 5);

                    return {
                        id: job.id,
                        title: job.title,
                        description: job.description || '',
                        status: job.status as 'Open' | 'Closed',
                        skills_required: allSkills,
                        rounds: stages.map(s => ({ id: s.id, name: s.name, order: s.stage_order })),
                        candidateCount: jobApps.length
                    };
                })
            );

            // Transform candidates with their application data
            const transformedCandidates = applicationsData.map(app => {
                const candidate = app.candidate;
                const resume = app.resume;

                // Safely handle resume data
                const parsedData = resume?.parsed_data || {};

                return {
                    id: candidate.id,
                    resume_id: resume?.id, // Important for updates
                    jobOfferId: app.job_offer_id,
                    source: candidate.source as any,
                    score: 0, // Scores are fetched separately if needed, or we can fetch them here
                    status: (app.status === 'shortlisted' ? 'Next Round' :
                        app.status === 'declined' ? 'Declined' : 'Pending') as any,
                    currentRound: 0, // Visual mostly
                    currentStageId: app.current_stage_id,

                    // Resume Data
                    name: candidate.full_name,
                    email: candidate.email,
                    location: candidate.location || parsedData.location || '',
                    about: parsedData.summary || parsedData.about || '',
                    linkedin_url: candidate.linkedin_url || parsedData.linkedin_url || '',
                    open_to_work: parsedData.open_to_work ?? true,

                    experiences: parsedData.experiences || [],
                    educations: parsedData.educations || [],
                    skills: parsedData.skills || [],
                    projects: parsedData.projects || [],
                    contacts: parsedData.contacts || [],
                    accomplishments: parsedData.accomplishments || [],
                    interests: parsedData.interests || [],

                    enriched: resume?.enriched || false,
                    linkedinData: parsedData.linkedinData
                };
            });

            setJobOffers(transformedJobs);
            setCandidates(transformedCandidates);
        } catch (error) {
            console.error('[ATS Context] Error loading data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const addJobOffer = async (jobData: Omit<JobOffer, 'id'>) => {
        try {
            const newJob = await db.createJobOffer({
                title: jobData.title,
                description: jobData.description,
                status: 'Open',
                skills_required: jobData.skills_required || []
            });

            if (newJob) {
                // Create default stages
                const defaultStages = [
                    { name: 'Applied', stage_order: 0 },
                    { name: 'Screening', stage_order: 1 },
                    { name: 'Interview', stage_order: 2 },
                    { name: 'Offer', stage_order: 3 },
                    { name: 'Hired', stage_order: 4 }
                ];
                await db.updatePipelineStages(newJob.id, defaultStages);
                await loadData();
            }
        } catch (error) {
            console.error('[ATS Context] Error adding job offer:', error);
            throw error;
        }
    };

    const updateJobStatus = async (jobId: string) => {
        try {
            const job = jobOffers.find(j => j.id === jobId);
            if (job) {
                const newStatus = job.status === 'Open' ? 'Closed' : 'Open';
                await db.updateJobOfferStatus(jobId, newStatus);
                await loadData();
            }
        } catch (error) {
            console.error('[ATS Context] Error updating job status:', error);
        }
    };

    const addCandidate = async (candidate: any) => {
        try {
            console.log('[ATS Context] Adding candidate:', candidate);

            let candidateId: string;
            let existingCandidate: Candidate | null = null;

            // Check if email exists
            if (candidate.email) {
                const { data: existing } = await db.supabase
                    .from('candidates')
                    .select('*')
                    .eq('email', candidate.email)
                    .single();

                if (existing) {
                    console.log('[ATS Context] Candidate matches existing email:', existing.id);
                    existingCandidate = existing as Candidate;
                    candidateId = existing.id;

                    // Optional: Update existing candidate details if needed?
                    // For now, let's just use the ID.
                } else {
                    // Create new
                    const newCandidate = await db.createCandidate({
                        full_name: candidate.name,
                        email: candidate.email,
                        phone: candidate.phone,
                        linkedin_url: candidate.linkedin_url,
                        location: candidate.location,
                        source: candidate.source || 'upload'
                    });
                    if (!newCandidate) throw new Error('Failed to create candidate');
                    candidateId = newCandidate.id;
                }
            } else {
                // No email, create new (weak check)
                const newCandidate = await db.createCandidate({
                    full_name: candidate.name,
                    email: candidate.email,
                    phone: candidate.phone,
                    linkedin_url: candidate.linkedin_url,
                    location: candidate.location,
                    source: candidate.source || 'upload'
                });
                if (!newCandidate) throw new Error('Failed to create candidate');
                candidateId = newCandidate.id;
            }


            // 2. Create/Update Resume
            // If candidate existed, they might already have a resume. 
            // The user uploaded a NEW resume file, so we probably want to add it.
            // But our schema seems to link Application -> Resume.

            // Let's create a new resume entry for this specific upload
            const parsedData = {
                name: candidate.name,
                email: candidate.email,
                phone: candidate.phone,
                location: candidate.location,
                linkedin_url: candidate.linkedin_url,
                summary: candidate.about,
                experiences: candidate.experiences || [],
                educations: candidate.educations || [],
                skills: candidate.skills || [],
                projects: candidate.projects || [],
                contacts: candidate.contacts || [],
                accomplishments: candidate.accomplishments || [],
                interests: candidate.interests || [],
                open_to_work: candidate.open_to_work ?? true,
                linkedinData: candidate.linkedinData
            };

            const newResume = await db.createResume({
                candidate_id: candidateId,
                parsed_data: parsedData,
                source: 'upload',
                enriched: candidate.enriched || false
            });

            // 3. Create Application
            // Check if already applied to this job?
            // For now, allow multiple applications or rely on DB constraints?
            // Schema doesn't enforce unique (job_id, candidate_id).

            const stages = await db.getPipelineStages(candidate.jobOfferId);
            const firstStage = stages[0];

            await db.createApplication({
                job_offer_id: candidate.jobOfferId,
                candidate_id: candidateId,
                resume_id: newResume.id,
                current_stage_id: firstStage?.id,
                status: 'applied'
            });

            await loadData();
        } catch (error) {
            console.error('[ATS Context] Error adding candidate:', error);
            throw error;
        }
    };

    const updateCandidateStatus = async (candidateId: string, status: 'Pending' | 'Next Round' | 'Declined') => {
        try {
            // Find application ID for this candidate (assuming one active app for simplicity or mapping correctly)
            // In our loadData, we didn't store appId directly on Candidate object (we flattened it).
            // We need to find the application ID.

            const applications = await db.getApplications(); // This is expensive, better if we stored appId.
            // But let's assume valid candidateId points to a unique candidate.
            const app = applications.find(a => a.candidate_id === candidateId);

            if (app) {
                const dbStatus = status === 'Next Round' ? 'shortlisted' :
                    status === 'Declined' ? 'declined' : 'applied';
                await db.updateApplicationStatus(app.id, dbStatus);
                await loadData();
            }
        } catch (error) {
            console.error('[ATS Context] Error updating candidate status:', error);
        }
    };

    const updateCandidateStage = async (candidateId: string, stageId: string) => {
        try {
            const applications = await db.getApplications();
            const app = applications.find(a => a.candidate_id === candidateId);

            if (app) {
                await db.updateApplicationStage(app.id, stageId);
                await loadData();
            }
        } catch (error) {
            console.error('[ATS Context] Error updating candidate stage:', error);
        }
    };

    const updateJobRounds = async (jobId: string, rounds: Round[]) => {
        try {
            await db.updatePipelineStages(jobId, rounds.map(r => ({
                name: r.name,
                stage_order: r.order,
                job_offer_id: jobId,
                id: r.id
            })));
            await loadData();
        } catch (error) {
            console.error('[ATS Context] Error updating job rounds:', error);
        }
    };

    const scoreCandidates = async (jobId: string) => {
        // Placeholder for scoring logic integration
        console.log('[ATS Context] Scoring candidates for job:', jobId);
    };

    const updateCandidateResume = async (candidateId: string, linkedInData: any) => {
        try {
            const candidate = candidates.find(c => c.id === candidateId);
            if (!candidate || !(candidate as any).resume_id) {
                console.error('[ATS Context] No resume found for candidate:', candidateId);
                return;
            }

            console.log('[ATS Context] Enriching resume with LinkedIn data:', linkedInData);

            // Get current resume data
            const currentResume = await db.getResume((candidate as any).resume_id);
            const currentParsedData = currentResume.parsed_data || {};

            // Merge LinkedIn data into parsed_data
            const updatedParsedData = {
                ...currentParsedData,
                linkedinData: linkedInData
            };

            // Update resume with enriched data
            await db.updateResumeData((candidate as any).resume_id, updatedParsedData);

            // Also update enriched flag
            await db.updateResume((candidate as any).resume_id, { enriched: true });

            await loadData();
            console.log('[ATS Context] Resume enriched successfully');
        } catch (error) {
            console.error('[ATS Context] Error updating resume:', error);
        }
    };

    const updateCandidateLinkedIn = async (candidateId: string, linkedInUrl: string) => {
        try {
            console.log('[ATS Context] Updating LinkedIn URL for candidate:', candidateId, linkedInUrl);

            const candidate = candidates.find(c => c.id === candidateId);
            if (!candidate) {
                console.error('[ATS Context] Candidate not found:', candidateId);
                return;
            }

            // Update candidate's linkedin_url in candidates table
            await db.updateCandidate(candidateId, { linkedin_url: linkedInUrl });

            // If candidate has a resume, also update parsed_data.linkedin_url
            if ((candidate as any).resume_id) {
                const currentResume = await db.getResume((candidate as any).resume_id);
                const updatedParsedData = {
                    ...currentResume.parsed_data,
                    linkedin_url: linkedInUrl
                };
                await db.updateResumeData((candidate as any).resume_id, updatedParsedData);
            }

            await loadData();
            console.log('[ATS Context] LinkedIn URL updated successfully');
        } catch (error) {
            console.error('[ATS Context] Error updating LinkedIn URL:', error);
        }
    };

    const value = {
        candidates,
        jobOffers,
        loading,
        refreshData: loadData,
        addJobOffer,
        updateJobStatus,
        addCandidate,
        updateCandidateStatus,
        updateCandidateStage,
        updateJobRounds,
        scoreCandidates,
        updateCandidateResume,
        updateCandidateLinkedIn
    };

    return (
        <ATSContext.Provider value={value}>
            {children}
        </ATSContext.Provider>
    );
}

export function useATS() {
    const context = useContext(ATSContext);
    if (context === undefined) {
        throw new Error('useATS must be used within an ATSProvider');
    }
    return context;
}

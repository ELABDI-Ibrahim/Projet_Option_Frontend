"use client";

import { useState } from 'react';
import { useATS } from '@/lib/ats-context';
import { useError } from '@/lib/error-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Download, Eye, Linkedin, Search, Sparkles } from "lucide-react";
import { ResumeViewer } from '@/components/resume-viewer';
import { findLinkedInProfile, enrichResume } from '@/lib/api-service';
import { getStorageUrl } from '@/lib/utils';

export default function LakePage() {
    const { resumes, updateResume, updateCandidateResume, updateCandidateLinkedIn, refreshData } = useATS();
    const { showError } = useError();
    const [viewerOpen, setViewerOpen] = useState(false);
    const [selectedResume, setSelectedResume] = useState<any>(null);
    const [enrichLoadingId, setEnrichLoadingId] = useState<string | null>(null);

    // Bulk Enrich State
    const [bulkEnriching, setBulkEnriching] = useState(false);
    const [enrichProgress, setEnrichProgress] = useState({ current: 0, total: 0 });

    // Map Resume to Candidate-like object for Viewer
    const mapResumeToCandidate = (resume: any) => {
        const parsed = resume.parsed_data || {};
        const candidate = resume.candidate || {};

        return {
            id: resume.candidate_id || resume.id,
            name: candidate.full_name || parsed.name || 'Unknown Candidate',
            email: candidate.email || parsed.email,
            location: candidate.location || parsed.location,
            linkedin_url: candidate.linkedin_url || parsed.linkedin_url,
            source: resume.source,
            score: 0,
            status: 'Pending',
            currentRound: 0,
            open_to_work: parsed.open_to_work ?? true,
            about: parsed.summary || parsed.about,
            experiences: parsed.experiences || [],
            educations: parsed.educations || [],
            skills: parsed.skills || [],
            projects: parsed.projects || [],
            contacts: parsed.contacts || [],
            accomplishments: parsed.accomplishments || [],
            interests: parsed.interests || [],
            enriched: resume.enriched,
            linkedinData: parsed.linkedinData,
            file_url: getStorageUrl(resume.file_url) || undefined
        };
    };

    const handleView = (resume: any) => {
        setSelectedResume(mapResumeToCandidate(resume));
        setViewerOpen(true);
    };

    const handleEnrich = async (resume: any) => {
        const candidateId = resume.candidate_id;
        if (!candidateId) {
            showError("Cannot enrich resume without a linked candidate ID.", "Enrichment Error");
            return;
        }

        setEnrichLoadingId(resume.id);

        try {
            console.log('[Lake] Enriching resume:', resume.id);
            const candidate = resume.candidate || {};
            const parsed = resume.parsed_data || {};

            // Construct ResumeParseData from candidate/parsed fields
            // This is crucial: we need to pass the existing data to enrichResume so it can be merged/used
            const resumeData: any = {
                name: candidate.full_name || parsed.name,
                email: candidate.email || parsed.email,
                phone: candidate.phone || parsed.phone,
                location: candidate.location || parsed.location,
                about: parsed.summary || parsed.about,
                linkedin_url: candidate.linkedin_url || parsed.linkedin_url,
                experiences: parsed.experiences,
                educations: parsed.educations,
                skills: parsed.skills,
                projects: parsed.projects,
                contacts: parsed.contacts,
                accomplishments: parsed.accomplishments,
                interests: parsed.interests,
                open_to_work: parsed.open_to_work
            };

            console.log('[Lake] Calling enrichResume API...');

            // Usage of enrichResume instead of scrapeLinkedInProfile
            const newResumeData = await enrichResume(
                resumeData,
                candidate.linkedin_url || parsed.linkedin_url,
                candidate.full_name || parsed.name
            );

            console.log('[Lake] Enrichment successful, updating resume...');

            if (newResumeData) {
                // Update resume with new data (using Resume ID directly)
                await updateResume(resume.id, newResumeData);
                // Also update LinkedIn URL if discovered/changed
                if (newResumeData.linkedin_url && newResumeData.linkedin_url !== candidate.linkedin_url) {
                    await updateCandidateLinkedIn(candidateId, newResumeData.linkedin_url);
                }
            }

            await refreshData();

        } catch (error) {
            console.error('[Lake] Enrichment failed:', error);
            showError(error instanceof Error ? error.message : "Unknown error", "Enrichment Failed");
        } finally {
            setEnrichLoadingId(null);
        }
    };

    const handleEnrichAll = async () => {
        // Filter resumes that are NOT already enriched
        const unenrichedResumes = resumes.filter(r => !r.enriched && r.candidate_id);

        if (unenrichedResumes.length === 0) {
            showError("All resumes are already enriched!", "Nothing to Enrich");
            return;
        }

        setBulkEnriching(true);
        setEnrichProgress({ current: 0, total: unenrichedResumes.length });

        console.log(`[Lake] Starting bulk enrichment for ${unenrichedResumes.length} resumes...`);

        // Process sequentially to avoid rate limits
        for (let i = 0; i < unenrichedResumes.length; i++) {
            const resume = unenrichedResumes[i];
            try {
                // Update progress before starting (shows working on X/Y)
                setEnrichProgress(prev => ({ ...prev, current: i + 1 }));

                await handleEnrich(resume);

                // Small delay to be nice to the API/LinkedIn
                await new Promise(resolve => setTimeout(resolve, 2000));

            } catch (error) {
                console.error(`[Lake] Failed to enrich resume ${resume.id} during bulk process`, error);
                // Continue to next resume even if one fails
            }
        }

        setBulkEnriching(false);
        setEnrichProgress({ current: 0, total: 0 });
        await refreshData();
        console.log('[Lake] Bulk enrichment completed');
    };

    return (
        <div className="max-w-7xl mx-auto p-6 h-full flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                        Resume Lake <Badge variant="outline" className="text-sm font-normal text-slate-500 bg-slate-100">{resumes.length} Resumes</Badge>
                    </h1>
                    <p className="text-slate-500 mt-1">All resumes sorted by date. Search, View, Enrich and Download.</p>
                </div>
                <div className="flex gap-3">
                    {bulkEnriching ? (
                        <div className="flex flex-col w-48 gap-1">
                            <div className="flex justify-between text-xs text-slate-600">
                                <span>Enriching...</span>
                                <span>{enrichProgress.current} / {enrichProgress.total}</span>
                            </div>
                            <Progress value={(enrichProgress.current / enrichProgress.total) * 100} className="h-2" />
                        </div>
                    ) : (
                        <Button
                            onClick={handleEnrichAll}
                            disabled={resumes.filter(r => !r.enriched && r.candidate_id).length === 0}
                            className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
                        >
                            <Sparkles className="w-4 h-4" />
                            Enrich All ({resumes.filter(r => !r.enriched && r.candidate_id).length})
                        </Button>
                    )}
                </div>
            </div>

            <Card className="overflow-hidden border border-slate-200 shadow-sm flex-1 flex flex-col">
                <div className="overflow-y-auto flex-1">
                    <Table>
                        <TableHeader className="sticky top-0 bg-slate-50 z-10 shadow-sm">
                            <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
                                <TableHead className="font-bold text-slate-900 w-[250px]">Name</TableHead>
                                <TableHead className="font-bold text-slate-900 w-[150px]">Date Added</TableHead>
                                <TableHead className="font-bold text-slate-900">Source</TableHead>
                                <TableHead className="font-bold text-slate-900">Enriched</TableHead>
                                <TableHead className="font-bold text-slate-900 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {resumes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <Search className="w-8 h-8 text-slate-300" />
                                            <p>No resumes found in the lake.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                resumes.map((resume) => {
                                    const name = resume.candidate?.full_name || resume.parsed_data?.name || "Unknown";
                                    const date = new Date(resume.created_at).toLocaleDateString(undefined, {
                                        year: 'numeric', month: 'short', day: 'numeric'
                                    });
                                    const isEnriched = resume.enriched;

                                    return (
                                        <TableRow key={resume.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
                                            <TableCell className="font-medium text-slate-900">{name}</TableCell>
                                            <TableCell className="text-slate-500">{date}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize text-slate-600 bg-slate-50 font-normal">
                                                    {resume.source}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {isEnriched ? (
                                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 shadow-none border border-green-200 font-medium">Yes</Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="text-slate-500 bg-slate-100 hover:bg-slate-100 shadow-none font-normal">No</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button size="sm" variant="ghost" onClick={() => handleView(resume)} title="View Resume" className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50">
                                                        <Eye className="w-4 h-4" />
                                                    </Button>

                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleEnrich(resume)}
                                                        disabled={isEnriched || enrichLoadingId === resume.id || !resume.candidate_id || bulkEnriching}
                                                        title={isEnriched ? "Already Enriched" : "Enrich from LinkedIn"}
                                                        className={`h-8 w-8 p-0 ${isEnriched ? 'text-green-600 opacity-50 cursor-default' : 'text-blue-600 hover:bg-blue-50'}`}
                                                    >
                                                        {enrichLoadingId === resume.id ? (
                                                            <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></span>
                                                        ) : (
                                                            <Linkedin className="w-4 h-4" />
                                                        )}
                                                    </Button>

                                                    {resume.file_url ? (
                                                        <a href={getStorageUrl(resume.file_url) || '#'} target="_blank" rel="noopener noreferrer" title="Download Resume">
                                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100">
                                                                <Download className="w-4 h-4" />
                                                            </Button>
                                                        </a>
                                                    ) : (
                                                        <Button size="sm" variant="ghost" disabled title="No File" className="h-8 w-8 p-0 text-slate-300">
                                                            <Download className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            <ResumeViewer
                candidate={selectedResume}
                open={viewerOpen}
                onOpenChange={setViewerOpen}
            />
        </div>
    );
}

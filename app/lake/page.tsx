"use client";

import { useState } from 'react';
import { useATS } from '@/lib/ats-context';
import { useError } from '@/lib/error-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Download, Eye, Linkedin, Search } from "lucide-react";
import { ResumeViewer } from '@/components/resume-viewer';
import { findLinkedInProfile, scrapeLinkedInProfile } from '@/lib/api-service';
import { getStorageUrl } from '@/lib/utils';

export default function LakePage() {
    const { resumes, updateCandidateResume, updateCandidateLinkedIn, refreshData } = useATS();
    const { showError } = useError();
    const [viewerOpen, setViewerOpen] = useState(false);
    const [selectedResume, setSelectedResume] = useState<any>(null);
    const [enrichLoadingId, setEnrichLoadingId] = useState<string | null>(null);

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
            let linkedInUrl = resume.candidate?.linkedin_url || resume.parsed_data?.linkedin_url;
            const name = resume.candidate?.full_name || resume.parsed_data?.name;

            if (!linkedInUrl) {
                console.log('[Lake] No LinkedIn URL, discovering...');
                // Try to find LinkedIn URL
                const company = resume.parsed_data?.experiences?.[0]?.institution_name;
                const location = resume.candidate?.location || resume.parsed_data?.location;

                linkedInUrl = await findLinkedInProfile(name, company, location);

                if (linkedInUrl) {
                    // Update candidate LinkedIn URL
                    await updateCandidateLinkedIn(candidateId, linkedInUrl);
                }
            }

            if (!linkedInUrl) {
                throw new Error(`Could not find LinkedIn profile for ${name}`);
            }

            console.log('[Lake] Scraping LinkedIn:', linkedInUrl);
            const linkedInData = await scrapeLinkedInProfile(linkedInUrl, name);

            if (linkedInData) {
                console.log('[Lake] Enrichment successful, updating resume...');
                await updateCandidateResume(candidateId, linkedInData);
                await refreshData();
            } else {
                throw new Error("Failed to scrape LinkedIn data");
            }

        } catch (error) {
            console.error('[Lake] Enrichment failed:', error);
            showError(error instanceof Error ? error.message : "Unknown error", "Enrichment Failed");
        } finally {
            setEnrichLoadingId(null);
        }
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
                                                        disabled={isEnriched || enrichLoadingId === resume.id || !resume.candidate_id}
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

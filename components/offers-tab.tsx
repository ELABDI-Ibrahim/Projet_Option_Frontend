'use client';

import React from "react"

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Zap, Plus, Upload, Search, Lock, Unlock, Linkedin, Download } from "lucide-react";
import { ResumeViewer } from './resume-viewer';
import { RoundsEditor } from './rounds-editor';
import { enrichCandidateFromResume, uploadResume } from '@/lib/api-service';
import type { Candidate, JobOffer, Round } from '@/lib/types';
import { useError } from '@/lib/error-context';
import { useATS } from '@/lib/ats-context';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { autoShortlistCandidates } from '@/lib/db-service';

interface OffersTabProps {
  jobOffers: JobOffer[];
  candidates: Candidate[];
  onAddCandidate: (candidate: Candidate) => void;
  onScoreCandidates: (jobId: string) => void;
  onEnrichCandidate: (candidateId: string) => void;
  onUpdateRounds?: (jobId: string, rounds: Round[]) => void;
  onToggleOfferStatus?: (jobId: string) => void;
  onEnrichWithLinkedIn?: (candidateId: string, linkedinData: any) => void;
  onUpdateCandidateLinkedIn?: (candidateId: string, linkedInUrl: string) => void;
}

export function OffersTab({
  jobOffers,
  candidates,
  onAddCandidate,
  onScoreCandidates,
  onEnrichCandidate,
  onUpdateRounds,
  onToggleOfferStatus,
  onEnrichWithLinkedIn,
  onUpdateCandidateLinkedIn
}: OffersTabProps) {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [resumeViewerOpen, setResumeViewerOpen] = useState(false);
  const [enrichLoadingId, setEnrichLoadingId] = useState<string | null>(null);
  const [showFeatureDialog, setShowFeatureDialog] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [candidateLimit, setCandidateLimit] = useState(5);
  const [isSourcing, setIsSourcing] = useState(false);

  const { showError } = useError();
  const { refreshData } = useATS();


  const selectedJob = jobOffers.find(j => j.id === selectedJobId);
  const jobCandidates = selectedJobId
    ? candidates.filter(c => c.jobOfferId === selectedJobId)
    : [];

  const handleEnrich = async (candidateId: string) => {
    setEnrichLoadingId(candidateId);
    try {
      const candidate = candidates.find(c => c.id === candidateId);
      console.log('[v0] [ENRICH] Starting enrichment for candidate:', candidateId);

      if (!candidate) {
        console.log('[v0] [ENRICH] ERROR: Candidate not found');
        setEnrichLoadingId(null);
        return;
      }

      // Construct ResumeParseData from candidate fields
      const resumeData: any = {
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone, // Assuming phone exists on candidate
        location: candidate.location,
        about: candidate.about,
        linkedin_url: candidate.linkedin_url,
        experiences: candidate.experiences,
        educations: candidate.educations,
        skills: candidate.skills,
        projects: candidate.projects,
        contacts: candidate.contacts,
        accomplishments: candidate.accomplishments,
        interests: candidate.interests,
        open_to_work: candidate.open_to_work
      };

      console.log('[v0] [ENRICH] Calling enrichResume API...');
      const { enrichResume } = await import('@/lib/api-service');
      const newResumeData = await enrichResume(resumeData, candidate.linkedin_url || undefined, candidate.name);

      console.log('[v0] [ENRICH] SUCCESS: New resume data received');

      // Call handler to update candidate with NEW resume data (Full Replacement)
      onEnrichWithLinkedIn?.(candidateId, newResumeData);

    } catch (error) {
      console.log('[v0] [ENRICH] ERROR:', error);
      const msg = error instanceof Error ? error.message : String(error);
      showError(msg, 'Enrichment Failed');
    } finally {
      setEnrichLoadingId(null);
    }
  };

  const handleScore = () => {
    onScoreCandidates(selectedJobId || '');
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingResume(true);
    let successCount = 0;
    let failCount = 0;

    try {
      // Convert FileList to Array
      const fileArray = Array.from(files);

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        console.log(`[v0] Processing file ${i + 1}/${fileArray.length}: ${file.name}`);

        // Check if Zip
        if (file.name.toLowerCase().endsWith('.zip')) {
          try {
            console.log('[v0] Detected Zip file, using Bulk Upload API...');
            await uploadResume(file, selectedJobId || undefined);
            console.log('[v0] Zip upload successful');
            successCount++;
            // For Zip, we should probably refresh data immediately as we don't know how many candidates were added
            await refreshData();
          } catch (error) {
            console.error('[v0] Zip upload failed:', error);
            failCount++;
            const msg = error instanceof Error ? error.message : String(error);
            showError(`Failed to upload ${file.name}: ${msg}`, 'Upload Failed');
          }
          continue;
        }

        // Standard File Upload (PDF, Doc, etc.)
        try {
          console.log('[v0] Parsing resume and finding LinkedIn profile:', file.name);

          // Parse resume and find LinkedIn URL (NO scraping yet)
          const { resume, linkedInUrl } = await enrichCandidateFromResume(file);

          if (!resume?.name) {
            throw new Error('Could not extract name from resume');
          }

          console.log('[v0] Resume parsed:', { name: resume.name, linkedInUrl });

          // Extract email from contacts (usually first contact is email)
          const email = resume.contacts?.find(c => c.includes('@')) || undefined;

          // Create candidate with parsed data and LinkedIn URL for future enrichment
          const newCandidate: Candidate = {
            id: `uploaded-${Date.now()}-${i}`, // Unique ID for temp
            jobOfferId: selectedJobId || undefined,
            source: 'cvtheque', // Default source for now, effectively "Uploaded"
            score: 0,
            currentRound: 0,
            status: 'Pending',
            name: resume.name,
            email: email,
            location: resume.location || 'Not specified',
            about: resume.about || `Resume uploaded: ${file.name}`,
            linkedin_url: linkedInUrl || resume.linkedin_url || '',
            open_to_work: resume.open_to_work ?? true,
            experiences: resume.experiences?.map(exp => ({
              ...exp,
              linkedin_url: exp.linkedin_url || null,
              from_date: exp.from_date || '', // Ensure string for types
              to_date: exp.to_date || '',   // Ensure string for types
              duration: exp.duration || '',
              location: exp.location || '',
              description: exp.description || ''
            })) || [],
            educations: resume.educations?.map(edu => ({
              ...edu,
              linkedin_url: edu.linkedin_url || null,
              from_date: edu.from_date || '',
              to_date: edu.to_date || '',
              duration: edu.duration || '',
              location: edu.location || '',
              description: edu.description || ''
            })) || [],
            skills: resume.skills || [],
            projects: resume.projects || [],
            contacts: resume.contacts || [],
            accomplishments: resume.accomplishments || [],
            interests: resume.interests || [],
            enriched: false,
            file: file // Pass the file object for upload
          };

          await onAddCandidate(newCandidate);
          successCount++;

        } catch (error) {
          console.error(`[v0] Error processing file ${file.name}:`, error);
          failCount++;
          const msg = error instanceof Error ? error.message : String(error);
          showError(`Failed to process ${file.name}: ${msg}`, 'Upload Error');
        }
      }

      if (successCount > 0 && failCount === 0) {
        // All good
      } else if (successCount > 0 && failCount > 0) {
        showError(`Uploaded ${successCount} files, but ${failCount} failed.`, 'Partial Success');
      }

    } catch (error) {
      console.error('[v0] Global upload error:', error);
      const msg = error instanceof Error ? error.message : String(error);
      showError(msg, 'Upload Failed');
    } finally {
      setUploadingResume(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'resume';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(url, '_blank');
    }
  };

  return (
    <div className="h-full flex flex-col lg:overflow-hidden overflow-y-auto p-1">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-full h-auto min-h-0">
        {/* Left: Job Offers List */}
        <div className="space-y-3 lg:h-full h-auto lg:overflow-y-auto pr-2">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Active Offers</h3>
          <div className="space-y-2">
            {jobOffers.map(job => (
              <Card
                key={job.id}
                className={`p-4 cursor-pointer transition-all border-2 ${selectedJobId === job.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
                  }`}
                onClick={() => setSelectedJobId(job.id)}
              >
                <h4 className="font-bold text-sm">{job.title}</h4>
                <p className={`text-xs mt-1 line-clamp-2 ${selectedJobId === job.id ? 'text-blue-100' : 'text-slate-600'}`}>
                  {job.description}
                </p>
                <Badge
                  variant={selectedJobId === job.id ? 'default' : 'secondary'}
                  className={`mt-2 text-xs ${selectedJobId === job.id ? 'bg-blue-400 text-white' : ''}`}
                >
                  {job.candidateCount || 0} candidates
                </Badge>
              </Card>
            ))}
          </div>
        </div>

        {/* Right: Offer Details & Candidates */}
        <div className="lg:col-span-2 space-y-4 lg:h-full h-auto overflow-y-auto pr-1">
          {selectedJob ? (
            <>
              {/* Offer Details */}
              <Card className="p-6 border border-slate-200 bg-gradient-to-br from-white to-slate-50 shrink-0">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-xl text-slate-900 mb-3">{selectedJob.title}</h3>
                    <p className="text-sm text-slate-700 mb-5 leading-relaxed">{selectedJob.description}</p>
                  </div>
                  <RoundsEditor
                    rounds={selectedJob.rounds || []}
                    jobTitle={selectedJob.title}
                    onSaveRounds={(rounds) => onUpdateRounds?.(selectedJob.id, rounds)}
                  />
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-900 uppercase tracking-wide">Required Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.skills_required.map(skill => (
                      <Badge key={skill} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                {selectedJob.rounds && selectedJob.rounds.length > 0 && (
                  <div className="space-y-2 mt-4 pt-4 border-t border-slate-200">
                    <p className="text-xs font-bold text-slate-900 uppercase tracking-wide">Interview Rounds</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.rounds.map((round) => (
                        <Badge key={round.id} className="bg-green-100 text-green-700 text-xs">
                          {round.order}. {round.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 shrink-0">
                {selectedJob?.status === 'Open' && (
                  <Button
                    size="sm"
                    onClick={() => onToggleOfferStatus?.(selectedJobId || '')}
                    className="gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold shadow-sm"
                  >
                    <Lock className="w-4 h-4" />
                    Close Offer
                  </Button>
                )}
                {selectedJob?.status === 'Closed' && (
                  <Button
                    size="sm"
                    onClick={() => onToggleOfferStatus?.(selectedJobId || '')}
                    className="gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-sm"
                  >
                    <Unlock className="w-4 h-4" />
                    Reopen Offer
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleScore}
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
                >
                  <Zap className="w-4 h-4" />
                  Score Candidates
                </Button>
                <Button
                  size="sm"
                  className="gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-sm"
                  onClick={() => document.getElementById(`resume-upload-${selectedJobId}`)?.click()}
                  disabled={uploadingResume}
                >
                  <Upload className="w-4 h-4" />
                  {uploadingResume ? 'Uploading...' : 'Add Resume'}
                </Button>
                <input
                  id={`resume-upload-${selectedJobId}`}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.json,.jpg,.jpeg,.png,.zip"
                  onChange={handleResumeUpload}
                  className="hidden"
                  multiple
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowFeatureDialog(true)}
                  className="gap-2 border-slate-300 hover:bg-slate-100"
                >
                  <Search className="w-4 h-4" />
                  CVthèque / Auto-Source
                </Button>
              </div>

              {/* Candidates Table */}
              <Card className="border border-slate-200 shadow-sm">
                <div>
                  <Table>
                    <TableHeader className="bg-slate-100 border-b border-slate-200">
                      <TableRow className="bg-slate-100 border-b border-slate-200 hover:bg-slate-100">
                        <TableHead className="font-bold text-slate-900">Candidate</TableHead>
                        <TableHead className="w-20 font-bold text-slate-900">Score</TableHead>
                        <TableHead className="w-24 font-bold text-slate-900">Status</TableHead>
                        <TableHead className="w-28 font-bold text-slate-900">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobCandidates.map((candidate, idx) => (
                        <TableRow key={candidate.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>

                          <TableCell className="font-semibold text-sm text-slate-900">{candidate.name}</TableCell>
                          <TableCell className="text-sm font-bold">
                            {candidate.score > 0 ? (
                              <Badge
                                variant="outline"
                                className={`px-2 py-1 text-xs font-bold border ${candidate.score >= 50
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : 'bg-red-50 text-red-700 border-red-200'
                                  }`}
                              >
                                {candidate.score}%
                              </Badge>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={candidate.status === 'Declined' ? 'destructive' : 'secondary'}
                              className="text-xs font-semibold"
                            >
                              {candidate.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedCandidate(candidate);
                                  setResumeViewerOpen(true);
                                }}
                                className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                View
                              </Button>

                              {candidate.file_url && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDownload(candidate.file_url!, `resume-${candidate.name.replace(/\s+/g, '_')}`)}
                                  className="h-7 text-xs text-slate-600 hover:text-slate-700 hover:bg-slate-50 gap-1"
                                  title="Download Resume"
                                >
                                  <Download className="w-3 h-3" />
                                  Download
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEnrich(candidate.id)}
                                disabled={enrichLoadingId === candidate.id}
                                className={`h-7 text-xs gap-1 ${candidate.enriched
                                  ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                                  : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                                  } disabled:text-slate-400`}
                                title={candidate.enriched ? 'Profile enriched from LinkedIn (Click to re-enrich)' : 'Enrich profile from LinkedIn'}
                              >
                                <Linkedin className="w-3 h-3" />
                                {enrichLoadingId === candidate.id ? 'Enriching...' : candidate.enriched ? 'Enriched' : 'Enrich'}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </>
          ) : (
            <Card className="p-12 text-center bg-slate-50 border border-slate-200 h-full flex items-center justify-center flex-col">
              <div className="text-slate-400 mb-2">📋</div>
              <p className="text-slate-600 font-medium">Select a job offer from the left to view and manage candidates</p>
            </Card>
          )}
        </div>

        {/* Resume Viewer Modal */}
        <ResumeViewer
          candidate={selectedCandidate}
          open={resumeViewerOpen}
          onOpenChange={setResumeViewerOpen}
        />

        {/* Auto-Source / CVthèque Dialog */}
        <Dialog open={showFeatureDialog} onOpenChange={setShowFeatureDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Auto-Source Candidates</DialogTitle>
              <DialogDescription>
                Automatically find and shortlist the best matching candidates from your resume database for this job offer.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="limit" className="text-right">
                  Candidates
                </Label>
                <Input
                  id="limit"
                  type="number"
                  value={candidateLimit}
                  onChange={(e) => setCandidateLimit(Number(e.target.value))}
                  className="col-span-3"
                  min={1}
                  max={20}
                />
              </div>
              <p className="text-xs text-slate-500 ml-auto col-span-4">
                We will match resumes based on skills and relevance.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowFeatureDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!selectedJobId) return;
                  try {
                    setIsSourcing(true);
                    const result: any = await autoShortlistCandidates(selectedJobId, candidateLimit);

                    setShowFeatureDialog(false);
                    await refreshData();

                    // Show success message (using generic alert for now or console)
                    console.log("Auto-source result:", result);
                    alert(result.message || "Candidates shortlisted successfully!");

                  } catch (error) {
                    console.error("Auto-source failed:", error);
                    alert("Failed to auto-source candidates. Check console for details.");
                  } finally {
                    setIsSourcing(false);
                  }
                }}
                disabled={isSourcing}
              >
                {isSourcing ? 'Sourcing...' : 'Find Candidates'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

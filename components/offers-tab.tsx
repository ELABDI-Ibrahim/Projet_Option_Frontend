'use client';

import React from "react"

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Zap, Plus, Upload, Search, Lock, Unlock, Linkedin } from "lucide-react";
import { ResumeViewer } from './resume-viewer';
import { RoundsEditor } from './rounds-editor';
import { enrichCandidateFromResume } from '@/lib/api-service';
import type { Candidate, JobOffer, Round } from '@/lib/mock-data';

interface OffersTabProps {
  jobOffers: JobOffer[];
  candidates: Candidate[];
  onAddCandidate: (candidate: Candidate) => void;
  onScoreCandidates: (jobId: string) => void;
  onEnrichCandidate: (candidateId: string) => void;
  onUpdateRounds?: (jobId: string, rounds: Round[]) => void;
  onToggleOfferStatus?: (jobId: string) => void;
  onEnrichWithLinkedIn?: (candidateId: string, linkedinData: any) => void;
}

export function OffersTab({
  jobOffers,
  candidates,
  onAddCandidate,
  onScoreCandidates,
  onEnrichCandidate,
  onUpdateRounds,
  onToggleOfferStatus,
  onEnrichWithLinkedIn
}: OffersTabProps) {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [resumeViewerOpen, setResumeViewerOpen] = useState(false);
  const [enrichLoadingId, setEnrichLoadingId] = useState<string | null>(null);
  const [showFeatureDialog, setShowFeatureDialog] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  const selectedJob = jobOffers.find(j => j.id === selectedJobId);
  const jobCandidates = selectedJobId 
    ? candidates.filter(c => c.jobOfferId === selectedJobId)
    : [];

  const handleEnrich = async (candidateId: string) => {
    setEnrichLoadingId(candidateId);
    try {
      const candidate = candidates.find(c => c.id === candidateId);
      console.log('[v0] [ENRICH] Starting enrichment for candidate:', candidateId);
      console.log('[v0] [ENRICH] Candidate:', candidate?.name, 'LinkedIn URL:', candidate?.linkedin_url);

      if (!candidate) {
        console.log('[v0] [ENRICH] ERROR: Candidate not found');
        setEnrichLoadingId(null);
        return;
      }

      if (!candidate.linkedin_url) {
        console.log('[v0] [ENRICH] ERROR: No LinkedIn URL for candidate:', candidate.name);
        setEnrichLoadingId(null);
        return;
      }

      console.log('[v0] [ENRICH] Starting LinkedIn scrape for URL:', candidate.linkedin_url);

      // Scrape LinkedIn profile data using the URL from resume
      const { scrapeLinkedInProfile } = await import('@/lib/api-service');
      const linkedInData = await scrapeLinkedInProfile(candidate.linkedin_url);

      console.log('[v0] [ENRICH] Scrape result:', linkedInData);

      if (linkedInData) {
        console.log('[v0] [ENRICH] SUCCESS: LinkedIn data received, updating candidate');
        // Call handler to update candidate with LinkedIn data in parent
        onEnrichWithLinkedIn?.(candidateId, linkedInData);
      } else {
        console.log('[v0] [ENRICH] WARNING: No data returned from LinkedIn scrape');
      }
    } catch (error) {
      console.log('[v0] [ENRICH] ERROR:', error);
    } finally {
      setEnrichLoadingId(null);
    }
  };

  const handleScore = () => {
    onScoreCandidates(selectedJobId || '');
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingResume(true);
    try {
      console.log('[v0] Parsing resume and finding LinkedIn profile:', file.name);

      // Parse resume and find LinkedIn URL (NO scraping yet)
      const { resume, linkedInUrl } = await enrichCandidateFromResume(file);

      if (!resume?.name) {
        throw new Error('Could not extract name from resume');
      }

      console.log('[v0] Resume parsed:', { name: resume.name, linkedInUrl });

      // Create candidate with parsed data and LinkedIn URL for future enrichment
      const newCandidate: Candidate = {
        id: `uploaded-${Date.now()}`,
        jobOfferId: selectedJobId || undefined,
        source: 'CVthèque',
        score: 0,
        currentRound: 0,
        status: 'Pending',
        name: resume.name,
        location: resume.location || 'Not specified',
        about: resume.summary || `Resume uploaded: ${file.name}`,
        linkedin_url: linkedInUrl || '',
        open_to_work: true,
        experiences: resume.experiences || [],
        educations: resume.educations || [],
        enriched: false
      };

      onAddCandidate(newCandidate);
    } catch (error) {
      console.log('[v0] Error parsing resume:', error);
      
      // Fallback: create candidate with basic file name extraction
      const basicCandidate: Candidate = {
        id: `uploaded-${Date.now()}`,
        jobOfferId: selectedJobId || undefined,
        source: 'Local',
        score: 0,
        currentRound: 0,
        status: 'Pending',
        name: file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
        location: 'Not specified',
        about: 'Resume uploaded (parsing pending)',
        linkedin_url: '',
        open_to_work: true,
        experiences: [],
        educations: [],
        enriched: false
      };
      
      onAddCandidate(basicCandidate);
    } finally {
      setUploadingResume(false);
      e.target.value = '';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Job Offers List */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Active Offers</h3>
        <div className="space-y-2">
          {jobOffers.map(job => (
            <Card
              key={job.id}
              className={`p-4 cursor-pointer transition-all border-2 ${
                selectedJobId === job.id 
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
                {jobCandidates.length} candidates
              </Badge>
            </Card>
          ))}
        </div>
      </div>

      {/* Right: Offer Details & Candidates */}
      <div className="lg:col-span-2 space-y-4">
        {selectedJob ? (
          <>
            {/* Offer Details */}
            <Card className="p-6 border border-slate-200 bg-gradient-to-br from-white to-slate-50">
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
            <div className="flex flex-wrap gap-3">
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
                onClick={() => document.getElementById(`resume-upload-${selectedJobId}`).click()}
                disabled={uploadingResume}
              >
                <Upload className="w-4 h-4" />
                {uploadingResume ? 'Uploading...' : 'Add Resume'}
              </Button>
              <input
                id={`resume-upload-${selectedJobId}`}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.json"
                onChange={handleResumeUpload}
                className="hidden"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowFeatureDialog(true)}
                className="gap-2 border-slate-300 hover:bg-slate-100"
              >
                <Search className="w-4 h-4" />
                CVthèque
              </Button>
            </div>

            {/* Candidates Table */}
            <Card className="overflow-hidden border border-slate-200 shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100 border-b border-slate-200">
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
                          <span className="inline-block px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-bold">{candidate.score}%</span>
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
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEnrich(candidate.id)}
                            disabled={enrichLoadingId === candidate.id || candidate.enriched}
                            className={`h-7 text-xs gap-1 ${
                              candidate.enriched
                                ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                                : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                            } disabled:text-slate-400`}
                            title={candidate.enriched ? 'Profile enriched from LinkedIn' : 'Enrich profile from LinkedIn'}
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
            </Card>
          </>
        ) : (
          <Card className="p-12 text-center bg-slate-50 border border-slate-200">
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

      {/* Feature Not Implemented Dialog */}
      <Dialog open={showFeatureDialog} onOpenChange={setShowFeatureDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>CVthèque Search</DialogTitle>
            <DialogDescription>
              This feature is not yet implemented. In a production system, this would allow you to search through a centralized resume database.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowFeatureDialog(false)}>Close</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

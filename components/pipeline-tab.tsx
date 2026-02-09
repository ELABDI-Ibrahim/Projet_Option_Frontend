'use client';

import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { ResumeViewer } from './resume-viewer';
import type { Candidate, JobOffer } from '@/lib/mock-data';

const statusConfig = {
  Pending: { icon: Clock, color: 'bg-yellow-600', label: 'Pending Review' },
  'Next Round': { icon: CheckCircle2, color: 'bg-green-600', label: 'Next Round' },
  Declined: { icon: XCircle, color: 'bg-red-600', label: 'Declined' }
};

interface PipelineTabProps {
  candidates: Candidate[];
  jobOffers: JobOffer[];
  onUpdateStatus: (candidateId: string, status: 'Pending' | 'Next Round' | 'Declined') => void;
  onUpdateRound: (candidateId: string, roundIndex: number) => void;
}

export function PipelineTab({ candidates, jobOffers, onUpdateStatus, onUpdateRound }: PipelineTabProps) {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [resumeViewerOpen, setResumeViewerOpen] = useState(false);
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    action: 'nextRound' | 'decline' | null;
    candidateId: string | null;
  }>({ open: false, action: null, candidateId: null });

  const selectedJob = jobOffers.find(j => j.id === selectedJobId);
  const jobCandidates = selectedJobId 
    ? candidates.filter(c => c.jobOfferId === selectedJobId)
    : [];
  
  const getRoundsByStatus = () => {
    const rounds = selectedJob?.rounds || [];
    const groupedByRound: Record<number, Candidate[]> = {};
    
    jobCandidates.forEach(candidate => {
      if (candidate.status !== 'Declined') {
        if (!groupedByRound[candidate.currentRound]) {
          groupedByRound[candidate.currentRound] = [];
        }
        groupedByRound[candidate.currentRound].push(candidate);
      }
    });
    
    const declined = jobCandidates.filter(c => c.status === 'Declined');
    
    return { groupedByRound, declined, rounds };
  };

  const { groupedByRound, declined, rounds } = getRoundsByStatus();

  const handleAction = (action: 'nextRound' | 'decline', candidateId: string) => {
    setDialogState({ open: true, action, candidateId });
  };

  const confirmAction = () => {
    if (dialogState.candidateId && dialogState.action) {
      if (dialogState.action === 'nextRound') {
        const candidate = candidates.find(c => c.id === dialogState.candidateId);
        if (candidate && candidate.currentRound < (selectedJob?.rounds?.length || 0) - 1) {
          onUpdateRound(dialogState.candidateId, candidate.currentRound + 1);
        }
      } else {
        onUpdateStatus(dialogState.candidateId, 'Declined');
      }
      setDialogState({ open: false, action: null, candidateId: null });
    }
  };

  return (
    <div className="space-y-6">
      {/* Job Offer Selector */}
      <Card className="p-5 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-sm">
        <div className="space-y-3">
          <label className="text-sm font-bold text-slate-900 uppercase tracking-wide">Select Job Offer</label>
          <Select value={selectedJobId || ''} onValueChange={setSelectedJobId}>
            <SelectTrigger className="w-full border-slate-300 bg-white hover:border-blue-400 focus:border-blue-500">
              <SelectValue placeholder="Choose a job offer to view its pipeline..." />
            </SelectTrigger>
            <SelectContent>
              {jobOffers.map(job => (
                <SelectItem key={job.id} value={job.id}>
                  {job.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedJobId && (
            <p className="text-xs text-blue-700 font-medium">
              Viewing candidates for: <span className="font-bold">{jobOffers.find(j => j.id === selectedJobId)?.title}</span>
            </p>
          )}
        </div>
      </Card>

      {/* Pipeline Grid */}
      {selectedJobId ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {rounds.map((round) => {
            const roundCandidates = groupedByRound[round.order - 1] || [];
            return (
              <div key={round.id} className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-5 h-5 text-white bg-blue-500 rounded-full p-1 flex items-center justify-center text-xs font-bold">{round.order}</div>
                  <h3 className="font-bold text-sm text-slate-900">{round.name}</h3>
                  <Badge className="ml-auto bg-blue-600 text-white font-bold">{roundCandidates.length}</Badge>
                </div>

                <div className="space-y-3">
                  {roundCandidates.map(candidate => (
                    <Card key={candidate.id} className="p-3 space-y-2 bg-white border border-slate-200 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-slate-900 truncate">{candidate.name}</h4>
                          <p className="text-xs text-slate-500 truncate">{candidate.location}</p>
                        </div>
                        <Badge className={`shrink-0 font-bold text-xs ${
                          candidate.score > 0 
                            ? 'bg-green-600 text-white' 
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          {candidate.score > 0 ? `${candidate.score}%` : 'Not scored'}
                        </Badge>
                      </div>

                      {candidate.status === 'Pending' && (
                        <div className="flex gap-1.5 text-xs pt-2 border-t border-slate-200">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedCandidate(candidate);
                              setResumeViewerOpen(true);
                            }}
                            className="h-6 flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium"
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 flex-1 text-green-600 hover:text-green-700 hover:bg-green-50 font-medium"
                            onClick={() => handleAction('nextRound', candidate.id)}
                          >
                            Advance
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 font-medium"
                            onClick={() => handleAction('decline', candidate.id)}
                          >
                            Decline
                          </Button>
                        </div>
                      )}

                      {candidate.status === 'Next Round' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedCandidate(candidate);
                            setResumeViewerOpen(true);
                          }}
                          className="w-full h-6 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium"
                        >
                          View Resume
                        </Button>
                      )}
                    </Card>
                  ))}

                  {roundCandidates.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-sm font-medium">
                      No candidates yet
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center bg-slate-50 border border-slate-200">
          <div className="text-slate-300 text-4xl mb-3">📊</div>
          <p className="text-lg font-semibold text-slate-600">Select a job offer to view the pipeline</p>
          <p className="text-sm text-slate-500 mt-2">Track candidates through Pending Review, Next Round, and Declined stages.</p>
        </Card>
      )}

      {/* Declined Column */}
      {declined.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <XCircle className="w-5 h-5 text-white bg-red-500 rounded-full p-1" />
            <h3 className="font-bold text-sm text-slate-900">Declined</h3>
            <Badge className="ml-auto bg-slate-600 text-white font-bold">{declined.length}</Badge>
          </div>
          <div className="space-y-3">
            {declined.map(candidate => (
              <Card key={candidate.id} className="p-3 space-y-2 bg-white border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-slate-900 truncate">{candidate.name}</h4>
                    <p className="text-xs text-slate-500 truncate">{candidate.location}</p>
                  </div>
                  <Badge className="shrink-0 bg-red-100 text-red-700 font-bold text-xs">Declined</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Resume Viewer */}
      <ResumeViewer
        candidate={selectedCandidate}
        open={resumeViewerOpen}
        onOpenChange={setResumeViewerOpen}
      />

      {/* Confirmation Dialog */}
      <AlertDialog open={dialogState.open} onOpenChange={(open) => {
        if (!open) setDialogState({ open: false, action: null, candidateId: null });
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogState.action === 'nextRound' ? 'Advance to Next Round?' : 'Decline Candidate?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogState.action === 'nextRound'
                ? 'This candidate will be moved to the Next Round stage.'
                : 'This candidate will be marked as declined. This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction}>
              {dialogState.action === 'nextRound' ? 'Advance' : 'Decline'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

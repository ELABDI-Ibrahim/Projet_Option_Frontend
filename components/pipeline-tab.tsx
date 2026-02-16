'use client';

import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, Clock, Layout, GripVertical } from "lucide-react";
import { ResumeViewer } from './resume-viewer';
import type { Candidate, JobOffer } from '@/lib/types';

interface PipelineTabProps {
  candidates: Candidate[];
  jobOffers: JobOffer[];
  onUpdateStatus: (candidateId: string, status: 'Pending' | 'Next Round' | 'Declined') => void;
  onUpdateRound: (candidateId: string, roundIndex: number) => void; // Deprecated but kept for compatibility
  onUpdateStage?: (candidateId: string, stageId: string) => void;
}

export function PipelineTab({ candidates, jobOffers, onUpdateStatus, onUpdateStage }: PipelineTabProps) {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [resumeViewerOpen, setResumeViewerOpen] = useState(false);
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    action: 'moveStage' | 'decline' | null;
    candidateId: string | null;
    targetStageId?: string;
  }>({ open: false, action: null, candidateId: null });

  const selectedJob = jobOffers.find(j => j.id === selectedJobId);
  const jobCandidates = selectedJobId
    ? candidates.filter(c => c.jobOfferId === selectedJobId)
    : [];

  const getCandidatesByStage = () => {
    const rounds = selectedJob?.rounds || [];
    const groupedByStage: Record<string, Candidate[]> = {};

    // Initialize groups
    rounds.forEach(round => {
      groupedByStage[round.id] = [];
    });

    // Distribute candidates
    jobCandidates.forEach(candidate => {
      if (candidate.status !== 'Declined') {
        // If candidate has a specific stage ID, use it
        if (candidate.currentStageId && groupedByStage[candidate.currentStageId]) {
          groupedByStage[candidate.currentStageId].push(candidate);
        } else {
          // Fallback logic: if no stage ID (legacy), put in first stage
          // OR map currentRound to stage index?
          // Let's default to the first stage if no match
          const firstStageId = rounds[0]?.id;
          if (firstStageId) {
            groupedByStage[firstStageId].push(candidate);
          }
        }
      }
    });

    const declined = jobCandidates.filter(c => c.status === 'Declined');

    return { groupedByStage, declined, rounds };
  };

  const { groupedByStage, declined, rounds } = getCandidatesByStage();

  const handleMoveStage = (candidateId: string, targetStageId: string) => {
    setDialogState({
      open: true,
      action: 'moveStage',
      candidateId,
      targetStageId
    });
  };

  const handleDecline = (candidateId: string) => {
    setDialogState({
      open: true,
      action: 'decline',
      candidateId
    });
  };

  const confirmAction = () => {
    if (dialogState.candidateId && dialogState.action) {
      if (dialogState.action === 'moveStage' && dialogState.targetStageId && onUpdateStage) {
        onUpdateStage(dialogState.candidateId, dialogState.targetStageId);
      } else if (dialogState.action === 'decline') {
        onUpdateStatus(dialogState.candidateId, 'Declined');
      }
      setDialogState({ open: false, action: null, candidateId: null });
    }
  };

  // Placeholder for new functions and state variables introduced in the provided snippet
  // These would need to be properly defined for the new UI to work.
  const [draggedCandidateId, setDraggedCandidateId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, candidateId: string) => {
    e.dataTransfer.setData('candidateId', candidateId);
    setDraggedCandidateId(candidateId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Allow drop
  };

  const handleDrop = (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    const candidateId = e.dataTransfer.getData('candidateId');
    if (candidateId && onUpdateStage) {
      onUpdateStage(candidateId, targetStageId);
    }
    setDraggedCandidateId(null);
  };

  // This `stages` array would need to be derived from `rounds` and `groupedByStage`
  // For now, creating a mock structure based on the provided snippet's usage
  const stages = rounds.map(round => ({
    id: round.id,
    name: round.name,
    candidates: groupedByStage[round.id] || [],
  }));

  // Placeholder for getStageColor function
  const getStageColor = (stageName: string) => {
    switch (stageName) {
      case 'Application Review': return 'border-b-blue-500';
      case 'Interview': return 'border-b-green-500';
      case 'Offer': return 'border-b-purple-500';
      case 'Hired': return 'border-b-teal-500';
      default: return 'border-b-slate-500';
    }
  };


  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header / Filter */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <Layout className="w-5 h-5 text-slate-500" />
          <h2 className="text-lg font-bold text-slate-900">Pipeline View</h2>
        </div>
        <Select
          value={selectedJobId || ''}
          onValueChange={setSelectedJobId}
        >
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select a Job Offer" />
          </SelectTrigger>
          <SelectContent>
            {jobOffers.map((job) => (
              <SelectItem key={job.id} value={job.id}>
                {job.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pipeline Grid */}
      {selectedJobId ? (
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
          <div className="flex gap-4 h-full min-w-[1000px]">
            {stages.map((stage) => (
              <div key={stage.id} className="flex-1 flex flex-col min-w-[280px] bg-slate-100/50 rounded-xl border border-slate-200/60">
                {/* Column Header */}
                <div className={`p-3 border-b-2 ${getStageColor(stage.name)} bg-white rounded-t-xl`}>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-slate-800 text-sm">{stage.name}</h3>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold">
                      {stage.candidates.length}
                    </Badge>
                  </div>
                  <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full w-1/2 ${getStageColor(stage.name).replace('border-b-', 'bg-')}`} />
                  </div>
                </div>

                {/* Droppable Area */}
                <div
                  className="p-3 space-y-3 flex-1 overflow-y-auto"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage.id)}
                >
                  {stage.candidates.map((candidate) => (
                    <Card
                      key={candidate.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, candidate.id)}
                      className="p-3 cursor-move hover:shadow-md transition-shadow border-slate-200 bg-white group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{candidate.name}</h4>
                        {candidate.score > 0 && (
                          <Badge variant="outline" className="text-[10px] py-0 h-5 bg-green-50 text-green-700 border-green-200 font-bold">
                            {candidate.score}%
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mb-3 truncate">{candidate.location}</p>

                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
                        <Badge variant="secondary" className="text-[10px] font-normal h-5 bg-slate-50">
                          {new Date().toLocaleDateString()}
                        </Badge>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <GripVertical className="w-4 h-4 text-slate-300" />
                        </div>
                      </div>

                      <div className="flex gap-1.5 text-xs pt-2 border-t border-slate-200 mt-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedCandidate(candidate);
                            setResumeViewerOpen(true);
                          }}
                          className="h-6 flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium px-1"
                        >
                          View
                        </Button>

                        {(() => {
                          const currentStageIndex = rounds.findIndex(r => r.id === stage.id);
                          const nextStage = rounds[currentStageIndex + 1];
                          return nextStage && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 flex-1 text-green-600 hover:text-green-700 hover:bg-green-50 font-medium px-1"
                              onClick={() => handleMoveStage(candidate.id, nextStage.id)}
                            >
                              Advance
                            </Button>
                          );
                        })()}

                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 font-medium px-1"
                          onClick={() => handleDecline(candidate.id)}
                        >
                          Decline
                        </Button>
                      </div>
                    </Card>
                  ))}

                  {stage.candidates.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-sm font-medium">
                      No candidates
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Card className="p-12 text-center bg-slate-50 border border-slate-200">
          <div className="text-slate-300 text-4xl mb-3">📊</div>
          <p className="text-lg font-semibold text-slate-600">Select a job offer to view the pipeline</p>
          <p className="text-sm text-slate-500 mt-2">Track candidates through customized pipeline stages.</p>
        </Card>
      )
      }

      {/* Declined Column */}
      {
        declined.length > 0 && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mt-6">
            <div className="flex items-center gap-3 mb-4">
              <XCircle className="w-5 h-5 text-white bg-red-500 rounded-full p-1" />
              <h3 className="font-bold text-sm text-slate-900">Declined</h3>
              <Badge className="ml-auto bg-slate-600 text-white font-bold">{declined.length}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {declined.map(candidate => (
                <Card key={candidate.id} className="p-3 space-y-2 bg-white border border-slate-200 hover:shadow-md transition-shadow opacity-75">
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
        )
      }

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
              {dialogState.action === 'moveStage' ? 'Move Candidate?' : 'Decline Candidate?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogState.action === 'moveStage'
                ? 'This candidate will be moved to the next stage in the pipeline.'
                : 'This candidate will be marked as declined. This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction}>
              {dialogState.action === 'moveStage' ? 'Move' : 'Decline'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Debug Info */}
      <div className="mt-8 p-4 bg-slate-100 rounded text-xs font-mono text-slate-500">
        <p className="font-bold">Debug Info:</p>
        <p>Selected Job ID: {selectedJobId}</p>
        <p>Job Rounds: {rounds.map(r => `${r.name} (${r.id})`).join(', ')}</p>
        <p>Candidates in View: {jobCandidates.length}</p>
      </div>
    </div >
  );
}

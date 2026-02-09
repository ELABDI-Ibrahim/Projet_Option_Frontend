'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Mail, MapPin, ExternalLink } from "lucide-react";
import type { Candidate } from "@/lib/mock-data";

// 1. Extend the base Candidate type to handle dynamic data cleanly
interface ExtendedCandidate extends Candidate {
  skills?: string[];
  email?: string;
  linkedinData?: {
    headline?: string;
    about?: string;
    skills?: string[];
  };
}

interface ResumeViewerProps {
  candidate: ExtendedCandidate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResumeViewer({ candidate, open, onOpenChange }: ResumeViewerProps) {
  if (!candidate) return null;

  // Extract skills/email with fallbacks
  const skills = candidate.skills || [];
  const email = candidate.email || candidate.about;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Resume for {candidate.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{candidate.name}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>{candidate.location}</span>
                </div>
              </div>
              <Badge variant="outline" className="h-fit">{candidate.source}</Badge>
            </div>

            {candidate.about && (
              <p className="text-sm leading-relaxed text-foreground">{candidate.about}</p>
            )}

            <div className="flex gap-3 flex-wrap">
              {candidate.linkedin_url && (
                <a
                  href={candidate.linkedin_url.startsWith('http') ? candidate.linkedin_url : `https://${candidate.linkedin_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs text-blue-600 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  LinkedIn Profile
                </a>
              )}
              {email && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="w-3 h-3" />
                  <span className="truncate max-w-[200px]">{email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Skills Section */}
          {skills.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-lg border-b pb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, idx) => (
                  <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Experience Section */}
          {candidate.experiences && candidate.experiences.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg border-b pb-2">Professional Experience</h3>
              {candidate.experiences.map((exp, idx) => (
                <div key={idx} className="space-y-1 pb-4 border-b last:border-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold">{exp.position_title}</h4>
                      <p className="text-sm text-muted-foreground">{exp.institution_name}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {exp.from_date} - {exp.to_date || 'Present'}
                    </span>
                  </div>
                  {exp.location && (
                    <p className="text-xs text-muted-foreground">{exp.location}</p>
                  )}
                  {exp.description && (
                    <p className="text-sm leading-relaxed mt-2 whitespace-pre-line">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* LinkedIn Data Section */}
          {candidate.linkedinData && (
            <div className="space-y-4 pt-6 border-t-2 border-blue-300 mt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-bold text-lg text-blue-900 mb-4">LinkedIn Profile Data</h3>
                
                {candidate.linkedinData.headline && (
                  <div className="mb-4">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">Headline</p>
                    <p className="text-sm text-blue-900">{candidate.linkedinData.headline}</p>
                  </div>
                )}

                {candidate.linkedinData.about && (
                  <div className="mb-4">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">About</p>
                    <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-line">{candidate.linkedinData.about}</p>
                  </div>
                )}

                {candidate.linkedinData.skills && candidate.linkedinData.skills.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">LinkedIn Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {candidate.linkedinData.skills.map((skill, idx) => (
                        <Badge key={idx} className="bg-blue-100 text-blue-700 border border-blue-300 text-xs shadow-none">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
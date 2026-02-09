'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Mail, MapPin, ExternalLink } from "lucide-react";
import type { Candidate } from "@/lib/mock-data";

interface ResumeViewerProps {
  candidate: Candidate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResumeViewer({ candidate, open, onOpenChange }: ResumeViewerProps) {
  if (!candidate) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{candidate.name}</DialogTitle>
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
              {candidate.contacts && candidate.contacts.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="w-3 h-3" />
                  <span>{candidate.contacts[0]?.value}</span>
                </div>
              )}
            </div>
          </div>

          {/* Experience Section */}
          {candidate.experiences && candidate.experiences.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg border-b pb-2">Professional Experience</h3>
              {candidate.experiences.map((exp, idx) => (
                <div key={idx} className="space-y-1 pb-4 border-b last:border-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{exp.position_title}</h4>
                      <p className="text-sm text-muted-foreground">{exp.institution_name}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{exp.duration}</span>
                  </div>
                  {exp.location && (
                    <p className="text-xs text-muted-foreground">{exp.location}</p>
                  )}
                  {exp.description && (
                    <p className="text-sm leading-relaxed mt-2">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Education Section */}
          {candidate.educations && candidate.educations.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg border-b pb-2">Education</h3>
              {candidate.educations.map((edu, idx) => (
                <div key={idx} className="space-y-1 pb-4 border-b last:border-0">
                  <h4 className="font-semibold">{edu.institution_name}</h4>
                  {edu.degree && (
                    <p className="text-sm text-muted-foreground">{edu.degree}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {edu.from_date} {edu.to_date ? `- ${edu.to_date}` : ''}
                    </span>
                    {edu.location && (
                      <span className="text-xs text-muted-foreground">{edu.location}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Accomplishments Section */}
          {(candidate as any).accomplishments && (candidate as any).accomplishments.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg border-b pb-2">Accomplishments</h3>
              <ul className="space-y-2">
                {(candidate as any).accomplishments.map((acc: string, idx: number) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{acc}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* LinkedIn Data Section - Different Color */}
          {(candidate as any).linkedinData && (
            <div className="space-y-4 pt-6 border-t-2 border-blue-300 mt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-bold text-lg text-blue-900 mb-4">LinkedIn Profile Data</h3>
                
                {(candidate as any).linkedinData.headline && (
                  <div className="mb-4">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">Headline</p>
                    <p className="text-sm text-blue-900">{(candidate as any).linkedinData.headline}</p>
                  </div>
                )}

                {(candidate as any).linkedinData.about && (
                  <div className="mb-4">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">About</p>
                    <p className="text-sm text-blue-900 leading-relaxed">{(candidate as any).linkedinData.about}</p>
                  </div>
                )}

                {(candidate as any).linkedinData.skills && (candidate as any).linkedinData.skills.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {(candidate as any).linkedinData.skills.map((skill: string, idx: number) => (
                        <Badge key={idx} className="bg-blue-100 text-blue-700 border border-blue-300 text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {(candidate as any).linkedinData.experience && (candidate as any).linkedinData.experience.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Experience</p>
                    {(candidate as any).linkedinData.experience.map((exp: any, idx: number) => (
                      <div key={idx} className="bg-white rounded p-3 border border-blue-100">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-blue-900">{exp.position_title}</h4>
                            <p className="text-sm text-blue-700">{exp.institution_name}</p>
                          </div>
                          <span className="text-xs text-blue-600 whitespace-nowrap">
                            {exp.from_date} {exp.to_date ? `- ${exp.to_date}` : ''}
                          </span>
                        </div>
                        {exp.description && (
                          <p className="text-sm text-blue-800 mt-2">{exp.description}</p>
                        )}
                      </div>
                    ))}
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

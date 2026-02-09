'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Mail, MapPin, ExternalLink } from "lucide-react";
import type { Candidate } from "@/lib/types";

// 1. Extend the base Candidate type to handle dynamic data cleanly
interface ExtendedCandidate extends Candidate {
  skills?: any[]; // Can be string[] or {category, items}[]
  email?: string;
  contacts?: string[];
  accomplishments?: string[];
  interests?: string[];
  open_to_work?: boolean;
  projects?: Array<{
    project_name: string;
    role: string;
    from_date: string;
    to_date: string;
    duration: string;
    technologies: string[];
    description: string;
    url: string;
  }>;
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

  // Debug: Log the candidate data being displayed
  console.log('[RESUME VIEWER] Candidate data:', candidate);

  // Extract skills/email with fallbacks
  const skills = candidate.skills || [];
  const email = candidate.email || '';
  const contacts = candidate.contacts || [];
  const accomplishments = candidate.accomplishments || [];
  const interests = candidate.interests || [];
  const projects = candidate.projects || [];

  // Helper to check if skills are structured
  const isStructuredSkills = (skills: any[]): skills is { category: string; items: string[] }[] => {
    return skills.length > 0 && typeof skills[0] === 'object' && 'category' in skills[0];
  };

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
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">{candidate.name}</h2>
                  {candidate.open_to_work !== false && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                      Open to Work
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>{candidate.location}</span>
                </div>
              </div>
              <Badge variant="outline" className="h-fit">{candidate.source}</Badge>
            </div>

            {candidate.about && (
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">{candidate.about}</p>
              </div>
            )}

            <div className="flex gap-3 flex-wrap pt-2">
              {candidate.linkedin_url && (
                <a
                  href={candidate.linkedin_url.startsWith('http') ? candidate.linkedin_url : `https://${candidate.linkedin_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded-md"
                >
                  <ExternalLink className="w-3 h-3" />
                  LinkedIn Profile
                </a>
              )}
              {email && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-slate-100 px-2 py-1 rounded-md">
                  <Mail className="w-3 h-3" />
                  <span className="truncate max-w-[200px]">{email}</span>
                </div>
              )}
              {contacts.map((contact, idx) => (
                contact !== email && (
                  <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground bg-slate-100 px-2 py-1 rounded-md">
                    <Mail className="w-3 h-3" />
                    <span className="truncate max-w-[200px]">{contact}</span>
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Skills Section */}
          {skills.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-lg border-b pb-2 flex items-center gap-2">
                Skills
                <Badge variant="secondary" className="text-xs font-normal">
                  {isStructuredSkills(skills) ? skills.reduce((acc, cat) => acc + cat.items.length, 0) : skills.length}
                </Badge>
              </h3>

              {isStructuredSkills(skills) ? (
                <div className="space-y-4">
                  {skills.map((category, idx) => (
                    <div key={idx}>
                      <h4 className="text-sm font-semibold text-slate-700 mb-2">{category.category}</h4>
                      <div className="flex flex-wrap gap-2">
                        {category.items.map((skill, sIdx) => (
                          <Badge key={sIdx} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, idx) => (
                    <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Experience Section */}
          {candidate.experiences && candidate.experiences.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg border-b pb-2">Professional Experience</h3>
              {candidate.experiences.map((exp, idx) => (
                <div key={idx} className="space-y-1 pb-4 border-b last:border-0 relative pl-4 border-l-2 border-slate-200 ml-1">
                  <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-base text-slate-900">{exp.position_title}</h4>
                      <p className="text-sm font-semibold text-slate-700">{exp.institution_name}</p>
                    </div>
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded whitespace-nowrap">
                      {exp.from_date} - {exp.to_date || 'Present'}
                    </span>
                  </div>
                  {exp.location && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1 mb-2">
                      <MapPin className="w-3 h-3" />
                      {exp.location}
                    </div>
                  )}
                  {exp.description && (
                    <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-line bg-slate-50/50 p-2 rounded">{exp.description}</p>
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
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-slate-900">{edu.degree}</h4>
                      <p className="text-sm text-slate-600">{edu.institution_name}</p>
                    </div>
                    <span className="text-xs text-slate-500 whitespace-nowrap bg-slate-100 px-2 py-1 rounded">
                      {edu.from_date} - {edu.to_date || 'Present'}
                    </span>
                  </div>
                  {edu.location && (
                    <p className="text-xs text-slate-500 mt-1">{edu.location}</p>
                  )}
                  {edu.description && (
                    <p className="text-sm leading-relaxed text-slate-600 mt-1 whitespace-pre-line">{edu.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Projects Section - NEW */}
          {projects.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg border-b pb-2">Projects</h3>
              {projects.map((proj, idx) => (
                <div key={idx} className="space-y-2 pb-4 border-b last:border-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-base text-slate-900">{proj.project_name}</h4>
                      <p className="text-sm font-medium text-slate-700">{proj.role}</p>
                    </div>
                    <span className="text-xs text-slate-500 whitespace-nowrap bg-slate-100 px-2 py-1 rounded">
                      {proj.from_date} - {proj.to_date}
                    </span>
                  </div>
                  {proj.url && (
                    <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> View Project
                    </a>
                  )}
                  <p className="text-sm text-slate-600">{proj.description}</p>
                  {proj.technologies && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {proj.technologies.map((tech, tIdx) => (
                        <Badge key={tIdx} variant="outline" className="text-[10px] px-1 py-0 h-5 bg-slate-50">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Accomplishments Section */}
          {accomplishments.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-lg border-b pb-2">Accomplishments & Certifications</h3>
              <ul className="list-disc list-inside space-y-1">
                {accomplishments.map((item, idx) => (
                  <li key={idx} className="text-sm text-slate-700 leading-relaxed">{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Interests Section */}
          {interests.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-lg border-b pb-2">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {interests.map((interest, idx) => (
                  <Badge key={idx} variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* LinkedIn Data Section - Highlighted */}
          {candidate.linkedinData && (
            <div className="space-y-4 pt-6 border-t-4 border-amber-400 mt-6 bg-amber-50/50 -mx-4 px-8 pb-8">
              <div className="flex items-center gap-2 mb-4 pt-4">
                <div className="bg-amber-100 p-2 rounded-full">
                  <ExternalLink className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-amber-900">Enriched Data</h3>
                  <p className="text-xs text-amber-700">Sourced from LinkedIn Profile</p>
                </div>
              </div>

              <div className="bg-white border border-amber-200 rounded-lg p-5 shadow-sm">
                {candidate.linkedinData.headline && (
                  <div className="mb-4">
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Headline</p>
                    <p className="text-sm text-slate-900 font-medium">{candidate.linkedinData.headline}</p>
                  </div>
                )}

                {candidate.linkedinData.about && (
                  <div className="mb-4">
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">About</p>
                    <p className="text-sm text-slate-900 leading-relaxed whitespace-pre-line bg-amber-50/30 p-3 rounded border border-amber-100">{candidate.linkedinData.about}</p>
                  </div>
                )}

                {candidate.linkedinData.skills && candidate.linkedinData.skills.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">LinkedIn Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {candidate.linkedinData.skills.map((skill, idx) => (
                        <Badge key={idx} className="bg-amber-100 text-amber-800 border-amber-300 text-xs shadow-none hover:bg-amber-200">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {(candidate.linkedinData as any).experiences && (candidate.linkedinData as any).experiences.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">LinkedIn Experiences</p>
                    <div className="space-y-3">
                      {(candidate.linkedinData as any).experiences.map((exp: any, idx: number) => (
                        <div key={idx} className="pb-3 border-b border-amber-100 last:border-0">
                          <h4 className="font-bold text-sm text-slate-800">{exp.position_title}</h4>
                          <p className="text-xs font-medium text-slate-600">{exp.institution_name}</p>
                          <p className="text-xs text-slate-500">{exp.from_date} - {exp.to_date}</p>
                          {exp.description && <p className="text-xs text-slate-600 mt-1">{exp.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(candidate.linkedinData as any).educations && (candidate.linkedinData as any).educations.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">LinkedIn Education</p>
                    <div className="space-y-3">
                      {(candidate.linkedinData as any).educations.map((edu: any, idx: number) => (
                        <div key={idx} className="pb-3 border-b border-amber-100 last:border-0">
                          <h4 className="font-bold text-sm text-slate-800">{edu.institution_name}</h4>
                          <p className="text-xs font-medium text-slate-600">{edu.degree}</p>
                          <p className="text-xs text-slate-500">{edu.from_date} - {edu.to_date}</p>
                        </div>
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
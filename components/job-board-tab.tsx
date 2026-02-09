'use client';

import React from "react";
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, X, Search as SearchIcon, Lock, Unlock } from "lucide-react";
import type { JobOffer } from '@/lib/types';

interface JobBoardTabProps {
  jobOffers: JobOffer[];
  onAddJobOffer: (job: Omit<JobOffer, 'id'>) => void;
  onToggleOfferStatus?: (jobId: string) => void;
}

export function JobBoardTab({ jobOffers, onAddJobOffer, onToggleOfferStatus }: JobBoardTabProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobForDetails, setSelectedJobForDetails] = useState<JobOffer | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);

  const filteredJobs = jobOffers.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.skills_required.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && description.trim() && skills.length > 0) {
      onAddJobOffer({
        title,
        description,
        status: 'Open',
        skills_required: skills
      });
      setTitle('');
      setDescription('');
      setSkills([]);
      setSkillInput('');
      setShowCreateForm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-slate-900">Job Offers</h3>
          <p className="text-sm text-slate-600 mt-1">Manage your open positions</p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="gap-2 bg-green-600 hover:bg-green-700 text-white font-bold shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Offer
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
        <Input
          placeholder="Search by title, description, or skills..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {/* Job Offers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredJobs.map(job => (
          <Card 
            key={job.id} 
            className={`p-5 border-2 transition-all cursor-pointer ${
              job.status === 'Closed' 
                ? 'bg-slate-50 border-slate-300 opacity-75' 
                : 'bg-white border-slate-200 hover:shadow-lg'
            }`}
            onClick={() => setSelectedJobForDetails(job)}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h4 className={`font-bold text-lg flex-1 ${job.status === 'Closed' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                  {job.title}
                </h4>
                <Badge className={`font-semibold text-xs ${
                  job.status === 'Open' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {job.status}
                </Badge>
              </div>
              <p className="text-sm text-slate-600 line-clamp-2">{job.description}</p>
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <p className="text-xs font-bold text-slate-900 uppercase tracking-wide">Required Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {job.skills_required.map(skill => (
                    <Badge key={skill} className="bg-blue-50 text-blue-700 border border-blue-200 text-xs">{skill}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <Card className="p-12 text-center bg-slate-50 border border-slate-200">
          <div className="text-slate-400 text-4xl mb-3">📌</div>
          <p className="text-slate-600 font-medium">{searchQuery ? 'No matching job offers' : 'No job offers yet'}</p>
          <p className="text-sm text-slate-500 mt-2">{searchQuery ? 'Try adjusting your search' : 'Click the Create Offer button to add your first position'}</p>
        </Card>
      )}

      {/* Job Details Dialog */}
      <Dialog open={!!selectedJobForDetails} onOpenChange={(open) => !open && setSelectedJobForDetails(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{selectedJobForDetails?.title}</DialogTitle>
          </DialogHeader>
          {selectedJobForDetails && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Description</h4>
                <p className="text-sm text-slate-700 leading-relaxed">{selectedJobForDetails.description}</p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Status</h4>
                <Badge className={`font-semibold ${
                  selectedJobForDetails.status === 'Open'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {selectedJobForDetails.status}
                </Badge>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Required Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedJobForDetails.skills_required.map(skill => (
                    <Badge key={skill} className="bg-blue-50 text-blue-700 border border-blue-200">{skill}</Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-2 pt-4">
            {selectedJobForDetails?.status === 'Open' && (
              <Button 
                onClick={() => {
                  onToggleOfferStatus?.(selectedJobForDetails.id);
                  setSelectedJobForDetails(null);
                }}
                className="flex-1 gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                <Lock className="w-4 h-4" />
                Close Offer
              </Button>
            )}
            {selectedJobForDetails?.status === 'Closed' && (
              <Button 
                onClick={() => {
                  onToggleOfferStatus?.(selectedJobForDetails.id);
                  setSelectedJobForDetails(null);
                }}
                className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                <Unlock className="w-4 h-4" />
                Reopen Offer
              </Button>
            )}
            <Button onClick={() => setSelectedJobForDetails(null)} className="flex-1">Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Offer Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Create New Job Offer</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-bold text-slate-900 uppercase tracking-wide">Job Title</label>
              <Input
                placeholder="e.g., Senior Data Scientist"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-2 border-slate-300 focus:border-green-500 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-900 uppercase tracking-wide">Job Description</label>
              <Textarea
                placeholder="Describe the role, responsibilities, and expectations..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-2 min-h-32 border-slate-300 focus:border-green-500 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-900 uppercase tracking-wide">Required Skills</label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Type skill name and press Add..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  className="border-slate-300 focus:border-green-500 focus:ring-green-500"
                />
                <Button
                  type="button"
                  onClick={handleAddSkill}
                  className="gap-2 border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold bg-transparent"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>

              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {skills.map(skill => (
                    <Badge key={skill} className="gap-2 py-1.5 px-3 bg-green-100 text-green-700 font-semibold">
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:bg-green-200 rounded ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 shadow-sm">
                <Plus className="w-4 h-4" />
                Create Offer
              </Button>
              <Button type="button" onClick={() => setShowCreateForm(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

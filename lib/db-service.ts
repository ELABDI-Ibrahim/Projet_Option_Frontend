import { supabase } from './supabase';
import type { JobOffer, Candidate, Application, PipelineStage, Resume, ApplicationScore } from './supabase';

export { supabase } from './supabase';

// Job Offers
export async function getJobOffers() {
  const { data, error } = await supabase
    .from('job_offers')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as JobOffer[];
}

export async function updateJobOfferStatus(jobId: string, status: 'Open' | 'Closed' | 'Draft') {
  const { error } = await supabase
    .from('job_offers')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', jobId);
  
  if (error) throw error;
}

export async function createJobOffer(offer: Omit<JobOffer, 'id' | 'created_at' | 'deleted_at'>) {
  const { data, error } = await supabase
    .from('job_offers')
    .insert([offer])
    .select();
  
  if (error) throw error;
  return data?.[0] as JobOffer;
}

// Pipeline Stages
export async function getPipelineStages(jobOfferId: string) {
  const { data, error } = await supabase
    .from('pipeline_stages')
    .select('*')
    .eq('job_offer_id', jobOfferId)
    .order('stage_order', { ascending: true });
  
  if (error) throw error;
  return data as PipelineStage[];
}

export async function updatePipelineStages(jobOfferId: string, stages: Omit<PipelineStage, 'id' | 'created_at'>[]) {
  // Delete existing stages
  await supabase
    .from('pipeline_stages')
    .delete()
    .eq('job_offer_id', jobOfferId);

  // Insert new stages
  const { error } = await supabase
    .from('pipeline_stages')
    .insert(stages.map(s => ({ ...s, job_offer_id: jobOfferId })));
  
  if (error) throw error;
}

// Candidates
export async function getCandidates(jobOfferId?: string) {
  let query = supabase
    .from('candidates')
    .select('*')
    .is('deleted_at', null);

  if (jobOfferId) {
    query = query.eq('job_offers.id', jobOfferId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Candidate[];
}

export async function createCandidate(candidate: Omit<Candidate, 'id' | 'created_at' | 'deleted_at'>) {
  const { data, error } = await supabase
    .from('candidates')
    .insert([candidate])
    .select();
  
  if (error) throw error;
  return data?.[0] as Candidate;
}

// Resumes
export async function createResume(resume: Omit<Resume, 'id' | 'created_at' | 'deleted_at'>) {
  const { data, error } = await supabase
    .from('resumes')
    .insert([resume])
    .select();
  
  if (error) throw error;
  return data?.[0] as Resume;
}

export async function getResume(resumeId: string) {
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('id', resumeId)
    .single();
  
  if (error) throw error;
  return data as Resume;
}

export async function updateResumeData(resumeId: string, parsedData: any) {
  const { error } = await supabase
    .from('resumes')
    .update({ parsed_data: parsedData })
    .eq('id', resumeId);
  
  if (error) throw error;
}

// Applications
export async function getApplications(jobOfferId?: string) {
  let query = supabase
    .from('applications')
    .select('*, candidate:candidates(*), resume:resumes(*), stage:pipeline_stages(*)')
    .is('deleted_at', null);

  if (jobOfferId) {
    query = query.eq('job_offer_id', jobOfferId);
  }

  const { data, error } = await query.order('applied_at', { ascending: false });
  
  if (error) throw error;
  return data as (Application & { candidate: Candidate; resume?: Resume; stage?: PipelineStage })[];
}

export async function createApplication(application: Omit<Application, 'id' | 'applied_at' | 'updated_at' | 'deleted_at'>) {
  const { data, error } = await supabase
    .from('applications')
    .insert([application])
    .select();
  
  if (error) throw error;
  return data?.[0] as Application;
}

export async function updateApplicationStatus(applicationId: string, status: Application['status']) {
  const { error } = await supabase
    .from('applications')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', applicationId);
  
  if (error) throw error;
}

export async function updateApplicationStage(applicationId: string, stageId: string) {
  const { error } = await supabase
    .from('applications')
    .update({ current_stage_id: stageId, updated_at: new Date().toISOString() })
    .eq('id', applicationId);
  
  if (error) throw error;
}

// Application Scores
export async function createApplicationScore(score: Omit<ApplicationScore, 'id' | 'generated_at'>) {
  const { data, error } = await supabase
    .from('application_scores')
    .insert([score])
    .select();
  
  if (error) throw error;
  return data?.[0] as ApplicationScore;
}

export async function getApplicationScores(applicationId: string) {
  const { data, error } = await supabase
    .from('application_scores')
    .select('*')
    .eq('application_id', applicationId);
  
  if (error) throw error;
  return data as ApplicationScore[];
}

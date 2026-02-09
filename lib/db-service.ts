import { supabase } from './supabase';
import type { JobOffer, Candidate, Application, PipelineStage, Resume, ApplicationScore } from './supabase';

export { supabase } from './supabase';

// Job Offers
export async function getJobOffers() {
  console.log('[DB] Fetching job offers from Supabase...');

  const { data, error } = await supabase
    .from('job_offers')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[DB] ❌ Error fetching job offers:', error);
    throw error;
  }

  console.log('[DB] ✓ Fetched job offers:', data.length);
  // console.log('[DB] Job offers data:', JSON.stringify(data, null, 2));
  return data as JobOffer[];
}

export async function updateJobOfferStatus(jobId: string, status: 'Open' | 'Closed' | 'Draft') {
  console.log('[DB] Updating job offer status...');
  console.log('[DB] Job ID:', jobId);
  console.log('[DB] New status:', status);

  const { error } = await supabase
    .from('job_offers')
    .update({ status })
    .eq('id', jobId);

  if (error) {
    console.error('[DB] ❌ Error updating job offer status:', error);
    throw error;
  }

  console.log('[DB] ✓ Job offer status updated successfully');
}

export async function createJobOffer(offer: Omit<JobOffer, 'id' | 'created_at' | 'deleted_at'>) {
  console.log('[DB] Creating new job offer...');
  console.log('[DB] Offer data:', JSON.stringify(offer, null, 2));

  const { data, error } = await supabase
    .from('job_offers')
    .insert([offer])
    .select();

  if (error) {
    console.error('[DB] ❌ Error creating job offer:', error);
    throw error;
  }

  console.log('[DB] ✓ Job offer created successfully');
  console.log('[DB] Created job offer:', JSON.stringify(data?.[0], null, 2));
  return data?.[0] as JobOffer;
}

// Pipeline Stages
export async function getPipelineStages(jobOfferId: string) {
  console.log('[DB] Fetching pipeline stages for job:', jobOfferId);

  const { data, error } = await supabase
    .from('pipeline_stages')
    .select('*')
    .eq('job_offer_id', jobOfferId)
    .order('stage_order', { ascending: true });

  if (error) {
    console.error('[DB] ❌ Error fetching pipeline stages:', error);
    throw error;
  }

  console.log('[DB] ✓ Fetched pipeline stages:', data.length);
  // console.log('[DB] Pipeline stages:', JSON.stringify(data, null, 2));
  return data as PipelineStage[];
}

export async function updatePipelineStages(jobOfferId: string, stages: Array<{ name: string; stage_order: number }>) {
  console.log('[DB] Updating pipeline stages for job:', jobOfferId);
  console.log('[DB] New stages:', JSON.stringify(stages, null, 2));

  // Delete existing stages
  console.log('[DB] Deleting existing stages...');
  const { error: deleteError } = await supabase
    .from('pipeline_stages')
    .delete()
    .eq('job_offer_id', jobOfferId);

  if (deleteError) {
    console.error('[DB] ❌ Error deleting existing stages:', deleteError);
    throw deleteError;
  }
  console.log('[DB] ✓ Existing stages deleted');

  // Insert new stages
  console.log('[DB] Inserting new stages...');
  const { error } = await supabase
    .from('pipeline_stages')
    .insert(stages.map(s => ({ ...s, job_offer_id: jobOfferId })));

  if (error) {
    console.error('[DB] ❌ Error inserting new stages:', error);
    throw error;
  }

  console.log('[DB] ✓ Pipeline stages updated successfully');
}

// Candidates
export async function getCandidates(jobOfferId?: string) {
  console.log('[DB] Fetching candidates...');
  if (jobOfferId) {
    console.log('[DB] Filtering by job offer:', jobOfferId);
  }

  let query = supabase
    .from('candidates')
    .select('*')
    .is('deleted_at', null);

  if (jobOfferId) {
    query = query.eq('job_offers.id', jobOfferId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('[DB] ❌ Error fetching candidates:', error);
    throw error;
  }

  console.log('[DB] ✓ Fetched candidates:', data.length);
  return data as Candidate[];
}

export async function createCandidate(candidate: Omit<Candidate, 'id' | 'created_at' | 'deleted_at'>) {
  console.log('[DB] Creating new candidate...');
  console.log('[DB] Candidate data:', JSON.stringify(candidate, null, 2));

  // Normalize source to match check constraint
  let normalizedSource = 'upload';
  if (candidate.source) {
    const s = candidate.source.toLowerCase();
    if (s === 'linkedin') normalizedSource = 'linkedin';
    else if (s === 'cvtheque' || s === 'cvthèque') normalizedSource = 'cvtheque';
    else if (s === 'upload') normalizedSource = 'upload';
    // Any other value (like 'local') defaults to 'upload'
  }

  console.log('[DB] Candidate source (original):', candidate.source);
  console.log('[DB] Candidate source (normalized):', normalizedSource);

  const { data, error } = await supabase
    .from('candidates')
    .insert([{ ...candidate, source: normalizedSource }])
    .select();

  if (error) {
    console.error('[DB] ❌ Error creating candidate:', error);
    console.error('[DB] Error details:', JSON.stringify(error, null, 2));
    throw error;
  }

  console.log('[DB] ✓ Candidate created successfully');
  console.log('[DB] Created candidate:', JSON.stringify(data?.[0], null, 2));
  return data?.[0] as Candidate;
}

export async function updateCandidate(candidateId: string, updates: Partial<Candidate>) {
  console.log('[DB] Updating candidate:', candidateId);
  console.log('[DB] Updates:', JSON.stringify(updates, null, 2));

  const { data, error } = await supabase
    .from('candidates')
    .update(updates)
    .eq('id', candidateId)
    .select();

  if (error) {
    console.error('[DB] ❌ Error updating candidate:', error);
    throw error;
  }

  console.log('[DB] ✓ Candidate updated successfully');
  return data?.[0] as Candidate;
}

// Resumes
export async function createResume(resume: Omit<Resume, 'id' | 'created_at' | 'deleted_at'>) {
  console.log('[DB] Creating new resume...');
  console.log('[DB] Resume candidate_id:', resume.candidate_id);
  console.log('[DB] Resume source:', resume.source);
  console.log('[DB] Resume enriched:', resume.enriched);
  console.log('[DB] Resume parsed_data keys:', Object.keys(resume.parsed_data || {}));
  // console.log('[DB] Full parsed_data:', JSON.stringify(resume.parsed_data, null, 2));

  // Normalize source to match check constraint
  const normalizedSource = resume.source ?
    (resume.source.toLowerCase() === 'cvthèque' ? 'cvtheque' : resume.source.toLowerCase())
    : 'upload';

  const { data, error } = await supabase
    .from('resumes')
    .insert([{ ...resume, source: normalizedSource }])
    .select();

  if (error) {
    console.error('[DB] ❌ Error creating resume:', error);
    console.error('[DB] Error details:', JSON.stringify(error, null, 2));
    throw error;
  }

  console.log('[DB] ✓ Resume created successfully');
  console.log('[DB] Created resume:', JSON.stringify(data?.[0], null, 2));
  return data?.[0] as Resume;
}

export async function updateResume(resumeId: string, updates: Partial<Resume>) {
  console.log('[DB] Updating resume:', resumeId);
  console.log('[DB] Updates:', JSON.stringify(updates, null, 2));

  const { data, error } = await supabase
    .from('resumes')
    .update(updates)
    .eq('id', resumeId)
    .select();

  if (error) {
    console.error('[DB] ❌ Error updating resume:', error);
    throw error;
  }

  console.log('[DB] ✓ Resume updated successfully');
  return data?.[0] as Resume;
}

export async function getResume(resumeId: string) {
  console.log('[DB] Fetching resume:', resumeId);

  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('id', resumeId)
    .single();

  if (error) {
    console.error('[DB] ❌ Error fetching resume:', error);
    throw error;
  }

  console.log('[DB] ✓ Fetched resume');
  // console.log('[DB] Resume data:', JSON.stringify(data, null, 2));
  return data as Resume;
}

export async function updateResumeData(resumeId: string, parsedData: any) {
  console.log('[DB] Updating resume data...');
  console.log('[DB] Resume ID:', resumeId);
  console.log('[DB] New parsed_data:', JSON.stringify(parsedData, null, 2));

  const { error } = await supabase
    .from('resumes')
    .update({ parsed_data: parsedData })
    .eq('id', resumeId);

  if (error) {
    console.error('[DB] ❌ Error updating resume:', error);
    throw error;
  }

  console.log('[DB] ✓ Resume data updated successfully');
}

// Applications
export async function getApplications(jobOfferId?: string) {
  console.log('[DB] Fetching applications...');
  if (jobOfferId) {
    console.log('[DB] Filtering by job offer:', jobOfferId);
  }

  let query = supabase
    .from('applications')
    .select('*, candidate:candidates(*), resume:resumes(*), stage:pipeline_stages(*)')
    .is('deleted_at', null);

  if (jobOfferId) {
    query = query.eq('job_offer_id', jobOfferId);
  }

  const { data, error } = await query.order('applied_at', { ascending: false });

  if (error) {
    console.error('[DB] ❌ Error fetching applications:', error);
    console.error('[DB] Error details:', JSON.stringify(error, null, 2));
    throw error;
  }

  console.log('[DB] ✓ Fetched applications:', data.length);

  // Fallback: If any application is missing a resume, try to find it by candidate_id
  const appsWithMissingResumes = data.filter(app => !app.resume);
  if (appsWithMissingResumes.length > 0) {
    console.log(`[DB] Found ${appsWithMissingResumes.length} applications with missing resumes. Attempting fallback lookup...`);

    // Get all candidate IDs that need resumes
    const candidateIds = appsWithMissingResumes.map(app => app.candidate_id);

    // Fetch resumes for these candidates
    const { data: resumes, error: resumeError } = await supabase
      .from('resumes')
      .select('*')
      .in('candidate_id', candidateIds);

    if (!resumeError && resumes) {
      console.log(`[DB] Found ${resumes.length} fallback resumes.`);
      // Map resumes back to applications
      data.forEach(app => {
        if (!app.resume) {
          const matchingResume = resumes.find(r => r.candidate_id === app.candidate_id);
          if (matchingResume) {
            console.log(`[DB] Restored missing resume for candidate ${app.candidate_id}`);
            (app as any).resume = matchingResume;
          }
        }
      });
    }
  }

  return data as (Application & { candidate: Candidate; resume?: Resume; stage?: PipelineStage })[];
}

export async function createApplication(application: Omit<Application, 'id' | 'applied_at' | 'updated_at' | 'deleted_at'>) {
  console.log('[DB] Creating new application...');
  console.log('[DB] Application data:', JSON.stringify(application, null, 2));

  const { data, error } = await supabase
    .from('applications')
    .insert([application])
    .select();

  if (error) {
    console.error('[DB] ❌ Error creating application:', error);
    console.error('[DB] Error details:', JSON.stringify(error, null, 2));
    throw error;
  }

  console.log('[DB] ✓ Application created successfully');
  console.log('[DB] Created application:', JSON.stringify(data?.[0], null, 2));
  return data?.[0] as Application;
}

export async function updateApplicationStatus(applicationId: string, status: Application['status']) {
  console.log('[DB] Updating application status...');
  console.log('[DB] Application ID:', applicationId);
  console.log('[DB] New status:', status);

  const { error } = await supabase
    .from('applications')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', applicationId);

  if (error) {
    console.error('[DB] ❌ Error updating application status:', error);
    throw error;
  }

  console.log('[DB] ✓ Application status updated successfully');
}

export async function updateApplicationStage(applicationId: string, stageId: string) {
  console.log('[DB] Updating application stage...');
  console.log('[DB] Application ID:', applicationId);
  console.log('[DB] New stage ID:', stageId);

  const { error } = await supabase
    .from('applications')
    .update({ current_stage_id: stageId, updated_at: new Date().toISOString() })
    .eq('id', applicationId);

  if (error) {
    console.error('[DB] ❌ Error updating application stage:', error);
    throw error;
  }

  // Verification
  const { data: verifyData } = await supabase
    .from('applications')
    .select('current_stage_id')
    .eq('id', applicationId)
    .single();

  if (verifyData?.current_stage_id !== stageId) {
    console.error('[DB] ❌ Verification FAILED. Stage ID mismatch!', { expected: stageId, actual: verifyData?.current_stage_id });
  } else {
    console.log('[DB] ✓ Verification passed: Stage updated.');
  }

  console.log('[DB] ✓ Application stage updated successfully');
}

// Application Scores
export async function createApplicationScore(score: Omit<ApplicationScore, 'id' | 'generated_at'>) {
  console.log('[DB] Creating application score...');
  console.log('[DB] Score data:', JSON.stringify(score, null, 2));

  const { data, error } = await supabase
    .from('application_scores')
    .insert([score])
    .select();

  if (error) {
    console.error('[DB] ❌ Error creating application score:', error);
    throw error;
  }

  console.log('[DB] ✓ Application score created successfully');
  return data?.[0] as ApplicationScore;
}

export async function getApplicationScores(applicationId: string) {
  console.log('[DB] Fetching application scores for:', applicationId);

  const { data, error } = await supabase
    .from('application_scores')
    .select('*')
    .eq('application_id', applicationId);

  if (error) {
    console.error('[DB] ❌ Error fetching application scores:', error);
    throw error;
  }

  console.log('[DB] ✓ Fetched application scores:', data.length);
  return data as ApplicationScore[];
}
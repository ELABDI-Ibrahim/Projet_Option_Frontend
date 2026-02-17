import { supabase } from './supabase';
import type { JobOffer, Candidate, Application, PipelineStage, Resume, ApplicationScore } from './supabase';
import { ResumeParseData } from './api-service';

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
  return data as PipelineStage[];
}

export async function updatePipelineStages(jobOfferId: string, stages: Array<{ name: string; stage_order: number, id?: string }>) {
  console.log('[DB] Updating pipeline stages for job:', jobOfferId);

  // 1. Get existing stages to identify what to delete
  const { data: existingStages, error: fetchError } = await supabase
    .from('pipeline_stages')
    .select('id')
    .eq('job_offer_id', jobOfferId);

  if (fetchError) throw fetchError;

  // Identify stages to keep and delete
  const keptIds = stages
    .filter(s => s.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.id))
    .map(s => s.id);

  const stagesToDelete = existingStages?.filter(s => !keptIds.includes(s.id)).map(s => s.id) || [];

  // 2. Delete removed stages
  if (stagesToDelete.length > 0) {
    console.log('[DB] Deleting removed stages:', stagesToDelete);
    const { error: deleteError } = await supabase
      .from('pipeline_stages')
      .delete()
      .in('id', stagesToDelete);

    if (deleteError) {
      console.error('[DB] ❌ Error deleting stages:', deleteError);
      // Check for FK violation (e.g. applications in this stage)
      if (deleteError.code === '23503') {
        throw new Error(`Cannot delete a stage that has candidates in it. Please move candidates first.`);
      }
      throw deleteError;
    }
  }

  // Identifiy existing stages to update
  const existingStagesUpdates = stages.filter(s => s.id && keptIds.includes(s.id));

  // 3. Update existing stages to TEMP order (negative) to avoid unique constraint collisions
  if (existingStagesUpdates.length > 0) {
    // 3a. Temp update: set order to negative values
    const tempUpdates = existingStagesUpdates.map((s, index) => ({
      id: s.id,
      name: s.name,
      stage_order: -1000 - index, // Temp negative order
      job_offer_id: jobOfferId
    }));

    const { error: tempError } = await supabase
      .from('pipeline_stages')
      .upsert(tempUpdates);

    if (tempError) {
      console.error('[DB] ❌ Error setting temp stages:', tempError);
      throw tempError;
    }

    // 3b. Final update: set order to correct positive values
    const finalUpdates = existingStagesUpdates.map(s => ({
      id: s.id,
      name: s.name,
      stage_order: s.stage_order,
      job_offer_id: jobOfferId
    }));

    const { error: finalError } = await supabase
      .from('pipeline_stages')
      .upsert(finalUpdates);

    if (finalError) {
      console.error('[DB] ❌ Error setting final stages:', finalError);
      throw finalError;
    }
  }

  // 4. Insert new stages
  const newStages = stages.filter(s => !s.id || !keptIds.includes(s.id));

  if (newStages.length > 0) {
    const insertPayload = newStages.map(s => ({
      name: s.name,
      stage_order: s.stage_order,
      job_offer_id: jobOfferId
    }));

    const { error: insertError } = await supabase
      .from('pipeline_stages')
      .insert(insertPayload);

    if (insertError) {
      console.error('[DB] ❌ Error inserting new stages:', insertError);
      throw insertError;
    }
  }

  console.log('[DB] ✓ Pipeline stages updated successfully (reordering handled)');
}

// Candidates
// NOTE: "getCandidates" is ambiguous in new schema because candidates are shared.
// Usually we want "Applications" (candidate + context of a specific job apply).
// But for legacy support or "Talent Pool" views, we might fetch candidates directly.
export async function getCandidates(jobOfferId?: string) {
  console.log('[DB] Fetching candidates...');

  if (jobOfferId) {
    // If jobOfferId is provided, we should probably be looking at APPLICATIONS
    console.log('[DB] Filtering by job offer via applications...');
    const apps = await getApplications(jobOfferId);
    return apps.map(app => ({
      ...app.candidate,
      // Merge application context into candidate for UI compatibility
      status: app.status,
      currentStageId: app.current_stage_id,
      jobOfferId: app.job_offer_id,
      applicationId: app.id,
      resumeId: app.resume_id,
      score: 0 // Default or fetch from scores table
    }));
  }

  // Otherwise, fetch pure candidates (Talent Pool view)
  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[DB] ❌ Error fetching candidates:', error);
    throw error;
  }

  console.log('[DB] ✓ Fetched candidates:', data.length);
  return data as Candidate[];
}

export async function createCandidate(candidate: Omit<Candidate, 'id' | 'created_at' | 'deleted_at'>) {
  console.log('[DB] Creating new candidate...');
  // Note: This creates a raw candidate. Usually we use the upload flow which creates everything.

  const { data, error } = await supabase
    .from('candidates')
    .insert([candidate])
    .select();

  if (error) {
    console.error('[DB] ❌ Error creating candidate:', error);
    throw error;
  }

  console.log('[DB] ✓ Candidate created successfully');
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
  return data as Resume;
}

export async function updateResumeData(resumeId: string, parsedData: ResumeParseData) {
  console.log('[DB] Updating resume data...');
  console.log('[DB] Resume ID:', resumeId);

  const { error } = await supabase
    .from('resumes')
    .update({
      parsed_data: parsedData,
      enriched: true // Assume update means enriched or corrected
    })
    .eq('id', resumeId);

  if (error) {
    console.error('[DB] ❌ Error updating resume:', error);
    throw error;
  }

  console.log('[DB] ✓ Resume data updated successfully');
}

export async function getAllResumes() {
  console.log('[DB] Fetching ALL resumes (Lake view)...');

  const { data, error } = await supabase
    .from('resumes')
    .select('*, candidate:candidates(id, full_name, email, location, linkedin_url)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[DB] ❌ Error fetching all resumes:', error);
    throw error;
  }

  console.log('[DB] ✓ Fetched all resumes:', data.length);
  return data as (Resume & { candidate?: Candidate })[];
}

// Applications
export async function getApplications(jobOfferId?: string) {
  console.log('[DB] Fetching applications...');
  if (jobOfferId) {
    console.log('[DB] Filtering by job offer:', jobOfferId);
  }

  // Join logic is slightly different now
  let query = supabase
    .from('applications')
    .select(`
      *,
      candidate:candidates(*),
      resume:resumes(*),
      stage:pipeline_stages(*),
      application_scores(*)
    `)
    .is('deleted_at', null);

  if (jobOfferId) {
    query = query.eq('job_offer_id', jobOfferId);
  }

  const { data, error } = await query.order('applied_at', { ascending: false });

  if (error) {
    console.error('[DB] ❌ Error fetching applications:', error);
    throw error;
  }

  console.log('[DB] ✓ Fetched applications:', data.length);

  return data as (Application & { candidate: Candidate; resume?: Resume; stage?: PipelineStage; application_scores?: ApplicationScore[] })[];
}

export async function createApplication(application: Omit<Application, 'id' | 'applied_at' | 'updated_at' | 'deleted_at'>) {
  console.log('[DB] Creating new application...', JSON.stringify(application, null, 2));

  const { data, error } = await supabase
    .from('applications')
    .insert([application])
    .select();

  if (error) {
    console.error('[DB] ❌ Error creating application:', error);
    console.error('[DB] Application payload:', application);
    console.error('[DB] Error details - Message:', error.message);
    console.error('[DB] Error details - Code:', error.code);
    console.error('[DB] Error details - Details:', error.details);
    console.error('[DB] Error details - Hint:', error.hint);
    throw error;
  }

  console.log('[DB] ✓ Application created successfully');
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

  console.log('[DB] ✓ Application stage updated successfully');
}

// Application Scores
export async function createApplicationScore(score: Omit<ApplicationScore, 'id' | 'generated_at'>) {
  console.log('[DB] Creating application score...');

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

export async function autoShortlistCandidates(jobId: string, candidateLimit: number = 5) {
  console.log('[DB] Auto-shortlisting candidates...');
  console.log('[DB] Job ID:', jobId);
  console.log('[DB] Limit:', candidateLimit);

  const { data, error } = await supabase
    .rpc('auto_shortlist_candidates', {
      job_id: jobId,
      candidate_limit: candidateLimit
    });

  if (error) {
    console.error('[DB] ❌ Error auto-shortlisting candidates:', error);
    throw error;
  }

  console.log('[DB] ✓ Auto-shortlisting successful:', data);
  return data;
}

export async function autoScoreCandidates(jobId: string) {
  console.log('[DB] Auto-scoring candidates for job:', jobId);

  const { data, error } = await supabase
    .rpc('auto_score_applicants', {
      target_job_id: jobId
    });

  if (error) {
    console.error('[DB] ❌ Error auto-scoring candidates:', error);
    throw error;
  }

  console.log('[DB] ✓ Auto-scoring successful:', data);
  return data;
}
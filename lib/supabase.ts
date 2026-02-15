import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions matching SQL Schema

export type ApplicationStatus = 'applied' | 'shortlisted' | 'next_round' | 'declined' | 'hired';
export type JobOfferStatus = 'Open' | 'Closed' | 'Draft';
export type SourceParams = 'linkedin' | 'upload' | 'cvtheque';

export interface Company {
  id: string;
  name: string;
  website?: string | null;
  created_at: string;
}

export interface JobOffer {
  id: string;
  company_id?: string | null;
  title: string;
  description?: string | null;
  department?: string | null;
  location?: string | null;
  contract_type?: string | null;
  status: JobOfferStatus;
  created_at: string;
  deleted_at?: string | null;
  skills?: string[] | null;
}

export interface Candidate {
  id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  linkedin_url?: string | null;
  location?: string | null;
  source: SourceParams;
  created_at: string;
  deleted_at?: string | null;
}

export interface Resume {
  id: string;
  candidate_id: string;
  parsed_data: any; // JSONB
  parsed_text?: string | null;
  file_url?: string | null;
  source: SourceParams;
  enriched: boolean;
  created_at: string;
  deleted_at?: string | null;
}

export interface PipelineStage {
  id: string;
  job_offer_id: string;
  name: string;
  stage_order: number;
  created_at: string;
}

export interface Application {
  id: string;
  job_offer_id: string;
  candidate_id: string;
  resume_id?: string | null;
  current_stage_id?: string | null;
  status: ApplicationStatus;
  applied_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface ApplicationScore {
  id: string;
  application_id: string;
  score_type: string;
  score_value: number;
  explanation?: string | null;
  model_metadata?: any; // JSONB
  generated_at: string;
}

export interface ApplicationEvent {
  id: string;
  application_id: string;
  actor?: string | null;
  from_status?: string | null;
  to_status?: string | null;
  note?: string | null;
  created_at: string;
}

export interface Attachment {
  id: string;
  resume_id: string;
  storage_path: string;
  filename?: string | null;
  content_type?: string | null;
  size_bytes?: number | null;
  uploaded_at: string;
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions
export interface Company {
  id: string;
  name: string;
  website?: string;
  created_at: string;
}

export interface JobOffer {
  id: string;
  company_id?: string;
  title: string;
  description?: string;
  department?: string;
  location?: string;
  contract_type?: string;
  status: 'Open' | 'Closed' | 'Draft';
  created_at: string;
  deleted_at?: string;
  skills?: string[];
}

export interface Candidate {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  location?: string;
  source: 'linkedin' | 'upload' | 'cvtheque';
  created_at: string;
  deleted_at?: string;
}

export interface Resume {
  id: string;
  candidate_id: string;
  parsed_data: any;
  file_url?: string;
  source: 'linkedin' | 'upload' | 'cvtheque';
  enriched: boolean;
  created_at: string;
  deleted_at?: string;
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
  resume_id?: string;
  current_stage_id?: string;
  status: 'applied' | 'shortlisted' | 'next_round' | 'declined' | 'hired';
  applied_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface ApplicationScore {
  id: string;
  application_id: string;
  score_type: string;
  score_value: number;
  explanation?: string;
  generated_at: string;
}

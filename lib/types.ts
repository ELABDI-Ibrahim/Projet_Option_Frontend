/**
 * Type definitions for the ATS application
 * All data is now stored in Supabase - no mock data
 */

export interface Candidate {
  id: string;
  jobOfferId?: string;
  source: "LinkedIn" | "Local" | "CVthèque" | "linkedin" | "upload" | "cvtheque";
  score: number;
  status: "Pending" | "Next Round" | "Declined";
  currentRound: number;
  currentStageId?: string;
  name: string;
  email?: string;
  location: string;
  about: string | null;
  linkedin_url: string;
  open_to_work: boolean;
  experiences: Array<{
    position_title: string;
    institution_name: string;
    from_date: string;
    to_date: string;
    duration: string;
    location: string;
    description: string;
    linkedin_url?: string | null; // Added nullable for strict compatibility
  }>;
  educations: Array<{
    institution_name: string;
    degree: string;
    from_date: string;
    to_date: string;
    duration?: string;
    location: string;
    description?: string;
    linkedin_url?: string | null; // Added nullable for strict compatibility
  }>;
  skills: Array<{
    category: string;
    items: string[];
  }>;
  projects: Array<{
    project_name: string;
    role: string | null;
    from_date: string | null;
    to_date: string | null;
    duration: string | null;
    technologies: string[];
    description: string | null;
    url: string | null;
  }>;
  contacts: string[];
  accomplishments: string[];
  interests: string[];
  enriched: boolean;
  linkedinData?: any;
  file?: File;
  file_url?: string;
}

export interface Round {
  id: string;
  name: string;
  order: number;
}

export interface JobOffer {
  id: string;
  title: string;
  description: string;
  status: 'Open' | 'Closed';
  skills_required: string[];
  rounds: Round[];
  candidateCount?: number;
}

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
  }>;
  educations: Array<{
    institution_name: string;
    degree: string;
    from_date: string;
    to_date: string;
    location: string;
    description?: string;
  }>;
  skills?: Array<{
    category: string;
    items: string[];
  }>;
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
  contacts?: string[];
  accomplishments?: string[];
  interests?: string[];
  enriched: boolean;
  experiences?: Array<{
    position_title: string;
    institution_name: string;
    from_date: string;
    to_date: string;
    description?: string;
  }>;
  educations?: Array<{
    institution_name: string;
    degree: string;
    from_date?: string;
    to_date?: string;
  }>;
  skills?: string[];
  contacts?: string[];
  accomplishments?: string[];
  interests?: string[];
};
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

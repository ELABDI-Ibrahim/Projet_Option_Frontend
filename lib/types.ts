/**
 * Type definitions for the ATS application
 * All data is now stored in Supabase - no mock data
 */

// Import DB types to ensure consistency (optional, but good practice if we want to extend them)
// For now, we will redefine or map them as needed for the UI.

export interface Candidate {
  id: string;
  // Relationship fields for UI convenience
  jobOfferId?: string; // Derived from application
  currentStageId?: string; // Derived from application

  // Core fields from Candidate/Resume
  source: "LinkedIn" | "Local" | "CVthèque" | "linkedin" | "upload" | "cvtheque";
  score: number; // Derived from latest AI score
  status: "Pending" | "Next Round" | "Declined" | "applied" | "shortlisted" | "next_round" | "declined" | "hired"; // Application status
  currentRound: number; // Derived order

  name: string; // from candidates.full_name
  email?: string | null;
  phone?: string | null;
  location: string | null;
  about: string | null; // from resume.parsed_data
  linkedin_url: string | null;
  open_to_work: boolean; // from resume.parsed_data

  // Parsed Resume Data
  experiences: Array<{
    position_title: string;
    institution_name: string;
    from_date: string;
    to_date: string;
    duration: string | null;
    location: string | null;
    description: string | null;
    linkedin_url?: string | null;
  }>;
  educations: Array<{
    institution_name: string;
    degree: string;
    from_date: string;
    to_date: string;
    duration?: string | null;
    location: string | null;
    description?: string | null;
    linkedin_url?: string | null;
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

  // Metadata
  enriched: boolean;
  linkedinData?: any; // To store raw or merged linkedin data if needed separately
  file?: File; // For upload flow
  file_url?: string;

  // New API/DB Linkage
  applicationId?: string;
  resumeId?: string;
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
  status: 'Open' | 'Closed' | 'Draft';
  skills_required: string[];
  rounds: Round[];
  candidateCount?: number;
}

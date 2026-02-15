// LinkedIn Resume Verification API Service
// Base URL for the API
const BASE_URL = process.env.NEXT_PUBLIC_RESUME_API_URL || 'https://web-production-f19a8.up.railway.app';

export interface ResumeParseData {
  linkedin_url: string | null;
  name: string;
  location: string | null;
  about: string | null;
  open_to_work: boolean | null;
  experiences: Array<{
    position_title: string;
    institution_name: string;
    linkedin_url: string | null;
    from_date: string | null;
    to_date: string | null;
    duration: string | null;
    location: string | null;
    description: string | null;
  }>;
  educations: Array<{
    degree: string;
    institution_name: string;
    linkedin_url: string | null;
    from_date: string | null;
    to_date: string | null;
    duration: string | null;
    location: string | null;
    description: string | null;
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
  interests: string[];
  accomplishments: string[];
  contacts: string[];
  linkedinData?: LinkedInProfileData;
  [key: string]: any; // Allow other fields
}

export interface LinkedInProfileData {
  name?: string;
  headline?: string;
  location?: string;
  about?: string;
  experiences?: Array<{
    position_title: string;
    institution_name: string;
    from_date: string;
    to_date: string;
    duration?: string;
    location?: string;
    description?: string;
  }>;
  educations?: Array<{
    institution_name: string;
    degree: string;
    from_date: string;
    to_date: string;
    location?: string;
    description?: string;
  }>;
  skills?: string[];
  contacts?: string[];
  accomplishments?: string[];
  interests?: string[];
}

export interface UploadResumeResponse {
  success: boolean;
  message: string;
  data: {
    candidate_id: string;
    resume_id: string;
    application_id: string | null;
    file_url: string;
    parsed_data: ResumeParseData;
  };
}

/**
 * Check API health status
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    return data.status === 'healthy';
  } catch (error) {
    console.log('[API] Health check failed:', error);
    return false;
  }
}

/**
 * Upload Resume (New Main Entry Point)
 * Uploads a resume PDF, parses it, uploads to storage, and creates DB records.
 */
export async function uploadResume(
  file: File,
  jobOfferId?: string
): Promise<UploadResumeResponse> {
  try {
    console.log('[API] Uploading resume...');
    console.log('[API] File:', file.name, 'Size:', file.size);
    if (jobOfferId) console.log('[API] Job Offer ID:', jobOfferId);

    const formData = new FormData();
    formData.append('file', file);
    if (jobOfferId) {
      formData.append('job_offer_id', jobOfferId);
    }

    const response = await fetch(`${BASE_URL}/api/upload-resume`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Upload error response:', errorText);
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[API] Upload success:', data);
    return data as UploadResumeResponse;
  } catch (error) {
    console.error('[API] Upload error:', error);
    throw error;
  }
}

/**
 * Parse resume (Standalone)
 * Used mostly for testing or if we need pure parsing without storage/DB
 */
export async function parseResume(file: File): Promise<ResumeParseData | null> {
  try {
    console.log('[API] Parsing resume (standalone)...');

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BASE_URL}/api/parse-resume`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `API error: ${response.status}`);
    }

    const data = await response.json();
    // Support both wrapped "data" and direct return
    return data.data || data;
  } catch (error) {
    console.error('[API] Parse error:', error);
    throw error;
  }
}

/**
 * Enrich Resume
 * Updates the resume with LinkedIn data. Now replaces the entire resume object.
 */
export async function enrichResume(
  resumeData: ResumeParseData,
  linkedinUrl?: string,
  name?: string
): Promise<ResumeParseData> {
  try {
    console.log('[API] Enriching resume...');

    const payload = {
      resume_data: resumeData,
      linkedin_url: linkedinUrl,
      name: name
    };

    const response = await fetch(`${BASE_URL}/api/enrich-resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Enrichment failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[API] Enrichment success. New data received.');
    return data.data || data; // Return the new, enriched resume structure
  } catch (error) {
    console.error('[API] Enrichment error:', error);
    throw error;
  }
}

/**
 * Parse resume and find LinkedIn URL (does NOT scrape on upload)
 * 1. Parse resume
 * 2. Check if resume contains LinkedIn URL
 * 3. If not found, use findLinkedInProfile to locate it
 * 4. Return resume with LinkedIn URL for display only
 */
export async function enrichCandidateFromResume(
  file: File,
  company?: string,
  location?: string
): Promise<{
  resume: ResumeParseData | null;
  linkedInUrl: string | null;
}> {
  try {
    // Step 1: Parse resume
    const resumeData = await parseResume(file);
    if (!resumeData?.name) {
      throw new Error('Could not extract name from resume');
    }

    // Step 2: Check if resume already has LinkedIn URL
    let linkedInUrl = resumeData.linkedin_url || null;

    // Step 3: If no LinkedIn URL in resume, find it using name and company
    if (!linkedInUrl) {
      console.log('[API] No LinkedIn URL in resume, searching for profile...');
      linkedInUrl = await findLinkedInProfile(
        resumeData.name,
        company || resumeData.experiences?.[0]?.institution_name,
        location || resumeData.location || undefined
      );
    }

    if (linkedInUrl) {
      console.log('[API] LinkedIn URL found:', linkedInUrl);
      resumeData.linkedin_url = linkedInUrl;
    }

    return {
      resume: resumeData,
      linkedInUrl: linkedInUrl || null,
    };
  } catch (error) {
    console.error('[API] Error parsing resume:', error);
    // Throw error to be caught by UI
    throw error;
  }
}

/**
 * Find LinkedIn Profile URL
 */
export async function findLinkedInProfile(
  name: string,
  company?: string,
  location?: string
): Promise<string | null> {
  try {
    const payload = {
      name,
      ...(company && { company }),
      ...(location && { location }),
    };

    const response = await fetch(`${BASE_URL}/api/find-linkedin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    return data.data?.url || null;
  } catch (error) {
    console.log('[API] Error finding LinkedIn:', error);
    return null;
  }
}

/**
 * Scrape LinkedIn Profile
 */
export async function scrapeLinkedInProfile(
  profileUrl: string,
  name?: string
): Promise<LinkedInProfileData | null> {
  try {
    console.log('[API] Scraping LinkedIn...');

    const payload: any = { profile_url: profileUrl };
    if (name) payload.name = name;

    const response = await fetch(`${BASE_URL}/api/scrape-linkedin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error('[API] Scrape error:', error);
    return null;
  }
}

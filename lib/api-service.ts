// LinkedIn Resume Verification API Service
// Base URL for the API
const BASE_URL = process.env.NEXT_PUBLIC_RESUME_API_URL || 'https://web-production-f19a8.up.railway.app';

export interface ResumeParseData {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  linkedin_url?: string;
  experiences?: Array<{
    position_title: string;
    institution_name: string;
    from_date: string;
    to_date: string;
    duration: string;
    location: string;
    description: string;
  }>;
  educations?: Array<{
    institution_name: string;
    degree: string;
    from_date: string;
    to_date: string;
    location: string;
  }>;
  skills?: string[];
}

export interface LinkedInProfileData {
  name?: string;
  headline?: string;
  location?: string;
  about?: string;
  experience?: Array<{
    position_title: string;
    institution_name: string;
    from_date: string;
    to_date: string;
    description?: string;
  }>;
  education?: Array<{
    institution_name: string;
    degree: string;
    from_date?: string;
    to_date?: string;
  }>;
  skills?: string[];
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
    console.log('[v0] API health check failed:', error);
    return false;
  }
}

/**
 * Parse resume from file
 * Accepts PDF, DOC, DOCX, TXT formats
 */
export async function parseResume(file: File): Promise<ResumeParseData | null> {
  try {
    console.log('[v0] [PARSE] Starting resume parsing');
    console.log('[v0] [PARSE] File name:', file.name, 'Size:', file.size);

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BASE_URL}/api/parse-resume`, {
      method: 'POST',
      body: formData,
    });

    console.log('[v0] [PARSE] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('[v0] [PARSE] ERROR response:', errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[v0] [PARSE] Response data:', JSON.stringify(data));
    console.log('[v0] [PARSE] Extracted data - Name:', data.data?.name, 'LinkedIn URL:', data.data?.linkedin_url);
    
    return data.data || null;
  } catch (error) {
    console.log('[v0] [PARSE] ERROR:', error);
  }
}

/**
 * Find LinkedIn profile URL using name, company, and location
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

    console.log('[v0] Finding LinkedIn profile for:', payload);

    const response = await fetch(`${BASE_URL}/api/find-linkedin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[v0] LinkedIn profile found:', data.linkedin_url);
    
    return data.linkedin_url || null;
  } catch (error) {
    console.log('[v0] Error finding LinkedIn profile:', error);
    return null;
  }
}

/**
 * Scrape LinkedIn profile data from profile URL
 * Note: Requires session.json on the server
 */
export async function scrapeLinkedInProfile(
  profileUrl: string
): Promise<LinkedInProfileData | null> {
  try {
    console.log('[v0] [SCRAPE] Starting LinkedIn scrape');
    console.log('[v0] [SCRAPE] Profile URL:', profileUrl);
    console.log('[v0] [SCRAPE] API Endpoint:', `${BASE_URL}/api/scrape-linkedin`);

    const response = await fetch(`${BASE_URL}/api/scrape-linkedin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_url: profileUrl }),
    });

    console.log('[v0] [SCRAPE] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('[v0] [SCRAPE] ERROR response:', errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[v0] [SCRAPE] Response data:', JSON.stringify(data));
    console.log('[v0] [SCRAPE] Extracted LinkedIn data:', data.data);
    
    return data.data || null;
  } catch (error) {
    console.log('[v0] [SCRAPE] ERROR:', error);
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
      console.log('[v0] No LinkedIn URL in resume, searching for profile...');
      linkedInUrl = await findLinkedInProfile(
        resumeData.name,
        company || resumeData.experiences?.[0]?.institution_name,
        location || resumeData.location
      );
    }

    if (linkedInUrl) {
      console.log('[v0] LinkedIn URL found:', linkedInUrl);
      resumeData.linkedin_url = linkedInUrl;
    }

    return {
      resume: resumeData,
      linkedInUrl: linkedInUrl || null,
    };
  } catch (error) {
    console.log('[v0] Error parsing resume:', error);
    return {
      resume: null,
      linkedInUrl: null,
    };
  }
}

/**
 * Merge resume and LinkedIn data for comprehensive candidate profile
 */
export function mergeResumeAndLinkedIn(
  resume: ResumeParseData,
  linkedIn: LinkedInProfileData
): ResumeParseData {
  return {
    name: linkedIn.name || resume.name,
    email: resume.email,
    phone: resume.phone,
    location: linkedIn.location || resume.location,
    summary: linkedIn.about || resume.summary,
    experiences: linkedIn.experience || resume.experiences,
    educations: linkedIn.education || resume.educations,
    skills: [...new Set([...(resume.skills || []), ...(linkedIn.skills || [])])],
  };
}

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
      throw new Error(errorText || `API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[v0] [PARSE] Response data:', JSON.stringify(data));

    // Check if the response is wrapped in 'data' or returned directly
    const parsedData = data.data || data;

    console.log('[v0] [PARSE] Extracted data - Name:', parsedData?.name, 'LinkedIn URL:', parsedData?.linkedin_url);

    return parsedData || null;
  } catch (error) {
    console.error('[v0] [PARSE] ERROR:', error);
    // Re-throw the error so it can be caught by the UI
    throw error;
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
    console.log('[v0] Find LinkedIn Response:', JSON.stringify(data));
    console.log('[v0] LinkedIn profile found:', data.data?.url);

    return data.data?.url || null;
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
  profileUrl: string,
  name?: string
): Promise<LinkedInProfileData | null> {
  try {
    console.log('[v0] [SCRAPE] Starting LinkedIn scrape');
    console.log('[v0] [SCRAPE] Profile URL:', profileUrl);
    console.log('[v0] [SCRAPE] Name:', name);
    console.log('[v0] [SCRAPE] API Endpoint:', `${BASE_URL}/api/scrape-linkedin`);

    const payload: any = { profile_url: profileUrl };
    if (name) {
      payload.name = name;
    }

    const response = await fetch(`${BASE_URL}/api/scrape-linkedin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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
    return null; // Return null on error, don't throw to avoid breaking the flow if enrichment fails
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
        location || resumeData.location || undefined
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
    console.error('[v0] Error parsing resume:', error);
    // Throw error to be caught by UI
    throw error;
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
    linkedin_url: resume.linkedin_url,
    name: linkedIn.name || resume.name,
    location: linkedIn.location || resume.location,
    about: linkedIn.about || resume.about,
    open_to_work: resume.open_to_work,
    experiences: (linkedIn.experiences || resume.experiences || []).map(exp => ({
      position_title: exp.position_title,
      institution_name: exp.institution_name,
      linkedin_url: (exp as any).linkedin_url || null,
      from_date: exp.from_date,
      to_date: exp.to_date,
      duration: exp.duration || null,
      location: exp.location || null,
      description: exp.description || null
    })),
    educations: (linkedIn.educations || resume.educations || []).map(edu => ({
      degree: edu.degree,
      institution_name: edu.institution_name,
      linkedin_url: (edu as any).linkedin_url || null,
      from_date: edu.from_date,
      to_date: edu.to_date,
      duration: (edu as any).duration || null,
      location: edu.location || null,
      description: edu.description || null
    })),
    skills: [
      ...resume.skills,
      ...(linkedIn.skills && linkedIn.skills.length > 0
        ? [{ category: 'LinkedIn Skills', items: linkedIn.skills }]
        : [])
    ],
    projects: resume.projects,
    interests: [...new Set([...resume.interests, ...(linkedIn.interests || [])])],
    accomplishments: [...new Set([...resume.accomplishments, ...(linkedIn.accomplishments || [])])],
    contacts: [...new Set([...resume.contacts, ...(linkedIn.contacts || [])])],
  };
}

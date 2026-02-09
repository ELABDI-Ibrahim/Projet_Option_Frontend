# LinkedIn Resume Verification API Integration

## Overview

This ATS integrates with the **LinkedIn Resume Verification API** to automate resume parsing, LinkedIn profile discovery, and candidate enrichment. The API automatically extracts candidate information from resumes and cross-references with LinkedIn profiles for verification and enrichment.

**API Base URL:** `https://web-production-f19a8.up.railway.app`

---

## Features

- **Resume Parsing**: Extracts structured data from PDF, DOC, DOCX, and TXT resumes
- **LinkedIn Discovery**: Finds LinkedIn profiles using candidate name, company, and location
- **Profile Scraping**: Retrieves comprehensive LinkedIn profile data (experience, education, skills)
- **Data Enrichment**: Merges resume and LinkedIn data into a unified candidate profile
- **Bulk Operations**: Process multiple candidates efficiently with built-in delays

---

## API Endpoints

### 1. Health Check

**Endpoint:** `GET /health`

Verify API availability before making requests.

```typescript
const response = await fetch('https://web-production-f19a8.up.railway.app/health');
const data = await response.json();
// { "status": "healthy" }
```

---

### 2. Parse Resume

**Endpoint:** `POST /api/parse-resume`

Extracts structured data from a resume file.

**Request:**
- Method: `POST`
- Body: `FormData` with `file` field
- Supported formats: PDF, DOC, DOCX, TXT

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-123-4567",
    "location": "San Francisco, CA",
    "summary": "Senior Software Engineer with 10 years of experience",
    "experiences": [
      {
        "position_title": "Senior Engineer",
        "institution_name": "Google",
        "from_date": "2020-01-01",
        "to_date": "Present",
        "duration": "4 years",
        "location": "Mountain View, CA",
        "description": "Led backend infrastructure team"
      }
    ],
    "educations": [
      {
        "institution_name": "MIT",
        "degree": "BS Computer Science",
        "from_date": "2010-09-01",
        "to_date": "2014-05-15",
        "location": "Cambridge, MA"
      }
    ],
    "skills": ["Python", "JavaScript", "AWS", "Kubernetes"]
  }
}
```

**TypeScript Usage:**
```typescript
import { parseResume } from '@/lib/api-service';

const resumeFile = document.getElementById('resume-input').files[0];
const parsedData = await parseResume(resumeFile);

console.log(parsedData.name); // "John Doe"
console.log(parsedData.skills); // ["Python", "JavaScript", ...]
```

---

### 3. Find LinkedIn Profile

**Endpoint:** `POST /api/find-linkedin`

Searches for a LinkedIn profile using name, company, and location.

**Request:**
```json
{
  "name": "John Doe",
  "company": "Google",
  "location": "San Francisco, CA"
}
```

**Response:**
```json
{
  "success": true,
  "linkedin_url": "https://www.linkedin.com/in/johndoe/"
}
```

**TypeScript Usage:**
```typescript
import { findLinkedInProfile } from '@/lib/api-service';

const linkedInUrl = await findLinkedInProfile(
  'John Doe',
  'Google',
  'San Francisco, CA'
);

console.log(linkedInUrl); // "https://www.linkedin.com/in/johndoe/"
```

**Notes:**
- `company` and `location` parameters are optional but improve accuracy
- Returns `null` if no profile is found
- May return multiple results (first match is returned)

---

### 4. Scrape LinkedIn Profile

**Endpoint:** `POST /api/scrape-linkedin`

Extracts comprehensive data from a LinkedIn profile.

**Requirements:**
- `session.json` must be configured on the server for LinkedIn authentication
- LinkedIn session should be active and valid
- Rate limiting: ~1-2 seconds per profile recommended

**Request:**
```json
{
  "profile_url": "https://www.linkedin.com/in/johndoe/"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "John Doe",
    "headline": "Senior Software Engineer at Google",
    "location": "San Francisco, CA",
    "about": "Passionate about building scalable systems...",
    "experience": [
      {
        "position_title": "Senior Software Engineer",
        "institution_name": "Google",
        "from_date": "2020-01-01",
        "to_date": null,
        "description": "Led backend infrastructure team"
      }
    ],
    "education": [
      {
        "institution_name": "MIT",
        "degree": "BS Computer Science",
        "from_date": "2010-09-01",
        "to_date": "2014-05-15"
      }
    ],
    "skills": ["Python", "JavaScript", "AWS", "Kubernetes", "Docker"]
  }
}
```

**TypeScript Usage:**
```typescript
import { scrapeLinkedInProfile } from '@/lib/api-service';

const linkedInData = await scrapeLinkedInProfile(
  'https://www.linkedin.com/in/johndoe/'
);

console.log(linkedInData.name);
console.log(linkedInData.skills);
```

---

### 5. Verify Resume (Complete Pipeline)

**Endpoint:** `POST /api/verify`

Compares resume data against LinkedIn profile for verification.

**Request Option A (with file + URL):**
```formdata
file: <resume.pdf>
linkedin_url: https://www.linkedin.com/in/johndoe/
```

**Request Option B (JSON data):**
```json
{
  "resume_data": { ... },
  "linkedin_data": { ... }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overall_confidence": 0.87,
    "matches": {
      "name": true,
      "experience": 0.9,
      "education": 0.85,
      "skills": 0.8
    },
    "flags": ["Employment gap detected"]
  }
}
```

---

## Complete Enrichment Pipeline

The recommended flow for automatic candidate enrichment:

```typescript
import { enrichCandidateFromResume } from '@/lib/api-service';

// Single function handles entire pipeline
const { resume, linkedIn, linkedInUrl } = await enrichCandidateFromResume(
  resumeFile,
  'Google',        // optional company
  'San Francisco'  // optional location
);

// Result:
// - Resume parsed with all structured data
// - LinkedIn profile found using resume name + company
// - LinkedIn profile scraped for complete data
// - All data merged into unified candidate profile
```

**Flow Diagram:**
```
Resume File
    ↓
Parse Resume (extract name, company, location, etc.)
    ↓
Find LinkedIn Profile (using extracted info)
    ↓
Scrape LinkedIn Profile (get comprehensive data)
    ↓
Merge Resume + LinkedIn Data
    ↓
Complete Candidate Profile
```

---

## Data Models

### ResumeParseData

```typescript
interface ResumeParseData {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
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
```

### LinkedInProfileData

```typescript
interface LinkedInProfileData {
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
```

---

## Error Handling

All API functions return `null` on error and log debug information:

```typescript
import { findLinkedInProfile } from '@/lib/api-service';

const url = await findLinkedInProfile('John Doe');

if (!url) {
  console.log('LinkedIn profile not found');
  // Handle gracefully - use resume data only
}
```

**Common Issues:**

| Issue | Solution |
|-------|----------|
| API returns 500 | Check API health status, verify session.json exists |
| LinkedIn profile not found | Try with company name + location, or verify profile is public |
| Parsing fails on PDF | Ensure PDF is readable text (not scanned image) |
| Rate limit hit | Add delays between bulk requests (2s per profile) |

---

## Configuration

### Environment Variables

```env
NEXT_PUBLIC_RESUME_API_URL=https://web-production-f19a8.up.railway.app
```

Set in `.env.local` for development, or in deployment settings for production.

### Optional: LinkedIn Session Setup

To enable LinkedIn scraping, configure `session.json` on the API server:

```json
{
  "user_id": "YOUR_LINKEDIN_ID",
  "session_cookie": "YOUR_SESSION_COOKIE",
  "csrf_token": "YOUR_CSRF_TOKEN"
}
```

---

## Usage Examples

### Example 1: Parse Resume Only

```typescript
const file = await fetch('/resume.pdf').then(r => r.blob());
const resume = await parseResume(new File([file], 'resume.pdf'));

console.log(resume.name);
console.log(resume.skills);
```

### Example 2: Full Enrichment Pipeline

```typescript
const { resume, linkedIn, linkedInUrl } = await enrichCandidateFromResume(
  resumeFile
);

const candidate = {
  name: linkedIn?.name || resume?.name,
  email: resume?.email,
  location: linkedIn?.location || resume?.location,
  about: linkedIn?.about || resume?.summary,
  experiences: linkedIn?.experience || resume?.experiences,
  skills: [...new Set([
    ...(resume?.skills || []),
    ...(linkedIn?.skills || [])
  ])],
  linkedInUrl
};
```

### Example 3: Bulk Candidate Enrichment

```typescript
async function enrichBulkCandidates(resumeFiles: File[]) {
  const results = [];

  for (const file of resumeFiles) {
    const data = await enrichCandidateFromResume(file);
    results.push(data);
    
    // Rate limiting: 2 seconds between profiles
    await new Promise(r => setTimeout(r, 2000));
  }

  return results;
}
```

---

## Limitations & Best Practices

### Limitations

- LinkedIn scraping requires active session (manual login required)
- Public profiles only (private profiles cannot be scraped)
- Rate limited by LinkedIn (avoid <1 second between requests)
- PDF must contain readable text (no scanned images)

### Best Practices

1. **Always check health status** before bulk operations
2. **Implement caching** to avoid duplicate API calls
3. **Add rate limiting** (2+ seconds between bulk operations)
4. **Handle null gracefully** - enrichment may fail, use resume data as fallback
5. **Monitor API logs** for session expiration issues
6. **Use bulk endpoint** for multiple candidates instead of sequential calls

---

## Troubleshooting

### Issue: "Could not extract name from resume"

**Cause:** Resume format not supported or name not found
**Solution:** Ensure resume is a readable PDF/DOC, name appears clearly at top

### Issue: "LinkedIn profile not found"

**Cause:** Profile doesn't exist or is private
**Solution:** Try with company name, verify LinkedIn URL manually

### Issue: "API health check failed"

**Cause:** Server is down or unreachable
**Solution:** Check API status, verify environment variable is correct

### Issue: Enrichment returns partial data

**Cause:** One step in pipeline failed, but others succeeded
**Solution:** Check console logs for specific endpoint error

---

## Future Enhancements

- [ ] Batch verification endpoint
- [ ] Webhook notifications for async processing
- [ ] Redis caching for LinkedIn profile data
- [ ] Resume template detection
- [ ] Multi-language support
- [ ] Advanced matching algorithms
- [ ] Fraud detection scoring

---

## Support

For API issues or questions:
1. Check server logs at `https://web-production-f19a8.up.railway.app/health`
2. Review console logs with `[v0]` prefix for debug info
3. Verify session.json configuration on server
4. Test individual endpoints with Postman/cURL

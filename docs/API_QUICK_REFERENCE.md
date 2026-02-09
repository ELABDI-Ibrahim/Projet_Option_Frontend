# API Quick Reference

## Overview

LinkedIn Resume Verification API integration for automatic resume parsing and candidate enrichment.

**Base URL:** `https://web-production-f19a8.up.railway.app`

---

## Quick Start

### 1. Parse a Resume

```typescript
import { parseResume } from '@/lib/api-service';

const file = document.getElementById('resume-input').files[0];
const data = await parseResume(file);

console.log(data.name);    // "John Doe"
console.log(data.email);   // "john@example.com"
console.log(data.skills);  // ["Python", "JavaScript", ...]
```

### 2. Find LinkedIn Profile

```typescript
import { findLinkedInProfile } from '@/lib/api-service';

const url = await findLinkedInProfile(
  'John Doe',           // required
  'Google',             // optional
  'San Francisco, CA'   // optional
);

console.log(url); // "https://linkedin.com/in/johndoe/"
```

### 3. Scrape LinkedIn Profile

```typescript
import { scrapeLinkedInProfile } from '@/lib/api-service';

const data = await scrapeLinkedInProfile(
  'https://linkedin.com/in/johndoe/'
);

console.log(data.about);
console.log(data.experience);
console.log(data.skills);
```

### 4. Complete Pipeline (Most Common)

```typescript
import { enrichCandidateFromResume } from '@/lib/api-service';

const { resume, linkedIn, linkedInUrl } = await enrichCandidateFromResume(
  resumeFile,
  'Google',              // optional
  'San Francisco, CA'    // optional
);

// Now you have:
// - resume: Parsed resume data
// - linkedIn: LinkedIn profile data
// - linkedInUrl: LinkedIn URL
```

---

## API Functions

### `parseResume(file: File)`

Extracts structured data from resume file.

**Returns:** `ResumeParseData | null`

**Supports:** PDF, DOC, DOCX, TXT

---

### `findLinkedInProfile(name, company?, location?)`

Finds LinkedIn profile URL.

**Parameters:**
- `name` (required): Full name
- `company` (optional): Current/previous company
- `location` (optional): City or region

**Returns:** `string | null` (LinkedIn URL or null)

---

### `scrapeLinkedInProfile(profileUrl)`

Retrieves data from LinkedIn profile.

**Requires:** Valid session.json on server

**Returns:** `LinkedInProfileData | null`

---

### `enrichCandidateFromResume(file, company?, location?)`

Complete pipeline: parse → find LinkedIn → scrape LinkedIn

**Returns:** 
```typescript
{
  resume: ResumeParseData | null;
  linkedIn: LinkedInProfileData | null;
  linkedInUrl: string | null;
}
```

---

### `mergeResumeAndLinkedIn(resume, linkedIn)`

Combines resume and LinkedIn data intelligently.

**Returns:** `ResumeParseData` (merged data)

---

## Data Structures

### ResumeParseData

```typescript
{
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  experiences?: Experience[];
  educations?: Education[];
  skills?: string[];
}
```

### LinkedInProfileData

```typescript
{
  name?: string;
  headline?: string;
  location?: string;
  about?: string;
  experience?: Experience[];
  education?: Education[];
  skills?: string[];
}
```

### Experience

```typescript
{
  position_title: string;
  institution_name: string;
  from_date: string;
  to_date: string;
  duration?: string;
  location?: string;
  description?: string;
}
```

### Education

```typescript
{
  institution_name: string;
  degree: string;
  from_date?: string;
  to_date?: string;
  location?: string;
}
```

---

## Common Patterns

### Parse + Auto-enrich

```typescript
const { resume, linkedIn, linkedInUrl } = await enrichCandidateFromResume(
  resumeFile
);

const candidate = {
  name: resume.name,
  email: resume.email,
  linkedinUrl: linkedInUrl,
  enriched: !!linkedIn
};
```

### Find LinkedIn Only

```typescript
const url = await findLinkedInProfile(candidateName, company, location);

if (url) {
  // Open LinkedIn profile for manual review
  window.open(url);
}
```

### Fallback Pattern

```typescript
let data = await parseResume(file);

if (!data) {
  // Fallback to filename extraction
  data = {
    name: file.name.replace(/\.[^/.]+$/, ''),
    email: null,
    skills: []
  };
}

const candidate = createCandidate(data);
```

---

## Error Handling

All functions return `null` on error. Check logs for details:

```typescript
const url = await findLinkedInProfile(name);

if (!url) {
  console.log('LinkedIn profile not found');
  // Use resume data only
}
```

Console logs include `[v0]` prefix for debugging.

---

## Performance Tips

1. **Batch Processing:** Add 2+ second delay between profiles
```typescript
for (const file of files) {
  await enrichCandidateFromResume(file);
  await new Promise(r => setTimeout(r, 2000));
}
```

2. **Cache Results:** Store parsed data in memory or database
```typescript
const cache = new Map();
const key = file.name + file.size;
if (!cache.has(key)) {
  cache.set(key, await enrichCandidateFromResume(file));
}
```

3. **Skip When Possible:** Don't enrich closed positions
```typescript
if (jobOffer.status === 'Open') {
  await enrichCandidateFromResume(file);
}
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `null` returned | Check console for `[v0]` error logs |
| LinkedIn not found | Try with company name or verify profile is public |
| API errors | Verify `NEXT_PUBLIC_RESUME_API_URL` environment variable |
| Session expired | Re-authenticate on server (update session.json) |
| Parsing failed | Ensure PDF is readable text, not scanned image |

---

## Environment Setup

```bash
# .env.local
NEXT_PUBLIC_RESUME_API_URL=https://web-production-f19a8.up.railway.app
```

---

## Files

- `/lib/api-service.ts` - API integration functions
- `/components/offers-tab.tsx` - Integration in resume upload
- `/docs/LINKEDIN_RESUME_API.md` - Full documentation
- `/docs/API_QUICK_REFERENCE.md` - This file

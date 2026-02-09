# ATS + Supabase Integration - Complete Setup

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables

Create or update `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

Get these values from your Supabase project:
- Go to **Settings → API** 
- Copy **Project URL** and **Anon Key**

### 3. Seed Database with Mock Data
```bash
npm exec ts-node scripts/seed-database.ts
```

This creates:
- 1 company (TechCorp)
- 3 job offers with interview pipeline stages
- 4 candidates with resumes
- 8 applications linking candidates to jobs

### 4. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000`

## Files Created

### Configuration
- `.env.local` - Supabase credentials (YOU add the actual values)

### Libraries
- `lib/supabase.ts` - Supabase client and TypeScript types
- `lib/db-service.ts` - Database query functions

### Database
- `scripts/seed-database.ts` - Populates database with mock data

### Documentation
- `docs/SUPABASE_SETUP.md` - Detailed Supabase setup guide
- `SETUP_INSTRUCTIONS.md` - This file

## What's Connected

The following features now use real Supabase data:

✓ **Job Offers Tab**
  - View all job offers from database
  - Create new job offers
  - Change offer status (Open/Closed)
  - Manage pipeline stages
  - Add/view candidates per offer

✓ **Offers Tab** (Candidates by Job)
  - View candidates for each job offer
  - Upload and parse resumes
  - Score candidates
  - Track enrichment status

✓ **Job Board Tab**
  - Browse all open job offers
  - Search by title/location
  - View offer details
  - Close/reopen positions

✓ **Pipeline Tab**
  - View candidates organized by interview round
  - Move candidates between pipeline stages
  - Track candidate progress
  - View scores and status

✓ **Analytics Tab**
  - Real-time statistics from database
  - Candidate count per offer
  - Open positions count
  - Average candidate scores

## Database Schema Overview

```
Companies (1) ─────→ Job Offers (3)
                        │
                        ├─→ Pipeline Stages (9 total: 3 per job)
                        └─→ Applications (8)
                             │
                             └─→ Candidates (4)
                                  │
                                  └─→ Resumes (4)
```

## Environment Variables

Required:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public API key

These are prefixed with `NEXT_PUBLIC_` so they're safe to expose in the browser.

## Troubleshooting

**"Missing Supabase environment variables"**
- Check `.env.local` exists in project root
- Verify both URL and ANON_KEY are set
- Restart dev server after making changes

**"Cannot find module '@supabase/supabase-js'"**
- Run `npm install`

**Data not appearing after seed**
- Check Supabase dashboard for any errors
- Verify seed script completed: look for "✓ Database seeding completed successfully!"
- Try refreshing the browser

**"Permission denied" errors**
- Check Supabase RLS policies (Settings → Authentication)
- For development, you can disable RLS temporarily

## Next Steps

After setup:

1. **Test the UI** - Navigate through all tabs to verify data loads
2. **Try CRUD operations** - Create job offers, add candidates
3. **Check logs** - Open DevTools Console (F12) to see [v0] debug logs
4. **Configure RLS** - Set up Row Level Security for production
5. **Add authentication** - Set up Supabase Auth for user management

## Support Files

- `docs/LINKEDIN_RESUME_API.md` - LinkedIn API integration documentation
- `docs/API_QUICK_REFERENCE.md` - Quick reference for API endpoints
- `docs/SUPABASE_SETUP.md` - Detailed Supabase setup guide

## Local Development

All data modifications are saved directly to your Supabase project. 

**Important:** The mock data seed is idempotent - running it multiple times will create duplicate records. If needed, manually delete records from the Supabase dashboard or create a cleanup script.

# Supabase Setup Guide

This guide walks you through setting up the ATS with Supabase as the database backend.

## Prerequisites

- Supabase account (create at https://supabase.com)
- Existing Supabase project with the database schema already created

## Step 1: Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Click on **Settings** → **API**
3. Copy your:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **Anon Key** (public key)

## Step 2: Configure Environment Variables

1. Open `.env.local` in the project root
2. Replace the placeholder values with your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:** Keep these credentials private. `.env.local` is already in `.gitignore`.

## Step 3: Seed the Database

The project includes mock data to get you started. To seed the database:

```bash
# Install dependencies if not done yet
npm install

# Run the seed script (requires npm 10+)
npm exec ts-node scripts/seed-database.ts
```

The script will:
- Create a company (TechCorp)
- Create 3 job offers (Data Analyst, Data Science Engineer, Project Manager)
- Create 4 candidates with sample resumes
- Set up default pipeline stages for each job offer
- Create applications linking candidates to job offers

## Step 4: Verify the Setup

1. Go to your Supabase Dashboard
2. Check each table in the SQL Editor:
   - `companies` - should have 1 record
   - `job_offers` - should have 3 records
   - `candidates` - should have 4 records
   - `resumes` - should have 4 records
   - `applications` - should have 8 records
   - `pipeline_stages` - should have 9 records (3 per job)

## Step 5: Start the Application

```bash
npm run dev
```

The application will now use real Supabase data instead of mock data in memory.

## Database Schema

### Core Tables

- **companies** - Company information
- **job_offers** - Job positions (linked to companies)
- **candidates** - Candidate information
- **resumes** - Resume data with parsed information
- **applications** - Links candidates to job offers with status tracking
- **pipeline_stages** - Interview rounds for each job offer
- **application_scores** - Scoring data for candidates
- **application_events** - Activity log of status changes

## Features Enabled

✓ Create and manage job offers  
✓ Upload and parse resumes  
✓ Track candidates through interview pipeline  
✓ Score and enrich candidate profiles  
✓ Manage interview rounds per position  
✓ Track application status and history  
✓ Real-time data synchronization  

## Troubleshooting

### "Missing Supabase environment variables"
- Check `.env.local` exists and has correct values
- Restart dev server: `npm run dev`

### "Permission denied" errors
- Check your Supabase Row Level Security (RLS) policies
- For testing, you can disable RLS in Settings → Authentication

### Data not appearing
- Verify the seed script ran successfully
- Check Supabase dashboard for any database errors
- Try refreshing the application (Ctrl+Shift+R)

## Next Steps

- Customize pipeline stages per job offer
- Add more candidates and job offers
- Configure LinkedIn integration
- Set up scoring algorithms

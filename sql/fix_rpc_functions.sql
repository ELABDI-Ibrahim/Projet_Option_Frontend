-- Enable pg_trgm for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

----------------------------------------------------------------
-- 1. Helper Function: Get Matching Resumes
-- Fix: Checks if CANDIDATE has applied, not just if resume was used.
----------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_matching_resumes_for_job(
    target_job_id uuid,
    limit_count int DEFAULT 5,
    match_threshold float DEFAULT 0.3
)
RETURNS TABLE (
    candidate_id uuid,
    resume_id uuid,
    full_name text,
    email text,
    match_count bigint,
    total_skills_required int,
    match_percentage int,
    matched_skills text[]
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH job_reqs AS (
        -- Get skills from the job offer
        SELECT unnest(skills) as skill, array_length(skills, 1) as total_count
        FROM public.job_offers
        WHERE id = target_job_id
    ),
    all_scored_resumes AS (
        -- Score eligible resumes
        SELECT 
            r.candidate_id,
            r.id as resume_id,
            r.created_at as resume_date,
            c.full_name,
            COALESCE(c.email::text, r.parsed_data->'contacts'->>1) as email,
            COUNT(DISTINCT jr.skill) as skill_hits,
            array_agg(DISTINCT jr.skill) as skills_found,
            MAX(jr.total_count) as total_reqs
        FROM 
            public.resumes r
        JOIN 
            public.candidates c ON r.candidate_id = c.id
        CROSS JOIN 
            job_reqs jr
        WHERE 
            r.deleted_at IS NULL
            AND c.deleted_at IS NULL
            -- CRITICAL FIX: Check if CANDIDATE has applied to this job (via any resume)
            AND NOT EXISTS (
                SELECT 1 FROM public.applications a 
                WHERE a.job_offer_id = target_job_id
                AND a.candidate_id = r.candidate_id
            )
            -- Match logic
            AND (
                (r.parsed_data -> 'skills')::text ILIKE '%' || jr.skill || '%'
                OR word_similarity(jr.skill, (r.parsed_data -> 'skills')::text) > match_threshold
            )
        GROUP BY 
            r.id, r.candidate_id, r.created_at, c.full_name, c.email
    ),
    best_resume_per_candidate AS (
        -- Deduplicate: Pick the SINGLE BEST resume per candidate
        SELECT DISTINCT ON (candidate_id) 
            *
        FROM all_scored_resumes
        ORDER BY 
            candidate_id,      
            skill_hits DESC,   
            resume_date DESC   
    )
    -- Final Selection
    SELECT 
        b.candidate_id,
        b.resume_id,
        b.full_name,
        b.email,
        b.skill_hits,
        b.total_reqs,
        CASE WHEN b.total_reqs > 0 
             THEN (b.skill_hits::float / b.total_reqs::float * 100)::int 
             ELSE 0 
        END as match_percentage,
        b.skills_found
    FROM 
        best_resume_per_candidate b
    ORDER BY 
        b.skill_hits DESC
    LIMIT limit_count;
END;
$$;

----------------------------------------------------------------
-- 2. Main Function: Auto-Shortlist / Auto-Source
-- Fix: Assigns correct pipeline stage and handles insertion.
----------------------------------------------------------------
CREATE OR REPLACE FUNCTION auto_shortlist_candidates(
    job_id uuid,
    candidate_limit int DEFAULT 5
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    inserted_count int;
    first_stage_id uuid;
BEGIN
    -- Get the first stage for this job (e.g. "Screening" or "Applied")
    SELECT id INTO first_stage_id 
    FROM public.pipeline_stages 
    WHERE job_offer_id = job_id 
    ORDER BY stage_order ASC 
    LIMIT 1;

    IF first_stage_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'No pipeline stages found for this job.');
    END IF;

    -- Perform the Insert
    WITH matches AS (
        SELECT * FROM get_matching_resumes_for_job(job_id, candidate_limit)
    ),
    insert_operation AS (
        INSERT INTO public.applications (
            job_offer_id, 
            candidate_id, 
            resume_id, 
            current_stage_id, 
            status,
            applied_at,
            updated_at
        )
        SELECT 
            job_id, 
            candidate_id, 
            resume_id, 
            first_stage_id,   -- Set the stage
            'shortlisted', 
            now(),
            now()
        FROM matches
        -- Safety: If race condition happens, do nothing (requires unique constraint on job_id, candidate_id)
        ON CONFLICT DO NOTHING 
        RETURNING id
    )
    SELECT COUNT(*) INTO inserted_count FROM insert_operation;

    -- Return a success message
    RETURN json_build_object(
        'success', true, 
        'message', inserted_count || ' candidates have been shortlisted.'
    );
END;
$$;

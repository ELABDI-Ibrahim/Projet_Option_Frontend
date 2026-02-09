import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL:', supabaseUrl);
  console.error('Supabase Key:', supabaseAnonKey ? 'Present' : 'Missing');
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedDatabase() {
  console.log('Starting database seeding...');

  try {
    // 1. Create Company
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .insert([
        {
          name: 'FORVIS MAZARS',
          website: 'https://www.forvismazars.com/ma/fr',
        },
      ])
      .select();

    if (companyError) {
      console.error('Error inserting company:', companyError);
      return;
    }

    const companyId = companyData?.[0]?.id;
    console.log('✓ Company created:', companyId);

    // 2. Create Job Offers
    const { data: jobsData, error: jobsError } = await supabase
      .from('job_offers')
      .insert([
        {
          company_id: companyId,
          title: 'Data Analyst',
          description: 'Analyze data trends, create dashboards, and provide insights to support business decisions.',
          location: 'Paris',
          contract_type: 'Full-time',
          status: 'Open',
        },
        {
          company_id: companyId,
          title: 'Data Science Engineer',
          description: 'Build machine learning models, develop data pipelines, and deploy AI solutions.',
          location: 'London',
          contract_type: 'Full-time',
          status: 'Open',
        },
        {
          company_id: companyId,
          title: 'Project Manager',
          description: 'Lead cross-functional teams, manage timelines, and ensure successful project delivery.',
          location: 'Berlin',
          contract_type: 'Full-time',
          status: 'Open',
        },
      ])
      .select();

    if (jobsError) {
      console.error('Error inserting job offers:', jobsError);
      return;
    }

    console.log('✓ Job offers created:', jobsData?.length);

    // 3. Create Pipeline Stages for each job
    const defaultRounds = [
      { name: 'HR Round', stage_order: 1 },
      { name: 'Manager Round', stage_order: 2 },
      { name: 'Partner Round', stage_order: 3 },
    ];

    for (const job of jobsData || []) {
      const stages = defaultRounds.map((round) => ({
        job_offer_id: job.id,
        ...round,
      }));

      const { error: stagesError } = await supabase
        .from('pipeline_stages')
        .insert(stages);

      if (stagesError) {
        console.error('Error inserting stages:', stagesError);
        return;
      }
    }

    console.log('✓ Pipeline stages created');

    // 4. Create Candidates with real LinkedIn data
    const { data: candidatesData, error: candidatesError } = await supabase
      .from('candidates')
      .insert([
        {
          full_name: 'Ayoub Bourhaim',
          email: 'ayoub.bourhaim@example.com',
          phone: '+33612345678',
          location: 'Nice, France',
          source: 'linkedin',
          linkedin_url: 'https://www.linkedin.com/in/ayoub-bourhaim/',
        },
        {
          full_name: 'Chaymae Dahhassi',
          email: 'chaymae.dahhassi@example.com',
          phone: '+33612345679',
          location: 'Morocco',
          source: 'linkedin',
          linkedin_url: 'https://www.linkedin.com/in/chaymae~dahhassi/',
        },
        {
          full_name: 'Ibrahim EA',
          email: 'ibrahim.ea@example.com',
          phone: '+33612345680',
          location: 'Greater Metz Area',
          source: 'cvtheque',
          linkedin_url: 'https://www.linkedin.com/in/ibrahim-ea-942a7122a/',
        },
        {
          full_name: 'Laila Ait Bihi',
          email: 'laila.aitbihi@example.com',
          phone: '+33612345681',
          location: 'Gif-sur-Yvette, France',
          source: 'linkedin',
          linkedin_url: 'https://www.linkedin.com/in/laila-ait-bihi-112836251/',
        },
        {
          full_name: 'Omar Bellmir',
          email: 'omar.bellmir@example.com',
          phone: '+33612345682',
          location: 'Paris, France',
          source: 'linkedin',
          linkedin_url: 'https://www.linkedin.com/in/bellmiromar/',
        },
      ])
      .select();

    if (candidatesError) {
      console.error('Error inserting candidates:', candidatesError);
      return;
    }

    console.log('✓ Candidates created:', candidatesData?.length);

    // 5. Create Resumes with parsed LinkedIn data
    const resumeData = [
      {
        candidate_id: candidatesData?.[0]?.id, // Ayoub Bourhaim
        parsed_data: {
          name: 'Ayoub Bourhaim',
          email: 'ayoub.bourhaim@example.com',
          location: 'Nice, Provence-Alpes-Côte d\'Azur, France',
          experiences: [
            {
              position_title: 'AI Developer',
              institution_name: 'Schneider Electric',
              from_date: '2025-03-01',
              to_date: '2025-09-01',
              description: 'Internship in AI Development',
            },
            {
              position_title: 'AMI Intelligent Metering Systems Deployment Intern',
              institution_name: 'ONEE - Branche Electricité',
              from_date: '2024-04-01',
              to_date: '2024-07-01',
              description: 'Skills: EnergyIP, Siemens, Python, Azure DevOps, SAP ERP, Anomaly detection, fraud detect, machine learning, Deep learning',
            },
            {
              position_title: 'Professional Project - Diagnosis and prognosis of bearing faults in high-speed trains',
              institution_name: 'SIANA - Société Marocaine de Maintenance des Rames à Grande Vitesse',
              from_date: '2023-09-01',
              to_date: '2024-01-01',
              description: 'Data processing with SQL, clustering algorithms (K-means), classification algorithms (KNN, SVM, Neural Networks, Autoencoders)',
            },
          ],
          educations: [
            {
              institution_name: 'Centrale Méditerranée',
              degree: 'Intelligence artificielle',
              from_date: '2024-09-01',
              to_date: '2025-09-01',
            },
            {
              institution_name: 'Ecole Centrale Casablanca',
              degree: 'Diplôme d\'ingénieur',
              from_date: '2022-09-01',
              to_date: '2024-08-01',
            },
          ],
          skills: ['Python', 'Machine Learning', 'Deep Learning', 'SQL', 'TensorFlow', 'PyTorch', 'Data Science'],
        },
        source: 'linkedin',
        enriched: true,
      },
      {
        candidate_id: candidatesData?.[1]?.id, // Chaymae Dahhassi
        parsed_data: {
          name: 'Chaymae Dahhassi',
          email: 'chaymae.dahhassi@example.com',
          location: 'Morocco',
          experiences: [
            {
              position_title: 'Management & Strategy - Group Life Center of Excellence',
              institution_name: 'AXA en France',
              from_date: '2025-02-01',
              to_date: '2025-08-01',
              description: 'Project Management, Planning, Coordination, Insurance Pricing, Akur8',
            },
            {
              position_title: 'Project Manager - Group Underwriting Office - GIE AXA',
              institution_name: 'AXA',
              from_date: '2024-09-01',
              to_date: '2025-01-01',
              description: 'Evaluating inclusive insurance practices, researching industry trends, analyzing medical data, developing data monitoring tools and dashboards',
            },
            {
              position_title: 'Data Scientist',
              institution_name: 'OCP Group',
              from_date: '2023-07-01',
              to_date: '2023-08-01',
              description: 'Data Science internship',
            },
          ],
          educations: [
            {
              institution_name: 'Ecole Centrale Casablanca',
              degree: 'Master of Engineering - Major in Data Science and Digitalization, Minor in Consulting',
              from_date: '2022-09-01',
              to_date: '2026-06-01',
            },
            {
              institution_name: 'Centrale Lyon',
              degree: 'Exchange semester',
              from_date: '2024-02-01',
              to_date: '2024-07-01',
            },
          ],
          skills: ['Project Management', 'Data Science', 'Insurance Pricing', 'Stakeholder Management', 'Python'],
        },
        source: 'linkedin',
        enriched: true,
      },
      {
        candidate_id: candidatesData?.[2]?.id, // Ibrahim EA
        parsed_data: {
          name: 'Ibrahim EA',
          email: 'ibrahim.ea@example.com',
          location: 'Greater Metz Area',
          experiences: [
            {
              position_title: 'Data & Digitalization (ATS with AI Capabilities)',
              institution_name: 'Forvis Mazars Group',
              from_date: '2025-10-01',
              to_date: 'Present',
              description: 'Developed ATS with AI capabilities, CV parsing, ML matching module using embeddings and supervised scoring models',
            },
            {
              position_title: 'Data Scientist & Operations Research Intern',
              institution_name: 'Groupe Crédit Agricole',
              from_date: '2025-01-01',
              to_date: '2025-06-01',
              description: 'Collateral optimization model, ETL pipelines (Python, SQL), statistical analyses and predictive modeling',
            },
            {
              position_title: 'Data Analyste Intern',
              institution_name: 'Societe Generale',
              from_date: '2024-07-01',
              to_date: '2024-12-01',
              description: 'Exploratory analysis, Power BI dashboards, AI-based signature verification model',
            },
          ],
          educations: [
            {
              institution_name: 'CentraleSupélec',
              degree: 'Master of Engineering - MEng, Artificial Intelligence / Data Science',
              from_date: '2023-11-01',
              to_date: '2023-11-01',
            },
            {
              institution_name: 'Ecole Centrale Casablanca',
              degree: 'Master of Engineering - MEng',
              from_date: '2022-09-01',
              to_date: '2022-09-01',
            },
          ],
          skills: ['Python', 'SQL', 'Machine Learning', 'Data Science', 'NLP', 'Large Language Models', 'Power BI'],
        },
        source: 'cvtheque',
        enriched: true,
      },
      {
        candidate_id: candidatesData?.[3]?.id, // Laila Ait Bihi
        parsed_data: {
          name: 'Laila Ait Bihi',
          email: 'laila.aitbihi@example.com',
          location: 'Gif-sur-Yvette, Île-de-France, France',
          experiences: [
            {
              position_title: 'Chef de projet automatisation et transformation digitale',
              institution_name: 'Carrefour',
              from_date: '2025-01-01',
              to_date: '2025-08-01',
              description: 'Project management, automation, digital transformation',
            },
            {
              position_title: 'Data Analyst',
              institution_name: 'Carrefour',
              from_date: '2024-07-01',
              to_date: '2024-12-01',
              description: 'Data analysis and reporting',
            },
            {
              position_title: 'Logistics Flow Diagnostic & Optimization intern',
              institution_name: 'Groupe ONCF',
              from_date: '2023-06-01',
              to_date: '2023-08-01',
              description: 'Data Analysis for logistics optimization',
            },
          ],
          educations: [
            {
              institution_name: 'Ecole Centrale Casablanca',
              degree: 'Bac+5, ENGINEERING',
              from_date: '2022-09-01',
              to_date: '2022-09-01',
            },
            {
              institution_name: 'CentraleSupélec',
              degree: 'Engineer\'s degree, Mathematics',
              from_date: '2024-02-01',
              to_date: '2024-06-01',
            },
          ],
          skills: ['Data Analysis', 'Supply Chain Management', 'Data Science', 'Digital Transformation'],
        },
        source: 'linkedin',
        enriched: true,
      },
      {
        candidate_id: candidatesData?.[4]?.id, // Omar Bellmir
        parsed_data: {
          name: 'Omar Bellmir',
          email: 'omar.bellmir@example.com',
          location: 'Paris, Île-de-France, France',
          experiences: [
            {
              position_title: 'Strategy and CSR apprentice',
              institution_name: 'IDEMIA',
              from_date: '2024-09-01',
              to_date: '2025-09-01',
              description: 'Analyzed SBTi reduction target, scenario modeling, cost assessment, natural disaster risk assessments',
            },
            {
              position_title: 'Supply Chain Backhauling Intern',
              institution_name: 'Carrefour',
              from_date: '2024-02-01',
              to_date: '2024-06-01',
              description: 'Supply chain audit, backhauling strategy implementation, reduced transportation costs by 2.4%',
            },
          ],
          educations: [
            {
              institution_name: 'CentraleSupélec',
              degree: 'Master of Engineering - MEng, Engineering',
              from_date: '2023-09-01',
              to_date: '2026-09-01',
            },
            {
              institution_name: 'University of Paris I: Panthéon-Sorbonne',
              degree: 'Master\'s degree, Innovation, Technology Management & Sustainable Development',
              from_date: '2024-09-01',
              to_date: '2025-09-01',
            },
            {
              institution_name: 'Ecole Centrale Casablanca',
              degree: 'Engineering degree',
              from_date: '2022-09-01',
              to_date: '2026-09-01',
            },
          ],
          skills: ['Strategy', 'Risk Assessment', 'Supply Chain Management', 'Project Management', 'Data Science'],
        },
        source: 'linkedin',
        enriched: true,
      },
    ];

    const { error: resumesError } = await supabase
      .from('resumes')
      .insert(resumeData);

    if (resumesError) {
      console.error('Error inserting resumes:', resumesError);
      return;
    }

    console.log('✓ Resumes created');

    // 6. Create Applications
    const applications = [
      // Ayoub Bourhaim - AI/ML background
      {
        job_offer_id: jobsData?.[0]?.id, // Data Analyst
        candidate_id: candidatesData?.[0]?.id,
        status: 'applied' as const,
      },
      {
        job_offer_id: jobsData?.[1]?.id, // Data Science Engineer
        candidate_id: candidatesData?.[0]?.id,
        status: 'applied' as const,
      },
      // Chaymae Dahhassi - Project Management & Data Science
      {
        job_offer_id: jobsData?.[0]?.id, // Data Analyst
        candidate_id: candidatesData?.[1]?.id,
        status: 'applied' as const,
      },
      {
        job_offer_id: jobsData?.[2]?.id, // Project Manager
        candidate_id: candidatesData?.[1]?.id,
        status: 'applied' as const,
      },
      // Ibrahim EA - Currently at Forvis Mazars (strong fit)
      {
        job_offer_id: jobsData?.[0]?.id, // Data Analyst
        candidate_id: candidatesData?.[2]?.id,
        status: 'applied' as const,
      },
      {
        job_offer_id: jobsData?.[1]?.id, // Data Science Engineer
        candidate_id: candidatesData?.[2]?.id,
        status: 'applied' as const,
      },
      // Laila Ait Bihi - Data Analyst background
      {
        job_offer_id: jobsData?.[0]?.id, // Data Analyst
        candidate_id: candidatesData?.[3]?.id,
        status: 'applied' as const,
      },
      {
        job_offer_id: jobsData?.[2]?.id, // Project Manager
        candidate_id: candidatesData?.[3]?.id,
        status: 'applied' as const,
      },
      // Omar Bellmir - Strategy & Supply Chain
      {
        job_offer_id: jobsData?.[2]?.id, // Project Manager
        candidate_id: candidatesData?.[4]?.id,
        status: 'applied' as const,
      },
      {
        job_offer_id: jobsData?.[0]?.id, // Data Analyst
        candidate_id: candidatesData?.[4]?.id,
        status: 'applied' as const,
      },
    ];

    const { error: applicationsError } = await supabase
      .from('applications')
      .insert(applications);

    if (applicationsError) {
      console.error('Error inserting applications:', applicationsError);
      return;
    }

    console.log('✓ Applications created');

    console.log('\n✓ Database seeding completed successfully!');
    console.log('\nSeeded profiles:');
    console.log('- Ayoub Bourhaim (AI Developer at Schneider Electric)');
    console.log('- Chaymae Dahhassi (Project Manager at AXA)');
    console.log('- Ibrahim EA (Currently at Forvis Mazars - ATS Development)');
    console.log('- Laila Ait Bihi (Data Analyst at Carrefour)');
    console.log('- Omar Bellmir (Strategy at IDEMIA)');
  } catch (error) {
    console.error('Seeding error:', error);
  }
}

seedDatabase();
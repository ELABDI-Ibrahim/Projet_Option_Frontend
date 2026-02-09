// Base candidate profiles (immutable)
const CANDIDATE_PROFILES = {
  "ibrahim": {
    source: "LinkedIn" as const,
    linkedin_url: "linkedin.com/in/el-abdi-ibrahim-942a7122a",
    name: "Ibrahim El Abdi",
    location: "Metz, Grand Est, France",
    about: "Data Science and AI Engineering student seeking a 2026 end-of-studies internship, with strong skills in machine learning, optimization, and data-driven problem solving.",
    open_to_work: true,
    experiences: [
      {
        position_title: "Data Science Intern",
        institution_name: "GROUPE CRÉDIT AGRICOLE",
        from_date: "Jan 2025",
        to_date: "Jun 2025",
        duration: "6 months",
        location: "Paris, France",
        description: "Built and deployed a collateral optimization model combining linear programming and heuristics to improve financing efficiency. Developed automated ETL pipelines (Python, SQL) to ingest and prepare financial datasets. Applied statistical analysis and predictive modeling on credit and risk datasets. Reduced computation time by 10x through algorithmic redesign."
      },
      {
        position_title: "Data Science Intern",
        institution_name: "SOCIÉTÉ GÉNÉRALE",
        from_date: "Jul 2024",
        to_date: "Dec 2024",
        duration: "6 months",
        location: "Paris, France",
        description: "Conducted data exploration and modeling on automotive remarketing and financial risk datasets. Developed interactive analytics dashboards in Power BI. Built an AI-based signature verification model using CNNs. Automated financial reporting workflows using Python + VBA."
      }
    ],
    educations: [
      {
        institution_name: "CentraleSupélec",
        degree: "Master of Engineering (MEng), Artificial Intelligence & Data Science",
        from_date: "2023",
        to_date: "2024",
        location: "France"
      },
      {
        institution_name: "Ecole Centrale Casablanca",
        degree: "Master of Engineering (MEng)",
        from_date: "2022",
        to_date: "Present",
        location: "Morocco"
      }
    ]
  },
  "laila": {
    source: "LinkedIn" as const,
    linkedin_url: "https://www.linkedin.com/in/laila-ait-bihi-112836251/",
    name: "Laila Ait Bihi",
    location: "Gif-sur-Yvette, Île-de-France, France",
    about: "Data analyst and project manager with expertise in supply chain optimization and digital transformation.",
    open_to_work: false,
    experiences: [
      {
        position_title: "Chef de projet automatisation et transformation digitale",
        institution_name: "Carrefour",
        from_date: "Jan 2025",
        to_date: "Aug 2025",
        duration: "8 months",
        location: "",
        description: "Project management for automation and digital transformation initiatives"
      },
      {
        position_title: "Data Analyst",
        institution_name: "Carrefour",
        from_date: "Jul 2024",
        to_date: "Dec 2024",
        duration: "6 months",
        location: "",
        description: "Data analysis and insights generation"
      },
      {
        position_title: "Logistics Flow Diagnostic & Optimization intern",
        institution_name: "Groupe ONCF",
        from_date: "Jun 2023",
        to_date: "Aug 2023",
        duration: "3 months",
        location: "Marrakesh, Morocco",
        description: "Logistics optimization and diagnostic work"
      }
    ],
    educations: [
      {
        institution_name: "Ecole Centrale Casablanca",
        degree: "Bac+5, ENGINEERING",
        from_date: "2022",
        to_date: "2022",
        location: "Morocco"
      },
      {
        institution_name: "CentraleSupélec",
        degree: "Engineer's degree, Mathematics",
        from_date: "Feb 2024",
        to_date: "Jun 2024",
        location: "France"
      }
    ]
  },
  "chaimae": {
    source: "LinkedIn" as const,
    linkedin_url: "https://www.linkedin.com/in/chaymae~dahhassi/",
    name: "Chaymae Dahhassi",
    location: "Morocco",
    about: "Project manager and data scientist with experience in insurance and strategic initiatives.",
    open_to_work: false,
    experiences: [
      {
        position_title: "Management & Strategy- Group Life Center of Excellence",
        institution_name: "AXA en France",
        from_date: "Feb 2025",
        to_date: "Aug 2025",
        duration: "7 months",
        location: "Nanterre, France",
        description: "Project management, strategy development, and insurance pricing analysis"
      },
      {
        position_title: "Project Manager - Group Underwriting Office - GIE AXA",
        institution_name: "AXA",
        from_date: "Sep 2024",
        to_date: "Jan 2025",
        duration: "5 months",
        location: "Paris, France",
        description: "Evaluating and implementing inclusive insurance practices. Developing and maintaining data monitoring tools and dashboards. Project planning and coordination."
      },
      {
        position_title: "Data Scientist",
        institution_name: "OCP Group",
        from_date: "Jul 2023",
        to_date: "Aug 2023",
        duration: "2 months",
        location: "Benguerir, Morocco",
        description: "Data science work"
      }
    ],
    educations: [
      {
        institution_name: "Ecole Centrale Casablanca",
        degree: "Master of Engineering - Major in Data Science and Digitalization",
        from_date: "Sep 2022",
        to_date: "Jun 2026",
        location: "Morocco"
      },
      {
        institution_name: "Centrale Lyon",
        degree: "Exchange semester",
        from_date: "Feb 2024",
        to_date: "Jul 2024",
        location: "France"
      }
    ]
  },
  "omar": {
    source: "LinkedIn" as const,
    linkedin_url: "https://www.linkedin.com/in/bellmiromar/",
    name: "Omar Bellmir",
    location: "Paris, Île-de-France, France",
    about: "Supply chain and project management specialist with expertise in logistics optimization and CSR strategy.",
    open_to_work: false,
    experiences: [
      {
        position_title: "Strategy and CSR apprentice",
        institution_name: "IDEMIA",
        from_date: "Sep 2024",
        to_date: "Sep 2025",
        duration: "1 year 1 month",
        location: "Paris, France",
        description: "Analyzed SBTi reduction targets through scenario modeling and cost assessment. Conducted natural disaster risk assessments for IDEMIA's sites."
      },
      {
        position_title: "Supply Chain Backhauling Intern",
        institution_name: "Carrefour",
        from_date: "Feb 2024",
        to_date: "Jun 2024",
        duration: "5 months",
        location: "Paris, France",
        description: "Contributed to a supply chain audit, improving logistics efficiency by 10%. Assisted in implementing a backhauling strategy, reducing transportation costs by 2.4%."
      }
    ],
    educations: [
      {
        institution_name: "CentraleSupélec",
        degree: "Master of Engineering - MEng, Engineering",
        from_date: "2023",
        to_date: "2026",
        location: "France"
      },
      {
        institution_name: "Ecole Centrale Casablanca",
        degree: "Engineering degree",
        from_date: "Sep 2022",
        to_date: "2026",
        location: "Morocco"
      }
    ]
  }
};

// Default rounds for job offers
export const DEFAULT_ROUNDS = [
  { id: "round-1", name: "HR Round", order: 1 },
  { id: "round-2", name: "Manager Round", order: 2 },
  { id: "round-3", name: "Partner Round", order: 3 }
];

// Per-offer candidate assignments with unique IDs and scores
export const MOCK_CANDIDATES = [
  // Data Analyst offer: Ibrahim, Laila, Omar
  { ...CANDIDATE_PROFILES.ibrahim, id: "ibrahim-job1", score: 0, currentRound: 0, status: "Pending" as const, enriched: false, jobOfferId: "job-1" },
  { ...CANDIDATE_PROFILES.laila, id: "laila-job1", score: 0, currentRound: 0, status: "Pending" as const, enriched: false, jobOfferId: "job-1" },
  { ...CANDIDATE_PROFILES.omar, id: "omar-job1", score: 0, currentRound: 0, status: "Pending" as const, enriched: false, jobOfferId: "job-1" },

  // Data Science Engineer offer: Ibrahim, Chaimae
  { ...CANDIDATE_PROFILES.ibrahim, id: "ibrahim-job2", score: 0, currentRound: 0, status: "Pending" as const, enriched: false, jobOfferId: "job-2" },
  { ...CANDIDATE_PROFILES.chaimae, id: "chaimae-job2", score: 0, currentRound: 0, status: "Pending" as const, enriched: false, jobOfferId: "job-2" },

  // Project Manager offer: Chaimae, Omar, Laila
  { ...CANDIDATE_PROFILES.chaimae, id: "chaimae-job3", score: 0, currentRound: 0, status: "Pending" as const, enriched: false, jobOfferId: "job-3" },
  { ...CANDIDATE_PROFILES.omar, id: "omar-job3", score: 0, currentRound: 0, status: "Pending" as const, enriched: false, jobOfferId: "job-3" },
  { ...CANDIDATE_PROFILES.laila, id: "laila-job3", score: 0, currentRound: 0, status: "Pending" as const, enriched: false, jobOfferId: "job-3" }
];

export const MOCK_JOB_OFFERS = [
  {
    id: 'job-1',
    title: 'Data Analyst',
    description: 'Analyze data trends, create dashboards, and provide insights to support business decisions.',
    status: 'Open' as const,
    skills_required: ['SQL', 'Python', 'Tableau', 'Excel'],
    rounds: DEFAULT_ROUNDS
  },
  {
    id: 'job-2',
    title: 'Data Science Engineer',
    description: 'Build machine learning models, develop data pipelines, and deploy AI solutions.',
    status: 'Open' as const,
    skills_required: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Docker'],
    rounds: DEFAULT_ROUNDS
  },
  {
    id: 'job-3',
    title: 'Project Manager',
    description: 'Lead cross-functional teams, manage timelines, and ensure successful project delivery.',
    status: 'Open' as const,
    skills_required: ['Leadership', 'Agile', 'Communication', 'Risk Management'],
    rounds: DEFAULT_ROUNDS
  }
];

export interface Candidate {
  id: string;
  jobOfferId?: string;
  source: "LinkedIn" | "Local" | "CVthèque";
  score: number;
  status: "Pending" | "Next Round" | "Declined";
  currentRound: number;
  name: string;
  location: string;
  about: string | null;
  linkedin_url: string;
  open_to_work: boolean;
  experiences: Array<{
    position_title: string;
    institution_name: string;
    from_date: string;
    to_date: string;
    duration: string;
    location: string;
    description: string;
  }>;
  educations: Array<{
    institution_name: string;
    degree: string;
    from_date: string;
    to_date: string;
    location: string;
  }>;
  skills?: string[]; // Add this line
  enriched: boolean;
  linkedinData?: {
    name?: string;
    headline?: string;
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
  };
}

export interface Round {
  id: string;
  name: string;
  order: number;
}

export type JobOffer = (typeof MOCK_JOB_OFFERS)[0];

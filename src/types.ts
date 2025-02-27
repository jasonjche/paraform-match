export interface Candidate {
  id: string;
  name: string;
  resume_url: string;
  linkedin_url: string;
  application_url: string;
  created_at: string;
  reasons: string[];
  risks: string[];
  similarity: number;
  recruiter: Recruiter;
}

export interface Recruiter {
  id: string;
  name: string;
  candidates: {
    name: string;
    linkedin_url: string;
  }[];
  in_role: boolean;
  tags: string[];
  internal_rating: number;
  linkedin_url: string;
  email: string;
  type: 'preferred' | 'super preferred' | 'limit' | 'regular';
  last_active: string;
}

export interface ApiResponse {
  candidates: Candidate[];
  recruiters: Recruiter[];
}
export interface Candidate {
  id: string;
  name: string;
  linkedin_url: string;
  application_url: string;
  reason: string;
  risk: string;
  similarity: number;
  user?: User;
  // Legacy fields for backward compatibility
  resume_url?: string;
  created_at?: string;
  reasons?: string[];
  risks?: string[];
  recruiter?: Recruiter;
}

export interface User {
  id: string;
  name: string;
  email: string;
  candidateCount?: number;
  candidates?: Candidate[];
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

export interface Role {
  id: string;
  title: string;
  company: string;
  link: string;
  strengths: string[];
  weaknesses: string[];
  similarity: number;
  recruiter: Recruiter;
}

export interface CandidateRolesResponse {
  roles: Role[];
}

export interface RoleToCandidatesResponse {
  role: {
    id: string;
    name: string;
    company: string;
  };
  candidates: Candidate[];
  users: User[];
}
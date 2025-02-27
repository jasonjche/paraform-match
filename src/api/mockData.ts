import { ApiResponse } from '../types';
import { addDays, subDays, format } from 'date-fns';

const today = new Date();
const formatDate = (date: Date) => format(date, "yyyy-MM-dd'T'HH:mm:ss'Z'");

export const mockData: ApiResponse = {
  recruiters: [
    {
      id: '1',
      name: 'Jane Smith',
      candidates: [
        { name: 'John Doe', linkedin_url: 'https://linkedin.com/in/johndoe' },
        { name: 'Alice Johnson', linkedin_url: 'https://linkedin.com/in/alicejohnson' }
      ],
      in_role: true,
      tags: ['activation_tag', 'tech_specialist'],
      internal_rating: 4.5,
      linkedin_url: 'https://linkedin.com/in/janesmith',
      email: 'jane.smith@example.com',
      type: 'preferred',
      last_active: formatDate(subDays(today, 2))
    },
    {
      id: '2',
      name: 'Robert Brown',
      candidates: [
        { name: 'Emily Davis', linkedin_url: 'https://linkedin.com/in/emilydavis' }
      ],
      in_role: true,
      tags: ['activation_tag', 'finance_specialist'],
      internal_rating: 4.2,
      linkedin_url: 'https://linkedin.com/in/robertbrown',
      email: 'robert.brown@example.com',
      type: 'super preferred',
      last_active: formatDate(subDays(today, 1))
    },
    {
      id: '3',
      name: 'Sarah Wilson',
      candidates: [
        { name: 'Michael Wilson', linkedin_url: 'https://linkedin.com/in/michaelwilson' },
        { name: 'David Lee', linkedin_url: 'https://linkedin.com/in/davidlee' }
      ],
      in_role: false,
      tags: ['marketing_specialist'],
      internal_rating: 3.8,
      linkedin_url: 'https://linkedin.com/in/sarahwilson',
      email: 'sarah.wilson@example.com',
      type: 'regular',
      last_active: formatDate(subDays(today, 15))
    },
    {
      id: '4',
      name: 'Thomas Johnson',
      candidates: [],
      in_role: false,
      tags: ['sales_specialist'],
      internal_rating: 3.5,
      linkedin_url: 'https://linkedin.com/in/thomasjohnson',
      email: 'thomas.johnson@example.com',
      type: 'limit',
      last_active: formatDate(subDays(today, 30))
    }
  ],
  candidates: [
    {
      id: '1',
      name: 'John Doe',
      resume_url: 'https://example.com/resumes/johndoe.pdf',
      linkedin_url: 'https://linkedin.com/in/johndoe',
      application_url: 'https://jobs.example.com/applications/1',
      created_at: formatDate(subDays(today, 5)),
      reasons: ['Strong technical background', 'Experience with React', 'Team leadership'],
      risks: ['Limited enterprise experience'],
      similarity: 0.85,
      recruiter: {
        id: '1',
        name: 'Jane Smith',
        candidates: [],
        in_role: true,
        tags: ['activation_tag', 'tech_specialist'],
        internal_rating: 4.5,
        linkedin_url: 'https://linkedin.com/in/janesmith',
        email: 'jane.smith@example.com',
        type: 'preferred',
        last_active: formatDate(subDays(today, 2))
      }
    },
    {
      id: '2',
      name: 'Alice Johnson',
      resume_url: 'https://example.com/resumes/alicejohnson.pdf',
      linkedin_url: 'https://linkedin.com/in/alicejohnson',
      application_url: 'https://jobs.example.com/applications/2',
      created_at: formatDate(subDays(today, 3)),
      reasons: ['Product management expertise', 'Startup experience', 'MBA from top school'],
      risks: ['No experience in our industry'],
      similarity: 0.78,
      recruiter: {
        id: '1',
        name: 'Jane Smith',
        candidates: [],
        in_role: true,
        tags: ['activation_tag', 'tech_specialist'],
        internal_rating: 4.5,
        linkedin_url: 'https://linkedin.com/in/janesmith',
        email: 'jane.smith@example.com',
        type: 'preferred',
        last_active: formatDate(subDays(today, 2))
      }
    },
    {
      id: '3',
      name: 'Emily Davis',
      resume_url: 'https://example.com/resumes/emilydavis.pdf',
      linkedin_url: 'https://linkedin.com/in/emilydavis',
      application_url: 'https://jobs.example.com/applications/3',
      created_at: formatDate(subDays(today, 7)),
      reasons: ['Financial analysis skills', 'CPA certification', 'Big 4 experience'],
      risks: ['No tech company experience'],
      similarity: 0.92,
      recruiter: {
        id: '2',
        name: 'Robert Brown',
        candidates: [],
        in_role: true,
        tags: ['activation_tag', 'finance_specialist'],
        internal_rating: 4.2,
        linkedin_url: 'https://linkedin.com/in/robertbrown',
        email: 'robert.brown@example.com',
        type: 'super preferred',
        last_active: formatDate(subDays(today, 1))
      }
    },
    {
      id: '4',
      name: 'Michael Wilson',
      resume_url: 'https://example.com/resumes/michaelwilson.pdf',
      linkedin_url: 'https://linkedin.com/in/michaelwilson',
      application_url: 'https://jobs.example.com/applications/4',
      created_at: formatDate(subDays(today, 10)),
      reasons: ['Marketing strategy', 'Growth hacking', 'B2B experience'],
      risks: ['Job hopping history'],
      similarity: 0.75,
      recruiter: {
        id: '3',
        name: 'Sarah Wilson',
        candidates: [],
        in_role: false,
        tags: ['marketing_specialist'],
        internal_rating: 3.8,
        linkedin_url: 'https://linkedin.com/in/sarahwilson',
        email: 'sarah.wilson@example.com',
        type: 'regular',
        last_active: formatDate(subDays(today, 15))
      }
    },
    {
      id: '5',
      name: 'David Lee',
      resume_url: 'https://example.com/resumes/davidlee.pdf',
      linkedin_url: 'https://linkedin.com/in/davidlee',
      application_url: 'https://jobs.example.com/applications/5',
      created_at: formatDate(subDays(today, 12)),
      reasons: ['Sales leadership', 'Exceeded quotas', 'Enterprise relationships'],
      risks: ['Salary expectations high'],
      similarity: 0.82,
      recruiter: {
        id: '3',
        name: 'Sarah Wilson',
        candidates: [],
        in_role: false,
        tags: ['marketing_specialist'],
        internal_rating: 3.8,
        linkedin_url: 'https://linkedin.com/in/sarahwilson',
        email: 'sarah.wilson@example.com',
        type: 'regular',
        last_active: formatDate(subDays(today, 15))
      }
    }
  ]
};
import { ApiResponse } from '../types';
import { mockData } from './mockData';

// This function simulates an API call
// Replace this with your actual API implementation
export const fetchData = async (roleLink?: string): Promise<ApiResponse> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In a real implementation, you would use the roleLink to fetch specific data
  console.log('Fetching data for role:', roleLink);
  
  // Return mock data for now
  return mockData;
};
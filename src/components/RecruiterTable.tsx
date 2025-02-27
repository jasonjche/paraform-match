import React, { useState, useMemo } from 'react';
import { Recruiter } from '../types';
import { format, parseISO } from 'date-fns';
import { ExternalLink, ChevronDown, ChevronUp, Star, Users, Download, Copy } from 'lucide-react';

interface RecruiterTableProps {
  recruiters: Recruiter[];
}

const RecruiterTable: React.FC<RecruiterTableProps> = ({ recruiters }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [inRoleFilter, setInRoleFilter] = useState<boolean | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Recruiter | 'candidateCount';
    direction: 'ascending' | 'descending';
  }>({ key: 'internal_rating', direction: 'descending' }); // Default sort by rating
  const [selectedCandidates, setSelectedCandidates] = useState<{[recruiterId: string]: {[candidateId: string]: boolean}}>({});
  const [showEmailTemplate, setShowEmailTemplate] = useState<{[recruiterId: string]: boolean}>({});

  const handleSort = (key: keyof Recruiter | 'candidateCount') => {
    let direction: 'ascending' | 'descending' = 'ascending';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key, direction });
  };

  const toggleCandidateSelection = (recruiterId: string, candidateName: string) => {
    setSelectedCandidates(prev => {
      const recruiterSelections = prev[recruiterId] || {};
      return {
        ...prev,
        [recruiterId]: {
          ...recruiterSelections,
          [candidateName]: !recruiterSelections[candidateName]
        }
      };
    });
  };

  const selectAllCandidates = (recruiterId: string, candidates: {name: string, linkedin_url: string}[]) => {
    const allSelected = candidates.every(candidate => 
      selectedCandidates[recruiterId]?.[candidate.name]
    );
    
    const newSelections = {};
    candidates.forEach(candidate => {
      newSelections[candidate.name] = !allSelected;
    });
    
    setSelectedCandidates(prev => ({
      ...prev,
      [recruiterId]: newSelections
    }));
  };

  const toggleEmailTemplate = (recruiterId: string) => {
    setShowEmailTemplate(prev => ({
      ...prev,
      [recruiterId]: !prev[recruiterId]
    }));
  };

  const generateEmailTemplate = (recruiterId: string) => {
    const recruiter = recruiters.find(r => r.id === recruiterId);
    if (!recruiter) return '';
    
    const selectedCandidatesList = recruiter.candidates.filter(
      candidate => selectedCandidates[recruiterId]?.[candidate.name]
    );
    
    if (selectedCandidatesList.length === 0) {
      return 'Please select at least one candidate to generate an email template';
    }
    
    const candidatesList = selectedCandidatesList.map(candidate => 
      `- ${candidate.name}`
    ).join('\n');
    
    return `To: ${recruiter.email}
Subject: Paraform Match: Candidates for Current Role

Hi ${recruiter.name},

I hope this email finds you well. We're currently looking for candidates for a new role, and I thought some of your connections might be a good fit.

Could you please reach out to the following candidates to gauge their interest?

${candidatesList}

The role details can be found at [ROLE_LINK]. We're looking for candidates with [KEY_REQUIREMENTS].

Thank you for your assistance!

Best regards,
[YOUR_NAME]
`;
  };

  const copyEmailTemplate = (recruiterId: string) => {
    const template = generateEmailTemplate(recruiterId);
    navigator.clipboard.writeText(template)
      .then(() => {
        alert('Email template copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy template: ', err);
        alert('Failed to copy template to clipboard');
      });
  };

  const exportCandidatesCSV = (recruiterId: string, recruiterName: string) => {
    const recruiter = recruiters.find(r => r.id === recruiterId);
    if (!recruiter) return;
    
    const selectedCandidatesList = recruiter.candidates.filter(
      candidate => selectedCandidates[recruiterId]?.[candidate.name]
    );
    
    if (selectedCandidatesList.length === 0) {
      alert('Please select at least one candidate to export');
      return;
    }
    
    // Create CSV content
    const csvHeader = 'Name,LinkedIn URL\n';
    const csvRows = selectedCandidatesList.map(
      candidate => `"${candidate.name}","${candidate.linkedin_url}"`
    ).join('\n');
    const csvContent = `${csvHeader}${csvRows}`;
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${recruiterName.replace(/\s+/g, '_')}_candidates.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRecruiters = useMemo(() => {
    let result = [...recruiters];
    
    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(recruiter => 
        recruiter.name.toLowerCase().includes(lowerSearchTerm) ||
        recruiter.email.toLowerCase().includes(lowerSearchTerm) ||
        recruiter.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm))
      );
    }
    
    // Apply in_role filter
    if (inRoleFilter !== null) {
      result = result.filter(recruiter => recruiter.in_role === inRoleFilter);
    }
    
    // Apply sorting
    if (sortConfig) {
      result.sort((a, b) => {
        if (sortConfig.key === 'candidateCount') {
          // Sort by number of candidates
          const valueA = a.candidates.length;
          const valueB = b.candidates.length;
          
          if (valueA < valueB) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (valueA > valueB) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        } else if (sortConfig.key === 'internal_rating') {
          // Sort by rating
          const valueA = a.internal_rating;
          const valueB = b.internal_rating;
          
          if (valueA < valueB) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (valueA > valueB) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        } else if (sortConfig.key === 'last_active') {
          // Sort by date
          const dateA = new Date(a.last_active).getTime();
          const dateB = new Date(b.last_active).getTime();
          
          if (dateA < dateB) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (dateA > dateB) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        } else {
          // Sort by string properties
          const valueA = String(a[sortConfig.key]).toLowerCase();
          const valueB = String(b[sortConfig.key]).toLowerCase();
          
          if (valueA < valueB) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (valueA > valueB) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        }
      });
    }
    
    return result;
  }, [recruiters, searchTerm, inRoleFilter, sortConfig]);

  const getSortIcon = (key: keyof Recruiter | 'candidateCount') => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronDown size={16} className="opacity-30" />;
    }
    return sortConfig.direction === 'ascending' ? 
      <ChevronUp size={16} /> : 
      <ChevronDown size={16} />;
  };

  const getRecruiterTypeColor = (type: Recruiter['type']) => {
    switch (type) {
      case 'super preferred':
        return 'bg-purple-100 text-purple-800';
      case 'preferred':
        return 'bg-green-100 text-green-800';
      case 'limit':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search recruiters, email, or tags..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">
              Role status:
            </label>
            <div className="flex rounded-md shadow-sm">
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  inRoleFilter === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border border-gray-300 rounded-l-md focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                onClick={() => setInRoleFilter(null)}
              >
                All
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  inRoleFilter === true
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border-t border-b border-r border-gray-300 focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                onClick={() => setInRoleFilter(true)}
              >
                In Role
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  inRoleFilter === false
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border-t border-b border-r border-gray-300 rounded-r-md focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                onClick={() => setInRoleFilter(false)}
              >
                Not In Role
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  <span>Recruiter</span>
                  {getSortIcon('name')}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center">
                  <span>Type</span>
                  {getSortIcon('type')}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('internal_rating')}
              >
                <div className="flex items-center">
                  <span>Rating</span>
                  {getSortIcon('internal_rating')}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('candidateCount')}
              >
                <div className="flex items-center">
                  <span>Candidates</span>
                  {getSortIcon('candidateCount')}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('last_active')}
              >
                <div className="flex items-center">
                  <span>Last Active</span>
                  {getSortIcon('last_active')}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRecruiters.length > 0 ? (
              filteredRecruiters.map((recruiter) => (
                <React.Fragment key={recruiter.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">
                          <a 
                            href={recruiter.linkedin_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-gray-900 hover:text-blue-600"
                          >
                            {recruiter.name}
                          </a>
                        </div>
                        <div className="text-sm text-gray-500">{recruiter.email}</div>
                        <div className="text-sm text-gray-500">
                          <a 
                            href={recruiter.linkedin_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-600 hover:text-blue-800"
                          >
                            LinkedIn <ExternalLink size={14} className="ml-1" />
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRecruiterTypeColor(recruiter.type)}`}>
                        {recruiter.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Star 
                          size={16} 
                          className="text-yellow-400 mr-1" 
                          fill="currentColor" 
                        />
                        <span>{recruiter.internal_rating.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Users size={16} className="text-gray-500 mr-2" />
                          <span className="text-sm text-gray-900">{recruiter.candidates.length}</span>
                        </div>
                        {recruiter.candidates.length > 0 && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => selectAllCandidates(recruiter.id, recruiter.candidates)}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              {recruiter.candidates.every(c => selectedCandidates[recruiter.id]?.[c.name]) 
                                ? 'Deselect All' 
                                : 'Select All'}
                            </button>
                            <button
                              onClick={() => toggleEmailTemplate(recruiter.id)}
                              className="text-xs text-green-600 hover:text-green-800"
                            >
                              {showEmailTemplate[recruiter.id] ? 'Hide Template' : 'Show Template'}
                            </button>
                            <button
                              onClick={() => exportCandidatesCSV(recruiter.id, recruiter.name)}
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              <Download size={14} className="mr-1" /> Export Selected
                            </button>
                          </div>
                        )}
                      </div>
                      {recruiter.candidates.length > 0 && (
                        <div className="mt-1">
                          <ul className="text-xs text-gray-500">
                            {recruiter.candidates.map((candidate, index) => (
                              <li key={index} className="flex items-center space-x-2 mb-1">
                                <input
                                  type="checkbox"
                                  id={`${recruiter.id}-${candidate.name}`}
                                  checked={!!selectedCandidates[recruiter.id]?.[candidate.name]}
                                  onChange={() => toggleCandidateSelection(recruiter.id, candidate.name)}
                                  className="rounded text-blue-600 focus:ring-blue-500"
                                />
                                <label 
                                  htmlFor={`${recruiter.id}-${candidate.name}`}
                                  className="truncate max-w-xs cursor-pointer"
                                >
                                  <a 
                                    href={candidate.linkedin_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    {candidate.name}
                                  </a>
                                </label>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(parseISO(recruiter.last_active), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        recruiter.in_role 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {recruiter.in_role ? 'Active' : 'Inactive'}
                      </span>
                      <div className="mt-2">
                        {recruiter.tags.map((tag, index) => (
                          <span 
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-1 mb-1"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                  {showEmailTemplate[recruiter.id] && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 bg-gray-50">
                        <div className="p-3 bg-white rounded-md border border-gray-200">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-medium">Paraform Match Email Template</h3>
                            <button
                              onClick={() => copyEmailTemplate(recruiter.id)}
                              className="flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
                            >
                              <Copy size={14} className="mr-1" /> Copy to Clipboard
                            </button>
                          </div>
                          <pre className="text-xs bg-gray-50 p-3 rounded border border-gray-200 overflow-auto max-h-60">
                            {generateEmailTemplate(recruiter.id)}
                          </pre>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  No recruiters found matching your criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecruiterTable;
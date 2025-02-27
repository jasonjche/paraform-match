import React, { useState, useMemo } from 'react';
import { Candidate } from '../types';
import { format, parseISO } from 'date-fns';
import { ExternalLink, FileText, ChevronDown, ChevronUp, Download, Copy } from 'lucide-react';

interface CandidateTableProps {
  candidates: Candidate[];
}

const CandidateTable: React.FC<CandidateTableProps> = ({ candidates }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Candidate | 'traits';
    direction: 'ascending' | 'descending';
  }>({ key: 'similarity', direction: 'descending' }); // Default sort by similarity
  const [selectedCandidates, setSelectedCandidates] = useState<{[id: string]: boolean}>({});
  const [showEmailTemplate, setShowEmailTemplate] = useState(false);

  const handleSort = (key: keyof Candidate | 'traits') => {
    let direction: 'ascending' | 'descending' = 'ascending';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key, direction });
  };

  const toggleCandidateSelection = (candidateId: string) => {
    setSelectedCandidates(prev => ({
      ...prev,
      [candidateId]: !prev[candidateId]
    }));
  };

  const selectAllCandidates = () => {
    const allSelected = filteredCandidates.every(candidate => selectedCandidates[candidate.id]);
    
    const newSelections = {};
    filteredCandidates.forEach(candidate => {
      newSelections[candidate.id] = !allSelected;
    });
    
    setSelectedCandidates(newSelections);
  };

  const generateEmailTemplate = () => {
    const selectedCandidatesList = filteredCandidates.filter(
      candidate => selectedCandidates[candidate.id]
    );
    
    if (selectedCandidatesList.length === 0) {
      alert('Please select at least one candidate to generate an email template');
      return;
    }
    
    // Group candidates by recruiter
    const recruiterGroups = {};
    
    selectedCandidatesList.forEach(candidate => {
      const recruiterId = candidate.recruiter.id;
      if (!recruiterGroups[recruiterId]) {
        recruiterGroups[recruiterId] = {
          recruiter: candidate.recruiter,
          candidates: []
        };
      }
      recruiterGroups[recruiterId].candidates.push(candidate);
    });
    
    // Create email templates for each recruiter
    const templates = Object.values(recruiterGroups).map((group: any) => {
      const recruiter = group.recruiter;
      const candidates = group.candidates;
      
      const candidatesList = candidates.map(candidate => 
        `- ${candidate.name} (${Math.round(candidate.similarity * 100)}% match)`
      ).join('\n');
      
      return `To: ${recruiter.email}
Subject: Paraform Match: Candidates for Current Role

Hi ${recruiter.name},

I hope this email finds you well. We've identified the following candidates from your network who would be a great fit for our current role:

${candidatesList}

Could you please reach out to these candidates to gauge their interest? The role details can be found at [ROLE_LINK].

Thank you for your assistance!

Best regards,
[YOUR_NAME]
`;
    });
    
    return templates.join('\n\n---\n\n');
  };

  const copyEmailTemplate = () => {
    const template = generateEmailTemplate();
    navigator.clipboard.writeText(template)
      .then(() => {
        alert('Email template copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy template: ', err);
        alert('Failed to copy template to clipboard');
      });
  };

  const exportSelectedCandidatesCSV = () => {
    const selectedCandidatesList = filteredCandidates.filter(
      candidate => selectedCandidates[candidate.id]
    );
    
    if (selectedCandidatesList.length === 0) {
      alert('Please select at least one candidate to export');
      return;
    }
    
    // Group candidates by recruiter
    const recruiterGroups = {};
    
    selectedCandidatesList.forEach(candidate => {
      const recruiterId = candidate.recruiter.id;
      if (!recruiterGroups[recruiterId]) {
        recruiterGroups[recruiterId] = {
          recruiter: candidate.recruiter,
          candidates: []
        };
      }
      recruiterGroups[recruiterId].candidates.push(candidate);
    });
    
    // Create CSV content
    let csvContent = 'Recruiter Name,Recruiter Email,Candidate Name,Candidate LinkedIn URL,Match Percentage\n';
    
    Object.values(recruiterGroups).forEach((group: any) => {
      const recruiter = group.recruiter;
      const candidates = group.candidates;
      
      candidates.forEach(candidate => {
        csvContent += `"${recruiter.name}","${recruiter.email}","${candidate.name}","${candidate.linkedin_url}","${Math.round(candidate.similarity * 100)}%"\n`;
      });
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'candidates_by_recruiter.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCandidates = useMemo(() => {
    let result = [...candidates];
    
    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(candidate => 
        candidate.name.toLowerCase().includes(lowerSearchTerm) ||
        candidate.reasons.some(reason => reason.toLowerCase().includes(lowerSearchTerm)) ||
        candidate.risks.some(risk => risk.toLowerCase().includes(lowerSearchTerm))
      );
    }
    
    // Apply date filter
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      result = result.filter(candidate => {
        const candidateDate = parseISO(candidate.created_at);
        return candidateDate >= filterDate;
      });
    }
    
    // Apply sorting
    if (sortConfig) {
      result.sort((a, b) => {
        if (sortConfig.key === 'traits') {
          // Sort by number of traits (reasons)
          const valueA = a.reasons.length;
          const valueB = b.reasons.length;
          
          if (valueA < valueB) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (valueA > valueB) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        } else if (sortConfig.key === 'similarity') {
          // Sort by similarity score
          const valueA = a.similarity;
          const valueB = b.similarity;
          
          if (valueA < valueB) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (valueA > valueB) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        } else if (sortConfig.key === 'created_at') {
          // Sort by date
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          
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
  }, [candidates, searchTerm, dateFilter, sortConfig]);

  const getSortIcon = (key: keyof Candidate | 'traits') => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronDown size={16} className="opacity-30" />;
    }
    return sortConfig.direction === 'ascending' ? 
      <ChevronUp size={16} /> : 
      <ChevronDown size={16} />;
  };

  const selectedCount = Object.values(selectedCandidates).filter(Boolean).length;

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search candidates, traits, or risks..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="date-filter" className="text-sm font-medium text-gray-700">
              Created after:
            </label>
            <input
              id="date-filter"
              type="date"
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={selectAllCandidates}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {filteredCandidates.every(c => selectedCandidates[c.id]) 
                ? 'Deselect All' 
                : 'Select All'}
            </button>
            <span className="text-sm text-gray-500">
              {selectedCount} candidate{selectedCount !== 1 ? 's' : ''} selected
            </span>
          </div>
          
          {selectedCount > 0 && (
            <div className="flex space-x-2">
              <button
                onClick={() => setShowEmailTemplate(!showEmailTemplate)}
                className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700"
              >
                {showEmailTemplate ? 'Hide Template' : 'Show Email Template'}
              </button>
              <button
                onClick={exportSelectedCandidatesCSV}
                className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
              >
                <Download size={16} className="mr-1" /> Export Selected by Recruiter
              </button>
            </div>
          )}
        </div>

        {showEmailTemplate && selectedCount > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-md font-medium">Paraform Match Email Template</h3>
              <button
                onClick={copyEmailTemplate}
                className="flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
              >
                <Copy size={14} className="mr-1" /> Copy to Clipboard
              </button>
            </div>
            <pre className="text-xs bg-white p-3 rounded border border-gray-200 overflow-auto max-h-60">
              {generateEmailTemplate()}
            </pre>
          </div>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center">
                  <span>Select</span>
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  <span>Candidate</span>
                  {getSortIcon('name')}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('traits')}
              >
                <div className="flex items-center">
                  <span>Key Traits</span>
                  {getSortIcon('traits')}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('similarity')}
              >
                <div className="flex items-center">
                  <span>Similarity</span>
                  {getSortIcon('similarity')}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center">
                  <span>Created</span>
                  {getSortIcon('created_at')}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Documents
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCandidates.length > 0 ? (
              filteredCandidates.map((candidate) => (
                <tr key={candidate.id} className="hover:bg-gray-50">
                  <td className="px-3 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      id={`candidate-${candidate.id}`}
                      checked={!!selectedCandidates[candidate.id]}
                      onChange={() => toggleCandidateSelection(candidate.id)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">{candidate.name}</div>
                      <div className="text-sm text-gray-500">
                        <a 
                          href={candidate.linkedin_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:text-blue-800"
                        >
                          LinkedIn <ExternalLink size={14} className="ml-1" />
                        </a>
                      </div>
                      <div className="text-sm text-gray-500">
                        Recruiter: <a 
                          href={candidate.recruiter.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {candidate.recruiter.name}
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      <div className="mb-2">
                        <span className="font-medium">Strengths ({candidate.reasons.length}):</span>
                        <ul className="list-disc list-inside ml-2">
                          {candidate.reasons.map((reason, index) => (
                            <li key={index} className="text-sm text-gray-600">{reason}</li>
                          ))}
                        </ul>
                      </div>
                      {candidate.risks.length > 0 && (
                        <div>
                          <span className="font-medium">Risks ({candidate.risks.length}):</span>
                          <ul className="list-disc list-inside ml-2">
                            {candidate.risks.map((risk, index) => (
                              <li key={index} className="text-sm text-gray-600">{risk}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${candidate.similarity * 100}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm text-gray-900">
                        {Math.round(candidate.similarity * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(parseISO(candidate.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <a 
                        href={candidate.resume_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <FileText size={16} className="mr-1" /> Resume
                      </a>
                      <a 
                        href={candidate.application_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <ExternalLink size={16} className="mr-1" /> Application
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  No candidates found matching your criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CandidateTable;
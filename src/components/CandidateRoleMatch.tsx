import React, { useState } from 'react';
import { Role } from '../types';
import { ExternalLink, ChevronDown, ChevronUp, Download, Mail, MapPin, FileText, Briefcase, User, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const CandidateRoleMatch: React.FC = () => {
  const [candidateLink, setCandidateLink] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Role;
    direction: 'ascending' | 'descending';
  }>({ key: 'similarity', direction: 'descending' }); // Default sort by similarity
  const [selectedRoles, setSelectedRoles] = useState<{[id: string]: boolean}>({});

  const handleSearch = async (link: string) => {
    if (!link.trim()) {
      setError('Please enter a candidate link');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // This feature is not implemented yet with real API
      setError('Candidate to Roles matching is not implemented yet with the real API');
      setLoading(false);
      return;
      
      // In a real implementation, you would fetch data from an API
      // const response = await fetch(`/api/candidate-roles?candidateLink=${encodeURIComponent(link)}`);
      // const data = await response.json();
      // setRoles(data.roles);
      // setCandidateName(data.candidateName);
    } catch (err) {
      setError('Failed to fetch matching roles. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSearch(candidateLink);
  };

  const handleSort = (key: keyof Role) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key, direction });
  };

  const toggleRoleSelection = (roleId: string) => {
    setSelectedRoles(prev => ({
      ...prev,
      [roleId]: !prev[roleId]
    }));
  };

  const selectAllRoles = () => {
    const allSelected = sortedRoles.every(role => selectedRoles[role.id]);
    
    const newSelections = {};
    sortedRoles.forEach(role => {
      newSelections[role.id] = !allSelected;
    });
    
    setSelectedRoles(newSelections);
  };

  // Get the recruiter for the candidate (assuming all roles have the same recruiter)
  const candidateRecruiter = roles.length > 0 ? roles[0].recruiter : null;

  const exportSelectedRolesCSV = () => {
    const selectedRolesList = sortedRoles.filter(
      role => selectedRoles[role.id]
    );
    
    if (selectedRolesList.length === 0) {
      toast.error('Please select at least one role to export');
      return;
    }
    
    // Create CSV content - all roles are for the same recruiter
    let csvContent = 'Role Title,Company,Role Link,Match Percentage,Location\n';
    
    selectedRolesList.forEach(role => {
      const locationStr = 'Location not specified';
      
      csvContent += `"${role.title}","${role.company}","${role.link}","${Math.round(role.similarity * 100)}%","${locationStr}"\n`;
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${candidateName.replace(/\s+/g, '_')}_matching_roles.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('CSV file downloaded successfully');
  };

  const generateEmailTemplate = () => {
    if (!candidateRecruiter || !candidateName) return '';
    
    const selectedRolesList = sortedRoles.filter(role => selectedRoles[role.id]);
    
    if (selectedRolesList.length === 0) {
      toast.error('Please select at least one role');
      return '';
    }
    
    // Get recruiter's first name
    const recruiterFirstName = candidateRecruiter.name.split(' ')[0];
    
    // Get candidate's first name
    const candidateFirstName = candidateName.split(' ')[0];
    
    // Create role list with links
    const roleLinks = selectedRolesList.map(role => {
      return `- ${role.title} at ${role.company} (${role.link})`;
    });
    
    const template = `To: ${candidateRecruiter.email}
Subject: Additional Opportunities for ${candidateName} on Paraform

Hi ${recruiterFirstName},

Thanks for submitting ${candidateName}! We think they would also be a great fit at these following roles:
${roleLinks.join('\n')}

Let us know if ${candidateFirstName} is interested in any of these roles—we'd be happy to submit them for you.

Best,
[unfilled name]`;

    return template;
  };

  const copyEmailTemplate = () => {
    const template = generateEmailTemplate();
    if (!template) return;
    
    navigator.clipboard.writeText(template)
      .then(() => {
        toast.success('Email template copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy template: ', err);
        toast.error('Failed to copy template. Please try again.');
      });
  };

  const sortedRoles = React.useMemo(() => {
    if (!roles.length) return [];
    
    const sortableRoles = [...roles];
    
    if (sortConfig) {
      sortableRoles.sort((a, b) => {
        if (sortConfig.key === 'similarity') {
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
    
    return sortableRoles;
  }, [roles, sortConfig]);

  const getSortIcon = (key: keyof Role) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronDown size={16} className="opacity-30" />;
    }
    return sortConfig.direction === 'ascending' ? 
      <ChevronUp size={16} /> : 
      <ChevronDown size={16} />;
  };

  const selectedCount = Object.values(selectedRoles).filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={candidateLink}
                onChange={(e) => setCandidateLink(e.target.value)}
                placeholder="Enter candidate LinkedIn URL"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2  focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Find Matching Roles'}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mt-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 size={48} className="animate-spin text-blue-500" />
        </div>
      ) : sortedRoles.length > 0 ? (
        <>
          {/* Candidate Information Card */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User size={20} className="mr-2 text-blue-600" />
              Matching Roles for {candidateName}
            </h2>
            {candidateRecruiter && (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-md font-medium">Recruiter: {candidateRecruiter.name}</h3>
                  <p className="text-sm text-gray-500">{candidateRecruiter.email}</p>
                  <div className="mt-1">
                    <a 
                      href={candidateRecruiter.linkedin_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <ExternalLink size={14} className="mr-1" /> LinkedIn Profile
                    </a>
                  </div>
                </div>
                <div>
                  <button
                    onClick={copyEmailTemplate}
                    className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                  >
                    <Mail size={16} className="mr-1" /> Copy Email Template
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg bg-white">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAllRoles}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {sortedRoles.every(r => selectedRoles[r.id]) 
                      ? 'Deselect All' 
                      : 'Select All'}
                  </button>
                  <span className="text-sm text-gray-500">
                    {selectedCount} role{selectedCount !== 1 ? 's' : ''} selected
                  </span>
                </div>
                
                {selectedCount > 0 && (
                  <div className="flex space-x-2">
                    <button
                      onClick={exportSelectedRolesCSV}
                      className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                    >
                      <Download size={16} className="mr-1" /> Export Selected
                    </button>
                  </div>
                )}
              </div>
            </div>
            
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
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center">
                      <span>Role</span>
                      {getSortIcon('title')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('company')}
                  >
                    <div className="flex items-center">
                      <span>Company</span>
                      {getSortIcon('company')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <div className="flex items-center">
                      <span>Location</span>
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <div className="flex items-center">
                      <span>Match Details</span>
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('similarity')}
                  >
                    <div className="flex items-center">
                      <span>Match %</span>
                      {getSortIcon('similarity')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedRoles.map((role) => {
                  return (
                    <tr key={role.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          id={`role-${role.id}`}
                          checked={!!selectedRoles[role.id]}
                          onChange={() => toggleRoleSelection(role.id)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900">
                            <a 
                              href={role.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {role.title}
                            </a>
                          </div>
                          <div className="flex items-center mt-1 space-x-2">
                            <a 
                              href={role.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center text-xs text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink size={14} className="mr-1" /> View Role
                            </a>
                            <a 
                              href={`${role.link}/requirements`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center text-xs text-blue-600 hover:text-blue-800"
                            >
                              <FileText size={14} className="mr-1" /> Requirements
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{role.company}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPin size={14} className="mr-1 text-gray-500" />
                          <span className="text-sm">Location not specified</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="mb-2">
                            <span className="text-xs font-medium">Strengths ({role.strengths.length}):</span>
                            <ul className="list-disc list-inside ml-2">
                              {role.strengths.map((strength, index) => (
                                <li key={index} className="text-xs text-gray-600">{strength}</li>
                              ))}
                            </ul>
                          </div>
                          {role.weaknesses.length > 0 && (
                            <div>
                              <span className="text-xs font-medium">Gaps ({role.weaknesses.length}):</span>
                              <ul className="list-disc list-inside ml-2">
                                {role.weaknesses.map((weakness, index) => (
                                  <li key={index} className="text-xs text-gray-600">{weakness}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-blue-600 h-2.5 rounded-full" 
                              style={{ width: `${role.similarity * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">
                            {Math.round(role.similarity * 100)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : candidateLink ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <h2 className="text-xl font-medium text-gray-900 mb-2">No matching roles found</h2>
          <p className="text-gray-500">
            Try a different candidate link or check back later for new role matches.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <h2 className="text-xl font-medium text-gray-900 mb-2">Enter a candidate link to get started</h2>
          <p className="text-gray-500">
            Enter a candidate's LinkedIn URL in the search box above to view potential role matches.
          </p>
        </div>
      )}
    </div>
  );
};

export default CandidateRoleMatch;
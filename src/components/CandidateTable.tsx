import React, { useState, useMemo } from "react";
import { Candidate } from "../types";
import { format, parseISO } from "date-fns";
import {
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Download,
  Linkedin,
  Mail,
} from "lucide-react";
import toast from "react-hot-toast";

interface CandidateTableProps {
  candidates: Candidate[];
}

const CandidateTable: React.FC<CandidateTableProps> = ({ candidates }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Candidate | "traits";
    direction: "ascending" | "descending";
  }>({ key: "similarity", direction: "descending" }); // Default sort by similarity
  const [selectedCandidates, setSelectedCandidates] = useState<{
    [id: string]: boolean;
  }>({});

  const handleSort = (key: keyof Candidate | "traits") => {
    let direction: "ascending" | "descending" = "ascending";

    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }

    setSortConfig({ key, direction });
  };

  const toggleCandidateSelection = (candidateId: string) => {
    setSelectedCandidates((prev) => ({
      ...prev,
      [candidateId]: !prev[candidateId],
    }));
  };

  const selectAllCandidates = () => {
    const allSelected = filteredCandidates.every(
      (candidate) => selectedCandidates[candidate.id]
    );

    const newSelections = {};
    filteredCandidates.forEach((candidate) => {
      newSelections[candidate.id] = !allSelected;
    });

    setSelectedCandidates(newSelections);
  };

  const exportSelectedCandidatesCSV = () => {
    const selectedCandidatesList = filteredCandidates.filter(
      (candidate) => selectedCandidates[candidate.id]
    );

    if (selectedCandidatesList.length === 0) {
      toast.error("Please select at least one candidate to export");
      return;
    }

    // Group candidates by user/recruiter
    const userGroups = {};

    selectedCandidatesList.forEach((candidate) => {
      const userId = candidate.user?.id || "unknown";
      if (!userGroups[userId]) {
        userGroups[userId] = {
          user: candidate.user,
          candidates: [],
        };
      }
      userGroups[userId].candidates.push(candidate);
    });

    // Create CSV content
    let csvContent =
      "Recruiter Name,Recruiter Email,Candidate Name,Candidate LinkedIn URL,Match Percentage\n";

    Object.values(userGroups).forEach((group: any) => {
      const user = group.user;
      const candidates = group.candidates;

      candidates.forEach((candidate) => {
        csvContent += `"${user?.name || "Unknown"}","${
          user?.email || "Unknown"
        }","${candidate.name}","${candidate.linkedin_url}","${Math.round(
          candidate.similarity * 100
        )}%"\n`;
      });
    });

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "candidates_by_recruiter.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("CSV file downloaded successfully");
  };

  // Process reasons and risks from string to array if needed
  const processedCandidates = useMemo(() => {
    return candidates.map((candidate) => {
      // Convert reason string to array if it's not already an array
      const reasons =
        candidate.reasons ||
        (candidate.reason
          ? candidate.reason.split("\n").filter((r) => r.trim())
          : []);

      // Convert risk string to array if it's not already an array
      const risks =
        candidate.risks ||
        (candidate.risk
          ? candidate.risk.split("\n").filter((r) => r.trim())
          : []);

      return {
        ...candidate,
        reasons,
        risks,
        // Use created_at if available, otherwise use current date
        created_at: candidate.created_at || new Date().toISOString(),
      };
    });
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    let result = [...processedCandidates];

    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(
        (candidate) =>
          candidate.name.toLowerCase().includes(lowerSearchTerm) ||
          candidate.reasons.some((reason) =>
            reason.toLowerCase().includes(lowerSearchTerm)
          ) ||
          candidate.risks.some((risk) =>
            risk.toLowerCase().includes(lowerSearchTerm)
          )
      );
    }

    // Apply date filter
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      result = result.filter((candidate) => {
        const candidateDate = parseISO(candidate.created_at);
        return candidateDate >= filterDate;
      });
    }

    // Apply sorting
    if (sortConfig) {
      result.sort((a, b) => {
        if (sortConfig.key === "traits") {
          // Sort by number of traits (reasons)
          const valueA = a.reasons.length;
          const valueB = b.reasons.length;

          if (valueA < valueB) {
            return sortConfig.direction === "ascending" ? -1 : 1;
          }
          if (valueA > valueB) {
            return sortConfig.direction === "ascending" ? 1 : -1;
          }
          return 0;
        } else if (sortConfig.key === "similarity") {
          // Sort by similarity score
          const valueA = a.similarity;
          const valueB = b.similarity;

          if (valueA < valueB) {
            return sortConfig.direction === "ascending" ? -1 : 1;
          }
          if (valueA > valueB) {
            return sortConfig.direction === "ascending" ? 1 : -1;
          }
          return 0;
        } else if (sortConfig.key === "created_at") {
          // Sort by date
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();

          if (dateA < dateB) {
            return sortConfig.direction === "ascending" ? -1 : 1;
          }
          if (dateA > dateB) {
            return sortConfig.direction === "ascending" ? 1 : -1;
          }
          return 0;
        } else {
          // Sort by string properties
          const valueA = String(a[sortConfig.key]).toLowerCase();
          const valueB = String(b[sortConfig.key]).toLowerCase();

          if (valueA < valueB) {
            return sortConfig.direction === "ascending" ? -1 : 1;
          }
          if (valueA > valueB) {
            return sortConfig.direction === "ascending" ? 1 : -1;
          }
          return 0;
        }
      });
    }

    return result;
  }, [processedCandidates, searchTerm, dateFilter, sortConfig]);

  const getSortIcon = (key: keyof Candidate | "traits") => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronDown size={16} className="opacity-30" />;
    }
    return sortConfig.direction === "ascending" ? (
      <ChevronUp size={16} />
    ) : (
      <ChevronDown size={16} />
    );
  };

  const selectedCount =
    Object.values(selectedCandidates).filter(Boolean).length;

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg bg-white">
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search candidates, traits, or risks..."
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500"
              onClick={() => {
                /* Search functionality already handled by onChange */
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <label
              htmlFor="date-filter"
              className="text-sm font-medium text-gray-700"
            >
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
              {filteredCandidates.every((c) => selectedCandidates[c.id])
                ? "Deselect All"
                : "Select All"}
            </button>
            <span className="text-sm text-gray-500">
              {selectedCount} candidate{selectedCount !== 1 ? "s" : ""} selected
            </span>
          </div>

          {selectedCount > 0 && (
            <div className="flex space-x-2">
              <button
                onClick={exportSelectedCandidatesCSV}
                className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
              >
                <Download size={16} className="mr-1" /> Export Selected
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <div className="flex justify-center items-center">
                  <span>Select</span>
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center">
                  <span>Candidate</span>
                  {getSortIcon("name")}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <div className="flex items-center">
                  <span>Documents</span>
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("traits")}
              >
                <div className="flex items-center">
                  <span>Key Traits</span>
                  {getSortIcon("traits")}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <div className="flex items-center">
                  <span>Recruiter</span>
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("similarity")}
              >
                <div className="flex items-center">
                  <span>Similarity</span>
                  {getSortIcon("similarity")}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("created_at")}
              >
                <div className="flex items-center">
                  <span>Created</span>
                  {getSortIcon("created_at")}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredCandidates.length > 0 ? (
              filteredCandidates.map((candidate) => (
                <tr key={candidate.id} className="hover:bg-gray-50">
                  <td className="px-3 py-4 whitespace-nowrap text-center">
                    <input
                      type="checkbox"
                      id={`candidate-${candidate.id}`}
                      checked={!!selectedCandidates[candidate.id]}
                      onChange={() => toggleCandidateSelection(candidate.id)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {candidate.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-2">
                      <a
                        href={candidate.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <Linkedin size={16} className="mr-1" /> LinkedIn
                      </a>
                      {/* Resume link commented out as it's not returned by the database
                      {candidate.resume_url && (
                        <a 
                          href={candidate.resume_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:text-blue-800"
                        >
                          <FileText size={16} className="mr-1" /> Resume
                        </a>
                      )}
                      */}
                      <a
                        href={candidate.application_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink size={16} className="mr-1" /> Application
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      <div className="mb-2">
                        <span className="font-medium">Strengths:</span>
                        <div className="ml-2 text-sm text-gray-600">
                          {candidate.reason || candidate.reasons.join("\n")}
                        </div>
                      </div>
                      {(candidate.risk || candidate.risks.length > 0) && (
                        <div>
                          <span className="font-medium">Risks:</span>
                          <div className="ml-2 text-sm text-gray-600">
                            {candidate.risk || candidate.risks.join("\n")}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">
                        {candidate.user?.name ||
                          candidate.recruiter?.name ||
                          "Unknown"}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {candidate.user?.email ||
                          (candidate.recruiter?.email && (
                            <a
                              href={`mailto:${
                                candidate.user?.email ||
                                candidate.recruiter?.email
                              }`}
                              className="flex items-center text-blue-600 hover:text-blue-800"
                            >
                              <Mail size={14} className="mr-1" />{" "}
                              {candidate.user?.email ||
                                candidate.recruiter?.email}
                            </a>
                          ))}
                      </div>
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
                    {format(parseISO(candidate.created_at), "MMM d, yyyy")}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
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

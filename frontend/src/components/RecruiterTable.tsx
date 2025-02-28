import React, { useState, useMemo } from "react";
import { User, Candidate } from "../types";
import { format } from "date-fns";
import {
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Users,
  Download,
  Mail,
  Linkedin,
  FileText,
  Eye,
  EyeOff,
  CheckSquare,
} from "lucide-react";
import toast from "react-hot-toast";

interface RecruiterTableProps {
  users: User[];
  candidates: Candidate[];
  roleInfo: {
    id: string;
    name: string;
    company: string;
  } | null;
}

const RecruiterTable: React.FC<RecruiterTableProps> = ({
  users,
  candidates,
  roleInfo,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof User | "candidateCount";
    direction: "ascending" | "descending";
  }>({ key: "candidateCount", direction: "descending" }); // Default sort by candidate count
  const [selectedCandidates, setSelectedCandidates] = useState<{
    [userId: string]: { [candidateId: string]: boolean };
  }>({});
  const [expandedUsers, setExpandedUsers] = useState<{
    [userId: string]: boolean;
  }>({});
  const [roleFilter, setRoleFilter] = useState<"all" | "inRole" | "outOfRole">(
    "all"
  );

  const handleSort = (key: keyof User | "candidateCount") => {
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

  const toggleCandidateSelection = (userId: string, candidateId: string) => {
    setSelectedCandidates((prev) => {
      const userSelections = prev[userId] || {};
      return {
        ...prev,
        [userId]: {
          ...userSelections,
          [candidateId]: !userSelections[candidateId],
        },
      };
    });
  };

  const selectAllCandidates = (userId: string, userCandidates: Candidate[]) => {
    const allSelected = userCandidates.every(
      (candidate) => selectedCandidates[userId]?.[candidate.id]
    );

    const newSelections = {};
    userCandidates.forEach((candidate) => {
      newSelections[candidate.id] = !allSelected;
    });

    setSelectedCandidates((prev) => ({
      ...prev,
      [userId]: newSelections,
    }));
  };

  const toggleUserExpanded = (userId: string) => {
    setExpandedUsers((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const exportCandidatesCSV = (
    userId: string,
    userName: string,
    userCandidates: Candidate[]
  ) => {
    const selectedCandidatesList = userCandidates.filter(
      (candidate) => selectedCandidates[userId]?.[candidate.id]
    );

    if (selectedCandidatesList.length === 0) {
      toast.error("Please select at least one candidate to export");
      return;
    }

    // Create CSV content
    let csvContent = "Name,LinkedIn URL,Application URL,Match Percentage\n";

    selectedCandidatesList.forEach((candidate) => {
      csvContent += `"${candidate.name}","${candidate.linkedin_url}","${
        candidate.application_url
      }","${Math.round(candidate.similarity * 100)}%"\n`;
    });

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${userName.replace(/\s+/g, "_")}_candidates.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("CSV file downloaded successfully");
  };

  const generateAndCopyEmailTemplate = (
    user: User & { fullCandidates: Candidate[] }
  ) => {
    const selectedCandidatesList = user.fullCandidates.filter(
      (candidate) => selectedCandidates[user.id]?.[candidate.id]
    );

    if (selectedCandidatesList.length === 0) {
      toast.error("Please select at least one candidate for this recruiter");
      return;
    }

    if (!roleInfo) {
      toast.error("Role information is missing");
      return;
    }

    // Get recruiter's first name
    const userFirstName = user.name.split(" ")[0];

    // Create candidate list with links
    const candidateLinks = selectedCandidatesList.map((candidate) => {
      return `- [${candidate.name}](${candidate.linkedin_url})`;
    });

    const template = `To: ${user.email}
Subject: Candidates for ${roleInfo.name} at ${roleInfo.company}

Hi ${userFirstName},

We think your network of candidates could be a fit for the ${
      roleInfo.name
    } at ${roleInfo.company}.

Let us know if any of these candidates are interested in this role—if so we can get the ball rolling:
${candidateLinks.join("\n")}

Best,
[unfilled name]`;

    navigator.clipboard
      .writeText(template)
      .then(() => {
        toast.success("Email template copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy template: ", err);
        toast.error("Failed to copy template. Please try again.");
      });
  };

  // Process candidates for each user
  const usersWithFullCandidates = useMemo(() => {
    return users.map((user) => {
      // Process each candidate to ensure reasons and risks are arrays
      const processedCandidates =
        user.candidates?.map((candidate) => {
          // Find the full candidate data
          const fullCandidate =
            candidates.find((c) => c.id === candidate.id) || candidate;

          // Convert reason string to array if it's not already an array
          const reasons =
            fullCandidate.reasons ||
            (fullCandidate.reason
              ? fullCandidate.reason.split("\n").filter((r) => r.trim())
              : []);

          // Convert risk string to array if it's not already an array
          const risks =
            fullCandidate.risks ||
            (fullCandidate.risk
              ? fullCandidate.risk.split("\n").filter((r) => r.trim())
              : []);

          return {
            ...fullCandidate,
            reasons,
            risks,
            // Use current date since created_at is not available
            created_at: new Date().toISOString(),
          };
        }) || [];

      // Sort candidates by similarity (match percentage) in descending order
      const sortedCandidates = [...processedCandidates].sort(
        (a, b) => b.similarity - a.similarity
      );

      return {
        ...user,
        fullCandidates: sortedCandidates,
      };
    });
  }, [users, candidates]);

  const filteredUsers = useMemo(() => {
    let result = [...usersWithFullCandidates];

    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(
        (user) =>
          user.name.toLowerCase().includes(lowerSearchTerm) ||
          user.email.toLowerCase().includes(lowerSearchTerm)
      );
    }

    // Apply role filter
    if (roleFilter === "inRole") {
      result = result.filter((user) => user.in_role);
    } else if (roleFilter === "outOfRole") {
      result = result.filter((user) => !user.in_role);
    }

    // Apply sorting
    if (sortConfig) {
      result.sort((a, b) => {
        if (sortConfig.key === "candidateCount") {
          // Sort by number of candidates
          const valueA = a.fullCandidates.length;
          const valueB = b.fullCandidates.length;

          if (valueA < valueB) {
            return sortConfig.direction === "ascending" ? -1 : 1;
          }
          if (valueA > valueB) {
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
  }, [usersWithFullCandidates, searchTerm, sortConfig, roleFilter]);

  const getSortIcon = (key: keyof User | "candidateCount") => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronDown size={16} className="opacity-30" />;
    }
    return sortConfig.direction === "ascending" ? (
      <ChevronUp size={16} />
    ) : (
      <ChevronDown size={16} />
    );
  };

  return (
    <>
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg bg-white">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search recruiters or email..."
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
            <div>
              <label className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Filter:</span>
                <select
                  value={roleFilter}
                  onChange={(e) =>
                    setRoleFilter(
                      e.target.value as "all" | "inRole" | "outOfRole"
                    )
                  }
                  className="rounded border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All</option>
                  <option value="inRole">In Role</option>
                  <option value="outOfRole">Out of Role</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center">
                    <span>Recruiter</span>
                    {getSortIcon("name")}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("candidateCount")}
                >
                  <div className="flex items-center">
                    <span>Candidates</span>
                    {getSortIcon("candidateCount")}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div className="flex items-center">
                    <span>In Role</span>
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div className="flex items-center">
                    <span>Actions</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <React.Fragment key={user.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            <a
                              href={`mailto:${user.email}`}
                              className="flex items-center text-blue-600 hover:text-blue-800"
                            >
                              <Mail size={14} className="mr-1" /> {user.email}
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Users size={16} className="text-gray-500 mr-2" />
                          <span className="text-sm text-gray-900">
                            {user.fullCandidates.length}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-sm font-medium ${
                            user.in_role ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {user.in_role ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => toggleUserExpanded(user.id)}
                            className="flex items-center text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded"
                          >
                            {expandedUsers[user.id] ? (
                              <>
                                <EyeOff size={14} className="mr-1" /> Hide
                              </>
                            ) : (
                              <>
                                <Eye size={14} className="mr-1" /> Show
                              </>
                            )}
                          </button>
                          <button
                            onClick={() =>
                              selectAllCandidates(user.id, user.fullCandidates)
                            }
                            className="flex items-center text-xs text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 px-2 py-1 rounded"
                          >
                            <CheckSquare size={14} className="mr-1" />{" "}
                            {user.fullCandidates.every(
                              (c) => selectedCandidates[user.id]?.[c.id]
                            )
                              ? "Deselect"
                              : "Select"}
                          </button>
                          <button
                            onClick={() =>
                              exportCandidatesCSV(
                                user.id,
                                user.name,
                                user.fullCandidates
                              )
                            }
                            className="flex items-center text-xs text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded"
                          >
                            <Download size={14} className="mr-1" /> Export
                          </button>
                          <button
                            onClick={() => generateAndCopyEmailTemplate(user)}
                            className="flex items-center text-xs text-orange-600 hover:text-orange-800 bg-orange-50 hover:bg-orange-100 px-2 py-1 rounded"
                          >
                            <Mail size={14} className="mr-1" /> Email
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded candidate rows */}
                    {expandedUsers[user.id] &&
                      user.fullCandidates.length > 0 && (
                        <tr>
                          <td colSpan={4} className="px-0 py-0">
                            <div className="bg-gray-50 px-6 py-4">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th
                                      scope="col"
                                      className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                      <div className="flex justify-center items-center">
                                        <span>Select</span>
                                      </div>
                                    </th>
                                    <th
                                      scope="col"
                                      className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                      <div className="flex items-center">
                                        <span>Candidate</span>
                                      </div>
                                    </th>
                                    <th
                                      scope="col"
                                      className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                      <div className="flex items-center">
                                        <span>Documents</span>
                                      </div>
                                    </th>
                                    <th
                                      scope="col"
                                      className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                      <div className="flex items-center">
                                        <span>Key Traits</span>
                                      </div>
                                    </th>
                                    <th
                                      scope="col"
                                      className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                      <div className="flex items-center">
                                        <span>Match %</span>
                                      </div>
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {user.fullCandidates.map((candidate) => (
                                    <tr
                                      key={candidate.id}
                                      className="hover:bg-gray-50"
                                    >
                                      <td className="px-3 py-3 whitespace-nowrap text-center">
                                        <input
                                          type="checkbox"
                                          id={`${user.id}-${candidate.id}`}
                                          checked={
                                            !!selectedCandidates[user.id]?.[
                                              candidate.id
                                            ]
                                          }
                                          onChange={() =>
                                            toggleCandidateSelection(
                                              user.id,
                                              candidate.id
                                            )
                                          }
                                          className="rounded text-blue-600 focus:ring-blue-500"
                                        />
                                      </td>
                                      <td className="px-6 py-3 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                          {candidate.name}
                                        </div>
                                      </td>
                                      <td className="px-6 py-3 whitespace-nowrap">
                                        <div className="flex flex-col space-y-2">
                                          <a
                                            href={candidate.linkedin_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center text-blue-600 hover:text-blue-800"
                                          >
                                            <Linkedin
                                              size={16}
                                              className="mr-1"
                                            />{" "}
                                            LinkedIn
                                          </a>
                                          {/* Resume link commented out as it's not returned by the database */}
                                          <a
                                            href={candidate.application_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center text-blue-600 hover:text-blue-800"
                                          >
                                            <ExternalLink
                                              size={16}
                                              className="mr-1"
                                            />{" "}
                                            Application
                                          </a>
                                        </div>
                                      </td>
                                      <td className="px-6 py-3">
                                        <div className="text-sm text-gray-900">
                                          <div className="mb-2">
                                            <span className="font-medium">
                                              Strengths:
                                            </span>
                                            <div className="ml-2 text-sm text-gray-600">
                                              {candidate.reason ||
                                                candidate.reasons.join("\n")}
                                            </div>
                                          </div>
                                          {(candidate.risk ||
                                            candidate.risks.length > 0) && (
                                            <div>
                                              <span className="font-medium">
                                                Risks:
                                              </span>
                                              <div className="ml-2 text-sm text-gray-600">
                                                {candidate.risk ||
                                                  candidate.risks.join("\n")}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-6 py-3 whitespace-nowrap">
                                        <div className="flex items-center">
                                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div
                                              className="bg-blue-600 h-2.5 rounded-full"
                                              style={{
                                                width: `${
                                                  candidate.similarity * 100
                                                }%`,
                                              }}
                                            ></div>
                                          </div>
                                          <span className="ml-2 text-sm text-gray-900">
                                            {Math.round(
                                              candidate.similarity * 100
                                            )}
                                            %
                                          </span>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No recruiters found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default RecruiterTable;

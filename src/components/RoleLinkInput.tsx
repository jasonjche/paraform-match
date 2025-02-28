import React, { useState } from "react";
import { Search } from "lucide-react";
import { ro } from "date-fns/locale";

interface RoleLinkInputProps {
  onSubmit: (roleLink: string) => void;
}

const RoleLinkInput: React.FC<RoleLinkInputProps> = ({ onSubmit }) => {
  const [roleLink, setRoleLink] = useState("");
  const [error, setError] = useState<string | null>(null);

  const extractRoleId = (link: string): string | null => {
    // Clean up the link
    const trimmedLink = link.trim();

    try {
      // Try to extract roleId from various URL patterns

      // Direct API URLs
      if (
        trimmedLink.includes(
          "/api/scripts/matching/get_recruiter_rank_json?roleId="
        )
      ) {
        const parts = trimmedLink.split("roleId=");
        if (parts.length > 1) return parts[1].split("&")[0];
      }

      if (
        trimmedLink.includes("/api/cron/role/get_matched_candidates?role_id=")
      ) {
        const parts = trimmedLink.split("role_id=");
        if (parts.length > 1) return parts[1].split("&")[0];
      }

      // Extract from URL path
      const url = new URL(trimmedLink);
      const pathSegments = url.pathname.split("/").filter(Boolean);

      // Pattern: /client/{roleId}
      if (pathSegments.includes("client") && pathSegments.length > 1) {
        const index = pathSegments.indexOf("client");
        if (index + 1 < pathSegments.length) return pathSegments[index + 1];
      }

      // Pattern: /company/{company}/{roleId}/recruit
      if (pathSegments.includes("company") && pathSegments.length > 3) {
        const index = pathSegments.indexOf("company");
        if (index + 2 < pathSegments.length) return pathSegments[index + 2];
      }

      // Pattern: /share/{company}/{roleId}
      if (pathSegments.includes("share") && pathSegments.length > 2) {
        const index = pathSegments.indexOf("share");
        if (index + 2 < pathSegments.length) return pathSegments[index + 2];
      }

      // Last segment fallback - if it looks like an ID (long alphanumeric string)
      const lastSegment = pathSegments[pathSegments.length - 1];
      if (
        lastSegment &&
        lastSegment.length > 20 &&
        /^[a-zA-Z0-9]+$/.test(lastSegment)
      ) {
        return lastSegment;
      }

      return null;
    } catch (err) {
      console.error("Error parsing URL:", err);
      return null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!roleLink.trim()) {
      setError("Please enter a role link");
      return;
    }

    // Try to extract the roleId
    const roleId = extractRoleId(roleLink.trim());

    if (!roleId) {
      setError("Could not extract a valid role ID from the link");
      return;
    }

    // Construct the API URL with the extracted roleId using the updated format

    onSubmit(roleId);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-6">
      <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
        <div className="relative flex-grow">
          <input
            type="text"
            value={roleLink}
            onChange={(e) => setRoleLink(e.target.value)}
            placeholder="Enter role link (e.g., https://www.paraform.com/client/cm4aeeweh0064jv0casuba1s9)"
            className="w-full px-4 py-2 pr-24 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 flex items-center"
          >
            <Search size={16} className="mr-1" />
            <span>Search</span>
          </button>
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="text-xs text-gray-500">
          Supported formats:
          <ul className="list-disc list-inside ml-2 mt-1">
            <li>https://www.paraform.com/client/[roleId]</li>
            <li>https://www.paraform.com/company/[company]/[roleId]/recruit</li>
            <li>https://www.paraform.com/share/[company]/[roleId]</li>
          </ul>
        </div>
      </form>
    </div>
  );
};

export default RoleLinkInput;

import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import { fetchData } from "./api";
import { RoleToCandidatesResponse } from "./types";
import RoleLinkInput from "./components/RoleLinkInput";
import TabNavigation from "./components/TabNavigation";
import CandidateTable from "./components/CandidateTable";
import RecruiterTable from "./components/RecruiterTable";
import CandidateRoleMatch from "./components/CandidateRoleMatch";
import { UserSearch, Briefcase, Loader2 } from "lucide-react";
import { Toaster } from "react-hot-toast";

const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <UserSearch size={28} className="text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                Paraform Match
              </span>
            </div>
            <div className="ml-6 flex space-x-4">
              <Link
                to="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  location.pathname === "/"
                    ? "border-blue-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                <UserSearch size={18} className="mr-1" /> Role to Candidates
              </Link>
              {/* <Link
                to="/candidate-match"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  location.pathname === "/candidate-match"
                    ? "border-blue-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                <Briefcase size={18} className="mr-1" /> Candidate to Roles
              </Link> */}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

const RoleDashboard = () => {
  const [activeTab, setActiveTab] = useState<"candidates" | "recruiters">(
    "candidates"
  );
  const [data, setData] = useState<RoleToCandidatesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleLinkSubmit = async (linkId: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchData(linkId);
      if (result) {
        setData(result);
      } else {
        setError("No data returned from API");
      }
    } catch (err) {
      setError("Failed to load data. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RoleLinkInput onSubmit={handleRoleLinkSubmit} />

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 size={48} className="animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : data ? (
          <>
            {data.role && (
              <div className="bg-white shadow rounded-lg p-4 mb-6">
                <h2 className="text-xl font-medium text-gray-900">
                  {data.role.name} at {data.role.company}
                </h2>
              </div>
            )}

            <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

            {activeTab === "candidates" ? (
              <CandidateTable candidates={data.candidates} />
            ) : (
              <RecruiterTable
                users={data.users}
                candidates={data.candidates}
                roleInfo={data.role}
              />
            )}
          </>
        ) : (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <h2 className="text-xl font-medium text-gray-900 mb-2">
              Enter a role link to get started
            </h2>
            <p className="text-gray-500">
              Enter a role link in the search box above to view candidates and
              recruiters for that position.
            </p>
          </div>
        )}
      </main>
    </>
  );
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navigation />

        <Routes>
          <Route path="/" element={<RoleDashboard />} />
          <Route path="/candidate-match" element={<CandidateRoleMatch />} />
        </Routes>

        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-center text-gray-500 text-sm">
              Paraform Match © {new Date().getFullYear()}
            </p>
          </div>
        </footer>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#363636",
              color: "#fff",
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: "#10B981",
                secondary: "white",
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: "#EF4444",
                secondary: "white",
              },
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import { fetchData } from './api';
import { ApiResponse } from './types';
import RoleLinkInput from './components/RoleLinkInput';
import TabNavigation from './components/TabNavigation';
import CandidateTable from './components/CandidateTable';
import RecruiterTable from './components/RecruiterTable';
import { UserSearch } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<'candidates' | 'recruiters'>('candidates');
  const [roleLink, setRoleLink] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (roleLink) {
        setLoading(true);
        setError(null);
        try {
          const result = await fetchData(roleLink);
          setData(result);
        } catch (err) {
          setError('Failed to load data. Please try again.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [roleLink]);

  const handleRoleLinkSubmit = (link: string) => {
    setRoleLink(link);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <UserSearch size={28} className="mr-2 text-blue-600" />
              Talent Management Dashboard
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RoleLinkInput onSubmit={handleRoleLinkSubmit} />

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
            <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
            
            {activeTab === 'candidates' ? (
              <CandidateTable candidates={data.candidates} />
            ) : (
              <RecruiterTable recruiters={data.recruiters} />
            )}
          </>
        ) : (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <UserSearch size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-medium text-gray-900 mb-2">Enter a role link to get started</h2>
            <p className="text-gray-500">
              Enter a role link in the search box above to view candidates and recruiters for that position.
            </p>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-500 text-sm">
            Talent Management Dashboard © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
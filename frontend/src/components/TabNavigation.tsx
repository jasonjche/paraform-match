import React from 'react';

interface TabNavigationProps {
  activeTab: 'candidates' | 'recruiters';
  onTabChange: (tab: 'candidates' | 'recruiters') => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex -mb-px">
        <button
          onClick={() => onTabChange('candidates')}
          className={`py-4 px-6 font-medium text-sm border-b-2 ${
            activeTab === 'candidates'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Candidates
        </button>
        <button
          onClick={() => onTabChange('recruiters')}
          className={`py-4 px-6 font-medium text-sm border-b-2 ${
            activeTab === 'recruiters'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Recruiters
        </button>
      </nav>
    </div>
  );
};

export default TabNavigation;
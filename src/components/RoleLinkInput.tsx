import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface RoleLinkInputProps {
  onSubmit: (roleLink: string) => void;
}

const RoleLinkInput: React.FC<RoleLinkInputProps> = ({ onSubmit }) => {
  const [roleLink, setRoleLink] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roleLink.trim()) {
      onSubmit(roleLink.trim());
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-6">
      <form onSubmit={handleSubmit} className="flex items-center">
        <div className="relative flex-grow">
          <input
            type="text"
            value={roleLink}
            onChange={(e) => setRoleLink(e.target.value)}
            placeholder="Enter role link"
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-500"
          >
            <Search size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default RoleLinkInput;
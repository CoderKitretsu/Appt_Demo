import React, { useState, useEffect } from 'react';
import TeamList from '../features/team/components/TeamList.jsx';
import TeamForm from '../features/team/components/TeamForm.jsx';
import { ensureStorageReady } from '../services/storageFactory.js';
import storage from '../services/storageFactory.js';

/**
 * TeamManagement - Main page for managing team members
 * Displays list of team members and provides create/edit functionality
 */
const TeamManagement = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeamMember, setEditingTeamMember] = useState(null);
  const [businessId, setBusinessId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTeamList, setRefreshTeamList] = useState(null);

  // Load business data on component mount
  useEffect(() => {
    const loadBusinessData = async () => {
      try {
        await ensureStorageReady();
        
        // Get all businesses (for MVP, we'll use the first one)
        const businesses = await storage.exportAll();
        const businessList = Object.values(businesses.businesses || {});
        
        if (businessList.length > 0) {
          setBusinessId(businessList[0].id);
        } else {
          console.warn('No businesses found. User needs to complete onboarding first.');
        }
      } catch (error) {
        console.error('Failed to load business data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBusinessData();
  }, []);

  // Handle create new team member
  const handleCreateNew = () => {
    setEditingTeamMember(null);
    setIsFormOpen(true);
  };

  // Handle edit team member
  const handleEdit = (teamMember) => {
    setEditingTeamMember(teamMember);
    setIsFormOpen(true);
  };

  // Handle form close
  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTeamMember(null);
  };

  // Handle successful save
  const handleSuccess = () => {
    // Refresh the team list
    if (refreshTeamList) {
      refreshTeamList();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!businessId) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12 bg-yellow-50 border border-yellow-200 rounded-md">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">Business Setup Required</h2>
          <p className="text-yellow-700 mb-4">
            You need to complete your business setup before managing team members.
          </p>
          <a
            href="/onboarding"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Complete Onboarding
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Management</h1>
            <p className="text-gray-600">
              Manage your team members, their roles, schedules, and availability.
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
          >
            + Add Team Member
          </button>
        </div>
      </div>

      {/* Team List */}
      <TeamList
        businessId={businessId}
        onEdit={handleEdit}
        onRefresh={(refreshFn) => setRefreshTeamList(() => refreshFn)}
      />

      {/* Team Form Modal */}
      <TeamForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        teamMember={editingTeamMember}
        businessId={businessId}
        onSuccess={handleSuccess}
      />

      {/* Development Info */}
      {import.meta.env.MODE === 'development' && (
        <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Development Info</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p><strong>Business ID:</strong> {businessId}</p>
            <p><strong>Form Open:</strong> {isFormOpen ? 'Yes' : 'No'}</p>
            <p><strong>Editing:</strong> {editingTeamMember ? editingTeamMember.name : 'None'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
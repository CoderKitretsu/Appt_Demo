import React, { useState, useEffect } from 'react';
import useTeam from '../hooks/useTeam.js';

/**
 * TeamList - Displays a table of team members for the business
 * @param {string} businessId - The business ID to load team members for
 * @param {function} onEdit - Callback when edit button is clicked
 * @param {function} onRefresh - Callback to refresh the list (optional)
 */
const TeamList = ({ businessId, onEdit, onRefresh }) => {
  const { list, remove, isLoading, error, clearError } = useTeam();
  const [teamMembers, setTeamMembers] = useState([]);
  const [isDeleting, setIsDeleting] = useState(null);

  // Load team members on component mount and when businessId changes
  const loadTeamMembers = async () => {
    if (!businessId) return;
    
    try {
      clearError();
      const members = await list(businessId);
      setTeamMembers(members || []);
    } catch (err) {
      console.error('Failed to load team members:', err);
    }
  };

  useEffect(() => {
    loadTeamMembers();
  }, [businessId]);

  // Expose refresh function to parent
  useEffect(() => {
    if (onRefresh) {
      onRefresh(loadTeamMembers);
    }
  }, [onRefresh]);

  // Handle delete with confirmation
  const handleDelete = async (teamMember) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${teamMember.name}?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;

    setIsDeleting(teamMember.id);
    try {
      await remove(teamMember.id);
      await loadTeamMembers(); // Refresh the list
    } catch (err) {
      alert(`Failed to delete team member: ${err.message}`);
    } finally {
      setIsDeleting(null);
    }
  };

  // Format working hours for display
  const formatWorkingHours = (workingHours) => {
    if (!workingHours || workingHours.length === 0) {
      return 'No hours set';
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const formatted = workingHours
      .sort((a, b) => a.weekday - b.weekday)
      .map(({ weekday, from, to }) => `${dayNames[weekday]} ${from}-${to}`)
      .join(', ');

    return formatted.length > 50 ? formatted.substring(0, 50) + '...' : formatted;
  };

  // Error display
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
        <h3 className="text-red-800 font-semibold mb-2">Error Loading Team Members</h3>
        <p className="text-red-700 mb-2">{error.message}</p>
        <button
          onClick={loadTeamMembers}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-600">Loading team members...</div>
      </div>
    );
  }

  // Empty state
  if (teamMembers.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 border border-gray-200 rounded-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Team Members</h3>
        <p className="text-gray-600 mb-4">
          You haven't added any team members yet. Add your first team member to get started.
        </p>
        <button
          onClick={loadTeamMembers}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">
          Team Members ({teamMembers.length})
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Capacity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Working Hours
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {teamMembers.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{member.name}</div>
                    {member.skills && member.skills.length > 0 && (
                      <div className="text-xs text-gray-500">
                        Skills: {member.skills.join(', ')}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {member.email || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {member.phone || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {member.role || 'Staff'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {member.capacity || 1}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                  <div className="truncate" title={formatWorkingHours(member.defaultWorkingHours)}>
                    {formatWorkingHours(member.defaultWorkingHours)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => onEdit(member)}
                    className="text-blue-600 hover:text-blue-900 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(member)}
                    disabled={isDeleting === member.id}
                    className={`text-red-600 hover:text-red-900 hover:underline ${
                      isDeleting === member.id ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isDeleting === member.id ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>Showing {teamMembers.length} team member{teamMembers.length !== 1 ? 's' : ''}</span>
          <button
            onClick={loadTeamMembers}
            className="text-blue-600 hover:text-blue-900 hover:underline"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamList;
import { useState, useCallback } from 'react';
import storage from '../../../services/storageFactory.js';

/**
 * Custom hook for team member management
 * Provides CRUD operations for team members using storage adapter
 */
export const useTeam = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * List all team members for a business
   * @param {string} businessId - Business ID to filter by
   * @param {object} filters - Additional filters (optional)
   * @returns {Promise<Array>} Array of team member objects
   */
  const list = useCallback(async (businessId, filters = {}) => {
    if (!businessId) {
      throw new Error('Business ID is required');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const teamMembers = await storage.listTeamMembers(businessId, filters);
      return teamMembers;
    } catch (err) {
      console.error('❌ Failed to list team members:', err);
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get a specific team member by ID
   * @param {string} teamMemberId - Team member ID
   * @returns {Promise<object>} Team member object
   */
  const get = useCallback(async (teamMemberId) => {
    if (!teamMemberId) {
      throw new Error('Team member ID is required');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const teamMember = await storage.getTeamMember(teamMemberId);
      return teamMember;
    } catch (err) {
      console.error('❌ Failed to get team member:', err);
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create or update a team member
   * @param {object} teamMemberObj - Team member data
   * @returns {Promise<object>} Saved team member object
   */
  const createOrUpdate = useCallback(async (teamMemberObj) => {
    if (!teamMemberObj) {
      throw new Error('Team member data is required');
    }

    // Basic validation
    if (!teamMemberObj.name?.trim()) {
      const error = new Error('Team member name is required');
      error.code = 'VALIDATION';
      throw error;
    }

    if (!teamMemberObj.businessId) {
      const error = new Error('Business ID is required');
      error.code = 'VALIDATION';
      throw error;
    }

    // Validate email format if provided
    if (teamMemberObj.email && teamMemberObj.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(teamMemberObj.email.trim())) {
        const error = new Error('Please provide a valid email address');
        error.code = 'VALIDATION';
        throw error;
      }
    }

    // Validate capacity
    if (teamMemberObj.capacity !== undefined) {
      const capacity = parseInt(teamMemberObj.capacity, 10);
      if (isNaN(capacity) || capacity <= 0) {
        const error = new Error('Capacity must be a positive integer greater than 0');
        error.code = 'VALIDATION';
        throw error;
      }
      teamMemberObj.capacity = capacity;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const savedTeamMember = await storage.upsertTeamMember(teamMemberObj);
      console.log('✅ Team member saved:', savedTeamMember);
      return savedTeamMember;
    } catch (err) {
      console.error('❌ Failed to save team member:', err);
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Delete a team member
   * @param {string} teamMemberId - Team member ID to delete
   * @returns {Promise<boolean>} Success status
   */
  const remove = useCallback(async (teamMemberId) => {
    if (!teamMemberId) {
      throw new Error('Team member ID is required');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      await storage.deleteTeamMember(teamMemberId);
      console.log('✅ Team member deleted:', teamMemberId);
      return true;
    } catch (err) {
      console.error('❌ Failed to delete team member:', err);
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // State
    isLoading,
    error,
    
    // Actions
    list,
    get,
    createOrUpdate,
    remove,
    clearError
  };
};

export default useTeam;
import React, { useState, useEffect } from 'react';
import useTeam from '../hooks/useTeam.js';
import { createTeamMember } from '../../../services/models/schemas.js';

/**
 * TeamForm - Modal form for creating and editing team members
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Callback to close the modal
 * @param {object} teamMember - Team member to edit (null for create)
 * @param {string} businessId - Business ID for new team members
 * @param {function} onSuccess - Callback when save succeeds
 */
const TeamForm = ({ isOpen, onClose, teamMember, businessId, onSuccess }) => {
  const { createOrUpdate, isLoading, error, clearError } = useTeam();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    capacity: 1,
    skills: '',
    defaultWorkingHours: [
      { weekday: 1, from: '09:00', to: '17:00', enabled: true },  // Monday
      { weekday: 2, from: '09:00', to: '17:00', enabled: true },  // Tuesday
      { weekday: 3, from: '09:00', to: '17:00', enabled: true },  // Wednesday
      { weekday: 4, from: '09:00', to: '17:00', enabled: true },  // Thursday
      { weekday: 5, from: '09:00', to: '17:00', enabled: true },  // Friday
      { weekday: 6, from: '09:00', to: '15:00', enabled: false }, // Saturday
      { weekday: 0, from: '10:00', to: '14:00', enabled: false }  // Sunday
    ]
  });

  const [formErrors, setFormErrors] = useState({});

  // Reset form when modal opens/closes or teamMember changes
  useEffect(() => {
    if (!isOpen) {
      // Reset form when closing
      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          phone: '',
          role: '',
          capacity: 1,
          skills: '',
          defaultWorkingHours: [
            { weekday: 1, from: '09:00', to: '17:00', enabled: true },
            { weekday: 2, from: '09:00', to: '17:00', enabled: true },
            { weekday: 3, from: '09:00', to: '17:00', enabled: true },
            { weekday: 4, from: '09:00', to: '17:00', enabled: true },
            { weekday: 5, from: '09:00', to: '17:00', enabled: true },
            { weekday: 6, from: '09:00', to: '15:00', enabled: false },
            { weekday: 0, from: '10:00', to: '14:00', enabled: false }
          ]
        });
        setFormErrors({});
        clearError();
      }, 200);
      return;
    }

    // Populate form for editing
    if (teamMember) {
      const skills = teamMember.skills ? teamMember.skills.join(', ') : '';
      const workingHours = teamMember.defaultWorkingHours || [];
      
      // Convert stored working hours to form format
      const formWorkingHours = [1, 2, 3, 4, 5, 6, 0].map(weekday => {
        const existing = workingHours.find(h => h.weekday === weekday);
        return existing ? { ...existing, enabled: true } : {
          weekday,
          from: weekday === 6 ? '09:00' : weekday === 0 ? '10:00' : '09:00',
          to: weekday === 6 ? '15:00' : weekday === 0 ? '14:00' : '17:00',
          enabled: false
        };
      });

      setFormData({
        name: teamMember.name || '',
        email: teamMember.email || '',
        phone: teamMember.phone || '',
        role: teamMember.role || '',
        capacity: teamMember.capacity || 1,
        skills: skills,
        defaultWorkingHours: formWorkingHours
      });
    }
  }, [isOpen, teamMember, clearError]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear related errors
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle working hours changes
  const handleWorkingHoursChange = (weekday, field, value) => {
    setFormData(prev => ({
      ...prev,
      defaultWorkingHours: prev.defaultWorkingHours.map(day => 
        day.weekday === weekday ? { ...day, [field]: value } : day
      )
    }));
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    // Email validation (if provided)
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = 'Please enter a valid email address';
      }
    }

    // Capacity validation
    const capacity = parseInt(formData.capacity, 10);
    if (isNaN(capacity) || capacity <= 0) {
      errors.capacity = 'Capacity must be a positive number greater than 0';
    }

    // Working hours validation
    const enabledDays = formData.defaultWorkingHours.filter(day => day.enabled);
    if (enabledDays.length === 0) {
      errors.workingHours = 'At least one working day must be selected';
    }

    // Validate time ranges for enabled days
    for (const day of enabledDays) {
      if (day.from >= day.to) {
        errors.workingHours = 'Start time must be before end time for all working days';
        break;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Prepare data for submission
      const skillsArray = formData.skills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);

      const workingHours = formData.defaultWorkingHours
        .filter(day => day.enabled)
        .map(({ weekday, from, to }) => ({ weekday, from, to }));

      const teamMemberData = {
        ...(teamMember && { id: teamMember.id }),
        businessId: businessId,
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        role: formData.role.trim() || 'Staff',
        capacity: parseInt(formData.capacity, 10),
        skills: skillsArray,
        defaultWorkingHours: workingHours
      };

      // Use factory if creating new member
      const finalData = teamMember ? teamMemberData : createTeamMember({ overrides: teamMemberData });

      await createOrUpdate(finalData);
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
      
    } catch (err) {
      console.error('Failed to save team member:', err);
      // Error will be handled by the hook and displayed in UI
    }
  };

  // Day names for working hours section
  const dayNames = {
    1: 'Monday',
    2: 'Tuesday', 
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
    0: 'Sunday'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {teamMember ? 'Edit Team Member' : 'Add New Team Member'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-700">
                {error.code === 'VALIDATION' ? error.message : 'Failed to save team member. Please try again.'}
              </p>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${
                  formErrors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter team member name"
              />
              {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${
                  formErrors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter email address"
              />
              {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter phone number"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Stylist, Manager"
                />
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => handleInputChange('capacity', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md ${
                    formErrors.capacity ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="1"
                />
                {formErrors.capacity && <p className="text-red-500 text-sm mt-1">{formErrors.capacity}</p>}
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
              <input
                type="text"
                value={formData.skills}
                onChange={(e) => handleInputChange('skills', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., Hair cutting, Coloring, Manicure (comma-separated)"
              />
              <p className="text-gray-500 text-sm mt-1">Separate multiple skills with commas</p>
            </div>
          </div>

          {/* Working Hours */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Default Working Hours</h3>
            
            {formErrors.workingHours && (
              <p className="text-red-500 text-sm">{formErrors.workingHours}</p>
            )}
            
            <div className="space-y-3">
              {formData.defaultWorkingHours.map((day) => (
                <div key={day.weekday} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-md">
                  <div className="flex items-center space-x-2 w-32">
                    <input
                      type="checkbox"
                      checked={day.enabled}
                      onChange={(e) => handleWorkingHoursChange(day.weekday, 'enabled', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label className="text-sm font-medium">{dayNames[day.weekday]}</label>
                  </div>
                  
                  {day.enabled && (
                    <div className="flex items-center space-x-2 flex-1">
                      <label className="text-sm">From:</label>
                      <input
                        type="time"
                        value={day.from}
                        onChange={(e) => handleWorkingHoursChange(day.weekday, 'from', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <label className="text-sm">To:</label>
                      <input
                        type="time"
                        value={day.to}
                        onChange={(e) => handleWorkingHoursChange(day.weekday, 'to', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-6 py-2 text-white rounded-md font-medium ${
                isLoading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isLoading ? 'Saving...' : teamMember ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamForm;
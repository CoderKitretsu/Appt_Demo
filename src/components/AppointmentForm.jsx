import React, { useState, useEffect } from 'react';
import storage from '../services/storageFactory.js';
import { createAppointment } from '../services/models/schemas.js';
import { 
  localDateTimeToUTC, 
  utcToLocalDateTime, 
  getTodayDate, 
  getCurrentTime,
  addMinutesToTime 
} from '../utils/dateUtils.js';

/**
 * AppointmentForm - Modal form for creating and editing appointments
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Callback to close the modal
 * @param {object} appointment - Appointment to edit (null for create)
 * @param {string} businessId - Business ID
 * @param {object} business - Business object with timezone info
 * @param {function} onSuccess - Callback when save succeeds
 */
const AppointmentForm = ({ isOpen, onClose, appointment, businessId, business, onSuccess }) => {
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Data
  const [services, setServices] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  
  // Form state
  const [formData, setFormData] = useState({
    // Customer details
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    
    // Appointment details
    serviceId: '',
    date: getTodayDate(),
    time: getCurrentTime(),
    teamMemberId: '', // empty = auto-assign
    notes: '',
    
    // System fields
    createdBy: 'admin'
  });

  const [formErrors, setFormErrors] = useState({});
  const [conflictError, setConflictError] = useState(null);

  // Reset form when modal opens/closes or appointment changes
  useEffect(() => {
    if (!isOpen) {
      // Reset form when closing
      setTimeout(() => {
        setFormData({
          customerName: '',
          customerEmail: '',
          customerPhone: '',
          serviceId: '',
          date: getTodayDate(),
          time: getCurrentTime(),
          teamMemberId: '',
          notes: '',
          createdBy: 'admin'
        });
        setFormErrors({});
        setConflictError(null);
      }, 200);
      return;
    }

    // Load services and team members
    loadFormData();

    // Populate form for editing
    if (appointment) {
      const localDateTime = utcToLocalDateTime(appointment.startUTC, business?.timezone || 'UTC');
      
      setFormData({
        customerName: appointment.customer?.name || '',
        customerEmail: appointment.customer?.email || '',
        customerPhone: appointment.customer?.phone || '',
        serviceId: appointment.serviceId || '',
        date: localDateTime.date,
        time: localDateTime.time,
        teamMemberId: appointment.teamMemberId || '',
        notes: appointment.notes || '',
        createdBy: appointment.createdBy || 'admin'
      });
    }
  }, [isOpen, appointment, business]);

  // Load services and team members
  const loadFormData = async () => {
    if (!businessId) return;
    
    setIsLoading(true);
    try {
      const [servicesList, membersList] = await Promise.all([
        storage.listServices(businessId),
        storage.listTeamMembers(businessId)
      ]);
      
      setServices(servicesList || []);
      setTeamMembers(membersList || []);
    } catch (error) {
      console.error('Failed to load form data:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
    
    // Clear conflict error when form changes
    if (conflictError) {
      setConflictError(null);
    }
  };

  // Auto-calculate end time when service changes
  useEffect(() => {
    if (formData.serviceId && formData.time) {
      const service = services.find(s => s.id === formData.serviceId);
      if (service && service.durationMinutes) {
        // Auto-update time display for user reference (not stored in form)
        const endTime = addMinutesToTime(formData.time, service.durationMinutes);
        // Could show this in UI if desired
      }
    }
  }, [formData.serviceId, formData.time, services]);

  // Validate form
  const validateForm = () => {
    const errors = {};

    // Customer validation
    if (!formData.customerName.trim()) {
      errors.customerName = 'Customer name is required';
    }

    // Service validation
    if (!formData.serviceId) {
      errors.serviceId = 'Please select a service';
    }

    // Date validation
    if (!formData.date) {
      errors.date = 'Date is required';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        errors.date = 'Cannot schedule appointments in the past';
      }
    }

    // Time validation
    if (!formData.time) {
      errors.time = 'Time is required';
    }

    // Email validation (if provided)
    if (formData.customerEmail && formData.customerEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.customerEmail.trim())) {
        errors.customerEmail = 'Please enter a valid email address';
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

    setIsSaving(true);
    setConflictError(null);
    
    try {
      const service = services.find(s => s.id === formData.serviceId);
      if (!service) {
        throw new Error('Selected service not found');
      }

      // Convert local date/time to UTC for storage
      const startUTC = localDateTimeToUTC(
        formData.date, 
        formData.time, 
        business?.timezone || 'UTC'
      );
      
      const endUTC = localDateTimeToUTC(
        formData.date, 
        addMinutesToTime(formData.time, service.durationMinutes), 
        business?.timezone || 'UTC'
      );

      // Prepare appointment data
      const appointmentData = {
        businessId: businessId,
        serviceId: formData.serviceId,
        teamMemberId: formData.teamMemberId || null, // null = auto-assign
        startUTC: startUTC,
        endUTC: endUTC,
        customer: {
          name: formData.customerName.trim(),
          email: formData.customerEmail.trim() || undefined,
          phone: formData.customerPhone.trim() || undefined
        },
        notes: formData.notes.trim() || undefined,
        createdBy: formData.createdBy,
        status: 'booked'
      };

      let savedAppointment;
      
      if (appointment) {
        // Update existing appointment
        savedAppointment = await storage.updateAppointment(appointment.id, {
          ...appointmentData,
          id: appointment.id
        });
      } else {
        // Create new appointment using factory
        const finalData = createAppointment({ overrides: appointmentData });
        savedAppointment = await storage.createAppointment(finalData);
      }
      
      console.log('✅ Appointment saved:', savedAppointment);
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
      
    } catch (err) {
      console.error('❌ Failed to save appointment:', err);
      
      // Handle specific error types
      if (err.code === 'CONFLICT') {
        setConflictError({
          message: err.message,
          details: err.details
        });
      } else if (err.code === 'VALIDATION') {
        setFormErrors({ general: err.message });
      } else {
        setFormErrors({ general: 'Failed to save appointment. Please try again.' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Get service details for display
  const getServiceDetails = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    return service || null;
  };

  if (!isOpen) return null;

  const selectedService = getServiceDetails(formData.serviceId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {appointment ? 'Edit Appointment' : 'New Appointment'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <div className="text-gray-600">Loading form data...</div>
            </div>
          )}

          {/* Conflict Error Display */}
          {conflictError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <h4 className="text-red-800 font-semibold mb-2">Scheduling Conflict</h4>
              <p className="text-red-700 mb-2">{conflictError.message}</p>
              {conflictError.details && (
                <p className="text-red-600 text-sm">
                  Reason: {conflictError.details.type} - {conflictError.details.message}
                </p>
              )}
              <p className="text-red-600 text-sm mt-2">
                Please choose a different time or team member.
              </p>
            </div>
          )}

          {/* General Error Display */}
          {formErrors.general && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-700">{formErrors.general}</p>
            </div>
          )}

          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Customer Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md ${
                    formErrors.customerName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter customer name"
                />
                {formErrors.customerName && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.customerName}</p>
                )}
              </div>

              {/* Customer Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md ${
                    formErrors.customerEmail ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="customer@example.com"
                />
                {formErrors.customerEmail && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.customerEmail}</p>
                )}
              </div>

              {/* Customer Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Appointment Details</h3>
            
            {/* Service Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.serviceId}
                onChange={(e) => handleInputChange('serviceId', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${
                  formErrors.serviceId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a service...</option>
                {services.filter(s => s.isActive !== false).map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name} ({service.durationMinutes}min)
                    {service.price && ` - $${service.price}`}
                  </option>
                ))}
              </select>
              {formErrors.serviceId && (
                <p className="text-red-500 text-sm mt-1">{formErrors.serviceId}</p>
              )}
              
              {selectedService && (
                <div className="mt-2 p-3 bg-blue-50 rounded-md">
                  <p className="text-blue-800 text-sm">
                    <strong>Duration:</strong> {selectedService.durationMinutes} minutes
                    {selectedService.price && (
                      <>
                        <br />
                        <strong>Price:</strong> ${selectedService.price} {selectedService.currency}
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  min={getTodayDate()}
                  className={`w-full px-3 py-2 border rounded-md ${
                    formErrors.date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.date && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.date}</p>
                )}
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md ${
                    formErrors.time ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.time && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.time}</p>
                )}
                
                {selectedService && formData.time && (
                  <p className="text-gray-500 text-xs mt-1">
                    End time: {addMinutesToTime(formData.time, selectedService.durationMinutes)}
                  </p>
                )}
              </div>
            </div>

            {/* Team Member Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Staff</label>
              <select
                value={formData.teamMemberId}
                onChange={(e) => handleInputChange('teamMemberId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Auto-assign available staff</option>
                {teamMembers.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.role || 'Staff'})
                  </option>
                ))}
              </select>
              <p className="text-gray-500 text-xs mt-1">
                Leave empty to automatically assign an available team member
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Any special instructions or notes..."
              />
            </div>
          </div>

          {/* Timezone Info */}
          {business?.timezone && business.timezone !== 'UTC' && (
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-gray-700 text-sm">
                <strong>Timezone:</strong> Times are in {business.timezone} (business timezone)
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isLoading}
              className={`px-6 py-2 text-white rounded-md font-medium ${
                isSaving || isLoading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSaving ? 'Saving...' : appointment ? 'Update Appointment' : 'Create Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentForm;
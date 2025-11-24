import React, { useState, useEffect } from 'react';
import useServices from '../hooks/useServices.js';
import { createService } from '../../../services/models/schemas.js';

/**
 * ServiceForm - Modal form for creating and editing services
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Callback to close the modal
 * @param {object} service - Service to edit (null for create)
 * @param {string} businessId - Business ID for new services
 * @param {function} onSuccess - Callback when save succeeds
 */
const ServiceForm = ({ isOpen, onClose, service, businessId, onSuccess }) => {
  const { createOrUpdate, isLoading, error, clearError } = useServices();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    durationMinutes: 30,
    bufferBefore: 0,
    bufferAfter: 0,
    price: '',
    currency: 'USD',
    capacity: 1,
    isActive: true
  });

  const [formErrors, setFormErrors] = useState({});

  // Reset form when modal opens/closes or service changes
  useEffect(() => {
    if (!isOpen) {
      // Reset form when closing
      setTimeout(() => {
        setFormData({
          name: '',
          durationMinutes: 30,
          bufferBefore: 0,
          bufferAfter: 0,
          price: '',
          currency: 'USD',
          capacity: 1,
          isActive: true
        });
        setFormErrors({});
        clearError();
      }, 200);
      return;
    }

    // Populate form for editing
    if (service) {
      setFormData({
        name: service.name || '',
        durationMinutes: service.durationMinutes || 30,
        bufferBefore: service.bufferBefore || 0,
        bufferAfter: service.bufferAfter || 0,
        price: service.price !== undefined ? service.price.toString() : '',
        currency: service.currency || 'USD',
        capacity: service.capacity || 1,
        isActive: service.isActive !== false
      });
    }
  }, [isOpen, service, clearError]);

  // Currency options
  const currencyOptions = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'INR', label: 'INR - Indian Rupee' },
    { value: 'CAD', label: 'CAD - Canadian Dollar' },
    { value: 'AUD', label: 'AUD - Australian Dollar' }
  ];

  // Common duration options in minutes
  const durationOptions = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' },
    { value: 150, label: '2.5 hours' },
    { value: 180, label: '3 hours' }
  ];

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

  // Validate form
  const validateForm = () => {
    const errors = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Service name is required';
    }

    // Duration validation
    const duration = parseInt(formData.durationMinutes, 10);
    if (isNaN(duration) || duration <= 0) {
      errors.durationMinutes = 'Duration must be a positive number greater than 0';
    }

    // Capacity validation
    const capacity = parseInt(formData.capacity, 10);
    if (isNaN(capacity) || capacity <= 0) {
      errors.capacity = 'Capacity must be a positive number greater than 0';
    }

    // Buffer times validation (if provided)
    if (formData.bufferBefore !== '' && formData.bufferBefore !== 0) {
      const bufferBefore = parseInt(formData.bufferBefore, 10);
      if (isNaN(bufferBefore) || bufferBefore < 0) {
        errors.bufferBefore = 'Buffer before must be a non-negative number';
      }
    }

    if (formData.bufferAfter !== '' && formData.bufferAfter !== 0) {
      const bufferAfter = parseInt(formData.bufferAfter, 10);
      if (isNaN(bufferAfter) || bufferAfter < 0) {
        errors.bufferAfter = 'Buffer after must be a non-negative number';
      }
    }

    // Price validation (if provided)
    if (formData.price !== '' && formData.price !== undefined) {
      const price = parseFloat(formData.price);
      if (isNaN(price) || price < 0) {
        errors.price = 'Price must be a non-negative number';
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
      const serviceData = {
        ...(service && { id: service.id }),
        businessId: businessId,
        name: formData.name.trim(),
        durationMinutes: parseInt(formData.durationMinutes, 10),
        bufferBefore: parseInt(formData.bufferBefore, 10) || 0,
        bufferAfter: parseInt(formData.bufferAfter, 10) || 0,
        price: formData.price !== '' ? parseFloat(formData.price) : undefined,
        currency: formData.currency,
        capacity: parseInt(formData.capacity, 10),
        isActive: formData.isActive
      };

      // Use factory if creating new service
      const finalData = service ? serviceData : createService({ overrides: serviceData });

      await createOrUpdate(finalData);
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
      
    } catch (err) {
      console.error('Failed to save service:', err);
      // Error will be handled by the hook and displayed in UI
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {service ? 'Edit Service' : 'Add New Service'}
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
                {error.code === 'VALIDATION' ? error.message : 'Failed to save service. Please try again.'}
              </p>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Service Details</h3>
            
            {/* Service Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${
                  formErrors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Haircut, Manicure, Massage"
              />
              {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.durationMinutes}
                  onChange={(e) => handleInputChange('durationMinutes', parseInt(e.target.value, 10))}
                  className={`w-full px-3 py-2 border rounded-md ${
                    formErrors.durationMinutes ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  {durationOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {formErrors.durationMinutes && <p className="text-red-500 text-sm mt-1">{formErrors.durationMinutes}</p>}
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
                <p className="text-gray-500 text-xs mt-1">Maximum concurrent bookings for this service</p>
              </div>
            </div>

            {/* Buffer Times */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buffer Before (minutes)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.bufferBefore}
                  onChange={(e) => handleInputChange('bufferBefore', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md ${
                    formErrors.bufferBefore ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                />
                {formErrors.bufferBefore && <p className="text-red-500 text-sm mt-1">{formErrors.bufferBefore}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buffer After (minutes)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.bufferAfter}
                  onChange={(e) => handleInputChange('bufferAfter', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md ${
                    formErrors.bufferAfter ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                />
                {formErrors.bufferAfter && <p className="text-red-500 text-sm mt-1">{formErrors.bufferAfter}</p>}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Pricing (Optional)</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md ${
                    formErrors.price ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {formErrors.price && <p className="text-red-500 text-sm mt-1">{formErrors.price}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {currencyOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Service Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Status</h3>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                Service is active and available for booking
              </label>
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
              {isLoading ? 'Saving...' : service ? 'Update Service' : 'Create Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceForm;
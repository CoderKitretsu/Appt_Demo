import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ensureStorageReady } from '../services/storageFactory.js';
import storage from '../services/storageFactory.js';
import { createBusiness } from '../services/models/schemas.js';

const OnboardingPage = () => {
  const navigate = useNavigate();
  
  // Form state management
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Step 1: Business Details
  const [businessDetails, setBusinessDetails] = useState({
    name: '',
    timezone: '',
    locale: 'en-US',
    currency: 'USD'
  });

  // Step 2: Working Hours
  const [workingHours, setWorkingHours] = useState({
    monday: { enabled: true, from: '09:00', to: '17:00' },
    tuesday: { enabled: true, from: '09:00', to: '17:00' },
    wednesday: { enabled: true, from: '09:00', to: '17:00' },
    thursday: { enabled: true, from: '09:00', to: '17:00' },
    friday: { enabled: true, from: '09:00', to: '17:00' },
    saturday: { enabled: false, from: '09:00', to: '15:00' },
    sunday: { enabled: false, from: '10:00', to: '14:00' }
  });

  // Load saved progress from sessionStorage on mount
  useEffect(() => {
    try {
      const savedProgress = sessionStorage.getItem('onboarding_progress');
      if (savedProgress) {
        const { step, details, hours } = JSON.parse(savedProgress);
        setCurrentStep(step || 1);
        if (details) setBusinessDetails(prev => ({ ...prev, ...details }));
        if (hours) setWorkingHours(prev => ({ ...prev, ...hours }));
      }
    } catch (error) {
      console.warn('Could not restore onboarding progress:', error);
    }
  }, []);

  // Save progress to sessionStorage whenever state changes
  useEffect(() => {
    const progress = {
      step: currentStep,
      details: businessDetails,
      hours: workingHours
    };
    sessionStorage.setItem('onboarding_progress', JSON.stringify(progress));
  }, [currentStep, businessDetails, workingHours]);

  // Timezone options (kept simple as requested)
  const timezoneOptions = [
    { value: '', label: 'Select a timezone...' },
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'Asia/Kolkata', label: 'Asia/Kolkata (India Standard Time)' },
    { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
    { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
    { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT)' }
  ];

  // Weekday mapping for working hours
  const weekdays = [
    { key: 'monday', label: 'Monday', weekday: 1 },
    { key: 'tuesday', label: 'Tuesday', weekday: 2 },
    { key: 'wednesday', label: 'Wednesday', weekday: 3 },
    { key: 'thursday', label: 'Thursday', weekday: 4 },
    { key: 'friday', label: 'Friday', weekday: 5 },
    { key: 'saturday', label: 'Saturday', weekday: 6 },
    { key: 'sunday', label: 'Sunday', weekday: 0 }
  ];

  // Validation functions
  const validateStep1 = () => {
    const newErrors = {};
    
    if (!businessDetails.name.trim()) {
      newErrors.name = 'Business name is required';
    }
    
    if (!businessDetails.timezone) {
      newErrors.timezone = 'Please select a timezone';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    // Check that at least one day is enabled
    const enabledDays = Object.values(workingHours).filter(day => day.enabled);
    if (enabledDays.length === 0) {
      setErrors({ workingHours: 'Please select at least one working day' });
      return false;
    }

    // Validate time ranges for enabled days
    const timeErrors = {};
    Object.entries(workingHours).forEach(([day, schedule]) => {
      if (schedule.enabled) {
        if (schedule.from >= schedule.to) {
          timeErrors[day] = 'Start time must be before end time';
        }
      }
    });

    if (Object.keys(timeErrors).length > 0) {
      setErrors(timeErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  // Event handlers
  const handleBusinessDetailsChange = (field, value) => {
    setBusinessDetails(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear related errors
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleWorkingHoursChange = (day, field, value) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
    
    // Clear related errors
    if (errors[day] || errors.workingHours) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[day];
        delete newErrors.workingHours;
        return newErrors;
      });
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Ensure storage is ready
      await ensureStorageReady();

      // Convert working hours to the format expected by the storage adapter
      const defaultWorkingHours = weekdays
        .filter(({ key }) => workingHours[key].enabled)
        .map(({ key, weekday }) => ({
          weekday: weekday,
          from: workingHours[key].from,
          to: workingHours[key].to
        }));

      // Create business object using the factory
      const businessData = createBusiness({
        overrides: {
          name: businessDetails.name.trim(),
          timezone: businessDetails.timezone,
          locale: businessDetails.locale,
          currency: businessDetails.currency,
          defaultBufferBefore: 10, // Default 10 minutes before
          defaultBufferAfter: 15,  // Default 15 minutes after
          defaultWorkingHours: defaultWorkingHours
        }
      });

      // Save to storage
      const savedBusiness = await storage.upsertBusiness(businessData);
      
      console.log('✅ Business created successfully:', savedBusiness);
      
      // Clear onboarding progress
      sessionStorage.removeItem('onboarding_progress');
      
      // Show success message
      alert(`✅ Welcome to your new business!\n\n${savedBusiness.name} has been set up successfully.`);
      
      // Redirect to dashboard
      navigate('/dashboard');
      
    } catch (error) {
      console.error('❌ Failed to create business:', error);
      
      // Show user-friendly error message
      let errorMessage = 'Failed to create business. Please try again.';
      if (error.code === 'VALIDATION') {
        errorMessage = 'Please check your business information and try again.';
      } else if (error.code === 'SYSTEM') {
        errorMessage = 'System error occurred. Please refresh the page and try again.';
      }
      
      alert(`❌ ${errorMessage}\n\nError details: ${error.message}`);
      
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render functions for each step
  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold mb-4">Business Details</h3>
      
      {/* Business Name */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Business Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={businessDetails.name}
          onChange={(e) => handleBusinessDetailsChange('name', e.target.value)}
          placeholder="Enter your business name"
          className={`w-full p-3 border rounded-md ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>

      {/* Timezone */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Timezone <span className="text-red-500">*</span>
        </label>
        <select
          value={businessDetails.timezone}
          onChange={(e) => handleBusinessDetailsChange('timezone', e.target.value)}
          className={`w-full p-3 border rounded-md ${errors.timezone ? 'border-red-500' : 'border-gray-300'}`}
        >
          {timezoneOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.timezone && <p className="text-red-500 text-sm mt-1">{errors.timezone}</p>}
      </div>

      {/* Locale */}
      <div>
        <label className="block text-sm font-medium mb-2">Locale</label>
        <input
          type="text"
          value={businessDetails.locale}
          onChange={(e) => handleBusinessDetailsChange('locale', e.target.value)}
          placeholder="e.g., en-US, en-GB, es-ES"
          className="w-full p-3 border border-gray-300 rounded-md"
        />
      </div>

      {/* Currency */}
      <div>
        <label className="block text-sm font-medium mb-2">Currency</label>
        <select
          value={businessDetails.currency}
          onChange={(e) => handleBusinessDetailsChange('currency', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md"
        >
          <option value="USD">USD - US Dollar</option>
          <option value="EUR">EUR - Euro</option>
          <option value="GBP">GBP - British Pound</option>
          <option value="INR">INR - Indian Rupee</option>
          <option value="CAD">CAD - Canadian Dollar</option>
        </select>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold mb-4">Default Working Hours</h3>
      
      {errors.workingHours && (
        <p className="text-red-500 text-sm mb-4">{errors.workingHours}</p>
      )}
      
      <div className="space-y-4">
        {weekdays.map(({ key, label }) => (
          <div key={key} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-md">
            <div className="flex items-center space-x-2 w-32">
              <input
                type="checkbox"
                checked={workingHours[key].enabled}
                onChange={(e) => handleWorkingHoursChange(key, 'enabled', e.target.checked)}
                className="w-4 h-4"
              />
              <label className="text-sm font-medium">{label}</label>
            </div>
            
            {workingHours[key].enabled && (
              <div className="flex items-center space-x-2 flex-1">
                <label className="text-sm">From:</label>
                <input
                  type="time"
                  value={workingHours[key].from}
                  onChange={(e) => handleWorkingHoursChange(key, 'from', e.target.value)}
                  className="p-2 border border-gray-300 rounded"
                />
                <label className="text-sm">To:</label>
                <input
                  type="time"
                  value={workingHours[key].to}
                  onChange={(e) => handleWorkingHoursChange(key, 'to', e.target.value)}
                  className="p-2 border border-gray-300 rounded"
                />
              </div>
            )}
            
            {errors[key] && (
              <p className="text-red-500 text-sm">{errors[key]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold mb-4">Review & Save</h3>
      
      <div className="bg-gray-50 p-4 rounded-md space-y-4">
        <h4 className="font-semibold">Business Information</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><strong>Name:</strong> {businessDetails.name}</div>
          <div><strong>Timezone:</strong> {businessDetails.timezone}</div>
          <div><strong>Locale:</strong> {businessDetails.locale}</div>
          <div><strong>Currency:</strong> {businessDetails.currency}</div>
        </div>
        
        <h4 className="font-semibold">Working Hours</h4>
        <div className="text-sm">
          {weekdays
            .filter(({ key }) => workingHours[key].enabled)
            .map(({ key, label }) => (
              <div key={key}>
                <strong>{label}:</strong> {workingHours[key].from} - {workingHours[key].to}
              </div>
            ))}
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>Ready to get started?</strong><br />
          Your business will be created with these settings. You can always modify them later in the settings page.
        </p>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome! Let's set up your business</h1>
        <p className="text-gray-600">Complete these steps to get your appointment booking system ready.</p>
      </div>

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${
                currentStep >= step
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Business Details</span>
          <span>Working Hours</span>
          <span>Review & Save</span>
        </div>
      </div>

      {/* Step content */}
      <div className="mb-8">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <button
          onClick={handlePrevStep}
          disabled={currentStep === 1}
          className={`px-6 py-2 rounded-md font-medium ${
            currentStep === 1
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
          }`}
        >
          Previous
        </button>

        {currentStep < 3 ? (
          <button
            onClick={handleNextStep}
            className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-6 py-2 rounded-md font-medium ${
              isSubmitting
                ? 'bg-blue-400 text-white cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isSubmitting ? 'Creating Business...' : 'Save & Continue'}
          </button>
        )}
      </div>

      {/* Development helper */}
      {import.meta.env.MODE === 'development' && (
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h4 className="text-sm font-semibold text-yellow-800 mb-2">Development Info</h4>
          <p className="text-xs text-yellow-700">
            Current Step: {currentStep} | 
            Progress saved to sessionStorage |
            Refresh to test persistence
          </p>
        </div>
      )}
    </div>
  );
};

export default OnboardingPage;
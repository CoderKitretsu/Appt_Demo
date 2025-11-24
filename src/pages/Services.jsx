import React, { useState, useEffect } from 'react';
import ServiceList from '../features/services/components/ServiceList.jsx';
import ServiceForm from '../features/services/components/ServiceForm.jsx';
import { ensureStorageReady } from '../services/storageFactory.js';
import storage from '../services/storageFactory.js';

/**
 * Services - Main page for managing services
 * Displays list of services and provides create/edit functionality
 */
const Services = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [businessId, setBusinessId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshServiceList, setRefreshServiceList] = useState(null);

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

  // Handle create new service
  const handleCreateNew = () => {
    setEditingService(null);
    setIsFormOpen(true);
  };

  // Handle edit service
  const handleEdit = (service) => {
    setEditingService(service);
    setIsFormOpen(true);
  };

  // Handle form close
  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingService(null);
  };

  // Handle successful save
  const handleSuccess = () => {
    // Refresh the service list
    if (refreshServiceList) {
      refreshServiceList();
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
            You need to complete your business setup before managing services.
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Services</h1>
            <p className="text-gray-600">
              Manage your service catalog, pricing, and scheduling details.
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
          >
            + Add Service
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Services</p>
              <p className="text-2xl font-semibold text-gray-900" id="total-services-count">-</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Services</p>
              <p className="text-2xl font-semibold text-gray-900" id="active-services-count">-</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Duration</p>
              <p className="text-2xl font-semibold text-gray-900" id="avg-duration">-</p>
            </div>
          </div>
        </div>
      </div>

      {/* Service List */}
      <ServiceList
        businessId={businessId}
        onEdit={handleEdit}
        onRefresh={(refreshFn) => {
          setRefreshServiceList(() => refreshFn);
          // Update stats when services change
          setTimeout(() => updateStats(), 100);
        }}
      />

      {/* Service Form Modal */}
      <ServiceForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        service={editingService}
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
            <p><strong>Editing:</strong> {editingService ? editingService.name : 'None'}</p>
          </div>
        </div>
      )}
    </div>
  );

  // Helper function to update stats (called after services load)
  function updateStats() {
    setTimeout(async () => {
      try {
        const services = await storage.listServices(businessId);
        const activeServices = services.filter(s => s.isActive !== false);
        const avgDuration = services.length > 0 
          ? Math.round(services.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) / services.length)
          : 0;

        // Update stat counters
        const totalElement = document.getElementById('total-services-count');
        const activeElement = document.getElementById('active-services-count');
        const durationElement = document.getElementById('avg-duration');

        if (totalElement) totalElement.textContent = services.length.toString();
        if (activeElement) activeElement.textContent = activeServices.length.toString();
        if (durationElement) durationElement.textContent = avgDuration > 0 ? `${avgDuration}m` : '-';
      } catch (error) {
        console.error('Failed to update stats:', error);
      }
    }, 100);
  }
};

export default Services;
import React, { useState, useEffect } from 'react';
import useServices from '../hooks/useServices.js';

/**
 * ServiceList - Displays a table of services for the business
 * @param {string} businessId - The business ID to load services for
 * @param {function} onEdit - Callback when edit button is clicked
 * @param {function} onRefresh - Callback to refresh the list (optional)
 */
const ServiceList = ({ businessId, onEdit, onRefresh }) => {
  const { list, remove, isLoading, error, clearError } = useServices();
  const [services, setServices] = useState([]);
  const [isDeleting, setIsDeleting] = useState(null);

  // Load services on component mount and when businessId changes
  const loadServices = async () => {
    if (!businessId) return;
    
    try {
      clearError();
      const serviceList = await list(businessId);
      setServices(serviceList || []);
    } catch (err) {
      console.error('Failed to load services:', err);
    }
  };

  useEffect(() => {
    loadServices();
  }, [businessId]);

  // Expose refresh function to parent
  useEffect(() => {
    if (onRefresh) {
      onRefresh(loadServices);
    }
  }, [onRefresh]);

  // Handle delete with confirmation
  const handleDelete = async (service) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${service.name}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;

    setIsDeleting(service.id);
    try {
      await remove(service.id);
      await loadServices(); // Refresh the list
    } catch (err) {
      alert(`Failed to delete service: ${err.message}`);
    } finally {
      setIsDeleting(null);
    }
  };

  // Format price for display
  const formatPrice = (price, currency) => {
    if (price === undefined || price === null) return '-';
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD'
      }).format(price);
    } catch {
      return `${currency || '$'}${price}`;
    }
  };

  // Format duration for display
  const formatDuration = (minutes) => {
    if (!minutes) return '-';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}m`;
    }
  };

  // Error display
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
        <h3 className="text-red-800 font-semibold mb-2">Error Loading Services</h3>
        <p className="text-red-700 mb-2">{error.message}</p>
        <button
          onClick={loadServices}
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
        <div className="text-gray-600">Loading services...</div>
      </div>
    );
  }

  // Empty state
  if (services.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 border border-gray-200 rounded-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Services</h3>
        <p className="text-gray-600 mb-4">
          You haven't added any services yet. Add your first service to get started.
        </p>
        <button
          onClick={loadServices}
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
          Services ({services.length})
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Capacity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Buffer Times
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {services.map((service) => (
              <tr key={service.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{service.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDuration(service.durationMinutes)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatPrice(service.price, service.currency)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {service.capacity || 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="text-xs">
                    {service.bufferBefore > 0 && <div>Before: {service.bufferBefore}m</div>}
                    {service.bufferAfter > 0 && <div>After: {service.bufferAfter}m</div>}
                    {!service.bufferBefore && !service.bufferAfter && '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    service.isActive !== false 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {service.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => onEdit(service)}
                    className="text-blue-600 hover:text-blue-900 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(service)}
                    disabled={isDeleting === service.id}
                    className={`text-red-600 hover:text-red-900 hover:underline ${
                      isDeleting === service.id ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isDeleting === service.id ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>Showing {services.length} service{services.length !== 1 ? 's' : ''}</span>
          <button
            onClick={loadServices}
            className="text-blue-600 hover:text-blue-900 hover:underline"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceList;
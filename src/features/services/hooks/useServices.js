import { useState, useCallback } from 'react';
import storage from '../../../services/storageFactory.js';

/**
 * Custom hook for service management
 * Provides CRUD operations for services using storage adapter
 */
export const useServices = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * List all services for a business
   * @param {string} businessId - Business ID to filter by
   * @returns {Promise<Array>} Array of service objects
   */
  const list = useCallback(async (businessId) => {
    if (!businessId) {
      throw new Error('Business ID is required');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const services = await storage.listServices(businessId);
      return services;
    } catch (err) {
      console.error('❌ Failed to list services:', err);
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get a specific service by ID
   * @param {string} serviceId - Service ID
   * @returns {Promise<object>} Service object
   */
  const get = useCallback(async (serviceId) => {
    if (!serviceId) {
      throw new Error('Service ID is required');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const service = await storage.getService(serviceId);
      return service;
    } catch (err) {
      console.error('❌ Failed to get service:', err);
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create or update a service
   * @param {object} serviceObj - Service data
   * @returns {Promise<object>} Saved service object
   */
  const createOrUpdate = useCallback(async (serviceObj) => {
    if (!serviceObj) {
      throw new Error('Service data is required');
    }

    // Basic validation
    if (!serviceObj.name?.trim()) {
      const error = new Error('Service name is required');
      error.code = 'VALIDATION';
      throw error;
    }

    if (!serviceObj.businessId) {
      const error = new Error('Business ID is required');
      error.code = 'VALIDATION';
      throw error;
    }

    // Validate duration
    const duration = parseInt(serviceObj.durationMinutes, 10);
    if (isNaN(duration) || duration <= 0) {
      const error = new Error('Duration must be a positive number greater than 0');
      error.code = 'VALIDATION';
      throw error;
    }
    serviceObj.durationMinutes = duration;

    // Validate capacity
    if (serviceObj.capacity !== undefined) {
      const capacity = parseInt(serviceObj.capacity, 10);
      if (isNaN(capacity) || capacity <= 0) {
        const error = new Error('Capacity must be a positive integer greater than 0');
        error.code = 'VALIDATION';
        throw error;
      }
      serviceObj.capacity = capacity;
    }

    // Validate buffer times (if provided)
    if (serviceObj.bufferBefore !== undefined && serviceObj.bufferBefore !== '') {
      const bufferBefore = parseInt(serviceObj.bufferBefore, 10);
      if (isNaN(bufferBefore) || bufferBefore < 0) {
        const error = new Error('Buffer before must be a non-negative number');
        error.code = 'VALIDATION';
        throw error;
      }
      serviceObj.bufferBefore = bufferBefore;
    }

    if (serviceObj.bufferAfter !== undefined && serviceObj.bufferAfter !== '') {
      const bufferAfter = parseInt(serviceObj.bufferAfter, 10);
      if (isNaN(bufferAfter) || bufferAfter < 0) {
        const error = new Error('Buffer after must be a non-negative number');
        error.code = 'VALIDATION';
        throw error;
      }
      serviceObj.bufferAfter = bufferAfter;
    }

    // Validate price (if provided)
    if (serviceObj.price !== undefined && serviceObj.price !== '') {
      const price = parseFloat(serviceObj.price);
      if (isNaN(price) || price < 0) {
        const error = new Error('Price must be a non-negative number');
        error.code = 'VALIDATION';
        throw error;
      }
      serviceObj.price = price;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const savedService = await storage.upsertService(serviceObj);
      console.log('✅ Service saved:', savedService);
      return savedService;
    } catch (err) {
      console.error('❌ Failed to save service:', err);
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Delete a service
   * @param {string} serviceId - Service ID to delete
   * @returns {Promise<boolean>} Success status
   */
  const remove = useCallback(async (serviceId) => {
    if (!serviceId) {
      throw new Error('Service ID is required');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      await storage.deleteService(serviceId);
      console.log('✅ Service deleted:', serviceId);
      return true;
    } catch (err) {
      console.error('❌ Failed to delete service:', err);
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

export default useServices;
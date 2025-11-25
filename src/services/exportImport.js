/**
 * Export and Import functionality for the appointment system
 * Handles JSON export/import with validation and error handling
 */

/**
 * Export all data from storage and trigger download as JSON file
 * @param {Object} storage - Storage adapter instance
 * @returns {Promise<boolean>} Success status
 */
export async function exportStore(storage) {
  try {
    console.log('🔄 Starting data export...');
    
    // Get all data from storage
    const exportData = await storage.exportAll();
    
    // Add export metadata
    const exportPackage = {
      ...exportData,
      exportInfo: {
        exportedAt: new Date().toISOString(),
        exportVersion: '1.0',
        source: 'AppointmentPro Admin',
        format: 'json'
      }
    };
    
    // Create JSON string with pretty formatting
    const jsonString = JSON.stringify(exportPackage, null, 2);
    
    // Create timestamp for filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `appt_store_export_${timestamp}.json`;
    
    // Create blob and trigger download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create temporary download link
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = filename;
    downloadLink.style.display = 'none';
    
    // Trigger download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Cleanup
    URL.revokeObjectURL(url);
    
    console.log(`✅ Export completed: ${filename}`);
    console.log(`📊 Export stats:`, {
      businesses: Object.keys(exportData.businesses || {}).length,
      teamMembers: Object.keys(exportData.team_members || {}).length,
      services: Object.keys(exportData.services || {}).length,
      appointments: Object.keys(exportData.appointments || {}).length,
      auditLogs: Object.keys(exportData.audit_logs || {}).length
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Export failed:', error);
    const exportError = new Error(`Export failed: ${error.message}`);
    exportError.code = 'EXPORT_FAILED';
    exportError.originalError = error;
    throw exportError;
  }
}

/**
 * Import data from JSON file into storage
 * @param {File} file - File object from file input
 * @param {Object} storage - Storage adapter instance
 * @param {Object} options - Import options
 * @param {boolean} options.merge - Whether to merge with existing data (default: false)
 * @param {boolean} options.validate - Whether to validate import data (default: true)
 * @returns {Promise<Object>} Import result with success status and details
 */
export async function importStore(file, storage, options = {}) {
  const { merge = false, validate = true } = options;
  
  try {
    console.log('🔄 Starting data import...');
    console.log(`📁 File: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.json')) {
      throw new Error('Invalid file type. Please select a JSON file.');
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File too large. Maximum size is 10MB.');
    }
    
    // Read file content
    const fileContent = await readFileAsText(file);
    
    // Parse JSON
    let importData;
    try {
      importData = JSON.parse(fileContent);
    } catch (parseError) {
      throw new Error(`Invalid JSON format: ${parseError.message}`);
    }
    
    // Validate import data structure if requested
    if (validate) {
      const validationResult = validateImportData(importData);
      if (!validationResult.valid) {
        throw new Error(`Invalid import data: ${validationResult.errors.join(', ')}`);
      }
    }
    
    // Extract core data (remove export metadata if present)
    const coreData = {
      meta: importData.meta,
      businesses: importData.businesses || {},
      departments: importData.departments || {},
      team_members: importData.team_members || {},
      services: importData.services || {},
      availabilities: importData.availabilities || {},
      appointments: importData.appointments || {},
      audit_logs: importData.audit_logs || {}
    };
    
    // Perform import through storage adapter
    const importResult = await storage.importAll(coreData, { merge });
    
    // Log import statistics
    console.log(`✅ Import completed successfully`);
    console.log(`📊 Import stats:`, {
      mode: merge ? 'merge' : 'replace',
      businesses: Object.keys(coreData.businesses).length,
      teamMembers: Object.keys(coreData.team_members).length,
      services: Object.keys(coreData.services).length,
      appointments: Object.keys(coreData.appointments).length,
      auditLogs: Object.keys(coreData.audit_logs).length,
      warnings: importResult.warnings?.length || 0
    });
    
    return {
      success: true,
      message: `Import completed successfully. ${merge ? 'Data merged' : 'Data replaced'} with imported content.`,
      stats: {
        businesses: Object.keys(coreData.businesses).length,
        teamMembers: Object.keys(coreData.team_members).length,
        services: Object.keys(coreData.services).length,
        appointments: Object.keys(coreData.appointments).length,
        auditLogs: Object.keys(coreData.audit_logs).length
      },
      warnings: importResult.warnings || [],
      mode: merge ? 'merge' : 'replace'
    };
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    
    // Create structured error response
    const importError = new Error(error.message || 'Import failed');
    importError.code = error.code || 'IMPORT_FAILED';
    importError.originalError = error;
    
    return {
      success: false,
      message: `Import failed: ${error.message}`,
      error: importError
    };
  }
}

/**
 * Read file as text using FileReader API
 * @param {File} file - File to read
 * @returns {Promise<string>} File content as text
 */
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      resolve(event.target.result);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Validate import data structure
 * @param {Object} data - Import data to validate
 * @returns {Object} Validation result with valid flag and errors array
 */
function validateImportData(data) {
  const errors = [];
  
  // Check if data is an object
  if (!data || typeof data !== 'object') {
    errors.push('Import data must be a valid object');
    return { valid: false, errors };
  }
  
  // Check for required top-level keys
  const requiredKeys = ['meta'];
  const optionalKeys = ['businesses', 'departments', 'team_members', 'services', 'availabilities', 'appointments', 'audit_logs'];
  const expectedKeys = [...requiredKeys, ...optionalKeys, 'exportInfo']; // exportInfo is from export metadata
  
  // Validate required keys
  for (const key of requiredKeys) {
    if (!(key in data)) {
      errors.push(`Missing required key: ${key}`);
    }
  }
  
  // Check for unexpected keys (warn but don't fail)
  const actualKeys = Object.keys(data);
  const unexpectedKeys = actualKeys.filter(key => !expectedKeys.includes(key));
  if (unexpectedKeys.length > 0) {
    console.warn('⚠️ Unexpected keys in import data:', unexpectedKeys);
  }
  
  // Validate meta structure
  if (data.meta && typeof data.meta === 'object') {
    if (!data.meta.version) {
      errors.push('Meta object missing version field');
    }
  } else if (data.meta !== undefined) {
    errors.push('Meta must be an object');
  }
  
  // Validate that data collections are objects
  for (const key of optionalKeys) {
    if (data[key] !== undefined && typeof data[key] !== 'object') {
      errors.push(`${key} must be an object`);
    }
  }
  
  // Additional validation for critical data
  if (data.businesses) {
    for (const [id, business] of Object.entries(data.businesses)) {
      if (!business.name || !business.timezone) {
        errors.push(`Business ${id} missing required fields (name, timezone)`);
      }
    }
  }
  
  if (data.appointments) {
    for (const [id, appointment] of Object.entries(data.appointments)) {
      if (!appointment.startUTC || !appointment.endUTC || !appointment.serviceId) {
        errors.push(`Appointment ${id} missing required fields (startUTC, endUTC, serviceId)`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get import/export statistics from storage
 * @param {Object} storage - Storage adapter instance
 * @returns {Promise<Object>} Statistics object
 */
export async function getStorageStats(storage) {
  try {
    const data = await storage.exportAll();
    
    return {
      businesses: Object.keys(data.businesses || {}).length,
      departments: Object.keys(data.departments || {}).length,
      teamMembers: Object.keys(data.team_members || {}).length,
      services: Object.keys(data.services || {}).length,
      availabilities: Object.keys(data.availabilities || {}).length,
      appointments: Object.keys(data.appointments || {}).length,
      auditLogs: Object.keys(data.audit_logs || {}).length,
      lastUpdated: data.meta?.updatedAt || 'Unknown'
    };
  } catch (error) {
    console.error('Failed to get storage stats:', error);
    return null;
  }
}

/**
 * Clear all data from storage (dangerous operation)
 * @param {Object} storage - Storage adapter instance
 * @returns {Promise<boolean>} Success status
 */
export async function clearAllData(storage) {
  try {
    console.log('🗑️ Clearing all data...');
    
    // Create empty data structure
    const emptyData = {
      meta: {
        version: 1,
        updatedAt: new Date().toISOString(),
        businessId: null
      },
      businesses: {},
      departments: {},
      team_members: {},
      services: {},
      availabilities: {},
      appointments: {},
      audit_logs: {}
    };
    
    // Import empty data (replace mode)
    await storage.importAll(emptyData, { merge: false });
    
    console.log('✅ All data cleared successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to clear data:', error);
    throw error;
  }
}
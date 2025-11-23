/**
 * LocalStorageAdapter - MVP Implementation
 * 
 * Implements the StorageAdapter contract using browser localStorage.
 * This adapter provides full CRUD operations with conflict detection
 * for appointment booking and proper error handling.
 * 
 * Key Features:
 * - UUID v4 generation for primary keys
 * - Atomic appointment conflict checking with advisory locking
 * - ISO UTC timestamp handling
 * - Schema versioning with migration support
 * - Full data export/import capabilities
 * - Audit logging support
 */

// Minimal UUID v4 generator (inline implementation)
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper function to deep clone objects
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Helper function to validate required fields
function validateRequired(obj, fields, entityType) {
  for (const field of fields) {
    if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
      const error = new Error(`${field} is required for ${entityType}`);
      error.code = 'VALIDATION';
      throw error;
    }
  }
}

// Helper function to check if two time ranges overlap
function timeRangesOverlap(start1, end1, start2, end2) {
  const s1 = new Date(start1).getTime();
  const e1 = new Date(end1).getTime();
  const s2 = new Date(start2).getTime();
  const e2 = new Date(end2).getTime();
  
  return s1 < e2 && s2 < e1;
}

// Local Storage key constants
const STORAGE_KEYS = {
  META: 'appt_store_meta',
  BUSINESSES: 'businesses',
  DEPARTMENTS: 'departments', 
  TEAM_MEMBERS: 'team_members',
  SERVICES: 'services',
  AVAILABILITIES: 'availabilities',
  APPOINTMENTS: 'appointments',
  AUDIT_LOGS: 'audit_logs',
  LOCK: 'appt_lock'
};

const LocalStorageAdapter = {
  /**
   * Initialize the storage adapter and run migrations
   */
  async init() {
    try {
      // Initialize metadata if not present
      let meta = this._getFromStorage(STORAGE_KEYS.META);
      if (!meta) {
        meta = {
          version: 1,
          updatedAt: new Date().toISOString(),
          businessId: null
        };
        this._setInStorage(STORAGE_KEYS.META, meta);
      }

      // Ensure all storage keys exist
      const requiredKeys = [
        STORAGE_KEYS.BUSINESSES,
        STORAGE_KEYS.DEPARTMENTS,
        STORAGE_KEYS.TEAM_MEMBERS,
        STORAGE_KEYS.SERVICES,
        STORAGE_KEYS.AVAILABILITIES,
        STORAGE_KEYS.APPOINTMENTS,
        STORAGE_KEYS.AUDIT_LOGS
      ];

      for (const key of requiredKeys) {
        if (!this._getFromStorage(key)) {
          this._setInStorage(key, {});
        }
      }

      // Run migrations
      await this._runMigrations(meta.version);

      console.log('LocalStorageAdapter initialized successfully');
    } catch (error) {
      const systemError = new Error('Failed to initialize storage adapter');
      systemError.code = 'SYSTEM';
      systemError.originalError = error;
      throw systemError;
    }
  },

  /**
   * Run database migrations (stub for v1)
   */
  async _runMigrations(currentVersion) {
    // Migration runner - currently v1 only, no migrations needed
    if (currentVersion === 1) {
      // No migrations for v1
      return;
    }
    
    // Future migrations would go here:
    // if (currentVersion < 2) { ... }
    console.log(`Migrations complete. Current version: ${currentVersion}`);
  },

  /**
   * Advisory locking mechanism for atomic operations
   */
  _acquireLock() {
    const lockId = uuid();
    const lockData = {
      owner: lockId,
      ts: Date.now()
    };

    // Check for existing lock
    const existingLock = this._getFromStorage(STORAGE_KEYS.LOCK);
    if (existingLock) {
      const age = Date.now() - existingLock.ts;
      if (age < 2000) { // Lock is fresh, wait
        const error = new Error('Storage is temporarily locked');
        error.code = 'CONFLICT';
        throw error;
      }
      // Lock is stale, we can proceed
    }

    this._setInStorage(STORAGE_KEYS.LOCK, lockData);
    return lockId;
  },

  _releaseLock() {
    localStorage.removeItem(STORAGE_KEYS.LOCK);
  },

  /**
   * Internal storage helpers
   */
  _getFromStorage(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from localStorage key ${key}:`, error);
      return null;
    }
  },

  _setInStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      const systemError = new Error('Failed to write to localStorage');
      systemError.code = 'SYSTEM';
      systemError.originalError = error;
      throw systemError;
    }
  },

  // ========================================
  // BUSINESS METHODS
  // ========================================

  async getBusiness(businessId) {
    validateRequired({ businessId }, ['businessId'], 'getBusiness');
    
    const businesses = this._getFromStorage(STORAGE_KEYS.BUSINESSES) || {};
    const business = businesses[businessId];
    
    return business ? deepClone(business) : null;
  },

  async upsertBusiness(businessObj) {
    validateRequired(businessObj, ['name', 'timezone'], 'business');
    
    const businesses = this._getFromStorage(STORAGE_KEYS.BUSINESSES) || {};
    const now = new Date().toISOString();
    
    const business = {
      id: businessObj.id || uuid(),
      name: businessObj.name,
      timezone: businessObj.timezone,
      currency: businessObj.currency || 'USD',
      locale: businessObj.locale || 'en-US',
      defaultBufferBefore: businessObj.defaultBufferBefore || 0,
      defaultBufferAfter: businessObj.defaultBufferAfter || 0,
      createdAt: businessObj.createdAt || now,
      updatedAt: now,
      ...businessObj // Allow additional fields
    };

    businesses[business.id] = business;
    this._setInStorage(STORAGE_KEYS.BUSINESSES, businesses);

    // Update metadata
    const meta = this._getFromStorage(STORAGE_KEYS.META);
    meta.businessId = business.id;
    meta.updatedAt = now;
    this._setInStorage(STORAGE_KEYS.META, meta);

    return deepClone(business);
  },

  // ========================================
  // TEAM MEMBER METHODS
  // ========================================

  async listTeamMembers(businessId, filters = {}) {
    validateRequired({ businessId }, ['businessId'], 'listTeamMembers');
    
    const teamMembers = this._getFromStorage(STORAGE_KEYS.TEAM_MEMBERS) || {};
    let members = Object.values(teamMembers).filter(member => member.businessId === businessId);

    // Apply filters
    if (filters.role) {
      members = members.filter(member => member.role === filters.role);
    }
    if (filters.isActive !== undefined) {
      members = members.filter(member => member.isActive === filters.isActive);
    }

    return members.map(member => deepClone(member));
  },

  async getTeamMember(teamMemberId) {
    validateRequired({ teamMemberId }, ['teamMemberId'], 'getTeamMember');
    
    const teamMembers = this._getFromStorage(STORAGE_KEYS.TEAM_MEMBERS) || {};
    const member = teamMembers[teamMemberId];
    
    return member ? deepClone(member) : null;
  },

  async upsertTeamMember(teamMemberObj) {
    validateRequired(teamMemberObj, ['businessId', 'name'], 'team member');
    
    const teamMembers = this._getFromStorage(STORAGE_KEYS.TEAM_MEMBERS) || {};
    const now = new Date().toISOString();
    
    const member = {
      id: teamMemberObj.id || uuid(),
      businessId: teamMemberObj.businessId,
      name: teamMemberObj.name,
      email: teamMemberObj.email || '',
      phone: teamMemberObj.phone || '',
      role: teamMemberObj.role || 'staff',
      skills: teamMemberObj.skills || [],
      defaultWorkingHours: teamMemberObj.defaultWorkingHours || [],
      capacity: teamMemberObj.capacity || 1,
      isActive: teamMemberObj.isActive !== undefined ? teamMemberObj.isActive : true,
      createdAt: teamMemberObj.createdAt || now,
      updatedAt: now
    };

    // Validate capacity
    if (member.capacity < 1 || !Number.isInteger(member.capacity)) {
      const error = new Error('Capacity must be a positive integer');
      error.code = 'VALIDATION';
      throw error;
    }

    teamMembers[member.id] = member;
    this._setInStorage(STORAGE_KEYS.TEAM_MEMBERS, teamMembers);

    return deepClone(member);
  },

  async deleteTeamMember(teamMemberId) {
    validateRequired({ teamMemberId }, ['teamMemberId'], 'deleteTeamMember');
    
    // Check for future appointments
    const appointments = this._getFromStorage(STORAGE_KEYS.APPOINTMENTS) || {};
    const now = new Date().toISOString();
    const futureAppointments = Object.values(appointments).filter(
      appt => appt.teamMemberId === teamMemberId && appt.startUTC > now
    );

    if (futureAppointments.length > 0) {
      const error = new Error('Cannot delete team member with future appointments');
      error.code = 'CONFLICT';
      throw error;
    }

    const teamMembers = this._getFromStorage(STORAGE_KEYS.TEAM_MEMBERS) || {};
    const existed = !!teamMembers[teamMemberId];
    
    if (existed) {
      delete teamMembers[teamMemberId];
      this._setInStorage(STORAGE_KEYS.TEAM_MEMBERS, teamMembers);
    }

    return existed;
  },

  // ========================================
  // SERVICE METHODS
  // ========================================

  async listServices(businessId) {
    validateRequired({ businessId }, ['businessId'], 'listServices');
    
    const services = this._getFromStorage(STORAGE_KEYS.SERVICES) || {};
    const businessServices = Object.values(services).filter(service => service.businessId === businessId);
    
    return businessServices.map(service => deepClone(service));
  },

  async getService(serviceId) {
    validateRequired({ serviceId }, ['serviceId'], 'getService');
    
    const services = this._getFromStorage(STORAGE_KEYS.SERVICES) || {};
    const service = services[serviceId];
    
    return service ? deepClone(service) : null;
  },

  async upsertService(serviceObj) {
    validateRequired(serviceObj, ['businessId', 'name', 'durationMinutes'], 'service');
    
    if (serviceObj.durationMinutes <= 0 || !Number.isInteger(serviceObj.durationMinutes)) {
      const error = new Error('durationMinutes must be a positive integer');
      error.code = 'VALIDATION';
      throw error;
    }

    const services = this._getFromStorage(STORAGE_KEYS.SERVICES) || {};
    const now = new Date().toISOString();
    
    const service = {
      id: serviceObj.id || uuid(),
      businessId: serviceObj.businessId,
      name: serviceObj.name,
      durationMinutes: serviceObj.durationMinutes,
      price: serviceObj.price || 0,
      currency: serviceObj.currency || 'USD',
      bufferBefore: serviceObj.bufferBefore || 0,
      bufferAfter: serviceObj.bufferAfter || 0,
      capacity: serviceObj.capacity || 1,
      isActive: serviceObj.isActive !== undefined ? serviceObj.isActive : true,
      createdAt: serviceObj.createdAt || now,
      updatedAt: now
    };

    services[service.id] = service;
    this._setInStorage(STORAGE_KEYS.SERVICES, services);

    return deepClone(service);
  },

  async deleteService(serviceId) {
    validateRequired({ serviceId }, ['serviceId'], 'deleteService');
    
    // Check for future appointments
    const appointments = this._getFromStorage(STORAGE_KEYS.APPOINTMENTS) || {};
    const now = new Date().toISOString();
    const futureAppointments = Object.values(appointments).filter(
      appt => appt.serviceId === serviceId && appt.startUTC > now
    );

    if (futureAppointments.length > 0) {
      const error = new Error('Cannot delete service with future appointments');
      error.code = 'CONFLICT';
      throw error;
    }

    const services = this._getFromStorage(STORAGE_KEYS.SERVICES) || {};
    const existed = !!services[serviceId];
    
    if (existed) {
      delete services[serviceId];
      this._setInStorage(STORAGE_KEYS.SERVICES, services);
    }

    return existed;
  },

  // ========================================
  // AVAILABILITY METHODS
  // ========================================

  async listAvailabilities(entityType, entityId, fromUTC, toUTC) {
    validateRequired({ entityType, entityId, fromUTC, toUTC }, 
                    ['entityType', 'entityId', 'fromUTC', 'toUTC'], 'listAvailabilities');
    
    const availabilities = this._getFromStorage(STORAGE_KEYS.AVAILABILITIES) || {};
    const filtered = Object.values(availabilities).filter(av => 
      av.entityType === entityType &&
      av.entityId === entityId &&
      timeRangesOverlap(av.startUTC, av.endUTC, fromUTC, toUTC)
    );

    return filtered.map(av => deepClone(av));
  },

  async createAvailability(avObj) {
    validateRequired(avObj, ['entityType', 'entityId', 'startUTC', 'endUTC'], 'availability');
    
    const availabilities = this._getFromStorage(STORAGE_KEYS.AVAILABILITIES) || {};
    const now = new Date().toISOString();
    
    const availability = {
      id: uuid(),
      entityType: avObj.entityType,
      entityId: avObj.entityId,
      startUTC: avObj.startUTC,
      endUTC: avObj.endUTC,
      type: avObj.type || 'unavailable',
      notes: avObj.notes || '',
      createdAt: now
    };

    availabilities[availability.id] = availability;
    this._setInStorage(STORAGE_KEYS.AVAILABILITIES, availabilities);

    return deepClone(availability);
  },

  async deleteAvailability(availId) {
    validateRequired({ availId }, ['availId'], 'deleteAvailability');
    
    const availabilities = this._getFromStorage(STORAGE_KEYS.AVAILABILITIES) || {};
    const existed = !!availabilities[availId];
    
    if (existed) {
      delete availabilities[availId];
      this._setInStorage(STORAGE_KEYS.AVAILABILITIES, availabilities);
    }

    return existed;
  },

  // ========================================
  // APPOINTMENT METHODS (CRITICAL SECTION)
  // ========================================

  async listAppointments(filterObj = {}) {
    const appointments = this._getFromStorage(STORAGE_KEYS.APPOINTMENTS) || {};
    let results = Object.values(appointments);

    // Apply filters
    if (filterObj.businessId) {
      results = results.filter(appt => appt.businessId === filterObj.businessId);
    }
    if (filterObj.teamMemberId) {
      results = results.filter(appt => appt.teamMemberId === filterObj.teamMemberId);
    }
    if (filterObj.serviceId) {
      results = results.filter(appt => appt.serviceId === filterObj.serviceId);
    }
    if (filterObj.status) {
      results = results.filter(appt => appt.status === filterObj.status);
    }
    if (filterObj.startUTC && filterObj.endUTC) {
      results = results.filter(appt => 
        timeRangesOverlap(appt.startUTC, appt.endUTC, filterObj.startUTC, filterObj.endUTC)
      );
    }

    // Apply limit
    const limit = filterObj.limit || 50;
    results = results.slice(0, limit);

    return results.map(appt => deepClone(appt));
  },

  async getAppointment(appointmentId) {
    validateRequired({ appointmentId }, ['appointmentId'], 'getAppointment');
    
    const appointments = this._getFromStorage(STORAGE_KEYS.APPOINTMENTS) || {};
    const appointment = appointments[appointmentId];
    
    return appointment ? deepClone(appointment) : null;
  },

  /**
   * CRITICAL: Create appointment with atomic conflict checking
   */
  async createAppointment(appointmentObj) {
    validateRequired(appointmentObj, 
      ['businessId', 'serviceId', 'startUTC', 'endUTC', 'customer', 'createdBy'], 
      'appointment'
    );
    validateRequired(appointmentObj.customer, ['name'], 'customer');

    // Acquire advisory lock for atomic operation
    const lockId = this._acquireLock();
    
    try {
      // Get current data
      const appointments = this._getFromStorage(STORAGE_KEYS.APPOINTMENTS) || {};
      const services = this._getFromStorage(STORAGE_KEYS.SERVICES) || {};
      const teamMembers = this._getFromStorage(STORAGE_KEYS.TEAM_MEMBERS) || {};
      const availabilities = this._getFromStorage(STORAGE_KEYS.AVAILABILITIES) || {};

      const service = services[appointmentObj.serviceId];
      if (!service) {
        const error = new Error('Service not found');
        error.code = 'NOT_FOUND';
        throw error;
      }

      const { startUTC, endUTC } = appointmentObj;
      let { teamMemberId } = appointmentObj;

      // Auto-assign team member if not specified
      if (!teamMemberId) {
        const businessMembers = Object.values(teamMembers).filter(
          member => member.businessId === appointmentObj.businessId && member.isActive
        );
        
        if (businessMembers.length === 0) {
          const error = new Error('No available team members');
          error.code = 'CONFLICT';
          error.details = { type: 'no_staff', message: 'No team members available for booking' };
          throw error;
        }

        // Simple assignment: pick first available member
        teamMemberId = businessMembers[0].id;
      }

      const teamMember = teamMembers[teamMemberId];
      if (!teamMember) {
        const error = new Error('Team member not found');
        error.code = 'NOT_FOUND';
        throw error;
      }

      // Check service capacity conflicts
      const serviceOverlaps = Object.values(appointments).filter(appt =>
        appt.serviceId === appointmentObj.serviceId &&
        appt.status !== 'canceled' &&
        appt.startUTC === startUTC // Exact time slot matching
      );

      if (serviceOverlaps.length >= service.capacity) {
        const error = new Error('Service capacity exceeded for this time slot');
        error.code = 'CONFLICT';
        error.details = { 
          type: 'service_capacity', 
          message: `Service capacity (${service.capacity}) exceeded. ${serviceOverlaps.length} appointments already booked.`
        };
        throw error;
      }

      // Check team member capacity conflicts
      const memberOverlaps = Object.values(appointments).filter(appt =>
        appt.teamMemberId === teamMemberId &&
        appt.status !== 'canceled' &&
        timeRangesOverlap(appt.startUTC, appt.endUTC, startUTC, endUTC)
      );

      if (memberOverlaps.length >= teamMember.capacity) {
        const error = new Error('Team member capacity exceeded for this time');
        error.code = 'CONFLICT';
        error.details = { 
          type: 'member_capacity', 
          message: `Team member capacity (${teamMember.capacity}) exceeded. ${memberOverlaps.length} overlapping appointments.`
        };
        throw error;
      }

      // Check availability restrictions (time-off, holidays, etc.)
      const restrictiveAvailabilities = Object.values(availabilities).filter(av =>
        av.entityType === 'team_member' &&
        av.entityId === teamMemberId &&
        av.type === 'unavailable' &&
        timeRangesOverlap(av.startUTC, av.endUTC, startUTC, endUTC)
      );

      if (restrictiveAvailabilities.length > 0) {
        const error = new Error('Team member is not available during this time');
        error.code = 'CONFLICT';
        error.details = { 
          type: 'availability', 
          message: 'Team member has time-off or is unavailable during the requested time.'
        };
        throw error;
      }

      // Create the appointment
      const now = new Date().toISOString();
      const appointment = {
        id: uuid(),
        businessId: appointmentObj.businessId,
        serviceId: appointmentObj.serviceId,
        teamMemberId: teamMemberId,
        startUTC: startUTC,
        endUTC: endUTC,
        customer: {
          name: appointmentObj.customer.name,
          email: appointmentObj.customer.email || '',
          phone: appointmentObj.customer.phone || ''
        },
        status: appointmentObj.status || 'booked',
        createdAt: now,
        createdBy: appointmentObj.createdBy,
        meta: appointmentObj.meta || {}
      };

      // Persist the appointment
      appointments[appointment.id] = appointment;
      this._setInStorage(STORAGE_KEYS.APPOINTMENTS, appointments);

      // Log the creation
      await this.appendAuditLog({
        businessId: appointment.businessId,
        actorId: appointmentObj.createdBy,
        action: 'create',
        entityType: 'appointment',
        entityId: appointment.id,
        diff: { created: appointment }
      });

      return deepClone(appointment);

    } finally {
      this._releaseLock();
    }
  },

  async updateAppointment(appointmentId, patch) {
    validateRequired({ appointmentId }, ['appointmentId'], 'updateAppointment');
    
    const appointments = this._getFromStorage(STORAGE_KEYS.APPOINTMENTS) || {};
    const existing = appointments[appointmentId];
    
    if (!existing) {
      const error = new Error('Appointment not found');
      error.code = 'NOT_FOUND';
      throw error;
    }

    // If updating time or team member, re-run conflict checks
    if (patch.startUTC || patch.endUTC || patch.teamMemberId) {
      // Create a new appointment object for conflict checking
      const updatedAppointment = { ...existing, ...patch };
      
      // Temporarily remove the existing appointment for conflict checking
      delete appointments[appointmentId];
      this._setInStorage(STORAGE_KEYS.APPOINTMENTS, appointments);
      
      try {
        // Run conflict checks by creating the updated appointment
        await this.createAppointment(updatedAppointment);
        // If we get here, no conflicts - remove the duplicate we just created
        const tempAppointments = this._getFromStorage(STORAGE_KEYS.APPOINTMENTS) || {};
        const tempKeys = Object.keys(tempAppointments).filter(key => key !== appointmentId);
        const tempId = tempKeys[tempKeys.length - 1]; // Get the last added (our temp appointment)
        delete tempAppointments[tempId];
        this._setInStorage(STORAGE_KEYS.APPOINTMENTS, tempAppointments);
      } catch (error) {
        // Restore the original appointment and re-throw the conflict
        appointments[appointmentId] = existing;
        this._setInStorage(STORAGE_KEYS.APPOINTMENTS, appointments);
        throw error;
      }
    }

    // Apply the patch
    const now = new Date().toISOString();
    const updated = {
      ...existing,
      ...patch,
      updatedAt: now
    };

    appointments[appointmentId] = updated;
    this._setInStorage(STORAGE_KEYS.APPOINTMENTS, appointments);

    // Log the update
    await this.appendAuditLog({
      businessId: updated.businessId,
      actorId: 'system', // TODO: Pass actual actor ID
      action: 'update',
      entityType: 'appointment',
      entityId: appointmentId,
      diff: { from: existing, to: patch }
    });

    return deepClone(updated);
  },

  async deleteAppointment(appointmentId) {
    validateRequired({ appointmentId }, ['appointmentId'], 'deleteAppointment');
    
    const appointments = this._getFromStorage(STORAGE_KEYS.APPOINTMENTS) || {};
    const existing = appointments[appointmentId];
    const existed = !!existing;
    
    if (existed) {
      delete appointments[appointmentId];
      this._setInStorage(STORAGE_KEYS.APPOINTMENTS, appointments);

      // Log the deletion
      await this.appendAuditLog({
        businessId: existing.businessId,
        actorId: 'system', // TODO: Pass actual actor ID
        action: 'delete',
        entityType: 'appointment',
        entityId: appointmentId,
        diff: { deleted: existing }
      });
    }

    return existed;
  },

  // ========================================
  // AUDIT LOG METHODS
  // ========================================

  async listAuditLogs(businessId, options = {}) {
    validateRequired({ businessId }, ['businessId'], 'listAuditLogs');
    
    const auditLogs = this._getFromStorage(STORAGE_KEYS.AUDIT_LOGS) || {};
    let logs = Object.values(auditLogs).filter(log => log.businessId === businessId);

    // Apply filters
    if (options.entityType) {
      logs = logs.filter(log => log.entityType === options.entityType);
    }
    if (options.action) {
      logs = logs.filter(log => log.action === options.action);
    }

    // Sort by timestamp (newest first)
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply limit
    const limit = options.limit || 50;
    logs = logs.slice(0, limit);

    return logs.map(log => deepClone(log));
  },

  async appendAuditLog(entry) {
    validateRequired(entry, ['businessId', 'action', 'entityType', 'entityId'], 'audit log entry');
    
    const auditLogs = this._getFromStorage(STORAGE_KEYS.AUDIT_LOGS) || {};
    const now = new Date().toISOString();
    
    const logEntry = {
      id: uuid(),
      businessId: entry.businessId,
      actorId: entry.actorId || 'system',
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      timestamp: now,
      diff: entry.diff || {}
    };

    auditLogs[logEntry.id] = logEntry;
    this._setInStorage(STORAGE_KEYS.AUDIT_LOGS, auditLogs);

    return deepClone(logEntry);
  },

  // ========================================
  // EXPORT/IMPORT METHODS
  // ========================================

  async exportAll() {
    try {
      const exportData = {
        meta: this._getFromStorage(STORAGE_KEYS.META),
        businesses: this._getFromStorage(STORAGE_KEYS.BUSINESSES),
        departments: this._getFromStorage(STORAGE_KEYS.DEPARTMENTS),
        team_members: this._getFromStorage(STORAGE_KEYS.TEAM_MEMBERS),
        services: this._getFromStorage(STORAGE_KEYS.SERVICES),
        availabilities: this._getFromStorage(STORAGE_KEYS.AVAILABILITIES),
        appointments: this._getFromStorage(STORAGE_KEYS.APPOINTMENTS),
        audit_logs: this._getFromStorage(STORAGE_KEYS.AUDIT_LOGS)
      };

      return exportData;
    } catch (error) {
      const systemError = new Error('Failed to export data');
      systemError.code = 'SYSTEM';
      systemError.originalError = error;
      throw systemError;
    }
  },

  async importAll(json, options = {}) {
    try {
      const { merge = false } = options;
      const warnings = [];

      // Validate JSON structure
      const requiredKeys = ['meta', 'businesses', 'team_members', 'services', 'appointments'];
      for (const key of requiredKeys) {
        if (!json.hasOwnProperty(key)) {
          const error = new Error(`Missing required key: ${key}`);
          error.code = 'VALIDATION';
          throw error;
        }
      }

      if (merge) {
        // Merge mode: combine with existing data
        for (const [key, value] of Object.entries(json)) {
          if (key === 'meta') {
            // Update metadata
            const currentMeta = this._getFromStorage(STORAGE_KEYS.META) || {};
            const updatedMeta = { ...currentMeta, ...value, updatedAt: new Date().toISOString() };
            this._setInStorage(STORAGE_KEYS.META, updatedMeta);
          } else {
            // Merge object data
            const storageKey = key === 'team_members' ? STORAGE_KEYS.TEAM_MEMBERS :
                             key === 'audit_logs' ? STORAGE_KEYS.AUDIT_LOGS : key.toUpperCase();
            
            const current = this._getFromStorage(storageKey) || {};
            const merged = { ...current, ...value };
            this._setInStorage(storageKey, merged);
          }
        }
      } else {
        // Replace mode: overwrite existing data
        this._setInStorage(STORAGE_KEYS.META, json.meta);
        this._setInStorage(STORAGE_KEYS.BUSINESSES, json.businesses || {});
        this._setInStorage(STORAGE_KEYS.DEPARTMENTS, json.departments || {});
        this._setInStorage(STORAGE_KEYS.TEAM_MEMBERS, json.team_members || {});
        this._setInStorage(STORAGE_KEYS.SERVICES, json.services || {});
        this._setInStorage(STORAGE_KEYS.AVAILABILITIES, json.availabilities || {});
        this._setInStorage(STORAGE_KEYS.APPOINTMENTS, json.appointments || {});
        this._setInStorage(STORAGE_KEYS.AUDIT_LOGS, json.audit_logs || {});
      }

      // Run migrations if version changed
      if (json.meta && json.meta.version) {
        await this._runMigrations(json.meta.version);
      }

      return {
        success: true,
        warnings: warnings
      };

    } catch (error) {
      if (error.code) {
        throw error; // Re-throw validation errors
      }
      
      const systemError = new Error('Failed to import data');
      systemError.code = 'SYSTEM';
      systemError.originalError = error;
      throw systemError;
    }
  }
};

export default LocalStorageAdapter;
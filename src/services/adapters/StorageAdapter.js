/**
 * StorageAdapter Interface
 * 
 * This is the contract that all storage adapters must implement.
 * The adapter provides a consistent API for data persistence across
 * different storage backends (localStorage, PostgreSQL, etc.).
 * 
 * All times are stored as ISO UTC strings; adapter implementers must ensure 
 * conversion to/from business timezone where needed.
 * 
 * Error Codes:
 * - VALIDATION: Input validation failed
 * - CONFLICT: Data conflict (e.g., overlapping appointments, capacity exceeded)
 * - NOT_FOUND: Requested resource does not exist
 * - SYSTEM: Internal system error
 */

const StorageAdapter = {
  /**
   * Initialize the storage adapter and run any necessary migrations
   * @returns {Promise<void>}
   * @throws {Error} with .code='SYSTEM' if initialization fails
   * @example
   * await adapter.init();
   */
  async init() {
    throw new Error('Not implemented');
  },

  /**
   * Get business by ID
   * @param {string} businessId - UUID of the business
   * @returns {Promise<Object|null>} Business object or null if not found
   * @throws {Error} with .code='VALIDATION' if businessId invalid
   * @example
   * // Returns: { id, name, timezone, currency, locale, defaultBufferBefore, defaultBufferAfter, createdAt, updatedAt }
   * const business = await adapter.getBusiness('123e4567-e89b-12d3-a456-426614174000');
   */
  async getBusiness(businessId) {
    throw new Error('Not implemented');
  },

  /**
   * Create or update a business
   * @param {Object} businessObj - Business object
   * @param {string} businessObj.id - UUID (required for updates, generated if missing)
   * @param {string} businessObj.name - Business name (required)
   * @param {string} businessObj.timezone - IANA timezone (required)
   * @param {string} [businessObj.currency='USD'] - Currency code
   * @param {string} [businessObj.locale='en-US'] - Locale code
   * @param {number} [businessObj.defaultBufferBefore=0] - Default buffer before appointments (minutes)
   * @param {number} [businessObj.defaultBufferAfter=0] - Default buffer after appointments (minutes)
   * @returns {Promise<Object>} Created/updated business object
   * @throws {Error} with .code='VALIDATION' if required fields missing or invalid
   * @example
   * const business = await adapter.upsertBusiness({
   *   name: 'Acme Salon',
   *   timezone: 'America/New_York',
   *   currency: 'USD',
   *   defaultBufferBefore: 10,
   *   defaultBufferAfter: 15
   * });
   */
  async upsertBusiness(businessObj) {
    throw new Error('Not implemented');
  },

  /**
   * List team members for a business
   * @param {string} businessId - UUID of the business
   * @param {Object} [filters={}] - Optional filters
   * @param {string} [filters.role] - Filter by role
   * @param {boolean} [filters.isActive] - Filter by active status
   * @returns {Promise<Array>} Array of team member objects
   * @throws {Error} with .code='VALIDATION' if businessId invalid
   * @example
   * // Returns: [{ id, businessId, name, email, phone, role, skills, defaultWorkingHours, capacity, createdAt, updatedAt }]
   * const members = await adapter.listTeamMembers('business-123', { role: 'stylist' });
   */
  async listTeamMembers(businessId, filters = {}) {
    throw new Error('Not implemented');
  },

  /**
   * Get team member by ID
   * @param {string} teamMemberId - UUID of the team member
   * @returns {Promise<Object|null>} Team member object or null if not found
   * @throws {Error} with .code='VALIDATION' if teamMemberId invalid
   * @example
   * // Returns: { id, businessId, name, email, phone, role, skills, defaultWorkingHours, capacity, createdAt, updatedAt }
   * const member = await adapter.getTeamMember('member-123');
   */
  async getTeamMember(teamMemberId) {
    throw new Error('Not implemented');
  },

  /**
   * Create or update a team member
   * @param {Object} teamMemberObj - Team member object
   * @param {string} teamMemberObj.id - UUID (required for updates, generated if missing)
   * @param {string} teamMemberObj.businessId - Business UUID (required)
   * @param {string} teamMemberObj.name - Member name (required)
   * @param {string} [teamMemberObj.email] - Email address
   * @param {string} [teamMemberObj.phone] - Phone number
   * @param {string} [teamMemberObj.role='staff'] - Role/title
   * @param {Array} [teamMemberObj.skills=[]] - Array of skill strings
   * @param {Array} [teamMemberObj.defaultWorkingHours=[]] - Array of {weekday: 0-6, from: 'HH:mm', to: 'HH:mm'}
   * @param {number} [teamMemberObj.capacity=1] - Concurrent appointment capacity
   * @returns {Promise<Object>} Created/updated team member object
   * @throws {Error} with .code='VALIDATION' if required fields missing or invalid
   * @example
   * const member = await adapter.upsertTeamMember({
   *   businessId: 'business-123',
   *   name: 'Jane Smith',
   *   email: 'jane@example.com',
   *   role: 'senior stylist',
   *   skills: ['haircut', 'coloring'],
   *   defaultWorkingHours: [
   *     { weekday: 1, from: '09:00', to: '17:00' },
   *     { weekday: 2, from: '09:00', to: '17:00' }
   *   ],
   *   capacity: 1
   * });
   */
  async upsertTeamMember(teamMemberObj) {
    throw new Error('Not implemented');
  },

  /**
   * Delete a team member
   * @param {string} teamMemberId - UUID of the team member
   * @returns {Promise<boolean>} True if deleted, false if not found
   * @throws {Error} with .code='VALIDATION' if teamMemberId invalid
   * @throws {Error} with .code='CONFLICT' if member has future appointments
   */
  async deleteTeamMember(teamMemberId) {
    throw new Error('Not implemented');
  },

  /**
   * List services for a business
   * @param {string} businessId - UUID of the business
   * @returns {Promise<Array>} Array of service objects
   * @throws {Error} with .code='VALIDATION' if businessId invalid
   * @example
   * // Returns: [{ id, businessId, name, durationMinutes, price, currency, bufferBefore, bufferAfter, capacity, isActive, createdAt, updatedAt }]
   * const services = await adapter.listServices('business-123');
   */
  async listServices(businessId) {
    throw new Error('Not implemented');
  },

  /**
   * Get service by ID
   * @param {string} serviceId - UUID of the service
   * @returns {Promise<Object|null>} Service object or null if not found
   * @throws {Error} with .code='VALIDATION' if serviceId invalid
   * @example
   * // Returns: { id, businessId, name, durationMinutes, price, currency, bufferBefore, bufferAfter, capacity, isActive, createdAt, updatedAt }
   * const service = await adapter.getService('service-123');
   */
  async getService(serviceId) {
    throw new Error('Not implemented');
  },

  /**
   * Create or update a service
   * @param {Object} serviceObj - Service object
   * @param {string} serviceObj.id - UUID (required for updates, generated if missing)
   * @param {string} serviceObj.businessId - Business UUID (required)
   * @param {string} serviceObj.name - Service name (required)
   * @param {number} serviceObj.durationMinutes - Duration in minutes (required, > 0)
   * @param {number} [serviceObj.price] - Price amount
   * @param {string} [serviceObj.currency='USD'] - Currency code
   * @param {number} [serviceObj.bufferBefore=0] - Buffer before appointment (minutes)
   * @param {number} [serviceObj.bufferAfter=0] - Buffer after appointment (minutes)
   * @param {number} [serviceObj.capacity=1] - Maximum concurrent bookings
   * @param {boolean} [serviceObj.isActive=true] - Whether service is available for booking
   * @returns {Promise<Object>} Created/updated service object
   * @throws {Error} with .code='VALIDATION' if required fields missing or invalid
   * @example
   * const service = await adapter.upsertService({
   *   businessId: 'business-123',
   *   name: 'Haircut & Style',
   *   durationMinutes: 60,
   *   price: 85.00,
   *   currency: 'USD',
   *   bufferBefore: 10,
   *   bufferAfter: 15,
   *   capacity: 1
   * });
   */
  async upsertService(serviceObj) {
    throw new Error('Not implemented');
  },

  /**
   * Delete a service
   * @param {string} serviceId - UUID of the service
   * @returns {Promise<boolean>} True if deleted, false if not found
   * @throws {Error} with .code='VALIDATION' if serviceId invalid
   * @throws {Error} with .code='CONFLICT' if service has future appointments
   */
  async deleteService(serviceId) {
    throw new Error('Not implemented');
  },

  /**
   * List availabilities for an entity within a time range
   * @param {string} entityType - 'business' | 'team_member' | 'service'
   * @param {string} entityId - UUID of the entity
   * @param {string} fromUTC - Start time (ISO UTC string)
   * @param {string} toUTC - End time (ISO UTC string)
   * @returns {Promise<Array>} Array of availability objects
   * @throws {Error} with .code='VALIDATION' if parameters invalid
   * @example
   * // Returns: [{ id, entityType, entityId, startUTC, endUTC, type, notes, createdAt }]
   * const availabilities = await adapter.listAvailabilities(
   *   'team_member', 
   *   'member-123', 
   *   '2025-11-24T00:00:00.000Z', 
   *   '2025-11-30T23:59:59.999Z'
   * );
   */
  async listAvailabilities(entityType, entityId, fromUTC, toUTC) {
    throw new Error('Not implemented');
  },

  /**
   * Create an availability record
   * @param {Object} avObj - Availability object
   * @param {string} avObj.entityType - 'business' | 'team_member' | 'service' (required)
   * @param {string} avObj.entityId - UUID of the entity (required)
   * @param {string} avObj.startUTC - Start time (ISO UTC string, required)
   * @param {string} avObj.endUTC - End time (ISO UTC string, required)
   * @param {string} [avObj.type='unavailable'] - 'available' | 'unavailable' | 'holiday'
   * @param {string} [avObj.notes] - Optional notes
   * @returns {Promise<Object>} Created availability object
   * @throws {Error} with .code='VALIDATION' if required fields missing or invalid
   * @example
   * const availability = await adapter.createAvailability({
   *   entityType: 'team_member',
   *   entityId: 'member-123',
   *   startUTC: '2025-11-25T14:00:00.000Z',
   *   endUTC: '2025-11-25T18:00:00.000Z',
   *   type: 'unavailable',
   *   notes: 'Sick leave'
   * });
   */
  async createAvailability(avObj) {
    throw new Error('Not implemented');
  },

  /**
   * Delete an availability record
   * @param {string} availId - UUID of the availability
   * @returns {Promise<boolean>} True if deleted, false if not found
   * @throws {Error} with .code='VALIDATION' if availId invalid
   */
  async deleteAvailability(availId) {
    throw new Error('Not implemented');
  },

  /**
   * List appointments with filtering
   * @param {Object} filterObj - Filter criteria
   * @param {string} [filterObj.businessId] - Business UUID
   * @param {string} [filterObj.teamMemberId] - Team member UUID
   * @param {string} [filterObj.serviceId] - Service UUID
   * @param {string} [filterObj.startUTC] - Start time range (ISO UTC string)
   * @param {string} [filterObj.endUTC] - End time range (ISO UTC string)
   * @param {string} [filterObj.status] - Appointment status
   * @param {number} [filterObj.limit=50] - Maximum results to return
   * @param {string} [filterObj.cursor] - Pagination cursor
   * @returns {Promise<Array>} Array of appointment objects
   * @throws {Error} with .code='VALIDATION' if filter parameters invalid
   * @example
   * // Returns: [{ id, businessId, serviceId, teamMemberId, startUTC, endUTC, customer, status, createdAt, createdBy, meta }]
   * const appointments = await adapter.listAppointments({
   *   businessId: 'business-123',
   *   startUTC: '2025-11-24T00:00:00.000Z',
   *   endUTC: '2025-11-30T23:59:59.999Z',
   *   status: 'booked'
   * });
   */
  async listAppointments(filterObj) {
    throw new Error('Not implemented');
  },

  /**
   * Get appointment by ID
   * @param {string} appointmentId - UUID of the appointment
   * @returns {Promise<Object|null>} Appointment object or null if not found
   * @throws {Error} with .code='VALIDATION' if appointmentId invalid
   * @example
   * // Returns: { id, businessId, serviceId, teamMemberId, startUTC, endUTC, customer, status, createdAt, createdBy, meta }
   * const appointment = await adapter.getAppointment('appointment-123');
   */
  async getAppointment(appointmentId) {
    throw new Error('Not implemented');
  },

  /**
   * Create a new appointment with conflict checking
   * @param {Object} appointmentObj - Appointment object
   * @param {string} appointmentObj.businessId - Business UUID (required)
   * @param {string} appointmentObj.serviceId - Service UUID (required)
   * @param {string} appointmentObj.startUTC - Start time (ISO UTC string, required)
   * @param {string} appointmentObj.endUTC - End time (ISO UTC string, required)
   * @param {Object} appointmentObj.customer - Customer details (required)
   * @param {string} appointmentObj.customer.name - Customer name (required)
   * @param {string} [appointmentObj.customer.email] - Customer email
   * @param {string} [appointmentObj.customer.phone] - Customer phone
   * @param {string} [appointmentObj.teamMemberId] - Team member UUID (null for auto-assign)
   * @param {string} [appointmentObj.status='booked'] - Appointment status
   * @param {string} [appointmentObj.createdBy='customer'] - 'customer' | 'admin'
   * @param {Object} [appointmentObj.meta={}] - Additional metadata
   * @returns {Promise<Object>} Created appointment object
   * @throws {Error} with .code='VALIDATION' if required fields missing or invalid
   * @throws {Error} with .code='CONFLICT' if appointment conflicts with capacity or availability
   * @example
   * const appointment = await adapter.createAppointment({
   *   businessId: 'business-123',
   *   serviceId: 'service-123',
   *   startUTC: '2025-11-25T14:00:00.000Z',
   *   endUTC: '2025-11-25T15:00:00.000Z',
   *   customer: {
   *     name: 'John Doe',
   *     email: 'john@example.com',
   *     phone: '+1234567890'
   *   },
   *   teamMemberId: 'member-123',
   *   createdBy: 'admin'
   * });
   */
  async createAppointment(appointmentObj) {
    throw new Error('Not implemented');
  },

  /**
   * Update an existing appointment
   * @param {string} appointmentId - UUID of the appointment
   * @param {Object} patch - Fields to update
   * @returns {Promise<Object>} Updated appointment object
   * @throws {Error} with .code='NOT_FOUND' if appointment doesn't exist
   * @throws {Error} with .code='VALIDATION' if patch data invalid
   * @throws {Error} with .code='CONFLICT' if update creates conflicts
   * @example
   * const updated = await adapter.updateAppointment('appointment-123', {
   *   status: 'confirmed',
   *   startUTC: '2025-11-25T15:00:00.000Z',
   *   endUTC: '2025-11-25T16:00:00.000Z'
   * });
   */
  async updateAppointment(appointmentId, patch) {
    throw new Error('Not implemented');
  },

  /**
   * Delete an appointment
   * @param {string} appointmentId - UUID of the appointment
   * @returns {Promise<boolean>} True if deleted, false if not found
   * @throws {Error} with .code='VALIDATION' if appointmentId invalid
   */
  async deleteAppointment(appointmentId) {
    throw new Error('Not implemented');
  },

  /**
   * List audit logs for a business
   * @param {string} businessId - Business UUID
   * @param {Object} [options={}] - Options
   * @param {number} [options.limit=50] - Maximum results to return
   * @param {string} [options.cursor] - Pagination cursor
   * @param {string} [options.entityType] - Filter by entity type
   * @param {string} [options.action] - Filter by action
   * @returns {Promise<Array>} Array of audit log objects
   * @throws {Error} with .code='VALIDATION' if businessId invalid
   * @example
   * // Returns: [{ id, businessId, actorId, action, entityType, entityId, timestamp, diff }]
   * const logs = await adapter.listAuditLogs('business-123', { limit: 20 });
   */
  async listAuditLogs(businessId, options = {}) {
    throw new Error('Not implemented');
  },

  /**
   * Append an audit log entry
   * @param {Object} entry - Audit log entry
   * @param {string} entry.businessId - Business UUID (required)
   * @param {string} [entry.actorId] - UUID of actor who performed the action
   * @param {string} entry.action - Action performed (required)
   * @param {string} entry.entityType - Type of entity affected (required)
   * @param {string} entry.entityId - UUID of entity affected (required)
   * @param {Object} [entry.diff] - Changes made
   * @returns {Promise<Object>} Created audit log entry
   * @throws {Error} with .code='VALIDATION' if required fields missing
   * @example
   * const log = await adapter.appendAuditLog({
   *   businessId: 'business-123',
   *   actorId: 'user-123',
   *   action: 'create',
   *   entityType: 'appointment',
   *   entityId: 'appointment-123',
   *   diff: { status: { from: null, to: 'booked' } }
   * });
   */
  async appendAuditLog(entry) {
    throw new Error('Not implemented');
  },

  /**
   * Export all data for backup/migration
   * @returns {Promise<Object>} Complete data export
   * @throws {Error} with .code='SYSTEM' if export fails
   * @example
   * // Returns: { meta, businesses, departments, team_members, services, availabilities, appointments, audit_logs }
   * const exportData = await adapter.exportAll();
   */
  async exportAll() {
    throw new Error('Not implemented');
  },

  /**
   * Import data from backup/migration
   * @param {Object} json - Data to import
   * @param {Object} [options={}] - Import options
   * @param {boolean} [options.merge=false] - Whether to merge or replace existing data
   * @returns {Promise<Object>} Import result with success status and warnings
   * @throws {Error} with .code='VALIDATION' if import data invalid
   * @throws {Error} with .code='SYSTEM' if import fails
   * @example
   * const result = await adapter.importAll(exportData, { merge: false });
   * // Returns: { success: true, warnings: ['Skipped 2 duplicate entries'] }
   */
  async importAll(json, options = {}) {
    throw new Error('Not implemented');
  }
};

export default StorageAdapter;
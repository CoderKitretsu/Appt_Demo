/**
 * Schema Factory Functions
 * 
 * Provides factory functions to generate valid, storage-ready objects
 * for all entities in the appointment booking system.
 * 
 * Each factory accepts an overrides object to customize specific fields
 * while providing sensible defaults for all required fields.
 * 
 * Usage:
 * const business = createBusiness({ name: 'My Salon' });
 * const service = createService({ businessId: business.id, name: 'Haircut' });
 */

// Minimal UUID v4 generator (matches the one in LocalStorageAdapter)
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Create a business object with sensible defaults
 * @param {Object} options - Configuration object
 * @param {Object} options.overrides - Fields to override defaults
 * @returns {Object} Complete business object
 */
export function createBusiness({ overrides = {} } = {}) {
  const now = new Date().toISOString();
  
  return {
    id: uuid(),
    name: 'Sample Business',
    timezone: 'UTC',
    currency: 'USD',
    locale: 'en-US',
    defaultBufferBefore: 10, // minutes
    defaultBufferAfter: 15,  // minutes
    createdAt: now,
    updatedAt: now,
    // Allow additional fields via overrides
    ...overrides
  };
}

/**
 * Create a team member object with sensible defaults
 * @param {Object} options - Configuration object
 * @param {Object} options.overrides - Fields to override defaults
 * @returns {Object} Complete team member object
 */
export function createTeamMember({ overrides = {} } = {}) {
  const now = new Date().toISOString();
  
  // Default working hours: Monday-Friday, 9 AM to 5 PM
  const defaultWorkingHours = [
    { weekday: 1, from: '09:00', to: '17:00' }, // Monday
    { weekday: 2, from: '09:00', to: '17:00' }, // Tuesday
    { weekday: 3, from: '09:00', to: '17:00' }, // Wednesday
    { weekday: 4, from: '09:00', to: '17:00' }, // Thursday
    { weekday: 5, from: '09:00', to: '17:00' }  // Friday
  ];
  
  return {
    id: uuid(),
    businessId: null, // Must be provided via overrides
    name: 'Sample Team Member',
    email: 'team@example.com',
    phone: '+1-555-0123',
    role: 'staff',
    skills: ['general'], // Array of skill strings
    defaultWorkingHours: defaultWorkingHours,
    capacity: 1, // Maximum concurrent appointments
    isActive: true,
    createdAt: now,
    updatedAt: now,
    // Allow additional fields via overrides
    ...overrides
  };
}

/**
 * Create a service object with sensible defaults
 * @param {Object} options - Configuration object
 * @param {Object} options.overrides - Fields to override defaults
 * @returns {Object} Complete service object
 */
export function createService({ overrides = {} } = {}) {
  const now = new Date().toISOString();
  
  return {
    id: uuid(),
    businessId: null, // Must be provided via overrides
    name: 'Sample Service',
    durationMinutes: 30,
    price: 50.00,
    currency: 'USD',
    bufferBefore: 10, // minutes before appointment
    bufferAfter: 15,  // minutes after appointment
    capacity: 1, // Maximum concurrent bookings for this service
    isActive: true,
    createdAt: now,
    updatedAt: now,
    // Allow additional fields via overrides
    ...overrides
  };
}

/**
 * Create an availability record with sensible defaults
 * @param {Object} options - Configuration object
 * @param {Object} options.overrides - Fields to override defaults
 * @returns {Object} Complete availability object
 */
export function createAvailability({ overrides = {} } = {}) {
  const now = new Date().toISOString();
  
  // Default: unavailable for 2 hours starting tomorrow at 2 PM UTC
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0); // 2 PM
  
  const startUTC = tomorrow.toISOString();
  const endUTC = new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000).toISOString(); // +2 hours
  
  return {
    id: uuid(),
    entityType: 'team_member', // 'business' | 'team_member' | 'service'
    entityId: null, // Must be provided via overrides
    startUTC: startUTC,
    endUTC: endUTC,
    type: 'unavailable', // 'available' | 'unavailable' | 'holiday'
    notes: 'Sample unavailability period',
    createdAt: now,
    // Allow additional fields via overrides
    ...overrides
  };
}

/**
 * Create an appointment object with sensible defaults
 * @param {Object} options - Configuration object
 * @param {Object} options.overrides - Fields to override defaults
 * @returns {Object} Complete appointment object
 */
export function createAppointment({ overrides = {} } = {}) {
  const now = new Date().toISOString();
  
  // Default: appointment starting tomorrow at 10 AM UTC for 1 hour
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0); // 10 AM
  
  const startUTC = tomorrow.toISOString();
  const endUTC = new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString(); // +1 hour
  
  return {
    id: uuid(),
    businessId: null, // Must be provided via overrides
    serviceId: null,  // Must be provided via overrides
    teamMemberId: null, // Can be null for auto-assignment
    startUTC: startUTC,
    endUTC: endUTC,
    customer: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-0199'
    },
    status: 'booked', // 'booked' | 'confirmed' | 'rescheduled' | 'canceled' | 'completed'
    createdAt: now,
    createdBy: 'customer', // 'customer' | 'admin'
    meta: {}, // Additional metadata
    // Allow additional fields via overrides
    ...overrides
  };
}

/**
 * Create an audit log entry with sensible defaults
 * @param {Object} options - Configuration object
 * @param {Object} options.overrides - Fields to override defaults
 * @returns {Object} Complete audit log object
 */
export function createAuditLog({ overrides = {} } = {}) {
  const now = new Date().toISOString();
  
  return {
    id: uuid(),
    businessId: null, // Must be provided via overrides
    actorId: 'system', // UUID of user who performed the action
    action: 'create', // 'create' | 'update' | 'delete'
    entityType: 'appointment', // 'business' | 'team_member' | 'service' | 'appointment' | etc.
    entityId: null, // Must be provided via overrides - UUID of affected entity
    timestamp: now,
    diff: {}, // Object describing what changed
    // Allow additional fields via overrides
    ...overrides
  };
}

// Export convenience object with all factories
export default {
  createBusiness,
  createTeamMember,
  createService,
  createAvailability,
  createAppointment,
  createAuditLog
};

// Example usage patterns (for documentation):
// 
// // Basic usage with defaults
// const business = createBusiness();
//
// // With specific overrides
// const salon = createBusiness({ 
//   overrides: { 
//     name: 'Elite Hair Salon', 
//     timezone: 'America/New_York' 
//   } 
// });
//
// // Team member for specific business
// const stylist = createTeamMember({ 
//   overrides: { 
//     businessId: salon.id,
//     name: 'Jane Smith',
//     role: 'senior stylist',
//     skills: ['haircut', 'coloring', 'styling']
//   } 
// });
//
// // Service for specific business
// const haircut = createService({ 
//   overrides: { 
//     businessId: salon.id,
//     name: 'Haircut & Style',
//     durationMinutes: 60,
//     price: 85.00
//   } 
// });
//
// // Appointment linking everything together
// const appointment = createAppointment({ 
//   overrides: { 
//     businessId: salon.id,
//     serviceId: haircut.id,
//     teamMemberId: stylist.id,
//     customer: {
//       name: 'Alice Johnson',
//       email: 'alice@example.com',
//       phone: '+1-555-0187'
//     }
//   } 
// });
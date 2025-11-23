/**
 * Local Seed Script for Development
 * 
 * Creates sample data for testing and development purposes.
 * Populates localStorage with a complete business setup including
 * team members, services, availabilities, and sample appointments.
 * 
 * Usage:
 * import { seedLocalData } from './seedLocal.js';
 * await seedLocalData(storage);
 */

import { 
  createBusiness, 
  createTeamMember, 
  createService, 
  createAvailability, 
  createAppointment 
} from '../services/models/schemas.js';

/**
 * Seed the local storage with comprehensive sample data
 * @param {Object} storage - Storage adapter instance (LocalStorageAdapter)
 * @returns {Promise<string>} Returns the businessId of the created business
 */
export async function seedLocalData(storage) {
  console.log('🌱 Starting local data seeding...');
  
  try {
    // Clear any existing data first (optional - comment out to preserve existing data)
    // await storage.init(); // This will preserve existing data
    
    // 1. Create a sample business
    console.log('📊 Creating business...');
    const business = await storage.upsertBusiness(createBusiness({
      overrides: {
        name: 'Elite Hair & Beauty Salon',
        timezone: 'America/New_York',
        currency: 'USD',
        locale: 'en-US',
        defaultBufferBefore: 15,
        defaultBufferAfter: 10
      }
    }));
    console.log(`✅ Business created: ${business.name} (${business.id})`);
    
    // 2. Create team members with different schedules
    console.log('👥 Creating team members...');
    
    // Team Member A - Full time Monday-Friday
    const teamMemberA = await storage.upsertTeamMember(createTeamMember({
      overrides: {
        businessId: business.id,
        name: 'Sarah Johnson',
        email: 'sarah@elitesalon.com',
        phone: '+1-555-0101',
        role: 'Senior Stylist',
        skills: ['haircut', 'coloring', 'styling', 'highlights'],
        defaultWorkingHours: [
          { weekday: 1, from: '09:00', to: '17:00' }, // Monday
          { weekday: 2, from: '09:00', to: '17:00' }, // Tuesday
          { weekday: 3, from: '09:00', to: '17:00' }, // Wednesday
          { weekday: 4, from: '09:00', to: '17:00' }, // Thursday
          { weekday: 5, from: '09:00', to: '17:00' }  // Friday
        ],
        capacity: 1
      }
    }));
    console.log(`✅ Team member created: ${teamMemberA.name} (${teamMemberA.id})`);
    
    // Team Member B - Part time Tuesday-Saturday
    const teamMemberB = await storage.upsertTeamMember(createTeamMember({
      overrides: {
        businessId: business.id,
        name: 'Mike Chen',
        email: 'mike@elitesalon.com',
        phone: '+1-555-0102',
        role: 'Junior Stylist',
        skills: ['haircut', 'beard_trim', 'styling'],
        defaultWorkingHours: [
          { weekday: 2, from: '10:00', to: '18:00' }, // Tuesday
          { weekday: 3, from: '10:00', to: '18:00' }, // Wednesday
          { weekday: 4, from: '10:00', to: '18:00' }, // Thursday
          { weekday: 5, from: '10:00', to: '18:00' }, // Friday
          { weekday: 6, from: '09:00', to: '15:00' }  // Saturday
        ],
        capacity: 1
      }
    }));
    console.log(`✅ Team member created: ${teamMemberB.name} (${teamMemberB.id})`);
    
    // 3. Create services with different durations and prices
    console.log('🛠️ Creating services...');
    
    // Service A - Quick haircut
    const serviceA = await storage.upsertService(createService({
      overrides: {
        businessId: business.id,
        name: 'Express Haircut',
        durationMinutes: 30,
        price: 45.00,
        currency: 'USD',
        bufferBefore: 10,
        bufferAfter: 10,
        capacity: 1
      }
    }));
    console.log(`✅ Service created: ${serviceA.name} (${serviceA.id})`);
    
    // Service B - Premium styling
    const serviceB = await storage.upsertService(createService({
      overrides: {
        businessId: business.id,
        name: 'Premium Cut & Style',
        durationMinutes: 90,
        price: 120.00,
        currency: 'USD',
        bufferBefore: 15,
        bufferAfter: 15,
        capacity: 1
      }
    }));
    console.log(`✅ Service created: ${serviceB.name} (${serviceB.id})`);
    
    // 4. Create some availabilities (time-off periods)
    console.log('📅 Creating availability records...');
    
    // Sarah takes Wednesday afternoon off next week
    const nextWednesday = new Date();
    nextWednesday.setDate(nextWednesday.getDate() + ((3 - nextWednesday.getDay() + 7) % 7) || 7); // Next Wednesday
    nextWednesday.setHours(13, 0, 0, 0); // 1 PM
    const wednesdayEnd = new Date(nextWednesday);
    wednesdayEnd.setHours(17, 0, 0, 0); // 5 PM
    
    const availability1 = await storage.createAvailability(createAvailability({
      overrides: {
        entityType: 'team_member',
        entityId: teamMemberA.id,
        startUTC: nextWednesday.toISOString(),
        endUTC: wednesdayEnd.toISOString(),
        type: 'unavailable',
        notes: 'Afternoon off - personal appointment'
      }
    }));
    console.log(`✅ Availability created: Time-off for ${teamMemberA.name} (${availability1.id})`);
    
    // Mike has a holiday coming up (Friday)
    const nextFriday = new Date();
    nextFriday.setDate(nextFriday.getDate() + ((5 - nextFriday.getDay() + 7) % 7) || 7); // Next Friday
    nextFriday.setHours(0, 0, 0, 0); // All day
    const fridayEnd = new Date(nextFriday);
    fridayEnd.setHours(23, 59, 59, 999);
    
    const availability2 = await storage.createAvailability(createAvailability({
      overrides: {
        entityType: 'team_member',
        entityId: teamMemberB.id,
        startUTC: nextFriday.toISOString(),
        endUTC: fridayEnd.toISOString(),
        type: 'holiday',
        notes: 'Personal holiday'
      }
    }));
    console.log(`✅ Availability created: Holiday for ${teamMemberB.name} (${availability2.id})`);
    
    // 5. Create sample appointments (non-conflicting)
    console.log('📋 Creating sample appointments...');
    
    // Appointment 1 - Tomorrow morning with Sarah
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0); // 10 AM
    const appointment1End = new Date(tomorrow.getTime() + serviceA.durationMinutes * 60 * 1000);
    
    const appointment1 = await storage.createAppointment(createAppointment({
      overrides: {
        businessId: business.id,
        serviceId: serviceA.id,
        teamMemberId: teamMemberA.id,
        startUTC: tomorrow.toISOString(),
        endUTC: appointment1End.toISOString(),
        customer: {
          name: 'Alice Smith',
          email: 'alice.smith@email.com',
          phone: '+1-555-0201'
        },
        status: 'confirmed',
        createdBy: 'admin'
      }
    }));
    console.log(`✅ Appointment created: ${appointment1.customer.name} with ${teamMemberA.name} (${appointment1.id})`);
    
    // Appointment 2 - Day after tomorrow with Mike
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    dayAfterTomorrow.setHours(14, 0, 0, 0); // 2 PM
    const appointment2End = new Date(dayAfterTomorrow.getTime() + serviceB.durationMinutes * 60 * 1000);
    
    const appointment2 = await storage.createAppointment(createAppointment({
      overrides: {
        businessId: business.id,
        serviceId: serviceB.id,
        teamMemberId: teamMemberB.id,
        startUTC: dayAfterTomorrow.toISOString(),
        endUTC: appointment2End.toISOString(),
        customer: {
          name: 'Bob Wilson',
          email: 'bob.wilson@email.com',
          phone: '+1-555-0202'
        },
        status: 'booked',
        createdBy: 'customer'
      }
    }));
    console.log(`✅ Appointment created: ${appointment2.customer.name} with ${teamMemberB.name} (${appointment2.id})`);
    
    // 6. Summary
    console.log('\n🎉 Seeding completed successfully!');
    console.log('📊 Summary of created data:');
    console.log(`   • Business: ${business.name}`);
    console.log(`   • Team Members: ${teamMemberA.name}, ${teamMemberB.name}`);
    console.log(`   • Services: ${serviceA.name}, ${serviceB.name}`);
    console.log(`   • Availabilities: ${availability1.notes}, ${availability2.notes}`);
    console.log(`   • Appointments: 2 sample bookings`);
    console.log(`\n💾 Check localStorage keys: appt_store_meta, businesses, team_members, services, availabilities, appointments, audit_logs`);
    
    // Return business ID for further use
    return business.id;
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

/**
 * Clear all seeded data (development helper)
 * @param {Object} storage - Storage adapter instance
 */
export async function clearSeedData(storage) {
  console.log('🧹 Clearing all seeded data...');
  
  try {
    // Get all data to clear
    const exportData = await storage.exportAll();
    
    // Clear each collection
    if (exportData.appointments) {
      for (const appointmentId of Object.keys(exportData.appointments)) {
        await storage.deleteAppointment(appointmentId);
      }
    }
    
    if (exportData.availabilities) {
      for (const availId of Object.keys(exportData.availabilities)) {
        await storage.deleteAvailability(availId);
      }
    }
    
    if (exportData.services) {
      for (const serviceId of Object.keys(exportData.services)) {
        await storage.deleteService(serviceId);
      }
    }
    
    if (exportData.team_members) {
      for (const memberId of Object.keys(exportData.team_members)) {
        await storage.deleteTeamMember(memberId);
      }
    }
    
    console.log('✅ All seeded data cleared');
  } catch (error) {
    console.error('❌ Failed to clear seeded data:', error);
    throw error;
  }
}

export default {
  seedLocalData,
  clearSeedData
};
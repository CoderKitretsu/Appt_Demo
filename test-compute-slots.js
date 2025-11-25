// Test file to verify computeSlots functionality
// Run this with: node test-compute-slots.js

import { computeSlots, isSlotOccupied, getDaySummary } from '../src/utils/dateUtils.js';

// Test data
const testWorkingHours = [
  { weekday: 1, from: "09:00", to: "17:00" }, // Monday
  { weekday: 2, from: "09:00", to: "17:00" }, // Tuesday  
  { weekday: 3, from: "09:00", to: "17:00" }, // Wednesday
  { weekday: 4, from: "09:00", to: "17:00" }, // Thursday
  { weekday: 5, from: "09:00", to: "17:00" }, // Friday
];

const testAppointments = [
  {
    id: "test-1",
    startUTC: "2024-01-15T14:00:00.000Z", // 9:00 AM EST
    endUTC: "2024-01-15T14:30:00.000Z",   // 9:30 AM EST
  },
  {
    id: "test-2", 
    startUTC: "2024-01-15T16:00:00.000Z", // 11:00 AM EST
    endUTC: "2024-01-15T17:00:00.000Z",   // 12:00 PM EST
  }
];

// Test Monday, January 15, 2024 (weekday = 1)
console.log('🧪 Testing computeSlots function...\n');

const slots = computeSlots({
  workingHours: testWorkingHours,
  serviceDuration: 30,
  bufferBefore: 0,
  bufferAfter: 0,
  date: "2024-01-15",
  timezone: "America/New_York"
});

console.log(`📅 Generated ${slots.length} slots for Monday, January 15, 2024:`);
console.log('First 5 slots:');
slots.slice(0, 5).forEach((slot, index) => {
  console.log(`  ${index + 1}. ${slot.time} - ${slot.endTime}`);
});

console.log('\n🔍 Testing slot occupancy...');
const occupiedSlots = slots.filter(slot => isSlotOccupied(slot, testAppointments));
console.log(`Found ${occupiedSlots.length} occupied slots:`);
occupiedSlots.forEach(slot => {
  console.log(`  ❌ ${slot.time} - ${slot.endTime} (occupied)`);
});

console.log('\n📊 Day Summary:');
const summary = getDaySummary(slots, testAppointments);
console.log(`  Total slots: ${summary.totalSlots}`);
console.log(`  Available: ${summary.availableSlots}`);
console.log(`  Occupied: ${summary.occupiedSlots}`);
console.log(`  Occupancy rate: ${summary.occupancyRate}%`);

console.log('\n✅ Test completed successfully!');
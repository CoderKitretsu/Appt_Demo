/**
 * Date and time utilities for appointment scheduling
 * Handles timezone conversions and date calculations
 */

/**
 * Convert a local date and time to UTC ISO string
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} time - Time in HH:mm format
 * @param {string} timezone - Business timezone (e.g., 'UTC', 'America/New_York')
 * @returns {string} UTC ISO string
 */
export function localDateTimeToUTC(date, time, timezone = 'UTC') {
  try {
    // Create a date string in the format that Date constructor can parse
    const dateTimeString = `${date}T${time}:00`;
    
    if (timezone === 'UTC') {
      return new Date(dateTimeString + 'Z').toISOString();
    }
    
    // For non-UTC timezones, we need to handle the conversion
    // This is a simplified approach - in production, use a proper timezone library
    const localDate = new Date(dateTimeString);
    
    // Get timezone offset for the business timezone
    // Note: This is a simplified implementation
    const timezoneOffsets = {
      'America/New_York': -5, // EST (simplified, doesn't handle DST)
      'America/Los_Angeles': -8, // PST (simplified, doesn't handle DST)
      'Europe/London': 0, // GMT (simplified, doesn't handle BST)
      'Asia/Kolkata': 5.5, // IST
      'Australia/Sydney': 10 // AEST (simplified, doesn't handle DST)
    };
    
    const offset = timezoneOffsets[timezone] || 0;
    const utcTime = new Date(localDate.getTime() - (offset * 60 * 60 * 1000));
    
    return utcTime.toISOString();
  } catch (error) {
    console.error('Error converting local time to UTC:', error);
    // Fallback: treat as UTC
    return new Date(`${date}T${time}:00Z`).toISOString();
  }
}

/**
 * Convert UTC ISO string to local date and time
 * @param {string} utcISOString - UTC ISO string
 * @param {string} timezone - Business timezone
 * @returns {object} { date: 'YYYY-MM-DD', time: 'HH:mm' }
 */
export function utcToLocalDateTime(utcISOString, timezone = 'UTC') {
  try {
    const utcDate = new Date(utcISOString);
    
    if (timezone === 'UTC') {
      const date = utcDate.toISOString().split('T')[0];
      const time = utcDate.toISOString().split('T')[1].substring(0, 5);
      return { date, time };
    }
    
    // For non-UTC timezones, apply offset
    const timezoneOffsets = {
      'America/New_York': -5,
      'America/Los_Angeles': -8,
      'Europe/London': 0,
      'Asia/Kolkata': 5.5,
      'Australia/Sydney': 10
    };
    
    const offset = timezoneOffsets[timezone] || 0;
    const localTime = new Date(utcDate.getTime() + (offset * 60 * 60 * 1000));
    
    const date = localTime.toISOString().split('T')[0];
    const time = localTime.toISOString().split('T')[1].substring(0, 5);
    
    return { date, time };
  } catch (error) {
    console.error('Error converting UTC to local time:', error);
    return { date: '', time: '' };
  }
}

/**
 * Format a UTC ISO string for display in business timezone
 * @param {string} utcISOString - UTC ISO string
 * @param {string} timezone - Business timezone
 * @param {object} options - Formatting options
 * @returns {string} Formatted date/time string
 */
export function formatAppointmentTime(utcISOString, timezone = 'UTC', options = {}) {
  try {
    const { date, time } = utcToLocalDateTime(utcISOString, timezone);
    
    if (options.dateOnly) {
      return new Date(date).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    
    if (options.timeOnly) {
      const [hours, minutes] = time.split(':');
      const hour12 = parseInt(hours, 10) > 12 ? parseInt(hours, 10) - 12 : parseInt(hours, 10);
      const ampm = parseInt(hours, 10) >= 12 ? 'PM' : 'AM';
      return `${hour12 === 0 ? 12 : hour12}:${minutes} ${ampm}`;
    }
    
    // Full date and time
    const dateObj = new Date(`${date}T${time}:00`);
    return dateObj.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting appointment time:', error);
    return 'Invalid Date';
  }
}

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string} Today's date
 */
export function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get current time in HH:mm format
 * @returns {string} Current time
 */
export function getCurrentTime() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Check if two time periods overlap
 * @param {string} start1 - Start time 1 (UTC ISO)
 * @param {string} end1 - End time 1 (UTC ISO)
 * @param {string} start2 - Start time 2 (UTC ISO)
 * @param {string} end2 - End time 2 (UTC ISO)
 * @returns {boolean} True if periods overlap
 */
export function timePeriodsOverlap(start1, end1, start2, end2) {
  const s1 = new Date(start1).getTime();
  const e1 = new Date(end1).getTime();
  const s2 = new Date(start2).getTime();
  const e2 = new Date(end2).getTime();
  
  return s1 < e2 && s2 < e1;
}

/**
 * Add minutes to a time string
 * @param {string} timeString - Time in HH:MM format
 * @param {number} minutes - Minutes to add
 * @returns {string} New time in HH:MM format
 */
export function addMinutesToTime(timeString, minutes) {
  const [hours, mins] = timeString.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
}

/**
 * Get date range for filtering (e.g., this week, this month)
 * @param {string} range - 'today', 'week', 'month'
 * @returns {object} { fromDate, toDate } in YYYY-MM-DD format
 */
export function getDateRange(range = 'week') {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  switch (range) {
    case 'today':
      return { fromDate: todayStr, toDate: todayStr };
      
    case 'week': {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
      
      return {
        fromDate: startOfWeek.toISOString().split('T')[0],
        toDate: endOfWeek.toISOString().split('T')[0]
      };
    }
    
    case 'month': {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      return {
        fromDate: startOfMonth.toISOString().split('T')[0],
        toDate: endOfMonth.toISOString().split('T')[0]
      };
    }
    
    default:
      return { fromDate: todayStr, toDate: todayStr };
  }
}

/**
 * Compute available time slots for a given date and working hours
 * @param {object} options - Configuration object
 * @param {Array} options.workingHours - Array of { weekday: 0-6, from: "09:00", to: "17:00" }
 * @param {number} options.serviceDuration - Service duration in minutes
 * @param {number} options.bufferBefore - Buffer before appointment in minutes (default: 0)
 * @param {number} options.bufferAfter - Buffer after appointment in minutes (default: 0)
 * @param {string} options.date - Date in YYYY-MM-DD format
 * @param {string} options.timezone - Business timezone (default: 'UTC')
 * @returns {Array} Array of slot objects with start time and metadata
 */
export function computeSlots({
  workingHours = [],
  serviceDuration = 30,
  bufferBefore = 0,
  bufferAfter = 0,
  date,
  timezone = 'UTC'
}) {
  if (!date || !workingHours.length) {
    return [];
  }

  try {
    // Get the weekday for the given date (0 = Sunday, 6 = Saturday)
    const dateObj = new Date(date + 'T12:00:00'); // Use noon to avoid timezone issues
    const weekday = dateObj.getDay();

    // Find working hours for this weekday
    const dayWorkingHours = workingHours.filter(wh => wh.weekday === weekday);
    
    if (dayWorkingHours.length === 0) {
      return []; // No working hours for this day
    }

    const slots = [];
    const totalSlotDuration = serviceDuration + bufferBefore + bufferAfter;

    // Process each working hours segment for the day
    dayWorkingHours.forEach(({ from, to }) => {
      const [startHour, startMin] = from.split(':').map(Number);
      const [endHour, endMin] = to.split(':').map(Number);
      
      // Convert to minutes since midnight
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      // Generate slots within this working hours segment
      let currentMinutes = startMinutes;
      
      while (currentMinutes + totalSlotDuration <= endMinutes) {
        const slotStartHour = Math.floor(currentMinutes / 60);
        const slotStartMin = currentMinutes % 60;
        
        // Format time as HH:MM
        const timeString = `${slotStartHour.toString().padStart(2, '0')}:${slotStartMin.toString().padStart(2, '0')}`;
        
        // Create slot object
        const slot = {
          time: timeString,
          startTime: timeString,
          endTime: addMinutesToTime(timeString, serviceDuration),
          date: date,
          weekday: weekday,
          serviceDuration: serviceDuration,
          bufferBefore: bufferBefore,
          bufferAfter: bufferAfter,
          totalDuration: totalSlotDuration,
          // For local timezone conversion
          localDateTime: `${date}T${timeString}:00`,
          // Convert to UTC for comparison with appointments
          startUTC: localDateTimeToUTC(date, timeString, timezone),
          endUTC: localDateTimeToUTC(date, addMinutesToTime(timeString, serviceDuration), timezone)
        };
        
        slots.push(slot);
        
        // Move to next slot (typically 15-30 minute intervals)
        // For now, use service duration as the step, but could be made configurable
        const slotInterval = Math.max(15, Math.min(serviceDuration, 60)); // 15-60 min intervals
        currentMinutes += slotInterval;
      }
    });

    return slots.sort((a, b) => a.time.localeCompare(b.time));

  } catch (error) {
    console.error('Error computing slots:', error);
    return [];
  }
}

/**
 * Check if a slot overlaps with any appointments
 * @param {object} slot - Slot object from computeSlots
 * @param {Array} appointments - Array of appointment objects
 * @returns {boolean} True if slot is occupied
 */
export function isSlotOccupied(slot, appointments = []) {
  return appointments.some(appointment => {
    return timePeriodsOverlap(
      slot.startUTC,
      slot.endUTC,
      appointment.startUTC,
      appointment.endUTC
    );
  });
}

/**
 * Get appointments that overlap with a specific slot
 * @param {object} slot - Slot object from computeSlots  
 * @param {Array} appointments - Array of appointment objects
 * @returns {Array} Array of overlapping appointments
 */
export function getSlotAppointments(slot, appointments = []) {
  return appointments.filter(appointment => {
    return timePeriodsOverlap(
      slot.startUTC,
      slot.endUTC,
      appointment.startUTC,
      appointment.endUTC
    );
  });
}

/**
 * Format slot time for display
 * @param {object} slot - Slot object
 * @param {object} options - Formatting options
 * @returns {string} Formatted time string
 */
export function formatSlotTime(slot, options = {}) {
  if (options.showEndTime) {
    return `${slot.startTime} - ${slot.endTime}`;
  }
  return slot.startTime;
}

/**
 * Generate a summary of slot availability for a day
 * @param {Array} slots - Array of slot objects
 * @param {Array} appointments - Array of appointment objects
 * @returns {object} Summary object with counts and percentages
 */
export function getDaySummary(slots, appointments = []) {
  const totalSlots = slots.length;
  const occupiedSlots = slots.filter(slot => isSlotOccupied(slot, appointments)).length;
  const availableSlots = totalSlots - occupiedSlots;
  
  return {
    totalSlots,
    occupiedSlots,
    availableSlots,
    occupancyRate: totalSlots > 0 ? (occupiedSlots / totalSlots * 100).toFixed(1) : 0,
    availabilityRate: totalSlots > 0 ? (availableSlots / totalSlots * 100).toFixed(1) : 100
  };
}
import React from 'react';
import CalendarShell from '../components/CalendarShell';

/**
 * Calendar Page - Main calendar view for appointment scheduling
 * Features visual day view with appointment slots and availability
 */
export default function Calendar() {
  return (
    <div className="calendar-page">
      <CalendarShell />
    </div>
  );
}
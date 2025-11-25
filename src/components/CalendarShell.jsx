import React, { useState, useEffect, useMemo } from 'react';
import storage from '../services/storageFactory.js';
import { computeSlots, isSlotOccupied, getDaySummary, formatSlotTime } from '../utils/dateUtils.js';

/**
 * CalendarShell - Visual calendar component with day view
 * Shows appointment slots and availability for a specific date
 */
export default function CalendarShell() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD format
  });
  
  const [selectedTeamMember, setSelectedTeamMember] = useState('');
  const [selectedService, setSelectedService] = useState('');
  
  const [teamMembers, setTeamMembers] = useState([]);
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [business, setBusiness] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError('');
        
        // Load business info for working hours and timezone
        const businessResult = await storage.getBusiness();
        if (businessResult.success) {
          setBusiness(businessResult.data);
        }
        
        // Load team members
        const teamResult = await storage.getTeamMembers();
        if (teamResult.success) {
          setTeamMembers(teamResult.data);
          // Auto-select first team member if available
          if (teamResult.data.length > 0 && !selectedTeamMember) {
            setSelectedTeamMember(teamResult.data[0].id);
          }
        }
        
        // Load services
        const servicesResult = await storage.getServices();
        if (servicesResult.success) {
          setServices(servicesResult.data);
          // Auto-select first service if available
          if (servicesResult.data.length > 0 && !selectedService) {
            setSelectedService(servicesResult.data[0].id);
          }
        }
        
      } catch (err) {
        console.error('Error loading calendar data:', err);
        setError('Failed to load calendar data');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);
  
  // Load appointments when date or team member changes
  useEffect(() => {
    async function loadAppointments() {
      if (!selectedDate || !selectedTeamMember) return;
      
      try {
        // Load all appointments and filter by date and team member
        const result = await storage.getAppointments();
        if (result.success) {
          const filteredAppointments = result.data.filter(apt => {
            const aptDate = apt.startUTC.split('T')[0];
            return aptDate === selectedDate && apt.teamMemberId === selectedTeamMember;
          });
          setAppointments(filteredAppointments);
        }
      } catch (err) {
        console.error('Error loading appointments:', err);
      }
    }
    
    loadAppointments();
  }, [selectedDate, selectedTeamMember]);
  
  // Compute available slots based on current selection
  const slots = useMemo(() => {
    if (!business?.workingHours || !selectedService || !selectedDate) {
      return [];
    }
    
    const service = services.find(s => s.id === selectedService);
    if (!service) return [];
    
    return computeSlots({
      workingHours: business.workingHours,
      serviceDuration: service.durationMinutes,
      bufferBefore: service.bufferBefore || 0,
      bufferAfter: service.bufferAfter || 0,
      date: selectedDate,
      timezone: business.timezone || 'UTC'
    });
  }, [business, selectedService, selectedDate, services]);
  
  // Get availability summary for the day
  const daySummary = useMemo(() => {
    return getDaySummary(slots, appointments);
  }, [slots, appointments]);
  
  // Get current service details
  const selectedServiceObj = useMemo(() => {
    return services.find(s => s.id === selectedService);
  }, [services, selectedService]);
  
  const selectedTeamMemberObj = useMemo(() => {
    return teamMembers.find(tm => tm.id === selectedTeamMember);
  }, [teamMembers, selectedTeamMember]);

  if (loading) {
    return (
      <div className="calendar-shell">
        <div className="calendar-loading">
          <p>Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="calendar-shell">
        <div className="calendar-error">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-shell">
      {/* Modern Calendar Controls */}
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">
            🗓️ Calendar View
          </h1>
          <p className="card-subtitle">Schedule and manage appointments visually</p>
        </div>
        <div className="calendar-controls-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="calendar-date">📅 Date</label>
            <input
              id="calendar-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="calendar-team-member">👥 Team Member</label>
            <select
              id="calendar-team-member"
              value={selectedTeamMember}
              onChange={(e) => setSelectedTeamMember(e.target.value)}
              className="form-select"
            >
              <option value="">Select team member</option>
              {teamMembers.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name} - {member.role}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="calendar-service">💼 Service</label>
            <select
              id="calendar-service"
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="form-select"
            >
              <option value="">Select service</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name} ({service.durationMinutes} min)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Calendar Info */}
      {selectedServiceObj && selectedTeamMemberObj && (
        <div className="calendar-info-card">
          <div className="calendar-info-grid">
            <div className="info-item">
              <span className="info-icon">💼</span>
              <div>
                <strong>{selectedServiceObj.name}</strong><br/>
                <small>{selectedServiceObj.durationMinutes} minutes • ${selectedServiceObj.price}</small>
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon">👤</span>
              <div>
                <strong>{selectedTeamMemberObj.name}</strong><br/>
                <small>{selectedTeamMemberObj.role}</small>
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon">📅</span>
              <div>
                <strong>{new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}</strong><br/>
                <small>{new Date(selectedDate + 'T12:00:00').getFullYear()}</small>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Day Summary */}
      <div className="stats-card">
        <div className="stats-header">
          <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--gray-800)' }}>📊 Daily Overview</h3>
        </div>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value total">{daySummary.totalSlots}</div>
            <div className="stat-label">Total Slots</div>
          </div>
          <div className="stat-item">
            <div className="stat-value available">{daySummary.availableSlots}</div>
            <div className="stat-label">Available</div>
          </div>
          <div className="stat-item">
            <div className="stat-value booked">{daySummary.occupiedSlots}</div>
            <div className="stat-label">Booked</div>
          </div>
          <div className="stat-item">
            <div className="stat-value occupancy">{daySummary.occupancyRate}%</div>
            <div className="stat-label">Occupancy</div>
          </div>
        </div>
      </div>
      
      {/* Time Slots Grid */}
      <div className="slots-card">
        {slots.length === 0 ? (
          <div className="no-slots">
            <div className="no-slots-icon">📅</div>
            <h3 style={{ margin: '0 0 var(--space-2) 0', color: 'var(--gray-700)' }}>No Time Slots Available</h3>
            <p style={{ margin: 0, color: 'var(--gray-500)' }}>
              {!business?.workingHours?.length 
                ? 'Please configure working hours in business settings'
                : 'No available slots for the selected date and service'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="slots-header">
              <h3 className="slots-title">
                ⏰ Available Time Slots
              </h3>
              <p className="slots-subtitle">
                {slots.length} slots available • {selectedServiceObj?.durationMinutes || 0} minute appointments
              </p>
            </div>
            
            <div className="slots-grid">
              {slots.map((slot, index) => {
                const isOccupied = isSlotOccupied(slot, appointments);
                const slotAppointments = appointments.filter(apt => {
                  return new Date(apt.startUTC) <= new Date(slot.endUTC) && 
                         new Date(apt.endUTC) > new Date(slot.startUTC);
                });
                
                return (
                  <div
                    key={index}
                    className={`time-slot ${isOccupied ? 'occupied' : 'available'}`}
                    title={isOccupied ? 
                      `Booked: ${slotAppointments.map(a => a.customerName).join(', ')}` : 
                      'Available for booking'
                    }
                  >
                    <div className="slot-time">
                      🕐 {formatSlotTime(slot, { showEndTime: true })}
                    </div>
                    
                    <div className="slot-status">
                      {isOccupied ? (
                        <div className="slot-booked">
                          <span className="status-indicator">🔒</span>
                          <span className="status-text">Booked</span>
                        </div>
                      ) : (
                        <div className="slot-available">
                          <span className="status-indicator">✅</span>
                          <span className="status-text">Available</span>
                        </div>
                      )}
                    </div>
                    
                    {isOccupied && slotAppointments.length > 0 && (
                      <div className="appointment-details">
                        {slotAppointments.map(apt => (
                          <div key={apt.id} className="appointment-item">
                            👤 {apt.customerName}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
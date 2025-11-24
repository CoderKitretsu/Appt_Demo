import React, { useState, useEffect } from 'react';
import { ensureStorageReady } from '../services/storageFactory.js';
import storage from '../services/storageFactory.js';
import { 
  formatAppointmentTime, 
  getTodayDate, 
  getDateRange, 
  localDateTimeToUTC,
  utcToLocalDateTime 
} from '../utils/dateUtils.js';

// Import AppointmentForm component
import AppointmentForm from '../components/AppointmentForm.jsx';

/**
 * Appointments - Main page for viewing and managing appointments
 */
const Appointments = () => {
  const [businessId, setBusinessId] = useState(null);
  const [business, setBusiness] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form and modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);

  // Filter state
  const [filters, setFilters] = useState({
    fromDate: getDateRange('week').fromDate,
    toDate: getDateRange('week').toDate,
    teamMemberId: '',
    serviceId: '',
    status: ''
  });

  // Status options for appointments
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'booked', label: 'Booked' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'rescheduled', label: 'Rescheduled' },
    { value: 'canceled', label: 'Canceled' },
    { value: 'completed', label: 'Completed' }
  ];

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        await ensureStorageReady();
        
        // Get business data
        const exportData = await storage.exportAll();
        const businessList = Object.values(exportData.businesses || {});
        
        if (businessList.length > 0) {
          const businessData = businessList[0];
          setBusinessId(businessData.id);
          setBusiness(businessData);
          
          // Load team members and services in parallel
          const [teamMembersList, servicesList] = await Promise.all([
            storage.listTeamMembers(businessData.id),
            storage.listServices(businessData.id)
          ]);
          
          setTeamMembers(teamMembersList || []);
          setServices(servicesList || []);
          
          // Load initial appointments
          await loadAppointments(businessData.id, filters);
        } else {
          console.warn('No businesses found. User needs to complete onboarding first.');
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Load appointments when filters change
  useEffect(() => {
    if (businessId) {
      loadAppointments(businessId, filters);
    }
  }, [businessId, filters]);

  // Load appointments from storage
  const loadAppointments = async (bizId, currentFilters) => {
    try {
      // Convert filter dates to UTC for storage query
      const fromUTC = currentFilters.fromDate ? 
        localDateTimeToUTC(currentFilters.fromDate, '00:00', business?.timezone || 'UTC') : null;
      const toUTC = currentFilters.toDate ? 
        localDateTimeToUTC(currentFilters.toDate, '23:59', business?.timezone || 'UTC') : null;

      const filterObj = {
        businessId: bizId,
        ...(fromUTC && { startUTC: fromUTC }),
        ...(toUTC && { endUTC: toUTC }),
        ...(currentFilters.teamMemberId && { teamMemberId: currentFilters.teamMemberId }),
        ...(currentFilters.serviceId && { serviceId: currentFilters.serviceId }),
        ...(currentFilters.status && { status: currentFilters.status })
      };

      const appointmentsList = await storage.listAppointments(filterObj);
      setAppointments(appointmentsList || []);
    } catch (err) {
      console.error('Failed to load appointments:', err);
      setError(err);
    }
  };

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle quick date range selection
  const handleQuickDateRange = (range) => {
    const dateRange = getDateRange(range);
    setFilters(prev => ({
      ...prev,
      fromDate: dateRange.fromDate,
      toDate: dateRange.toDate
    }));
  };

  // Handle new appointment
  const handleNewAppointment = () => {
    setEditingAppointment(null);
    setIsFormOpen(true);
  };

  // Handle edit appointment
  const handleEditAppointment = (appointment) => {
    setEditingAppointment(appointment);
    setIsFormOpen(true);
  };

  // Handle appointment status change
  const handleStatusChange = async (appointment, newStatus) => {
    try {
      await storage.updateAppointment(appointment.id, { status: newStatus });
      await loadAppointments(businessId, filters);
    } catch (err) {
      console.error('Failed to update appointment status:', err);
      alert(`Failed to update status: ${err.message}`);
    }
  };

  // Handle form close
  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingAppointment(null);
  };

  // Handle form success
  const handleFormSuccess = async () => {
    await loadAppointments(businessId, filters);
  };

  // Get team member name by ID
  const getTeamMemberName = (teamMemberId) => {
    const member = teamMembers.find(m => m.id === teamMemberId);
    return member ? member.name : 'Auto-assigned';
  };

  // Get service name by ID
  const getServiceName = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : 'Unknown Service';
  };

  // Status badge styling
  const getStatusBadgeClass = (status) => {
    const baseClass = 'inline-flex px-2 py-1 text-xs font-semibold rounded-full';
    
    switch (status?.toLowerCase()) {
      case 'booked':
        return `${baseClass} bg-blue-100 text-blue-800`;
      case 'confirmed':
        return `${baseClass} bg-green-100 text-green-800`;
      case 'rescheduled':
        return `${baseClass} bg-yellow-100 text-yellow-800`;
      case 'canceled':
        return `${baseClass} bg-red-100 text-red-800`;
      case 'completed':
        return `${baseClass} bg-gray-100 text-gray-800`;
      default:
        return `${baseClass} bg-gray-100 text-gray-600`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading appointments...</div>
      </div>
    );
  }

  if (!businessId) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12 bg-yellow-50 border border-yellow-200 rounded-md">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">Business Setup Required</h2>
          <p className="text-yellow-700 mb-4">
            You need to complete your business setup before managing appointments.
          </p>
          <a
            href="/onboarding"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Complete Onboarding
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Appointments</h1>
            <p className="text-gray-600">
              Manage customer appointments and schedules.
            </p>
          </div>
          <button
            onClick={handleNewAppointment}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
          >
            + New Appointment
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
        
        {/* Quick Date Ranges */}
        <div className="flex gap-2 mb-4">
          {[
            { key: 'today', label: 'Today' },
            { key: 'week', label: 'This Week' },
            { key: 'month', label: 'This Month' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleQuickDateRange(key)}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => handleFilterChange('fromDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => handleFilterChange('toDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          {/* Team Member Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team Member</label>
            <select
              value={filters.teamMemberId}
              onChange={(e) => handleFilterChange('teamMemberId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Staff</option>
              {teamMembers.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          {/* Service Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
            <select
              value={filters.serviceId}
              onChange={(e) => handleFilterChange('serviceId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Services</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-700">{error.message}</p>
        </div>
      )}

      {/* Appointments Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">
            Appointments ({appointments.length})
          </h3>
        </div>

        {appointments.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Appointments Found</h3>
            <p className="text-gray-600 mb-4">
              No appointments match your current filters. Try adjusting the date range or clearing filters.
            </p>
            <button
              onClick={handleNewAppointment}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create First Appointment
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatAppointmentTime(appointment.startUTC, business?.timezone, { dateOnly: true })}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatAppointmentTime(appointment.startUTC, business?.timezone, { timeOnly: true })} - 
                        {formatAppointmentTime(appointment.endUTC, business?.timezone, { timeOnly: true })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getServiceName(appointment.serviceId)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{appointment.customer?.name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{appointment.customer?.phone || appointment.customer?.email || ''}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getTeamMemberName(appointment.teamMemberId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadgeClass(appointment.status)}>
                        {appointment.status || 'booked'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditAppointment(appointment)}
                          className="text-blue-600 hover:text-blue-900 hover:underline"
                        >
                          Edit
                        </button>
                        
                        {/* Quick Status Actions */}
                        {appointment.status === 'booked' && (
                          <button
                            onClick={() => handleStatusChange(appointment, 'confirmed')}
                            className="text-green-600 hover:text-green-900 hover:underline"
                          >
                            Confirm
                          </button>
                        )}
                        
                        {(appointment.status === 'booked' || appointment.status === 'confirmed') && (
                          <button
                            onClick={() => handleStatusChange(appointment, 'completed')}
                            className="text-gray-600 hover:text-gray-900 hover:underline"
                          >
                            Complete
                          </button>
                        )}
                        
                        {appointment.status !== 'canceled' && appointment.status !== 'completed' && (
                          <button
                            onClick={() => handleStatusChange(appointment, 'canceled')}
                            className="text-red-600 hover:text-red-900 hover:underline"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* AppointmentForm Modal */}
      <AppointmentForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        appointment={editingAppointment}
        businessId={businessId}
        business={business}
        onSuccess={handleFormSuccess}
      />

      {/* Development Info */}
      {import.meta.env.MODE === 'development' && (
        <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Development Info</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p><strong>Business:</strong> {business?.name} ({business?.timezone})</p>
            <p><strong>Appointments:</strong> {appointments.length}</p>
            <p><strong>Filter Range:</strong> {filters.fromDate} to {filters.toDate}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
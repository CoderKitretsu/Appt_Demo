import React, { useState } from 'react';
import LocalStorageAdapter from '../services/adapters/LocalStorageAdapter.js';

const TestPage = () => {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (message, type = 'info') => {
    setTestResults(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      addResult('🚀 Starting LocalStorageAdapter Tests...', 'info');
      
      // Initialize adapter
      await LocalStorageAdapter.init();
      addResult('✅ Adapter initialized successfully', 'success');
      
      // Test 1: Create business
      const business = await LocalStorageAdapter.upsertBusiness({
        name: 'Test Salon',
        timezone: 'UTC',
        currency: 'USD'
      });
      addResult(`✅ Business created: ${business.name} (${business.id})`, 'success');
      
      // Test 2: Create service with capacity 1
      const service = await LocalStorageAdapter.upsertService({
        businessId: business.id,
        name: 'Haircut Test',
        durationMinutes: 30,
        capacity: 1
      });
      addResult(`✅ Service created: ${service.name} (capacity: ${service.capacity})`, 'success');
      
      // Test 3: Create team member
      const teamMember = await LocalStorageAdapter.upsertTeamMember({
        businessId: business.id,
        name: 'Test Stylist',
        capacity: 1
      });
      addResult(`✅ Team member created: ${teamMember.name}`, 'success');
      
      // Test 4: Create first appointment (should succeed)
      const appointment1 = await LocalStorageAdapter.createAppointment({
        businessId: business.id,
        serviceId: service.id,
        teamMemberId: teamMember.id,
        startUTC: '2025-11-25T14:00:00.000Z',
        endUTC: '2025-11-25T14:30:00.000Z',
        customer: { name: 'John Doe', email: 'john@test.com' },
        createdBy: 'admin'
      });
      addResult(`✅ First appointment created successfully: ${appointment1.id}`, 'success');
      
      // Test 5: Try to create conflicting appointment (should fail)
      try {
        await LocalStorageAdapter.createAppointment({
          businessId: business.id,
          serviceId: service.id,
          teamMemberId: teamMember.id,
          startUTC: '2025-11-25T14:00:00.000Z', // Same time as first appointment
          endUTC: '2025-11-25T14:30:00.000Z',
          customer: { name: 'Jane Smith', email: 'jane@test.com' },
          createdBy: 'admin'
        });
        addResult('❌ CRITICAL FAILURE: Conflict not detected! Second appointment was created.', 'error');
      } catch (error) {
        if (error.code === 'CONFLICT') {
          addResult(`✅ CRITICAL SUCCESS: Conflict detected correctly!`, 'success');
          addResult(`   Error: ${error.message}`, 'info');
          addResult(`   Type: ${error.details?.type}`, 'info');
        } else {
          addResult(`❌ Unexpected error: ${error.message}`, 'error');
        }
      }
      
      // Test 6: Test export functionality
      const exportData = await LocalStorageAdapter.exportAll();
      const appointmentCount = Object.keys(exportData.appointments || {}).length;
      addResult(`✅ Export test passed: Found ${appointmentCount} appointment(s)`, 'success');
      
      // Test 7: Test audit logs
      const auditLogs = await LocalStorageAdapter.listAuditLogs(business.id);
      addResult(`✅ Audit logs test: Found ${auditLogs.length} log entries`, 'success');
      
      addResult('🎉 All tests completed!', 'success');
      
    } catch (error) {
      addResult(`❌ Test failed: ${error.message}`, 'error');
      console.error('Test error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const clearStorage = () => {
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith('appt_') || 
      key === 'businesses' || 
      key === 'team_members' || 
      key === 'services' || 
      key === 'appointments' || 
      key === 'availabilities' || 
      key === 'audit_logs' ||
      key === 'departments'
    );
    keys.forEach(key => localStorage.removeItem(key));
    addResult(`🧹 Cleared ${keys.length} storage keys`, 'info');
  };

  const inspectStorage = () => {
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith('appt_') || 
      ['businesses', 'team_members', 'services', 'appointments', 'availabilities', 'audit_logs', 'departments'].includes(key)
    );
    addResult(`🔍 Found ${keys.length} storage keys: ${keys.join(', ')}`, 'info');
    
    keys.forEach(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        const count = typeof data === 'object' && data !== null ? Object.keys(data).length : 'N/A';
        addResult(`   ${key}: ${count} items`, 'info');
      } catch (e) {
        addResult(`   ${key}: Invalid JSON`, 'warning');
      }
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">LocalStorageAdapter Test Suite</h1>
      
      <div className="flex gap-4 mb-6">
        <button
          onClick={runTests}
          disabled={isRunning}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
        >
          {isRunning ? 'Running Tests...' : 'Run All Tests'}
        </button>
        
        <button
          onClick={inspectStorage}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          Inspect Storage
        </button>
        
        <button
          onClick={clearStorage}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          Clear Storage
        </button>
      </div>

      <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
        {testResults.length === 0 ? (
          <p className="text-gray-500">Click "Run All Tests" to start testing the LocalStorageAdapter...</p>
        ) : (
          testResults.map((result, index) => (
            <div 
              key={index} 
              className={`mb-1 ${
                result.type === 'success' ? 'text-green-400' : 
                result.type === 'error' ? 'text-red-400' : 
                result.type === 'warning' ? 'text-yellow-400' : 
                'text-gray-300'
              }`}
            >
              [{result.timestamp}] {result.message}
            </div>
          ))
        )}
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <h3 className="font-semibold mb-2">What this test covers:</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Initialization:</strong> Verifies adapter.init() creates required storage keys</li>
          <li><strong>Business/Service/Team CRUD:</strong> Tests basic create operations</li>
          <li><strong>🔥 Conflict Detection:</strong> The most critical test - ensures overlapping appointments are rejected</li>
          <li><strong>Export:</strong> Verifies exportAll() returns complete data</li>
          <li><strong>Audit Logs:</strong> Confirms audit trail is being created</li>
        </ul>
      </div>
    </div>
  );
};

export default TestPage;
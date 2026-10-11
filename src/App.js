import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// Import Screens
import LandingScreen from './screens/LandingScreen';
import DashboardScreen from './screens/DashboardScreen';
import ReportSubmitScreen from './screens/ReportSubmitScreen';
import HotlineScreen from './screens/HotlineScreen';
import ReportTrackerScreen from './screens/ReportTrackerScreen';
import DangerZoneMapScreen from './screens/DangerZoneMapScreen';
import ProfileScreen from './screens/ProfileScreen';
import AdminScreen from './screens/AdminScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('landing');
  const [userRole, setUserRole] = useState('CITIZEN');
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all reports from Supabase PostgreSQL
  const fetchReports = async () => {
    setIsLoading(true);
    const { data, error } = await supabase['from']('reports')['select']('*')['order']('created_at', { ascending: false });
    if (error) {
      console['error']('Database Fetch Error:', error);
    } else {
      setReports(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Save new report into PostgreSQL
  const handleAddNewReport = async (newReportObj) => {
    const dbPayload = {
      id: newReportObj['id'],
      sender_name: newReportObj['senderName'] || 'Resident',
      user_role: newReportObj['userRole'] || userRole,
      user_phone: newReportObj['userPhone'] || '',
      category: newReportObj['category'],
      severity: newReportObj['severity'],
      title: newReportObj['title'],
      location: newReportObj['location'],
      coordinates: newReportObj['coordinates'],
      status: 'PENDING',
      details: newReportObj['details']
    };

    const { error } = await supabase['from']('reports')['insert']([dbPayload]);
    if (error) {
      alert('⚠️ Error saving report to cloud database.');
      console['error'](error);
    } else {
      fetchReports();
    }
  };

  // Delete report permanently from PostgreSQL
  const handleDeleteReport = async (targetId) => {
    const { error } = await supabase['from']('reports')['delete']()['eq']('id', targetId);
    if (error) {
      alert('⚠️ Error removing report from database.');
      console['error'](error);
    } else {
      fetchReports();
    }
  };

  return (
    <div style={styles['appContainer']}>
      {/* Top Demo Bar */}
      <div style={styles['demoToolbar']}>
        <div style={styles['roleButtonGroup']}>
          <button
            style={userRole === 'CITIZEN' ? styles['roleBtnActive'] : styles['roleBtnInactive']}
            onClick={() => { setUserRole('CITIZEN'); setCurrentScreen('dashboard'); }}
          >
            Citizen
          </button>
          <button
            style={userRole === 'GUEST' ? styles['roleBtnActive'] : styles['roleBtnInactive']}
            onClick={() => { setUserRole('GUEST'); setCurrentScreen('dashboard'); }}
          >
            Guest
          </button>
          <button
            style={userRole === 'ADMIN' ? styles['roleBtnActive'] : styles['roleBtnInactive']}
            onClick={() => { setUserRole('ADMIN'); setCurrentScreen('admin'); }}
          >
            Admin
          </button>
        </div>

        <button style={styles['refreshBtn']} onClick={fetchReports}>
          🔄 Sync DB ({reports['length']})
        </button>
      </div>

      {/* Main Screen Router */}
      <div style={styles['screenWrapper']}>
        {currentScreen === 'landing' && (
          <LandingScreen
            onResidentAccess={() => { setUserRole('CITIZEN'); setCurrentScreen('dashboard'); }}
            onGuestAccess={() => { setUserRole('GUEST'); setCurrentScreen('dashboard'); }}
          />
        )}

        {currentScreen === 'dashboard' && (
          <DashboardScreen
            onNavigate={(s) => setCurrentScreen(s)}
            userRole={userRole}
            onOpenProfile={() => setCurrentScreen('profile')}
          />
        )}

        {currentScreen === 'submit-report' && (
          <ReportSubmitScreen
            onBack={() => setCurrentScreen('dashboard')}
            onSubmitSuccess={() => setCurrentScreen('dashboard')}
            onSubmitReport={handleAddNewReport}
            userRole={userRole}
          />
        )}

        {currentScreen === 'hotlines' && (
          <HotlineScreen
            onBack={() => setCurrentScreen('dashboard')}
            onOpenProfile={() => setCurrentScreen('profile')}
          />
        )}

        {currentScreen === 'tracker' && (
          <ReportTrackerScreen
            onBack={() => setCurrentScreen('dashboard')}
            reports={reports}
          />
        )}

        {currentScreen === 'danger-map' && (
          <DangerZoneMapScreen
            onBack={() => setCurrentScreen('dashboard')}
            reports={reports}
          />
        )}

        {currentScreen === 'profile' && (
          <ProfileScreen
            onBack={() => setCurrentScreen('dashboard')}
            userRole={userRole}
          />
        )}

        {currentScreen === 'admin' && (
          <AdminScreen
            onBack={() => setCurrentScreen('dashboard')}
            reports={reports}
            onDeleteReport={handleDeleteReport}
          />
        )}
      </div>
    </div>
  );
}

const styles = {
  appContainer: { maxWidth: '440px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#CBD5E1', fontFamily: "'Inter', sans-serif" },
  demoToolbar: { backgroundColor: '#0F172A', color: '#FFFFFF', padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  roleButtonGroup: { display: 'flex', gap: '6px' },
  roleBtnActive: { backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  roleBtnInactive: { backgroundColor: '#1E293B', color: '#94A3B8', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: '600', cursor: 'pointer' },
  refreshBtn: { backgroundColor: '#334155', color: '#F1F5F9', border: '1px solid #475569', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', cursor: 'pointer' },
  screenWrapper: { backgroundColor: '#F8FAFC', minHeight: 'calc(100vh - 40px)', paddingBottom: '16px' }
};

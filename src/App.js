import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// Import All UI Screens
import LandingScreen from './screens/LandingScreen';
import DashboardScreen from './screens/DashboardScreen';
import ReportSubmitScreen from './screens/ReportSubmitScreen';
import HotlinesScreen from './screens/HotlineScreen';
import ReportTrackerScreen from './screens/ReportTrackerScreen';
import DangerZoneMapScreen from './screens/DangerZoneMapScreen';
import AdminScreen from './screens/AdminScreen';
import ProfileScreen from './screens/ProfileScreen';

/**
 * Project AGAP Batangas - Real-World Application Router
 */
export default function App() {
  const [currentScreen, setCurrentScreen] = useState('landing'); 
  const [userRole, setUserRole] = useState('GUEST'); 
  const [userProfile, setUserProfile] = useState(null);

  // Auto-detect existing device profile on app load
  useEffect(() => {
    checkExistingDeviceProfile();
  }, []);

  const checkExistingDeviceProfile = async () => {
    let localDeviceId = localStorage.getItem('agap_device_id');
    if (!localDeviceId) {
      localDeviceId = 'DEV-' + Math.floor(100000 + Math.random() * 900000);
      localStorage.setItem('agap_device_id', localDeviceId);
    }

    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('device_id', localDeviceId)
        .maybeSingle();

      if (data) {
        setUserProfile(data);
        setUserRole(data.user_role || 'GUEST');
      }
    } catch (err) {
      console.log('No profile found yet for this device.');
    }
  };

  // Landing Screen: User selects "YES, I live in Batangas"
  const handleResidentAccess = () => {
    if (userProfile && userProfile.full_name) {
      // If already registered, go straight to dashboard
      setCurrentScreen('dashboard');
    } else {
      // Direct to Profile screen to fill up details
      setCurrentScreen('profile');
    }
  };

  // Landing Screen: User selects "NO, I live outside Batangas"
  const handleGuestAccess = () => {
    setUserRole('GUEST');
    setCurrentScreen('dashboard');
  };

  const handleNavigate = (screenKey) => {
    setCurrentScreen(screenKey);
  };

  const handleBackToDashboard = () => {
    setCurrentScreen('dashboard');
  };

  const handleAdminLogin = () => {
    setUserRole('ADMIN');
    setCurrentScreen('admin');
  };

  return (
    <div style={styles.appContainer}>
      <div style={styles.screenWrapper}>
        {/* 1. Landing Screen */}
        {currentScreen === 'landing' && (
          <LandingScreen
            onResidentAccess={handleResidentAccess}
            onGuestAccess={handleGuestAccess}
          />
        )}

        {/* 2. Main Dashboard */}
        {currentScreen === 'dashboard' && (
          <DashboardScreen
            onNavigate={handleNavigate}
            userRole={userRole}
            onOpenProfile={() => setCurrentScreen('profile')}
          />
        )}

        {/* 3. Profile & Residency Signup Screen */}
        {currentScreen === 'profile' && (
          <ProfileScreen
            onBack={handleBackToDashboard}
            onAdminLogin={handleAdminLogin}
          />
        )}

        {/* 4. Submit Hazard Report */}
        {currentScreen === 'submit-report' && (
          <ReportSubmitScreen
            onBack={handleBackToDashboard}
            onSubmitSuccess={handleBackToDashboard}
            userRole={userRole}
          />
        )}

        {/* 5. Emergency Hotline Directory */}
        {currentScreen === 'hotlines' && (
          <HotlinesScreen
            onBack={handleBackToDashboard}
          />
        )}

        {/* 6. Report Tracker */}
        {currentScreen === 'tracker' && (
          <ReportTrackerScreen
            onBack={handleBackToDashboard}
          />
        )}

        {/* 7. Danger Zone Risk Map */}
        {currentScreen === 'danger-map' && (
          <DangerZoneMapScreen
            onBack={handleBackToDashboard}
          />
        )}

        {/* 8. Admin Command Center */}
        {currentScreen === 'admin' && (
          <AdminScreen
            onBack={handleBackToDashboard}
          />
        )}
      </div>
    </div>
  );
}

const styles = {
  appContainer: {
    minHeight: '100vh',
    backgroundColor: '#0F172A',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: "'Inter', sans-serif"
  },
  screenWrapper: {
    width: '100%',
    maxWidth: '440px',
    minHeight: '100vh',
    backgroundColor: '#F8FAFC',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
  }
};
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function DashboardScreen({ onNavigate, userRole = 'GUEST', onOpenProfile }) {
  const [userProfile, setUserProfile] = useState(null);
  const [liveFeed, setLiveFeed] = useState([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);

  useEffect(() => {
    fetchDeviceProfile();
    fetchLiveHazardFeed();
  }, [userRole]);

  const fetchDeviceProfile = async () => {
    const localDeviceId = localStorage.getItem('agap_device_id');
    if (!localDeviceId) return;

    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('device_id', localDeviceId)
        .maybeSingle();

      if (data) setUserProfile(data);
    } catch (err) {
      console.log('No registered profile for device.');
    }
  };

  const fetchLiveHazardFeed = async () => {
    setIsLoadingFeed(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('status', 'APPROVED')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      if (data) setLiveFeed(data);
    } catch (err) {
      console.error('Feed error:', err.message);
    } finally {
      setIsLoadingFeed(false);
    }
  };

  const handleNav = (screenKey) => {
    if (typeof onNavigate === 'function') {
      onNavigate(screenKey);
    }
  };

  const getGreetingUsername = () => {
    if (userProfile && userProfile.username) {
      return userProfile.username;
    }
    return 'Visitor!';
  };

  const isGuest = !userProfile || userProfile.verification_status !== 'VERIFIED';

  return (
    <div style={styles.container}>
      {/* Header Banner */}
      <div style={styles.vibrantHeaderCard}>
        <div style={styles.headerTopRow}>
          <div>
            <span style={styles.brandSub}>PROJECT AGAP BATANGAS</span>
            <h2 style={styles.greetingTitle}>
              Mabuhay, {getGreetingUsername()}
            </h2>
          </div>

          <button
            style={styles.profileAvatarBtn}
            onClick={onOpenProfile}
            title="Open Profile"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F766E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </button>
        </div>

        <div style={styles.headerBottomRow}>
          <span style={isGuest ? styles.guestPill : styles.citizenPill}>
            {isGuest ? 'GUEST VISITOR MODE' : 'VERIFIED CITIZEN'}
          </span>
          <span style={styles.locationText}>
            Location: {userProfile?.barangay || 'Batangas City Sector'}
          </span>
        </div>
      </div>

      {/* Emergency SOS Dispatch Banner */}
      <div style={styles.sectionHeader}>Emergency SOS Dispatch</div>
      <div style={styles.sosBanner}>
        <div style={styles.sosLeft}>
          <div style={styles.sosIconBox}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <div style={styles.sosTitle}>IMMEDIATE CRISIS LINE</div>
            <div style={styles.sosSub}>Batangas City CDRRMO & Police</div>
          </div>
        </div>
        <button style={styles.sosButton} onClick={() => handleNav('hotlines')}>
          Call Hotline
        </button>
      </div>

      {/* Core Functions */}
      <div style={styles.sectionHeader}>Core Functions</div>
      <div style={styles.grid}>
        <div style={styles.cardTeal} onClick={() => handleNav('submit-report')}>
          <div style={styles.cardIconBoxTeal}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </div>
          <h3 style={styles.cardTitle}>Submit Hazard</h3>
          <p style={styles.cardDesc}>Report flooding, power lines, or road hazards.</p>
          <span style={styles.cardActionText}>Report Now &rarr;</span>
        </div>

        <div style={styles.cardWhite} onClick={() => handleNav('hotlines')}>
          <div style={styles.cardIconBoxGray}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </div>
          <h3 style={styles.cardTitle}>Hotline Directory</h3>
          <p style={styles.cardDesc}>Direct lines for Police, Fire, Hospitals, CDRRMO.</p>
          <span style={styles.cardActionText}>View Numbers &rarr;</span>
        </div>

        <div style={styles.cardWhite} onClick={() => handleNav('danger-map')}>
          <div style={styles.cardIconBoxGray}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
              <line x1="8" y1="2" x2="8" y2="18"/>
              <line x1="16" y1="6" x2="16" y2="22"/>
            </svg>
          </div>
          <h3 style={styles.cardTitle}>Danger Zone Map</h3>
          <p style={styles.cardDesc}>View active pins, flood risks, and safe shelters.</p>
          <span style={styles.cardActionText}>View Map &rarr;</span>
        </div>

        <div style={styles.cardWhite} onClick={() => handleNav('tracker')}>
          <div style={styles.cardIconBoxGray}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <h3 style={styles.cardTitle}>Report Tracker</h3>
          <p style={styles.cardDesc}>Check submitted report progress and LGU status.</p>
          <span style={styles.cardActionText}>Track Report &rarr;</span>
        </div>
      </div>

      {/* Live Approved Hazard Feed */}
      <div style={styles.sectionHeader}>Live Approved Hazard Feed</div>
      <div style={styles.feedList}>
        {isLoadingFeed ? (
          <div style={styles.emptyFeedCard}>Fetching database updates...</div>
        ) : liveFeed.length === 0 ? (
          <div style={styles.emptyFeedCard}>
            No active hazard alerts reported in Batangas City.
          </div>
        ) : (
          liveFeed.map((item, index) => (
            <div key={item.id || item.created_at || index} style={styles.feedCard}>
              <div style={styles.feedCardTop}>
                <span style={styles.badgeRed}>{item.category || item.hazard_type || 'HAZARD'}</span>
                <span style={styles.feedTime}>
                  {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                </span>
              </div>
              <h4 style={styles.feedTitle}>{item.hazard_type || item.title || item.category}</h4>
              <p style={styles.feedText}>{item.description || item.details || 'No additional details provided.'}</p>
              <div style={styles.feedFooter}>
                <span style={styles.feedLoc}>Location: {item.location}</span>
                <span style={styles.badgeGreen}>DISPATCHED</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '440px', margin: '0 auto', padding: '16px', fontFamily: "'Inter', sans-serif" },
  vibrantHeaderCard: { background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)', borderRadius: '18px', padding: '16px', marginBottom: '18px', color: '#FFFFFF', boxShadow: '0 8px 20px rgba(15, 118, 110, 0.2)' },
  headerTopRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  brandSub: { fontSize: '9px', fontWeight: '800', color: '#99F6E4', letterSpacing: '0.8px' },
  greetingTitle: { fontSize: '18px', fontWeight: '800', color: '#FFFFFF', margin: '2px 0 0 0' },
  profileAvatarBtn: { width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#FFFFFF', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' },
  headerBottomRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.2)' },
  citizenPill: { fontSize: '9px', fontWeight: '800', backgroundColor: '#DCFCE7', color: '#166534', padding: '3px 8px', borderRadius: '6px' },
  guestPill: { fontSize: '9px', fontWeight: '800', backgroundColor: '#FFEDD5', color: '#C2410C', padding: '3px 8px', borderRadius: '6px' },
  locationText: { fontSize: '10px', color: '#E6FFFA', fontWeight: '600' },
  sectionHeader: { fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' },
  sosBanner: { backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '14px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' },
  sosLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  sosIconBox: { width: '34px', height: '34px', borderRadius: '10px', backgroundColor: '#FEE2E2', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  sosTitle: { fontSize: '11px', fontWeight: '800', color: '#991B1B' },
  sosSub: { fontSize: '10px', color: '#B91C1C' },
  sosButton: { backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' },
  cardTeal: { backgroundColor: '#F0FDF4', border: '1px solid #CCFBF1', borderRadius: '14px', padding: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  cardIconBoxTeal: { width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#CCFBF1', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '8px' },
  cardWhite: { backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  cardIconBoxGray: { width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#F1F5F9', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '8px' },
  cardTitle: { fontSize: '13px', fontWeight: '800', color: '#0F172A', margin: '0 0 4px 0' },
  cardDesc: { fontSize: '10px', color: '#64748B', lineHeight: '1.3', margin: '0 0 8px 0' },
  cardActionText: { fontSize: '11px', fontWeight: '800', color: '#0F766E' },
  feedList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  emptyFeedCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '16px', textAlign: 'center', color: '#64748B', fontSize: '11px' },
  feedCard: { backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '12px' },
  feedCardTop: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px' },
  badgeRed: { fontSize: '9px', fontWeight: '800', backgroundColor: '#FEF2F2', color: '#991B1B', padding: '2px 6px', borderRadius: '4px' },
  feedTime: { fontSize: '10px', color: '#94A3B8' },
  feedTitle: { fontSize: '13px', fontWeight: '800', color: '#0F172A', margin: '0 0 4px 0' },
  feedText: { fontSize: '11px', color: '#475569', margin: '0 0 8px 0' },
  feedFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid #F1F5F9' },
  feedLoc: { fontSize: '10px', color: '#64748B' },
  badgeGreen: { fontSize: '9px', fontWeight: '800', backgroundColor: '#DCFCE7', color: '#166534', padding: '2px 6px', borderRadius: '4px' }
};
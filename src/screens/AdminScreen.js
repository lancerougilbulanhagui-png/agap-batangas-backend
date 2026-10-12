import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

export default function AdminScreen({ onBack }) {
  // Navigation State: 'DASHBOARD' | 'SUBMITTED_REPORTS' | 'ACTIVE_TRACKER' | 'USER_HANDLING' | 'REJECTED_ARCHIVE' | 'MAP_ANALYTICS'
  const [currentView, setCurrentView] = useState('DASHBOARD');

  // User Handling Sub-View State: 'DIRECTORY' (Type 1: Directory) | 'VERIFICATION_PORTAL' (Type 2: Verification Requests)
  const [userSubTab, setUserSubTab] = useState('DIRECTORY');

  // Directory Filter: 'ALL' | 'VERIFIED' | 'GUEST' | 'PENALIZED' | 'BANNED'
  const [directoryFilter, setDirectoryFilter] = useState('ALL');

  const [reports, setReports] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Calendar Analytics Selected Month (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState('2026-10');

  // User GPS for Live Map
  const [userGps, setUserGps] = useState({ lat: 13.7565, lng: 121.0583 });

  // Modals & Inspection Overlays
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [inspectImage, setInspectImage] = useState(null);

  // Map Container Refs for Leaflet
  const adminMapContainerRef = useRef(null);
  const adminMapInstanceRef = useRef(null);

  useEffect(() => {
    fetchAdminData();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const { data: repData } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
      if (repData) setReports(repData);

      const { data: profData } = await supabase
        .from('profiles')
        .select('*');
      if (profData) setProfiles(profData);
    } catch (err) {
      console.error('Fetch error:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Operational Stage Update
  const handleUpdateReportStatus = async (reportId, newStatus) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: newStatus })
        .eq('id', reportId);

      if (error) throw error;

      alert(`Report ticket ${reportId} updated to stage: ${newStatus}`);
      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport({ ...selectedReport, status: newStatus });
      }
      fetchAdminData();
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    }
  };

  // 1-Click Permanent Purge of Rejected Data (2nd Verification Check)
  const handlePurgeAllRejectedData = async () => {
    const rejectedList = reports.filter((r) => ['REJECTED', 'DELETED'].includes((r.status || '').toUpperCase()));
    if (rejectedList.length === 0) {
      alert('No rejected or deleted reports found in database.');
      return;
    }

    if (window.confirm(`Confirmation Required: Are you sure you want to permanently delete all ${rejectedList.length} rejected report records? This database action cannot be undone.`)) {
      try {
        const { error } = await supabase
          .from('reports')
          .delete()
          .in('status', ['REJECTED', 'DELETED']);

        if (error) throw error;

        alert('All rejected report records permanently deleted.');
        setSelectedReport(null);
        fetchAdminData();
      } catch (err) {
        alert(`Permanent delete failed: ${err.message}`);
      }
    }
  };

  // User Verification & Moderation Actions
  const handleUpdateUserStatus = async (deviceId, newStatus, reason = '') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ verification_status: newStatus })
        .eq('device_id', deviceId);

      if (error) throw error;

      alert(`User status updated to: ${newStatus}${reason ? ` (${reason})` : ''}`);
      if (selectedUser && selectedUser.device_id === deviceId) {
        setSelectedUser({ ...selectedUser, verification_status: newStatus });
      }
      fetchAdminData();
    } catch (err) {
      alert(`User update failed: ${err.message}`);
    }
  };

  // Filtered Lists
  const submittedReports = reports.filter((r) => 
    (r.status || 'PENDING').toUpperCase() === 'PENDING' || 
    (r.status || '').toUpperCase() === 'UNDER_INVESTIGATION'
  );

  const activeTrackerReports = reports.filter((r) => 
    ['APPROVED', 'DISPATCHED', 'IN_PROGRESS'].includes((r.status || '').toUpperCase())
  );

  const rejectedDataReports = reports.filter((r) => 
    ['REJECTED', 'DELETED'].includes((r.status || '').toUpperCase())
  );

  // User Directory Lists
  const verifiedCitizens = profiles
    .filter((p) => (p.verification_status || '').toUpperCase() === 'VERIFIED')
    .sort((a, b) => (a.username || a.full_name || '').localeCompare(b.username || b.full_name || ''));

  const guestUsers = profiles
    .filter((p) => (p.verification_status || 'GUEST').toUpperCase() !== 'VERIFIED');

  // Verification Requests (Voluntary Submissions Only)
  const pendingVerificationRequests = profiles.filter((p) => 
    (p.verification_status || '').toUpperCase() === 'PENDING' ||
    ((p.verification_status || '').toUpperCase() !== 'VERIFIED' && p.id_proof_photo)
  );

  // Get Submissions for a Specific User
  const getUserSubmissions = (userObj) => {
    if (!userObj) return [];
    return reports.filter((r) => 
      (userObj.device_id && r.device_id === userObj.device_id) ||
      (userObj.username && (r.sender_name === userObj.username || r.username === userObj.username))
    );
  };

  // Submitter Profile Mapping
  const getSubmitterInfo = (reportObj) => {
    if (!reportObj) return { username: 'Unknown User', deviceId: 'N/A', status: 'GUEST', profile: null };
    const matchedProfile = profiles.find((p) => p.device_id && p.device_id === reportObj.device_id);
    if (matchedProfile) {
      return {
        username: matchedProfile.username || matchedProfile.full_name || 'Registered Resident',
        deviceId: matchedProfile.device_id,
        status: matchedProfile.verification_status || 'GUEST',
        profile: matchedProfile
      };
    }
    return {
      username: reportObj.sender_name || 'Guest Reporter',
      deviceId: reportObj.device_id || 'GUEST-DEV',
      status: 'GUEST',
      profile: { device_id: reportObj.device_id || 'GUEST-DEV', username: reportObj.sender_name || 'Guest Reporter', verification_status: 'GUEST' }
    };
  };

  // Redirect from User Modal to Specific Submitted Report Details
  const handleRedirectToReport = (reportObj) => {
    setSelectedUser(null);
    setSelectedReport(reportObj);
    if (['APPROVED', 'DISPATCHED', 'IN_PROGRESS'].includes((reportObj.status || '').toUpperCase())) {
      setCurrentView('ACTIVE_TRACKER');
    } else if (['REJECTED', 'DELETED'].includes((reportObj.status || '').toUpperCase())) {
      setCurrentView('REJECTED_ARCHIVE');
    } else {
      setCurrentView('SUBMITTED_REPORTS');
    }
  };

  // Leaflet Map Initialization for Live GPS Map
  useEffect(() => {
    if (currentView !== 'MAP_ANALYTICS') return;

    const loadLeaflet = () => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      if (!window.L) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = initAdminMap;
        document.head.appendChild(script);
      } else {
        initAdminMap();
      }
    };

    const initAdminMap = () => {
      if (!adminMapContainerRef.current || adminMapInstanceRef.current) return;
      const L = window.L;
      const map = L.map(adminMapContainerRef.current).setView([userGps.lat, userGps.lng], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);

      // 1. GREEN PIN FOR USER CURRENT LOCATION
      const greenIcon = L.divIcon({
        className: 'custom-pin-green',
        html: `<div style="background-color: #166534; width: 16px; height: 16px; border-radius: 50%; border: 3px solid #FFFFFF; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      L.marker([userGps.lat, userGps.lng], { icon: greenIcon })
        .addTo(map)
        .bindPopup('<strong>Your Current Location</strong>');

      // 2. RED PINS FOR APPROVED ACTIVE HAZARDS
      const redIcon = L.divIcon({
        className: 'custom-pin-red',
        html: `<div style="background-color: #DC2626; width: 16px; height: 16px; border-radius: 50%; border: 3px solid #FFFFFF; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      activeTrackerReports.forEach((haz) => {
        if (haz.coordinates) {
          const parts = haz.coordinates.split(',').map((s) => parseFloat(s.trim()));
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            L.marker([parts[0], parts[1]], { icon: redIcon })
              .addTo(map)
              .bindPopup(`<strong>${haz.hazard_type || haz.category}</strong><br/>Ticket: ${haz.id || haz.ticket_no}<br/>Status: ${haz.status}`);
          }
        }
      });

      adminMapInstanceRef.current = map;
    };

    loadLeaflet();

    return () => {
      if (adminMapInstanceRef.current) {
        adminMapInstanceRef.current.remove();
        adminMapInstanceRef.current = null;
      }
    };
  }, [currentView, activeTrackerReports, userGps]);

  // Calendar Analytics Calculations
  const getCalendarMonthlyChartData = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const dayCounts = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, count: 0 }));

    reports.forEach((rep) => {
      if (rep.created_at) {
        const d = new Date(rep.created_at);
        if (d.getFullYear() === year && d.getMonth() + 1 === month) {
          const dayNum = d.getDate();
          if (dayCounts[dayNum - 1]) {
            dayCounts[dayNum - 1].count += 1;
          }
        }
      }
    });

    return dayCounts;
  };

  const chartData = getCalendarMonthlyChartData();
  const maxChartCount = Math.max(...chartData.map((d) => d.count), 5);

  const parsePhotos = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {}
      }
      return [trimmed];
    }
    return [];
  };

  return (
    <div style={styles.container}>
      {/* Top Header */}
      <div style={styles.navHeader}>
        <button 
          style={styles.backBtn} 
          onClick={currentView === 'DASHBOARD' ? onBack : () => setCurrentView('DASHBOARD')}
        >
          &lt; {currentView === 'DASHBOARD' ? 'Exit Portal' : 'Main Dashboard'}
        </button>
        <div>
          <h2 style={styles.headerTitle}>CDRRMO Command Portal</h2>
          <div style={styles.headerSub}>Batangas City Operations Center</div>
        </div>
      </div>

      {/* 1. MAIN DASHBOARD HOME VIEW (Clean & Short Header + Middle Right Badges) */}
      {currentView === 'DASHBOARD' && (
        <div style={styles.dashboardContainer}>
          {/* Welcome Card - Short & Clean */}
          <div style={styles.welcomeCard}>
            <div style={styles.welcomeTag}>CDRRMO OPERATIONS</div>
            <h3 style={styles.welcomeTitle}>Welcome back, Admin</h3>
            <p style={styles.welcomeDesc}>Monitor hazards, manage citizen reports, and track live analytics.</p>
          </div>

          {/* Core Command Modules List (Layout: Title Top, Short Desc Bottom, Badge Middle Right) */}
          <div style={styles.moduleSectionTitle}>COMMAND CENTER MODULES</div>
          <div style={styles.moduleStack}>
            
            {/* Module 1: Submitted Reports */}
            <div style={styles.moduleCard} onClick={() => setCurrentView('SUBMITTED_REPORTS')}>
              <div style={styles.moduleCardMainRow}>
                <div style={styles.moduleLeftColumn}>
                  <div style={styles.moduleName}>Submitted Reports Database</div>
                  <div style={styles.moduleShortDesc}>Review tickets & triage incoming hazard reports.</div>
                </div>
                <div style={styles.moduleRightBadgeBox}>
                  <span style={styles.badgeOrange}>{submittedReports.length} Needs Review</span>
                </div>
              </div>
            </div>

            {/* Module 2: Active Hazard Tracker */}
            <div style={styles.moduleCard} onClick={() => setCurrentView('ACTIVE_TRACKER')}>
              <div style={styles.moduleCardMainRow}>
                <div style={styles.moduleLeftColumn}>
                  <div style={styles.moduleName}>Active Hazard Tracker</div>
                  <div style={styles.moduleShortDesc}>Manage operational progression: Approved to Resolved.</div>
                </div>
                <div style={styles.moduleRightBadgeBox}>
                  <span style={styles.badgeTeal}>{activeTrackerReports.length} Active</span>
                </div>
              </div>
            </div>

            {/* Module 3: User & Device Handling */}
            <div style={styles.moduleCard} onClick={() => setCurrentView('USER_HANDLING')}>
              <div style={styles.moduleCardMainRow}>
                <div style={styles.moduleLeftColumn}>
                  <div style={styles.moduleName}>User & Device Handling</div>
                  <div style={styles.moduleShortDesc}>Directory sorting, report history & ID verifications.</div>
                </div>
                <div style={styles.moduleRightBadgeBox}>
                  <span style={styles.badgeBlue}>{profiles.length} Accounts</span>
                </div>
              </div>
            </div>

            {/* Module 4: Deleted / Rejected Archive */}
            <div style={styles.moduleCard} onClick={() => setCurrentView('REJECTED_ARCHIVE')}>
              <div style={styles.moduleCardMainRow}>
                <div style={styles.moduleLeftColumn}>
                  <div style={styles.moduleName}>Deleted & Rejected Data</div>
                  <div style={styles.moduleShortDesc}>Archive repository with 1-Click permanent purge.</div>
                </div>
                <div style={styles.moduleRightBadgeBox}>
                  <span style={styles.badgeRed}>{rejectedDataReports.length} Records</span>
                </div>
              </div>
            </div>

            {/* Module 5: Live Map & Analytics */}
            <div style={styles.moduleCard} onClick={() => setCurrentView('MAP_ANALYTICS')}>
              <div style={styles.moduleCardMainRow}>
                <div style={styles.moduleLeftColumn}>
                  <div style={styles.moduleName}>Live Danger Map & Analytics</div>
                  <div style={styles.moduleShortDesc}>Clean GPS map pins & calendar monthly trends.</div>
                </div>
                <div style={styles.moduleRightBadgeBox}>
                  <span style={styles.badgeGreen}>Live View</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. SUBMITTED REPORTS DATABASE */}
      {currentView === 'SUBMITTED_REPORTS' && (
        <div style={styles.sectionStack}>
          <div style={styles.sectionTitle}>Submitted Reports Database (Pending Triage)</div>
          {isLoading ? (
            <div style={styles.emptyCard}>Loading database submissions...</div>
          ) : submittedReports.length === 0 ? (
            <div style={styles.emptyCard}>No pending report submissions in database queue.</div>
          ) : (
            submittedReports.map((rep) => {
              const photoList = parsePhotos(rep.proof_photos || rep.photos);
              const submitter = getSubmitterInfo(rep);
              return (
                <div key={rep.id} style={styles.itemCard} onClick={() => setSelectedReport(rep)}>
                  <div style={styles.cardHeaderRow}>
                    <span style={styles.ticketBadge}>{rep.id || rep.ticket_no || '#AGAP-2026-0001'}</span>
                    <span style={styles.badgeOrange}>{rep.status || 'PENDING'}</span>
                  </div>
                  
                  <h4 style={styles.itemTitle}>{rep.hazard_type || rep.category || rep.title || 'Hazard Incident Report'}</h4>
                  <p style={styles.itemMeta}>Location: {rep.location || 'Not Specified'}</p>
                  
                  {/* Submitter Info */}
                  <div style={styles.submitterBar}>
                    <span style={styles.submitterText}>Submitted by: <strong>@{submitter.username}</strong> ({submitter.deviceId})</span>
                    <span style={getUserStatusBadgeStyle(submitter.status)}>{(submitter.status || 'GUEST').toUpperCase()}</span>
                  </div>

                  {photoList.length > 0 && (
                    <div style={styles.photoCountBox}>{photoList.length} Photo Evidence Attached (Tap card to inspect)</div>
                  )}

                  <div style={styles.actionRow}>
                    <button
                      style={styles.btnInvestigate}
                      onClick={(e) => { e.stopPropagation(); handleUpdateReportStatus(rep.id, 'UNDER_INVESTIGATION'); }}
                    >
                      Investigate
                    </button>
                    <button
                      style={styles.btnApprove}
                      onClick={(e) => { e.stopPropagation(); handleUpdateReportStatus(rep.id, 'APPROVED'); }}
                    >
                      Approve
                    </button>
                    <button
                      style={styles.btnReject}
                      onClick={(e) => { e.stopPropagation(); handleUpdateReportStatus(rep.id, 'REJECTED'); }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 3. ACTIVE HAZARD TRACKER */}
      {currentView === 'ACTIVE_TRACKER' && (
        <div style={styles.sectionStack}>
          <div style={styles.sectionTitle}>Active Approved Hazard Tracker</div>
          {activeTrackerReports.length === 0 ? (
            <div style={styles.emptyCard}>No active approved hazards currently in progress.</div>
          ) : (
            activeTrackerReports.map((rep) => {
              const submitter = getSubmitterInfo(rep);
              return (
                <div key={rep.id} style={styles.itemCard} onClick={() => setSelectedReport(rep)}>
                  <div style={styles.cardHeaderRow}>
                    <span style={styles.ticketBadge}>{rep.id || rep.ticket_no}</span>
                    <span style={styles.badgeTeal}>{rep.status}</span>
                  </div>
                  <h4 style={styles.itemTitle}>{rep.hazard_type || rep.category}</h4>
                  <p style={styles.itemMeta}>Location: {rep.location}</p>
                  <p style={styles.submitterTextSmall}>Reported by: @{submitter.username} ({submitter.deviceId})</p>

                  <div style={styles.trackerBar}>
                    <span style={rep.status === 'APPROVED' ? styles.stepActive : styles.stepDone}>1. Approved</span>
                    <span style={rep.status === 'DISPATCHED' ? styles.stepActive : styles.stepDone}>2. Dispatched</span>
                    <span style={rep.status === 'IN_PROGRESS' ? styles.stepActive : styles.stepDone}>3. In Progress</span>
                    <span style={rep.status === 'RESOLVED' ? styles.stepActive : styles.stepDone}>4. Resolved</span>
                  </div>

                  <div style={styles.actionRow}>
                    <button
                      style={styles.btnDispatch}
                      onClick={(e) => { e.stopPropagation(); handleUpdateReportStatus(rep.id, 'DISPATCHED'); }}
                    >
                      Dispatch Unit
                    </button>
                    <button
                      style={styles.btnInProgress}
                      onClick={(e) => { e.stopPropagation(); handleUpdateReportStatus(rep.id, 'IN_PROGRESS'); }}
                    >
                      In Progress
                    </button>
                    <button
                      style={styles.btnResolve}
                      onClick={(e) => { e.stopPropagation(); handleUpdateReportStatus(rep.id, 'RESOLVED'); }}
                    >
                      Mark Resolved
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 4. USER & DEVICE HANDLING (2 DISTINCT SUB-VIEWS / TYPES) */}
      {currentView === 'USER_HANDLING' && (
        <div style={styles.sectionStack}>
          {/* Sub-View Switcher */}
          <div style={styles.subTabContainer}>
            <button
              style={userSubTab === 'DIRECTORY' ? styles.subTabBtnActive : styles.subTabBtnInactive}
              onClick={() => setUserSubTab('DIRECTORY')}
            >
              Type 1: User Directory ({profiles.length})
            </button>
            <button
              style={userSubTab === 'VERIFICATION_PORTAL' ? styles.subTabBtnActive : styles.subTabBtnInactive}
              onClick={() => setUserSubTab('VERIFICATION_PORTAL')}
            >
              Type 2: Verification Requests ({pendingVerificationRequests.length})
            </button>
          </div>

          {/* SUB-VIEW TYPE 1: USER DIRECTORY */}
          {userSubTab === 'DIRECTORY' && (
            <div style={styles.sectionStack}>
              <div style={styles.chipFilterRow}>
                {['ALL', 'VERIFIED', 'GUEST', 'PENALIZED', 'BANNED'].map((f) => (
                  <button
                    key={f}
                    style={directoryFilter === f ? styles.chipActive : styles.chipInactive}
                    onClick={() => setDirectoryFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Verified Citizens List (Alphabetical) */}
              {(directoryFilter === 'ALL' || directoryFilter === 'VERIFIED') && (
                <div>
                  <div style={styles.sectionSubTitle}>Verified Citizens (Alphabetical Order)</div>
                  {verifiedCitizens.length === 0 ? (
                    <div style={styles.emptyCard}>No verified citizen accounts found.</div>
                  ) : (
                    verifiedCitizens.map((user) => {
                      const userReports = getUserSubmissions(user);
                      return (
                        <div key={user.device_id || user.id} style={styles.userCardRow} onClick={() => setSelectedUser(user)}>
                          <div style={styles.userLeftBox}>
                            <div style={styles.userAvatarSquare}>RES</div>
                            <div>
                              <div style={styles.userNameText}>@{user.username || user.full_name || 'Verified Resident'}</div>
                              <div style={styles.userMetaText}>Device ID: {user.device_id || 'N/A'} &bull; {userReports.length} Submitted Reports</div>
                            </div>
                          </div>
                          <span style={styles.badgeGreen}>VERIFIED</span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Guest Users List (Sequential #1 to #N) */}
              {(directoryFilter === 'ALL' || directoryFilter === 'GUEST' || directoryFilter === 'PENALIZED' || directoryFilter === 'BANNED') && (
                <div>
                  <div style={styles.sectionSubTitle}>Guest Users (Numbered List)</div>
                  {guestUsers.length === 0 ? (
                    <div style={styles.emptyCard}>No guest accounts found.</div>
                  ) : (
                    guestUsers.map((user, index) => {
                      const userReports = getUserSubmissions(user);
                      return (
                        <div key={user.device_id || user.id} style={styles.userCardRow} onClick={() => setSelectedUser(user)}>
                          <div style={styles.userLeftBox}>
                            <span style={styles.numBadge}>#{index + 1}</span>
                            <div>
                              <div style={styles.userNameText}>@{user.username || 'Guest User'}</div>
                              <div style={styles.userMetaText}>Device ID: {user.device_id || 'GUEST-DEV'} &bull; {userReports.length} Submitted Reports</div>
                            </div>
                          </div>
                          <span style={getUserStatusBadgeStyle(user.verification_status)}>
                            {(user.verification_status || 'GUEST').toUpperCase()}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* SUB-VIEW TYPE 2: VERIFICATION REQUESTS PORTAL */}
          {userSubTab === 'VERIFICATION_PORTAL' && (
            <div style={styles.sectionStack}>
              <div style={styles.sectionSubTitle}>Pending Citizen Identity Verification Requests</div>
              {pendingVerificationRequests.length === 0 ? (
                <div style={styles.emptyCard}>No pending identity verification requests. Unverified guests use devices freely without restrictions.</div>
              ) : (
                pendingVerificationRequests.map((user) => (
                  <div key={user.device_id || user.id} style={styles.verificationCard}>
                    <div style={styles.cardHeaderRow}>
                      <span style={styles.userNameText}>@{user.username || user.full_name || 'Verification Applicant'}</span>
                      <span style={styles.badgeOrange}>VERIFICATION PENDING</span>
                    </div>
                    <p style={styles.userMetaText}>Device Fingerprint: {user.device_id}</p>
                    <p style={styles.userMetaText}>Barangay / Address: {user.barangay || 'Batangas City'}</p>

                    {user.id_proof_photo && (
                      <div style={styles.idPhotoContainer}>
                        <div style={styles.fieldLabel}>UPLOADED RESIDENT ID PROOF:</div>
                        <img 
                          src={user.id_proof_photo} 
                          alt="ID Proof" 
                          style={styles.idProofThumb} 
                          onClick={() => setInspectImage(user.id_proof_photo)}
                        />
                      </div>
                    )}

                    <div style={styles.actionRow}>
                      <button
                        style={styles.btnApprove}
                        onClick={() => handleUpdateUserStatus(user.device_id, 'VERIFIED', 'Identity proof accepted')}
                      >
                        Approve & Verify Citizen
                      </button>
                      <button
                        style={styles.btnReject}
                        onClick={() => handleUpdateUserStatus(user.device_id, 'GUEST', 'Verification rejected')}
                      >
                        Reject Request
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. DELETED / REJECTED DATA ARCHIVE */}
      {currentView === 'REJECTED_ARCHIVE' && (
        <div style={styles.sectionStack}>
          <div style={styles.sectionTitle}>Deleted & Rejected Reports Archive</div>
          <button style={styles.purgeAllBtn} onClick={handlePurgeAllRejectedData}>
            1-Click Permanent Delete All Rejected Data (2nd Verification Prompt)
          </button>

          {rejectedDataReports.length === 0 ? (
            <div style={styles.emptyCard}>No rejected or deleted report records archived.</div>
          ) : (
            rejectedDataReports.map((rep) => {
              const submitter = getSubmitterInfo(rep);
              return (
                <div key={rep.id} style={styles.itemCard} onClick={() => setSelectedReport(rep)}>
                  <div style={styles.cardHeaderRow}>
                    <span style={styles.ticketBadge}>{rep.id || rep.ticket_no}</span>
                    <span style={styles.badgeRed}>REJECTED</span>
                  </div>
                  <h4 style={styles.itemTitle}>{rep.hazard_type || rep.category}</h4>
                  <p style={styles.itemMeta}>Submitted by: @{submitter.username} (Device: {submitter.deviceId})</p>
                  <p style={styles.itemMeta}>Remarks: {rep.description || 'No remarks provided.'}</p>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 6. MAP & CALENDAR ANALYTICS (LIVE GPS LEAFLET MAP WITH GREEN & RED PINS) */}
      {currentView === 'MAP_ANALYTICS' && (
        <div style={styles.sectionStack}>
          <div style={styles.sectionTitle}>Live Approved Danger Zone Map (Green: You, Red: Hazards)</div>
          
          <div style={styles.mapCardBox}>
            <div style={styles.mapLegendRow}>
              <span style={styles.legendItemGreen}>&bull; Your GPS Location (Green)</span>
              <span style={styles.legendItemRed}>&bull; Approved Hazard Pins (Red)</span>
            </div>
            <div ref={adminMapContainerRef} style={{ width: '100%', height: '220px', borderRadius: '8px', overflow: 'hidden' }}></div>
          </div>

          <div style={styles.sectionTitle}>Calendar-Integrated Incident Trends</div>
          <div style={styles.chartCard}>
            <div style={styles.calendarControlRow}>
              <span style={styles.calendarLabel}>Select Target Month:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={styles.monthPickerInput}
              />
            </div>

            <div style={styles.barGraphContainer}>
              {chartData.map((d) => {
                const heightPct = Math.max((d.count / maxChartCount) * 100, 6);
                return (
                  <div key={d.day} style={styles.barCol}>
                    <div style={styles.barVal}>{d.count > 0 ? d.count : ''}</div>
                    <div style={styles.barTrack}>
                      <div style={{ ...styles.barFill, height: `${heightPct}%` }}></div>
                    </div>
                    <div style={styles.barDayLabel}>{d.day}</div>
                  </div>
                );
              })}
            </div>
            <div style={styles.chartFooterLegend}>Daily Hazard Submissions Breakdown for {selectedMonth}</div>
          </div>
        </div>
      )}

      {/* FULL REPORT DETAIL MODAL */}
      {selectedReport && (
        <div style={styles.modalBackdrop} onClick={() => setSelectedReport(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>Report Ticket Details</span>
              <button style={styles.closeBtn} onClick={() => setSelectedReport(null)}>Close X</button>
            </div>

            <div style={styles.modalBodyStack}>
              <div><span style={styles.fieldLabel}>TICKET REF NUMBER:</span> <span style={styles.fieldValBold}>{selectedReport.id || selectedReport.ticket_no}</span></div>
              <div><span style={styles.fieldLabel}>HAZARD CATEGORY / TITLE:</span> <span style={styles.fieldVal}>{selectedReport.hazard_type || selectedReport.category}</span></div>
              
              {/* Connected Submitter Info */}
              {(() => {
                const submitter = getSubmitterInfo(selectedReport);
                return (
                  <div style={styles.submitterDetailBox} onClick={() => { setSelectedReport(null); setSelectedUser(submitter.profile); }}>
                    <span style={styles.fieldLabel}>SUBMITTED BY CITIZEN:</span>
                    <div style={styles.submitterLinkText}>@{submitter.username} (Device: {submitter.deviceId}) &rarr; View User Profile & Submissions</div>
                  </div>
                );
              })()}

              <div><span style={styles.fieldLabel}>LOCATION NAME:</span> <span style={styles.fieldVal}>{selectedReport.location}</span></div>

              <div>
                <span style={styles.fieldLabel}>PINNED GPS MAP COORDINATES:</span>
                <div style={styles.gpsMapBox}>
                  <iframe
                    title="Report GPS Location"
                    width="100%"
                    height="130"
                    frameBorder="0"
                    scrolling="no"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedReport.coordinates || '13.7565,121.0583')}&t=m&z=16&ie=UTF8&iwloc=&output=embed`}
                    style={{ borderRadius: '6px' }}
                  ></iframe>
                </div>
              </div>

              <div><span style={styles.fieldLabel}>SITUATION DESCRIPTION:</span> <p style={styles.descText}>{selectedReport.description || 'No details provided.'}</p></div>

              {parsePhotos(selectedReport.proof_photos || selectedReport.photos).length > 0 && (
                <div>
                  <span style={styles.fieldLabel}>ATTACHED EVIDENCE PHOTOS (Tap to Inspect):</span>
                  <div style={styles.photoGalleryGrid}>
                    {parsePhotos(selectedReport.proof_photos || selectedReport.photos).map((src, idx) => (
                      <img
                        key={idx}
                        src={src}
                        alt={`Evidence ${idx + 1}`}
                        style={styles.galleryThumb}
                        onClick={() => setInspectImage(src)}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div style={styles.modalActionBox}>
                <span style={styles.fieldLabel}>TRIAGE DECISION CONTROLS:</span>
                <div style={styles.actionRow}>
                  <button style={styles.btnInvestigate} onClick={() => handleUpdateReportStatus(selectedReport.id, 'UNDER_INVESTIGATION')}>Investigate</button>
                  <button style={styles.btnApprove} onClick={() => handleUpdateReportStatus(selectedReport.id, 'APPROVED')}>Approve</button>
                  <button style={styles.btnReject} onClick={() => handleUpdateReportStatus(selectedReport.id, 'REJECTED')}>Reject</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USER ACCOUNT MODAL (INCLUDES USER'S SUBMITTED REPORTS LIST WITH DIRECT CLICK REDIRECT) */}
      {selectedUser && (
        <div style={styles.modalBackdrop} onClick={() => setSelectedUser(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>User Account & Submission History</span>
              <button style={styles.closeBtn} onClick={() => setSelectedUser(null)}>Close X</button>
            </div>

            <div style={styles.modalBodyStack}>
              <div><span style={styles.fieldLabel}>ACCOUNT USERNAME:</span> <span style={styles.fieldValBold}>@{selectedUser.username || 'Unregistered User'}</span></div>
              <div><span style={styles.fieldLabel}>HARDWARE DEVICE ID:</span> <span style={styles.fieldVal}>{selectedUser.device_id || 'GUEST-DEV'}</span></div>
              <div><span style={styles.fieldLabel}>VERIFICATION STATUS:</span> <span style={getUserStatusBadgeStyle(selectedUser.verification_status)}>{(selectedUser.verification_status || 'GUEST').toUpperCase()}</span></div>

              {/* CLICKABLE SUBMITTED REPORTS LIST REDIRECTING TO TICKET DETAILS */}
              <div style={styles.userReportsContainer}>
                <span style={styles.fieldLabel}>SUBMITTED REPORTS BY THIS ACCOUNT ({getUserSubmissions(selectedUser).length}) - TAP ITEM TO OPEN DETAILS:</span>
                {getUserSubmissions(selectedUser).length === 0 ? (
                  <div style={styles.userReportEmptyNotice}>No reports submitted by this user account yet.</div>
                ) : (
                  getUserSubmissions(selectedUser).map((userRep) => (
                    <div 
                      key={userRep.id} 
                      style={styles.userReportClickableCard}
                      onClick={() => handleRedirectToReport(userRep)}
                    >
                      <div style={styles.cardHeaderRow}>
                        <span style={styles.ticketBadge}>{userRep.id || userRep.ticket_no}</span>
                        <span style={getUserStatusBadgeStyle(userRep.status)}>{userRep.status}</span>
                      </div>
                      <div style={styles.userReportTitleText}>{userRep.hazard_type || userRep.category}</div>
                      <div style={styles.userReportSubText}>📍 {userRep.location} &bull; Click to open report ticket &rarr;</div>
                    </div>
                  ))
                )}
              </div>

              {/* Moderation Controls */}
              <div style={styles.modalActionBox}>
                <span style={styles.fieldLabel}>ACCOUNT MODERATION ACTIONS:</span>
                <div style={styles.actionRow}>
                  {selectedUser.verification_status !== 'VERIFIED' && (
                    <button style={styles.btnApprove} onClick={() => handleUpdateUserStatus(selectedUser.device_id, 'VERIFIED', 'Verified by Admin')}>
                      Verify Citizen
                    </button>
                  )}
                  <button style={styles.btnWarn} onClick={() => handleUpdateUserStatus(selectedUser.device_id, 'PENALIZED', 'Penalty issued for false report')}>
                    Issue Penalty
                  </button>
                  <button style={styles.btnBan} onClick={() => handleUpdateUserStatus(selectedUser.device_id, 'BANNED', 'Device banned for spam')}>
                    Ban Device ID
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WHITE FROSTED BLUR LIGHTBOX WITH FIXED SHAPE CONTAINER */}
      {inspectImage && (
        <div style={styles.whiteBlurBackdrop} onClick={() => setInspectImage(null)}>
          <div style={styles.whiteBlurContainer} onClick={(e) => e.stopPropagation()}>
            <div style={styles.whiteBlurHeader}>
              <span style={styles.whiteBlurTitle}>EVIDENCE PHOTO INSPECTION PREVIEW</span>
              <button style={styles.whiteBlurCloseBtn} onClick={() => setInspectImage(null)}>Close X</button>
            </div>
            <div style={styles.fixedShapeFrame}>
              <img src={inspectImage} alt="Inspected Evidence" style={styles.fixedShapeImg} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getUserStatusBadgeStyle(status) {
  const s = (status || 'GUEST').toUpperCase();
  if (s === 'VERIFIED') return styles.badgeGreen;
  if (s === 'PENALIZED' || s === 'WARNED') return styles.badgeOrange;
  if (s === 'BANNED') return styles.badgeRed;
  return styles.badgeTeal;
}

const styles = {
  container: { maxWidth: '440px', margin: '0 auto', padding: '16px', fontFamily: "'Inter', sans-serif" },
  navHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
  backBtn: { backgroundColor: '#F1F5F9', border: 'none', color: '#0F766E', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' },
  headerTitle: { fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 },
  headerSub: { fontSize: '11px', color: '#64748B' },
  
  // Dashboard Welcoming Screen Styles
  dashboardContainer: { display: 'flex', flexDirection: 'column', gap: '14px' },
  welcomeCard: { backgroundColor: '#0F766E', color: '#FFFFFF', borderRadius: '14px', padding: '14px 16px', boxShadow: '0 2px 6px rgba(15, 118, 110, 0.2)' },
  welcomeTag: { fontSize: '9px', fontWeight: '800', letterSpacing: '0.8px', color: '#CCFBF1', marginBottom: '3px' },
  welcomeTitle: { fontSize: '16px', fontWeight: '800', margin: '0 0 4px 0' },
  welcomeDesc: { fontSize: '11px', color: '#E6F4F1', margin: 0, lineHeight: '1.3' },

  moduleSectionTitle: { fontSize: '10px', fontWeight: '800', color: '#475569', letterSpacing: '0.5px' },
  moduleStack: { display: 'flex', flexDirection: 'column', gap: '10px' },
  
  // Module Cards Layout (Title Top, Short Desc Bottom, Badge Middle Right)
  moduleCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '12px', cursor: 'pointer' },
  moduleCardMainRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' },
  moduleLeftColumn: { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' },
  moduleName: { fontSize: '13px', fontWeight: '800', color: '#0F172A' },
  moduleShortDesc: { fontSize: '11px', color: '#64748B', lineHeight: '1.3' },
  moduleRightBadgeBox: { display: 'flex', alignItems: 'center', justifyContent: 'center' },

  sectionStack: { display: 'flex', flexDirection: 'column', gap: '10px' },
  sectionTitle: { fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' },
  sectionSubTitle: { fontSize: '10px', fontWeight: '800', color: '#0F766E', textTransform: 'uppercase', marginTop: '4px' },
  emptyCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', padding: '16px', borderRadius: '8px', textAlign: 'center', color: '#64748B', fontSize: '11px' },
  itemCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '10px', cursor: 'pointer' },
  cardHeaderRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '4px' },
  ticketBadge: { fontSize: '9px', fontWeight: '800', backgroundColor: '#CCFBF1', color: '#0F766E', padding: '2px 6px', borderRadius: '4px' },
  itemTitle: { fontSize: '13px', fontWeight: '800', color: '#0F172A', margin: '2px 0' },
  itemMeta: { fontSize: '11px', color: '#475569', margin: '2px 0' },
  submitterBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: '4px 8px', borderRadius: '6px', margin: '4px 0' },
  submitterText: { fontSize: '10px', color: '#334155' },
  submitterTextSmall: { fontSize: '10px', color: '#64748B', margin: '2px 0' },
  photoCountBox: { fontSize: '10px', fontWeight: '800', color: '#0F766E', backgroundColor: '#F0FDF4', padding: '4px 8px', borderRadius: '4px', margin: '4px 0' },

  actionRow: { display: 'flex', gap: '6px', marginTop: '6px' },
  btnInvestigate: { flex: 1, padding: '6px', backgroundColor: '#D97706', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  btnApprove: { flex: 1, padding: '6px', backgroundColor: '#166534', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  btnReject: { flex: 1, padding: '6px', backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  btnDispatch: { flex: 1, padding: '6px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  btnInProgress: { flex: 1, padding: '6px', backgroundColor: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  btnResolve: { flex: 1, padding: '6px', backgroundColor: '#166534', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  btnWarn: { flex: 1, padding: '6px', backgroundColor: '#D97706', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  btnBan: { flex: 1, padding: '6px', backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },

  trackerBar: { display: 'flex', gap: '4px', backgroundColor: '#F8FAFC', padding: '6px', borderRadius: '6px', margin: '6px 0' },
  stepActive: { fontSize: '8px', fontWeight: '800', color: '#0F766E', backgroundColor: '#CCFBF1', padding: '2px 4px', borderRadius: '4px' },
  stepDone: { fontSize: '8px', color: '#94A3B8', padding: '2px 4px' },

  subTabContainer: { display: 'flex', gap: '6px', marginBottom: '8px' },
  subTabBtnActive: { flex: 1, padding: '8px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  subTabBtnInactive: { flex: 1, padding: '8px', backgroundColor: '#E2E8F0', color: '#475569', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: '700', cursor: 'pointer' },

  chipFilterRow: { display: 'flex', gap: '4px', overflowX: 'auto', marginBottom: '6px' },
  chipActive: { padding: '4px 10px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '12px', fontSize: '9px', fontWeight: '800', cursor: 'pointer' },
  chipInactive: { padding: '4px 10px', backgroundColor: '#E2E8F0', color: '#475569', border: 'none', borderRadius: '12px', fontSize: '9px', fontWeight: '600', cursor: 'pointer' },

  userCardRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', marginBottom: '6px' },
  userLeftBox: { display: 'flex', alignItems: 'center', gap: '8px' },
  userAvatarSquare: { width: '28px', height: '28px', backgroundColor: '#CCFBF1', color: '#0F766E', borderRadius: '6px', fontSize: '10px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  numBadge: { fontSize: '10px', fontWeight: '800', color: '#0F766E', backgroundColor: '#CCFBF1', padding: '2px 6px', borderRadius: '4px' },
  userNameText: { fontSize: '12px', fontWeight: '800', color: '#0F172A' },
  userMetaText: { fontSize: '9px', color: '#64748B' },

  verificationCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '10px' },
  idPhotoContainer: { margin: '8px 0', padding: '6px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' },
  idProofThumb: { width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer', marginTop: '4px' },

  purgeAllBtn: { width: '100%', padding: '10px', backgroundColor: '#991B1B', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', marginBottom: '8px' },

  mapCardBox: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '8px', marginBottom: '8px' },
  mapLegendRow: { display: 'flex', gap: '12px', marginBottom: '6px', padding: '2px 4px' },
  legendItemGreen: { fontSize: '10px', fontWeight: '800', color: '#166534' },
  legendItemRed: { fontSize: '10px', fontWeight: '800', color: '#DC2626' },

  chartCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '12px' },
  calendarControlRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  calendarLabel: { fontSize: '11px', fontWeight: '800', color: '#0F172A' },
  monthPickerInput: { padding: '4px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '11px', fontFamily: 'inherit' },
  barGraphContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '100px', borderBottom: '1px solid #CBD5E1', overflowX: 'auto', gap: '2px' },
  barCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '8px', flex: 1 },
  barVal: { fontSize: '7px', fontWeight: '800', color: '#0F766E', height: '10px' },
  barTrack: { width: '6px', height: '65px', backgroundColor: '#F1F5F9', borderRadius: '3px', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', backgroundColor: '#0F766E', borderRadius: '3px' },
  barDayLabel: { fontSize: '7px', color: '#64748B', marginTop: '2px' },
  chartFooterLegend: { fontSize: '9px', color: '#64748B', textAlign: 'center', marginTop: '6px' },

  badgeGreen: { fontSize: '8px', fontWeight: '800', backgroundColor: '#DCFCE7', color: '#166534', padding: '2px 6px', borderRadius: '4px' },
  badgeTeal: { fontSize: '8px', fontWeight: '800', backgroundColor: '#CCFBF1', color: '#0F766E', padding: '2px 6px', borderRadius: '4px' },
  badgeOrange: { fontSize: '8px', fontWeight: '800', backgroundColor: '#FFEDD5', color: '#C2410C', padding: '2px 6px', borderRadius: '4px' },
  badgeRed: { fontSize: '8px', fontWeight: '800', backgroundColor: '#FEE2E2', color: '#991B1B', padding: '2px 6px', borderRadius: '4px' },
  badgeBlue: { fontSize: '8px', fontWeight: '800', backgroundColor: '#DBEAFE', color: '#1E40AF', padding: '2px 6px', borderRadius: '4px' },

  modalBackdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '14px', maxWidth: '380px', width: '100%', maxHeight: '85vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  modalTitle: { fontSize: '13px', fontWeight: '800', color: '#0F172A' },
  closeBtn: { backgroundColor: '#F1F5F9', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', color: '#475569' },
  modalBodyStack: { display: 'flex', flexDirection: 'column', gap: '8px' },
  fieldLabel: { fontSize: '8px', fontWeight: '800', color: '#64748B', display: 'block' },
  fieldValBold: { fontSize: '12px', fontWeight: '800', color: '#0F766E' },
  fieldVal: { fontSize: '11px', color: '#0F172A', fontWeight: '600' },
  descText: { fontSize: '11px', color: '#334155', margin: '2px 0 0 0', lineHeight: '1.3' },

  submitterDetailBox: { backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', padding: '8px', borderRadius: '6px', cursor: 'pointer' },
  submitterLinkText: { fontSize: '11px', fontWeight: '800', color: '#166534', marginTop: '2px' },

  gpsMapBox: { marginTop: '4px', borderRadius: '6px', overflow: 'hidden' },
  photoGalleryGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '4px' },
  galleryThumb: { width: '100%', height: '65px', objectFit: 'cover', borderRadius: '6px', border: '2px solid #0F766E', cursor: 'pointer' },
  modalActionBox: { marginTop: '8px', backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', padding: '8px', borderRadius: '8px' },

  userReportsContainer: { marginTop: '6px', borderTop: '1px solid #E2E8F0', paddingTop: '8px' },
  userReportEmptyNotice: { fontSize: '10px', color: '#94A3B8', padding: '6px', textAlign: 'center' },
  userReportClickableCard: { backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '6px 8px', marginBottom: '6px', cursor: 'pointer' },
  userReportTitleText: { fontSize: '11px', fontWeight: '800', color: '#0F172A', margin: '2px 0' },
  userReportSubText: { fontSize: '9px', color: '#0F766E', fontWeight: '700' },

  whiteBlurBackdrop: { 
    position: 'fixed', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: 'rgba(255, 255, 255, 0.85)', 
    backdropFilter: 'blur(16px)', 
    WebkitBackdropFilter: 'blur(16px)',
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    zIndex: 9999, 
    padding: '16px' 
  },
  whiteBlurContainer: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: '16px', 
    padding: '16px', 
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    border: '2px solid #0F766E',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  whiteBlurHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '12px' },
  whiteBlurTitle: { fontSize: '10px', fontWeight: '800', color: '#0F766E', letterSpacing: '0.5px' },
  whiteBlurCloseBtn: { backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  fixedShapeFrame: { 
    width: '280px', 
    height: '280px', 
    backgroundColor: '#F8FAFC', 
    borderRadius: '12px', 
    border: '1px solid #CBD5E1', 
    overflow: 'hidden', 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  fixedShapeImg: { width: '100%', height: '100%', objectFit: 'contain' }
};

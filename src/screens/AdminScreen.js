import React, { useState, useEffect } from 'react';
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

  // Modals & Inspection Overlays
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [inspectImage, setInspectImage] = useState(null);

  useEffect(() => {
    fetchAdminData();
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

      alert(`Report ticket ${reportId} stage updated to: ${newStatus}`);
      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport({ ...selectedReport, status: newStatus });
      }
      fetchAdminData();
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    }
  };

  // 1-Click Permanent Purge of Rejected Data (2nd Verification Prompt)
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

        alert('All rejected report records permanently deleted from database.');
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

  // User Directory Categorization
  const verifiedCitizens = profiles
    .filter((p) => (p.verification_status || '').toUpperCase() === 'VERIFIED')
    .sort((a, b) => (a.username || a.full_name || '').localeCompare(b.username || b.full_name || ''));

  const guestUsers = profiles
    .filter((p) => (p.verification_status || 'GUEST').toUpperCase() !== 'VERIFIED');

  // Pending Citizen Verification Requests (Only users who voluntarily submitted ID proof)
  const pendingVerificationRequests = profiles.filter((p) => 
    (p.verification_status || '').toUpperCase() === 'PENDING' ||
    ((p.verification_status || '').toUpperCase() !== 'VERIFIED' && p.id_proof_photo)
  );

  // Get Submissions for a Specific User or Device ID
  const getUserSubmissions = (userObj) => {
    if (!userObj) return [];
    return reports.filter((r) => 
      (userObj.device_id && r.device_id === userObj.device_id) ||
      (userObj.username && (r.sender_name === userObj.username || r.username === userObj.username))
    );
  };

  // Find Submitter Info for a Report
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

      {/* 1. MAIN DASHBOARD HOME VIEW (Clean Layout) */}
      {currentView === 'DASHBOARD' && (
        <div style={styles.dashboardContainer}>
          {/* Minimal Welcoming Banner */}
          <div style={styles.welcomeBanner}>
            <div style={styles.welcomeTag}>OFFICIAL ADMINISTRATOR PORTAL</div>
            <h3 style={styles.welcomeTitle}>Welcome back, Admin</h3>
            <p style={styles.welcomeSubtext}>Monitor hazards, manage citizen reports, and track live analytics.</p>
          </div>

          {/* Module Cards Stack */}
          <div style={styles.moduleSectionTitle}>COMMAND CENTER MODULES</div>
          <div style={styles.moduleStack}>
            
            {/* Card 1: Submitted Reports */}
            <div style={styles.moduleCard} onClick={() => setCurrentView('SUBMITTED_REPORTS')}>
              <div style={styles.moduleCardLeft}>
                <span style={styles.moduleCardTitle}>Submitted Reports Database</span>
                <span style={styles.moduleCardShortDesc}>Review incoming reports, inspect photos & triage</span>
              </div>
              <div style={styles.moduleCardRight}>
                <span style={styles.badgeOrange}>{submittedReports.length} Needs Review</span>
              </div>
            </div>

            {/* Card 2: Active Hazard Tracker */}
            <div style={styles.moduleCard} onClick={() => setCurrentView('ACTIVE_TRACKER')}>
              <div style={styles.moduleCardLeft}>
                <span style={styles.moduleCardTitle}>Active Hazard Tracker</span>
                <span style={styles.moduleCardShortDesc}>Manage operational stages & dispatch units</span>
              </div>
              <div style={styles.moduleCardRight}>
                <span style={styles.badgeTeal}>{activeTrackerReports.length} Active</span>
              </div>
            </div>

            {/* Card 3: User & Device Handling */}
            <div style={styles.moduleCard} onClick={() => setCurrentView('USER_HANDLING')}>
              <div style={styles.moduleCardLeft}>
                <span style={styles.moduleCardTitle}>User & Device Handling</span>
                <span style={styles.moduleCardShortDesc}>Directory, submissions history & verification requests</span>
              </div>
              <div style={styles.moduleCardRight}>
                <span style={styles.badgeBlue}>{profiles.length} Accounts</span>
              </div>
            </div>

            {/* Card 4: Deleted / Rejected Data */}
            <div style={styles.moduleCard} onClick={() => setCurrentView('REJECTED_ARCHIVE')}>
              <div style={styles.moduleCardLeft}>
                <span style={styles.moduleCardTitle}>Deleted & Rejected Data</span>
                <span style={styles.moduleCardShortDesc}>Archive repository with 1-click permanent delete</span>
              </div>
              <div style={styles.moduleCardRight}>
                <span style={styles.badgeRed}>{rejectedDataReports.length} Archived</span>
              </div>
            </div>

            {/* Card 5: Map & Analytics */}
            <div style={styles.moduleCard} onClick={() => setCurrentView('MAP_ANALYTICS')}>
              <div style={styles.moduleCardLeft}>
                <span style={styles.moduleCardTitle}>Live Map & Calendar Analytics</span>
                <span style={styles.moduleCardShortDesc}>Clean danger map view & monthly incident graphs</span>
              </div>
              <div style={styles.moduleCardRight}>
                <span style={styles.badgeGreen}>Live View</span>
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
                    <span style={styles.submitterText}>Submitted by: <strong>@{submitter.username}</strong> (Device ID: {submitter.deviceId})</span>
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

      {/* 4. USER & DEVICE HANDLING (2 DISTINCT SUB-VIEWS) */}
      {currentView === 'USER_HANDLING' && (
        <div style={styles.sectionStack}>
          {/* Sub-View Switcher Bar */}
          <div style={styles.subTabContainer}>
            <button
              style={userSubTab === 'DIRECTORY' ? styles.subTabBtnActive : styles.subTabBtnInactive}
              onClick={() => setUserSubTab('DIRECTORY')}
            >
              Directory ({profiles.length})
            </button>
            <button
              style={userSubTab === 'VERIFICATION_PORTAL' ? styles.subTabBtnActive : styles.subTabBtnInactive}
              onClick={() => setUserSubTab('VERIFICATION_PORTAL')}
            >
              Verification Requests ({pendingVerificationRequests.length})
            </button>
          </div>

          {/* SUB-VIEW 1: USER DIRECTORY */}
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

              {/* Guest Users List (Sequential #1 to #N with Device ID Tracking) */}
              {(directoryFilter === 'ALL' || directoryFilter === 'GUEST' || directoryFilter === 'PENALIZED' || directoryFilter === 'BANNED') && (
                <div>
                  <div style={styles.sectionSubTitle}>Guest Users (Tracked by Device ID)</div>
                  {guestUsers.length === 0 ? (
                    <div style={styles.emptyCard}>No guest device accounts found.</div>
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

          {/* SUB-VIEW 2: CITIZEN VERIFICATION REQUESTS */}
          {userSubTab === 'VERIFICATION_PORTAL' && (
            <div style={styles.sectionStack}>
              <div style={styles.sectionSubTitle}>Pending Identity Verification Submissions</div>
              {pendingVerificationRequests.length === 0 ? (
                <div style={styles.emptyCard}>No pending identity verification submissions. Unverified guests continue using their devices smoothly!</div>
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
                        <div style={styles.fieldLabel}>UPLOADED GOVERNMENT / RESIDENT ID PROOF:</div>
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
                        Reject Verification
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
                  <p style={styles.itemMeta}>Submitted by: @{submitter.username} (Device ID: {submitter.deviceId})</p>
                  <p style={styles.itemMeta}>Remarks: {rep.description || 'No remarks provided.'}</p>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 6. MAP & CALENDAR ANALYTICS */}
      {currentView === 'MAP_ANALYTICS' && (
        <div style={styles.sectionStack}>
          <div style={styles.sectionTitle}>Live Approved Danger Zone Map (Clean View)</div>
          <iframe
            title="Admin Hazard Map View"
            width="100%"
            height="220"
            frameBorder="0"
            scrolling="no"
            src="https://maps.google.com/maps?q=13.7565,121.0583&t=m&z=14&ie=UTF8&iwloc=&output=embed"
            style={styles.cleanMapIframe}
          ></iframe>

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
              
              {/* Connected Submitter Link */}
              {(() => {
                const submitter = getSubmitterInfo(selectedReport);
                return (
                  <div style={styles.submitterDetailBox} onClick={() => { setSelectedReport(null); setSelectedUser(submitter.profile); setCurrentView('USER_HANDLING'); }}>
                    <span style={styles.fieldLabel}>SUBMITTED BY CITIZEN:</span>
                    <div style={styles.submitterLinkText}>@{submitter.username} (Device ID: {submitter.deviceId}) &rarr; View User Profile & Submissions</div>
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

      {/* USER ACCOUNT MODAL (DISTINCT FOR VERIFIED vs GUEST) */}
      {selectedUser && (
        <div style={styles.modalBackdrop} onClick={() => setSelectedUser(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>User Account & Device Profile</span>
              <button style={styles.closeBtn} onClick={() => setSelectedUser(null)}>Close X</button>
            </div>

            <div style={styles.modalBodyStack}>
              {/* Account Identity Info */}
              {(selectedUser.verification_status || '').toUpperCase() === 'VERIFIED' ? (
                <div style={styles.verifiedInfoBox}>
                  <div style={styles.verifiedTagRow}>
                    <span style={styles.badgeGreen}>VERIFIED CITIZEN RESIDENT</span>
                  </div>
                  <div style={{ marginTop: '6px' }}><span style={styles.fieldLabel}>FULL NAME:</span> <span style={styles.fieldValBold}>{selectedUser.full_name || selectedUser.username}</span></div>
                  <div><span style={styles.fieldLabel}>USERNAME:</span> <span style={styles.fieldVal}>@{selectedUser.username}</span></div>
                  <div><span style={styles.fieldLabel}>PHONE NUMBER:</span> <span style={styles.fieldVal}>{selectedUser.phone_number || 'Not provided'}</span></div>
                  <div><span style={styles.fieldLabel}>BARANGAY RESIDENCE:</span> <span style={styles.fieldVal}>{selectedUser.barangay || 'Batangas City'}</span></div>
                  <div><span style={styles.fieldLabel}>DEVICE ID:</span> <span style={styles.fieldVal}>{selectedUser.device_id || 'N/A'}</span></div>
                </div>
              ) : (
                <div style={styles.guestInfoBox}>
                  <div style={styles.verifiedTagRow}>
                    <span style={getUserStatusBadgeStyle(selectedUser.verification_status)}>
                      {(selectedUser.verification_status || 'GUEST').toUpperCase()} ACCOUNT
                    </span>
                  </div>
                  <div style={styles.guestNoticeText}>
                    This account operates as a Guest User without registered personal identity information. System tracks and manages submissions via Hardware Device ID.
                  </div>
                  <div style={{ marginTop: '6px' }}><span style={styles.fieldLabel}>HARDWARE DEVICE ID:</span> <span style={styles.fieldValBold}>{selectedUser.device_id || 'GUEST-DEV'}</span></div>
                  <div><span style={styles.fieldLabel}>USERNAME / DISPLAY:</span> <span style={styles.fieldVal}>@{selectedUser.username || 'Guest User'}</span></div>
                </div>
              )}

              {/* INTEGRATED SUBMITTED REPORTS LIST FOR THIS USER */}
              <div style={styles.userReportsContainer}>
                <span style={styles.fieldLabel}>REPORTS SUBMITTED BY THIS ACCOUNT ({getUserSubmissions(selectedUser).length}):</span>
                {getUserSubmissions(selectedUser).length === 0 ? (
                  <div style={styles.userReportEmptyNotice}>No hazard reports submitted from this account / device ID yet.</div>
                ) : (
                  getUserSubmissions(selectedUser).map((userRep) => (
                    <div 
                      key={userRep.id} 
                      style={styles.userReportMiniCard}
                      onClick={() => {
                        setSelectedUser(null);
                        setSelectedReport(userRep);
                        setCurrentView('SUBMITTED_REPORTS');
                      }}
                    >
                      <div style={styles.cardHeaderRow}>
                        <span style={styles.ticketBadge}>{userRep.id || userRep.ticket_no}</span>
                        <span style={getUserStatusBadgeStyle(userRep.status)}>{userRep.status}</span>
                      </div>
                      <div style={styles.userReportMiniTitle}>{userRep.hazard_type || userRep.category}</div>
                      <div style={styles.userReportMiniSub}>📍 {userRep.location} &bull; Click to open ticket &rarr;</div>
                    </div>
                  ))
                )}
              </div>

              {/* Moderation Controls */}
              <div style={styles.modalActionBox}>
                <span style={styles.fieldLabel}>ACCOUNT & DEVICE MODERATION:</span>
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

      {/* MESSENGER-STYLE BLURRED PHOTO PREVIEW LIGHTBOX */}
      {inspectImage && (
        <div style={styles.messengerBlurBackdrop} onClick={() => setInspectImage(null)}>
          <div style={styles.messengerBlurHeader}>
            <span style={styles.messengerBlurTitle}>EVIDENCE PHOTO PREVIEW</span>
            <button style={styles.messengerCloseBtn} onClick={() => setInspectImage(null)}>Close X</button>
          </div>
          <div style={styles.messengerImageWrapper} onClick={(e) => e.stopPropagation()}>
            <img src={inspectImage} alt="Inspected Evidence" style={styles.messengerFloatingImg} />
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
  
  // Dashboard Minimal Banner
  dashboardContainer: { display: 'flex', flexDirection: 'column', gap: '14px' },
  welcomeBanner: { backgroundColor: '#0F766E', color: '#FFFFFF', borderRadius: '12px', padding: '14px', boxShadow: '0 2px 6px rgba(15, 118, 110, 0.15)' },
  welcomeTag: { fontSize: '8px', fontWeight: '800', letterSpacing: '0.8px', color: '#CCFBF1', marginBottom: '2px' },
  welcomeTitle: { fontSize: '15px', fontWeight: '800', margin: '0 0 4px 0' },
  welcomeSubtext: { fontSize: '11px', color: '#E6F4F1', margin: 0, lineHeight: '1.3' },

  moduleSectionTitle: { fontSize: '10px', fontWeight: '800', color: '#475569', letterSpacing: '0.5px' },
  moduleStack: { display: 'flex', flexDirection: 'column', gap: '8px' },
  
  // Clean Module Card Layout: Title + Short Desc on Left, Badge Vertically Centered on Right
  moduleCard: { 
    backgroundColor: '#FFFFFF', 
    border: '1px solid #CBD5E1', 
    borderRadius: '10px', 
    padding: '12px 14px', 
    cursor: 'pointer', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    gap: '12px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
  },
  moduleCardLeft: { display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 },
  moduleCardTitle: { fontSize: '13px', fontWeight: '800', color: '#0F172A' },
  moduleCardShortDesc: { fontSize: '10px', color: '#64748B', lineHeight: '1.3' },
  moduleCardRight: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 0 },

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
  submitterDetailBox: { backgroundColor: '#F0FDF4', border: '1px solid #CCFBF1', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer' },
  submitterLinkText: { fontSize: '10px', fontWeight: '800', color: '#0F766E', marginTop: '2px' },
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
  subTabBtnInactive: { flex: 1, padding: '8px', backgroundColor: '#E2E8F0', color: '#475569', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: '600', cursor: 'pointer' },
  chipFilterRow: { display: 'flex', gap: '4px', overflowX: 'auto', marginBottom: '8px' },
  chipActive: { padding: '4px 8px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '12px', fontSize: '9px', fontWeight: '800', cursor: 'pointer' },
  chipInactive: { padding: '4px 8px', backgroundColor: '#E2E8F0', color: '#475569', border: 'none', borderRadius: '12px', fontSize: '9px', fontWeight: '600', cursor: 'pointer' },

  userCardRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', marginBottom: '6px' },
  userLeftBox: { display: 'flex', alignItems: 'center', gap: '8px' },
  userAvatarSquare: { fontSize: '9px', fontWeight: '800', backgroundColor: '#CCFBF1', color: '#0F766E', padding: '4px 6px', borderRadius: '4px' },
  numBadge: { fontSize: '9px', fontWeight: '800', backgroundColor: '#E2E8F0', color: '#475569', padding: '3px 6px', borderRadius: '4px' },
  userNameText: { fontSize: '12px', fontWeight: '800', color: '#0F172A' },
  userMetaText: { fontSize: '9px', color: '#64748B' },

  verificationCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '10px', marginBottom: '8px' },
  idPhotoContainer: { marginTop: '6px', backgroundColor: '#F8FAFC', padding: '6px', borderRadius: '6px' },
  idProofThumb: { width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px', marginTop: '4px', border: '1px solid #CBD5E1', cursor: 'pointer' },

  userReportsContainer: { marginTop: '8px', backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', padding: '8px', borderRadius: '8px' },
  userReportEmptyNotice: { fontSize: '10px', color: '#64748B', textAlign: 'center', padding: '6px 0' },
  userReportMiniCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '6px 8px', marginTop: '4px', cursor: 'pointer' },
  userReportMiniTitle: { fontSize: '11px', fontWeight: '800', color: '#0F172A' },
  userReportMiniSub: { fontSize: '9px', color: '#0F766E', fontWeight: '700' },

  verifiedInfoBox: { backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '10px' },
  guestInfoBox: { backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '10px' },
  guestNoticeText: { fontSize: '10px', color: '#64748B', lineHeight: '1.3', margin: '4px 0' },
  verifiedTagRow: { marginBottom: '4px' },

  purgeAllBtn: { width: '100%', padding: '8px', backgroundColor: '#991B1B', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', marginBottom: '6px' },
  cleanMapIframe: { borderRadius: '10px', border: 'none', display: 'block' },
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

  badgeGreen: { fontSize: '8px', fontWeight: '800', backgroundColor: '#DCFCE7', color: '#166534', padding: '2px 5px', borderRadius: '4px' },
  badgeTeal: { fontSize: '8px', fontWeight: '800', backgroundColor: '#CCFBF1', color: '#0F766E', padding: '2px 5px', borderRadius: '4px' },
  badgeOrange: { fontSize: '8px', fontWeight: '800', backgroundColor: '#FFEDD5', color: '#C2410C', padding: '2px 5px', borderRadius: '4px' },
  badgeRed: { fontSize: '8px', fontWeight: '800', backgroundColor: '#FEE2E2', color: '#991B1B', padding: '2px 5px', borderRadius: '4px' },
  badgeBlue: { fontSize: '8px', fontWeight: '800', backgroundColor: '#DBEAFE', color: '#1E40AF', padding: '2px 5px', borderRadius: '4px' },

  modalBackdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '14px', maxWidth: '380px', width: '100%', maxHeight: '85vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  modalTitle: { fontSize: '13px', fontWeight: '800', color: '#0F172A' },
  closeBtn: { backgroundColor: '#F1F5F9', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', color: '#475569' },
  modalBodyStack: { display: 'flex', flexDirection: 'column', gap: '8px' },
  fieldLabel: { fontSize: '8px', fontWeight: '800', color: '#64748B', display: 'block' },
  fieldValBold: { fontSize: '12px', fontWeight: '800', color: '#0F766E' },
  fieldVal: { fontSize: '11px', color: '#0F172A', fontWeight: '600' },
  descText: { fontSize: '11px', color: '#334155', margin: '2px 0 0 0', lineHeight: '1.3' },
  gpsMapBox: { marginTop: '4px', borderRadius: '6px', overflow: 'hidden' },
  photoGalleryGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '4px' },
  galleryThumb: { width: '100%', height: '65px', objectFit: 'cover', borderRadius: '6px', border: '2px solid #0F766E', cursor: 'pointer' },
  modalActionBox: { marginTop: '8px', backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', padding: '8px', borderRadius: '8px' },

  // MESSENGER-STYLE BLURRED PHOTO PREVIEW LIGHTBOX (No Solid Box, Full Glass Blur Overlay)
  messengerBlurBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 9999,
    padding: '20px 16px'
  },
  messengerBlurHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '440px' },
  messengerBlurTitle: { fontSize: '11px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '0.8px', textShadow: '0 1px 2px rgba(0,0,0,0.5)' },
  messengerCloseBtn: { backgroundColor: 'rgba(255, 255, 255, 0.25)', color: '#FFFFFF', border: '1px solid rgba(255, 255, 255, 0.4)', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', backdropFilter: 'blur(10px)' },
  messengerImageWrapper: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', maxWidth: '440px', padding: '12px 0' },
  messengerFloatingImg: { maxWidth: '100%', maxHeight: '78vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }
};

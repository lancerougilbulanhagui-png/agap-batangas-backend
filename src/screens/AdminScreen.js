import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function AdminScreen({ onBack }) {
  // Navigation: 'DASHBOARD' | 'SUBMITTED' | 'TRACKER' | 'USERS' | 'REJECTED' | 'ANALYTICS'
  const [currentView, setCurrentView] = useState('DASHBOARD');

  const [reports, setReports] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Analytics Month Filter (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState('2026-10');

  // Modals & Overlays
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

  // Change Operational Stage
  const handleUpdateReportStatus = async (reportId, newStatus) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: newStatus })
        .eq('id', reportId);

      if (error) throw error;

      alert(`✓ Ticket ${reportId} stage updated to: ${newStatus}`);
      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport({ ...selectedReport, status: newStatus });
      }
      fetchAdminData();
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    }
  };

  // 1-Click Permanent Delete for Rejected Data (2nd Verification Check)
  const handlePurgeAllRejectedData = async () => {
    const rejectedList = reports.filter((r) => ['REJECTED', 'DELETED'].includes((r.status || '').toUpperCase()));
    if (rejectedList.length === 0) {
      alert('No rejected records found in database.');
      return;
    }

    if (window.confirm(`[2nd Verification Check] Are you sure you want to PERMANENTLY delete all ${rejectedList.length} rejected/deleted reports from the database? This action CANNOT be undone.`)) {
      try {
        const { error } = await supabase
          .from('reports')
          .delete()
          .in('status', ['REJECTED', 'DELETED']);

        if (error) throw error;

        alert('✓ All rejected data permanently deleted from database.');
        setSelectedReport(null);
        fetchAdminData();
      } catch (err) {
        alert(`Permanent delete failed: ${err.message}`);
      }
    }
  };

  // User Moderation (Penalty & Device Ban)
  const handleUpdateUserStatus = async (deviceId, newStatus, reason = '') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ verification_status: newStatus })
        .eq('device_id', deviceId);

      if (error) throw error;

      alert(`✓ User status set to: ${newStatus}${reason ? ` (${reason})` : ''}`);
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

  // User Sorting & Categorization
  const verifiedCitizens = profiles
    .filter((p) => (p.verification_status || '').toUpperCase() === 'VERIFIED')
    .sort((a, b) => (a.username || a.full_name || '').localeCompare(b.username || b.full_name || ''));

  const guestUsers = profiles
    .filter((p) => (p.verification_status || 'GUEST').toUpperCase() !== 'VERIFIED');

  // Calendar Analytics Daily Breakdown
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
      {/* Header */}
      <div style={styles.navHeader}>
        <button 
          style={styles.backBtn} 
          onClick={currentView === 'DASHBOARD' ? onBack : () => setCurrentView('DASHBOARD')}
        >
          &lt; {currentView === 'DASHBOARD' ? 'Exit Admin' : 'Admin Dashboard'}
        </button>
        <div>
          <h2 style={styles.headerTitle}>CDRRMO Command Center</h2>
          <div style={styles.headerSub}>Project AGAP Admin Portal</div>
        </div>
      </div>

      {/* 1. MAIN ADMIN DASHBOARD MENU (SIMILAR TO CITIZEN DASHBOARD) */}
      {currentView === 'DASHBOARD' && (
        <div style={styles.dashboardGrid}>
          <div style={styles.moduleCard} onClick={() => setCurrentView('SUBMITTED')}>
            <div style={styles.moduleCardHeader}>
              <span style={styles.moduleIcon}>📥</span>
              <span style={styles.countBadge}>{submittedReports.length} Pending</span>
            </div>
            <h3 style={styles.moduleTitle}>Submitted Reports Database</h3>
            <p style={styles.moduleSub}>Review incoming reports (#AGAP-2026-0001+), inspect photos & triage (Investigate / Approve / Reject).</p>
          </div>

          <div style={styles.moduleCard} onClick={() => setCurrentView('TRACKER')}>
            <div style={styles.moduleCardHeader}>
              <span style={styles.moduleIcon}>🚨</span>
              <span style={styles.countBadge}>{activeTrackerReports.length} Active</span>
            </div>
            <h3 style={styles.moduleTitle}>Active Hazard Tracker</h3>
            <p style={styles.moduleSub}>Manage operational progression: Approved &rarr; Dispatched &rarr; In Progress &rarr; Resolved.</p>
          </div>

          <div style={styles.moduleCard} onClick={() => setCurrentView('USERS')}>
            <div style={styles.moduleCardHeader}>
              <span style={styles.moduleIcon}>👤</span>
              <span style={styles.countBadge}>{profiles.length} Users</span>
            </div>
            <h3 style={styles.moduleTitle}>User & Device Handling</h3>
            <p style={styles.moduleSub}>Alphabetical Verified Citizens, numbered Guest list (#1 to #N), Issue Penalties & Ban Devices.</p>
          </div>

          <div style={styles.moduleCard} onClick={() => setCurrentView('REJECTED')}>
            <div style={styles.moduleCardHeader}>
              <span style={styles.moduleIcon}>🗑️</span>
              <span style={styles.countBadge}>{rejectedDataReports.length} Archived</span>
            </div>
            <h3 style={styles.moduleTitle}>Deleted / Rejected Data</h3>
            <p style={styles.moduleSub}>Archive of rejected submissions with 1-Click Permanent Delete (2nd verification check).</p>
          </div>

          <div style={styles.moduleCard} onClick={() => setCurrentView('ANALYTICS')}>
            <div style={styles.moduleCardHeader}>
              <span style={styles.moduleIcon}>📊</span>
              <span style={styles.countBadge}>Live Map</span>
            </div>
            <h3 style={styles.moduleTitle}>Map & Calendar Analytics</h3>
            <p style={styles.moduleSub}>100% clean live approved hazard map & integrated calendar month trend graphs.</p>
          </div>
        </div>
      )}

      {/* 2. SUBMITTED REPORTS DATABASE */}
      {currentView === 'SUBMITTED' && (
        <div style={styles.sectionStack}>
          <div style={styles.sectionTitle}>Submit Reports Database (Awaiting Triage)</div>
          {isLoading ? (
            <div style={styles.emptyCard}>Loading submitted reports...</div>
          ) : submittedReports.length === 0 ? (
            <div style={styles.emptyCard}>No pending submitted reports in database.</div>
          ) : (
            submittedReports.map((rep) => {
              const photoList = parsePhotos(rep.proof_photos || rep.photos);
              return (
                <div key={rep.id} style={styles.itemCard} onClick={() => setSelectedReport(rep)}>
                  <div style={styles.cardHeaderRow}>
                    <span style={styles.ticketBadge}>{rep.id || rep.ticket_no || '#AGAP-2026-0001'}</span>
                    <span style={styles.badgeOrange}>{rep.status || 'PENDING'}</span>
                  </div>
                  <h4 style={styles.itemTitle}>{rep.hazard_type || rep.category || rep.title || 'Hazard Report'}</h4>
                  <p style={styles.itemSub}>📍 {rep.location || 'Location Not Specified'}</p>
                  
                  {photoList.length > 0 && (
                    <div style={styles.photoCountNotice}>📷 {photoList.length} Evidence Photo(s) Attached (Tap to inspect)</div>
                  )}

                  <div style={styles.actionRow}>
                    <button
                      style={styles.btnInvestigate}
                      onClick={(e) => { e.stopPropagation(); handleUpdateReportStatus(rep.id, 'UNDER_INVESTIGATION'); }}
                    >
                      🔍 Investigate
                    </button>
                    <button
                      style={styles.btnApprove}
                      onClick={(e) => { e.stopPropagation(); handleUpdateReportStatus(rep.id, 'APPROVED'); }}
                    >
                      ✓ Approve
                    </button>
                    <button
                      style={styles.btnReject}
                      onClick={(e) => { e.stopPropagation(); handleUpdateReportStatus(rep.id, 'REJECTED'); }}
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 3. ACTIVE HAZARD TRACKER */}
      {currentView === 'TRACKER' && (
        <div style={styles.sectionStack}>
          <div style={styles.sectionTitle}>Active Approved Hazard Tracker</div>
          {activeTrackerReports.length === 0 ? (
            <div style={styles.emptyCard}>No active approved hazards currently being processed.</div>
          ) : (
            activeTrackerReports.map((rep) => (
              <div key={rep.id} style={styles.itemCard} onClick={() => setSelectedReport(rep)}>
                <div style={styles.cardHeaderRow}>
                  <span style={styles.ticketBadge}>{rep.id || rep.ticket_no}</span>
                  <span style={styles.badgeTeal}>{rep.status}</span>
                </div>
                <h4 style={styles.itemTitle}>{rep.hazard_type || rep.category}</h4>
                <p style={styles.itemSub}>📍 {rep.location}</p>

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
                    🚒 Dispatch
                  </button>
                  <button
                    style={styles.btnInProgress}
                    onClick={(e) => { e.stopPropagation(); handleUpdateReportStatus(rep.id, 'IN_PROGRESS'); }}
                  >
                    ⚡ In Progress
                  </button>
                  <button
                    style={styles.btnResolve}
                    onClick={(e) => { e.stopPropagation(); handleUpdateReportStatus(rep.id, 'RESOLVED'); }}
                  >
                    ✓ Mark Resolved
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. USER & DEVICE HANDLING */}
      {currentView === 'USERS' && (
        <div style={styles.sectionStack}>
          <div style={styles.sectionTitle}>Verified Citizens (Alphabetical Order)</div>
          {verifiedCitizens.length === 0 ? (
            <div style={styles.emptyCard}>No verified citizen profiles found.</div>
          ) : (
            verifiedCitizens.map((user) => (
              <div key={user.device_id || user.id} style={styles.userRowCard} onClick={() => setSelectedUser(user)}>
                <div style={styles.userLeftBox}>
                  <span style={styles.profileIcon}>👤</span>
                  <div>
                    <div style={styles.userNameText}>@{user.username || user.full_name || 'Verified Resident'}</div>
                    <div style={styles.userSubText}>Device ID: {user.device_id || 'N/A'}</div>
                  </div>
                </div>
                <span style={styles.badgeGreen}>VERIFIED</span>
              </div>
            ))
          )}

          <div style={styles.sectionTitle}>Guest / Unverified Users (Sequential List #1 to #N)</div>
          {guestUsers.length === 0 ? (
            <div style={styles.emptyCard}>No guest users found.</div>
          ) : (
            guestUsers.map((user, index) => (
              <div key={user.device_id || user.id} style={styles.userRowCard} onClick={() => setSelectedUser(user)}>
                <div style={styles.userLeftBox}>
                  <span style={styles.numBadge}>#{index + 1}</span>
                  <span style={styles.profileIcon}>👤</span>
                  <div>
                    <div style={styles.userNameText}>@{user.username || 'Guest User'}</div>
                    <div style={styles.userSubText}>Device ID: {user.device_id || 'GUEST-DEV'}</div>
                  </div>
                </div>
                <span style={getUserStatusBadgeStyle(user.verification_status)}>
                  {(user.verification_status || 'GUEST').toUpperCase()}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* 5. DELETED / REJECTED DATA */}
      {currentView === 'REJECTED' && (
        <div style={styles.sectionStack}>
          <div style={styles.sectionTitle}>Deleted & Rejected Reports Archive</div>
          <button style={styles.purgeAllBtn} onClick={handlePurgeAllRejectedData}>
            🗑️ 1-Click Permanent Delete All Rejected Data (2nd Verification)
          </button>

          {rejectedDataReports.length === 0 ? (
            <div style={styles.emptyCard}>No rejected or deleted records archived.</div>
          ) : (
            rejectedDataReports.map((rep) => (
              <div key={rep.id} style={styles.itemCard} onClick={() => setSelectedReport(rep)}>
                <div style={styles.cardHeaderRow}>
                  <span style={styles.ticketBadge}>{rep.id || rep.ticket_no}</span>
                  <span style={styles.badgeRed}>REJECTED</span>
                </div>
                <h4 style={styles.itemTitle}>{rep.hazard_type || rep.category}</h4>
                <p style={styles.itemSub}>Device Fingerprint: {rep.device_id}</p>
                <p style={styles.itemSub}>Remarks: {rep.description}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* 6. MAP & CALENDAR ANALYTICS */}
      {currentView === 'ANALYTICS' && (
        <div style={styles.sectionStack}>
          <div style={styles.sectionTitle}>Live Approved Danger Zone Map (100% Clean Layout)</div>
          <iframe
            title="Admin Hazard Pins Map"
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
              <span style={styles.calendarLabel}>Select Month/Year:</span>
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
            <div style={styles.chartFooterLegend}>Daily Submissions for {selectedMonth}</div>
          </div>
        </div>
      )}

      {/* FULL REPORT DETAIL MODAL */}
      {selectedReport && (
        <div style={styles.modalBackdrop} onClick={() => setSelectedReport(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>Ticket Details & GPS Pin</span>
              <button style={styles.closeBtn} onClick={() => setSelectedReport(null)}>Close X</button>
            </div>

            <div style={styles.modalBodyStack}>
              <div><span style={styles.fieldLabel}>TICKET REF NUMBER:</span> <span style={styles.fieldValBold}>{selectedReport.id || selectedReport.ticket_no}</span></div>
              <div><span style={styles.fieldLabel}>HAZARD TITLE / TYPE:</span> <span style={styles.fieldVal}>{selectedReport.hazard_type || selectedReport.category}</span></div>
              <div><span style={styles.fieldLabel}>LOCATION NAME:</span> <span style={styles.fieldVal}>{selectedReport.location}</span></div>

              <div>
                <span style={styles.fieldLabel}>PINNED GPS LOCATION:</span>
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

              <div><span style={styles.fieldLabel}>DESCRIPTION:</span> <p style={styles.descText}>{selectedReport.description || 'No description provided.'}</p></div>

              {parsePhotos(selectedReport.proof_photos || selectedReport.photos).length > 0 && (
                <div>
                  <span style={styles.fieldLabel}>ATTACHED PHOTOS (Tap to Inspect):</span>
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

      {/* USER MODERATION MODAL */}
      {selectedUser && (
        <div style={styles.modalBackdrop} onClick={() => setSelectedUser(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>User Account Moderation</span>
              <button style={styles.closeBtn} onClick={() => setSelectedUser(null)}>Close X</button>
            </div>

            <div style={styles.modalBodyStack}>
              <div><span style={styles.fieldLabel}>USERNAME:</span> <span style={styles.fieldValBold}>@{selectedUser.username || 'Unregistered'}</span></div>
              <div><span style={styles.fieldLabel}>HARDWARE DEVICE ID:</span> <span style={styles.fieldVal}>{selectedUser.device_id || 'GUEST-DEV'}</span></div>
              <div><span style={styles.fieldLabel}>VERIFICATION STATUS:</span> <span style={getUserStatusBadgeStyle(selectedUser.verification_status)}>{(selectedUser.verification_status || 'GUEST').toUpperCase()}</span></div>

              <div style={styles.modalActionBox}>
                <span style={styles.fieldLabel}>MODERATION ACTIONS:</span>
                <div style={styles.actionRow}>
                  <button style={styles.btnWarn} onClick={() => handleUpdateUserStatus(selectedUser.device_id, 'PENALIZED', 'Warning sent to device')}>
                    ⚠️ Issue Penalty
                  </button>
                  <button style={styles.btnBan} onClick={() => handleUpdateUserStatus(selectedUser.device_id, 'BANNED', 'Device banned')}>
                    🚫 Ban Device ID
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FROSTED WHITE BLUR LIGHTBOX WITH FIXED SHAPE CONTAINER */}
      {inspectImage && (
        <div style={styles.whiteBlurBackdrop} onClick={() => setInspectImage(null)}>
          <div style={styles.whiteBlurContainer} onClick={(e) => e.stopPropagation()}>
            <div style={styles.whiteBlurHeader}>
              <span style={styles.whiteBlurTitle}>PHOTO EVIDENCE PREVIEW</span>
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
  
  // Dashboard Module Menu Cards (Similar to Citizen Home Grid)
  dashboardGrid: { display: 'flex', flexDirection: 'column', gap: '12px' },
  moduleCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '14px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  moduleCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  moduleIcon: { fontSize: '22px' },
  countBadge: { fontSize: '10px', fontWeight: '800', backgroundColor: '#CCFBF1', color: '#0F766E', padding: '2px 8px', borderRadius: '12px' },
  moduleTitle: { fontSize: '14px', fontWeight: '800', color: '#0F172A', margin: '2px 0' },
  moduleSub: { fontSize: '11px', color: '#64748B', margin: 0, lineHeight: '1.4' },

  sectionStack: { display: 'flex', flexDirection: 'column', gap: '10px' },
  sectionTitle: { fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' },
  emptyCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', padding: '16px', borderRadius: '8px', textAlign: 'center', color: '#64748B', fontSize: '11px' },
  itemCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '10px', cursor: 'pointer' },
  cardHeaderRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '4px' },
  ticketBadge: { fontSize: '9px', fontWeight: '800', backgroundColor: '#CCFBF1', color: '#0F766E', padding: '2px 6px', borderRadius: '4px' },
  itemTitle: { fontSize: '13px', fontWeight: '800', color: '#0F172A', margin: '2px 0' },
  itemSub: { fontSize: '11px', color: '#475569', margin: '2px 0' },
  photoCountNotice: { fontSize: '10px', fontWeight: '800', color: '#0F766E', backgroundColor: '#F0FDF4', padding: '4px', borderRadius: '4px', margin: '4px 0' },
  actionRow: { display: 'flex', gap: '6px', marginTop: '6px' },
  btnInvestigate: { flex: 1, padding: '6px', backgroundColor: '#D97706', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '9px', fontWeight: '800', cursor: 'pointer' },
  btnApprove: { flex: 1, padding: '6px', backgroundColor: '#166534', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '9px', fontWeight: '800', cursor: 'pointer' },
  btnReject: { flex: 1, padding: '6px', backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '9px', fontWeight: '800', cursor: 'pointer' },
  btnDispatch: { flex: 1, padding: '6px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '9px', fontWeight: '800', cursor: 'pointer' },
  btnInProgress: { flex: 1, padding: '6px', backgroundColor: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '9px', fontWeight: '800', cursor: 'pointer' },
  btnResolve: { flex: 1, padding: '6px', backgroundColor: '#166534', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '9px', fontWeight: '800', cursor: 'pointer' },
  btnWarn: { flex: 1, padding: '6px', backgroundColor: '#D97706', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '9px', fontWeight: '800', cursor: 'pointer' },
  btnBan: { flex: 1, padding: '6px', backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '9px', fontWeight: '800', cursor: 'pointer' },
  trackerBar: { display: 'flex', gap: '4px', backgroundColor: '#F8FAFC', padding: '6px', borderRadius: '6px', margin: '6px 0' },
  stepActive: { fontSize: '8px', fontWeight: '800', color: '#0F766E', backgroundColor: '#CCFBF1', padding: '2px 4px', borderRadius: '4px' },
  stepDone: { fontSize: '8px', color: '#94A3B8', padding: '2px 4px' },
  userRowCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer' },
  userLeftBox: { display: 'flex', alignItems: 'center', gap: '8px' },
  profileIcon: { fontSize: '16px' },
  numBadge: { fontSize: '10px', fontWeight: '800', color: '#0F766E', backgroundColor: '#CCFBF1', padding: '2px 6px', borderRadius: '4px' },
  userNameText: { fontSize: '12px', fontWeight: '800', color: '#0F172A' },
  userSubText: { fontSize: '9px', color: '#64748B' },
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
  gpsMapBox: { marginTop: '4px', borderRadius: '6px', overflow: 'hidden' },
  photoGalleryGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '4px' },
  galleryThumb: { width: '100%', height: '65px', objectFit: 'cover', borderRadius: '6px', border: '2px solid #0F766E', cursor: 'pointer' },
  modalActionBox: { marginTop: '8px', backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', padding: '8px', borderRadius: '8px' },
  
  // WHITE FROSTED BLUR LIGHTBOX WITH FIXED SHAPE CONTAINER
  whiteBlurBackdrop: { 
    position: 'fixed', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: 'rgba(255, 255, 255, 0.82)', 
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
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    border: '2px solid #0F766E',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  whiteBlurHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '12px' },
  whiteBlurTitle: { fontSize: '11px', fontWeight: '800', color: '#0F766E', letterSpacing: '0.5px' },
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

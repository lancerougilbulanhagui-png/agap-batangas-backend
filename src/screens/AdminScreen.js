import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// Helper to safely extract clean image Base64/URLs
const getCleanImageArray = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // Fallthrough
      }
    }
    return [trimmed];
  }
  return [];
};

export default function AdminScreen({ onBack }) {
  const [activeTab, setActiveTab] = useState('REPORTS');
  const [reports, setReports] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [reportFilterTab, setReportFilterTab] = useState('ALL');
  const [userFilterTab, setUserFilterTab] = useState('ALL');

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
      console.error('Admin fetch error:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateReportStatus = async (reportId, newStatus) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: newStatus })
        .eq('id', reportId);

      if (error) throw error;

      alert(`✓ Report ${reportId} stage set to: ${newStatus}`);
      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport({ ...selectedReport, status: newStatus });
      }
      fetchAdminData();
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const handlePurgeAllDeletedReports = async () => {
    const deletedList = reports.filter((r) => r.status === 'DELETED');
    if (deletedList.length === 0) {
      alert('No deleted reports to purge.');
      return;
    }

    if (window.confirm(`[2nd Verification Check] Permanently delete all ${deletedList.length} archived reports from the database? This action cannot be undone.`)) {
      try {
        const { error } = await supabase
          .from('reports')
          .delete()
          .eq('status', 'DELETED');

        if (error) throw error;

        alert('✓ All deleted reports permanently purged from database.');
        setSelectedReport(null);
        fetchAdminData();
      } catch (err) {
        alert(`Purge failed: ${err.message}`);
      }
    }
  };

  const handleUpdateUserStatus = async (deviceId, newStatus) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ verification_status: newStatus })
        .eq('device_id', deviceId);

      if (error) throw error;

      alert(`✓ User status updated to: ${newStatus}`);
      if (selectedUser && selectedUser.device_id === deviceId) {
        setSelectedUser({ ...selectedUser, verification_status: newStatus });
      }
      fetchAdminData();
    } catch (err) {
      alert(`User status update failed: ${err.message}`);
    }
  };

  const filteredReports = reports.filter((r) => {
    const status = (r.status || 'PENDING').toUpperCase();
    if (reportFilterTab === 'PENDING') return status === 'PENDING';
    if (reportFilterTab === 'INVESTIGATING') return status === 'UNDER_INVESTIGATION';
    if (reportFilterTab === 'DISPATCHED') return status === 'DISPATCHED' || status === 'APPROVED';
    if (reportFilterTab === 'RESOLVED') return status === 'RESOLVED';
    if (reportFilterTab === 'DELETED') return status === 'DELETED' || status === 'REJECTED';
    return true;
  });

  const filteredProfiles = profiles.filter((p) => {
    const status = (p.verification_status || 'PENDING').toUpperCase();
    if (userFilterTab === 'VERIFIED') return status === 'VERIFIED';
    if (userFilterTab === 'GUEST') return status === 'PENDING' || status === 'GUEST';
    if (userFilterTab === 'PENALIZED') return status === 'PENALIZED';
    if (userFilterTab === 'BANNED') return status === 'BANNED';
    return true;
  });

  const getMonthlySubmissionCounts = () => {
    const monthCounts = { Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0, Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0 };
    const monthKeys = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    reports.forEach((rep) => {
      if (rep.created_at) {
        const d = new Date(rep.created_at);
        const monthName = monthKeys[d.getMonth()];
        if (monthCounts[monthName] !== undefined) {
          monthCounts[monthName] += 1;
        }
      }
    });

    return Object.keys(monthCounts).map((m) => ({ month: m, count: monthCounts[m] }));
  };

  const monthlyData = getMonthlySubmissionCounts();
  const maxMonthlyCount = Math.max(...monthlyData.map((d) => d.count), 5);

  return (
    <div style={styles.container}>
      <div style={styles.navHeader}>
        <button style={styles.backBtn} onClick={onBack}>
          &lt; Back
        </button>
        <div>
          <h2 style={styles.headerTitle}>CDRRMO Command Portal</h2>
          <div style={styles.headerSub}>Admin Operations, Lifecycle & User Moderation</div>
        </div>
      </div>

      <div style={styles.tabRow}>
        <button
          style={activeTab === 'REPORTS' ? styles.tabActive : styles.tabInactive}
          onClick={() => setActiveTab('REPORTS')}
        >
          Reports ({reports.length})
        </button>
        <button
          style={activeTab === 'USERS' ? styles.tabActive : styles.tabInactive}
          onClick={() => setActiveTab('USERS')}
        >
          User Accounts ({profiles.length})
        </button>
        <button
          style={activeTab === 'MAP_ANALYTICS' ? styles.tabActive : styles.tabInactive}
          onClick={() => setActiveTab('MAP_ANALYTICS')}
        >
          Map & Trends
        </button>
      </div>

      {activeTab === 'REPORTS' && (
        <div style={styles.sectionStack}>
          <div style={styles.subTabRow}>
            {['ALL', 'PENDING', 'INVESTIGATING', 'DISPATCHED', 'RESOLVED', 'DELETED'].map((f) => (
              <button
                key={f}
                style={reportFilterTab === f ? styles.subTabActive : styles.subTabInactive}
                onClick={() => setReportFilterTab(f)}
              >
                {f}
              </button>
            ))}
          </div>

          {reportFilterTab === 'DELETED' && (
            <button style={styles.purgeBtn} onClick={handlePurgeAllDeletedReports}>
              🗑️ 1-Click Permanent Purge All Deleted Reports (2nd Verification)
            </button>
          )}

          {isLoading ? (
            <div style={styles.emptyCard}>Loading report stream...</div>
          ) : filteredReports.length === 0 ? (
            <div style={styles.emptyCard}>No reports found in this operational stage.</div>
          ) : (
            filteredReports.map((rep) => {
              const photoArray = getCleanImageArray(rep.proof_photos || []);

              return (
                <div
                  key={rep.id || `${rep.device_id}-${rep.created_at}`}
                  style={styles.compactReportCard}
                  onClick={() => setSelectedReport(rep)}
                >
                  <div style={styles.compactHeaderRow}>
                    <span style={styles.ticketBadge}>{rep.ticket_no || rep.id || 'TICKET'}</span>
                    <span style={getStatusBadgeStyle(rep.status)}>{rep.status || 'PENDING'}</span>
                  </div>
                  <h4 style={styles.compactReportTitle}>{rep.hazard_type || rep.category || 'Hazard Alert'}</h4>
                  <p style={styles.compactReportDesc}>
                    {rep.description ? (rep.description.length > 70 ? `${rep.description.substring(0, 70)}...` : rep.description) : 'No description provided.'}
                  </p>

                  {photoArray.length > 0 && (
                    <div style={styles.compactPhotoBar}>
                      <div style={styles.thumbStrip}>
                        {photoArray.slice(0, 3).map((src, i) => (
                          <img key={i} src={src} alt={`Thumb ${i}`} style={styles.compactThumbImg} />
                        ))}
                      </div>
                      <span style={styles.compactPhotoLabel}>📷 {photoArray.length} Photo(s) Attached</span>
                    </div>
                  )}

                  <div style={styles.compactTapHint}>Tap to view full GPS map, details & update stage &rarr;</div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'USERS' && (
        <div style={styles.sectionStack}>
          <div style={styles.subTabRow}>
            {['ALL', 'VERIFIED', 'GUEST', 'PENALIZED', 'BANNED'].map((f) => (
              <button
                key={f}
                style={userFilterTab === f ? styles.subTabActive : styles.subTabInactive}
                onClick={() => setUserFilterTab(f)}
              >
                {f}
              </button>
            ))}
          </div>

          <div style={styles.compactUserList}>
            {filteredProfiles.length === 0 ? (
              <div style={styles.emptyCard}>No user accounts matching selected status.</div>
            ) : (
              filteredProfiles.map((u) => {
                const userReports = reports.filter((r) => r.device_id === u.device_id);
                const status = (u.verification_status || 'GUEST').toUpperCase();

                return (
                  <div
                    key={u.device_id || `${u.username || 'unknown'}-${Math.random()}`}
                    style={styles.compactUserRow}
                    onClick={() => setSelectedUser(u)}
                  >
                    <div style={styles.userInfoLeft}>
                      <div style={styles.userNameText}>@{u.username || 'Unregistered'}</div>
                      <div style={styles.userDeviceSub}>Device ID: {u.device_id}</div>
                    </div>

                    <div style={styles.userInfoRight}>
                      <span style={getUserBadgeStyle(status)}>{status}</span>
                      <span style={styles.activityDotText}>• Active Session</span>
                      <span style={styles.reportCountText}>Reports: {userReports.length}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'MAP_ANALYTICS' && (
        <div style={styles.sectionStack}>
          <div style={styles.sectionTitle}>Live Approved Danger Zone Map (Citizen Sync)</div>
          <div style={styles.mapCard}>
            <div style={styles.mapHeaderRow}>
              <span style={styles.mapScopeTag}>Showing Approved & Dispatched Hazard Pins</span>
            </div>
            <iframe
              title="Admin Danger Map View"
              width="100%"
              height="200"
              frameBorder="0"
              scrolling="no"
              src="https://maps.google.com/maps?q=Batangas%20City&z=12&output=embed"
              style={styles.mapIframe}
            ></iframe>
          </div>

          <div style={styles.sectionTitle}>Real Monthly Submission Trends (Live Database)</div>
          <div style={styles.chartCard}>
            <div style={styles.chartTitleRow}>
              <span>Submissions per Month (2026)</span>
              <span style={styles.chartTotalBadge}>Total: {reports.length}</span>
            </div>

            <div style={styles.barGraphContainer}>
              {monthlyData.map((m) => {
                const heightPct = Math.max((m.count / maxMonthlyCount) * 100, 8);
                return (
                  <div key={m.month} style={styles.barCol}>
                    <div style={styles.barValueLabel}>{m.count > 0 ? m.count : ''}</div>
                    <div style={styles.barTrack}>
                      <div style={{ ...styles.barFill, height: `${heightPct}%` }}></div>
                    </div>
                    <div style={styles.barMonthLabel}>{m.month}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {selectedReport && (
        <div style={styles.modalBackdrop} onClick={() => setSelectedReport(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>Full Report & GPS Tracking</span>
              <button style={styles.modalCloseBtn} onClick={() => setSelectedReport(null)}>Close X</button>
            </div>

            <div style={styles.verticalDetailStack}>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>TICKET REFERENCE NUMBER</span>
                <span style={styles.detailValueBold}>{selectedReport.ticket_no || selectedReport.id || 'N/A'}</span>
              </div>

              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>CURRENT LIFECYCLE STAGE</span>
                <span style={getStatusBadgeStyle(selectedReport.status)}>{selectedReport.status || 'PENDING'}</span>
              </div>

              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>HAZARD CATEGORY / TYPE</span>
                <span style={styles.detailValue}>{selectedReport.hazard_type || selectedReport.category}</span>
              </div>

              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>SEVERITY URGENCY LEVEL</span>
                <span style={styles.detailValueBadge}>{selectedReport.severity || 'MODERATE'}</span>
              </div>

              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>LOCATION NAME</span>
                <span style={styles.detailValue}>{selectedReport.location}</span>
              </div>

              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>EXACT GPS COORDINATES & TRACKING MAP</span>
                <span style={styles.detailValue}>{selectedReport.coordinates || '13.7565, 121.0583'}</span>
                <div style={styles.gpsMapBox}>
                  <iframe
                    title="Exact Hazard GPS Location"
                    width="100%"
                    height="140"
                    frameBorder="0"
                    scrolling="no"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedReport.coordinates || '13.7565,121.0583')}&t=m&z=16&ie=UTF8&iwloc=&output=embed`}
                    style={{ borderRadius: '6px', border: '1px solid #0F766E' }}
                  ></iframe>
                </div>
              </div>

              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>DESCRIPTION & REMARKS</span>
                <p style={styles.detailTextBody}>{selectedReport.description || 'No description provided.'}</p>
              </div>

              {getCleanImageArray(selectedReport.proof_photos || []).length > 0 && (
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>
                    ATTACHED EVIDENCE ({getCleanImageArray(selectedReport.proof_photos || []).length} Photos - Tap to Inspect)
                  </span>
                  <div style={styles.modalPhotoGallery}>
                    {getCleanImageArray(selectedReport.proof_photos || []).map((src, idx) => (
                      <img
                        key={idx}
                        src={src}
                        alt={`Evidence ${idx + 1}`}
                        style={styles.galleryPhotoThumb}
                        onClick={() => setInspectImage(src)}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>SENDER DEVICE FINGERPRINT</span>
                <span style={styles.detailValue}>{selectedReport.device_id || 'GUEST-DEV'}</span>
              </div>

              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>SUBMISSION TIMESTAMP</span>
                <span style={styles.detailValue}>{selectedReport.created_at ? new Date(selectedReport.created_at).toLocaleString() : 'Recently'}</span>
              </div>

              <div style={styles.stageJudgeBox}>
                <span style={styles.stageJudgeTitle}>PROCEED TO OPERATIONAL STAGE:</span>
                <div style={styles.stageBtnGrid}>
                  <button
                    style={styles.btnStagePending}
                    onClick={() => handleUpdateReportStatus(selectedReport.id, 'PENDING')}
                  >
                    1. Pending
                  </button>
                  <button
                    style={styles.btnStageInvestigate}
                    onClick={() => handleUpdateReportStatus(selectedReport.id, 'UNDER_INVESTIGATION')}
                  >
                    2. Investigate
                  </button>
                  <button
                    style={styles.btnStageDispatch}
                    onClick={() => handleUpdateReportStatus(selectedReport.id, 'DISPATCHED')}
                  >
                    3. Dispatch Unit
                  </button>
                  <button
                    style={styles.btnStageResolve}
                    onClick={() => handleUpdateReportStatus(selectedReport.id, 'RESOLVED')}
                  >
                    4. Mark Resolved
                  </button>
                  <button
                    style={styles.btnStageDelete}
                    onClick={() => handleUpdateReportStatus(selectedReport.id, 'DELETED')}
                  >
                    Delete Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedUser && (
        <div style={styles.modalBackdrop} onClick={() => setSelectedUser(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>User Account & Submission History</span>
              <button style={styles.modalCloseBtn} onClick={() => setSelectedUser(null)}>Close X</button>
            </div>

            <div style={styles.verticalDetailStack}>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>USERNAME</span>
                <span style={styles.detailValueBold}>@{selectedUser.username || 'Unregistered'}</span>
              </div>

              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>FULL LEGAL NAME</span>
                <span style={styles.detailValue}>{selectedUser.full_name || 'Not Provided'}</span>
              </div>

              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>MOBILE PHONE</span>
                <span style={styles.detailValue}>{selectedUser.phone_number || 'N/A'}</span>
              </div>

              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>BARANGAY RESIDENCY</span>
                <span style={styles.detailValue}>{selectedUser.barangay || 'Batangas City'}</span>
              </div>

              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>HARDWARE DEVICE FINGERPRINT</span>
                <span style={styles.detailValue}>{selectedUser.device_id}</span>
              </div>

              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>ACCOUNT STATUS</span>
                <span style={getUserBadgeStyle(selectedUser.verification_status)}>
                  {selectedUser.verification_status || 'GUEST / PENDING'}
                </span>
              </div>

              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>SUBMITTED HAZARD REPORTS HISTORY</span>
                <div style={styles.userReportsList}>
                  {reports.filter((r) => r.device_id === selectedUser.device_id).length === 0 ? (
                    <div style={styles.userReportEmpty}>No reports submitted by this account.</div>
                  ) : (
                    reports
                      .filter((r) => r.device_id === selectedUser.device_id)
                      .map((rep) => (
                        <div key={rep.id || `${rep.device_id}-${rep.created_at}`} style={styles.userReportMiniCard}>
                          <div style={{ fontSize: '11px', fontWeight: '800', color: '#0F172A' }}>
                            {rep.ticket_no || rep.id || 'REPORT'} - {rep.hazard_type || rep.category}
                          </div>
                          <div style={{ fontSize: '9px', color: '#64748B' }}>
                            {rep.location} • Status: {rep.status}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

              <div style={styles.stageJudgeBox}>
                <span style={styles.stageJudgeTitle}>ACCOUNT & PENALTY ACTIONS:</span>
                <div style={styles.stageBtnGrid}>
                  {selectedUser.verification_status !== 'VERIFIED' ? (
                    <button
                      style={styles.btnStageResolve}
                      onClick={() => handleUpdateUserStatus(selectedUser.device_id, 'VERIFIED')}
                    >
                      ✓ Approve Resident
                    </button>
                  ) : (
                    <div style={styles.verifiedResidentTag}>✓ Verified Resident (Approved)</div>
                  )}

                  <button
                    style={styles.btnStagePenalty}
                    onClick={() => handleUpdateUserStatus(selectedUser.device_id, 'PENALIZED')}
                  >
                    ⚠️ Issue Penalty
                  </button>

                  <button
                    style={styles.btnStageBan}
                    onClick={() => handleUpdateUserStatus(selectedUser.device_id, 'BANNED')}
                  >
                    🚫 Ban Device ID
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {inspectImage && (
        <div style={styles.imageZoomBackdrop} onClick={() => setInspectImage(null)}>
          <div style={styles.imageZoomContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.imageZoomHeader}>
              <span style={styles.imageZoomTitle}>Photo Evidence Inspection</span>
              <button style={styles.imageZoomCloseBtn} onClick={() => setInspectImage(null)}>
                Close [X]
              </button>
            </div>
            <div style={styles.imageZoomBody}>
              <img src={inspectImage} alt="Full Zoom Evidence" style={styles.crispZoomImg} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusBadgeStyle(status) {
  const s = (status || 'PENDING').toUpperCase();
  if (s === 'RESOLVED') return styles.badgeGreen;
  if (s === 'DISPATCHED' || s === 'APPROVED') return styles.badgeTeal;
  if (s === 'UNDER_INVESTIGATION') return styles.badgeYellow;
  if (s === 'REJECTED' || s === 'DELETED') return styles.badgeRed;
  return styles.badgeOrange;
}

function getUserBadgeStyle(status) {
  const s = (status || 'GUEST').toUpperCase();
  if (s === 'VERIFIED') return styles.badgeGreen;
  if (s === 'PENALIZED') return styles.badgeYellow;
  if (s === 'BANNED' || s === 'DELETED') return styles.badgeRed;
  return styles.badgeOrange;
}

const styles = {
  container: { maxWidth: '440px', margin: '0 auto', padding: '16px', fontFamily: "'Inter', sans-serif" },
  navHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' },
  backBtn: { backgroundColor: 'transparent', border: 'none', color: '#0F766E', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  headerTitle: { fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 },
  headerSub: { fontSize: '11px', color: '#64748B' },
  tabRow: { display: 'flex', gap: '4px', backgroundColor: '#E2E8F0', padding: '3px', borderRadius: '8px', marginBottom: '14px' },
  tabActive: { flex: 1, padding: '8px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  tabInactive: { flex: 1, padding: '8px', backgroundColor: 'transparent', color: '#475569', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: '700', cursor: 'pointer' },
  sectionStack: { display: 'flex', flexDirection: 'column', gap: '10px' },
  sectionTitle: { fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' },
  emptyCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', padding: '16px', borderRadius: '8px', textAlign: 'center', color: '#64748B', fontSize: '11px' },
  compactReportCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '10px', cursor: 'pointer' },
  compactHeaderRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '4px' },
  ticketBadge: { fontSize: '9px', fontWeight: '800', backgroundColor: '#CCFBF1', color: '#0F766E', padding: '2px 6px', borderRadius: '4px' },
  compactReportTitle: { fontSize: '13px', fontWeight: '800', color: '#0F172A', margin: '2px 0' },
  compactReportDesc: { fontSize: '11px', color: '#475569', margin: '2px 0 6px 0' },
  compactPhotoBar: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#F0FDF4', border: '1px solid #A7F3D0', padding: '4px 8px', borderRadius: '6px', marginBottom: '6px' },
  thumbStrip: { display: 'flex', gap: '4px' },
  compactThumbImg: { width: '28px', height: '28px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #0F766E' },
  compactPhotoLabel: { fontSize: '9px', fontWeight: '800', color: '#0F766E' },
  compactTapHint: { fontSize: '9px', fontWeight: '800', color: '#0F766E' },
  subTabRow: { display: 'flex', gap: '4px', overflowX: 'auto', marginBottom: '8px', paddingBottom: '2px' },
  subTabActive: { padding: '4px 8px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '9px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap' },
  subTabInactive: { padding: '4px 8px', backgroundColor: '#E2E8F0', color: '#475569', border: 'none', borderRadius: '4px', fontSize: '9px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' },
  purgeBtn: { width: '100%', padding: '8px', backgroundColor: '#991B1B', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', marginBottom: '8px' },
  compactUserList: { display: 'flex', flexDirection: 'column', gap: '6px' },
  compactUserRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer' },
  userInfoLeft: { display: 'flex', flexDirection: 'column' },
  userNameText: { fontSize: '12px', fontWeight: '800', color: '#0F172A' },
  userDeviceSub: { fontSize: '9px', color: '#64748B' },
  userInfoRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' },
  activityDotText: { fontSize: '9px', color: '#166534', fontWeight: '700' },
  reportCountText: { fontSize: '9px', color: '#64748B' },
  badgeGreen: { fontSize: '8px', fontWeight: '800', backgroundColor: '#DCFCE7', color: '#166534', padding: '2px 5px', borderRadius: '4px' },
  badgeTeal: { fontSize: '8px', fontWeight: '800', backgroundColor: '#CCFBF1', color: '#0F766E', padding: '2px 5px', borderRadius: '4px' },
  badgeOrange: { fontSize: '8px', fontWeight: '800', backgroundColor: '#FFEDD5', color: '#C2410C', padding: '2px 5px', borderRadius: '4px' },
  badgeYellow: { fontSize: '8px', fontWeight: '800', backgroundColor: '#FEF3C7', color: '#92400E', padding: '2px 5px', borderRadius: '4px' },
  badgeRed: { fontSize: '8px', fontWeight: '800', backgroundColor: '#FEE2E2', color: '#991B1B', padding: '2px 5px', borderRadius: '4px' },
  mapCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '8px', marginBottom: '10px' },
  mapHeaderRow: { marginBottom: '6px' },
  mapScopeTag: { fontSize: '9px', fontWeight: '800', color: '#0F766E', backgroundColor: '#CCFBF1', padding: '2px 6px', borderRadius: '4px' },
  mapIframe: { borderRadius: '6px', border: '1px solid #CBD5E1', display: 'block' },
  chartCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '12px' },
  chartTitleRow: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '800', color: '#0F172A', marginBottom: '10px' },
  chartTotalBadge: { fontSize: '9px', backgroundColor: '#CCFBF1', color: '#0F766E', padding: '2px 6px', borderRadius: '4px' },
  barGraphContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '120px', paddingTop: '10px', borderBottom: '1px solid #CBD5E1' },
  barCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 },
  barValueLabel: { fontSize: '8px', fontWeight: '800', color: '#0F766E', height: '12px' },
  barTrack: { width: '8px', height: '80px', backgroundColor: '#F1F5F9', borderRadius: '4px', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', backgroundColor: '#0F766E', borderRadius: '4px' },
  barMonthLabel: { fontSize: '8px', color: '#64748B', marginTop: '4px' },
  modalBackdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '14px', maxWidth: '380px', width: '100%', maxHeight: '85vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  modalTitle: { fontSize: '13px', fontWeight: '800', color: '#0F172A' },
  modalCloseBtn: { backgroundColor: '#F1F5F9', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', color: '#475569' },
  verticalDetailStack: { display: 'flex', flexDirection: 'column', gap: '10px' },
  detailItem: { display: 'flex', flexDirection: 'column', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' },
  detailLabel: { fontSize: '8px', fontWeight: '800', color: '#64748B', letterSpacing: '0.5px' },
  detailValueBold: { fontSize: '12px', fontWeight: '800', color: '#0F766E' },
  detailValue: { fontSize: '11px', color: '#0F172A', fontWeight: '600' },
  detailValueBadge: { fontSize: '10px', fontWeight: '800', color: '#DC2626' },
  detailTextBody: { fontSize: '11px', color: '#334155', margin: '2px 0 0 0', lineHeight: '1.3' },
  gpsMapBox: { marginTop: '6px', borderRadius: '6px', overflow: 'hidden' },
  modalPhotoGallery: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '6px' },
  galleryPhotoThumb: { width: '100%', height: '70px', objectFit: 'cover', borderRadius: '6px', border: '2px solid #0F766E', cursor: 'pointer' },
  userReportsList: { display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' },
  userReportMiniCard: { backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '6px', borderRadius: '6px' },
  userReportEmpty: { fontSize: '10px', color: '#64748B' },
  stageJudgeBox: { marginTop: '8px', backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', padding: '10px', borderRadius: '8px' },
  stageJudgeTitle: { fontSize: '9px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '6px' },
  stageBtnGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' },
  btnStagePending: { padding: '7px', backgroundColor: '#FFEDD5', border: '1px solid #FDBA74', color: '#C2410C', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  btnStageInvestigate: { padding: '7px', backgroundColor: '#FEF3C7', border: '1px solid #FDE047', color: '#92400E', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  btnStageDispatch: { padding: '7px', backgroundColor: '#CCFBF1', border: '1px solid #99F6E4', color: '#0F766E', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  btnStageResolve: { padding: '7px', backgroundColor: '#166534', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  btnStageDelete: { padding: '7px', backgroundColor: '#475569', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  btnStagePenalty: { padding: '7px', backgroundColor: '#D97706', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  btnStageBan: { padding: '7px', backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  verifiedResidentTag: { padding: '7px', backgroundColor: '#DCFCE7', border: '1px solid #86EFAC', color: '#166534', borderRadius: '6px', fontSize: '10px', fontWeight: '800', textAlign: 'center' },
  imageZoomBackdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.92)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '16px' },
  imageZoomContent: { backgroundColor: '#1E293B', borderRadius: '12px', padding: '16px', maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', width: '100%' },
  imageZoomHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  imageZoomTitle: { fontSize: '12px', fontWeight: '800', color: '#F8FAFC' },
  imageZoomCloseBtn: { backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' },
  imageZoomBody: { display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, overflow: 'hidden' },
  crispZoomImg: { maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '8px', border: '2px solid #0F766E' }
};
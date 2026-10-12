import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// Helper to safely extract clean Base64 / URL from raw string or JSON array
const getCleanImageSrc = (raw) => {
  if (!raw) return null;

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return typeof parsed[0] === 'string' ? parsed[0] : null;
        }
      } catch (e) {
        // Fallthrough if parsing fails
      }
    }
    return trimmed;
  }

  if (Array.isArray(raw) && raw.length > 0) {
    return typeof raw[0] === 'string' ? raw[0] : null;
  }

  return null;
};

export default function AdminScreen({ onBack }) {
  const [activeTab, setActiveTab] = useState('REPORTS'); // 'REPORTS' | 'USERS' | 'MAP_ANALYTICS'
  const [reports, setReports] = useState([]);
  const [profiles, setProfiles] = useState([]);

  // Modals
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [inspectImage, setInspectImage] = useState(null);

  const [userFilterTab, setUserFilterTab] = useState('ALL');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
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
    }
  };

  const handleUpdateReportStatus = async (reportId, newStatus) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: newStatus })
        .eq('id', reportId);

      if (error) throw error;

      alert(`✓ Report ${reportId} operational stage updated to: ${newStatus}`);
      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport({ ...selectedReport, status: newStatus });
      }
      fetchAdminData();
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const handleUpdateUserStatus = async (deviceId, newStatus) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ verification_status: newStatus })
        .eq('device_id', deviceId);

      if (error) throw error;

      alert(`User verification updated to: ${newStatus}`);
      if (selectedUser && selectedUser.device_id === deviceId) {
        setSelectedUser({ ...selectedUser, verification_status: newStatus });
      }
      fetchAdminData();
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    }
  };

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

  const approvedReports = reports.filter((r) => r.status === 'APPROVED' || r.status === 'DISPATCHED');
  const monthlyData = getMonthlySubmissionCounts();
  const maxMonthlyCount = Math.max(...monthlyData.map((d) => d.count), 5);

  const filteredProfiles = profiles.filter((p) => {
    const status = p.verification_status || 'PENDING';
    if (userFilterTab === 'VERIFIED') return status === 'VERIFIED';
    if (userFilterTab === 'GUEST') return status !== 'VERIFIED' && status !== 'DELETED';
    if (userFilterTab === 'DELETED') return status === 'DELETED';
    return true;
  });

  const selectedReportPhoto = selectedReport ? getCleanImageSrc(selectedReport.proof_photos || null) : null;
  const selectedUserProofPhoto = selectedUser
    ? getCleanImageSrc(selectedUser.id_proof_photo || selectedUser.proof_photo || selectedUser.proofPhotos || null)
    : null;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.navHeader}>
        <button style={styles.backBtn} onClick={onBack}>
          &lt; Back
        </button>
        <div>
          <h2 style={styles.headerTitle}>CDRRMO Command Portal</h2>
          <div style={styles.headerSub}>Admin Operations & Process Control</div>
        </div>
      </div>

      {/* Primary Tabs */}
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
          Users ({profiles.length})
        </button>
        <button
          style={activeTab === 'MAP_ANALYTICS' ? styles.tabActive : styles.tabInactive}
          onClick={() => setActiveTab('MAP_ANALYTICS')}
        >
          Map & Trends
        </button>
      </div>

      {/* 1. REPORT PROCESS STREAM */}
      {activeTab === 'REPORTS' && (
        <div style={styles.sectionStack}>
          <div style={styles.sectionTitle}>Incoming Reports Stream (Click card to change stage)</div>

          {reports.length === 0 ? (
            <div style={styles.emptyCard}>No hazard reports submitted in database.</div>
          ) : (
            reports.map((rep, index) => {
              const photoSrc = getCleanImageSrc(rep.proof_photos || null);

              return (
                <div
                  key={rep.id || rep.ticket_no || `${rep.device_id || 'device'}-${index}`}
                  style={styles.compactReportCard}
                  onClick={() => setSelectedReport(rep)}
                >
                  <div style={styles.compactHeaderRow}>
                    <span style={styles.ticketBadge}>{rep.ticket_no || rep.id || 'TICKET'}</span>
                    <span style={getStatusBadgeStyle(rep.status)}>{rep.status || 'PENDING'}</span>
                  </div>
                  <h4 style={styles.compactReportTitle}>{rep.hazard_type || rep.category || 'Hazard Alert'}</h4>
                  <p style={styles.compactReportDesc}>
                    {rep.description ? (rep.description.length > 65 ? `${rep.description.substring(0, 65)}...` : rep.description) : 'No description provided.'}
                  </p>

                  {/* Thumbnail Preview in Compact List */}
                  {photoSrc && (
                    <div style={styles.compactPhotoBar}>
                      <img src={photoSrc} alt="Evidence Thumb" style={styles.compactThumbImg} />
                      <span style={styles.compactPhotoLabel}>📷 Evidence Attached (Tap to Inspect)</span>
                    </div>
                  )}

                  <div style={styles.compactTapHint}>Tap to view full info & update operational stage &rarr;</div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 2. USER MODERATION */}
      {activeTab === 'USERS' && (
        <div style={styles.sectionStack}>
          <div style={styles.subTabRow}>
            {['ALL', 'VERIFIED', 'GUEST', 'DELETED'].map((f) => (
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
              <div style={styles.emptyCard}>No user records matching filter.</div>
            ) : (
              filteredProfiles.map((u) => {
                const userReports = reports.filter((r) => r.device_id === u.device_id);
                const isVerified = u.verification_status === 'VERIFIED';

                return (
                  <div
                    key={u.device_id || u.username || u.id || 'user'}
                    style={styles.compactUserRow}
                    onClick={() => setSelectedUser(u)}
                  >
                    <div style={styles.userInfoLeft}>
                      <div style={styles.userNameText}>@{u.username || 'GuestUser'}</div>
                      <div style={styles.userDeviceSub}>ID: {u.device_id}</div>
                    </div>

                    <div style={styles.userInfoRight}>
                      <span style={isVerified ? styles.badgeGreen : styles.badgeOrange}>
                        {isVerified ? 'VERIFIED' : 'GUEST'}
                      </span>
                      <span style={styles.activityDotText}>• Active</span>
                      <span style={styles.reportCountText}>Reports: {userReports.length}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 3. DANGER MAP & REAL MONTHLY ANALYTICS */}
      {activeTab === 'MAP_ANALYTICS' && (
        <div style={styles.sectionStack}>
          <div style={styles.sectionTitle}>Live Approved Danger Zone Map (Citizen View)</div>
          <div style={styles.mapCard}>
            <div style={styles.mapHeaderRow}>
              <span style={styles.mapScopeTag}>Showing {approvedReports.length} Approved / Dispatched Hazards</span>
            </div>
            <iframe
              title="Admin Danger Map View"
              width="100%"
              height="180"
              frameBorder="0"
              scrolling="no"
              src="https://www.openstreetmap.org/export/embed.html?bbox=120.93%2C13.64%2C121.12%2C13.80&layer=mapnik"
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

      {/* VERTICAL REPORT DETAIL & OPERATIONAL STAGE CONTROL MODAL */}
      {selectedReport && (
        <div style={styles.modalBackdrop} onClick={() => setSelectedReport(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>Full Hazard Report Details</span>
              <button style={styles.modalCloseBtn} onClick={() => setSelectedReport(null)}>Close X</button>
            </div>

            <div style={styles.verticalDetailStack}>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>TICKET REFERENCE NUMBER</span>
                <span style={styles.detailValueBold}>{selectedReport.ticket_no || selectedReport.id || 'N/A'}</span>
              </div>

              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>CURRENT STAGE STATUS</span>
                <span style={getStatusBadgeStyle(selectedReport.status)}>{selectedReport.status || 'PENDING'}</span>
              </div>

              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>HAZARD TYPE / CATEGORY</span>
                <span style={styles.detailValue}>{selectedReport.hazard_type || selectedReport.category}</span>
              </div>

              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>SEVERITY URGENCY LEVEL</span>
                <span style={styles.detailValueBadge}>{selectedReport.severity || 'MODERATE'}</span>
              </div>

              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>LOCATION DETAILS</span>
                <span style={styles.detailValue}>{selectedReport.location}</span>
              </div>

              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>PINNED GPS COORDINATES</span>
                <span style={styles.detailValue}>{selectedReport.coordinates || 'N/A'}</span>
              </div>

              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>DESCRIPTION & REMARKS</span>
                <p style={styles.detailTextBody}>{selectedReport.description || 'No description provided.'}</p>
              </div>

              {/* Clean Image Rendering in Modal */}
              {selectedReportPhoto && (
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>ATTACHED EVIDENCE PHOTO (CLICK TO ZOOM)</span>
                  <img
                    src={selectedReportPhoto}
                    alt="Submitted Evidence"
                    style={styles.detailPhotoThumb}
                    onClick={() => setInspectImage(selectedReportPhoto)}
                  />
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

              {/* STAGE PROCESS CONTROL BUTTONS */}
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
                    style={styles.btnStageReject}
                    onClick={() => handleUpdateReportStatus(selectedReport.id, 'REJECTED')}
                  >
                    Reject
                  </button>
                  <button
                    style={styles.btnStageDelete}
                    onClick={() => handleUpdateReportStatus(selectedReport.id, 'DELETED')}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USER DETAIL MODAL */}
      {selectedUser && (
        <div style={styles.modalBackdrop} onClick={() => setSelectedUser(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>User Account Details</span>
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
                <span style={styles.detailValue}>{selectedUser.phone_number || selectedUser.phone || 'N/A'}</span>
              </div>

              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>BARANGAY RESIDENCY</span>
                <span style={styles.detailValue}>{selectedUser.barangay || 'Batangas City'}</span>
              </div>

              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>DEVICE FINGERPRINT</span>
                <span style={styles.detailValue}>{selectedUser.device_id}</span>
              </div>

              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>VERIFICATION STATUS</span>
                <span style={styles.detailValueBadge}>{selectedUser.verification_status || 'GUEST / PENDING'}</span>
              </div>

              {selectedUserProofPhoto && (
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>ID PROOF PHOTO (CLICK TO ZOOM)</span>
                  <img
                    src={selectedUserProofPhoto}
                    alt="User ID Proof"
                    style={styles.detailPhotoThumb}
                    onClick={() => setInspectImage(selectedUserProofPhoto)}
                  />
                </div>
              )}

              <div style={styles.stageJudgeBox}>
                <span style={styles.stageJudgeTitle}>VERIFICATION ACTIONS:</span>
                <div style={styles.stageBtnRow}>
                  <button
                    style={styles.btnStageResolve}
                    onClick={() => handleUpdateUserStatus(selectedUser.device_id, 'VERIFIED')}
                  >
                    Approve Citizen
                  </button>
                  <button
                    style={styles.btnStageDelete}
                    onClick={() => handleUpdateUserStatus(selectedUser.device_id, 'DELETED')}
                  >
                    Reject / Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CRISP HIGH-RESOLUTION PHOTO INSPECTION ZOOM MODAL */}
      {inspectImage && (
        <div style={styles.imageZoomBackdrop} onClick={() => setInspectImage(null)}>
          <div style={styles.imageZoomContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.imageZoomHeader}>
              <span style={styles.imageZoomTitle}>Photo Evidence Verification (1st Observation)</span>
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
  if (s === 'DISPATCHED') return styles.badgeTeal;
  if (s === 'UNDER_INVESTIGATION') return styles.badgeYellow;
  if (s === 'REJECTED' || s === 'DELETED') return styles.badgeRed;
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
  compactThumbImg: { width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #0F766E' },
  compactPhotoLabel: { fontSize: '9px', fontWeight: '800', color: '#0F766E' },
  compactTapHint: { fontSize: '9px', fontWeight: '800', color: '#0F766E' },
  subTabRow: { display: 'flex', gap: '4px', marginBottom: '8px' },
  subTabActive: { padding: '4px 8px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '9px', fontWeight: '800', cursor: 'pointer' },
  subTabInactive: { padding: '4px 8px', backgroundColor: '#E2E8F0', color: '#475569', border: 'none', borderRadius: '4px', fontSize: '9px', fontWeight: '600', cursor: 'pointer' },
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
  detailPhotoThumb: { width: '120px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #0F766E', marginTop: '6px', cursor: 'pointer' },
  stageJudgeBox: { marginTop: '8px', backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', padding: '10px', borderRadius: '8px' },
  stageJudgeTitle: { fontSize: '9px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '6px' },
  stageBtnGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' },
  stageBtnRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' },
  btnStagePending: { padding: '7px', backgroundColor: '#FFEDD5', border: '1px solid #FDBA74', color: '#C2410C', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  btnStageInvestigate: { padding: '7px', backgroundColor: '#FEF3C7', border: '1px solid #FDE047', color: '#92400E', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  btnStageDispatch: { padding: '7px', backgroundColor: '#CCFBF1', border: '1px solid #99F6E4', color: '#0F766E', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  btnStageResolve: { padding: '7px', backgroundColor: '#166534', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  btnStageReject: { padding: '7px', backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  btnStageDelete: { padding: '7px', backgroundColor: '#475569', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  
  // High Resolution Inspection Zoom Modal Styles
  imageZoomBackdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.92)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '16px' },
  imageZoomContent: { backgroundColor: '#1E293B', borderRadius: '12px', padding: '16px', maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', width: '100%' },
  imageZoomHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  imageZoomTitle: { fontSize: '12px', fontWeight: '800', color: '#F8FAFC' },
  imageZoomCloseBtn: { backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' },
  imageZoomBody: { display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, overflow: 'hidden' },
  crispZoomImg: { maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '8px', border: '2px solid #0F766E' }
};
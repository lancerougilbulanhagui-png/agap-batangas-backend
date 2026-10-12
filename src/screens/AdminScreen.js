import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function AdminScreen({ onBack }) {
  const [activeTab, setActiveTab] = useState('REPORTS'); // 'REPORTS' | 'USERS' | 'MAP_ANALYTICS'
  const [reports, setReports] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Expanded View State
  const [selectedReport, setSelectedReport] = useState(null); // Vertical Full Report Detail Modal
  const [selectedUser, setSelectedUser] = useState(null);     // User Info Pop-up Modal
  const [inspectImage, setInspectImage] = useState(null);     // Full Photo Zoom Modal

  // User Filter Sub-Tabs
  const [userFilterTab, setUserFilterTab] = useState('ALL'); // 'ALL' | 'VERIFIED' | 'GUEST' | 'DELETED'

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

      alert(`Report ${reportId} stage updated to: ${newStatus}`);
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

  // Calculate Monthly Submission Trend from Actual Supabase Database Timestamps
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

    return monthKeys.map((m) => ({ month: m, count: monthCounts[m] }));
  };

  const approvedReports = reports.filter((r) => r.status === 'APPROVED');
  const monthlyData = getMonthlySubmissionCounts();
  const maxMonthlyCount = Math.max(...monthlyData.map((d) => d.count), 5);

  const filteredProfiles = profiles.filter((p) => {
    const status = p.verification_status || 'PENDING';
    if (userFilterTab === 'VERIFIED') return status === 'VERIFIED';
    if (userFilterTab === 'GUEST') return status !== 'VERIFIED' && status !== 'DELETED';
    if (userFilterTab === 'DELETED') return status === 'DELETED';
    return true;
  });

  return (
    <div style={styles.container}>
      {/* Portal Header */}
      <div style={styles.navHeader}>
        <button style={styles.backBtn} onClick={onBack}>
          &lt; Back
        </button>
        <div>
          <h2 style={styles.headerTitle}>CDRRMO Command Portal</h2>
          <div style={styles.headerSub}>Admin Operations & Moderation</div>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
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
          User Moderation ({profiles.length})
        </button>
        <button
          style={activeTab === 'MAP_ANALYTICS' ? styles.tabActive : styles.tabInactive}
          onClick={() => setActiveTab('MAP_ANALYTICS')}
        >
          Map & Analytics
        </button>
      </div>

      {/* 1. REPORT MODERATION TAB */}
      {activeTab === 'REPORTS' && (
        <div style={styles.sectionStack}>
          <div style={styles.sectionTitle}>Incoming Reports (Click card for full details)</div>
          
          {reports.length === 0 ? (
            <div style={styles.emptyCard}>No hazard reports submitted in database.</div>
          ) : (
            reports.map((rep) => (
              <div
                key={rep.id || rep.report_id || rep._id || rep.ticket_no || 'report'}
                style={styles.compactReportCard}
                onClick={() => setSelectedReport(rep)}
              >
                <div style={styles.compactHeaderRow}>
                  <span style={styles.ticketBadge}>{rep.ticket_no || rep.id || 'TICKET'}</span>
                  <span style={getStatusBadgeStyle(rep.status)}>{rep.status || 'PENDING'}</span>
                </div>
                <h4 style={styles.compactReportTitle}>{rep.hazard_type || rep.category || 'Hazard Alert'}</h4>
                <p style={styles.compactReportDesc}>
                  {rep.description ? (rep.description.length > 60 ? `${rep.description.substring(0, 60)}...` : rep.description) : 'No description provided.'}
                </p>
                <div style={styles.compactTapHint}>Tap to view all submitted info & judge stage &rarr;</div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 2. USER MODERATION TAB */}
      {activeTab === 'USERS' && (
        <div style={styles.sectionStack}>
          {/* Sub Filter Chips */}
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
                    key={u.device_id || u.username || 'user'}
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
                      <span style={styles.activityDotText}>• Online Activity</span>
                      <span style={styles.reportCountText}>
                        Reports: {userReports.length}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 3. COMBINED DANGER MAP & REAL ANALYTICS TAB */}
      {activeTab === 'MAP_ANALYTICS' && (
        <div style={styles.sectionStack}>
          {/* Citizen-style Approved Danger Map */}
          <div style={styles.sectionTitle}>Live Approved Danger Zone Map (Citizen View)</div>
          <div style={styles.mapCard}>
            <div style={styles.mapHeaderRow}>
              <span style={styles.mapScopeTag}>Showing {approvedReports.length} Approved Hazards</span>
            </div>
            <iframe
              title="Admin Danger Map View"
              width="100%"
              height="200"
              frameBorder="0"
              scrolling="no"
              src="[suspicious link removed]13.7565,121.0583&t=m&z=14&ie=UTF8&iwloc=&output=embed"
              style={styles.mapIframe}
            ></iframe>
          </div>

          {/* Real Monthly Trends Chart */}
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

      {/* VERTICAL FULL REPORT DETAIL MODAL */}
      {selectedReport && (
        <div style={styles.modalBackdrop} onClick={() => setSelectedReport(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>Full Report Details</span>
              <button style={styles.modalCloseBtn} onClick={() => setSelectedReport(null)}>Close X</button>
            </div>

            <div style={styles.verticalDetailStack}>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>TICKET REFERENCE NUMBER</span>
                <span style={styles.detailValueBold}>{selectedReport.ticket_no || selectedReport.id || 'N/A'}</span>
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

              {selectedReport.proof_photos && (
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>ATTACHED EVIDENCE PHOTO</span>
                  <img
                    src={selectedReport.proof_photos}
                    alt="Submitted Evidence"
                    style={styles.detailPhotoThumb}
                    onClick={() => setInspectImage(selectedReport.proof_photos)}
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

              {/* Stage Judgment Actions */}
              <div style={styles.stageJudgeBox}>
                <span style={styles.stageJudgeTitle}>PROCEED TO NEXT OPERATIONAL STAGE:</span>
                <div style={styles.stageBtnRow}>
                  <button
                    style={styles.btnStageApprove}
                    onClick={() => handleUpdateReportStatus(selectedReport.id, 'APPROVED')}
                  >
                    Approve (Map Pin)
                  </button>
                  <button
                    style={styles.btnStageInvestigate}
                    onClick={() => handleUpdateReportStatus(selectedReport.id, 'UNDER_INVESTIGATION')}
                  >
                    Investigate
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

      {/* USER DETAIL POP-UP MODAL */}
      {selectedUser && (
        <div style={styles.modalBackdrop} onClick={() => setSelectedUser(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>User Account & Submissions</span>
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
                <span style={styles.detailValue}>{selectedUser.mobile_phone || 'N/A'}</span>
              </div>

              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>BARANGAY RESIDENCY</span>
                <span style={styles.detailValue}>{selectedUser.barangay || 'Batangas City'}</span>
              </div>

              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>DEVICE ID FINGERPRINT</span>
                <span style={styles.detailValue}>{selectedUser.device_id}</span>
              </div>

              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>VERIFICATION STATUS</span>
                <span style={styles.detailValueBadge}>{selectedUser.verification_status || 'GUEST / PENDING'}</span>
              </div>

              {selectedUser.id_proof_photo && (
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>ID PROOF PHOTO</span>
                  <img
                    src={selectedUser.id_proof_photo}
                    alt="User ID Proof"
                    style={styles.detailPhotoThumb}
                    onClick={() => setInspectImage(selectedUser.id_proof_photo)}
                  />
                </div>
              )}

              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>SUBMITTED HAZARD REPORTS</span>
                <span style={styles.detailValue}>
                  {reports.filter((r) => r.device_id === selectedUser.device_id).length} Reports Total
                </span>
              </div>

              {/* Moderation Actions */}
              <div style={styles.stageJudgeBox}>
                <span style={styles.stageJudgeTitle}>VERIFICATION ACTIONS:</span>
                <div style={styles.stageBtnRow}>
                  <button
                    style={styles.btnStageApprove}
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

      {/* FULL PHOTO ZOOM MODAL */}
      {inspectImage && (
        <div style={styles.modalBackdrop} onClick={() => setInspectImage(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>Inspect Full Image</span>
              <button style={styles.modalCloseBtn} onClick={() => setInspectImage(null)}>Close X</button>
            </div>
            <img src={inspectImage} alt="Full Zoom Evidence" style={styles.fullModalImg} />
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusBadgeStyle(status) {
  const s = (status || 'PENDING').toUpperCase();
  if (s === 'APPROVED') return styles.badgeGreen;
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
  detailPhotoThumb: { width: '100px', height: '75px', objectFit: 'cover', borderRadius: '6px', border: '2px solid #0F766E', marginTop: '4px', cursor: 'pointer' },
  stageJudgeBox: { marginTop: '8px', backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', padding: '10px', borderRadius: '8px' },
  stageJudgeTitle: { fontSize: '9px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '6px' },
  stageBtnRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' },
  btnStageApprove: { padding: '8px', backgroundColor: '#166534', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  btnStageInvestigate: { padding: '8px', backgroundColor: '#D97706', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  btnStageReject: { padding: '8px', backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  btnStageDelete: { padding: '8px', backgroundColor: '#475569', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  fullModalImg: { width: '100%', height: 'auto', borderRadius: '8px', border: '1px solid #CBD5E1' }
};
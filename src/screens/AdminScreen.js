import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function AdminScreen({ onBack }) {
  const [activeTab, setActiveTab] = useState('REPORTS'); // 'REPORTS' | 'USERS' | 'ANALYTICS'
  const [reports, setReports] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [userFilterTab, setUserFilterTab] = useState('PENDING'); // 'PENDING' | 'VERIFIED' | 'DELETED'
  
  // Image Inspection Modal State
  const [inspectImage, setInspectImage] = useState(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      // Fetch Reports
      const { data: repData } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (repData) setReports(repData);

      // Fetch Profiles
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

      alert(`Report ${reportId} status updated to: ${newStatus}`);
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

      alert(`User verification status set to: ${newStatus}`);
      fetchAdminData();
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    }
  };

  // 2nd Verification: Purge All Deleted User Applications
  const handlePurgeAllDeleted = async () => {
    const deletedUsers = profiles.filter(p => p.verification_status === 'DELETED');
    if (deletedUsers.length === 0) {
      alert('No deleted applications to purge.');
      return;
    }

    if (window.confirm(`[2nd Verification Check] Are you sure you want to permanently purge all ${deletedUsers.length} deleted application records?`)) {
      try {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('verification_status', 'DELETED');

        if (error) throw error;

        alert('✓ All deleted applications permanently purged.');
        fetchAdminData();
      } catch (err) {
        alert(`Purge failed: ${err.message}`);
      }
    }
  };

  const filteredProfiles = profiles.filter(p => {
    const status = p.verification_status || 'PENDING';
    if (userFilterTab === 'VERIFIED') return status === 'VERIFIED';
    if (userFilterTab === 'DELETED') return status === 'DELETED';
    return status === 'PENDING';
  });

  return (
    <div style={styles.container}>
      {/* Navigation Header */}
      <div style={styles.navHeader}>
        <button style={styles.backBtn} onClick={onBack}>
          &lt; Back
        </button>
        <div>
          <h2 style={styles.headerTitle}>CDRRMO Command Portal</h2>
          <div style={styles.headerSub}>Admin Disaster Control & Moderation</div>
        </div>
      </div>

      {/* Main Tab Navigation */}
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
          User Verification
        </button>
        <button
          style={activeTab === 'ANALYTICS' ? styles.tabActive : styles.tabInactive}
          onClick={() => setActiveTab('ANALYTICS')}
        >
          Monthly Trends
        </button>
      </div>

      {/* 1. REPORT MODERATION TAB */}
      {activeTab === 'REPORTS' && (
        <div style={styles.sectionStack}>
          <div style={styles.sectionTitle}>Incident Reports Stream</div>
          {reports.length === 0 ? (
            <div style={styles.emptyCard}>No hazard reports submitted yet.</div>
          ) : (
            reports.map((rep) => (
              <div key={rep.id || rep.ticket_no || 'report'} style={styles.reportCard}>
                <div style={styles.cardHeader}>
                  <span style={styles.ticketBadge}>{rep.ticket_no || rep.id || 'TICKET'}</span>
                  <span style={styles.severityTag}>{rep.severity || 'UNKNOWN'}</span>
                </div>

                <h4 style={styles.reportTitle}>{rep.hazard_type || rep.category}</h4>
                <div style={styles.reportMeta}>Location: {rep.location}</div>
                <div style={styles.reportMeta}>Status: <strong>{rep.status || 'PENDING'}</strong></div>
                <p style={styles.reportDesc}>{rep.description}</p>

                {/* Submitted Photo Evidence with Click-to-Inspect Modal */}
                {rep.proof_photos && (
                  <div style={styles.photoContainer}>
                    <span style={styles.photoLabel}>Attached Evidence (Click to Inspect):</span>
                    <img
                      src={rep.proof_photos}
                      alt="Hazard Evidence"
                      style={styles.clickableThumbnail}
                      onClick={() => setInspectImage(rep.proof_photos)}
                    />
                  </div>
                )}

                {/* Status Action Buttons */}
                <div style={styles.actionBtnGroup}>
                  <button
                    style={styles.btnApprove}
                    onClick={() => handleUpdateReportStatus(rep.id, 'APPROVED')}
                  >
                    Approve
                  </button>
                  <button
                    style={styles.btnDispatch}
                    onClick={() => handleUpdateReportStatus(rep.id, 'DISPATCHED')}
                  >
                    Dispatch Unit
                  </button>
                  <button
                    style={styles.btnResolve}
                    onClick={() => handleUpdateReportStatus(rep.id, 'RESOLVED')}
                  >
                    Resolve
                  </button>
                  <button
                    style={styles.btnDelete}
                    onClick={() => handleUpdateReportStatus(rep.id, 'DELETED')}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 2. COMPACT USER VERIFICATION TAB */}
      {activeTab === 'USERS' && (
        <div style={styles.sectionStack}>
          {/* Sub-Filter Tabs */}
          <div style={styles.subTabRow}>
            <button
              style={userFilterTab === 'PENDING' ? styles.subTabActive : styles.subTabInactive}
              onClick={() => setUserFilterTab('PENDING')}
            >
              Pending
            </button>
            <button
              style={userFilterTab === 'VERIFIED' ? styles.subTabActive : styles.subTabInactive}
              onClick={() => setUserFilterTab('VERIFIED')}
            >
              Approved
            </button>
            <button
              style={userFilterTab === 'DELETED' ? styles.subTabActive : styles.subTabInactive}
              onClick={() => setUserFilterTab('DELETED')}
            >
              Deleted
            </button>
          </div>

          {userFilterTab === 'DELETED' && (
            <button style={styles.purgeBtn} onClick={handlePurgeAllDeleted}>
              Purge All Deleted Applications (2nd Verification)
            </button>
          )}

          {/* Compact Space-Saving User Table */}
          <div style={styles.compactUserList}>
            {filteredProfiles.length === 0 ? (
              <div style={styles.emptyCard}>No user applications in this folder.</div>
            ) : (
              filteredProfiles.map((user) => (
                <div key={user.device_id || user.id || user.username || 'user'} style={styles.compactUserRow}>
                  <div style={styles.userInfoCol}>
                    <div style={styles.userNameText}>@{user.username || 'Unregistered'}</div>
                    <div style={styles.userDeviceText}>Device: {user.device_id}</div>
                  </div>

                  <div style={styles.userActionsCol}>
                    {userFilterTab === 'PENDING' && (
                      <>
                        <button
                          style={styles.btnMiniVerify}
                          onClick={() => handleUpdateUserStatus(user.device_id, 'VERIFIED')}
                        >
                          Approve
                        </button>
                        <button
                          style={styles.btnMiniDelete}
                          onClick={() => handleUpdateUserStatus(user.device_id, 'DELETED')}
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {userFilterTab === 'VERIFIED' && (
                      <span style={styles.verifiedPill}>VERIFIED</span>
                    )}

                    {userFilterTab === 'DELETED' && (
                      <span style={styles.deletedPill}>ARCHIVED</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. MONTHLY ANALYTICS TREND GRAPH */}
      {activeTab === 'ANALYTICS' && (
        <div style={styles.sectionStack}>
          <div style={styles.sectionTitle}>Monthly Incident Volume Trends (2026)</div>
          
          <div style={styles.chartCard}>
            {/* SVG Line & Area Graph */}
            <svg viewBox="0 0 360 180" style={styles.svgChart}>
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0F766E" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#0F766E" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="30" y1="30" x2="340" y2="30" stroke="#E2E8F0" strokeWidth="1" />
              <line x1="30" y1="70" x2="340" y2="70" stroke="#E2E8F0" strokeWidth="1" />
              <line x1="30" y1="110" x2="340" y2="110" stroke="#E2E8F0" strokeWidth="1" />
              <line x1="30" y1="150" x2="340" y2="150" stroke="#CBD5E1" strokeWidth="1.5" />

              {/* Area Fill */}
              <path
                d="M30 150 L30 120 Q 80 140, 110 90 T 190 70 T 270 40 T 340 80 L340 150 Z"
                fill="url(#chartGrad)"
              />

              {/* Trend Line */}
              <path
                d="M30 120 Q 80 140, 110 90 T 190 70 T 270 40 T 340 80"
                fill="none"
                stroke="#0F766E"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Data Points */}
              <circle cx="30" cy="120" r="4" fill="#0F766E" />
              <circle cx="110" cy="90" r="4" fill="#0F766E" />
              <circle cx="190" cy="70" r="4" fill="#0F766E" />
              <circle cx="270" cy="40" r="5" fill="#DC2626" />
              <circle cx="340" cy="80" r="4" fill="#0F766E" />

              {/* Month Labels */}
              <text x="25" y="166" fontSize="9" fill="#64748B">Jan</text>
              <text x="80" y="166" fontSize="9" fill="#64748B">Mar</text>
              <text x="140" y="166" fontSize="9" fill="#64748B">May</text>
              <text x="200" y="166" fontSize="9" fill="#64748B">Jul</text>
              <text x="260" y="166" fontSize="9" fill="#64748B">Sep</text>
              <text x="325" y="166" fontSize="9" fill="#64748B">Nov</text>
            </svg>

            <div style={styles.chartLegendRow}>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendDot, backgroundColor: '#0F766E' }}></span>
                <span>Incident Trend Line</span>
              </div>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendDot, backgroundColor: '#DC2626' }}></span>
                <span>Peak Rainy Season</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL SCREEN PHOTO INSPECTION MODAL */}
      {inspectImage && (
        <div style={styles.modalBackdrop} onClick={() => setInspectImage(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>Photo Evidence Inspection</span>
              <button style={styles.modalCloseBtn} onClick={() => setInspectImage(null)}>
                Close X
              </button>
            </div>
            <img src={inspectImage} alt="Full Size Evidence" style={styles.fullModalImg} />
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '440px', margin: '0 auto', padding: '16px', fontFamily: "'Inter', sans-serif" },
  navHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' },
  backBtn: { backgroundColor: 'transparent', border: 'none', color: '#0F766E', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  headerTitle: { fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 },
  headerSub: { fontSize: '11px', color: '#64748B' },
  tabRow: { display: 'flex', gap: '4px', backgroundColor: '#E2E8F0', padding: '3px', borderRadius: '8px', marginBottom: '14px' },
  tabActive: { flex: 1, padding: '8px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' },
  tabInactive: { flex: 1, padding: '8px', backgroundColor: 'transparent', color: '#475569', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' },
  sectionStack: { display: 'flex', flexDirection: 'column', gap: '10px' },
  sectionTitle: { fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' },
  emptyCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', padding: '16px', borderRadius: '8px', textAlign: 'center', color: '#64748B', fontSize: '11px' },
  reportCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '12px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px' },
  ticketBadge: { fontSize: '10px', fontWeight: '800', backgroundColor: '#CCFBF1', color: '#0F766E', padding: '2px 6px', borderRadius: '4px' },
  severityTag: { fontSize: '10px', fontWeight: '800', backgroundColor: '#FEE2E2', color: '#991B1B', padding: '2px 6px', borderRadius: '4px' },
  reportTitle: { fontSize: '13px', fontWeight: '800', color: '#0F172A', margin: '2px 0' },
  reportMeta: { fontSize: '10px', color: '#64748B' },
  reportDesc: { fontSize: '11px', color: '#334155', margin: '6px 0', lineHeight: '1.3' },
  photoContainer: { marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #F1F5F9' },
  photoLabel: { fontSize: '9px', fontWeight: '800', color: '#0F766E', display: 'block', marginBottom: '4px' },
  clickableThumbnail: { width: '80px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '2px solid #0F766E', cursor: 'pointer' },
  actionBtnGroup: { display: 'flex', gap: '4px', marginTop: '10px' },
  btnApprove: { flex: 1, padding: '6px', backgroundColor: '#DCFCE7', border: '1px solid #86EFAC', color: '#166534', borderRadius: '4px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  btnDispatch: { flex: 1, padding: '6px', backgroundColor: '#FEF3C7', border: '1px solid #FDE047', color: '#854D0E', borderRadius: '4px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  btnResolve: { flex: 1, padding: '6px', backgroundColor: '#CCFBF1', border: '1px solid #99F6E4', color: '#0F766E', borderRadius: '4px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  btnDelete: { flex: 1, padding: '6px', backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '4px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  subTabRow: { display: 'flex', gap: '6px', marginBottom: '10px' },
  subTabActive: { padding: '6px 12px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  subTabInactive: { padding: '6px 12px', backgroundColor: '#E2E8F0', color: '#475569', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: '600', cursor: 'pointer' },
  purgeBtn: { width: '100%', padding: '8px', backgroundColor: '#991B1B', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', marginBottom: '10px' },
  compactUserList: { display: 'flex', flexDirection: 'column', gap: '6px' },
  compactUserRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', padding: '8px 10px', borderRadius: '6px' },
  userInfoCol: { display: 'flex', flexDirection: 'column' },
  userNameText: { fontSize: '12px', fontWeight: '800', color: '#0F172A' },
  userDeviceText: { fontSize: '9px', color: '#64748B' },
  userActionsCol: { display: 'flex', gap: '4px', alignItems: 'center' },
  btnMiniVerify: { padding: '4px 8px', backgroundColor: '#166534', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  btnMiniDelete: { padding: '4px 8px', backgroundColor: '#991B1B', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  verifiedPill: { fontSize: '9px', fontWeight: '800', color: '#166534', backgroundColor: '#DCFCE7', padding: '2px 6px', borderRadius: '4px' },
  deletedPill: { fontSize: '9px', fontWeight: '800', color: '#991B1B', backgroundColor: '#FEE2E2', padding: '2px 6px', borderRadius: '4px' },
  chartCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '12px' },
  svgChart: { width: '100%', height: 'auto' },
  chartLegendRow: { display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '10px', fontSize: '10px', color: '#475569' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '4px' },
  legendDot: { width: '8px', height: '8px', borderRadius: '50%' },
  modalBackdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '12px', maxWidth: '380px', width: '100%' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  modalTitle: { fontSize: '12px', fontWeight: '800', color: '#0F172A' },
  modalCloseBtn: { backgroundColor: '#F1F5F9', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', color: '#475569' },
  fullModalImg: { width: '100%', height: 'auto', borderRadius: '8px', border: '1px solid #CBD5E1' }
};
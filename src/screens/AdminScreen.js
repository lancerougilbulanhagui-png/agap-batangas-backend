import React, { useState } from 'react';

export default function AdminScreen({ onBack, reports = [], setReports, onDeleteReport }) {
  const [adminTab, setAdminTab] = useState('database');
  const [selectedReport, setSelectedReport] = useState(null);
  const [activeAdminPinId, setActiveAdminPinId] = useState(null);

  const [noticeText, setNoticeText] = useState('');
  const [assignedUnit, setAssignedUnit] = useState('CDRRMO Rescue Truck 04');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const openInspectorModal = (report) => {
    setSelectedReport(report);
    const repTitle = report['title'];
    const repLoc = report['location'];
    setNoticeText(
      `[AGAP CDRRMO DISPATCH NOTICE]: Response Unit (${assignedUnit}) has been assigned to your report "${repTitle}" at ${repLoc}. Please remain in a safe area.`
    );
  };

  const handleUpdateReportStatus = (statusType) => {
    setIsProcessingAction(true);
    setTimeout(() => {
      if (typeof setReports === 'function') {
        setReports(prev =>
          prev['map'](r => (r['id'] === selectedReport['id'] ? { ...r, status: statusType } : r))
        );
      }
      setIsProcessingAction(false);
      const repId = selectedReport['id'];
      const repPhone = selectedReport['userPhone'];
      alert(
        `✓ Action Executed: Report [${repId}] marked as ${statusType}.\nNotice Dispatched to ${repPhone}`
      );
      setSelectedReport(null);
    }, 500);
  };

  const handleDeleteTicket = (reportId) => {
    if (window.confirm(`🗑️ Delete Ticket [${reportId}] permanently from database?`)) {
      if (typeof onDeleteReport === 'function') {
        onDeleteReport(reportId);
      } else if (typeof setReports === 'function') {
        setReports(prev => prev['filter'](r => r['id'] !== reportId));
      }
      setSelectedReport(null);
      alert(`✓ Ticket [${reportId}] permanently removed.`);
    }
  };

  const currentMapPin = reports['find'](r => r['id'] === activeAdminPinId) || reports || {
    id: 'BAT-CENTER',
    title: 'Batangas City Command Center',
    coordinates: '13.7565, 121.0583'
  };

  return (
    <div style={styles.container}>
      {/* Navigation Header */}
      <div style={styles.navHeader}>
        <button style={styles.backBtn} onClick={onBack}>
          &lt; Back
        </button>
        <div style={styles.headerTitleBlock}>
          <div style={styles.headerTitleRow}>
            <h2 style={styles.headerTitle}>CDRRMO Command Center</h2>
            <span style={styles.adminBadge}>ADMIN DASHBOARD</span>
          </div>
          <div style={styles.headerSub}>Batangas City LGU Disaster Operations Platform</div>
        </div>
      </div>

      {/* TAB 1: DATABASE / INBOX SUBMISSIONS */}
      {adminTab === 'database' && (
        <div style={styles.viewSection}>
          <div style={styles.sectionHeaderRow}>
            <span style={styles.sectionHeader}>Submitted Reports Database ({reports.length})</span>
            <span style={styles.livePulse}>● LIVE FEED</span>
          </div>

          {reports.length === 0 ? (
            <div style={styles.emptyCard}>
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>📭</div>
              <h4 style={{ margin: '0', fontSize: '13px', color: '#0F172A', fontWeight: '800' }}>No Submitted Reports Yet</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#64748B' }}>
                Switch to Citizen/Guest mode in the top bar and submit a hazard report to test!
              </p>
            </div>
          ) : (
            <div style={styles.reportFileList}>
              {reports['map']((item) => (
                <div key={item['id']} style={styles.fileCard}>
                  <div style={styles.fileCardHeader}>
                    <div style={styles.fileMetaLeft}>
                      <span style={styles.fileIdTag}>{item['id']}</span>
                      <span style={item['userRole'] === 'CITIZEN' ? styles.tagCitizen : styles.tagGuest}>
                        {item['userRole']}
                      </span>
                    </div>

                    <span
                      style={
                        item['status'] === 'APPROVED'
                          ? styles.statusGreen
                          : item['status'] === 'REJECTED'
                          ? styles.statusRed
                          : item['status'] === 'INVESTIGATING'
                          ? styles.statusBlue
                          : styles.statusYellow
                      }
                    >
                      {item['status']}
                    </span>
                  </div>

                  <h4 style={styles.fileTitle}>{item['title']}</h4>
                  <div style={styles.fileMetaRow}>
                    <span>📍 {item['location']}</span>
                    <span style={styles.timeText}>{item['submittedAt']}</span>
                  </div>

                  <div style={styles.cardActionRow}>
                    <button style={styles.processFileBtn} onClick={() => openInspectorModal(item)}>
                      Process &amp; Dispatch &rarr;
                    </button>
                    <button style={styles.deleteFileBtn} onClick={() => handleDeleteTicket(item['id'])}>
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ANALYTICS */}
      {adminTab === 'analytics' && (
        <div style={styles.viewSection}>
          <div style={styles.sectionHeader}>Data Science Disaster Analytics</div>
          <div style={styles.analyticsGrid}>
            <div style={styles.statCard}>
              <span style={styles.statBigNum}>{reports.length}</span>
              <span style={styles.statLabel}>Total Incidents Logged</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statBigNumOrange}>{reports['filter'](r => r['status'] === 'PENDING').length}</span>
              <span style={styles.statLabel}>Pending Action</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statBigNumGreen}>{reports['filter'](r => r['status'] === 'APPROVED').length}</span>
              <span style={styles.statLabel}>Approved &amp; Dispatched</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statBigNumRed}>{reports['filter'](r => r['status'] === 'REJECTED').length}</span>
              <span style={styles.statLabel}>Declined / Invalid</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INCIDENT MAP */}
      {adminTab === 'map' && (
        <div style={styles.viewSection}>
          <div style={styles.sectionHeaderRow}>
            <span style={styles.sectionHeader}>Geographical Hazard Pins ({reports.length})</span>
          </div>

          <div style={styles.mapContainerCard}>
            <div style={styles.mapHeaderBanner}>
              SELECTED PIN: <strong>{currentMapPin['id']}</strong> • {currentMapPin['title'] || currentMapPin['location']} ({currentMapPin['coordinates']})
            </div>
            <div style={styles.adminMapBox}>
              <div style={styles.adminGridPattern}></div>
              <div style={styles.adminCenterPin}>
                <span style={styles.adminPulseCircle}></span>
                <span style={styles.adminPinIcon}>📍</span>
              </div>
              <div style={styles.adminCoordsBadge}>GPS: {currentMapPin['coordinates']}</div>
            </div>
          </div>

          {reports.length === 0 ? (
            <div style={styles.emptyCard}>📍 No pinned hazard locations on map yet.</div>
          ) : (
            <div style={styles.pinnedList}>
              {reports['map']((r) => (
                <div
                  key={r['id']}
                  style={r['id'] === activeAdminPinId ? styles.pinnedCardSelected : styles.pinnedCard}
                  onClick={() => setActiveAdminPinId(r['id'])}
                >
                  <div style={styles.pinnedTop}>
                    <span style={styles.pinnedTag}>{r['id']} • {r['category']}</span>
                    <span style={styles.pinnedCoords}>📍 {r['coordinates']}</span>
                  </div>
                  <h4 style={styles.pinnedName}>{r['title']}</h4>
                  <div style={styles.pinnedLoc}>{r['location']}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* INSPECTOR MODAL WITH DELETE BUTTON */}
      {selectedReport && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <div>
                <span style={styles.modalSubHeader}>FILE INSPECTOR</span>
                <h3 style={styles.modalTitle}>Process Ticket {selectedReport['id']}</h3>
              </div>
              <button style={styles.closeBtn} onClick={() => setSelectedReport(null)}>✕</button>
            </div>

            <div style={styles.fullWidthField}>
              <span style={styles.fieldLabel}>LOCATION &amp; COORDINATES</span>
              <div style={styles.fieldVal}>📍 {selectedReport['location']}</div>
              <div style={styles.coordSub}>GPS: {selectedReport['coordinates']}</div>
            </div>

            <div style={styles.fullWidthField}>
              <span style={styles.fieldLabel}>HAZARD REMARKS</span>
              <p style={styles.descText}>{selectedReport['details']}</p>
            </div>

            <div style={styles.dispatchSection}>
              <label style={styles.inputLabel}>ASSIGN RESPONDER UNIT:</label>
              <select
                style={styles.selectInput}
                value={assignedUnit}
                onChange={(e) => setAssignedUnit(e.target.value)}
              >
                <option value="CDRRMO Rescue Truck 04">CDRRMO Rescue Truck 04</option>
                <option value="BFP Alangilan Fire Unit">BFP Alangilan Fire Unit</option>
                <option value="PNP Station Patrol Unit">PNP Station Patrol Unit</option>
              </select>

              <div style={styles.buttonStack}>
                <button
                  style={isProcessingAction ? styles.btnDisabled : styles.btnApprove}
                  onClick={() => handleUpdateReportStatus('APPROVED')}
                  disabled={isProcessingAction}
                >
                  ✓ Approve &amp; Dispatch {assignedUnit}
                </button>

                <button
                  style={isProcessingAction ? styles.btnDisabled : styles.btnInvestigate}
                  onClick={() => handleUpdateReportStatus('INVESTIGATING')}
                  disabled={isProcessingAction}
                >
                  🔍 Set Under Investigation
                </button>

                <button
                  style={isProcessingAction ? styles.btnDisabled : styles.btnReject}
                  onClick={() => handleUpdateReportStatus('REJECTED')}
                  disabled={isProcessingAction}
                >
                  ✕ Decline Report
                </button>

                <button style={styles.btnDelete} onClick={() => handleDeleteTicket(selectedReport['id'])}>
                  🗑️ Permanently Delete Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER NAV */}
      <div style={styles.adminFooterNav}>
        <button style={adminTab === 'database' ? styles.navActive : styles.navInactive} onClick={() => setAdminTab('database')}>
          <span>Database</span>
        </button>
        <button style={adminTab === 'analytics' ? styles.navActive : styles.navInactive} onClick={() => setAdminTab('analytics')}>
          <span>Analytics</span>
        </button>
        <button style={adminTab === 'map' ? styles.navActive : styles.navInactive} onClick={() => setAdminTab('map')}>
          <span>Incident Map</span>
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '440px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#F8FAFC', padding: '20px 18px 84px 18px', fontFamily: "'Inter', sans-serif" },
  navHeader: { display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' },
  backBtn: { backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F766E', fontSize: '13px', fontWeight: '800', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' },
  headerTitleBlock: { display: 'flex', flexDirection: 'column' },
  headerTitleRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  headerTitle: { fontSize: '17px', fontWeight: '800', color: '#0F172A', margin: 0 },
  adminBadge: { fontSize: '9px', fontWeight: '800', backgroundColor: '#0F766E', color: '#FFFFFF', padding: '3px 8px', borderRadius: '4px' },
  headerSub: { fontSize: '11px', color: '#64748B', marginTop: '2px' },
  viewSection: { display: 'flex', flexDirection: 'column', gap: '16px' },
  sectionHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  sectionHeader: { fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' },
  livePulse: { fontSize: '10px', fontWeight: '800', color: '#0F766E', backgroundColor: '#F0FDF4', padding: '4px 8px', borderRadius: '6px' },
  emptyCard: { backgroundColor: '#FFFFFF', border: '2px dashed #CBD5E1', borderRadius: '14px', padding: '24px', textAlign: 'center' },
  reportFileList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  fileCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '14px', padding: '14px' },
  fileCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  fileMetaLeft: { display: 'flex', alignItems: 'center', gap: '6px' },
  fileIdTag: { fontSize: '11px', fontWeight: '800', color: '#0F172A', backgroundColor: '#F1F5F9', padding: '3px 8px', borderRadius: '4px' },
  tagCitizen: { fontSize: '9px', fontWeight: '800', backgroundColor: '#DCFCE7', color: '#166534', padding: '3px 8px', borderRadius: '4px' },
  tagGuest: { fontSize: '9px', fontWeight: '800', backgroundColor: '#FFEDD5', color: '#C2410C', padding: '3px 8px', borderRadius: '4px' },
  statusYellow: { fontSize: '10px', fontWeight: '800', backgroundColor: '#FEF3C7', color: '#92400E', padding: '3px 8px', borderRadius: '4px' },
  statusGreen: { fontSize: '10px', fontWeight: '800', backgroundColor: '#DCFCE7', color: '#166534', padding: '3px 8px', borderRadius: '4px' },
  statusRed: { fontSize: '10px', fontWeight: '800', backgroundColor: '#FEE2E2', color: '#991B1B', padding: '3px 8px', borderRadius: '4px' },
  statusBlue: { fontSize: '10px', fontWeight: '800', backgroundColor: '#E0F2FE', color: '#0369A1', padding: '3px 8px', borderRadius: '4px' },
  fileTitle: { fontSize: '14px', fontWeight: '800', color: '#0F172A', margin: '0 0 4px 0' },
  fileMetaRow: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569', marginBottom: '10px' },
  timeText: { color: '#64748B' },
  cardActionRow: { display: 'flex', gap: '8px' },
  processFileBtn: { flex: 1, padding: '9px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' },
  deleteFileBtn: { padding: '9px 12px', backgroundColor: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' },
  analyticsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  statCard: { backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', padding: '14px', borderRadius: '14px' },
  statBigNum: { fontSize: '22px', fontWeight: '800', color: '#0F172A', display: 'block' },
  statBigNumGreen: { fontSize: '22px', fontWeight: '800', color: '#10B981', display: 'block' },
  statBigNumRed: { fontSize: '22px', fontWeight: '800', color: '#EF4444', display: 'block' },
  statBigNumOrange: { fontSize: '22px', fontWeight: '800', color: '#EA580C', display: 'block' },
  statLabel: { fontSize: '11px', color: '#64748B', fontWeight: '700', display: 'block' },
  mapContainerCard: { backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', padding: '10px', borderRadius: '16px' },
  mapHeaderBanner: { backgroundColor: '#F8FAFC', padding: '8px 12px', fontSize: '11px', color: '#0F766E', marginBottom: '8px', borderRadius: '8px' },
  adminMapBox: { height: '180px', backgroundColor: '#0F172A', borderRadius: '12px', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  adminGridPattern: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '16px 16px', opacity: 0.6 },
  adminCenterPin: { position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' },
  adminPulseCircle: { width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.25)', border: '2px solid #10B981', position: 'absolute', top: '-2px' },
  adminPinIcon: { fontSize: '28px', position: 'relative', zIndex: 3 },
  adminCoordsBadge: { position: 'absolute', bottom: '8px', fontSize: '10px', fontWeight: '700', color: '#94A3B8', backgroundColor: 'rgba(15, 23, 42, 0.85)', padding: '3px 8px', borderRadius: '4px' },
  pinnedList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  pinnedCard: { backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', padding: '12px', borderRadius: '12px', cursor: 'pointer' },
  pinnedCardSelected: { border: '2px solid #0F766E', backgroundColor: '#F0FDF4', padding: '12px', borderRadius: '12px', cursor: 'pointer' },
  pinnedTop: { display: 'flex', justifyContent: 'space-between', marginBottom: '4px' },
  pinnedTag: { fontSize: '10px', fontWeight: '800', backgroundColor: '#F1F5F9', color: '#334155', padding: '2px 6px', borderRadius: '4px' },
  pinnedCoords: { fontSize: '10px', color: '#0F766E', fontWeight: '700' },
  pinnedName: { fontSize: '13px', fontWeight: '800', color: '#0F172A', margin: '0 0 2px 0' },
  pinnedLoc: { fontSize: '11px', color: '#64748B' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px', zIndex: 100 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '20px', maxWidth: '400px', width: '100%', maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' },
  modalSubHeader: { fontSize: '10px', fontWeight: '800', color: '#0F766E' },
  modalTitle: { fontSize: '17px', fontWeight: '800', color: '#0F172A', margin: '2px 0 0 0' },
  closeBtn: { backgroundColor: '#E2E8F0', border: 'none', width: '28px', height: '28px', borderRadius: '50%', fontWeight: '800', cursor: 'pointer' },
  fullWidthField: { backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '10px' },
  fieldLabel: { fontSize: '9px', fontWeight: '800', color: '#64748B', display: 'block', marginBottom: '4px' },
  fieldVal: { fontSize: '12px', fontWeight: '800', color: '#0F172A' },
  coordSub: { fontSize: '10px', color: '#64748B', marginTop: '4px' },
  descText: { fontSize: '12px', color: '#334155', lineHeight: '1.5', margin: '4px 0 0 0' },
  dispatchSection: { backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '14px' },
  inputLabel: { fontSize: '10px', fontWeight: '800', color: '#64748B', display: 'block', marginBottom: '4px' },
  selectInput: { width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', marginBottom: '12px' },
  buttonStack: { display: 'flex', flexDirection: 'column', gap: '8px' },
  btnApprove: { padding: '11px', backgroundColor: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' },
  btnInvestigate: { padding: '11px', backgroundColor: '#0284C7', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' },
  btnReject: { padding: '11px', backgroundColor: '#F59E0B', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' },
  btnDelete: { padding: '11px', backgroundColor: '#EF4444', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' },
  btnDisabled: { padding: '11px', backgroundColor: '#94A3B8', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'not-allowed' },
  adminFooterNav: { position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: '440px', margin: '0 auto', backgroundColor: '#FFFFFF', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '12px 0', zIndex: 100 },
  navActive: { backgroundColor: 'transparent', border: 'none', color: '#0F766E', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '10px', fontWeight: '800', cursor: 'pointer', flex: 1 },
  navInactive: { backgroundColor: 'transparent', border: 'none', color: '#64748B', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '10px', fontWeight: '600', cursor: 'pointer', flex: 1 }
};
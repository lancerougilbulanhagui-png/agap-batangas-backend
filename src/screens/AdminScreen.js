import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function AdminScreen({ onBack }) {
  const [adminTab, setAdminTab] = useState('database');
  const [modalTab, setModalTab] = useState('inspect'); // 'inspect' | 'decision'
  const [selectedReport, setSelectedReport] = useState(null);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [noticeText, setNoticeText] = useState('');
  const [assignedUnit, setAssignedUnit] = useState('CDRRMO Rescue Truck 04');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const fetchLiveReports = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setReports(data);
    } catch (err) {
      console.error('Fetch error:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveReports();
  }, []);

  const openInspectorModal = (report) => {
    setSelectedReport(report);
    setModalTab('inspect');
    setNoticeText(
      `[AGAP DISPATCH NOTICE]: Response Unit (${assignedUnit}) assigned to report "${report.hazard_type || report.title || 'Hazard Report'}" at ${report.location}.`
    );
  };

  const handleUpdateReportStatus = async (statusType) => {
    setIsProcessingAction(true);
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: statusType })
        .eq('id', selectedReport.id);

      if (error) throw error;

      alert(`✓ Status Updated: Ticket [${selectedReport.id}] marked as "${statusType}".`);
      setReports((prev) =>
        prev.map((r) => (r.id === selectedReport.id ? { ...r, status: statusType } : r))
      );
      setSelectedReport(null);
    } catch (err) {
      alert(`⚠️ Failed to update status: ${err.message}`);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (
      window.confirm(
        `🗑️ Are you sure you want to PERMANENTLY DELETE report [${reportId}] from the database?`
      )
    ) {
      setIsProcessingAction(true);
      try {
        const { error } = await supabase.from('reports').delete().eq('id', reportId);
        if (error) throw error;

        alert(`🗑️ Report [${reportId}] purged from database.`);
        setReports((prev) => prev.filter((r) => r.id !== reportId));
        setSelectedReport(null);
      } catch (err) {
        alert(`⚠️ Failed to delete report: ${err.message}`);
      } finally {
        setIsProcessingAction(false);
      }
    }
  };

  return (
    <div style={styles.fullScreenContainer}>
      {/* Top Command Bar */}
      <div style={styles.navHeader}>
        <button style={styles.backBtn} onClick={onBack}>
          &lt; Back to App
        </button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={styles.headerTitle}>CDRRMO Command Center Platform</h2>
            <span style={styles.adminBadge}>LIVE DISPATCH ADMIN</span>
          </div>
          <div style={styles.headerSub}>Batangas City Disaster Risk Reduction & Management Office</div>
        </div>
      </div>

      {/* Database Feed */}
      {adminTab === 'database' && (
        <div style={styles.mainContent}>
          <div style={styles.sectionHeaderRow}>
            <span style={styles.sectionHeader}>Submitted Reports Database ({reports.length})</span>
            <button style={styles.refreshBtn} onClick={fetchLiveReports} disabled={isLoading}>
              {isLoading ? '🔄 Syncing...' : '🔄 Refresh Live Feed'}
            </button>
          </div>

          {reports.length === 0 ? (
            <div style={styles.emptyCard}>
              <p>📭 No reports in database. Submit a test report from the Citizen form to see it live!</p>
            </div>
          ) : (
            <div style={styles.reportGrid}>
              {reports.map((item) => (
                <div key={item.id} style={styles.fileCard}>
                  <div style={styles.fileCardHeader}>
                    <span style={styles.fileIdTag}>{item.id}</span>
                    <span
                      style={
                        item.status === 'APPROVED'
                          ? styles.statusGreen
                          : item.status === 'REJECTED'
                          ? styles.statusRed
                          : item.status === 'UNDER_INVESTIGATION'
                          ? styles.statusBlue
                          : styles.statusYellow
                      }
                    >
                      {item.status || 'PENDING'}
                    </span>
                  </div>

                  <h3 style={styles.fileTitle}>{item.hazard_type || item.title || item.category}</h3>
                  <div style={styles.fileMeta}>📍 {item.location}</div>
                  <div style={styles.fileMeta}>Submitter: <strong>{item.sender_name || 'Citizen'}</strong> ({item.user_role || 'CITIZEN'})</div>
                  <div style={styles.fileMeta}>Severity: <strong style={{ color: '#DC2626' }}>{item.severity}</strong></div>

                  <button style={styles.processFileBtn} onClick={() => openInspectorModal(item)}>
                    🔎 Open Full-Screen Inspector &rarr;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 🖥️ FULL-SCREEN INSPECTOR OVERLAY */}
      {selectedReport && (
        <div style={styles.fullScreenOverlay}>
          <div style={styles.inspectorContainer}>
            {/* Modal Header */}
            <div style={styles.inspectorHeader}>
              <div>
                <span style={styles.modalSubHeader}>FULL-SCREEN COMMAND CENTER INSPECTOR</span>
                <h2 style={styles.modalTitle}>Processing Ticket #{selectedReport.id}</h2>
              </div>
              <button style={styles.closeBtn} onClick={() => setSelectedReport(null)}>
                ✕ Close Inspector
              </button>
            </div>

            {/* Sub-Tab Navigation */}
            <div style={styles.subTabHeader}>
              <button
                style={modalTab === 'inspect' ? styles.subTabActive : styles.subTabInactive}
                onClick={() => setModalTab('inspect')}
              >
                1. 🔎 Inspect Submitted Data & Attached Photos
              </button>
              <button
                style={modalTab === 'decision' ? styles.subTabActive : styles.subTabInactive}
                onClick={() => setModalTab('decision')}
              >
                2. ⚙️ Dictate Workflow & Decision
              </button>
            </div>

            {/* TAB 1: INSPECT DATA & REAL PHOTOS */}
            {modalTab === 'inspect' && (
              <div style={styles.tabSection}>
                <div style={styles.infoGrid}>
                  <div style={styles.infoBox}>
                    <span style={styles.label}>SUBMITTER NAME</span>
                    <div style={styles.value}>{selectedReport.sender_name || 'Anonymous Submitter'}</div>
                  </div>
                  <div style={styles.infoBox}>
                    <span style={styles.label}>USER PRIVILEGE</span>
                    <div style={styles.valueBold}>{selectedReport.user_role || 'CITIZEN'}</div>
                  </div>
                  <div style={styles.infoBox}>
                    <span style={styles.label}>HAZARD TYPE</span>
                    <div style={styles.valueBold}>{selectedReport.hazard_type || selectedReport.category}</div>
                  </div>
                  <div style={styles.infoBox}>
                    <span style={styles.label}>SEVERITY LEVEL</span>
                    <div style={{ ...styles.valueBold, color: '#DC2626' }}>{selectedReport.severity}</div>
                  </div>
                </div>

                <div style={styles.infoBoxFull}>
                  <span style={styles.label}>EXACT LOCATION & COORDINATES</span>
                  <div style={styles.value}>📍 {selectedReport.location}</div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                    GPS Coordinates: {selectedReport.coordinates || '13.7850° N, 121.0740° E'}
                  </div>
                </div>

                <div style={styles.infoBoxFull}>
                  <span style={styles.label}>SITUATION DETAILS & REMARKS</span>
                  <p style={styles.descriptionText}>
                    {selectedReport.description || selectedReport.details || 'No additional remarks submitted.'}
                  </p>
                </div>

                {/* REAL PHOTO GALLERY PREVIEW */}
                <div style={styles.photoSection}>
                  <span style={styles.label}>VERIFIED ATTACHED PHOTO EVIDENCE</span>
                  {selectedReport.photo_urls && selectedReport.photo_urls.length > 0 ? (
                    <div style={styles.photoGallery}>
                      {selectedReport.photo_urls.map((photoSrc, idx) => (
                        <div key={idx} style={styles.photoFrame}>
                          {typeof photoSrc === 'string' && photoSrc.startsWith('data:image') ? (
                            <img src={photoSrc} alt={`Evidence ${idx + 1}`} style={styles.realImg} />
                          ) : (
                            <div style={styles.fallbackPhotoBox}>📷 {photoSrc}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '13px', color: '#64748B', marginTop: '8px' }}>
                      📷 No photos were attached to this report.
                    </div>
                  )}
                </div>

                <button style={styles.actionNavBtn} onClick={() => setModalTab('decision')}>
                  Proceed to Decision & Action Tab &rarr;
                </button>
              </div>
            )}

            {/* TAB 2: DECISION & WORKFLOW DICTATION */}
            {modalTab === 'decision' && (
              <div style={styles.tabSection}>
                <div style={styles.dispatchBox}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#0F172A' }}>
                    Dictate Report Action & Dispatch
                  </h3>

                  <div style={styles.fieldGroup}>
                    <label style={styles.fieldLabelText}>ASSIGN RESPONDER UNIT:</label>
                    <select
                      style={styles.selectInputLarge}
                      value={assignedUnit}
                      onChange={(e) => {
                        setAssignedUnit(e.target.value);
                        setNoticeText(
                          `[AGAP DISPATCH NOTICE]: Response Unit (${e.target.value}) assigned to report "${selectedReport.hazard_type || selectedReport.title}" at ${selectedReport.location}.`
                        );
                      }}
                    >
                      <option value="CDRRMO Rescue Truck 04">CDRRMO Rescue Truck 04</option>
                      <option value="BFP Alangilan Sub-Station Fire Unit">BFP Alangilan Sub-Station Fire Unit</option>
                      <option value="PNP Station 2 Patrol Unit">PNP Station 2 Patrol Unit</option>
                      <option value="BatMC Emergency Ambulance Team">BatMC Emergency Ambulance Team</option>
                    </select>
                  </div>

                  <div style={styles.fieldGroup}>
                    <label style={styles.fieldLabelText}>SYSTEM & SMS NOTICE TO SUBMITTER:</label>
                    <textarea
                      style={styles.textAreaLarge}
                      rows="4"
                      value={noticeText}
                      onChange={(e) => setNoticeText(e.target.value)}
                    ></textarea>
                  </div>

                  <div style={styles.decisionButtonGrid}>
                    <button
                      style={isProcessingAction ? styles.btnDisabled : styles.btnApprove}
                      onClick={() => handleUpdateReportStatus('APPROVED')}
                      disabled={isProcessingAction}
                    >
                      ✓ Accept & Dispatch {assignedUnit}
                    </button>

                    <button
                      style={isProcessingAction ? styles.btnDisabled : styles.btnInvestigate}
                      onClick={() => handleUpdateReportStatus('UNDER_INVESTIGATION')}
                      disabled={isProcessingAction}
                    >
                      🔍 Put On Hold / Under Barangay Investigation
                    </button>

                    <button
                      style={isProcessingAction ? styles.btnDisabled : styles.btnReject}
                      onClick={() => handleUpdateReportStatus('REJECTED')}
                      disabled={isProcessingAction}
                    >
                      ✕ Reject / Decline Report
                    </button>

                    <button
                      style={isProcessingAction ? styles.btnDisabled : styles.btnDelete}
                      onClick={() => handleDeleteReport(selectedReport.id)}
                      disabled={isProcessingAction}
                    >
                      🗑️ Delete & Purge Report from Database
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  fullScreenContainer: { width: '100%', minHeight: '100vh', backgroundColor: '#F8FAFC', padding: '24px', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' },
  navHeader: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' },
  backBtn: { backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  headerTitle: { fontSize: '22px', fontWeight: '800', color: '#0F172A', margin: 0 },
  adminBadge: { fontSize: '11px', fontWeight: '800', backgroundColor: '#0F766E', color: '#FFFFFF', padding: '3px 8px', borderRadius: '6px' },
  headerSub: { fontSize: '13px', color: '#64748B' },
  mainContent: { maxWidth: '1200px', margin: '0 auto' },
  sectionHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  sectionHeader: { fontSize: '18px', fontWeight: '800', color: '#0F172A' },
  refreshBtn: { fontSize: '13px', fontWeight: '700', color: '#0F766E', backgroundColor: '#CCFBF1', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer' },
  emptyCard: { backgroundColor: '#FFFFFF', padding: '40px', borderRadius: '16px', border: '1px solid #E2E8F0', textAlign: 'center', color: '#64748B' },
  reportGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' },
  fileCard: { backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '8px' },
  fileCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  fileIdTag: { fontSize: '12px', fontWeight: '800', color: '#0F766E', backgroundColor: '#F0FDF4', padding: '3px 8px', borderRadius: '6px' },
  statusYellow: { fontSize: '11px', fontWeight: '800', color: '#D97706', backgroundColor: '#FEF3C7', padding: '3px 10px', borderRadius: '12px' },
  statusGreen: { fontSize: '11px', fontWeight: '800', color: '#15803D', backgroundColor: '#DCFCE7', padding: '3px 10px', borderRadius: '12px' },
  statusBlue: { fontSize: '11px', fontWeight: '800', color: '#1D4ED8', backgroundColor: '#DBEAFE', padding: '3px 10px', borderRadius: '12px' },
  statusRed: { fontSize: '11px', fontWeight: '800', color: '#B91C1C', backgroundColor: '#FEE2E2', padding: '3px 10px', borderRadius: '12px' },
  fileTitle: { fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 },
  fileMeta: { fontSize: '13px', color: '#475569' },
  processFileBtn: { width: '100%', padding: '10px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', marginTop: 'auto' },

  // FULL SCREEN OVERLAY STYLES
  fullScreenOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', boxSizing: 'border-box' },
  inspectorContainer: { width: '100%', maxWidth: '900px', height: '90vh', backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' },
  inspectorHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' },
  modalSubHeader: { fontSize: '11px', fontWeight: '800', color: '#0F766E', letterSpacing: '1px' },
  modalTitle: { fontSize: '22px', fontWeight: '800', color: '#0F172A', margin: '4px 0 0 0' },
  closeBtn: { backgroundColor: '#F1F5F9', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '800', color: '#475569', cursor: 'pointer' },
  subTabHeader: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  subTabActive: { padding: '12px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' },
  subTabInactive: { padding: '12px', backgroundColor: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  tabSection: { display: 'flex', flexDirection: 'column', gap: '16px' },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' },
  infoBox: { backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '12px', borderRadius: '10px' },
  infoBoxFull: { backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '16px', borderRadius: '10px' },
  label: { fontSize: '11px', fontWeight: '800', color: '#64748B', display: 'block', marginBottom: '4px' },
  value: { fontSize: '14px', color: '#0F172A' },
  valueBold: { fontSize: '14px', fontWeight: '800', color: '#0F172A' },
  descriptionText: { fontSize: '14px', color: '#334155', margin: 0, lineHeight: '1.6' },
  photoSection: { backgroundColor: '#F0FDF4', border: '1px dashed #0F766E', padding: '16px', borderRadius: '12px' },
  photoGallery: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginTop: '12px' },
  photoFrame: { borderRadius: '8px', overflow: 'hidden', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  realImg: { width: '100%', height: '100%', objectFit: 'cover' },
  fallbackPhotoBox: { padding: '10px', fontSize: '12px', color: '#475569', textAlign: 'center' },
  actionNavBtn: { width: '100%', padding: '12px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '800', cursor: 'pointer' },
  dispatchBox: { backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  fieldLabelText: { fontSize: '12px', fontWeight: '800', color: '#475569' },
  selectInputLarge: { padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' },
  textAreaLarge: { padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', fontFamily: 'inherit', lineHeight: '1.5' },
  decisionButtonGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' },
  btnApprove: { padding: '14px', backgroundColor: '#15803D', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' },
  btnInvestigate: { padding: '14px', backgroundColor: '#D97706', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' },
  btnReject: { padding: '14px', backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' },
  btnDelete: { padding: '14px', backgroundColor: '#475569', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' },
  btnDisabled: { padding: '14px', backgroundColor: '#94A3B8', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'not-allowed' }
};
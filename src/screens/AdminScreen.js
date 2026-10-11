import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Project AGAP Batangas - LGU CDRRMO Command Center Admin Platform
 */
export default function AdminScreen({ onBack }) {
  const [adminTab, setAdminTab] = useState('database'); // 'database' | 'analytics' | 'map' | 'moderation'
  const [modalTab, setModalTab] = useState('inspect'); // 'inspect' | 'decision'
  const [selectedReport, setSelectedReport] = useState(null);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [noticeText, setNoticeText] = useState('');
  const [assignedUnit, setAssignedUnit] = useState('CDRRMO Rescue Truck 04');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // 🔄 Fetch Live Submissions directly from Supabase
  const fetchLiveReports = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setReports(data);
      }
    } catch (err) {
      console.error('Error fetching reports from Supabase:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveReports();
  }, []);

  // Open 2-Tab Inspector Modal
  const openInspectorModal = (report) => {
    setSelectedReport(report);
    setModalTab('inspect'); // Default to Tab 1 (Inspect Data)
    setNoticeText(
      `[AGAP DISPATCH NOTICE]: Response Unit (${assignedUnit}) assigned to report "${report.title || report.report_type}" at ${report.location}. Please stand by.`
    );
  };

  // ⚙️ Update Status in Supabase (Approved, Under Investigation, Rejected)
  const handleUpdateReportStatus = async (statusType) => {
    if (!selectedReport) return;

    setIsProcessingAction(true);
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: statusType })
        .eq('id', selectedReport.id);

      if (error) throw error;

      alert(`✓ Status Updated: Ticket [${selectedReport.id}] marked as "${statusType}".`);

      // Update local state and close modal
      setReports(prev =>
        prev.map(r => (r.id === selectedReport.id ? { ...r, status: statusType } : r))
      );
      setSelectedReport(null);
    } catch (err) {
      alert(`⚠️ Failed to update status: ${err.message}`);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // 🗑️ Permanently Delete Report from Database to prevent overflow
  const handleDeleteReport = async (reportId) => {
    if (window.confirm(`🗑️ Are you sure you want to PERMANENTLY DELETE report [${reportId}] from the database?\n\nThis will remove the entry to keep the database clean.`)) {
      setIsProcessingAction(true);
      try {
        const { error } = await supabase
          .from('reports')
          .delete()
          .eq('id', reportId);

        if (error) throw error;

        alert(`🗑️ Report [${reportId}] removed from database.`);
        setReports(prev => prev.filter(r => r.id !== reportId));
        setSelectedReport(null);
      } catch (err) {
        alert(`⚠️ Failed to delete report: ${err.message}`);
      } finally {
        setIsProcessingAction(false);
      }
    }
  };

  return (
    <div style={styles.container}>
      {/* Navigation Header */}
      <div style={styles.navHeader}>
        <button style={styles.backBtn} onClick={onBack}>
          &lt; Back to App
        </button>
        <div style={styles.headerTitleBlock}>
          <div style={styles.headerTitleRow}>
            <h2 style={styles.headerTitle}>CDRRMO Command Center</h2>
            <span style={styles.adminBadge}>COMMAND CENTER ADMIN</span>
          </div>
          <div style={styles.headerSub}>Batangas City LGU Disaster Operations Platform</div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DATABASE SUBMISSIONS FILE MANAGER                                  */}
      {/* ========================================================================= */}
      {adminTab === 'database' && (
        <div style={styles.viewSection}>
          <div style={styles.sectionHeaderRow}>
            <span style={styles.sectionHeader}>Submitted Reports Database ({reports.length})</span>
            <button style={styles.refreshBtn} onClick={fetchLiveReports} disabled={isLoading}>
              {isLoading ? '🔄 Syncing...' : '🔄 Refresh Live Feed'}
            </button>
          </div>

          {reports.length === 0 ? (
            <div style={styles.emptyCard}>
              <p>📭 No reports in database yet. Submit a test report from the Citizen form to see it appear here live!</p>
            </div>
          ) : (
            <div style={styles.reportFileList}>
              {reports.map((item) => (
                <div key={item.id} style={styles.fileCard}>
                  <div style={styles.fileCardHeader}>
                    <div style={styles.fileMetaLeft}>
                      <span style={styles.fileIdTag}>{item.id}</span>
                      <span style={item.user_role === 'CITIZEN' ? styles.tagCitizen : styles.tagGuest}>
                        {item.user_role || 'CITIZEN'}
                      </span>
                    </div>

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

                  <h4 style={styles.fileTitle}>{item.report_type || item.title || item.category}</h4>
                  <div style={styles.fileMetaRow}>
                    <span>📍 {item.location}</span>
                    <span style={styles.timeText}>{item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}</span>
                  </div>

                  <div style={styles.guestLimitBar}>
                    <span>Submitter: <strong>{item.sender_name || 'Citizen'}</strong></span>
                    <span>Severity: <strong style={{ color: '#DC2626' }}>{item.severity}</strong></span>
                  </div>

                  <button style={styles.processFileBtn} onClick={() => openInspectorModal(item)}>
                    🔎 Inspect Submitted Data & Action &rarr;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2-TAB INSPECTOR MODAL                                                     */}
      {/* ========================================================================= */}
      {selectedReport && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <div>
                <span style={styles.modalSubHeader}>CDRRMO SUBMISSION INSPECTOR</span>
                <h3 style={styles.modalTitle}>Ticket ID: {selectedReport.id}</h3>
              </div>
              <button style={styles.closeBtn} onClick={() => setSelectedReport(null)}>✕</button>
            </div>

            {/* Sub-Tab Selector Navigation */}
            <div style={styles.subTabHeader}>
              <button
                style={modalTab === 'inspect' ? styles.subTabActive : styles.subTabInactive}
                onClick={() => setModalTab('inspect')}
              >
                1. 🔎 Inspect Submitted Data
              </button>
              <button
                style={modalTab === 'decision' ? styles.subTabActive : styles.subTabInactive}
                onClick={() => setModalTab('decision')}
              >
                2. ⚙️ Decision & Process Workflow
              </button>
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* SUB-TAB 1: INSPECT SUBMITTED DATA (PHOTOS, DETAILS, SENDER INFO)    */}
            {/* ------------------------------------------------------------------- */}
            {modalTab === 'inspect' && (
              <div style={styles.tabContentArea}>
                <div style={styles.formInspectorGrid}>
                  <div style={styles.fieldBox}>
                    <span style={styles.fieldLabel}>SUBMITTER NAME</span>
                    <div style={styles.fieldVal}>{selectedReport.sender_name || 'Anonymous Submitter'}</div>
                  </div>

                  <div style={styles.fieldBox}>
                    <span style={styles.fieldLabel}>USER PRIVILEGE</span>
                    <div style={selectedReport.user_role === 'CITIZEN' ? styles.fieldValCitizen : styles.fieldValGuest}>
                      {selectedReport.user_role || 'CITIZEN'}
                    </div>
                  </div>

                  <div style={styles.fieldBox}>
                    <span style={styles.fieldLabel}>REPORT / HAZARD TYPE</span>
                    <div style={styles.fieldValBold}>{selectedReport.report_type || selectedReport.category}</div>
                  </div>

                  <div style={styles.fieldBox}>
                    <span style={styles.fieldLabel}>SEVERITY LEVEL</span>
                    <div style={styles.fieldValRed}>{selectedReport.severity}</div>
                  </div>
                </div>

                <div style={styles.fullWidthField}>
                  <span style={styles.fieldLabel}>LOCATION & COORDINATES</span>
                  <div style={styles.fieldVal}>📍 {selectedReport.location}</div>
                  <div style={styles.coordSub}>GPS: {selectedReport.coordinates || '13.7850° N, 121.0740° E'}</div>
                </div>

                <div style={styles.fullWidthField}>
                  <span style={styles.fieldLabel}>HAZARD REMARKS & SITUATION DETAILS</span>
                  <p style={styles.descText}>{selectedReport.description || selectedReport.details || 'No additional remarks submitted.'}</p>
                </div>

                {/* Photo Evidence Inspection Section */}
                <div style={styles.photoContainer}>
                  <span style={styles.fieldLabel}>ATTACHED PHOTO EVIDENCE INSPECTION</span>
                  {(() => {
                    const evidencePhotos = Array.isArray(selectedReport.photos)
                      ? selectedReport.photos
                      : Array.isArray(selectedReport.photo_urls)
                        ? selectedReport.photo_urls
                        : [];

                    return evidencePhotos.length > 0 ? (
                      <div style={styles.photoGrid}>
                        {evidencePhotos.map((photoName, idx) => (
                          <div key={idx} style={styles.photoCard}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0F766E" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                              <circle cx="8.5" cy="8.5" r="1.5"/>
                              <polyline points="21 15 16 10 5 21"/>
                            </svg>
                            <span style={styles.photoNameText}>📷 {photoName}</span>
                            <span style={styles.verifiedTag}>✓ Attached Evidence</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={styles.noPhotoBox}>📷 No photos attached to this report.</div>
                    );
                  })()}
                </div>

                <button style={styles.nextTabBtn} onClick={() => setModalTab('decision')}>
                  Proceed to Decision & Action Tab &rarr;
                </button>
              </div>
            )}

            {/* ------------------------------------------------------------------- */}
            {/* SUB-TAB 2: DECISION & WORKFLOW PROCESS (ACCEPT, HOLD, REJECT, PURGE) */}
            {/* ------------------------------------------------------------------- */}
            {modalTab === 'decision' && (
              <div style={styles.tabContentArea}>
                <div style={styles.dispatchSection}>
                  <h4 style={styles.dispatchTitle}>Dictate Report Process & Status</h4>

                  <div style={styles.formGroup}>
                    <label style={styles.inputLabel}>ASSIGN RESPONDER UNIT:</label>
                    <select
                      style={styles.selectInput}
                      value={assignedUnit}
                      onChange={(e) => {
                        const nextUnit = e.target.value;
                        setAssignedUnit(nextUnit);
                        setNoticeText(
                          `[AGAP DISPATCH NOTICE]: Response Unit (${nextUnit}) assigned to report "${selectedReport.report_type || selectedReport.title}" at ${selectedReport.location}. Please stand by.`
                        );
                      }}
                    >
                      <option value="CDRRMO Rescue Truck 04">CDRRMO Rescue Truck 04</option>
                      <option value="BFP Alangilan Sub-Station Fire Unit">BFP Alangilan Sub-Station Fire Unit</option>
                      <option value="PNP Station 2 Patrol Unit">PNP Station 2 Patrol Unit</option>
                      <option value="BatMC Emergency Ambulance Team">BatMC Emergency Ambulance Team</option>
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.inputLabel}>SYSTEM & SMS NOTICE TO SUBMITTER:</label>
                    <textarea
                      style={styles.noticeArea}
                      rows="2"
                      value={noticeText}
                      onChange={(e) => setNoticeText(e.target.value)}
                    ></textarea>
                  </div>

                  {/* Decision Action Buttons */}
                  <div style={styles.buttonStack}>
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
  container: { maxWidth: '440px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#F8FAFC', padding: '16px 16px 80px 16px', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' },
  navHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' },
  backBtn: { backgroundColor: 'transparent', border: 'none', color: '#0F766E', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  headerTitleBlock: { display: 'flex', flexDirection: 'column' },
  headerTitleRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  headerTitle: { fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 },
  adminBadge: { fontSize: '9px', fontWeight: '800', backgroundColor: '#0F766E', color: '#FFFFFF', padding: '2px 6px', borderRadius: '4px' },
  headerSub: { fontSize: '11px', color: '#64748B' },
  viewSection: { marginBottom: '20px' },
  sectionHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  sectionHeader: { fontSize: '13px', fontWeight: '800', color: '#1E293B' },
  refreshBtn: { fontSize: '11px', fontWeight: '700', color: '#0F766E', backgroundColor: '#CCFBF1', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' },
  emptyCard: { backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', textAlign: 'center', color: '#64748B', fontSize: '12px' },
  reportFileList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  fileCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  fileCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  fileMetaLeft: { display: 'flex', alignItems: 'center', gap: '6px' },
  fileIdTag: { fontSize: '10px', fontWeight: '800', color: '#0F766E', backgroundColor: '#F0FDF4', padding: '2px 6px', borderRadius: '4px' },
  tagCitizen: { fontSize: '9px', fontWeight: '800', backgroundColor: '#DBEAFE', color: '#1E40AF', padding: '2px 6px', borderRadius: '4px' },
  tagGuest: { fontSize: '9px', fontWeight: '800', backgroundColor: '#FFEDD5', color: '#C2410C', padding: '2px 6px', borderRadius: '4px' },
  statusYellow: { fontSize: '10px', fontWeight: '800', color: '#D97706', backgroundColor: '#FEF3C7', padding: '2px 8px', borderRadius: '12px' },
  statusGreen: { fontSize: '10px', fontWeight: '800', color: '#15803D', backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '12px' },
  statusBlue: { fontSize: '10px', fontWeight: '800', color: '#1D4ED8', backgroundColor: '#DBEAFE', padding: '2px 8px', borderRadius: '12px' },
  statusRed: { fontSize: '10px', fontWeight: '800', color: '#B91C1C', backgroundColor: '#FEE2E2', padding: '2px 8px', borderRadius: '12px' },
  fileTitle: { fontSize: '13px', fontWeight: '800', color: '#0F172A', margin: '4px 0' },
  fileMetaRow: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748B', marginBottom: '8px' },
  guestLimitBar: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569', backgroundColor: '#F8FAFC', padding: '6px 8px', borderRadius: '6px', marginBottom: '8px' },
  processFileBtn: { width: '100%', padding: '8px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '16px', width: '100%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
  modalSubHeader: { fontSize: '9px', fontWeight: '800', color: '#0F766E', letterSpacing: '0.5px' },
  modalTitle: { fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: 0 },
  closeBtn: { border: 'none', backgroundColor: 'transparent', fontSize: '16px', fontWeight: '800', color: '#64748B', cursor: 'pointer' },
  subTabHeader: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px', borderBottom: '2px solid #F1F5F9', paddingBottom: '8px' },
  subTabActive: { padding: '8px 4px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  subTabInactive: { padding: '8px 4px', backgroundColor: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: '8px', fontSize: '10px', fontWeight: '700', cursor: 'pointer' },
  tabContentArea: { display: 'flex', flexDirection: 'column', gap: '10px' },
  formInspectorGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  fieldBox: { backgroundColor: '#F8FAFC', padding: '8px', borderRadius: '8px', border: '1px solid #E2E8F0' },
  fieldLabel: { fontSize: '9px', fontWeight: '800', color: '#64748B', display: 'block', marginBottom: '2px' },
  fieldVal: { fontSize: '11px', color: '#0F172A' },
  fieldValBold: { fontSize: '11px', fontWeight: '800', color: '#0F172A' },
  fieldValCitizen: { fontSize: '11px', fontWeight: '800', color: '#1D4ED8' },
  fieldValGuest: { fontSize: '11px', fontWeight: '800', color: '#C2410C' },
  fieldValRed: { fontSize: '11px', fontWeight: '800', color: '#DC2626' },
  fullWidthField: { backgroundColor: '#F8FAFC', padding: '8px', borderRadius: '8px', border: '1px solid #E2E8F0' },
  coordSub: { fontSize: '10px', color: '#94A3B8', marginTop: '2px' },
  descText: { fontSize: '11px', color: '#334155', margin: 0, lineHeight: '1.4' },
  photoContainer: { backgroundColor: '#F0FDF4', border: '1px dashed #0F766E', padding: '10px', borderRadius: '8px' },
  photoGrid: { display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' },
  photoCard: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: '6px 8px', borderRadius: '6px', border: '1px solid #E2E8F0' },
  photoNameText: { fontSize: '11px', fontWeight: '700', color: '#0F172A' },
  verifiedTag: { fontSize: '9px', fontWeight: '800', color: '#0F766E', backgroundColor: '#CCFBF1', padding: '2px 4px', borderRadius: '4px' },
  noPhotoBox: { fontSize: '11px', color: '#64748B', marginTop: '4px' },
  nextTabBtn: { width: '100%', padding: '10px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', marginTop: '6px' },
  dispatchSection: { display: 'flex', flexDirection: 'column', gap: '8px' },
  dispatchTitle: { fontSize: '12px', fontWeight: '800', color: '#0F172A', margin: '0 0 4px 0' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '2px' },
  inputLabel: { fontSize: '9px', fontWeight: '800', color: '#475569' },
  selectInput: { padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '11px' },
  noticeArea: { padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '11px', fontFamily: 'inherit' },
  buttonStack: { display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' },
  btnApprove: { padding: '10px', backgroundColor: '#15803D', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' },
  btnInvestigate: { padding: '10px', backgroundColor: '#D97706', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' },
  btnReject: { padding: '10px', backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' },
  btnDelete: { padding: '10px', backgroundColor: '#475569', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' },
  btnDisabled: { padding: '10px', backgroundColor: '#94A3B8', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'not-allowed' }
};
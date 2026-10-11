import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function AdminScreen({ onBack }) {
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

  const openInspector = (report) => {
    setSelectedReport(report);
    setNoticeText(
      `[AGAP DISPATCH NOTICE]: Response Unit (${assignedUnit}) assigned to report "${report.report_type || report.title || 'Hazard Report'}" at ${report.location}.`
    );
  };

  const handleUpdateReportStatus = async (statusType) => {
    if (!selectedReport?.id) return;

    setIsProcessingAction(true);
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: statusType })
        .eq('id', selectedReport.id);

      if (error) throw error;

      alert(`Status Updated: Ticket [${selectedReport.id}] marked as "${statusType}".`);
      setReports((prev) =>
        prev.map((r) => (r.id === selectedReport.id ? { ...r, status: statusType } : r))
      );
      setSelectedReport(null);
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (window.confirm(`Are you sure you want to PERMANENTLY DELETE report [${reportId}] from the database?`)) {
      setIsProcessingAction(true);
      try {
        const { error } = await supabase.from('reports').delete().eq('id', reportId);
        if (error) throw error;

        alert(`Report [${reportId}] purged from database.`);
        setReports((prev) => prev.filter((r) => r.id !== reportId));
        setSelectedReport(null);
      } catch (err) {
        alert(`Failed to delete report: ${err.message}`);
      } finally {
        setIsProcessingAction(false);
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.navHeader}>
        <button style={styles.backBtn} onClick={onBack}>
          &lt; Back
        </button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <h2 style={styles.headerTitle}>CDRRMO Command Center</h2>
            <span style={styles.adminBadge}>ADMIN</span>
          </div>
          <div style={styles.headerSub}>Batangas City Disaster Operations Platform</div>
        </div>
      </div>

      {!selectedReport ? (
        <div style={styles.viewSection}>
          <div style={styles.sectionHeaderRow}>
            <span style={styles.sectionHeader}>Submitted Reports ({reports.length})</span>
            <button style={styles.refreshBtn} onClick={fetchLiveReports} disabled={isLoading}>
              {isLoading ? 'Syncing...' : 'Sync Feed'}
            </button>
          </div>

          {reports.length === 0 ? (
            <div style={styles.emptyCard}>
              <p>No reports in database. Submit a report from the Citizen form to view it here.</p>
            </div>
          ) : (
            <div style={styles.reportList}>
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

                  <h3 style={styles.fileTitle}>{item.report_type || item.title || item.category}</h3>
                  <div style={styles.fileMeta}>Location: {item.location}</div>
                  <div style={styles.fileMeta}>Submitter: {item.sender_name || 'Citizen'} ({item.user_role || 'CITIZEN'})</div>
                  <div style={styles.fileMeta}>Severity: <strong style={{ color: '#DC2626' }}>{item.severity}</strong></div>

                  <button style={styles.processFileBtn} onClick={() => openInspector(item)}>
                    Inspect Report &rarr;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* GOOGLE FORM STYLE VERTICAL SUMMARY CARD IN MOBILE VIEW */
        <div style={styles.formSheetContainer}>
          <div style={styles.formSheetHeaderCard}>
            <div style={styles.formSheetTitleRow}>
              <div>
                <span style={styles.formSheetSub}>INCIDENT SUBMISSION RESPONSE</span>
                <h2 style={styles.formSheetTitle}>Ticket: {selectedReport.id}</h2>
              </div>
              <button style={styles.closeSheetBtn} onClick={() => setSelectedReport(null)}>
                Close
              </button>
            </div>
            <div style={styles.formSheetMetaBar}>
              Status: <strong>{selectedReport.status || 'PENDING'}</strong> | Submitted: {selectedReport.created_at ? new Date(selectedReport.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
            </div>
          </div>

          <div style={styles.formSectionCard}>
            <label style={styles.formSectionLabel}>1. SUBMITTER INFO</label>
            <div style={styles.formValueText}>{selectedReport.sender_name || 'Anonymous Submitter'}</div>
            <div style={styles.formSubText}>Role: {selectedReport.user_role || 'CITIZEN'}</div>
          </div>

          <div style={styles.formSectionCard}>
            <label style={styles.formSectionLabel}>2. HAZARD / REPORT TYPE</label>
            <div style={styles.formValueTextBold}>{selectedReport.report_type || selectedReport.category || 'General Hazard'}</div>
          </div>

          <div style={styles.formSectionCard}>
            <label style={styles.formSectionLabel}>3. SEVERITY LEVEL</label>
            <div style={{ ...styles.formValueTextBold, color: '#DC2626' }}>{selectedReport.severity}</div>
          </div>

          <div style={styles.formSectionCard}>
            <label style={styles.formSectionLabel}>4. LOCATION & GPS COORDINATES</label>
            <div style={styles.formValueText}>Location: {selectedReport.location}</div>
            <div style={styles.formSubText}>GPS: {selectedReport.coordinates || '13.7850 N, 121.0740 E'}</div>
          </div>

          <div style={styles.formSectionCard}>
            <label style={styles.formSectionLabel}>5. HAZARD DETAILS & REMARKS</label>
            <p style={styles.formParagraphText}>{selectedReport.description || selectedReport.details || 'No remarks provided.'}</p>
          </div>

          <div style={styles.formSectionCard}>
            <label style={styles.formSectionLabel}>6. ATTACHED PHOTO EVIDENCE</label>
            {selectedReport.photo_evidence && selectedReport.photo_evidence.length > 0 ? (
              <div style={styles.imageGrid}>
                {selectedReport.photo_evidence.map((photoSrc, idx) => (
                  <div key={idx} style={styles.imageCard}>
                    {typeof photoSrc === 'string' && photoSrc.startsWith('data:image') ? (
                      <img src={photoSrc} alt={`Evidence ${idx + 1}`} style={styles.evidenceImage} />
                    ) : (
                      <div style={styles.fallbackPhotoBox}>{photoSrc}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.formSubText}>No photo evidence attached.</div>
            )}
          </div>

          <div style={styles.formActionCard}>
            <label style={styles.formSectionLabel}>7. COMMAND CENTER WORKFLOW & ACTIONS</label>

            <div style={styles.inputGroup}>
              <label style={styles.inputLabelText}>ASSIGN RESPONDER UNIT:</label>
              <select
                style={styles.selectInput}
                value={assignedUnit}
                onChange={(e) => {
                  const nextUnit = e.target.value;
                  setAssignedUnit(nextUnit);
                  setNoticeText(
                    `[AGAP DISPATCH NOTICE]: Response Unit (${nextUnit}) assigned to report "${selectedReport.report_type || selectedReport.title || 'Hazard Report'}" at ${selectedReport.location}.`
                  );
                }}
              >
                <option value="CDRRMO Rescue Truck 04">CDRRMO Rescue Truck 04</option>
                <option value="BFP Alangilan Sub-Station Fire Unit">BFP Alangilan Sub-Station Fire Unit</option>
                <option value="PNP Station 2 Patrol Unit">PNP Station 2 Patrol Unit</option>
                <option value="BatMC Emergency Ambulance Team">BatMC Emergency Ambulance Team</option>
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.inputLabelText}>SYSTEM / SMS NOTICE TO SUBMITTER:</label>
              <textarea
                style={styles.textArea}
                rows="3"
                value={noticeText}
                onChange={(e) => setNoticeText(e.target.value)}
              ></textarea>
            </div>

            <div style={styles.actionButtonGroup}>
              <button
                style={isProcessingAction ? styles.btnDisabled : styles.btnApprove}
                onClick={() => handleUpdateReportStatus('APPROVED')}
                disabled={isProcessingAction}
              >
                Approve and Dispatch
              </button>

              <button
                style={isProcessingAction ? styles.btnDisabled : styles.btnInvestigate}
                onClick={() => handleUpdateReportStatus('UNDER_INVESTIGATION')}
                disabled={isProcessingAction}
              >
                Put Under Investigation
              </button>

              <button
                style={isProcessingAction ? styles.btnDisabled : styles.btnReject}
                onClick={() => handleUpdateReportStatus('REJECTED')}
                disabled={isProcessingAction}
              >
                Reject Report
              </button>

              <button
                style={isProcessingAction ? styles.btnDisabled : styles.btnDelete}
                onClick={() => handleDeleteReport(selectedReport.id)}
                disabled={isProcessingAction}
              >
                Delete Report from Database
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '440px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#F8FAFC', padding: '16px 16px 80px 16px', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' },
  navHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' },
  backBtn: { backgroundColor: 'transparent', border: 'none', color: '#0F766E', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  headerTitle: { fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 },
  adminBadge: { fontSize: '9px', fontWeight: '800', backgroundColor: '#0F766E', color: '#FFFFFF', padding: '2px 6px', borderRadius: '4px' },
  headerSub: { fontSize: '11px', color: '#64748B' },
  viewSection: { marginBottom: '20px' },
  sectionHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  sectionHeader: { fontSize: '13px', fontWeight: '800', color: '#1E293B' },
  refreshBtn: { fontSize: '11px', fontWeight: '700', color: '#0F766E', backgroundColor: '#CCFBF1', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer' },
  emptyCard: { backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'center', color: '#64748B', fontSize: '12px' },
  reportList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  fileCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' },
  fileCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  fileIdTag: { fontSize: '10px', fontWeight: '800', color: '#0F766E', backgroundColor: '#F0FDF4', padding: '2px 6px', borderRadius: '4px' },
  statusYellow: { fontSize: '10px', fontWeight: '800', color: '#D97706', backgroundColor: '#FEF3C7', padding: '2px 8px', borderRadius: '10px' },
  statusGreen: { fontSize: '10px', fontWeight: '800', color: '#15803D', backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '10px' },
  statusBlue: { fontSize: '10px', fontWeight: '800', color: '#1D4ED8', backgroundColor: '#DBEAFE', padding: '2px 8px', borderRadius: '10px' },
  statusRed: { fontSize: '10px', fontWeight: '800', color: '#B91C1C', backgroundColor: '#FEE2E2', padding: '2px 8px', borderRadius: '10px' },
  fileTitle: { fontSize: '13px', fontWeight: '800', color: '#0F172A', margin: 0 },
  fileMeta: { fontSize: '11px', color: '#475569' },
  processFileBtn: { width: '100%', padding: '8px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', marginTop: '4px' },

  formSheetContainer: { display: 'flex', flexDirection: 'column', gap: '10px' },
  formSheetHeaderCard: { backgroundColor: '#FFFFFF', borderTop: '6px solid #0F766E', borderLeft: '1px solid #CBD5E1', borderRight: '1px solid #CBD5E1', borderBottom: '1px solid #CBD5E1', borderRadius: '8px', padding: '12px' },
  formSheetTitleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  formSheetSub: { fontSize: '9px', fontWeight: '800', color: '#0F766E', letterSpacing: '0.5px' },
  formSheetTitle: { fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: '2px 0 0 0' },
  closeSheetBtn: { backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', color: '#475569', cursor: 'pointer' },
  formSheetMetaBar: { fontSize: '10px', color: '#64748B', marginTop: '6px', borderTop: '1px solid #F1F5F9', paddingTop: '6px' },

  formSectionCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '10px' },
  formSectionLabel: { fontSize: '10px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '4px', letterSpacing: '0.5px' },
  formValueText: { fontSize: '11px', color: '#0F172A' },
  formValueTextBold: { fontSize: '12px', fontWeight: '800', color: '#0F172A' },
  formSubText: { fontSize: '10px', color: '#64748B', marginTop: '2px' },
  formParagraphText: { fontSize: '11px', color: '#334155', margin: 0, lineHeight: '1.4' },

  imageGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '6px', marginTop: '6px' },
  imageCard: { border: '1px solid #CBD5E1', borderRadius: '6px', overflow: 'hidden', height: '80px', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  evidenceImage: { width: '100%', height: '100%', objectFit: 'cover' },
  fallbackPhotoBox: { padding: '6px', fontSize: '10px', color: '#64748B', textAlign: 'center' },

  formActionCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderLeft: '5px solid #0F766E', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '3px' },
  inputLabelText: { fontSize: '9px', fontWeight: '800', color: '#475569' },
  selectInput: { padding: '7px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '11px' },
  textArea: { padding: '7px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '11px', fontFamily: 'inherit' },
  actionButtonGroup: { display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' },
  btnApprove: { padding: '9px', backgroundColor: '#15803D', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' },
  btnInvestigate: { padding: '9px', backgroundColor: '#D97706', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' },
  btnReject: { padding: '9px', backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' },
  btnDelete: { padding: '9px', backgroundColor: '#475569', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' },
  btnDisabled: { padding: '9px', backgroundColor: '#94A3B8', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'not-allowed' }
};
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
    <div style={styles.pageContainer}>
      <div style={styles.navHeader}>
        <button style={styles.backBtn} onClick={onBack}>
          &lt; Back to App
        </button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={styles.headerTitle}>CDRRMO Command Center</h2>
            <span style={styles.adminBadge}>ADMIN PANEL</span>
          </div>
          <div style={styles.headerSub}>Batangas City Disaster Risk Reduction & Management Office</div>
        </div>
      </div>

      {!selectedReport ? (
        <div style={styles.mainContent}>
          <div style={styles.sectionHeaderRow}>
            <span style={styles.sectionHeader}>Submitted Reports Database ({reports.length})</span>
            <button style={styles.refreshBtn} onClick={fetchLiveReports} disabled={isLoading}>
              {isLoading ? 'Syncing...' : 'Sync Live Feed'}
            </button>
          </div>

          {reports.length === 0 ? (
            <div style={styles.emptyCard}>
              <p>No reports in database. Submit a report from the Citizen form to view it here.</p>
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
        /* GOOGLE FORM VERTICAL SUMMARY LAYOUT */
        <div style={styles.formSheetContainer}>
          <div style={styles.formSheetHeaderCard}>
            <div style={styles.formSheetTitleRow}>
              <div>
                <span style={styles.formSheetSub}>PROJECT AGAP - INCIDENT SUBMISSION RESPONSE</span>
                <h2 style={styles.formSheetTitle}>Ticket Reference: {selectedReport.id}</h2>
              </div>
              <button style={styles.closeSheetBtn} onClick={() => setSelectedReport(null)}>
                Close Inspector
              </button>
            </div>
            <div style={styles.formSheetMetaBar}>
              Status: <strong>{selectedReport.status || 'PENDING'}</strong> | Submitted: {selectedReport.created_at ? new Date(selectedReport.created_at).toLocaleString() : 'Recently'}
            </div>
          </div>

          <div style={styles.formSectionCard}>
            <label style={styles.formSectionLabel}>1. SUBMITTER & USER ROLE</label>
            <div style={styles.formValueText}>{selectedReport.sender_name || 'Anonymous Submitter'}</div>
            <div style={styles.formSubText}>Role: {selectedReport.user_role || 'CITIZEN'}</div>
          </div>

          <div style={styles.formSectionCard}>
            <label style={styles.formSectionLabel}>2. HAZARD / REPORT TYPE</label>
            <div style={styles.formValueTextBold}>{selectedReport.report_type || selectedReport.category || 'General Hazard'}</div>
          </div>

          <div style={styles.formSectionCard}>
            <label style={styles.formSectionLabel}>3. SEVERITY URGENCY LEVEL</label>
            <div style={{ ...styles.formValueTextBold, color: '#DC2626' }}>{selectedReport.severity}</div>
          </div>

          <div style={styles.formSectionCard}>
            <label style={styles.formSectionLabel}>4. INCIDENT LOCATION & GPS COORDINATES</label>
            <div style={styles.formValueText}>Location: {selectedReport.location}</div>
            <div style={styles.formSubText}>Coordinates: {selectedReport.coordinates || '13.7850 N, 121.0740 E'}</div>
          </div>

          <div style={styles.formSectionCard}>
            <label style={styles.formSectionLabel}>5. HAZARD DETAILS & REMARKS</label>
            <p style={styles.formParagraphText}>{selectedReport.description || selectedReport.details || 'No remarks provided.'}</p>
          </div>

          <div style={styles.formSectionCard}>
            <label style={styles.formSectionLabel}>6. ATTACHED PHOTO EVIDENCE</label>
            {selectedReport.photo_urls && selectedReport.photo_urls.length > 0 ? (
              <div style={styles.imageGrid}>
                {selectedReport.photo_urls.map((photoSrc, idx) => (
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
            <label style={styles.formSectionLabel}>7. COMMAND CENTER DECISION & DISPATCH WORKFLOW</label>

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
                Approve and Dispatch {assignedUnit}
              </button>

              <button
                style={isProcessingAction ? styles.btnDisabled : styles.btnInvestigate}
                onClick={() => handleUpdateReportStatus('UNDER_INVESTIGATION')}
                disabled={isProcessingAction}
              >
                Put Under Barangay Investigation
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
  pageContainer: { width: '100%', minHeight: '100vh', backgroundColor: '#F1F5F9', padding: '16px', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' },
  navHeader: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', backgroundColor: '#FFFFFF', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E2E8F0' },
  backBtn: { backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  headerTitle: { fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 },
  adminBadge: { fontSize: '10px', fontWeight: '800', backgroundColor: '#0F766E', color: '#FFFFFF', padding: '2px 6px', borderRadius: '4px' },
  headerSub: { fontSize: '11px', color: '#64748B' },
  mainContent: { maxWidth: '900px', margin: '0 auto' },
  sectionHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  sectionHeader: { fontSize: '14px', fontWeight: '800', color: '#0F172A' },
  refreshBtn: { fontSize: '11px', fontWeight: '700', color: '#0F766E', backgroundColor: '#CCFBF1', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' },
  emptyCard: { backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'center', color: '#64748B', fontSize: '12px' },
  reportGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' },
  fileCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' },
  fileCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  fileIdTag: { fontSize: '11px', fontWeight: '800', color: '#0F766E', backgroundColor: '#F0FDF4', padding: '2px 6px', borderRadius: '4px' },
  statusYellow: { fontSize: '10px', fontWeight: '800', color: '#D97706', backgroundColor: '#FEF3C7', padding: '2px 8px', borderRadius: '10px' },
  statusGreen: { fontSize: '10px', fontWeight: '800', color: '#15803D', backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '10px' },
  statusBlue: { fontSize: '10px', fontWeight: '800', color: '#1D4ED8', backgroundColor: '#DBEAFE', padding: '2px 8px', borderRadius: '10px' },
  statusRed: { fontSize: '10px', fontWeight: '800', color: '#B91C1C', backgroundColor: '#FEE2E2', padding: '2px 8px', borderRadius: '10px' },
  fileTitle: { fontSize: '13px', fontWeight: '800', color: '#0F172A', margin: 0 },
  fileMeta: { fontSize: '11px', color: '#475569' },
  processFileBtn: { width: '100%', padding: '8px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', marginTop: 'auto' },

  formSheetContainer: { maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' },
  formSheetHeaderCard: { backgroundColor: '#FFFFFF', borderTop: '8px solid #0F766E', borderLeft: '1px solid #CBD5E1', borderRight: '1px solid #CBD5E1', borderBottom: '1px solid #CBD5E1', borderRadius: '8px', padding: '16px' },
  formSheetTitleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  formSheetSub: { fontSize: '10px', fontWeight: '800', color: '#0F766E', letterSpacing: '0.5px' },
  formSheetTitle: { fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: '4px 0 0 0' },
  closeSheetBtn: { backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', color: '#475569', cursor: 'pointer' },
  formSheetMetaBar: { fontSize: '11px', color: '#64748B', marginTop: '8px', borderTop: '1px solid #F1F5F9', paddingTop: '8px' },

  formSectionCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '14px' },
  formSectionLabel: { fontSize: '11px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' },
  formValueText: { fontSize: '12px', color: '#0F172A' },
  formValueTextBold: { fontSize: '13px', fontWeight: '800', color: '#0F172A' },
  formSubText: { fontSize: '11px', color: '#64748B', marginTop: '2px' },
  formParagraphText: { fontSize: '12px', color: '#334155', margin: 0, lineHeight: '1.5' },

  imageGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px', marginTop: '8px' },
  imageCard: { border: '1px solid #CBD5E1', borderRadius: '6px', overflow: 'hidden', height: '110px', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  evidenceImage: { width: '100%', height: '100%', objectFit: 'cover' },
  fallbackPhotoBox: { padding: '8px', fontSize: '11px', color: '#64748B', textAlign: 'center' },

  formActionCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderLeft: '6px solid #0F766E', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  inputLabelText: { fontSize: '10px', fontWeight: '800', color: '#475569' },
  selectInput: { padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px' },
  textArea: { padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', fontFamily: 'inherit' },
  actionButtonGroup: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' },
  btnApprove: { padding: '10px', backgroundColor: '#15803D', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' },
  btnInvestigate: { padding: '10px', backgroundColor: '#D97706', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' },
  btnReject: { padding: '10px', backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' },
  btnDelete: { padding: '10px', backgroundColor: '#475569', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' },
  btnDisabled: { padding: '10px', backgroundColor: '#94A3B8', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'not-allowed' }
};
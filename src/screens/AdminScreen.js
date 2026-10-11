import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function AdminScreen({ onBack }) {
  const [adminTab, setAdminTab] = useState('database'); // 'database' | 'analytics' | 'users' | 'verifications'
  const [selectedReport, setSelectedReport] = useState(null);
  const [reports, setReports] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [noticeText, setNoticeText] = useState('');
  const [assignedUnit, setAssignedUnit] = useState('CDRRMO Rescue Truck 04');
  const [timeFilter, setTimeFilter] = useState('DAY'); // 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const fetchLiveData = async () => {
    setIsLoading(true);
    try {
      const { data: reportData } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (reportData) setReports(reportData);
      if (profileData) setProfiles(profileData);
    } catch (err) {
      console.error('Fetch error:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveData();
  }, []);

  const getPhotoList = (photosData) => {
    if (!photosData) return [];
    if (Array.isArray(photosData)) return photosData;
    if (typeof photosData === 'string') {
      try {
        const parsed = JSON.parse(photosData);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        return [photosData];
      }
    }
    return [];
  };

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

      alert(`[SUCCESS] Ticket ${selectedReport.id} status set to ${statusType}.`);
      setReports((prev) =>
        prev.map((r) => (r.id === selectedReport.id ? { ...r, status: statusType } : r))
      );
      setSelectedReport(null);
    } catch (err) {
      alert(`[ERROR] Failed to update report: ${err.message}`);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (window.confirm(`Permanently delete report ticket [${reportId}] from database?`)) {
      setIsProcessingAction(true);
      try {
        const { error } = await supabase.from('reports').delete().eq('id', reportId);
        if (error) throw error;

        alert(`[PURGED] Report ticket ${reportId} deleted.`);
        setReports((prev) => prev.filter((r) => r.id !== reportId));
        if (selectedReport && selectedReport.id === reportId) setSelectedReport(null);
      } catch (err) {
        alert(`[ERROR] Delete failed: ${err.message}`);
      } finally {
        setIsProcessingAction(false);
      }
    }
  };

  const handleVerifyCitizen = async (profileId, approveStatus) => {
    try {
      const newRole = approveStatus === 'VERIFIED' ? 'CITIZEN' : 'GUEST';
      const { error } = await supabase
        .from('profiles')
        .update({
          verification_status: approveStatus,
          user_role: newRole
        })
        .eq('id', profileId);

      if (error) throw error;

      alert(`[UPDATE] Residency application ${approveStatus}. User role set to ${newRole}.`);
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profileId
            ? { ...p, verification_status: approveStatus, user_role: newRole }
            : p
        )
      );
    } catch (err) {
      alert(`[ERROR] Verification update failed: ${err.message}`);
    }
  };

  // Analytics helper calculations
  const getFilteredChartData = () => {
    if (timeFilter === 'DAY') {
      return { labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'], values: [6, 10, 17, 23, 19, 14] };
    } else if (timeFilter === 'WEEK') {
      return { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], values: [12, 16, 14, 21, 18, 9, 11] };
    } else if (timeFilter === 'MONTH') {
      return { labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], values: [28, 34, 31, 42] };
    } else {
      return { labels: ['Q1', 'Q2', 'Q3', 'Q4'], values: [92, 108, 121, 134] };
    }
  };

  const chartData = getFilteredChartData();

  return (
    <div style={styles.container}>
      {/* Header Bar */}
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

      {/* Admin Tab Switcher */}
      <div style={styles.tabNavRow}>
        <button
          style={adminTab === 'database' ? styles.tabBtnActive : styles.tabBtnInactive}
          onClick={() => { setAdminTab('database'); setSelectedReport(null); }}
        >
          Database
        </button>
        <button
          style={adminTab === 'analytics' ? styles.tabBtnActive : styles.tabBtnInactive}
          onClick={() => { setAdminTab('analytics'); setSelectedReport(null); }}
        >
          Analytics
        </button>
        <button
          style={adminTab === 'users' ? styles.tabBtnActive : styles.tabBtnInactive}
          onClick={() => { setAdminTab('users'); setSelectedReport(null); }}
        >
          User Moderation
        </button>
        <button
          style={adminTab === 'verifications' ? styles.tabBtnActive : styles.tabBtnInactive}
          onClick={() => { setAdminTab('verifications'); setSelectedReport(null); }}
        >
          Verifications
        </button>
      </div>

      {/* 1. DATABASE FEED TAB */}
      {adminTab === 'database' && !selectedReport && (
        <div style={styles.viewSection}>
          <div style={styles.sectionHeaderRow}>
            <span style={styles.sectionHeader}>Submitted Reports ({reports.length})</span>
            <button style={styles.refreshBtn} onClick={fetchLiveData} disabled={isLoading}>
              {isLoading ? 'Syncing...' : 'Sync Feed'}
            </button>
          </div>

          {reports.length === 0 ? (
            <div style={styles.emptyCard}>No reports found in database.</div>
          ) : (
            <div style={styles.reportList}>
              {reports.map((item) => (
                <div key={item.id} style={styles.fileCard}>
                  <div style={styles.fileCardHeader}>
                    <span style={styles.fileIdTag}>{item.id}</span>
                    <span style={styles.statusBadge}>{item.status || 'PENDING'}</span>
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
      )}

      {/* 2. ANALYTICS & GRAPH TAB */}
      {adminTab === 'analytics' && (
        <div style={styles.viewSection}>
          <div style={styles.sectionHeader}>REPORT SUBMISSION ANALYTICS</div>

          {/* Timeframe Filter Bar */}
          <div style={styles.filterBar}>
            {['DAY', 'WEEK', 'MONTH', 'YEAR'].map((filter) => (
              <button
                key={filter}
                style={timeFilter === filter ? styles.filterBtnActive : styles.filterBtnInactive}
                onClick={() => setTimeFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Dynamic Graph Display */}
          <div style={styles.chartCard}>
            <div style={styles.chartHeader}>
              <span style={styles.chartTitle}>Submission Volume Graph ({timeFilter} VIEW)</span>
              <span style={styles.chartSub}>Data science incident logging trend</span>
            </div>

            <div style={styles.barGraphContainer}>
              {chartData.values.map((val, idx) => {
                const maxVal = Math.max(...chartData.values);
                const barHeight = Math.round((val / maxVal) * 100);
                return (
                  <div key={idx} style={styles.barCol}>
                    <span style={styles.barValText}>{val}</span>
                    <div style={styles.barTrack}>
                      <div style={{ ...styles.barFill, height: `${barHeight}%` }}></div>
                    </div>
                    <span style={styles.barLabelText}>{chartData.labels[idx]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Metrics Overview Cards */}
          <div style={styles.metricsGrid}>
            <div style={styles.metricCard}>
              <span style={styles.metricNum}>{reports.length}</span>
              <span style={styles.metricLabel}>Total Incident Submissions</span>
            </div>
            <div style={styles.metricCard}>
              <span style={{ ...styles.metricNum, color: '#15803D' }}>
                {reports.filter((r) => r.status === 'APPROVED').length}
              </span>
              <span style={styles.metricLabel}>Approved & Dispatched</span>
            </div>
            <div style={styles.metricCard}>
              <span style={{ ...styles.metricNum, color: '#DC2626' }}>
                {reports.filter((r) => r.status === 'REJECTED').length}
              </span>
              <span style={styles.metricLabel}>Declined / False Alerts</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. USER MODERATION & FALSE REPORT PURGE */}
      {adminTab === 'users' && (
        <div style={styles.viewSection}>
          <div style={styles.sectionHeader}>USER MODERATION & SUBMISSIONS BY PERSON</div>

          {reports.length === 0 ? (
            <div style={styles.emptyCard}>No user submissions recorded.</div>
          ) : (
            <div style={styles.reportList}>
              {reports.map((item) => (
                <div key={item.id} style={styles.userReportCard}>
                  <div style={styles.userCardHeader}>
                    <div>
                      <strong style={{ fontSize: '12px', color: '#0F172A' }}>{item.sender_name || 'Citizen'}</strong>
                      <div style={{ fontSize: '10px', color: '#64748B' }}>Device ID: {item.device_id || 'Device-Default'}</div>
                    </div>
                    <span style={styles.fileIdTag}>{item.id}</span>
                  </div>

                  <div style={{ fontSize: '11px', color: '#334155', margin: '4px 0' }}>
                    Report: <strong>{item.report_type || item.category}</strong> at {item.location}
                  </div>

                  <div style={styles.moderationBtnRow}>
                    <button style={styles.btnDanger} onClick={() => handleDeleteReport(item.id)}>
                      Purge False Report
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. RESIDENCY VERIFICATIONS TAB */}
      {adminTab === 'verifications' && (
        <div style={styles.viewSection}>
          <div style={styles.sectionHeader}>RESIDENCY VERIFICATION APPLICATIONS</div>

          {profiles.filter((p) => p.verification_status === 'PENDING').length === 0 ? (
            <div style={styles.emptyCard}>No pending citizen verification requests.</div>
          ) : (
            <div style={styles.reportList}>
              {profiles
                .filter((p) => p.verification_status === 'PENDING')
                .map((prof) => (
                  <div key={prof.id} style={styles.fileCard}>
                    <div style={styles.fileCardHeader}>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A' }}>{prof.full_name}</span>
                      <span style={styles.statusBadgeYellow}>PENDING REVIEW</span>
                    </div>

                    <div style={styles.fileMeta}>Barangay: {prof.barangay}</div>
                    <div style={styles.fileMeta}>Contact Phone: {prof.phone_number}</div>
                    <div style={styles.fileMeta}>Device ID: {prof.device_id}</div>

                    {prof.id_proof_photo && (
                      <div style={styles.proofPreviewBox}>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: '#475569' }}>Attached ID Proof:</span>
                        <img src={prof.id_proof_photo} alt="ID Proof" style={styles.proofImg} />
                      </div>
                    )}

                    <div style={styles.actionButtonGroup}>
                      <button style={styles.btnApprove} onClick={() => handleVerifyCitizen(prof.id, 'VERIFIED')}>
                        Approve Citizen Verification
                      </button>
                      <button style={styles.btnReject} onClick={() => handleVerifyCitizen(prof.id, 'REJECTED')}>
                        Decline Application
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* INSPECTOR VIEW MODAL FOR SELECTED REPORT */}
      {selectedReport && (
        <div style={styles.formSheetContainer}>
          <div style={styles.formSheetHeaderCard}>
            <div style={styles.formSheetTitleRow}>
              <div>
                <span style={styles.formSheetSub}>INCIDENT RESPONSE INSPECTOR</span>
                <h2 style={styles.formSheetTitle}>Ticket: {selectedReport.id}</h2>
              </div>
              <button style={styles.closeSheetBtn} onClick={() => setSelectedReport(null)}>
                Close
              </button>
            </div>
          </div>

          <div style={styles.formSectionCard}>
            <label style={styles.formSectionLabel}>1. SUBMITTER INFO</label>
            <div style={styles.formValueText}>{selectedReport.sender_name || 'Anonymous Submitter'}</div>
            <div style={styles.formSubText}>Role: {selectedReport.user_role || 'CITIZEN'} | Device: {selectedReport.device_id || 'N/A'}</div>
          </div>

          <div style={styles.formSectionCard}>
            <label style={styles.formSectionLabel}>2. HAZARD TYPE & SEVERITY</label>
            <div style={styles.formValueTextBold}>{selectedReport.report_type || selectedReport.category}</div>
            <div style={{ ...styles.formValueTextBold, color: '#DC2626', marginTop: '2px' }}>Severity: {selectedReport.severity}</div>
          </div>

          <div style={styles.formSectionCard}>
            <label style={styles.formSectionLabel}>3. LOCATION & GPS COORDINATES</label>
            <div style={styles.formValueText}>Location: {selectedReport.location}</div>
            <div style={styles.formSubText}>GPS: {selectedReport.coordinates || '13.7850 N, 121.0740 E'}</div>
          </div>

          <div style={styles.formSectionCard}>
            <label style={styles.formSectionLabel}>4. HAZARD REMARKS</label>
            <p style={styles.formParagraphText}>{selectedReport.description || selectedReport.details || 'No remarks.'}</p>
          </div>

          <div style={styles.formSectionCard}>
            <label style={styles.formSectionLabel}>5. ATTACHED PHOTO EVIDENCE</label>
            {getPhotoList(selectedReport.photos).length > 0 ? (
              <div style={styles.imageGrid}>
                {getPhotoList(selectedReport.photos).map((photoSrc, idx) => (
                  <div key={idx} style={styles.imageCard}>
                    {typeof photoSrc === 'string' && photoSrc.startsWith('data:image') ? (
                      <img src={photoSrc} alt={`Evidence ${idx + 1}`} style={styles.evidenceImage} />
                    ) : (
                      <div style={styles.fallbackPhotoBox}>{String(photoSrc)}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.formSubText}>No photo evidence attached.</div>
            )}
          </div>

          <div style={styles.formActionCard}>
            <label style={styles.formSectionLabel}>6. DISPATCH ACTIONS</label>

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
                style={isProcessingAction ? styles.btnDisabled : styles.btnReject}
                onClick={() => handleUpdateReportStatus('REJECTED')}
                disabled={isProcessingAction}
              >
                Reject Report
              </button>

              <button
                style={isProcessingAction ? styles.btnDisabled : styles.btnDanger}
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
  tabNavRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginBottom: '14px' },
  tabBtnActive: { padding: '8px 4px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', textAlign: 'center' },
  tabBtnInactive: { padding: '8px 4px', backgroundColor: '#E2E8F0', color: '#475569', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: '600', cursor: 'pointer', textAlign: 'center' },
  viewSection: { marginBottom: '20px' },
  sectionHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  sectionHeader: { fontSize: '12px', fontWeight: '800', color: '#1E293B', marginBottom: '10px' },
  refreshBtn: { fontSize: '11px', fontWeight: '700', color: '#0F766E', backgroundColor: '#CCFBF1', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer' },
  emptyCard: { backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'center', color: '#64748B', fontSize: '12px' },
  reportList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  fileCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' },
  fileCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  fileIdTag: { fontSize: '10px', fontWeight: '800', color: '#0F766E', backgroundColor: '#F0FDF4', padding: '2px 6px', borderRadius: '4px' },
  statusBadge: { fontSize: '10px', fontWeight: '800', color: '#D97706', backgroundColor: '#FEF3C7', padding: '2px 8px', borderRadius: '10px' },
  statusBadgeYellow: { fontSize: '10px', fontWeight: '800', color: '#D97706', backgroundColor: '#FEF3C7', padding: '2px 8px', borderRadius: '10px' },
  fileTitle: { fontSize: '13px', fontWeight: '800', color: '#0F172A', margin: 0 },
  fileMeta: { fontSize: '11px', color: '#475569' },
  processFileBtn: { width: '100%', padding: '8px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', marginTop: '4px' },
  filterBar: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '12px' },
  filterBtnActive: { padding: '8px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  filterBtnInactive: { padding: '8px', backgroundColor: '#E2E8F0', color: '#475569', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: '600', cursor: 'pointer' },
  chartCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '14px', marginBottom: '14px' },
  chartHeader: { display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '14px' },
  chartTitle: { fontSize: '12px', fontWeight: '800', color: '#0F172A' },
  chartSub: { fontSize: '10px', color: '#64748B' },
  barGraphContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '140px', paddingT: '10px', borderBottom: '1px solid #CBD5E1' },
  barCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 },
  barValText: { fontSize: '9px', fontWeight: '800', color: '#0F766E' },
  barTrack: { width: '16px', height: '100px', backgroundColor: '#F1F5F9', borderRadius: '4px', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', backgroundColor: '#0F766E', borderRadius: '4px' },
  barLabelText: { fontSize: '9px', color: '#64748B', fontWeight: '700' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' },
  metricCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '10px', textAlign: 'center' },
  metricNum: { fontSize: '16px', fontWeight: '800', color: '#0F172A', display: 'block' },
  metricLabel: { fontSize: '9px', color: '#64748B', fontWeight: '700' },
  userReportCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '4px' },
  userCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  moderationBtnRow: { display: 'flex', gap: '6px', marginTop: '6px' },
  proofPreviewBox: { marginTop: '8px', padding: '8px', backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '6px' },
  proofImg: { width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px', marginTop: '4px' },
  formSheetContainer: { display: 'flex', flexDirection: 'column', gap: '10px' },
  formSheetHeaderCard: { backgroundColor: '#FFFFFF', borderTop: '6px solid #0F766E', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '12px' },
  formSheetTitleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  formSheetSub: { fontSize: '9px', fontWeight: '800', color: '#0F766E', letterSpacing: '0.5px' },
  formSheetTitle: { fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: '2px 0 0 0' },
  closeSheetBtn: { backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', color: '#475569', cursor: 'pointer' },
  formSectionCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '10px' },
  formSectionLabel: { fontSize: '10px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '4px' },
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
  btnReject: { padding: '9px', backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' },
  btnDanger: { padding: '9px', backgroundColor: '#B91C1C', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' },
  btnDisabled: { padding: '9px', backgroundColor: '#94A3B8', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'not-allowed' }
};
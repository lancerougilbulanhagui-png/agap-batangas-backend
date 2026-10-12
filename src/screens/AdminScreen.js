import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function AdminScreen({ onBack }) {
  const [adminTab, setAdminTab] = useState('database'); // 'database' | 'analytics' | 'users' | 'verifications'
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [reports, setReports] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [noticeText, setNoticeText] = useState('');
  const [assignedUnit, setAssignedUnit] = useState('CDRRMO Rescue Truck 04');
  const [timeFilter, setTimeFilter] = useState('DAY'); // 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'
  const [summaryText, setSummaryText] = useState('');
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
      `[AGAP DISPATCH NOTICE]: Response Unit (${assignedUnit}) assigned to report "${report.hazard_type || report.title || 'Hazard Report'}" at ${report.location}.`
    );
  };

  const openGpsInMaps = (coordString) => {
    if (!coordString) return;
    const cleanCoords = coordString.replace(/[^0-9.,NnSsEeWw\s]/g, '').trim();
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanCoords)}`;
    window.open(googleMapsUrl, '_blank');
  };

  const handleUpdateReportStatus = async (statusType) => {
    setIsProcessingAction(true);
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: statusType })
        .eq('id', selectedReport.id);

      if (error) throw error;

      alert(`[SUCCESS] Ticket ${selectedReport.id} set to ${statusType}.`);
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

  const handlePurgeAllUserReports = async (deviceId) => {
    if (window.confirm(`Purge ALL submitted reports from Device ID [${deviceId}]?`)) {
      setIsProcessingAction(true);
      try {
        const { error } = await supabase.from('reports').delete().eq('device_id', deviceId);
        if (error) throw error;

        alert(`[PURGED] All submissions from Device [${deviceId}] deleted.`);
        setReports((prev) => prev.filter((r) => r.device_id !== deviceId));
        setSelectedUser(null);
      } catch (err) {
        alert(`[ERROR] User purge failed: ${err.message}`);
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

      alert(`[UPDATE] Residency status set to ${approveStatus}.`);
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profileId
            ? { ...p, verification_status: approveStatus, user_role: newRole }
            : p
        )
      );
      setSelectedVerification(null);
    } catch (err) {
      alert(`[ERROR] Verification failed: ${err.message}`);
    }
  };

  // Analytics calculation based strictly on live database entries
  const getFilteredReports = () => {
    const now = new Date();
    return reports.filter((r) => {
      const reportDate = new Date(r.created_at || now);
      const diffHours = (now - reportDate) / (1000 * 60 * 60);

      if (timeFilter === 'DAY') return diffHours <= 24;
      if (timeFilter === 'WEEK') return diffHours <= 168;
      if (timeFilter === 'MONTH') return diffHours <= 720;
      if (timeFilter === 'YEAR') return diffHours <= 8760;
      return true;
    });
  };

  const filteredReportsList = getFilteredReports();

  const generatePeriodSummary = () => {
    const total = filteredReportsList.length;
    if (total === 0) {
      setSummaryText(`No hazard reports submitted in the database for the selected period (${timeFilter}).`);
      return;
    }

    const approvedCount = filteredReportsList.filter((r) => r.status === 'APPROVED').length;
    const pendingCount = filteredReportsList.filter((r) => r.status === 'PENDING').length;
    const criticalCount = filteredReportsList.filter((r) => r.severity === 'CRITICAL' || r.severity === 'SEVERE').length;

    const categories = {};
    filteredReportsList.forEach((r) => {
      const cat = r.hazard_type || r.category || 'General Hazard';
      categories[cat] = (categories[cat] || 0) + 1;
    });

    const topCategory = Object.keys(categories).reduce((a, b) => (categories[a] > categories[b] ? a : b), 'General Hazard');

    setSummaryText(
      `SUMMARY (${timeFilter} VIEW): ${total} total submission(s) recorded. ` +
      `${approvedCount} approved/dispatched, ${pendingCount} pending review. ` +
      `Primary hazard type: "${topCategory}" (${categories[topCategory]} report[s]). ` +
      `High-severity incidents requiring priority dispatch: ${criticalCount}.`
    );
  };

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

      {/* Main Content Sections */}
      {adminTab === 'database' && !selectedReport && (
        <div style={styles.viewSection}>
          <div style={styles.sectionHeaderRow}>
            <span style={styles.sectionHeader}>Submitted Reports Database ({reports.length})</span>
            <button style={styles.refreshBtn} onClick={fetchLiveData} disabled={isLoading}>
              {isLoading ? 'Syncing...' : 'Sync Feed'}
            </button>
          </div>

          {reports.length === 0 ? (
            <div style={styles.emptyCard}>No submissions found in database.</div>
          ) : (
            <div style={styles.reportList}>
              {reports.map((item) => (
                <div key={item.id} style={styles.fileCard}>
                  <div style={styles.fileCardHeader}>
                    <span style={styles.fileIdTag}>{item.id}</span>
                    <span style={styles.statusBadge}>{item.status || 'PENDING'}</span>
                  </div>
                  <h3 style={styles.fileTitle}>{item.hazard_type || item.title || item.category}</h3>
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

      {adminTab === 'analytics' && (
        <div style={styles.viewSection}>
          <div style={styles.sectionHeader}>DATABASE SUBMISSION ANALYTICS</div>

          <div style={styles.filterBar}>
            {['DAY', 'WEEK', 'MONTH', 'YEAR'].map((filter) => (
              <button
                key={filter}
                style={timeFilter === filter ? styles.filterBtnActive : styles.filterBtnInactive}
                onClick={() => { setTimeFilter(filter); setSummaryText(''); }}
              >
                {filter}
              </button>
            ))}
          </div>

          <div style={styles.chartCard}>
            <div style={styles.chartHeader}>
              <span style={styles.chartTitle}>Incidents Logged ({timeFilter} VIEW)</span>
              <span style={styles.chartSub}>Total Records in Period: {filteredReportsList.length}</span>
            </div>

            <div style={styles.metricsGrid}>
              <div style={styles.metricCard}>
                <span style={styles.metricNum}>{filteredReportsList.length}</span>
                <span style={styles.metricLabel}>Total Submissions</span>
              </div>
              <div style={styles.metricCard}>
                <span style={{ ...styles.metricNum, color: '#15803D' }}>
                  {filteredReportsList.filter((r) => r.status === 'APPROVED').length}
                </span>
                <span style={styles.metricLabel}>Dispatched</span>
              </div>
              <div style={styles.metricCard}>
                <span style={{ ...styles.metricNum, color: '#DC2626' }}>
                  {filteredReportsList.filter((r) => r.severity === 'CRITICAL' || r.severity === 'SEVERE').length}
                </span>
                <span style={styles.metricLabel}>Severe Hazards</span>
              </div>
            </div>

            <button style={styles.summaryActionBtn} onClick={generatePeriodSummary}>
              Generate Period Summary
            </button>

            {summaryText && <div style={styles.summaryOutputCard}>{summaryText}</div>}
          </div>
        </div>
      )}

      {adminTab === 'users' && !selectedUser && (
        <div style={styles.viewSection}>
          <div style={styles.sectionHeader}>USER MODERATION & SUBMITTERS</div>

          {profiles.length === 0 ? (
            <div style={styles.emptyCard}>No registered user accounts found.</div>
          ) : (
            <div style={styles.reportList}>
              {profiles.map((prof) => (
                <div key={prof.id} style={styles.fileCard}>
                  <div style={styles.fileCardHeader}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A' }}>{prof.full_name || 'Citizen User'}</span>
                    <span style={styles.statusBadge}>{prof.verification_status || 'UNVERIFIED'}</span>
                  </div>
                  <div style={styles.fileMeta}>Barangay: {prof.barangay || 'N/A'}</div>
                  <div style={styles.fileMeta}>Device ID: {prof.device_id}</div>
                  <button style={styles.processFileBtn} onClick={() => setSelectedUser(prof)}>
                    Inspect User & Submissions &rarr;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {adminTab === 'users' && selectedUser && (
        <div style={styles.viewSection}>
          <button style={styles.closeSheetBtn} onClick={() => setSelectedUser(null)}>
            &lt; Back to Users
          </button>
          <div style={styles.formSectionCard}>
            <label style={styles.formSectionLabel}>USER PROFILE DATA</label>
            <div style={styles.formValueTextBold}>{selectedUser.full_name}</div>
            <div style={styles.formSubText}>Device ID: {selectedUser.device_id} | Phone: {selectedUser.phone || 'N/A'}</div>
            <div style={styles.formSubText}>Barangay: {selectedUser.barangay} | Status: {selectedUser.verification_status}</div>
          </div>

          <div style={{ ...styles.sectionHeader, marginTop: '12px' }}>
            SUBMISSIONS FROM THIS USER ({reports.filter((r) => r.device_id === selectedUser.device_id).length})
          </div>

          {reports.filter((r) => r.device_id === selectedUser.device_id).length === 0 ? (
            <div style={styles.emptyCard}>No reports submitted by this user device.</div>
          ) : (
            <div style={styles.reportList}>
              {reports
                .filter((r) => r.device_id === selectedUser.device_id)
                .map((r) => (
                  <div key={r.id} style={styles.fileCard}>
                    <div style={styles.fileCardHeader}>
                      <span style={styles.fileIdTag}>{r.id}</span>
                      <span style={styles.statusBadge}>{r.status}</span>
                    </div>
                    <div style={styles.fileTitle}>{r.hazard_type || r.category}</div>
                    <div style={styles.fileMeta}>{r.location}</div>
                  </div>
                ))}
            </div>
          )}

          <button
            style={{ ...styles.btnDanger, marginTop: '12px', width: '100%' }}
            onClick={() => handlePurgeAllUserReports(selectedUser.device_id)}
          >
            Purge All Reports From This User
          </button>
        </div>
      )}

      {adminTab === 'verifications' && !selectedVerification && (
        <div style={styles.viewSection}>
          <div style={styles.sectionHeader}>PENDING RESIDENCY APPLICATIONS</div>

          {profiles.filter((p) => p.verification_status === 'PENDING').length === 0 ? (
            <div style={styles.emptyCard}>No pending verification applications.</div>
          ) : (
            <div style={styles.reportList}>
              {profiles
                .filter((p) => p.verification_status === 'PENDING')
                .map((prof) => (
                  <div key={prof.id} style={styles.fileCard}>
                    <div style={styles.fileCardHeader}>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>{prof.full_name}</span>
                      <span style={styles.statusBadgeYellow}>PENDING</span>
                    </div>
                    <button style={styles.processFileBtn} onClick={() => setSelectedVerification(prof)}>
                      Review Application &rarr;
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {adminTab === 'verifications' && selectedVerification && (
        <div style={styles.viewSection}>
          <button style={styles.closeSheetBtn} onClick={() => setSelectedVerification(null)}>
            &lt; Back to List
          </button>
          <div style={styles.formSectionCard}>
            <label style={styles.formSectionLabel}>CITIZEN APPLICATION DETAILS</label>
            <div style={styles.formValueTextBold}>{selectedVerification.full_name}</div>
            <div style={styles.formSubText}>Barangay: {selectedVerification.barangay}</div>
            <div style={styles.formSubText}>Phone: {selectedVerification.phone || 'N/A'}</div>
            <div style={styles.formSubText}>Device Fingerprint: {selectedVerification.device_id}</div>

            {selectedVerification.proof_photo && (
              <div style={styles.proofPreviewBox}>
                <span style={{ fontSize: '10px', fontWeight: '800', color: '#475569' }}>SUBMITTED ID PROOF:</span>
                <img src={selectedVerification.proof_photo} alt="ID Proof" style={styles.proofImg} />
              </div>
            )}

            <div style={{ ...styles.actionButtonGroup, marginTop: '12px' }}>
              <button
                style={styles.btnApprove}
                onClick={() => handleVerifyCitizen(selectedVerification.id, 'VERIFIED')}
              >
                Approve Verified Citizen Status
              </button>
              <button
                style={styles.btnReject}
                onClick={() => handleVerifyCitizen(selectedVerification.id, 'REJECTED')}
              >
                Decline Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Inspector Modal */}
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
            <div style={styles.formValueTextBold}>{selectedReport.hazard_type || selectedReport.category}</div>
            <div style={{ ...styles.formValueTextBold, color: '#DC2626', marginTop: '2px' }}>Severity: {selectedReport.severity}</div>
          </div>

          <div style={styles.formSectionCard}>
            <label style={styles.formSectionLabel}>3. LOCATION & GPS COORDINATES</label>
            <div style={styles.formValueText}>Location: {selectedReport.location}</div>
            <button
              style={styles.gpsRedirectBtn}
              onClick={() => openGpsInMaps(selectedReport.coordinates || selectedReport.location)}
            >
              Redirect to GPS on Google Maps ({selectedReport.coordinates || 'Open Map'})
            </button>
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
            <label style={styles.formSectionLabel}>6. DISPATCH WORKFLOW</label>
            <div style={styles.inputGroup}>
              <label style={styles.inputLabelText}>ASSIGN RESPONDER UNIT:</label>
              <select
                style={styles.selectInput}
                value={assignedUnit}
                onChange={(e) => {
                  const nextUnit = e.target.value;
                  setAssignedUnit(nextUnit);
                  setNoticeText(
                    `[AGAP DISPATCH NOTICE]: Response Unit (${nextUnit}) assigned to report "${selectedReport.hazard_type || selectedReport.title || 'Hazard Report'}" at ${selectedReport.location}.`
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

      {/* Footer Navigation Bar (Without Icons) */}
      <div style={styles.footerNav}>
        <button
          style={adminTab === 'database' ? styles.footerBtnActive : styles.footerBtnInactive}
          onClick={() => { setAdminTab('database'); setSelectedReport(null); }}
        >
          Database
        </button>
        <button
          style={adminTab === 'analytics' ? styles.footerBtnActive : styles.footerBtnInactive}
          onClick={() => { setAdminTab('analytics'); setSelectedReport(null); }}
        >
          Analytics
        </button>
        <button
          style={adminTab === 'users' ? styles.footerBtnActive : styles.footerBtnInactive}
          onClick={() => { setAdminTab('users'); setSelectedReport(null); }}
        >
          Moderation
        </button>
        <button
          style={adminTab === 'verifications' ? styles.footerBtnActive : styles.footerBtnInactive}
          onClick={() => { setAdminTab('verifications'); setSelectedReport(null); }}
        >
          Verification
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '440px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#F8FAFC', padding: '16px 16px 80px 16px', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box', position: 'relative' },
  navHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' },
  backBtn: { backgroundColor: 'transparent', border: 'none', color: '#0F766E', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  headerTitle: { fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 },
  adminBadge: { fontSize: '9px', fontWeight: '800', backgroundColor: '#0F766E', color: '#FFFFFF', padding: '2px 6px', borderRadius: '4px' },
  headerSub: { fontSize: '11px', color: '#64748B' },
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
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' },
  metricCard: { backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '10px', textAlign: 'center' },
  metricNum: { fontSize: '16px', fontWeight: '800', color: '#0F172A', display: 'block' },
  metricLabel: { fontSize: '9px', color: '#64748B', fontWeight: '700' },
  summaryActionBtn: { width: '100%', padding: '9px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' },
  summaryOutputCard: { marginTop: '10px', backgroundColor: '#F0FDF4', border: '1px solid #A7F3D0', padding: '10px', borderRadius: '6px', fontSize: '11px', color: '#065F46', lineHeight: '1.4' },
  proofPreviewBox: { marginTop: '8px', padding: '8px', backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '6px' },
  proofImg: { width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px', marginTop: '4px' },
  gpsRedirectBtn: { backgroundColor: '#CCFBF1', border: '1px solid #99F6E4', color: '#0F766E', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', marginTop: '6px', display: 'inline-block' },
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
  btnDisabled: { padding: '9px', backgroundColor: '#94A3B8', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'not-allowed' },
  footerNav: { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '440px', backgroundColor: '#FFFFFF', borderTop: '1px solid #CBD5E1', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', padding: '6px 4px', boxSizing: 'border-box', zIndex: 100 },
  footerBtnActive: { backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', padding: '10px 2px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', textAlign: 'center' },
  footerBtnInactive: { backgroundColor: '#F1F5F9', color: '#475569', border: 'none', padding: '10px 2px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', textAlign: 'center' }
};

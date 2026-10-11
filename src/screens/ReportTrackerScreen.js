import React, { useState } from 'react';

/**
 * Project AGAP Batangas - Vertical Report Tracker (Shopee / Delivery Tracking Style)
 */
export default function ReportTrackerScreen({ onBack }) {
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [expandedReportId, setExpandedReportId] = useState('REP-101');

  const mySubmittedReports = [
    {
      id: 'REP-101',
      ticketNo: '#AGAP-2026-0812',
      title: 'Flash Flood & River Overflow Alert',
      category: 'FLOODING',
      barangay: 'Brgy. Kumintang Ibaba (Bridge Sector)',
      submittedAt: 'Today, 10:14 AM',
      currentStatus: 'DISPATCHED',
      statusLabel: 'Rescue Unit En Route',
      assignedOfficer: 'Officer K. Ramos (CDRRMO Dispatch 04)',
      assignedPhone: '(043) 702-3900',
      description: 'Water level reached knee-deep near the bridge after heavy downpour. 3 households requesting sandbags.',
      hasPhoto: true,
      processSteps: [
        { stepNo: 1, title: 'Report Logged', subtitle: 'Submission received & geo-tagged via AGAP Mobile', time: '10:14 AM', completed: true },
        { stepNo: 2, title: 'Barangay Triage & Verification', subtitle: 'Brgy. Kumintang Ibaba Desk validated report accuracy', time: '10:18 AM', completed: true },
        { stepNo: 3, title: 'Response Unit Dispatched', subtitle: 'CDRRMO Rescue Truck 04 & Sandbag Crew deployed', time: '10:25 AM', completed: true },
        { stepNo: 4, title: 'Hazard Mitigation & Cleared', subtitle: 'On-site clearing and safety clearance signoff', time: 'Pending Completion', completed: false }
      ]
    },
    {
      id: 'REP-102',
      ticketNo: '#AGAP-2026-0794',
      title: 'Fallen Electric Cable & Live Wire Danger',
      category: 'ELECTRICAL',
      barangay: 'Brgy. Alangilan (Near CICS Building)',
      submittedAt: 'Yesterday, 3:45 PM',
      currentStatus: 'RESOLVED',
      statusLabel: 'Hazard Resolved & Cleared',
      assignedOfficer: 'Meralco / Batangas Electric Crew 2',
      assignedPhone: '(043) 723-1422',
      description: 'High voltage wire dangling over highway lane. Area cordoned off by barangay tanods.',
      hasPhoto: true,
      processSteps: [
        { stepNo: 1, title: 'Report Logged', subtitle: 'Submission received via AGAP Citizen App', time: '3:45 PM', completed: true },
        { stepNo: 2, title: 'Barangay Safety Triage', subtitle: 'Tanod unit deployed to secure perimeter', time: '3:50 PM', completed: true },
        { stepNo: 3, title: 'Utility Crew Dispatched', subtitle: 'Meralco emergency lineman team arrived', time: '4:10 PM', completed: true },
        { stepNo: 4, title: 'Hazard Mitigated & Closed', subtitle: 'Wire repaired and power safely restored', time: '4:55 PM', completed: true }
      ]
    },
    {
      id: 'REP-103',
      ticketNo: '#AGAP-2026-0621',
      title: 'Blocked Drainage Canal & Stagnant Spill',
      category: 'INFRASTRUCTURE',
      barangay: 'Brgy. Bolbok Corridor',
      submittedAt: 'Oct 3, 2026, 1:20 PM',
      currentStatus: 'UNDER_REVIEW',
      statusLabel: 'Queued for Inspection',
      assignedOfficer: 'City Engineering & Public Works Team',
      assignedPhone: '(043) 723-2411',
      description: 'Culvert clogged with plastic debris causing street puddle formation.',
      hasPhoto: false,
      processSteps: [
        { stepNo: 1, title: 'Report Logged', subtitle: 'Report submitted and assigned reference ticket', time: '1:20 PM', completed: true },
        { stepNo: 2, title: 'Engineering Review', subtitle: 'Scheduled for local declogging batch inspection', time: 'In Review', completed: false },
        { stepNo: 3, title: 'Public Works Deployment', subtitle: 'Maintenance crew assignment pending', time: 'Pending', completed: false },
        { stepNo: 4, title: 'Resolved', subtitle: 'Final inspection & photo confirmation', time: 'Pending', completed: false }
      ]
    }
  ];

  const filteredReports = mySubmittedReports.filter((item) => {
    if (selectedFilter === 'ACTIVE') return item.currentStatus !== 'RESOLVED';
    if (selectedFilter === 'RESOLVED') return item.currentStatus === 'RESOLVED';
    return true;
  });

  const toggleExpand = (id) => {
    setExpandedReportId(expandedReportId === id ? null : id);
  };

  return (
    <div style={styles.container}>
      {/* Clean Header */}
      <div style={styles.navHeader}>
        <button style={styles.backBtn} onClick={onBack}>
          &lt; Back
        </button>
        <div>
          <h2 style={styles.headerTitle}>Report Tracker</h2>
          <div style={styles.headerSub}>Live Delivery-Style Process Tracking</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={styles.filterBar}>
        {[
          { key: 'ALL', label: 'All Reports (3)' },
          { key: 'ACTIVE', label: 'In Progress (2)' },
          { key: 'RESOLVED', label: 'Resolved (1)' }
        ].map((tab) => (
          <button
            key={tab.key}
            style={selectedFilter === tab.key ? styles.filterActive : styles.filterInactive}
            onClick={() => setSelectedFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Vertical Reports List */}
      <div style={styles.reportList}>
        {filteredReports.map((report) => {
          const isExpanded = expandedReportId === report.id;

          return (
            <div key={report.id} style={styles.reportCard}>
              <div style={styles.cardHeader} onClick={() => toggleExpand(report.id)}>
                <div style={styles.cardTopRow}>
                  <span style={styles.ticketTag}>{report.ticketNo}</span>
                  <span
                    style={
                      report.currentStatus === 'RESOLVED'
                        ? styles.badgeGreen
                        : report.currentStatus === 'DISPATCHED'
                        ? styles.badgeBlue
                        : styles.badgeYellow
                    }
                  >
                    {report.statusLabel}
                  </span>
                </div>

                <h3 style={styles.reportTitle}>{report.title}</h3>
                <div style={styles.locRow}>
                  <span>📍 {report.barangay}</span>
                  <span style={styles.timeText}>{report.submittedAt}</span>
                </div>

                <div style={styles.expandBar}>
                  <span>{isExpanded ? 'Hide Live Timeline ▲' : 'View Process Timeline ▼'}</span>
                </div>
              </div>

              {/* Expandable Vertical Stepper Timeline */}
              {isExpanded && (
                <div style={styles.expandedContent}>
                  <div style={styles.timelineTitle}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F766E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    </svg>
                    <span>LGU & DRRMO Response Timeline</span>
                  </div>

                  <div style={styles.verticalTimeline}>
                    {report.processSteps.map((step, idx) => (
                      <div key={step.stepNo} style={styles.timelineItem}>
                        <div style={styles.stepperCol}>
                          <div style={step.completed ? styles.circleActive : styles.circleInactive}>
                            {step.completed ? '✓' : step.stepNo}
                          </div>
                          {idx < report.processSteps.length - 1 && (
                            <div style={step.completed ? styles.lineActive : styles.lineInactive}></div>
                          )}
                        </div>

                        <div style={styles.stepTextContent}>
                          <div style={styles.stepTitleRow}>
                            <span style={step.completed ? styles.stepTitleDone : styles.stepTitlePending}>
                              {step.title}
                            </span>
                            <span style={styles.stepTimeTag}>{step.time}</span>
                          </div>
                          <div style={styles.stepSubtitle}>{step.subtitle}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={styles.reportInfoBox}>
                    <h4 style={styles.infoBoxHeading}>Submitted Ticket Metadata</h4>
                    <p style={styles.descText}><strong>User Description:</strong> {report.description}</p>
                    
                    <div style={styles.infoMetaRow}>
                      <div>
                        <span style={styles.metaLabel}>Assigned Commander:</span>
                        <div style={styles.metaVal}>{report.assignedOfficer}</div>
                      </div>
                      <div>
                        <span style={styles.metaLabel}>Hotline:</span>
                        <div style={styles.metaValTeal}>{report.assignedPhone}</div>
                      </div>
                    </div>

                    {report.hasPhoto && (
                      <div style={styles.photoIndicator}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F766E" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </svg>
                        <span>1 Geotagged Photo Attachment Verified</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '440px', margin: '0 auto', padding: '16px', fontFamily: "'Inter', sans-serif" },
  navHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
  backBtn: { backgroundColor: 'transparent', border: 'none', color: '#0F766E', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  headerTitle: { fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 },
  headerSub: { fontSize: '11px', color: '#64748B' },
  filterBar: { display: 'flex', gap: '8px', marginBottom: '16px' },
  filterActive: { flex: 1, padding: '8px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' },
  filterInactive: { flex: 1, padding: '8px', backgroundColor: '#E2E8F0', color: '#475569', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' },
  reportList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  reportCard: { backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' },
  cardHeader: { padding: '14px', cursor: 'pointer' },
  cardTopRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  ticketTag: { fontSize: '10px', fontWeight: '800', color: '#64748B', backgroundColor: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' },
  badgeBlue: { fontSize: '9px', fontWeight: '800', backgroundColor: '#E0F2FE', color: '#0369A1', padding: '3px 8px', borderRadius: '6px' },
  badgeGreen: { fontSize: '9px', fontWeight: '800', backgroundColor: '#DCFCE7', color: '#166534', padding: '3px 8px', borderRadius: '6px' },
  badgeYellow: { fontSize: '9px', fontWeight: '800', backgroundColor: '#FEF3C7', color: '#92400E', padding: '3px 8px', borderRadius: '6px' },
  reportTitle: { fontSize: '14px', fontWeight: '800', color: '#0F172A', margin: '0 0 6px 0' },
  locRow: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748B', fontWeight: '600', marginBottom: '10px' },
  timeText: { color: '#94A3B8' },
  expandBar: { fontSize: '11px', fontWeight: '800', color: '#0F766E', textAlign: 'center', paddingTop: '8px', borderTop: '1px dashed #E2E8F0' },
  expandedContent: { backgroundColor: '#F8FAFC', padding: '14px', borderTop: '1px solid #E2E8F0' },
  timelineTitle: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '800', color: '#0F766E', marginBottom: '12px' },
  verticalTimeline: { display: 'flex', flexDirection: 'column', marginBottom: '14px' },
  timelineItem: { display: 'flex', gap: '12px', position: 'relative' },
  stepperCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '24px' },
  circleActive: { width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#0F766E', color: '#FFFFFF', fontSize: '10px', fontWeight: '800', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  circleInactive: { width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#CBD5E1', color: '#475569', fontSize: '10px', fontWeight: '800', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  lineActive: { width: '2px', height: '32px', backgroundColor: '#0F766E', margin: '2px 0' },
  lineInactive: { width: '2px', height: '32px', backgroundColor: '#E2E8F0', margin: '2px 0' },
  stepTextContent: { flex: 1, paddingBottom: '14px' },
  stepTitleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' },
  stepTitleDone: { fontSize: '12px', fontWeight: '800', color: '#0F172A' },
  stepTitlePending: { fontSize: '12px', fontWeight: '600', color: '#94A3B8' },
  stepTimeTag: { fontSize: '9px', color: '#64748B', fontWeight: '700' },
  stepSubtitle: { fontSize: '10px', color: '#64748B', lineHeight: '1.3' },
  reportInfoBox: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '12px' },
  infoBoxHeading: { fontSize: '11px', fontWeight: '800', color: '#0F172A', margin: '0 0 6px 0' },
  descText: { fontSize: '11px', color: '#475569', margin: '0 0 8px 0', lineHeight: '1.4' },
  infoMetaRow: { display: 'flex', justifyContent: 'space-between', fontSize: '10px', borderTop: '1px solid #F1F5F9', paddingTop: '8px', marginBottom: '8px' },
  metaLabel: { color: '#64748B', display: 'block' },
  metaVal: { fontWeight: '800', color: '#0F172A' },
  metaValTeal: { fontWeight: '800', color: '#0F766E' },
  photoIndicator: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#0F766E', fontWeight: '700', backgroundColor: '#F0FDF4', padding: '6px', borderRadius: '6px' }
};
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function ReportTrackerScreen({ onBack }) {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    const localDeviceId = localStorage.getItem('agap_device_id') || '';
    setDeviceId(localDeviceId);
    fetchUserSubmittedReports(localDeviceId);
  }, []);

  const fetchUserSubmittedReports = async (targetDeviceId) => {
    setIsLoading(true);
    try {
      let query = supabase.from('reports').select('*').order('created_at', { ascending: false });

      if (targetDeviceId) {
        query = query.eq('device_id', targetDeviceId);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (data) setReports(data);
    } catch (err) {
      console.error('Tracker fetch error:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Maps database status string to 4 vertical progress steps
  const getProgressSteps = (status) => {
    const s = (status || 'PENDING').toUpperCase();

    return [
      {
        stepNo: 1,
        title: 'Report Logged',
        subtitle: 'Submission received & geo-tagged via AGAP Mobile',
        completed: true
      },
      {
        stepNo: 2,
        title: 'Barangay & CDRRMO Triage',
        subtitle: 'LGU desk validated report location and details',
        completed: s === 'APPROVED' || s === 'DISPATCHED' || s === 'RESOLVED'
      },
      {
        stepNo: 3,
        title: 'Response Unit Dispatched',
        subtitle: 'Emergency team deployed to location',
        completed: s === 'DISPATCHED' || s === 'RESOLVED'
      },
      {
        stepNo: 4,
        title: 'Hazard Resolved & Cleared',
        subtitle: 'On-site clearing completed by LGU crew',
        completed: s === 'RESOLVED'
      }
    ];
  };

  return (
    <div style={styles.container}>
      <div style={styles.navHeader}>
        <button style={styles.backBtn} onClick={onBack}>
          &lt; Back
        </button>
        <div>
          <h2 style={styles.headerTitle}>My Report Tracker</h2>
          <div style={styles.headerSub}>Live Database Dispatch Progress</div>
        </div>
      </div>

      <div style={styles.refreshBar}>
        <span style={styles.deviceText}>Device ID: {deviceId || 'Detecting...'}</span>
        <button style={styles.refreshBtn} onClick={() => fetchUserSubmittedReports(deviceId)}>
          Refresh Status
        </button>
      </div>

      {isLoading ? (
        <div style={styles.emptyCard}>Fetching live report timeline from database...</div>
      ) : reports.length === 0 ? (
        <div style={styles.emptyCard}>
          No reports found for this device. Submit a hazard report to track its live progress here.
        </div>
      ) : (
        reports.map((rep) => {
          const steps = getProgressSteps(rep.status);

          return (
            <div key={rep.id || rep.created_at || rep.ticket_no || rep.location} style={styles.trackerCard}>
              <div style={styles.cardHeader}>
                <span style={styles.ticketBadge}>{rep.ticket_no || rep.id || '#AGAP-REPORT'}</span>
                <span style={styles.statusPill}>{rep.status || 'PENDING'}</span>
              </div>

              <h3 style={styles.hazardTitle}>{rep.hazard_type || rep.category}</h3>
              <div style={styles.metaText}>Location: {rep.location}</div>
              <div style={styles.metaText}>Submitted: {rep.created_at ? new Date(rep.created_at).toLocaleString() : 'Recently'}</div>

              {/* Shopee-style Vertical Logistics Timeline */}
              <div style={styles.verticalTimeline}>
                {steps.map((step, idx) => (
                  <div key={step.stepNo} style={styles.timelineItem}>
                    <div style={styles.lineCol}>
                      <div style={step.completed ? styles.dotCompleted : styles.dotPending}>
                        {step.completed ? '✓' : step.stepNo}
                      </div>
                      {idx < steps.length - 1 && (
                        <div style={step.completed ? styles.lineCompleted : styles.linePending}></div>
                      )}
                    </div>

                    <div style={styles.contentCol}>
                      <div style={step.completed ? styles.stepTitleCompleted : styles.stepTitlePending}>
                        {step.title}
                      </div>
                      <div style={styles.stepSubtitle}>{step.subtitle}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '440px', margin: '0 auto', padding: '16px', fontFamily: "'Inter', sans-serif" },
  navHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' },
  backBtn: { backgroundColor: 'transparent', border: 'none', color: '#0F766E', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  headerTitle: { fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 },
  headerSub: { fontSize: '11px', color: '#64748B' },
  refreshBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', padding: '8px 10px', borderRadius: '8px', marginBottom: '12px' },
  deviceText: { fontSize: '10px', fontWeight: '700', color: '#475569' },
  refreshBtn: { backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  emptyCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', padding: '16px', borderRadius: '8px', textAlign: 'center', color: '#64748B', fontSize: '11px' },
  trackerCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '14px', marginBottom: '12px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  ticketBadge: { fontSize: '10px', fontWeight: '800', backgroundColor: '#CCFBF1', color: '#0F766E', padding: '2px 6px', borderRadius: '4px' },
  statusPill: { fontSize: '10px', fontWeight: '800', backgroundColor: '#DCFCE7', color: '#166534', padding: '2px 6px', borderRadius: '4px' },
  hazardTitle: { fontSize: '14px', fontWeight: '800', color: '#0F172A', margin: '2px 0 4px 0' },
  metaText: { fontSize: '10px', color: '#64748B', marginBottom: '2px' },
  verticalTimeline: { marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #F1F5F9' },
  timelineItem: { display: 'flex', gap: '12px', marginBottom: '12px' },
  lineCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '24px' },
  dotCompleted: { width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#0F766E', color: '#FFFFFF', fontSize: '10px', fontWeight: '800', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  dotPending: { width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#E2E8F0', color: '#64748B', fontSize: '10px', fontWeight: '800', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  lineCompleted: { width: '2px', height: '100%', backgroundColor: '#0F766E', marginTop: '4px' },
  linePending: { width: '2px', height: '100%', backgroundColor: '#E2E8F0', marginTop: '4px' },
  contentCol: { flex: 1 },
  stepTitleCompleted: { fontSize: '12px', fontWeight: '800', color: '#0F172A' },
  stepTitlePending: { fontSize: '12px', fontWeight: '600', color: '#94A3B8' },
  stepSubtitle: { fontSize: '10px', color: '#64748B', marginTop: '2px', lineHeight: '1.3' }
};
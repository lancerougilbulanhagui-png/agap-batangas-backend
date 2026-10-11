import React, { useState } from 'react';

/**
 * Project AGAP Batangas - User Profile & Residency Verification Screen
 */
export default function ProfileScreen({ onBack, userRole = 'CITIZEN' }) {
  const [isCitizenMode, setIsCitizenMode] = useState(userRole !== 'GUEST');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedBarangay, setSelectedBarangay] = useState('Brgy. Alangilan');

  const citizenData = {
    fullName: 'Juan De La Cruz',
    birthdate: 'October 24, 2002',
    points: 150,
    residentId: 'BAT-2026-88912',
    barangay: 'Brgy. Alangilan, Batangas City',
    registeredSector: 'BSU Alangilan Campus Sector',
    phone: '+63 917 123 4567',
    emergencyContact: 'Maria De La Cruz (Mother)'
  };

  return (
    <div style={styles.container}>
      {/* Clean Navigation Header (No Rectangular Dark Banner) */}
      <div style={styles.navHeader}>
        <button style={styles.backBtn} onClick={onBack}>
          &lt; Back
        </button>
        <div>
          <h2 style={styles.headerTitle}>User Profile</h2>
          <div style={styles.headerSub}>Batangas Resident & Citizen Account</div>
        </div>
      </div>

      {/* Mode Switcher Banner for Demo */}
      <div style={styles.toggleCard}>
        <div style={styles.toggleLabel}>SIMULATE ACCOUNT ROLE (DEMO):</div>
        <div style={styles.toggleGroup}>
          <button
            style={isCitizenMode ? styles.btnActiveCitizen : styles.btnInactive}
            onClick={() => setIsCitizenMode(true)}
          >
            Verified Citizen
          </button>
          <button
            style={!isCitizenMode ? styles.btnActiveGuest : styles.btnInactive}
            onClick={() => setIsCitizenMode(false)}
          >
            Guest Visitor
          </button>
        </div>
      </div>

      {/* Citizen Profile View */}
      {isCitizenMode ? (
        <div style={styles.profileBody}>
          <div style={styles.citizenIdCard}>
            <div style={styles.idHeaderRow}>
              <span style={styles.badgeGreen}>✓ VERIFIED BATANGAS RESIDENT</span>
              <span style={styles.idNo}>{citizenData.residentId}</span>
            </div>

            <div style={styles.userRow}>
              <div style={styles.avatarBox}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0F766E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div>
                <h3 style={styles.userName}>{citizenData.fullName}</h3>
                <div style={styles.userLoc}>📍 {citizenData.barangay}</div>
              </div>
            </div>

            {/* Birthdate & Safety Points Grid */}
            <div style={styles.statsGrid}>
              <div style={styles.statBox}>
                <span style={styles.statValTeal}>{citizenData.points} PTS</span>
                <span style={styles.statLabel}>Community Safety Points</span>
              </div>
              <div style={styles.statBox}>
                <span style={styles.statValDark}>{citizenData.birthdate}</span>
                <span style={styles.statLabel}>Date of Birth</span>
              </div>
            </div>
          </div>

          <div style={styles.infoBox}>
            <h4 style={styles.infoTitle}>Registered Citizen Metadata</h4>
            <div style={styles.infoRow}>
              <span style={styles.infoKey}>Mobile Number:</span>
              <span style={styles.infoVal}>{citizenData.phone}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoKey}>Barangay Sector:</span>
              <span style={styles.infoVal}>{citizenData.registeredSector}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoKey}>Emergency Contact:</span>
              <span style={styles.infoVal}>{citizenData.emergencyContact}</span>
            </div>
          </div>
        </div>
      ) : (
        /* Guest User View & Verification Workflow */
        <div style={styles.profileBody}>
          <div style={styles.guestBox}>
            <span style={styles.badgeOrange}>UNVERIFIED GUEST MODE</span>
            <h3 style={styles.guestTitle}>Guest Visitor Access</h3>
            <p style={styles.guestDesc}>
              Guest visitors can explore danger zone maps and emergency contact numbers. Submitting hazard reports requires SMS OTP and Barangay verification.
            </p>

            <button style={styles.verifyCtaBtn} onClick={() => setShowVerifyModal(true)}>
              Verify Batangas Residency Now
            </button>
          </div>

          <div style={styles.infoBox}>
            <h4 style={styles.infoTitle}>Guest Report Submission Process</h4>
            <div style={styles.processStep}>
              <span style={styles.stepNum}>1</span>
              <div>
                <strong>Form Submission Allowed:</strong> Guests can fill out emergency hazard details.
              </div>
            </div>
            <div style={styles.processStep}>
              <span style={styles.stepNum}>2</span>
              <div>
                <strong>SMS Pin Verification:</strong> OTP pin sent to confirm a valid mobile number.
              </div>
            </div>
            <div style={styles.processStep}>
              <span style={styles.stepNum}>3</span>
              <div>
                <strong>LGU Verification Triage:</strong> Dispatch team verifies report location before deploying responders.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {showVerifyModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Verify Batangas Residency</h3>
              <button style={styles.closeBtn} onClick={() => setShowVerifyModal(false)}>✕</button>
            </div>
            <p style={styles.modalSub}>Select your local barangay to complete verification.</p>

            <div style={styles.formGroup}>
              <label style={styles.label}>Barangay Location:</label>
              <select
                style={styles.selectInput}
                value={selectedBarangay}
                onChange={(e) => setSelectedBarangay(e.target.value)}
              >
                <option value="Brgy. Alangilan">Brgy. Alangilan (Batangas City)</option>
                <option value="Brgy. Kumintang Ibaba">Brgy. Kumintang Ibaba</option>
                <option value="Brgy. Bolbok">Brgy. Bolbok</option>
              </select>
            </div>

            <button
              style={styles.submitVerifyBtn}
              onClick={() => {
                setIsCitizenMode(true);
                setShowVerifyModal(false);
              }}
            >
              Confirm Residency & Upgrade Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '440px', margin: '0 auto', padding: '16px', fontFamily: "'Inter', sans-serif" },
  navHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
  backBtn: { backgroundColor: 'transparent', border: 'none', color: '#0F766E', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  headerTitle: { fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 },
  headerSub: { fontSize: '11px', color: '#64748B' },
  toggleCard: { backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '14px', border: '1px solid #E2E8F0', marginBottom: '16px' },
  toggleLabel: { fontSize: '10px', fontWeight: '800', color: '#64748B', marginBottom: '6px' },
  toggleGroup: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' },
  btnActiveCitizen: { backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', padding: '8px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' },
  btnActiveGuest: { backgroundColor: '#EA580C', color: '#FFFFFF', border: 'none', padding: '8px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' },
  btnInactive: { backgroundColor: '#F1F5F9', color: '#64748B', border: 'none', padding: '8px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' },
  profileBody: { display: 'flex', flexDirection: 'column', gap: '14px' },
  citizenIdCard: { backgroundColor: '#FFFFFF', border: '1px solid #CCFBF1', borderRadius: '16px', padding: '14px', boxShadow: '0 2px 8px rgba(15, 118, 110, 0.05)' },
  idHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  badgeGreen: { fontSize: '9px', fontWeight: '800', backgroundColor: '#DCFCE7', color: '#166534', padding: '3px 8px', borderRadius: '6px' },
  idNo: { fontSize: '10px', fontWeight: '800', color: '#0F766E' },
  userRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' },
  avatarBox: { width: '46px', height: '46px', borderRadius: '12px', backgroundColor: '#CCFBF1', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  userName: { fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: '0 0 2px 0' },
  userLoc: { fontSize: '11px', color: '#0F766E', fontWeight: '700' },
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '10px', borderTop: '1px solid #F1F5F9' },
  statBox: { backgroundColor: '#F8FAFC', padding: '8px 10px', borderRadius: '10px' },
  statValTeal: { fontSize: '14px', fontWeight: '800', color: '#0F766E', display: 'block' },
  statValDark: { fontSize: '11px', fontWeight: '800', color: '#0F172A', display: 'block' },
  statLabel: { fontSize: '9px', color: '#64748B', fontWeight: '700' },
  infoBox: { backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '14px' },
  infoTitle: { fontSize: '12px', fontWeight: '800', color: '#0F172A', margin: '0 0 10px 0' },
  infoRow: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '6px 0', borderBottom: '1px solid #F1F5F9' },
  infoKey: { color: '#64748B', fontWeight: '600' },
  infoVal: { color: '#0F172A', fontWeight: '800' },
  guestBox: { backgroundColor: '#FFF7ED', border: '1px solid #FFEDD5', borderRadius: '16px', padding: '14px' },
  badgeOrange: { fontSize: '9px', fontWeight: '800', backgroundColor: '#FFEDD5', color: '#C2410C', padding: '3px 8px', borderRadius: '6px', display: 'inline-block', marginBottom: '8px' },
  guestTitle: { fontSize: '15px', fontWeight: '800', color: '#9A3412', margin: '0 0 6px 0' },
  guestDesc: { fontSize: '11px', color: '#C2410C', lineHeight: '1.4', marginBottom: '12px' },
  verifyCtaBtn: { width: '100%', padding: '10px', backgroundColor: '#EA580C', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' },
  processStep: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: '#475569', marginBottom: '8px' },
  stepNum: { width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#0F766E', color: '#FFFFFF', fontSize: '10px', fontWeight: '800', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px', zIndex: 100 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '18px', maxWidth: '360px', width: '100%' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  modalTitle: { fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: 0 },
  closeBtn: { backgroundColor: '#E2E8F0', border: 'none', width: '24px', height: '24px', borderRadius: '50%', fontWeight: '800', cursor: 'pointer' },
  modalSub: { fontSize: '11px', color: '#64748B', marginBottom: '12px' },
  formGroup: { marginBottom: '12px' },
  label: { fontSize: '10px', fontWeight: '800', color: '#334155', display: 'block', marginBottom: '4px' },
  selectInput: { width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px' },
  submitVerifyBtn: { width: '100%', padding: '10px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', marginTop: '6px' }
};
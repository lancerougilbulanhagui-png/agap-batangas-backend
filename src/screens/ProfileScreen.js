import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function ProfileScreen({ onBack, onAdminLogin }) {
  const [deviceId, setDeviceId] = useState('');
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [barangay, setBarangay] = useState('Brgy. Alangilan');
  const [idProofPhoto, setIdProofPhoto] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let localDeviceId = localStorage.getItem('agap_device_id');
    if (!localDeviceId) {
      localDeviceId = 'DEV-' + Math.floor(100000 + Math.random() * 900000);
      localStorage.setItem('agap_device_id', localDeviceId);
    }
    setDeviceId(localDeviceId);
    fetchProfile(localDeviceId);
  }, []);

  const fetchProfile = async (targetDeviceId) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('device_id', targetDeviceId)
        .maybeSingle();

      if (data) setProfile(data);
    } catch (err) {
      console.log('No profile recorded for device yet.');
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setIdProofPhoto(reader.result);
    };
  };

  const handleRegisterOrLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const profileId = 'USER-' + Math.floor(100000 + Math.random() * 900000);
      const combinedName = username ? `${username} (${fullName})` : fullName;

      const payload = {
        id: profileId,
        device_id: deviceId,
        full_name: combinedName,
        phone: phone,
        barangay: barangay,
        user_role: 'GUEST',
        verification_status: 'PENDING',
        id_proof_photo: idProofPhoto
      };

      const { error } = await supabase.from('profiles').insert([payload]);
      if (error) throw error;

      alert('[SUCCESS] Profile submitted! You can now use all app functions while admin verifies your ID.');
      setProfile(payload);
    } catch (err) {
      alert(`[ERROR] Registration failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.navHeader}>
        <button style={styles.backBtn} onClick={onBack}>
          &lt; Back
        </button>
        <div>
          <h2 style={styles.headerTitle}>User Identity & Verification</h2>
          <div style={styles.headerSub}>Project AGAP Resident Registration</div>
        </div>
      </div>

      <div style={styles.deviceBox}>
        <span style={styles.deviceLabel}>ACTIVE DEVICE IDENTIFIER:</span>
        <div style={styles.deviceVal}>{deviceId || 'Loading...'}</div>
      </div>

      {profile ? (
        <div style={styles.profileCard}>
          <div style={styles.statusRow}>
            <span style={profile.verification_status === 'VERIFIED' ? styles.badgeGreen : styles.badgeYellow}>
              {profile.verification_status === 'VERIFIED' ? '✓ VERIFIED BATANGAS CITIZEN' : 'VERIFICATION PENDING ADMIN REVIEW'}
            </span>
          </div>

          <h3 style={styles.userName}>{profile.full_name}</h3>
          <div style={styles.userMeta}>Barangay: {profile.barangay}</div>
          <div style={styles.userMeta}>Phone: {profile.phone}</div>
          <div style={styles.userMeta}>Current Role: {profile.user_role}</div>

          <div style={styles.infoBanner}>
            You can fully report hazards and access emergency services while CDRRMO completes ID verification.
          </div>
        </div>
      ) : (
        <div style={styles.authCard}>
          <h3 style={styles.authTitle}>Sign Up / Citizen Verification</h3>
          <p style={styles.authSub}>Fill in your details below to request Verified Citizen status in Batangas City.</p>

          <form onSubmit={handleRegisterOrLogin} style={styles.formStack}>
            <div>
              <label style={styles.inputLabel}>CHOOSE USERNAME</label>
              <input
                type="text"
                style={styles.textInput}
                placeholder="e.g. BatangasResident01"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={styles.inputLabel}>FULL LEGAL NAME</label>
              <input
                type="text"
                style={styles.textInput}
                placeholder="Enter complete legal name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={styles.inputLabel}>MOBILE PHONE NUMBER</label>
              <input
                type="text"
                style={styles.textInput}
                placeholder="+63 917 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={styles.inputLabel}>BARANGAY RESIDENCY</label>
              <select
                style={styles.selectInput}
                value={barangay}
                onChange={(e) => setBarangay(e.target.value)}
              >
                <option value="Brgy. Alangilan">Brgy. Alangilan</option>
                <option value="Brgy. Kumintang Ibaba">Brgy. Kumintang Ibaba</option>
                <option value="Brgy. Bolbok">Brgy. Bolbok</option>
                <option value="Brgy. Gulod Labac">Brgy. Gulod Labac</option>
              </select>
            </div>

            <div>
              <label style={styles.inputLabel}>ATTACH VALID ID / PROOF OF RESIDENCY</label>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} style={styles.fileInput} required />
              {idProofPhoto && <div style={styles.photoAttachedTag}>✓ ID Photo Attached</div>}
            </div>

            <button type="submit" style={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? 'Transmitting...' : 'Submit & Start Using AGAP'}
            </button>
          </form>
        </div>
      )}

      {/* Admin Command Portal Access */}
      <div style={styles.adminAccessBox}>
        <span style={styles.adminLabel}>CDRRMO OFFICIAL ACCESS</span>
        <button style={styles.adminPortalBtn} onClick={onAdminLogin}>
          Open Admin Command Center
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '440px', margin: '0 auto', padding: '16px', fontFamily: "'Inter', sans-serif" },
  navHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' },
  backBtn: { backgroundColor: 'transparent', border: 'none', color: '#0F766E', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  headerTitle: { fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 },
  headerSub: { fontSize: '11px', color: '#64748B' },
  deviceBox: { backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '10px', marginBottom: '14px' },
  deviceLabel: { fontSize: '9px', fontWeight: '800', color: '#64748B', display: 'block' },
  deviceVal: { fontSize: '12px', fontWeight: '800', color: '#0F766E', marginTop: '2px' },
  profileCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '16px' },
  statusRow: { marginBottom: '10px' },
  badgeGreen: { fontSize: '10px', fontWeight: '800', backgroundColor: '#DCFCE7', color: '#166534', padding: '4px 8px', borderRadius: '6px' },
  badgeYellow: { fontSize: '10px', fontWeight: '800', backgroundColor: '#FEF3C7', color: '#92400E', padding: '4px 8px', borderRadius: '6px' },
  userName: { fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: '0 0 6px 0' },
  userMeta: { fontSize: '12px', color: '#475569', marginBottom: '4px' },
  infoBanner: { marginTop: '12px', backgroundColor: '#F0FDF4', border: '1px solid #A7F3D0', padding: '8px', borderRadius: '6px', fontSize: '11px', color: '#065F46', lineHeight: '1.4' },
  authCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '16px' },
  authTitle: { fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: '0 0 4px 0' },
  authSub: { fontSize: '11px', color: '#64748B', marginBottom: '12px', lineHeight: '1.4' },
  formStack: { display: 'flex', flexDirection: 'column', gap: '10px' },
  inputLabel: { fontSize: '10px', fontWeight: '800', color: '#64748B', display: 'block', marginBottom: '4px' },
  textInput: { width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box' },
  selectInput: { width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px' },
  fileInput: { fontSize: '11px' },
  photoAttachedTag: { fontSize: '10px', fontWeight: '800', color: '#15803D', marginTop: '4px' },
  submitBtn: { width: '100%', padding: '11px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', marginTop: '6px' },
  adminAccessBox: { marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #E2E8F0', textAlign: 'center' },
  adminLabel: { fontSize: '9px', fontWeight: '800', color: '#94A3B8', display: 'block', marginBottom: '6px', letterSpacing: '0.6px' },
  adminPortalBtn: { backgroundColor: '#1E293B', color: '#FFFFFF', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }
};
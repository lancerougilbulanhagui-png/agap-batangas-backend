import React, { useState } from 'react';

/**
 * Project AGAP Batangas - Emergency Hazard Submission Form
 */
export default function ReportSubmitScreen({ onBack, onSubmitSuccess, onSubmitReport, userRole = 'CITIZEN' }) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [severityLevel, setSeverityLevel] = useState('');
  const [locationName, setLocationName] = useState('');
  const [description, setDescription] = useState('');
  const [attachedPhotos, setAttachedPhotos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { id: 'FLOODING', label: 'River / Flash Flood', color: '#0369A1' },
    { id: 'ELECTRICAL', label: 'Fallen Wire / Spark', color: '#D97706' },
    { id: 'OBSTRUCTION', label: 'Road Obstruction', color: '#15803D' },
    { id: 'FIRE', label: 'Fire / Explosion', color: '#DC2626' },
    { id: 'MEDICAL', label: 'Medical Emergency', color: '#B91C1C' }
  ];

  const handleAddPhoto = () => {
    const photoNumber = attachedPhotos.length + 1;
    const newPhotoName = `hazard_verification_photo_0${photoNumber}.jpg`;
    setAttachedPhotos([...attachedPhotos, newPhotoName]);
  };

  const handleRemovePhoto = (indexToRemove) => {
    setAttachedPhotos(attachedPhotos.filter((_, idx) => idx !== indexToRemove));
  };

  const handleUseGpsLocation = () => {
    setLocationName('Brgy. Alangilan, Batangas City (Near CICS Building - 13.7850° N, 121.0740° E)');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedCategory) {
      alert('⚠️ Please select a Hazard Type before submitting.');
      return;
    }
    if (!severityLevel) {
      alert('⚠️ Please select a Severity Urgency Level before submitting.');
      return;
    }
    if (!locationName.trim()) {
      alert('⚠️ Please provide the Location Details or tap Auto-GPS Tag.');
      return;
    }
    if (!description.trim()) {
      alert('⚠️ Please provide Hazard Details & Remarks.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      
      const randomTicketNum = Math.floor(100 + Math.random() * 900);
      const newReportId = `BAT-0${randomTicketNum}`;

      const newReportObj = {
        id: newReportId,
        senderName: userRole === 'CITIZEN' ? 'Juan De La Cruz' : 'Guest Visitor',
        userRole: userRole,
        userPhone: userRole === 'CITIZEN' ? '+63 917 123 4567' : '+63 918 999 8811',
        isOtpVerified: true,
        deviceId: userRole === 'CITIZEN' ? 'Device-Citizen-01' : 'Guest-Device#8821',
        deviceReportCount: '1 / 3',
        category: selectedCategory,
        severity: severityLevel.includes('RISK') ? severityLevel : `${severityLevel} RISK`,
        title: `${selectedCategory} Hazard Alert`,
        location: locationName,
        coordinates: '13.7850, 121.0740',
        submittedAt: 'Just now',
        status: 'PENDING',
        details: description,
        photos: attachedPhotos.length > 0 
          ? attachedPhotos.map((p, i) => `INCIDENT PHOTO ${i + 1}: ${p}`)
          : ['INCIDENT PHOTO: Attached Evidence Photo']
      };

      if (typeof onSubmitReport === 'function') {
        onSubmitReport(newReportObj);
      }

      alert(`✓ Emergency Hazard Report Successfully Submitted!\nTicket Reference: #${newReportId}\nDirectly Updated in Admin Database!`);

      if (typeof onSubmitSuccess === 'function') {
        onSubmitSuccess();
      }
    }, 1000);
  };

  return (
    <div style={styles.container}>
      {/* Navigation Header */}
      <div style={styles.navHeader}>
        <button style={styles.backBtn} onClick={onBack}>
          &lt; Back
        </button>
        <div>
          <h2 style={styles.headerTitle}>Submit Hazard Report</h2>
          <div style={styles.headerSub}>Fast Direct Emergency Alert Form</div>
        </div>
      </div>

      {userRole === 'GUEST' && (
        <div style={styles.guestNotice}>
          ⚠️ <strong>Guest Mode:</strong> Your report will undergo automated phone verification before LGU unit dispatch.
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.formCard}>
        {/* Step 1: Hazard Type */}
        <div style={styles.formSection}>
          <label style={styles.sectionLabel}>1. SELECT HAZARD TYPE *</label>
          <div style={styles.categoryGrid}>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  style={isSelected ? { ...styles.catBtnActive, borderColor: cat.color } : styles.catBtnInactive}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <span style={{ ...styles.catDot, backgroundColor: isSelected ? cat.color : '#94A3B8' }}></span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Severity Level */}
        <div style={styles.formSection}>
          <label style={styles.sectionLabel}>2. SEVERITY URGENCY LEVEL *</label>
          <div style={styles.severityBar}>
            {[
              { id: 'LOW', label: 'Low', color: '#10B981' },
              { id: 'MODERATE', label: 'Moderate', color: '#F59E0B' },
              { id: 'SEVERE', label: 'Severe', color: '#EA580C' },
              { id: 'CRITICAL', label: 'Critical / Crisis', color: '#DC2626' }
            ].map((sev) => {
              const isSelected = severityLevel === sev.id;
              return (
                <button
                  key={sev.id}
                  type="button"
                  style={isSelected ? { ...styles.sevActive, backgroundColor: sev.color } : styles.sevInactive}
                  onClick={() => setSeverityLevel(sev.id)}
                >
                  {sev.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Location Details */}
        <div style={styles.formSection}>
          <div style={styles.labelRow}>
            <label style={styles.sectionLabel}>3. LOCATION DETAILS *</label>
            <button type="button" style={styles.gpsBadgeBtn} onClick={handleUseGpsLocation}>
              📍 Auto-GPS Tag
            </button>
          </div>
          <input
            type="text"
            style={styles.textInput}
            placeholder="e.g., Brgy. Alangilan, near university access road gate..."
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            required
          />
          <div style={styles.coordSubText}>Provide exact barangay, landmark, or tap Auto-GPS Tag.</div>
        </div>

        {/* Step 4: Attach Photos */}
        <div style={styles.formSection}>
          <div style={styles.labelRow}>
            <label style={styles.sectionLabel}>4. ATTACH VERIFICATION PHOTOS ({attachedPhotos.length})</label>
            <span style={styles.multiTag}>Multi-Photo Verification Supported</span>
          </div>

          <div style={styles.photoDropzone} onClick={handleAddPhoto}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <div style={styles.photoDropText}>
              + Tap to Capture / Upload Verification Photo
            </div>
            <div style={styles.photoDropSub}>You can attach multiple photos for verification</div>
          </div>

          {attachedPhotos.length > 0 && (
            <div style={styles.attachedGallery}>
              <div style={styles.galleryHeader}>Attached Photos for Verification ({attachedPhotos.length}):</div>
              {attachedPhotos.map((photoName, idx) => (
                <div key={idx} style={styles.photoItemRow}>
                  <div style={styles.photoItemName}>
                    <span style={styles.photoIndexTag}>#{idx + 1}</span>
                    <span>📷 {photoName}</span>
                  </div>
                  <button
                    type="button"
                    style={styles.removePhotoBtn}
                    onClick={() => handleRemovePhoto(idx)}
                  >
                    ✕ Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 5: Remarks */}
        <div style={styles.formSection}>
          <label style={styles.sectionLabel}>5. HAZARD DETAILS & REMARKS *</label>
          <textarea
            style={styles.textArea}
            rows="3"
            placeholder="Describe current situation, road blockage, or injured persons needing rescue..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          ></textarea>
        </div>

        <button
          type="submit"
          style={isSubmitting ? styles.submitBtnDisabled : styles.submitBtn}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Transmitting Alert...' : '🚀 Submit Report to LGU Command Center'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: { maxWidth: '440px', margin: '0 auto', padding: '16px', fontFamily: "'Inter', sans-serif" },
  navHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
  backBtn: { backgroundColor: 'transparent', border: 'none', color: '#0F766E', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  headerTitle: { fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 },
  headerSub: { fontSize: '11px', color: '#64748B' },
  guestNotice: { backgroundColor: '#FFF7ED', border: '1px solid #FFEDD5', color: '#C2410C', padding: '12px', borderRadius: '12px', fontSize: '11px', marginBottom: '16px', lineHeight: '1.4' },
  formCard: { backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' },
  formSection: { marginBottom: '18px' },
  sectionLabel: { fontSize: '10px', fontWeight: '800', color: '#64748B', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' },
  categoryGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  catBtnActive: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: '#F0FDF4', border: '2px solid #0F766E', borderRadius: '10px', fontSize: '11px', fontWeight: '800', color: '#0F172A', cursor: 'pointer' },
  catBtnInactive: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '11px', fontWeight: '600', color: '#475569', cursor: 'pointer' },
  catDot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  severityBar: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px' },
  sevActive: { padding: '10px 4px', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', textAlign: 'center' },
  sevInactive: { padding: '10px 4px', backgroundColor: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: '8px', fontSize: '10px', fontWeight: '600', cursor: 'pointer', textAlign: 'center' },
  labelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  gpsBadgeBtn: { fontSize: '9px', fontWeight: '800', color: '#0F766E', backgroundColor: '#CCFBF1', border: '1px solid #99F6E4', padding: '3px 8px', borderRadius: '6px', cursor: 'pointer' },
  multiTag: { fontSize: '9px', fontWeight: '800', color: '#0369A1', backgroundColor: '#E0F2FE', padding: '2px 6px', borderRadius: '4px' },
  textInput: { width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', outline: 'none', boxSizing: 'border-box' },
  coordSubText: { fontSize: '10px', color: '#94A3B8', marginTop: '4px' },
  photoDropzone: { border: '2px dashed #0F766E', backgroundColor: '#F0FDF4', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer', textAlign: 'center' },
  photoDropText: { fontSize: '12px', fontWeight: '800', color: '#0F766E' },
  photoDropSub: { fontSize: '10px', color: '#64748B' },
  attachedGallery: { marginTop: '10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px' },
  galleryHeader: { fontSize: '10px', fontWeight: '800', color: '#334155', marginBottom: '8px' },
  photoItemRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', padding: '8px 10px', borderRadius: '6px', marginBottom: '6px', fontSize: '11px' },
  photoItemName: { display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', color: '#0F172A' },
  photoIndexTag: { fontSize: '9px', fontWeight: '800', backgroundColor: '#E0F2FE', color: '#0369A1', padding: '1px 5px', borderRadius: '4px' },
  removePhotoBtn: { backgroundColor: '#FEE2E2', color: '#991B1B', border: 'none', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  textArea: { width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  submitBtn: { width: '100%', padding: '14px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', marginTop: '10px' },
  submitBtnDisabled: { width: '100%', padding: '14px', backgroundColor: '#94A3B8', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'not-allowed', marginTop: '10px' }
};
import React, { useState } from 'react';

export default function ReportSubmitScreen({ onBack, onSubmitSuccess, userRole = 'CITIZEN' }) {
  const [selectedCategory, setSelectedCategory] = useState('FLOODING');
  const [severityLevel, setSeverityLevel] = useState('SEVERE');

  // Location and GPS state
  const [locationName, setLocationName] = useState('Brgy. Alangilan, Batangas City');
  const [latitude, setLatitude] = useState(13.7850);
  const [longitude, setLongitude] = useState(121.0740);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const [description, setDescription] = useState('');
  const [photoAttached, setPhotoAttached] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { id: 'FLOODING', label: 'River / Flash Flood', color: '#0369A1' },
    { id: 'ELECTRICAL', label: 'Fallen Wire / Spark', color: '#D97706' },
    { id: 'OBSTRUCTION', label: 'Road Obstruction', color: '#15803D' },
    { id: 'FIRE', label: 'Fire / Explosion', color: '#DC2626' },
    { id: 'MEDICAL', label: 'Medical Emergency', color: '#B91C1C' }
  ];

  // 1. Fetch user's device GPS coordinates as a starting point
  const handleGetDeviceLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(4));
        const lng = parseFloat(position.coords.longitude.toFixed(4));
        setLatitude(lat);
        setLongitude(lng);
        setLocationName(`Near ${lat}° N, ${lng}° E (Batangas City Sector)`);
        setIsGpsLoading(false);
        setShowMapPicker(true);
      },
      () => {
        setIsGpsLoading(false);
        alert('Could not fetch exact GPS location. Please check location permissions.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePhotoUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setPhotoAttached(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      alert('Emergency Hazard Report Successfully Submitted!\nTicket Reference: #AGAP-2026-0812');
      if (typeof onSubmitSuccess === 'function') {
        onSubmitSuccess();
      }
    }, 1000);
  };

  const mapEmbedUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&t=m&z=16&ie=UTF8&iwloc=&output=embed`;

  return (
    <div style={styles.container}>
      <div style={styles.navHeader}>
        <button style={styles.backBtn} onClick={onBack}>
          &lt; Back
        </button>
        <div>
          <h2 style={styles.headerTitle}>Submit Hazard Report</h2>
          <div style={styles.headerSub}>Fast Direct Alert Form</div>
        </div>
      </div>

      {userRole === 'GUEST' && (
        <div style={styles.guestNotice}>
          Notice: Guest Mode report will undergo automated verification before dispatch.
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.formCard}>
        {/* Step 1: Category */}
        <div style={styles.formSection}>
          <label style={styles.sectionLabel}>1. SELECT HAZARD TYPE</label>
          <div style={styles.categoryGrid}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                style={selectedCategory === cat.id ? { ...styles.catBtnActive, borderColor: cat.color } : styles.catBtnInactive}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span style={{ ...styles.catDot, backgroundColor: cat.color }}></span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Severity */}
        <div style={styles.formSection}>
          <label style={styles.sectionLabel}>2. SEVERITY URGENCY LEVEL</label>
          <div style={styles.severityBar}>
            {[
              { id: 'LOW', label: 'Low', color: '#10B981' },
              { id: 'MODERATE', label: 'Moderate', color: '#F59E0B' },
              { id: 'SEVERE', label: 'Severe', color: '#EA580C' },
              { id: 'CRITICAL', label: 'Critical / Crisis', color: '#DC2626' }
            ].map((sev) => (
              <button
                key={sev.id}
                type="button"
                style={severityLevel === sev.id ? { ...styles.sevActive, backgroundColor: sev.color } : styles.sevInactive}
                onClick={() => setSeverityLevel(sev.id)}
              >
                {sev.label}
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Location Details & Adjustable Pin */}
        <div style={styles.formSection}>
          <div style={styles.labelRow}>
            <label style={styles.sectionLabel}>3. EXACT HAZARD LOCATION</label>
            <button
              type="button"
              style={styles.gpsTriggerBtn}
              onClick={handleGetDeviceLocation}
              disabled={isGpsLoading}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F766E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span>{isGpsLoading ? 'Detecting GPS...' : 'Locate My Position'}</span>
            </button>
          </div>

          <input
            type="text"
            style={styles.textInput}
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="Type landmark, barangay, or specific street address..."
            required
          />

          <div style={styles.coordSubText}>
            Pinned Coordinates: {latitude}° N, {longitude}° E
          </div>

          {/* Map Location Preview & Fine-Tuning */}
          <div style={styles.mapPinBox}>
            <div style={styles.mapPinHeader}>
              <span style={styles.mapPinTitle}>Adjust Hazard Location Pin</span>
              <button
                type="button"
                style={styles.mapToggleBtn}
                onClick={() => setShowMapPicker(!showMapPicker)}
              >
                {showMapPicker ? 'Hide Map' : 'Show Map'}
              </button>
            </div>

            {showMapPicker && (
              <div style={styles.mapPickerContainer}>
                <iframe
                  title="Hazard Location Map"
                  width="100%"
                  height="160"
                  frameBorder="0"
                  scrolling="no"
                  src={mapEmbedUrl}
                  style={styles.mapIframe}
                ></iframe>
                <div style={styles.mapInstructionText}>
                  Note: If the hazard is located further down the road, adjust the coordinates or address above to pinpoint the exact spot.
                </div>
                <div style={styles.coordAdjustRow}>
                  <div style={{ flex: 1 }}>
                    <label style={styles.microLabel}>LATITUDE</label>
                    <input
                      type="number"
                      step="0.0001"
                      style={styles.coordInput}
                      value={latitude}
                      onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={styles.microLabel}>LONGITUDE</label>
                    <input
                      type="number"
                      step="0.0001"
                      style={styles.coordInput}
                      value={longitude}
                      onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 4: Photo Evidence */}
        <div style={styles.formSection}>
          <label style={styles.sectionLabel}>4. ATTACH PHOTO EVIDENCE</label>
          <label style={styles.photoDropzone}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <div style={styles.photoDropText}>
              {photoAttached ? 'Photo Evidence Attached' : 'Tap to Upload Photo Evidence'}
            </div>
            <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
          </label>
        </div>

        {/* Step 5: Remarks */}
        <div style={styles.formSection}>
          <label style={styles.sectionLabel}>5. HAZARD DETAILS & REMARKS</label>
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
          {isSubmitting ? 'Transmitting Alert...' : 'Submit Report to LGU Command Center'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: { maxWidth: '440px', margin: '0 auto', padding: '16px', fontFamily: "'Inter', sans-serif" },
  navHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' },
  backBtn: { backgroundColor: 'transparent', border: 'none', color: '#0F766E', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  headerTitle: { fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 },
  headerSub: { fontSize: '11px', color: '#64748B' },
  guestNotice: { backgroundColor: '#FFF7ED', border: '1px solid #FFEDD5', color: '#C2410C', padding: '10px 12px', borderRadius: '10px', fontSize: '11px', marginBottom: '14px', lineHeight: '1.4' },
  formCard: { backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' },
  formSection: { marginBottom: '16px' },
  sectionLabel: { fontSize: '10px', fontWeight: '800', color: '#64748B', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' },
  categoryGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  catBtnActive: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', backgroundColor: '#F0FDF4', border: '2px solid #0F766E', borderRadius: '10px', fontSize: '11px', fontWeight: '800', color: '#0F172A', cursor: 'pointer' },
  catBtnInactive: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '11px', fontWeight: '600', color: '#475569', cursor: 'pointer' },
  catDot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  severityBar: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px' },
  sevActive: { padding: '8px 4px', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', textAlign: 'center' },
  sevInactive: { padding: '8px 4px', backgroundColor: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: '8px', fontSize: '10px', fontWeight: '600', cursor: 'pointer', textAlign: 'center' },
  labelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  gpsTriggerBtn: { display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#CCFBF1', border: '1px solid #99F6E4', color: '#0F766E', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  textInput: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', outline: 'none', boxSizing: 'border-box' },
  coordSubText: { fontSize: '10px', color: '#64748B', marginTop: '4px', fontWeight: '600' },
  mapPinBox: { marginTop: '8px', backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '8px' },
  mapPinHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  mapPinTitle: { fontSize: '10px', fontWeight: '800', color: '#334155' },
  mapToggleBtn: { backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: '700', cursor: 'pointer' },
  mapPickerContainer: { marginTop: '8px' },
  mapIframe: { borderRadius: '6px', border: '1px solid #CBD5E1', display: 'block' },
  mapInstructionText: { fontSize: '9px', color: '#64748B', marginTop: '4px', lineHeight: '1.3' },
  coordAdjustRow: { display: 'flex', gap: '8px', marginTop: '6px' },
  microLabel: { fontSize: '8px', fontWeight: '800', color: '#64748B', display: 'block', marginBottom: '2px' },
  coordInput: { width: '100%', padding: '4px 6px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '10px', boxSizing: 'border-box' },
  photoDropzone: { border: '2px dashed #0F766E', backgroundColor: '#F0FDF4', padding: '14px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' },
  photoDropText: { fontSize: '11px', fontWeight: '800', color: '#0F766E' },
  textArea: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  submitBtn: { width: '100%', padding: '12px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', marginTop: '8px' },
  submitBtnDisabled: { width: '100%', padding: '12px', backgroundColor: '#94A3B8', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'not-allowed', marginTop: '8px' }
};
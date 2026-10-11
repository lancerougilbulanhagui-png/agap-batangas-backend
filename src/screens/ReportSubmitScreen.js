import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function ReportSubmitScreen({ onBack, onSubmitSuccess, userRole = 'CITIZEN' }) {
  const [reportType, setReportType] = useState('');
  const [severityLevel, setSeverityLevel] = useState(''); // Empty by default
  const [locationName, setLocationName] = useState(''); // Empty by default
  const [coordinates, setCoordinates] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState([]); // Base64 strings
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 📍 HTML5 Live GPS Location Fetcher
  const handleGetGpsLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(4);
        const lng = position.coords.longitude.toFixed(4);
        const coordString = `${lat}° N, ${lng}° E`;
        setCoordinates(coordString);
        setLocationName(`Batangas City Sector (GPS: ${coordString})`);
        setIsGettingGps(false);
      },
      (error) => {
        console.error('GPS Error:', error);
        alert('Could not fetch GPS position. Please type your location manually.');
        setIsGettingGps(false);
      }
    );
  };

  // 📷 Convert Attached Files to Base64 for Live Photo Rendering
  const handlePhotoUpload = (event) => {
    const files = Array.from(event.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedPhotos((prev) => [...prev, { name: file.name, dataUrl: reader.result }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (indexToRemove) => {
    setSelectedPhotos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!severityLevel) {
      setErrorMessage('Please select a severity urgency level.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const photoDataArray = selectedPhotos.map((p) => p.dataUrl);

      const payload = {
        id: 'AGAP-' + Math.floor(100000 + Math.random() * 900000),
        sender_name: userRole === 'GUEST' ? 'Guest Submitter' : 'Verified Resident',
        user_role: userRole,
        category: reportType || 'GENERAL_HAZARD',
        report_type: reportType || 'General Hazard',
        severity: severityLevel,
        title: reportType || 'Emergency Hazard Report',
        location: locationName || 'Batangas City',
        coordinates: coordinates || '13.7850° N, 121.0740° E',
        details: description,
        description: description,
        photos: photoDataArray,
        status: 'PENDING',
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('reports').insert([payload]);
      if (error) throw error;

      alert('✓ Report successfully submitted to Command Center!');
      if (typeof onSubmitSuccess === 'function') onSubmitSuccess();
    } catch (err) {
      setErrorMessage(err.message || 'Error saving report.');
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
          <h2 style={styles.headerTitle}>Submit Hazard Report</h2>
          <div style={styles.headerSub}>Project AGAP Direct Alert Form</div>
        </div>
      </div>

      {errorMessage && <div style={styles.errorBox}>⚠️ {errorMessage}</div>}

      <form onSubmit={handleSubmit} style={styles.formCard}>
        {/* Step 1: Report Type */}
        <div style={styles.formSection}>
          <label style={styles.sectionLabel}>1. SPECIFY HAZARD / REPORT TYPE</label>
          <input
            type="text"
            style={styles.textInput}
            placeholder="Type hazard type (e.g. Flooding, Landslide, Fallen Post...)"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            required
          />
        </div>

        {/* Step 2: Severity (Unselected by default) */}
        <div style={styles.formSection}>
          <label style={styles.sectionLabel}>2. SEVERITY URGENCY LEVEL</label>
          <div style={styles.severityBar}>
            {[
              { id: 'LOW', label: 'Low', color: '#10B981' },
              { id: 'MODERATE', label: 'Moderate', color: '#F59E0B' },
              { id: 'SEVERE', label: 'Severe', color: '#EA580C' },
              { id: 'CRITICAL', label: 'Critical', color: '#DC2626' }
            ].map((sev) => (
              <button
                key={sev.id}
                type="button"
                style={
                  severityLevel === sev.id
                    ? { ...styles.sevActive, backgroundColor: sev.color }
                    : styles.sevInactive
                }
                onClick={() => setSeverityLevel(sev.id)}
              >
                {sev.label}
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Location with GPS Button */}
        <div style={styles.formSection}>
          <div style={styles.locationHeaderRow}>
            <label style={styles.sectionLabel}>3. LOCATION DETAILS</label>
            <button
              type="button"
              style={styles.gpsBtn}
              onClick={handleGetGpsLocation}
              disabled={isGettingGps}
            >
              {isGettingGps ? '📍 Fetching GPS...' : '📍 Auto-Detect My Live GPS'}
            </button>
          </div>
          <input
            type="text"
            style={styles.textInput}
            placeholder="Enter street name, barangay, or tap GPS button above"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            required
          />
          {coordinates && <div style={styles.gpsCoordTag}>Captured GPS: {coordinates}</div>}
        </div>

        {/* Step 4: Multi-Photo Uploader */}
        <div style={styles.formSection}>
          <label style={styles.sectionLabel}>4. ATTACH PHOTO EVIDENCE</label>
          <label htmlFor="photo-upload" style={styles.photoDropzone}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0F766E" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <div style={styles.photoDropText}>+ Tap to upload photos from device</div>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />
          </label>

          {selectedPhotos.length > 0 && (
            <div style={styles.photoListContainer}>
              <div style={styles.photoCountHeader}>📸 {selectedPhotos.length} photo(s) attached:</div>
              {selectedPhotos.map((photo, idx) => (
                <div key={idx} style={styles.photoChip}>
                  <span>📷 {photo.name}</span>
                  <button type="button" onClick={() => handleRemovePhoto(idx)} style={styles.removePhotoBtn}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 5: Remarks */}
        <div style={styles.formSection}>
          <label style={styles.sectionLabel}>5. HAZARD DETAILS & REMARKS</label>
          <textarea
            style={styles.textArea}
            rows="3"
            placeholder="Describe current situation..."
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
          {isSubmitting ? 'Transmitting to Database...' : '🚀 Submit Report to Command Center'}
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
  errorBox: { backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '10px', borderRadius: '10px', fontSize: '11px', marginBottom: '14px' },
  formCard: { backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px' },
  formSection: { marginBottom: '16px' },
  sectionLabel: { fontSize: '10px', fontWeight: '800', color: '#64748B', display: 'block', marginBottom: '6px' },
  locationHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  gpsBtn: { fontSize: '10px', fontWeight: '800', color: '#0F766E', backgroundColor: '#CCFBF1', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' },
  textInput: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box' },
  gpsCoordTag: { fontSize: '10px', fontWeight: '700', color: '#0F766E', marginTop: '4px' },
  severityBar: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px' },
  sevActive: { padding: '8px 4px', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  sevInactive: { padding: '8px 4px', backgroundColor: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: '8px', fontSize: '10px', fontWeight: '600', cursor: 'pointer' },
  photoDropzone: { border: '2px dashed #0F766E', backgroundColor: '#F0FDF4', padding: '14px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' },
  photoDropText: { fontSize: '11px', fontWeight: '800', color: '#0F766E' },
  photoListContainer: { marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' },
  photoCountHeader: { fontSize: '11px', fontWeight: '700', color: '#0F766E' },
  photoChip: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F1F5F9', padding: '6px 10px', borderRadius: '6px', fontSize: '11px' },
  removePhotoBtn: { border: 'none', backgroundColor: 'transparent', color: '#EF4444', fontWeight: '800', cursor: 'pointer' },
  textArea: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box', fontFamily: 'inherit' },
  submitBtn: { width: '100%', padding: '12px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' },
  submitBtnDisabled: { width: '100%', padding: '12px', backgroundColor: '#94A3B8', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'not-allowed' }
};
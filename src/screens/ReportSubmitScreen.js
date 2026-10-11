import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function ReportSubmitScreen({ onBack, onSubmitSuccess, userRole = 'CITIZEN' }) {
  const [reportType, setReportType] = useState('');
  const [severityLevel, setSeverityLevel] = useState('SEVERE');
  const [locationName, setLocationName] = useState('Brgy. Alangilan, Batangas City');
  const [description, setDescription] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setSelectedPhotos(prev => [...prev, ...files]);
    }
  };

  const handleRemovePhoto = (indexToRemove) => {
    setSelectedPhotos(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const photoNames = selectedPhotos.map(file => file.name);

      const payload = {
        id: 'AGAP-' + Date.now().toString(),
        sender_name: userRole === 'GUEST' ? 'Guest Citizen' : 'Registered Resident',
        user_role: userRole,
        category: reportType || 'GENERAL_HAZARD',
        report_type: reportType || 'General Hazard',
        severity: severityLevel,
        title: reportType || 'Emergency Hazard Report',
        location: locationName,
        coordinates: '13.7850° N, 121.0740° E',
        details: description,
        description: description,
        photos: photoNames,
        status: 'PENDING',
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('reports')
        .insert([payload]);

      if (error) {
        console.error('Supabase Error:', error);
        throw error;
      }

      alert('✓ Report successfully submitted and saved to Supabase!');
      if (typeof onSubmitSuccess === 'function') {
        onSubmitSuccess();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error saving report to cloud database.');
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

      {errorMessage && (
        <div style={styles.errorBox}>
          ⚠️ {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.formCard}>
        {/* Step 1: Custom Report Type */}
        <div style={styles.formSection}>
          <label style={styles.sectionLabel}>1. SPECIFY HAZARD / REPORT TYPE</label>
          <input
            type="text"
            style={styles.textInput}
            placeholder="e.g. River Flooding, Fallen Electric Post, Landslide..."
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            required
          />
        </div>

        {/* Step 2: Severity */}
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
                style={severityLevel === sev.id ? { ...styles.sevActive, backgroundColor: sev.color } : styles.sevInactive}
                onClick={() => setSeverityLevel(sev.id)}
              >
                {sev.label}
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Location */}
        <div style={styles.formSection}>
          <label style={styles.sectionLabel}>3. LOCATION DETAILS</label>
          <input
            type="text"
            style={styles.textInput}
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            required
          />
        </div>

        {/* Step 4: Multi-Photo Picker */}
        <div style={styles.formSection}>
          <label style={styles.sectionLabel}>4. ATTACH PHOTO EVIDENCE (SELECT 2 OR MORE)</label>
          <label htmlFor="photo-upload" style={styles.photoDropzone}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0F766E" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <div style={styles.photoDropText}>
              + Click / Tap to choose photos from device
            </div>
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
              <div style={styles.photoCountHeader}>
                📸 {selectedPhotos.length} {selectedPhotos.length === 1 ? 'photo' : 'photos'} attached:
              </div>
              {selectedPhotos.map((file, idx) => (
                <div key={idx} style={styles.photoChip}>
                  <span>📷 {file.name}</span>
                  <button type="button" onClick={() => handleRemovePhoto(idx)} style={styles.removePhotoBtn}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 5: Details */}
        <div style={styles.formSection}>
          <label style={styles.sectionLabel}>5. HAZARD DETAILS & REMARKS</label>
          <textarea
            style={styles.textArea}
            rows="3"
            placeholder="Describe current situation or road blockage..."
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
          {isSubmitting ? 'Transmitting to Supabase...' : '🚀 Submit Report to Command Center'}
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
  formCard: { backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' },
  formSection: { marginBottom: '16px' },
  sectionLabel: { fontSize: '10px', fontWeight: '800', color: '#64748B', display: 'block', marginBottom: '6px' },
  textInput: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', outline: 'none', boxSizing: 'border-box' },
  severityBar: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px' },
  sevActive: { padding: '8px 4px', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  sevInactive: { padding: '8px 4px', backgroundColor: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: '8px', fontSize: '10px', fontWeight: '600', cursor: 'pointer' },
  photoDropzone: { border: '2px dashed #0F766E', backgroundColor: '#F0FDF4', padding: '14px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' },
  photoDropText: { fontSize: '11px', fontWeight: '800', color: '#0F766E' },
  photoListContainer: { marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' },
  photoCountHeader: { fontSize: '11px', fontWeight: '700', color: '#0F766E', marginBottom: '4px' },
  photoChip: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F1F5F9', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', color: '#334155' },
  removePhotoBtn: { border: 'none', backgroundColor: 'transparent', color: '#EF4444', fontWeight: '800', cursor: 'pointer' },
  textArea: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', outline: 'none', boxSizing: 'border-box' },
  submitBtn: { width: '100%', padding: '12px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', marginTop: '8px' },
  submitBtnDisabled: { width: '100%', padding: '12px', backgroundColor: '#94A3B8', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'not-allowed', marginTop: '8px' }
};
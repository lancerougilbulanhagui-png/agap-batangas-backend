import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function ReportSubmitScreen({ onBack, onSubmitSuccess, userRole = 'CITIZEN' }) {
  const [reportType, setReportType] = useState('');
  const [severityLevel, setSeverityLevel] = useState('');
  const [locationName, setLocationName] = useState('');
  const [coordinates, setCoordinates] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
        const coordString = `${lat} N, ${lng} E`;
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

  const compressAndConvertImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 600;
          const scaleFactor = MAX_WIDTH / img.width;

          if (scaleFactor < 1) {
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleFactor;
          } else {
            canvas.width = img.width;
            canvas.height = img.height;
          }

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.5);
          resolve(compressedBase64);
        };
      };
    });
  };

  const handlePhotoUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    const base64Images = await Promise.all(
      files.map((file) => compressAndConvertImage(file))
    );

    setSelectedPhotos((prev) => [...prev, ...base64Images]);
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
      const { count, error: countErr } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true });

      const nextNumber = (countErr ? 0 : (count || 0)) + 1;
      const formattedTicketId = 'AGAP-' + String(nextNumber).padStart(4, '0');

      const payload = {
        id: formattedTicketId,
        sender_name: userRole === 'GUEST' ? 'Guest Submitter' : 'Verified Resident',
        user_role: userRole,
        category: reportType || 'GENERAL_HAZARD',
        report_type: reportType || 'General Hazard',
        severity: severityLevel,
        title: reportType || 'Emergency Hazard Report',
        location: locationName || 'Batangas City',
        coordinates: coordinates || '13.7850 N, 121.0740 E',
        details: description,
        description: description,
        photos: JSON.stringify(selectedPhotos),
        status: 'PENDING',
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('reports').insert([payload]);
      if (error) throw error;

      alert(`Report ${formattedTicketId} successfully submitted with ${selectedPhotos.length} photo(s)!`);
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

      {errorMessage && <div style={styles.errorBox}>{errorMessage}</div>}

      <form onSubmit={handleSubmit} style={styles.formCard}>
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

        <div style={styles.formSection}>
          <div style={styles.locationHeaderRow}>
            <label style={styles.sectionLabel}>3. LOCATION DETAILS</label>
            <button
              type="button"
              style={styles.gpsBtn}
              onClick={handleGetGpsLocation}
              disabled={isGettingGps}
            >
              {isGettingGps ? 'Fetching GPS...' : 'Auto-Detect Live GPS'}
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

        <div style={styles.formSection}>
          <label style={styles.sectionLabel}>4. ATTACH PHOTO EVIDENCE</label>
          <label htmlFor="photo-upload" style={styles.photoDropzone}>
            <div style={styles.photoDropText}>+ Select photos from device</div>
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
              <div style={styles.photoCountHeader}>{selectedPhotos.length} photo(s) attached</div>
              {selectedPhotos.map((_, idx) => (
                <div key={idx} style={styles.photoChip}>
                  <span>Photo Attachment #{idx + 1}</span>
                  <button type="button" onClick={() => handleRemovePhoto(idx)} style={styles.removePhotoBtn}>Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>

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
          {isSubmitting ? 'Transmitting to Database...' : 'Submit Report to Command Center'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: { maxWidth: '440px', margin: '0 auto', padding: '16px', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' },
  navHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' },
  backBtn: { backgroundColor: 'transparent', border: 'none', color: '#0F766E', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  headerTitle: { fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 },
  headerSub: { fontSize: '11px', color: '#64748B' },
  errorBox: { backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '10px', borderRadius: '8px', fontSize: '11px', marginBottom: '14px' },
  formCard: { backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' },
  formSection: { marginBottom: '14px' },
  sectionLabel: { fontSize: '10px', fontWeight: '800', color: '#64748B', display: 'block', marginBottom: '6px' },
  locationHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  gpsBtn: { fontSize: '10px', fontWeight: '800', color: '#0F766E', backgroundColor: '#CCFBF1', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' },
  textInput: { width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box' },
  gpsCoordTag: { fontSize: '10px', fontWeight: '700', color: '#0F766E', marginTop: '4px' },
  severityBar: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px' },
  sevActive: { padding: '8px 4px', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  sevInactive: { padding: '8px 4px', backgroundColor: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: '600', cursor: 'pointer' },
  photoDropzone: { border: '2px dashed #0F766E', backgroundColor: '#F0FDF4', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'center', cursor: 'pointer' },
  photoDropText: { fontSize: '11px', fontWeight: '800', color: '#0F766E' },
  photoListContainer: { marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' },
  photoCountHeader: { fontSize: '11px', fontWeight: '700', color: '#0F766E' },
  photoChip: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F1F5F9', padding: '6px 10px', borderRadius: '6px', fontSize: '11px' },
  removePhotoBtn: { border: 'none', backgroundColor: 'transparent', color: '#EF4444', fontWeight: '800', cursor: 'pointer' },
  textArea: { width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box', fontFamily: 'inherit' },
  submitBtn: { width: '100%', padding: '11px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' },
  submitBtnDisabled: { width: '100%', padding: '11px', backgroundColor: '#94A3B8', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'not-allowed' }
};
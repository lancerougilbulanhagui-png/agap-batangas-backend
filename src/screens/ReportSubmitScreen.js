import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

export default function ReportSubmitScreen({ onBack, onSubmitSuccess, userRole = 'CITIZEN' }) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [severityLevel, setSeverityLevel] = useState('');

  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState(13.7565);
  const [longitude, setLongitude] = useState(121.0583);
  const [isGpsLoading, setIsGpsLoading] = useState(false);

  const [description, setDescription] = useState('');
  const [photoData, setPhotoData] = useState(null); // Stores image preview and base64
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);

  const categories = [
    { id: 'FLOODING', label: 'River / Flash Flood', color: '#0369A1' },
    { id: 'ELECTRICAL', label: 'Fallen Wire / Spark', color: '#D97706' },
    { id: 'OBSTRUCTION', label: 'Road Obstruction', color: '#15803D' },
    { id: 'FIRE', label: 'Fire / Explosion', color: '#DC2626' },
    { id: 'MEDICAL', label: 'Medical Emergency', color: '#B91C1C' },
    { id: 'OTHER', label: 'Other / Custom Hazard', color: '#475569' }
  ];

  useEffect(() => {
    const loadLeafletScript = () => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (!window.L) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = initMap;
        document.head.appendChild(script);
      } else {
        initMap();
      }
    };

    const initMap = () => {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = window.L;
      const map = L.map(mapContainerRef.current).setView([latitude, longitude], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      const marker = L.marker([latitude, longitude], { draggable: true }).addTo(map);

      mapInstanceRef.current = map;
      markerInstanceRef.current = marker;

      map.on('click', (e) => {
        const lat = parseFloat(e.latlng.lat.toFixed(5));
        const lng = parseFloat(e.latlng.lng.toFixed(5));
        setLatitude(lat);
        setLongitude(lng);
        marker.setLatLng([lat, lng]);

        if (!locationName) {
          setLocationName(`Pinned Spot (${lat} N, ${lng} E)`);
        }
      });

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        const lat = parseFloat(pos.lat.toFixed(5));
        const lng = parseFloat(pos.lng.toFixed(5));
        setLatitude(lat);
        setLongitude(lng);
      });
    };

    loadLeafletScript();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleGetDeviceLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(5));
        const lng = parseFloat(pos.coords.longitude.toFixed(5));
        setLatitude(lat);
        setLongitude(lng);
        setLocationName(`Near ${lat} N, ${lng} E`);
        setIsGpsLoading(false);

        if (mapInstanceRef.current && markerInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16);
          markerInstanceRef.current.setLatLng([lat, lng]);
        }
      },
      () => {
        setIsGpsLoading(false);
        alert('Could not fetch GPS location. Tap anywhere on the map to drop pin.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoData({
        fileName: file.name,
        base64: reader.result
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoData(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const finalHazardType = selectedCategory === 'OTHER' ? customCategory : selectedCategory;

    if (!finalHazardType || !finalHazardType.trim()) {
      alert('Please select or type a Hazard Type.');
      return;
    }

    if (!severityLevel) {
      alert('Please select a Severity Urgency Level.');
      return;
    }

    if (!locationName || !locationName.trim()) {
      alert('Please enter a location name or tap a spot on the map.');
      return;
    }

    setIsSubmitting(true);

    try {
      const localDeviceId = localStorage.getItem('agap_device_id') || 'GUEST-DEV';
      const randomSeq = Math.floor(1000 + Math.random() * 9000);
      const ticketNo = `#AGAP-2026-${randomSeq}`;

      const payload = {
        category: finalHazardType,
        hazard_type: finalHazardType,
        severity: severityLevel,
        location: locationName,
        coordinates: `${latitude}, ${longitude}`,
        description: description,
        status: 'PENDING',
        device_id: localDeviceId,
        proof_photos: photoData ? photoData.base64 : null
      };

      const { error } = await supabase.from('reports').insert([payload]);

      if (error) throw error;

      alert(`[SUCCESS] Emergency Report Transmitted!\nTicket Ref: ${ticketNo}\nStatus: PENDING ADMIN REVIEW`);

      if (typeof onSubmitSuccess === 'function') {
        onSubmitSuccess();
      }
    } catch (err) {
      alert(`[SYSTEM ERROR] Could not submit report: ${err.message}`);
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
          <div style={styles.headerSub}>Fast Direct Alert Form</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={styles.formCard}>
        {/* Step 1: Hazard Type */}
        <div style={styles.formSection}>
          <label style={styles.sectionLabel}>1. SELECT OR TYPE HAZARD TYPE</label>
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

          {selectedCategory === 'OTHER' && (
            <input
              type="text"
              style={{ ...styles.textInput, marginTop: '8px' }}
              placeholder="Type specific custom hazard..."
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              required
            />
          )}
        </div>

        {/* Step 2: Severity Level */}
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

        {/* Step 3: Map Location */}
        <div style={styles.formSection}>
          <div style={styles.labelRow}>
            <label style={styles.sectionLabel}>3. HAZARD LOCATION (TAP MAP TO PIN)</label>
            <button
              type="button"
              style={styles.gpsTriggerBtn}
              onClick={handleGetDeviceLocation}
              disabled={isGpsLoading}
            >
              <span>{isGpsLoading ? 'Locating...' : 'GPS Position'}</span>
            </button>
          </div>

          <input
            type="text"
            style={styles.textInput}
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="Tap map below or type address / landmark..."
            required
          />

          <div style={styles.interactiveMapFrame}>
            <div ref={mapContainerRef} style={{ width: '100%', height: '200px' }}></div>
          </div>
        </div>

        {/* Step 4: Photo Evidence Attachment with Removal */}
        <div style={styles.formSection}>
          <label style={styles.sectionLabel}>4. ATTACH PHOTO EVIDENCE</label>

          {photoData ? (
            <div style={styles.photoPreviewCard}>
              <img src={photoData.base64} alt="Attached Preview" style={styles.photoThumbnail} />
              <div style={styles.photoInfoBox}>
                <div style={styles.photoFileName}>{photoData.fileName}</div>
                <button type="button" style={styles.removePhotoBtn} onClick={handleRemovePhoto}>
                  Remove Attachment
                </button>
              </div>
            </div>
          ) : (
            <label style={styles.photoDropzone}>
              <div style={styles.photoDropText}>+ Tap to Upload Photo Evidence</div>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
            </label>
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
  formCard: { backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px' },
  formSection: { marginBottom: '16px' },
  sectionLabel: { fontSize: '10px', fontWeight: '800', color: '#64748B', display: 'block', marginBottom: '6px' },
  categoryGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  catBtnActive: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', backgroundColor: '#F0FDF4', border: '2px solid #0F766E', borderRadius: '10px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' },
  catBtnInactive: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' },
  catDot: { width: '8px', height: '8px', borderRadius: '50%' },
  severityBar: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px' },
  sevActive: { padding: '8px 4px', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  sevInactive: { padding: '8px 4px', backgroundColor: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: '8px', fontSize: '10px', fontWeight: '600', cursor: 'pointer' },
  labelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  gpsTriggerBtn: { backgroundColor: '#CCFBF1', border: '1px solid #99F6E4', color: '#0F766E', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  textInput: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box', marginBottom: '8px' },
  interactiveMapFrame: { borderRadius: '10px', overflow: 'hidden', border: '2px solid #0F766E' },
  photoDropzone: { border: '2px dashed #0F766E', backgroundColor: '#F0FDF4', padding: '14px', borderRadius: '12px', display: 'flex', justifyContent: 'center', cursor: 'pointer' },
  photoDropText: { fontSize: '11px', fontWeight: '800', color: '#0F766E' },
  photoPreviewCard: { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#F0FDF4', border: '1px solid #A7F3D0', padding: '10px', borderRadius: '10px' },
  photoThumbnail: { width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #CBD5E1' },
  photoInfoBox: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 },
  photoFileName: { fontSize: '11px', fontWeight: '700', color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' },
  removePhotoBtn: { backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', alignSelf: 'flex-start' },
  textArea: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box', fontFamily: 'inherit' },
  submitBtn: { width: '100%', padding: '12px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', marginTop: '8px' },
  submitBtnDisabled: { width: '100%', padding: '12px', backgroundColor: '#94A3B8', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'not-allowed', marginTop: '8px' }
};

import React, { useState, useEffect, useRef } from 'react';

export default function ReportSubmitScreen({ onBack, onSubmitSuccess, userRole = 'CITIZEN' }) {
  // 1. Hazard Type: Starts blank (no default pre-selected value)
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');

  // 2. Severity Level: Starts in NO active state
  const [severityLevel, setSeverityLevel] = useState('');

  // 3. Location & Tap-to-Pin Coordinates (Default: Batangas City)
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState(13.7565);
  const [longitude, setLongitude] = useState(121.0583);
  const [isGpsLoading, setIsGpsLoading] = useState(false);

  const [description, setDescription] = useState('');
  const [photoAttached, setPhotoAttached] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map Container Ref for Leaflet
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

  // Initialize Interactive Leaflet Click-to-Pin Map
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

      // Tap or Click Anywhere on Map to Move Pin
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

      // Drag Marker to Adjust Exact Position
      marker.on('dragend', (e) => {
        const lat = parseFloat(e.target.getLatLng().lat.toFixed(5));
        const lng = parseFloat(e.target.getLatLng().lng.toFixed(5));

        setLatitude(lat);
        setLongitude(lng);

        if (!locationName) {
          setLocationName(`Pinned Spot (${lat} N, ${lng} E)`);
        }
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

  // Update Map Pin if User Hits "Locate My Position" GPS Button
  const handleGetDeviceLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(5));
        const lng = parseFloat(position.coords.longitude.toFixed(5));

        setLatitude(lat);
        setLongitude(lng);
        setLocationName(`Near ${lat} N, ${lng} E (Batangas City Sector)`);
        setIsGpsLoading(false);

        if (mapInstanceRef.current && markerInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16);
          markerInstanceRef.current.setLatLng([lat, lng]);
        }
      },
      () => {
        setIsGpsLoading(false);
        alert('Could not fetch exact GPS. You can tap anywhere on the map below to drop the pin.');
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

    const finalHazardType = selectedCategory === 'OTHER' ? customCategory : selectedCategory;

    // Validation Checks
    if (!finalHazardType || !finalHazardType.trim()) {
      alert('Please select or type a Hazard Type before submitting.');
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

    setTimeout(() => {
      setIsSubmitting(false);
      alert('Emergency Hazard Report Successfully Submitted!\nTicket Reference: #AGAP-2026-0812');
      if (typeof onSubmitSuccess === 'function') {
        onSubmitSuccess();
      }
    }, 1000);
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

      {userRole === 'GUEST' && (
        <div style={styles.guestNotice}>
          Notice: Guest Mode report will undergo automated verification before dispatch.
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.formCard}>

        {/* Step 1: Hazard Type Selection / Custom Input */}
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
              placeholder="Type specific custom hazard (e.g. Chemical Spill, Fallen Tree)..."
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              required
            />
          )}
        </div>

        {/* Step 2: Severity Urgency Level (No default state) */}
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
          {!severityLevel && (
            <span style={styles.unselectedWarning}>Select urgency level to proceed</span>
          )}
        </div>

        {/* Step 3: Interactive Tap-to-Pin Location Map */}
        <div style={styles.formSection}>
          <div style={styles.labelRow}>
            <label style={styles.sectionLabel}>3. HAZARD LOCATION (TAP MAP TO PIN)</label>
            <button
              type="button"
              style={styles.gpsTriggerBtn}
              onClick={handleGetDeviceLocation}
              disabled={isGpsLoading}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F766E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span>{isGpsLoading ? 'Locating...' : 'My Location GPS'}</span>
            </button>
          </div>

          <input
            type="text"
            style={styles.textInput}
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="Tap map below or type street name / landmark..."
            required
          />

          <div style={styles.mapInstructionBox}>
            Tap anywhere on the map below to instantly place the hazard pin:
          </div>

          {/* Interactive Leaflet Map Container */}
          <div style={styles.interactiveMapFrame}>
            <div ref={mapContainerRef} style={{ width: '100%', height: '220px' }}></div>
          </div>

          <div style={styles.coordSubText}>
            Detected Coordinates: {latitude} N, {longitude} E
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
  unselectedWarning: { fontSize: '9px', color: '#DC2626', marginTop: '4px', display: 'block' },
  labelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  gpsTriggerBtn: { display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#CCFBF1', border: '1px solid #99F6E4', color: '#0F766E', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  textInput: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', outline: 'none', boxSizing: 'border-box' },
  mapInstructionBox: { fontSize: '10px', color: '#0F766E', fontWeight: '700', marginTop: '8px', marginBottom: '4px' },
  interactiveMapFrame: { borderRadius: '10px', overflow: 'hidden', border: '2px solid #0F766E' },
  coordSubText: { fontSize: '10px', color: '#64748B', marginTop: '4px', fontWeight: '600' },
  photoDropzone: { border: '2px dashed #0F766E', backgroundColor: '#F0FDF4', padding: '14px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' },
  photoDropText: { fontSize: '11px', fontWeight: '800', color: '#0F766E' },
  textArea: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  submitBtn: { width: '100%', padding: '12px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', marginTop: '8px' },
  submitBtnDisabled: { width: '100%', padding: '12px', backgroundColor: '#94A3B8', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'not-allowed', marginTop: '8px' }
};
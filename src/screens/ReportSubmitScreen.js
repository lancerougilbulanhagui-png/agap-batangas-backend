import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

export default function ReportSubmitScreen({ onBack, onSubmitSuccess }) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [severityLevel, setSeverityLevel] = useState('');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState(13.7565);
  const [longitude, setLongitude] = useState(121.0583);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [photosList, setPhotosList] = useState([]);
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
    const loadLeaflet = () => {
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
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);
      const marker = L.marker([latitude, longitude], { draggable: true }).addTo(map);

      mapInstanceRef.current = map;
      markerInstanceRef.current = marker;

      map.on('click', (e) => {
        const lat = parseFloat(e.latlng.lat.toFixed(5));
        const lng = parseFloat(e.latlng.lng.toFixed(5));
        setLatitude(lat);
        setLongitude(lng);
        marker.setLatLng([lat, lng]);
        if (!locationName) setLocationName(`Pinned Spot (${lat} N, ${lng} E)`);
      });
    };

    loadLeaflet();
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) return alert('GPS not supported on this device.');
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
        alert('Could not fetch location. Tap map to pin manually.');
      }
    );
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX = 800;
          let w = img.width, h = img.height;
          if (w > h ? w > MAX : h > MAX) {
            if (w > h) { h *= MAX / w; w = MAX; } else { w *= MAX / h; h = MAX; }
          }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          setPhotosList((prev) => [...prev, { id: Date.now() + Math.random(), base64: canvas.toDataURL('image/jpeg', 0.75) }]);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hazardType = selectedCategory === 'OTHER' ? customCategory : selectedCategory;
    if (!hazardType || !severityLevel || !locationName) return alert('Please complete all required fields.');

    setIsSubmitting(true);
    try {
      // Sequential ticket numbering starting from 1
      const { count, error: countErr } = await supabase.from('reports').select('*', { count: 'exact', head: true });
      const seq = (countErr || count === null) ? 1 : count + 1;
      const ticketNo = `#AGAP-2026-${String(seq).padStart(4, '0')}`;
      const localDeviceId = localStorage.getItem('agap_device_id') || 'GUEST-DEV';
      const photoPayload = photosList.length > 0 ? JSON.stringify(photosList.map((p) => p.base64)) : null;

      const payload = {
        id: ticketNo,
        ticket_no: ticketNo,
        category: hazardType,
        hazard_type: hazardType,
        severity: severityLevel,
        location: locationName,
        coordinates: `${latitude}, ${longitude}`,
        description,
        status: 'PENDING',
        device_id: localDeviceId,
        proof_photos: photoPayload,
        photos: photoPayload
      };

      const { error } = await supabase.from('reports').insert([payload]);
      if (error) throw error;

      alert(`✓ Hazard Report Transmitted!\nTicket Ref: ${ticketNo}\nStatus: PENDING TRIAGE`);
      if (onSubmitSuccess) onSubmitSuccess();
    } catch (err) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.navHeader}>
        <button style={styles.backBtn} onClick={onBack}>&lt; Back</button>
        <div>
          <h2 style={styles.headerTitle}>Submit Hazard Report</h2>
          <div style={styles.headerSub}>Project AGAP Direct Alert System</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={styles.formCard}>
        <div style={styles.formGroup}>
          <label style={styles.label}>1. HAZARD CATEGORY</label>
          <div style={styles.grid2}>
            {categories.map((cat) => (
              <button key={cat.id} type="button" style={selectedCategory === cat.id ? { ...styles.catBtnActive, borderColor: cat.color } : styles.catBtnInactive} onClick={() => setSelectedCategory(cat.id)}>
                <span style={{ ...styles.dot, backgroundColor: cat.color }}></span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
          {selectedCategory === 'OTHER' && (
            <input type="text" style={{ ...styles.input, marginTop: '8px' }} placeholder="Specify custom hazard..." value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} required />
          )}
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>2. SEVERITY URGENCY LEVEL</label>
          <div style={styles.grid4}>
            {['LOW', 'MODERATE', 'SEVERE', 'CRITICAL'].map((s) => (
              <button key={s} type="button" style={severityLevel === s ? styles.sevBtnActive : styles.sevBtnInactive} onClick={() => setSeverityLevel(s)}>{s}</button>
            ))}
          </div>
        </div>

        <div style={styles.formGroup}>
          <div style={styles.rowBetween}>
            <label style={styles.label}>3. LOCATION (TAP MAP TO PIN)</label>
            <button type="button" style={styles.gpsBtn} onClick={handleGetLocation} disabled={isGpsLoading}>{isGpsLoading ? 'Locating...' : 'GPS Position'}</button>
          </div>
          <input type="text" style={styles.input} value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="Landmark / address..." required />
          <div style={styles.mapBox}><div ref={mapContainerRef} style={{ width: '100%', height: '170px' }}></div></div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>4. ATTACH EVIDENCE PHOTOS ({photosList.length})</label>
          {photosList.length > 0 && (
            <div style={styles.grid3}>
              {photosList.map((p) => (
                <div key={p.id} style={styles.thumbCard}>
                  <img src={p.base64} alt="Thumb" style={styles.thumbImg} />
                  <button type="button" style={styles.removeBtn} onClick={() => setPhotosList((prev) => prev.filter((item) => item.id !== p.id))}>✕</button>
                </div>
              ))}
            </div>
          )}
          <label style={styles.dropzone}>
            <span style={styles.dropText}>+ Upload 1 or More Photos</span>
            <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ display: 'none' }} />
          </label>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>5. REMARKS & SITUATION DETAILS</label>
          <textarea style={styles.textarea} rows="3" placeholder="Describe current situation..." value={description} onChange={(e) => setDescription(e.target.value)} required />
        </div>

        <button type="submit" style={isSubmitting ? styles.submitBtnDisabled : styles.submitBtn} disabled={isSubmitting}>
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
  formGroup: { marginBottom: '14px' },
  label: { fontSize: '10px', fontWeight: '800', color: '#64748B', display: 'block', marginBottom: '6px' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '8px' },
  grid4: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px' },
  catBtnActive: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', backgroundColor: '#F0FDF4', border: '2px solid #0F766E', borderRadius: '10px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' },
  catBtnInactive: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' },
  dot: { width: '8px', height: '8px', borderRadius: '50%' },
  sevBtnActive: { padding: '8px 4px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  sevBtnInactive: { padding: '8px 4px', backgroundColor: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: '600', cursor: 'pointer' },
  rowBetween: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' },
  gpsBtn: { backgroundColor: '#CCFBF1', border: '1px solid #99F6E4', color: '#0F766E', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box', fontFamily: 'inherit' },
  mapBox: { borderRadius: '10px', overflow: 'hidden', border: '2px solid #0F766E', marginTop: '6px' },
  thumbCard: { position: 'relative', width: '100%', paddingTop: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #0F766E' },
  thumbImg: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' },
  removeBtn: { position: 'absolute', top: '2px', right: '2px', backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '9px', cursor: 'pointer' },
  dropzone: { border: '2px dashed #0F766E', backgroundColor: '#F0FDF4', padding: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'center', cursor: 'pointer' },
  dropText: { fontSize: '11px', fontWeight: '800', color: '#0F766E' },
  submitBtn: { width: '100%', padding: '12px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', marginTop: '8px' },
  submitBtnDisabled: { width: '100%', padding: '12px', backgroundColor: '#94A3B8', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'not-allowed', marginTop: '8px' }
};

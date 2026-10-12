import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function DangerZoneMapScreen({ onBack }) {
  const [approvedHazards, setApprovedHazards] = useState([]);
  const [userGps, setUserGps] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [activePin, setActivePin] = useState(null);

  useEffect(() => {
    fetchApprovedHazards();
    detectLiveUserGps();
  }, []);

  const detectLiveUserGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(4);
          const lng = pos.coords.longitude.toFixed(4);
          setUserGps({ lat, lng, rawCoords: `${lat} N, ${lng} E` });
        },
        () => console.log('GPS detection skipped.')
      );
    }
  };

  const fetchApprovedHazards = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('status', 'APPROVED');

      if (error) throw error;
      if (data) setApprovedHazards(data);
    } catch (err) {
      console.error('Map fetch error:', err.message);
    }
  };

  const openInGoogleMaps = (coordString) => {
    const cleanCoords = (coordString || 'Batangas City').replace(/[^0-9.,NnSsEeWw\s]/g, '').trim();
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanCoords)}`, '_blank');
  };

  const getPhotoList = (photosData) => {
    if (!photosData) return [];
    if (Array.isArray(photosData)) return photosData;
    if (typeof photosData === 'string') {
      try {
        const parsed = JSON.parse(photosData);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        return [photosData];
      }
    }
    return [];
  };

  const filteredHazards = approvedHazards.filter((h) => {
    if (selectedCategory === 'ALL') return true;
    return (h.hazard_type || h.category || '').toUpperCase().includes(selectedCategory);
  });

  return (
    <div style={styles.container}>
      <div style={styles.navHeader}>
        <button style={styles.backBtn} onClick={onBack}>
          &lt; Back
        </button>
        <div>
          <h2 style={styles.headerTitle}>Hazard Risk Map</h2>
          <div style={styles.headerSub}>Database Connected Danger Zones</div>
        </div>
      </div>

      <div style={styles.filterChipRow}>
        {['ALL', 'FLOOD', 'LANDSLIDE', 'FIRE', 'POST'].map((cat) => (
          <button
            key={cat}
            style={selectedCategory === cat ? styles.chipActive : styles.chipInactive}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={styles.mapCanvas}>
        <div style={styles.mapGridLines}></div>

        {userGps && (
          <div style={styles.userGpsPin} title="Your Current Location">
            <div style={styles.userPulseRing}></div>
            <span style={styles.pinTagLabel}>YOU ARE HERE</span>
          </div>
        )}

        {filteredHazards.map((hazard, idx) => (
          <div
            key={hazard.id || idx}
            style={{
              ...styles.hazardPin,
              top: `${25 + (idx * 18) % 55}%`,
              left: `${20 + (idx * 25) % 65}%`
            }}
            onClick={() => setActivePin(hazard)}
          >
            <span style={styles.hazardPinIcon}>HAZARD</span>
            <span style={styles.hazardPinTag}>{hazard.hazard_type || hazard.category}</span>
          </div>
        ))}

        {filteredHazards.length === 0 && (
          <div style={styles.noPinsOverlay}>
            No approved hazard reports in this category.
          </div>
        )}
      </div>

      {/* POPUP MODAL ON CLICK */}
      {activePin && (
        <div style={styles.pinDetailCard}>
          <div style={styles.detailCardHeader}>
            <span style={styles.ticketTag}>{activePin.hazard_type || activePin.category}</span>
            <button style={styles.closeBtn} onClick={() => setActivePin(null)}>Close</button>
          </div>
          <h3 style={styles.detailTitle}>{activePin.hazard_type || activePin.category}</h3>
          <div style={styles.detailMeta}>Date Submitted: {activePin.created_at ? new Date(activePin.created_at).toLocaleString() : 'Recently'}</div>
          <div style={styles.detailMeta}>Location: {activePin.location}</div>
          <div style={styles.detailMeta}>Severity: <strong style={{ color: '#DC2626' }}>{activePin.severity}</strong></div>
          <p style={styles.detailDesc}>{activePin.description || activePin.details || 'No remarks.'}</p>

          {getPhotoList(activePin.photos || activePin.photo || activePin.images).length > 0 && (
            <div style={styles.photoBox}>
              {getPhotoList(activePin.photos || activePin.photo || activePin.images).map((pSrc, pIdx) => (
                <img key={pIdx} src={pSrc} alt="Evidence" style={styles.hazardPhotoThumbnail} />
              ))}
            </div>
          )}

          <button style={styles.googleMapsBtn} onClick={() => openInGoogleMaps(activePin.coordinates || activePin.location)}>
            View Location on Google Maps
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '440px', margin: '0 auto', padding: '16px', fontFamily: "'Inter', sans-serif" },
  navHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' },
  backBtn: { backgroundColor: 'transparent', border: 'none', color: '#0F766E', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  headerTitle: { fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 },
  headerSub: { fontSize: '11px', color: '#64748B' },
  filterChipRow: { display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '12px', paddingBottom: '4px' },
  chipActive: { padding: '6px 12px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '16px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  chipInactive: { padding: '6px 12px', backgroundColor: '#E2E8F0', color: '#475569', border: 'none', borderRadius: '16px', fontSize: '10px', fontWeight: '600', cursor: 'pointer' },
  mapCanvas: { width: '100%', height: '300px', backgroundColor: '#0F172A', borderRadius: '12px', position: 'relative', overflow: 'hidden', border: '1px solid #334155' },
  mapGridLines: { width: '100%', height: '100%', opacity: 0.1, backgroundImage: 'radial-gradient(#94A3B8 1px, transparent 1px)', backgroundSize: '16px 16px' },
  userGpsPin: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 },
  userPulseRing: { width: '14px', height: '14px', backgroundColor: '#0284C7', borderRadius: '50%', border: '2px solid #FFFFFF', boxShadow: '0 0 10px #0284C7' },
  pinTagLabel: { fontSize: '8px', fontWeight: '800', color: '#FFFFFF', backgroundColor: '#0284C7', padding: '2px 6px', borderRadius: '4px', marginTop: '2px' },
  hazardPin: { position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', zIndex: 5 },
  hazardPinIcon: { backgroundColor: '#DC2626', color: '#FFFFFF', fontSize: '8px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' },
  hazardPinTag: { fontSize: '8px', color: '#F8FAFC', backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: '1px 4px', borderRadius: '2px', marginTop: '2px' },
  noPinsOverlay: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#94A3B8', fontSize: '11px', fontWeight: '700', textAlign: 'center' },
  pinDetailCard: { marginTop: '12px', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '12px' },
  detailCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  ticketTag: { fontSize: '10px', fontWeight: '800', color: '#0F766E', backgroundColor: '#CCFBF1', padding: '2px 6px', borderRadius: '4px' },
  closeBtn: { border: 'none', backgroundColor: 'transparent', fontSize: '11px', color: '#64748B', fontWeight: '700', cursor: 'pointer' },
  detailTitle: { fontSize: '14px', fontWeight: '800', color: '#0F172A', margin: '6px 0 2px 0' },
  detailMeta: { fontSize: '11px', color: '#475569' },
  detailDesc: { fontSize: '11px', color: '#334155', marginTop: '6px' },
  photoBox: { display: 'flex', gap: '6px', marginTop: '8px', overflowX: 'auto' },
  hazardPhotoThumbnail: { width: '70px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #CBD5E1' },
  googleMapsBtn: { width: '100%', marginTop: '10px', padding: '9px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }
};
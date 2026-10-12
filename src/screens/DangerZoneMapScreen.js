import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function DangerMapZoneScreen({ onBack }) {
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [activePinId, setActivePinId] = useState(null);
  const [mapType, setMapType] = useState('m');
  const [activeHazards, setActiveHazards] = useState([]);
  const [userGps, setUserGps] = useState({ lat: 13.7853, lng: 121.0745 });

  useEffect(() => {
    fetchActiveHazards();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  // QUERY ACTIVE PINS ONLY: Exclude Resolved & Rejected Hazards
  const fetchActiveHazards = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .in('status', ['APPROVED', 'IN_PROGRESS', 'DISPATCHED']);

      if (error) throw error;
      if (data) setActiveHazards(data);
    } catch (err) {
      console.error('Map fetch error:', err.message);
    }
  };

  const filtered = selectedFilter === 'ALL'
    ? activeHazards
    : activeHazards.filter((h) => (h.severity || '').toUpperCase() === selectedFilter || (h.category || '').toUpperCase().includes(selectedFilter));

  const activeLoc = activePinId ? activeHazards.find((h) => h.id === activePinId) : null;
  const centerCoords = activeLoc && activeLoc.coordinates ? activeLoc.coordinates : `${userGps.lat},${userGps.lng}`;
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(centerCoords)}&t=${mapType}&z=${activeLoc ? 16 : 14}&ie=UTF8&iwloc=&output=embed`;

  return (
    <div style={styles.container}>
      <div style={styles.navHeader}>
        <button style={styles.backBtn} onClick={onBack}>&lt; Back</button>
        <div>
          <h2 style={styles.headerTitle}>Batangas Danger Zone Map</h2>
          <div style={styles.headerSub}>Live Approved Hazard Pins (Auto-clears when resolved)</div>
        </div>
      </div>

      <div style={styles.mapCard}>
        <div style={styles.rowBetween}>
          <span style={styles.badgeGreen}>LIVE ACTIVE HAZARD MAP</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button style={mapType === 'm' ? styles.toggleActive : styles.toggleInactive} onClick={() => setMapType('m')}>Roadmap</button>
            <button style={mapType === 'k' ? styles.toggleActive : styles.toggleInactive} onClick={() => setMapType('k')}>Satellite</button>
          </div>
        </div>
        <div style={styles.mapFrame}>
          <iframe title="Danger Zone Map" width="100%" height="230" frameBorder="0" scrolling="no" src={embedUrl} style={{ width: '100%', display: 'block' }}></iframe>
        </div>
      </div>

      <div style={styles.chipRow}>
        {['ALL', 'CRITICAL', 'SEVERE', 'MODERATE', 'LOW'].map((cat) => (
          <button key={cat} style={selectedFilter === cat ? styles.chipActive : styles.chipInactive} onClick={() => setSelectedFilter(cat)}>{cat}</button>
        ))}
      </div>

      <div style={styles.stack}>
        {filtered.length === 0 ? (
          <div style={styles.emptyCard}>No active hazard pins in this category. Map is clear!</div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} style={activePinId === item.id ? styles.cardActive : styles.card} onClick={() => setActivePinId(item.id)}>
              <div style={styles.rowBetween}>
                <span style={styles.badgeTeal}>{item.id || item.ticket_no}</span>
                <span style={styles.badgeRed}>{item.severity}</span>
              </div>
              <h4 style={styles.cardTitle}>{item.hazard_type || item.category}</h4>
              <p style={styles.cardMeta}>Location: {item.location}</p>
              <p style={styles.cardMeta}>Status: {item.status}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '440px', margin: '0 auto', padding: '16px', fontFamily: "'Inter', sans-serif" },
  navHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' },
  backBtn: { backgroundColor: 'transparent', border: 'none', color: '#0F766E', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  headerTitle: { fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 },
  headerSub: { fontSize: '11px', color: '#64748B' },
  mapCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '8px', marginBottom: '10px' },
  rowBetween: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  badgeGreen: { fontSize: '9px', fontWeight: '800', backgroundColor: '#DCFCE7', color: '#166534', padding: '2px 6px', borderRadius: '4px' },
  badgeTeal: { fontSize: '9px', fontWeight: '800', backgroundColor: '#CCFBF1', color: '#0F766E', padding: '2px 6px', borderRadius: '4px' },
  badgeRed: { fontSize: '9px', fontWeight: '800', backgroundColor: '#FEE2E2', color: '#991B1B', padding: '2px 6px', borderRadius: '4px' },
  toggleActive: { padding: '4px 8px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  toggleInactive: { padding: '4px 8px', backgroundColor: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: '600', cursor: 'pointer' },
  mapFrame: { borderRadius: '6px', overflow: 'hidden', border: '1px solid #CBD5E1', marginTop: '4px' },
  chipRow: { display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '10px' },
  chipActive: { padding: '6px 12px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '16px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  chipInactive: { padding: '6px 12px', backgroundColor: '#E2E8F0', color: '#475569', border: 'none', borderRadius: '16px', fontSize: '10px', fontWeight: '600', cursor: 'pointer' },
  stack: { display: 'flex', flexDirection: 'column', gap: '8px' },
  emptyCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', padding: '16px', borderRadius: '8px', textAlign: 'center', color: '#64748B', fontSize: '11px' },
  card: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '10px', cursor: 'pointer' },
  cardActive: { backgroundColor: '#F0FDF4', border: '2px solid #0F766E', borderRadius: '8px', padding: '10px', cursor: 'pointer' },
  cardTitle: { fontSize: '13px', fontWeight: '800', color: '#0F172A', margin: '2px 0' },
  cardMeta: { fontSize: '10px', color: '#64748B' }
};

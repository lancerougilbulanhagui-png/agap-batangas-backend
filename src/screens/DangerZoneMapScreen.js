import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

export default function DangerMapZoneScreen({ onBack }) {
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [activePinId, setActivePinId] = useState(null);
  const [activeHazards, setActiveHazards] = useState([]);
  const [userGps, setUserGps] = useState({ lat: 13.7565, lng: 121.0583 });

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

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

  // Initialize Leaflet Live GPS Map with Green Pin for User and Red Pins for Approved Hazards
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
      const map = L.map(mapContainerRef.current).setView([userGps.lat, userGps.lng], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);

      // 1. GREEN PIN FOR USER LOCATION
      const greenIcon = L.divIcon({
        className: 'custom-pin-green',
        html: `<div style="background-color: #166534; width: 16px; height: 16px; border-radius: 50%; border: 3px solid #FFFFFF; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      L.marker([userGps.lat, userGps.lng], { icon: greenIcon })
        .addTo(map)
        .bindPopup('<strong>Your Current Location</strong>');

      // 2. RED PINS FOR APPROVED HAZARDS
      const redIcon = L.divIcon({
        className: 'custom-pin-red',
        html: `<div style="background-color: #DC2626; width: 16px; height: 16px; border-radius: 50%; border: 3px solid #FFFFFF; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      activeHazards.forEach((haz) => {
        if (haz.coordinates) {
          const parts = haz.coordinates.split(',').map((s) => parseFloat(s.trim()));
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            const m = L.marker([parts[0], parts[1]], { icon: redIcon })
              .addTo(map)
              .bindPopup(`<strong>${haz.hazard_type || haz.category}</strong><br/>Ticket: ${haz.id || haz.ticket_no}<br/>Severity: ${haz.severity}`);
            markersRef.current[haz.id] = m;
          }
        }
      });

      mapInstanceRef.current = map;
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeHazards, userGps]);

  const handleSelectPin = (item) => {
    setActivePinId(item.id);
    if (mapInstanceRef.current && item.coordinates) {
      const parts = item.coordinates.split(',').map((s) => parseFloat(s.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        mapInstanceRef.current.setView([parts[0], parts[1]], 16);
        if (markersRef.current[item.id]) {
          markersRef.current[item.id].openPopup();
        }
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.navHeader}>
        <button style={styles.backBtn} onClick={onBack}>&lt; Back</button>
        <div>
          <h2 style={styles.headerTitle}>Batangas Danger Zone Map</h2>
          <div style={styles.headerSub}>Live Approved Hazard Pins (Green: You, Red: Hazards)</div>
        </div>
      </div>

      <div style={styles.mapCard}>
        <div style={styles.rowBetween}>
          <span style={styles.badgeGreen}>LIVE GPS MAP</span>
          <div style={styles.legendBox}>
            <span style={styles.legendGreen}>&bull; You (Green)</span>
            <span style={styles.legendRed}>&bull; Hazards (Red)</span>
          </div>
        </div>
        <div style={styles.mapFrame}>
          <div ref={mapContainerRef} style={{ width: '100%', height: '230px' }}></div>
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
            <div key={item.id} style={activePinId === item.id ? styles.cardActive : styles.card} onClick={() => handleSelectPin(item)}>
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
  legendBox: { display: 'flex', gap: '8px' },
  legendGreen: { fontSize: '9px', fontWeight: '800', color: '#166534' },
  legendRed: { fontSize: '9px', fontWeight: '800', color: '#DC2626' },
  badgeGreen: { fontSize: '9px', fontWeight: '800', backgroundColor: '#DCFCE7', color: '#166534', padding: '2px 6px', borderRadius: '4px' },
  badgeTeal: { fontSize: '9px', fontWeight: '800', backgroundColor: '#CCFBF1', color: '#0F766E', padding: '2px 6px', borderRadius: '4px' },
  badgeRed: { fontSize: '9px', fontWeight: '800', backgroundColor: '#FEE2E2', color: '#991B1B', padding: '2px 6px', borderRadius: '4px' },
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

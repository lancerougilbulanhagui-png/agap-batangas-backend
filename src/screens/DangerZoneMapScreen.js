import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function DangerMapZoneScreen({ onBack }) {
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [activePinId, setActivePinId] = useState(null);
  const [mapType, setMapType] = useState('m');
  const [approvedHazards, setApprovedHazards] = useState([]);
  const [userGps, setUserGps] = useState({ lat: 13.7853, lng: 121.0745, name: 'BSU Alangilan Campus' });
  const [isGpsActive, setIsGpsActive] = useState(false);

  useEffect(() => {
    fetchApprovedHazards();
    detectLiveGps();
  }, []);

  const detectLiveGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserGps({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            name: 'Your Live Location'
          });
          setIsGpsActive(true);
        },
        () => console.log('Defaulting center to Batangas City')
      );
    }
  };

  // STRICT FILTER: Only fetch reports that have been APPROVED by Admin
  const fetchApprovedHazards = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('status', 'APPROVED');

      if (error) throw error;
      if (data) setApprovedHazards(data);
    } catch (err) {
      console.error('Fetch map error:', err.message);
    }
  };

  const parseCoords = (coordStr) => {
    if (!coordStr) return { lat: 13.7850, lng: 121.0740 };

    const parts = coordStr
      .replace(/[^0-9.,-]/g, '')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    if (parts.length >= 2) {
      return {
        lat: parseFloat(parts[0]),
        lng: parseFloat(parts[1]),
      };
    }

    return { lat: 13.7850, lng: 121.0740 };
  };

  const hazardsWithDistance = approvedHazards.map((h) => {
    const coords = parseCoords(h.coordinates);
    const distKm = calculateDistanceKm(
      userGps.lat,
      userGps.lng,
      coords.lat,
      coords.lng
    );
    const formatted =
      distKm < 1 ? `${Math.round(distKm * 1000)}m away` : `${distKm.toFixed(1)}km away`;

    return { ...h, parsedCoords: coords, distanceKm: distKm, distanceFormatted: formatted };
  });

  const filteredLocations = selectedFilter === 'ALL'
    ? hazardsWithDistance
    : hazardsWithDistance.filter((loc) =>
        (loc.severity || '').toUpperCase() === selectedFilter ||
        (loc.category || '').toUpperCase().includes(selectedFilter)
      );

  const activeLocation = activePinId
    ? hazardsWithDistance.find((loc) => loc.id === activePinId || loc.report_id === activePinId)
    : null;

  const mapCenterCoords = activeLocation
    ? `${activeLocation.parsedCoords.lat},${activeLocation.parsedCoords.lng}`
    : `${userGps.lat},${userGps.lng}`;

  const currentZoom = activeLocation ? 16 : 14;
  const googleMapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mapCenterCoords)}&t=${mapType}&z=${currentZoom}&ie=UTF8&iwloc=&output=embed`;

  return (
    <div style={styles.container}>
      <div style={styles.navHeader}>
        <button style={styles.backBtn} onClick={onBack}>
          &lt; Back
        </button>
        <div>
          <h2 style={styles.headerTitle}>Batangas Danger Zone Map</h2>
          <div style={styles.headerSub}>Live Approved Citizen Hazard Pins</div>
        </div>
      </div>

      <div style={styles.mapCard}>
        <div style={styles.mapTopControls}>
          <div style={styles.scopeBadge}>
            <span style={styles.scopeBadgeText}>
              {isGpsActive ? 'LIVE GPS ACTIVE' : 'YOU ARE HERE: BATANGAS SECTOR'}
            </span>
          </div>
          <div style={styles.btnGroup}>
            <button
              style={mapType === 'm' ? styles.toggleActive : styles.toggleInactive}
              onClick={() => setMapType('m')}
            >
              Roadmap
            </button>
            <button
              style={mapType === 'k' ? styles.toggleActive : styles.toggleInactive}
              onClick={() => setMapType('k')}
            >
              Satellite
            </button>
          </div>
        </div>

        <div style={styles.mapFrame}>
          <iframe
            title="Google Map Danger Zone View"
            width="100%"
            height="250"
            frameBorder="0"
            scrolling="no"
            src={googleMapEmbedUrl}
            style={styles.mapIframe}
          ></iframe>
        </div>
      </div>

      <div style={styles.filterChipRow}>
        {['ALL', 'CRITICAL', 'SEVERE', 'MODERATE', 'LOW'].map((cat) => (
          <button
            key={cat}
            style={selectedFilter === cat ? styles.chipActive : styles.chipInactive}
            onClick={() => setSelectedFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={styles.pinsListContainer}>
        {filteredLocations.length === 0 ? (
          <div style={styles.emptyMapCard}>
            No approved hazard pins in this category. Map is clear.
          </div>
        ) : (
          filteredLocations.map((item, index) => (
            <div
              key={item.id || item.report_id || item.ticket_no || index}
              style={activePinId === (item.id || item.report_id || item.ticket_no) ? styles.hazardCardActive : styles.hazardCard}
              onClick={() => setActivePinId(item.id || item.report_id || item.ticket_no)}
            >
              <div style={styles.cardHeaderRow}>
                <span style={styles.ticketTag}>{item.id || item.ticket_no || 'APPROVED'}</span>
                <span style={styles.severityTag}>{item.severity}</span>
              </div>

              <h4 style={styles.hazardTitle}>{item.hazard_type || item.title || item.category}</h4>
              <div style={styles.hazardMeta}>Location: {item.location} ({item.distanceFormatted})</div>
              <div style={styles.hazardMeta}>Submitted: {item.created_at ? new Date(item.created_at).toLocaleString() : 'Recently'}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '440px', margin: '0 auto', padding: '16px', fontFamily: "'Inter', sans-serif" },
  navHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' },
  backBtn: { backgroundColor: 'transparent', border: 'none', color: '#0F766E', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  headerTitle: { fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 },
  headerSub: { fontSize: '11px', color: '#64748B' },
  mapCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '10px', marginBottom: '12px' },
  mapTopControls: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  scopeBadge: { backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', padding: '4px 8px', borderRadius: '6px' },
  scopeBadgeText: { fontSize: '9px', fontWeight: '800', color: '#166534' },
  btnGroup: { display: 'flex', gap: '4px' },
  toggleActive: { padding: '4px 8px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  toggleInactive: { padding: '4px 8px', backgroundColor: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: '600', cursor: 'pointer' },
  mapFrame: { borderRadius: '8px', overflow: 'hidden', border: '1px solid #CBD5E1' },
  mapIframe: { width: '100%', display: 'block' },
  filterChipRow: { display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '12px', paddingBottom: '4px' },
  chipActive: { padding: '6px 12px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '16px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  chipInactive: { padding: '6px 12px', backgroundColor: '#E2E8F0', color: '#475569', border: 'none', borderRadius: '16px', fontSize: '10px', fontWeight: '600', cursor: 'pointer' },
  pinsListContainer: { display: 'flex', flexDirection: 'column', gap: '8px' },
  emptyMapCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', padding: '16px', borderRadius: '8px', textAlign: 'center', color: '#64748B', fontSize: '11px' },
  hazardCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '10px', cursor: 'pointer' },
  hazardCardActive: { backgroundColor: '#F0FDF4', border: '2px solid #0F766E', borderRadius: '8px', padding: '10px', cursor: 'pointer' },
  cardHeaderRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '4px' },
  ticketTag: { fontSize: '10px', fontWeight: '800', color: '#0F766E', backgroundColor: '#CCFBF1', padding: '2px 6px', borderRadius: '4px' },
  severityTag: { fontSize: '10px', fontWeight: '800', color: '#DC2626', backgroundColor: '#FEE2E2', padding: '2px 6px', borderRadius: '4px' },
  hazardTitle: { fontSize: '13px', fontWeight: '800', color: '#0F172A', margin: '2px 0' },
  hazardMeta: { fontSize: '10px', color: '#64748B' }
};
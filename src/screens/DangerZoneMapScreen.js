import React, { useState } from 'react';

/**
 * Haversine Formula: Calculates distance between two GPS points in kilometers
 */
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

export default function DangerZoneMapScreen({ onBack }) {
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [activePinId, setActivePinId] = useState(null);
  const [mapType, setMapType] = useState('m');

  const bsuCicsLocation = {
    name: 'BSU Alangilan Campus (CICS Building)',
    lat: 13.7853,
    lng: 121.0745,
    coordsStr: '13.7853, 121.0745'
  };

  const [hazards, setHazards] = useState([
    {
      id: 'BAT-001',
      title: 'Commercial Sector Drainage Overflow',
      barangay: 'Brgy. Alangilan (Outside Access Gate)',
      lat: 13.7850,
      lng: 121.0740,
      coordinates: '13.7850, 121.0740',
      severity: 'MEDIUM',
      reportedAt: '15 mins ago',
      description: 'Clogged drainage grate causing 3-inch water pooling near university access road gate.',
      proofPhotos: [
        'INCIDENT PHOTO 1: Water pooling outside Alangilan commercial establishment',
        'INCIDENT PHOTO 2: Clogged drainage grate with silt & waste buildup'
      ]
    },
    {
      id: 'BAT-002',
      title: 'Asphalt Road Fissure & Collapse',
      barangay: 'Brgy. Bolbok Highway, Batangas City',
      lat: 13.7781,
      lng: 121.0652,
      coordinates: '13.7781, 121.0652',
      severity: 'HIGH',
      reportedAt: '35 mins ago',
      description: '2-meter asphalt fracture on northbound lane caused by rainfall saturation.',
      proofPhotos: [
        'INCIDENT PHOTO 1: Deep asphalt road fissure along Bolbok Highway',
        'INCIDENT PHOTO 2: Traffic cones warning motorists of road collapse'
      ]
    },
    {
      id: 'BAT-003',
      title: 'Fallen Live Power Cable & Pole',
      barangay: 'Brgy. Kumintang Ibaba, Batangas City',
      lat: 13.7565,
      lng: 121.0583,
      coordinates: '13.7565, 121.0583',
      severity: 'CRITICAL',
      reportedAt: '10 mins ago',
      description: 'Live 220V power line hanging across driveway near Kumintang Elementary School.',
      proofPhotos: [
        'INCIDENT PHOTO 1: Severed live power line on Kumintang Ibaba street curb',
        'INCIDENT PHOTO 2: Leaning utility pole sparking near driveway entrance'
      ]
    },
    {
      id: 'BAT-004',
      title: 'Riverbank Water Buildup',
      barangay: 'Brgy. Gulod Labac, Batangas City',
      lat: 13.7489,
      lng: 121.0711,
      coordinates: '13.7489, 121.0711',
      severity: 'MEDIUM',
      reportedAt: '2 hours ago',
      description: 'Ankle-deep runoff water on inner barangay road near Calumpang River bank.',
      proofPhotos: [
        'INCIDENT PHOTO 1: Drainage runoff covering road lane in Gulod Labac'
      ]
    },
    {
      id: 'BAT-005',
      title: 'Port Bypass Fallen Tree Obstruction',
      barangay: 'Brgy. Sta. Clara, Batangas City',
      lat: 13.7533,
      lng: 121.0456,
      coordinates: '13.7533, 121.0456',
      severity: 'MEDIUM',
      reportedAt: '3 hours ago',
      description: 'Large acacia branch occupying outer right lane heading toward Batangas Port.',
      proofPhotos: [
        'INCIDENT PHOTO 1: Fallen tree branch debris near Sta. Clara Port Bypass'
      ]
    },
    {
      id: 'BAT-006',
      title: 'Inspected Commercial Corridor - Normal',
      barangay: 'Brgy. Pallocan West, Batangas City',
      lat: 13.7420,
      lng: 121.0680,
      coordinates: '13.7420, 121.0680',
      severity: 'LOW',
      reportedAt: 'Clear - Verified Today',
      description: 'Routine LGU inspection completed. Roadway clear and fully operational.',
      proofPhotos: [
        'INSPECTION PHOTO 1: Clear roadway and active traffic in Pallocan West'
      ]
    },
    {
      id: 'BAT-007',
      title: 'Southern Coastal Access Sector - Clear',
      barangay: 'Brgy. Libjo, Batangas City',
      lat: 13.7250,
      lng: 121.0780,
      coordinates: '13.7250, 121.0780',
      severity: 'LOW',
      reportedAt: 'Clear - Verified Today',
      description: 'No active environmental hazards or road obstructions in south Libjo sector.',
      proofPhotos: [
        'INSPECTION PHOTO 1: Normal transit flow along Libjo Barangay Road'
      ]
    },
    {
      id: 'BAT-008',
      title: 'Northern Highway Junction - Clear',
      barangay: 'Brgy. Balagtas, Batangas City',
      lat: 13.8010,
      lng: 121.0820,
      coordinates: '13.8010, 121.0820',
      severity: 'LOW',
      reportedAt: 'Clear - Verified Today',
      description: 'Balagtas flyover and highway junction cleared of road debris.',
      proofPhotos: [
        'INSPECTION PHOTO 1: Balagtas junction fully passable'
      ]
    },
    {
      id: 'BAT-009',
      title: 'Eastern Inland Corridor - Clear',
      barangay: 'Brgy. Tingga Itaas, Batangas City',
      lat: 13.7710,
      lng: 121.0950,
      coordinates: '13.7710, 121.0950',
      severity: 'LOW',
      reportedAt: 'Clear - Verified Today',
      description: 'Inland hilly access road open and operational without slope erosion.',
      proofPhotos: [
        'INSPECTION PHOTO 1: Clear asphalt road in Tingga Itaas'
      ]
    }
  ]);

  const hazardsWithDistance = hazards.map((h) => {
    const distKm = calculateDistanceKm(bsuCicsLocation.lat, bsuCicsLocation.lng, h.lat, h.lng);
    const formatted = distKm < 1 ? `${Math.round(distKm * 1000)}m from CICS Bldg` : `${distKm.toFixed(1)}km from CICS Bldg`;
    return { ...h, distanceKm: distKm, distanceFormatted: formatted };
  });

  const filteredLocations = selectedFilter === 'ALL'
    ? hazardsWithDistance
    : hazardsWithDistance.filter(loc => loc.severity === selectedFilter);

  const activeLocation = activePinId ? hazardsWithDistance.find(loc => loc.id === activePinId) : null;

  const mapCenterCoords = activeLocation
    ? activeLocation.coordinates
    : `${bsuCicsLocation.lat},${bsuCicsLocation.lng}`;

  const currentZoom = activeLocation ? 16 : 14;
  const googleMapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mapCenterCoords)}&t=${mapType}&z=${currentZoom}&ie=UTF8&iwloc=&output=embed`;

  const handleLocateOnMap = (loc) => {
    setActivePinId(loc.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearPin = () => {
    setActivePinId(null);
  };

  const handleAddVerificationPhoto = (hazardId) => {
    const photoPrompt = prompt('Enter additional photo verification description or label:');
    if (photoPrompt && photoPrompt.trim()) {
      setHazards(prev =>
        prev.map(h => {
          if (h.id === hazardId) {
            const count = (h.proofPhotos ? h.proofPhotos.length : 0) + 1;
            return {
              ...h,
              proofPhotos: [...(h.proofPhotos || []), `VERIFICATION PHOTO ${count}: ${photoPrompt.trim()}`]
            };
          }
          return h;
        })
      );
      alert('✓ Additional verification photo attached successfully!');
    }
  };

  return (
    <div style={styles.container}>
      {/* Navigation Header */}
      <div style={styles.navHeader}>
        <button style={styles.backBtn} onClick={onBack}>
          &lt; Back
        </button>
        <div>
          <h2 style={styles.headerTitle}>Batangas Danger Zone Map</h2>
          <div style={styles.headerSub}>BSU Alangilan CICS Location Basis</div>
        </div>
      </div>

      {/* Main Google Map Card */}
      <div style={styles.mapCard}>
        <div style={styles.mapTopControls}>
          <div style={styles.scopeBadge}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#22C55E" stroke="#15803D" strokeWidth="1">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <span style={styles.scopeBadgeText}>YOU ARE HERE: BSU ALANGILAN (CICS)</span>
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

        {/* Embedded Google Map Frame */}
        <div style={styles.mapFrame}>
          <iframe
            title="Google Map BSU View"
            width="100%"
            height="250"
            frameBorder="0"
            scrolling="no"
            src={googleMapEmbedUrl}
            style={styles.mapIframe}
          ></iframe>
        </div>

        {/* Map View Control Bar */}
        <div style={styles.mapViewControls}>
          <button style={styles.resetBtn} onClick={handleClearPin}>
            Center Campus
          </button>
          <div style={styles.pinStatusPill}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#22C55E" stroke="#15803D" strokeWidth="1">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <span style={styles.pinStatusText}>
              {activeLocation ? activeLocation.barangay.split(',') : 'BSU CICS Building'}
            </span>
          </div>
        </div>

        {/* Bottom Incident Details & Multi-Photo Verification Card */}
        {activeLocation ? (
          <div style={styles.pinPreviewCard}>
            <div style={styles.proximityWarningBox}>
              <span style={styles.warningTag}>PROXIMITY FROM CICS</span>
              <span style={styles.distanceValue}>{activeLocation.distanceFormatted}</span>
            </div>

            <div style={styles.previewHeaderRow}>
              <div style={styles.previewTextWrapper}>
                <span style={styles.previewTag}>PINNED HAZARD • {activeLocation.id}</span>
                <h4 style={styles.previewTitle}>{activeLocation.title}</h4>
                <div style={styles.previewBarangay}>{activeLocation.barangay} ({activeLocation.coordinates})</div>
              </div>
              <button style={styles.closePreviewBtn} onClick={handleClearPin}>
                ✕
              </button>
            </div>

            <p style={styles.previewDescText}>{activeLocation.description}</p>

            {/* Multiple Photos Gallery Container */}
            <div style={styles.multiPhotoSection}>
              <div style={styles.photoHeaderRow}>
                <span style={styles.photoSectionTitle}>
                  📷 VERIFICATION PHOTOS ({activeLocation.proofPhotos ? activeLocation.proofPhotos.length : 0})
                </span>
                <button
                  style={styles.addMorePhotoBtn}
                  onClick={() => handleAddVerificationPhoto(activeLocation.id)}
                >
                  + Add Verification Photo
                </button>
              </div>

              <div style={styles.photoGalleryList}>
                {activeLocation.proofPhotos && activeLocation.proofPhotos.map((photoText, index) => (
                  <div key={index} style={styles.photoProofCard}>
                    <div style={styles.cameraIconBox}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                    </div>
                    <div style={styles.photoCaptionText}>{photoText}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={styles.defaultInfoNotice}>
            <div style={styles.defaultNoticeTitle}>LOCATION BASIS: BSU ALANGILAN CICS BLDG</div>
            <div style={styles.defaultNoticeSub}>
              Map centered on BSU Alangilan Campus CICS Building. Select any hazard below to view details and photos directly under the map.
            </div>
          </div>
        )}
      </div>

      {/* Severity Filter Tabs */}
      <div style={styles.filterSection}>
        <div style={styles.filterLabel}>Filter Incidents by Risk Level:</div>
        <div style={styles.filterBar}>
          <button
            style={selectedFilter === 'ALL' ? styles.filterActive : styles.filterInactive}
            onClick={() => setSelectedFilter('ALL')}
          >
            ALL ({hazards.length})
          </button>
          <button
            style={selectedFilter === 'CRITICAL' ? styles.filterCriticalActive : styles.filterInactive}
            onClick={() => setSelectedFilter('CRITICAL')}
          >
            CRITICAL
          </button>
          <button
            style={selectedFilter === 'HIGH' ? styles.filterHighActive : styles.filterInactive}
            onClick={() => setSelectedFilter('HIGH')}
          >
            HIGH
          </button>
          <button
            style={selectedFilter === 'MEDIUM' ? styles.filterMediumActive : styles.filterInactive}
            onClick={() => setSelectedFilter('MEDIUM')}
          >
            MEDIUM
          </button>
        </div>
      </div>

      {/* Incident Directory Cards */}
      <div style={styles.locationList}>
        {filteredLocations.map((item) => {
          const isCurrentActive = item.id === activePinId;
          const severityBg = item.severity === 'CRITICAL' ? '#FEE2E2' : item.severity === 'HIGH' ? '#FFEDD5' : item.severity === 'MEDIUM' ? '#FEF9C3' : '#DCFCE7';
          const severityColor = item.severity === 'CRITICAL' ? '#991B1B' : item.severity === 'HIGH' ? '#C2410C' : item.severity === 'MEDIUM' ? '#A16207' : '#15803D';

          return (
            <div
              key={item.id}
              style={{
                ...styles.locationCard,
                ...(isCurrentActive ? styles.cardActiveHighlight : {})
              }}
            >
              <div style={styles.cardTop}>
                <span style={styles.locationId}>{item.id} • {item.distanceFormatted}</span>
                <span style={{ ...styles.severityBadge, backgroundColor: severityBg, color: severityColor }}>
                  {item.severity} RISK
                </span>
              </div>

              <h3 style={styles.locationTitle}>{item.title}</h3>
              <div style={styles.locationSubText}>{item.barangay} • {item.reportedAt}</div>
              <p style={styles.descText}>{item.description}</p>

              {/* Photo Count Indicator */}
              <div style={styles.cardPhotoIndicator}>
                📷 {item.proofPhotos ? item.proofPhotos.length : 0} Verification Photo(s) Attached
              </div>

              <div style={styles.cardFooter}>
                <button
                  style={isCurrentActive ? styles.pinActiveBtnFull : styles.pinActionBtnFull}
                  onClick={() => handleLocateOnMap(item)}
                >
                  {isCurrentActive ? '✓ Pinned & Active on Map' : '📍 Locate on Google Map'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '440px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#F8FAFC', padding: '16px', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' },
  navHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
  backBtn: { backgroundColor: 'transparent', border: 'none', color: '#0F766E', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  headerTitle: { fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 },
  headerSub: { fontSize: '11px', color: '#64748B' },
  mapCard: { backgroundColor: '#0F172A', borderRadius: '18px', padding: '12px', marginBottom: '20px', border: '1px solid #1E293B', boxShadow: '0 8px 20px rgba(15, 23, 42, 0.12)' },
  mapTopControls: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  scopeBadge: { fontSize: '10px', fontWeight: '800', color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '6px', maxWidth: '240px' },
  scopeBadgeText: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  btnGroup: { display: 'flex', gap: '4px', flexShrink: 0 },
  toggleActive: { backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700', cursor: 'pointer' },
  toggleInactive: { backgroundColor: '#334155', color: '#94A3B8', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '600', cursor: 'pointer' },
  mapFrame: { borderRadius: '12px', overflow: 'hidden', border: '1px solid #334155' },
  mapIframe: { display: 'block', border: 'none' },
  mapViewControls: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', gap: '8px' },
  resetBtn: { backgroundColor: '#334155', color: '#FFFFFF', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '700', cursor: 'pointer', flexShrink: 0 },
  pinStatusPill: { backgroundColor: '#1E293B', border: '1px solid #334155', padding: '4px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', maxWidth: '220px' },
  pinStatusText: { fontSize: '10px', color: '#CBD5E1', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  pinPreviewCard: { marginTop: '12px', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '14px', padding: '14px' },
  proximityWarningBox: { backgroundColor: '#FEF2F2', border: '1px solid #FEE2E2', padding: '6px 10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  warningTag: { color: '#991B1B', fontSize: '9px', fontWeight: '800', letterSpacing: '0.5px' },
  distanceValue: { color: '#B91C1C', fontSize: '11px', fontWeight: '800' },
  previewHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' },
  previewTextWrapper: { flex: 1, marginRight: '12px', wordBreak: 'break-word' },
  previewTag: { fontSize: '9px', fontWeight: '800', color: '#38BDF8', letterSpacing: '0.5px' },
  previewTitle: { color: '#FFFFFF', fontSize: '14px', fontWeight: '800', margin: '2px 0 0 0', lineHeight: '1.3' },
  previewBarangay: { color: '#94A3B8', fontSize: '11px', marginTop: '2px' },
  closePreviewBtn: { backgroundColor: '#334155', color: '#94A3B8', border: 'none', width: '24px', height: '24px', borderRadius: '50%', fontWeight: '800', cursor: 'pointer', flexShrink: 0 },
  previewDescText: { fontSize: '12px', color: '#CBD5E1', lineHeight: '1.4', margin: '0 0 12px 0' },
  multiPhotoSection: { borderTop: '1px solid #334155', paddingTop: '10px' },
  photoHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  photoSectionTitle: { fontSize: '10px', fontWeight: '800', color: '#2DD4BF', letterSpacing: '0.5px' },
  addMorePhotoBtn: { backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: '800', cursor: 'pointer' },
  photoGalleryList: { display: 'flex', flexDirection: 'column', gap: '6px' },
  photoProofCard: { backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '8px' },
  cameraIconBox: { width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#CCFBF1', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  photoCaptionText: { fontSize: '10px', fontWeight: '700', color: '#E2E8F0', lineHeight: '1.3' },
  defaultInfoNotice: { marginTop: '12px', backgroundColor: '#1E293B', padding: '12px', borderRadius: '12px', borderLeft: '4px solid #0F766E' },
  defaultNoticeTitle: { color: '#2DD4BF', fontSize: '10px', fontWeight: '800', letterSpacing: '0.5px' },
  defaultNoticeSub: { color: '#94A3B8', fontSize: '11px', marginTop: '2px', lineHeight: '1.4' },
  filterSection: { marginBottom: '14px' },
  filterLabel: { fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '6px' },
  filterBar: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' },
  filterActive: { padding: '8px 4px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  filterCriticalActive: { padding: '8px 4px', backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  filterHighActive: { padding: '8px 4px', backgroundColor: '#EA580C', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  filterMediumActive: { padding: '8px 4px', backgroundColor: '#CA8A04', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  filterInactive: { padding: '8px 4px', backgroundColor: '#E2E8F0', color: '#475569', border: 'none', borderRadius: '8px', fontSize: '10px', fontWeight: '600', cursor: 'pointer' },
  locationList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  locationCard: { backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' },
  cardActiveHighlight: { border: '2px solid #0F766E', backgroundColor: '#F0FDF4' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  locationId: { fontSize: '11px', fontWeight: '800', color: '#0F766E' },
  severityBadge: { fontSize: '9px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px' },
  locationTitle: { fontSize: '14px', fontWeight: '800', color: '#0F172A', margin: '0 0 4px 0' },
  locationSubText: { fontSize: '11px', color: '#475569', fontWeight: '600', marginBottom: '6px' },
  descText: { fontSize: '12px', color: '#64748B', lineHeight: '1.4', margin: '0 0 10px 0' },
  cardPhotoIndicator: { fontSize: '10px', fontWeight: '700', color: '#0F766E', backgroundColor: '#F0FDF4', padding: '4px 8px', borderRadius: '6px', marginBottom: '10px' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', gap: '8px', paddingTop: '10px', borderTop: '1px solid #F1F5F9' },
  pinActionBtnFull: { width: '100%', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' },
  pinActiveBtnFull: { width: '100%', backgroundColor: '#15803D', color: '#FFFFFF', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }
};
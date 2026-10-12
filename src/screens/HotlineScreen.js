import React, { useState, useEffect } from 'react';

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

export default function HotlinesScreen({ onBack }) {
  const [userLocation, setUserLocation] = useState({
    name: 'Batangas City Sector',
    lat: 13.785,
    lng: 121.074
  });

  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggested, setShowSuggested] = useState(true);
  const [activeMapDeptId, setActiveMapDeptId] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            name: `Live Location (${pos.coords.latitude.toFixed(4)} N, ${pos.coords.longitude.toFixed(4)} E)`,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        () => console.log('Location detection default used.')
      );
    }
  }, []);

  const allHotlines = [
    {
      id: 'HOT-1',
      name: 'CDRRMO Batangas Disaster Command Center',
      category: 'DISASTER_LGU',
      number: '(043) 702-3900',
      email: 'cdrmmo@batangascity.gov.ph',
      webLink: 'https://batangascity.gov.ph',
      webLabel: 'Batangas City Gov',
      lat: 13.756,
      lng: 121.058,
      coordinates: '13.7560, 121.0580',
      availability: '24/7 Active Command',
      badge: 'MAIN COMMAND',
      description: 'Citywide disaster monitoring, river flood warnings, typhoon relief management, and emergency rescue vehicle dispatch.',
      protocolNote: 'When calling, state exact landmarks and the number of individuals requiring assistance.'
    },
    {
      id: 'HOT-2',
      name: 'Batangas City Police Headquarters (PNP Main)',
      category: 'POLICE',
      number: '(043) 723-2411',
      email: 'pnp.batangascity@pnp.gov.ph',
      webLink: 'https://pnp.gov.ph',
      webLabel: 'PNP Philippines',
      lat: 13.754,
      lng: 121.055,
      coordinates: '13.7540, 121.0550',
      availability: '24/7 Rapid Patrol',
      badge: 'POLICE HQ',
      description: 'Central police dispatch for immediate crime response, security alerts, tactical operations, and citywide mobile checkpoint management.',
      protocolNote: 'Connected directly to the city CCTV monitoring center for highway surveillance.'
    },
    {
      id: 'HOT-3',
      name: 'Bureau of Fire Protection (BFP Batangas Main Station)',
      category: 'FIRE',
      number: '(043) 723-1422',
      email: 'bfp.batangas@bfp.gov.ph',
      webLink: 'https://bfp.gov.ph',
      webLabel: 'BFP PH',
      lat: 13.755,
      lng: 121.057,
      coordinates: '13.7550, 121.0570',
      availability: '24/7 Station Duty',
      badge: 'FIRE & RESCUE',
      description: 'Primary structural fire brigade, heavy rescue gear operator, and post-disaster building safety inspection team.',
      protocolNote: 'Inform the dispatcher immediately if live electric lines or gas tanks are near the fire.'
    },
    {
      id: 'HOT-4',
      name: 'Batangas Medical Center (BatMC ER Triage)',
      category: 'MEDICAL',
      number: '(043) 740-8300',
      email: 'contact@batmc.doh.gov.ph',
      webLink: 'https://batmc.doh.gov.ph',
      webLabel: 'BatMC',
      lat: 13.7565,
      lng: 121.0583,
      coordinates: '13.7565, 121.0583',
      availability: '24/7 Level 3 ER',
      badge: 'TERTIARY HOSPITAL',
      description: 'Leading tertiary public hospital providing round-the-clock emergency care, trauma surgery, ICU admission, and ambulance fleet.',
      protocolNote: 'Notify ER triage ahead of time for incoming critical patient arrivals.'
    },
    {
      id: 'HOT-5',
      name: 'Philippine Red Cross - Batangas Chapter',
      category: 'MEDICAL',
      number: '(043) 723-3027',
      email: 'batangas@redcross.org.ph',
      webLink: 'https://redcross.org.ph',
      webLabel: 'Red Cross PH',
      lat: 13.758,
      lng: 121.06,
      coordinates: '13.7580, 121.0600',
      availability: '24/7 Blood & Rescue',
      badge: 'BLOOD & RESCUE',
      description: 'Emergency blood bank reservations, volunteer emergency responders, first-aid support, and community disaster relief.',
      protocolNote: 'Have patient blood type and hospital request form ready when calling.'
    },
    {
      id: 'HOT-6',
      name: 'Philippine Coast Guard (PCG Batangas Station)',
      category: 'DISASTER_LGU',
      number: '(043) 723-2982',
      email: 'cgdnsl.batangas@coastguard.gov.ph',
      webLink: 'https://coastguard.gov.ph',
      webLabel: 'PCG',
      lat: 13.7533,
      lng: 121.0456,
      coordinates: '13.7533, 121.0456',
      availability: '24/7 Maritime Desk',
      badge: 'MARITIME RESCUE',
      description: 'Coastal flood evacuation, riverfront search and rescue, port passenger safety enforcement, and maritime emergency response.',
      protocolNote: 'Handles official sea travel cancellation notices during bad weather.'
    },
    {
      id: 'HOT-7',
      name: 'Brgy. Alangilan Hall & Community Safety Desk',
      category: 'DISASTER_LGU',
      number: '(043) 723-8812',
      email: 'brgy.alangilan@batangascity.gov.ph',
      webLink: 'https://batangascity.gov.ph',
      webLabel: 'Barangay Desk',
      lat: 13.785,
      lng: 121.074,
      coordinates: '13.7850, 121.0740',
      availability: '24/7 Active Desk',
      badge: 'LOCAL BARANGAY',
      description: 'First responder unit for barangay-level incidents along Alangilan highway and university dorm sectors. Handles immediate flood monitoring, local tanod patrol, and emergency evacuations.',
      protocolNote: 'Direct contact for local evacuation center logistics.'
    },
    {
      id: 'HOT-8',
      name: 'BATELEC II Electric Co-Op Hotline',
      category: 'UTILITY',
      number: '(043) 756-1424',
      email: 'info@batelec2.com.ph',
      webLink: 'https://batelec2.com.ph',
      webLabel: 'BATELEC II',
      lat: 13.76,
      lng: 121.065,
      coordinates: '13.7600, 121.0650',
      availability: '24 Hours Emergency Desk',
      badge: 'POWER UTILITY',
      description: 'Power outage reporting, fallen electric wire containment, transformer explosion emergency repair.',
      protocolNote: 'Provide pole number or nearest establishment landmark.'
    }
  ];

  const hotlinesWithDistance = allHotlines.map((item) => {
    const distKm = calculateDistanceKm(userLocation.lat, userLocation.lng, item.lat, item.lng);
    const formatted = distKm < 1 ? `${Math.round(distKm * 1000)}m away` : `${distKm.toFixed(1)}km away`;
    return { ...item, distKm, distanceFormatted: formatted };
  });

  const sortedByProximity = [...hotlinesWithDistance].sort((a, b) => a.distKm - b.distKm);
  const nearest4Responders = sortedByProximity.slice(0, 4);

  const filteredHotlines = hotlinesWithDistance.filter((item) => {
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesQuery =
      searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const handleCall = (phoneNumber) => {
    window.location.href = `tel:${phoneNumber.replace(/[^0-9+]/g, '')}`;
  };

  const toggleDeptMap = (id) => {
    setActiveMapDeptId((currentId) => (currentId === id ? null : id));
  };

  return (
    <div style={styles.container}>
      <div style={styles.navHeader}>
        <button style={styles.backBtn} onClick={onBack}>
          &lt; Back
        </button>
        <div>
          <h2 style={styles.headerTitle}>Emergency Hotlines</h2>
          <div style={styles.headerSub}>{userLocation.name}</div>
        </div>
      </div>

      <div style={styles.cleanStatusBar}>
        <div style={styles.statusLeft}>
          <span style={styles.onlineText}>System Active & Connected</span>
        </div>
        <div style={styles.locationTag}>Batangas City, Philippines</div>
      </div>

      <div style={styles.suggestedContainer}>
        <button
          style={styles.toggleSuggestedBtn}
          onClick={() => setShowSuggested(!showSuggested)}
        >
          <div style={styles.toggleBtnLeft}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F766E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <span>Suggested Responders Near My GPS Location</span>
          </div>
          <span style={styles.chevronIcon}>{showSuggested ? 'Less' : 'More'}</span>
        </button>

        {showSuggested && (
          <div style={styles.suggestedDropdownContent}>
            <div style={styles.suggestedSubtitle}>4 Closest Emergency Stations to Your GPS:</div>

            <div style={styles.suggestedCardsList}>
              {nearest4Responders.map((resp) => {
                const isMapOpen = activeMapDeptId === resp.id;
                const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(resp.coordinates)}&t=m&z=15&ie=UTF8&iwloc=&output=embed`;

                return (
                  <div key={resp.id} style={styles.nearestCard}>
                    <div style={styles.nearestCardHeader}>
                      <span style={styles.badgeLabel}>{resp.badge}</span>
                      <span style={styles.distText}>{resp.distanceFormatted}</span>
                    </div>

                    <h4 style={styles.nearestName}>{resp.name}</h4>

                    <div style={styles.timeBadgeRow}>
                      <span style={styles.timeText}>Operating Hours: {resp.availability}</span>
                    </div>

                    <p style={styles.detailedDesc}>{resp.description}</p>

                    <div style={styles.extraContactsBox}>
                      <div style={styles.contactItemRow}>
                        <span style={styles.contactMetaLabel}>Email:</span>
                        <a href={`mailto:${resp.email}`} style={styles.contactMetaLink}>{resp.email}</a>
                      </div>
                      <div style={styles.contactItemRow}>
                        <span style={styles.contactMetaLabel}>Website:</span>
                        <a href={resp.webLink} target="_blank" rel="noreferrer" style={styles.contactMetaLink}>{resp.webLabel}</a>
                      </div>
                    </div>

                    <button
                      style={isMapOpen ? styles.mapToggleBtnActive : styles.mapToggleBtn}
                      onClick={() => toggleDeptMap(resp.id)}
                    >
                      {isMapOpen ? 'Hide Location Map' : 'View Location Map'}
                    </button>

                    {isMapOpen && (
                      <div style={styles.mapEmbedContainer}>
                        <iframe
                          title={`Map for ${resp.name}`}
                          width="100%"
                          height="180"
                          frameBorder="0"
                          scrolling="no"
                          src={mapUrl}
                          style={styles.mapIframe}
                        ></iframe>
                      </div>
                    )}

                    <button style={styles.callButtonPrimary} onClick={() => handleCall(resp.number)}>
                      Call • {resp.number}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div style={styles.searchContainer}>
        <input
          type="text"
          style={styles.searchInput}
          placeholder="Search department, keyword, or emergency category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div style={styles.filterChipRow}>
        {['ALL', 'DISASTER_LGU', 'POLICE', 'FIRE', 'MEDICAL', 'UTILITY'].map((cat) => (
          <button
            key={cat}
            style={selectedCategory === cat ? styles.chipActive : styles.chipInactive}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={styles.cardList}>
        {filteredHotlines.map((item) => {
          const isMapOpen = activeMapDeptId === item.id;
          const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(item.coordinates)}&t=m&z=15&ie=UTF8&iwloc=&output=embed`;

          return (
            <div key={item.id} style={styles.hotlineCard}>
              <div style={styles.cardTopRow}>
                <span style={styles.categoryBadge}>{item.category}</span>
                <span style={styles.availTag}>{item.availability}</span>
              </div>

              <h3 style={styles.unitName}>{item.name}</h3>
              <div style={styles.unitNumber}>{item.number} • {item.distanceFormatted}</div>
              <p style={styles.cardDescText}>{item.description}</p>

              {item.protocolNote && (
                <div style={styles.protocolNoteBox}>
                  <strong>Note:</strong> {item.protocolNote}
                </div>
              )}

              <div style={styles.btnRow}>
                <button style={styles.callBtn} onClick={() => handleCall(item.number)}>
                  Call Department
                </button>
                <button style={styles.mapTrackerBtn} onClick={() => toggleDeptMap(item.id)}>
                  {isMapOpen ? 'Hide Map' : 'Map Location'}
                </button>
              </div>

              {isMapOpen && (
                <div style={styles.mapEmbedContainer}>
                  <iframe
                    title={`Map for ${item.name}`}
                    width="100%"
                    height="180"
                    frameBorder="0"
                    scrolling="no"
                    src={mapUrl}
                    style={styles.mapIframe}
                  ></iframe>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '440px', margin: '0 auto', padding: '16px', fontFamily: "'Inter', sans-serif" },
  navHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' },
  backBtn: { backgroundColor: 'transparent', border: 'none', color: '#0F766E', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  headerTitle: { fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 },
  headerSub: { fontSize: '11px', color: '#0F766E', fontWeight: '700' },
  cleanStatusBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', padding: '8px 12px', borderRadius: '8px', marginBottom: '12px' },
  statusLeft: { display: 'flex', alignItems: 'center', gap: '6px' },
  onlineText: { fontSize: '11px', fontWeight: '800', color: '#166534' },
  locationTag: { fontSize: '10px', color: '#475569', fontWeight: '600' },
  suggestedContainer: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px' },
  toggleSuggestedBtn: { width: '100%', padding: '10px 12px', backgroundColor: '#F8FAFC', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' },
  toggleBtnLeft: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '800', color: '#0F766E' },
  chevronIcon: { fontSize: '10px', color: '#64748B' },
  suggestedDropdownContent: { padding: '12px', borderTop: '1px solid #E2E8F0' },
  suggestedSubtitle: { fontSize: '10px', fontWeight: '800', color: '#64748B', marginBottom: '8px' },
  suggestedCardsList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  nearestCard: { backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '10px' },
  nearestCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' },
  badgeLabel: { fontSize: '9px', fontWeight: '800', backgroundColor: '#CCFBF1', color: '#0F766E', padding: '2px 6px', borderRadius: '4px' },
  distText: { fontSize: '10px', fontWeight: '800', color: '#166534', backgroundColor: '#DCFCE7', padding: '2px 6px', borderRadius: '4px' },
  nearestName: { fontSize: '13px', fontWeight: '800', color: '#0F172A', margin: '2px 0 4px 0' },
  timeBadgeRow: { marginBottom: '4px' },
  timeText: { fontSize: '10px', fontWeight: '700', color: '#0F766E' },
  detailedDesc: { fontSize: '10px', color: '#475569', margin: '4px 0 8px 0', lineHeight: '1.3' },
  extraContactsBox: { backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '6px 8px', marginBottom: '8px', fontSize: '10px' },
  contactItemRow: { display: 'flex', gap: '6px', marginBottom: '2px' },
  contactMetaLabel: { fontWeight: '700', color: '#64748B' },
  contactMetaLink: { color: '#0F766E', textDecoration: 'none', wordBreak: 'break-all' },
  mapToggleBtn: { width: '100%', padding: '6px', backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '10px', fontWeight: '700', color: '#475569', cursor: 'pointer', marginBottom: '6px' },
  mapToggleBtnActive: { width: '100%', padding: '6px', backgroundColor: '#0F766E', border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: '700', color: '#FFFFFF', cursor: 'pointer', marginBottom: '6px' },
  mapEmbedContainer: { borderRadius: '6px', overflow: 'hidden', border: '1px solid #CBD5E1', marginBottom: '8px' },
  mapIframe: { display: 'block' },
  callButtonPrimary: { width: '100%', padding: '9px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' },
  searchContainer: { marginBottom: '10px' },
  searchInput: { width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '11px', boxSizing: 'border-box' },
  filterChipRow: { display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '12px', paddingBottom: '4px' },
  chipActive: { padding: '6px 12px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '16px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  chipInactive: { padding: '6px 12px', backgroundColor: '#E2E8F0', color: '#475569', border: 'none', borderRadius: '16px', fontSize: '10px', fontWeight: '600', cursor: 'pointer' },
  cardList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  hotlineCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '12px' },
  cardTopRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  categoryBadge: { fontSize: '9px', fontWeight: '800', color: '#475569', backgroundColor: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' },
  availTag: { fontSize: '10px', fontWeight: '800', color: '#15803D', backgroundColor: '#DCFCE7', padding: '2px 6px', borderRadius: '4px' },
  unitName: { fontSize: '13px', fontWeight: '800', color: '#0F172A', margin: '6px 0 2px 0' },
  unitNumber: { fontSize: '11px', color: '#0F766E', fontWeight: '800', marginBottom: '4px' },
  cardDescText: { fontSize: '10px', color: '#475569', margin: '0 0 6px 0', lineHeight: '1.3' },
  protocolNoteBox: { backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '6px', padding: '6px 8px', fontSize: '10px', color: '#92400E', marginBottom: '8px' },
  btnRow: { display: 'flex', gap: '6px' },
  callBtn: { flex: 1, backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', padding: '8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  mapTrackerBtn: { flex: 1, backgroundColor: '#CCFBF1', border: '1px solid #99F6E4', color: '#0F766E', padding: '8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }
};
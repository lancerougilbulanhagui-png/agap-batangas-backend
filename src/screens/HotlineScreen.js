import React, { useState, useEffect } from 'react';

export default function HotlinesScreen({ onBack }) {
  const [userLocationText, setUserLocationText] = useState('Detecting current sector...');
  const [activeCategory, setActiveCategory] = useState('ALL');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(4);
          const lng = pos.coords.longitude.toFixed(4);
          setUserLocationText(`Live Sector (${lat} N, ${lng} E)`);
        },
        () => setUserLocationText('Batangas City Emergency Area')
      );
    }
  }, []);

  const openDepartmentInGoogleMaps = (searchQuery) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`, '_blank');
  };

  const hotlines = [
    {
      id: '1',
      name: 'CDRRMO Batangas Command Center',
      number: '(043) 723-1511',
      availability: '24 Hours / 7 Days Open',
      category: 'RESCUE',
      mapQuery: 'CDRRMO Batangas City Hall'
    },
    {
      id: '2',
      name: 'BFP Alangilan Fire Sub-Station',
      number: '(043) 723-2333',
      availability: '24 Hours Emergency Service',
      category: 'FIRE',
      mapQuery: 'BFP Alangilan Fire Station Batangas'
    },
    {
      id: '3',
      name: 'PNP Batangas City Station 2',
      number: '0998-598-5711',
      availability: '24/7 Police Dispatch',
      category: 'POLICE',
      mapQuery: 'PNP Batangas City Station 2'
    },
    {
      id: '4',
      name: 'Batangas Medical Center (BatMC) ER',
      number: '(043) 740-8300',
      availability: '24/7 Emergency Room',
      category: 'MEDICAL',
      mapQuery: 'Batangas Medical Center Kumintang'
    },
    {
      id: '5',
      name: 'Philippine Red Cross - Batangas Chapter',
      number: '(043) 723-3027',
      availability: '8:00 AM - 5:00 PM Daily',
      category: 'RESCUE',
      mapQuery: 'Red Cross Batangas Chapter'
    },
    {
      id: '6',
      name: 'BATELEC II Electric Co-op Emergency Hotline',
      number: '(043) 756-1424',
      availability: '24/7 Power Outage Assistance',
      category: 'UTILITY',
      mapQuery: 'BATELEC II Batangas'
    }
  ];

  const filteredHotlines = hotlines.filter(
    (h) => activeCategory === 'ALL' || h.category === activeCategory
  );

  return (
    <div style={styles.container}>
      <div style={styles.navHeader}>
        <button style={styles.backBtn} onClick={onBack}>
          &lt; Back
        </button>
        <div>
          <h2 style={styles.headerTitle}>Emergency Hotlines</h2>
          <div style={styles.headerSub}>{userLocationText}</div>
        </div>
      </div>

      <div style={styles.filterChipRow}>
        {['ALL', 'RESCUE', 'FIRE', 'POLICE', 'MEDICAL', 'UTILITY'].map((cat) => (
          <button
            key={cat}
            style={activeCategory === cat ? styles.chipActive : styles.chipInactive}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={styles.cardList}>
        {filteredHotlines.map((item) => (
          <div key={item.id} style={styles.hotlineCard}>
            <div style={styles.cardTopRow}>
              <span style={styles.categoryBadge}>{item.category}</span>
              <span style={styles.availTag}>{item.availability}</span>
            </div>

            <h3 style={styles.unitName}>{item.name}</h3>
            <div style={styles.unitNumber}>{item.number}</div>

            <div style={styles.btnRow}>
              <a href={`tel:${item.number.replace(/[^0-9+]/g, '')}`} style={styles.callBtn}>
                Call Department Now
              </a>
              <button
                style={styles.mapTrackerBtn}
                onClick={() => openDepartmentInGoogleMaps(item.mapQuery)}
              >
                Suggested Map Tracker
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '440px', margin: '0 auto', padding: '16px', fontFamily: "'Inter', sans-serif" },
  navHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' },
  backBtn: { backgroundColor: 'transparent', border: 'none', color: '#0F766E', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  headerTitle: { fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 },
  headerSub: { fontSize: '11px', color: '#0F766E', fontWeight: '700' },
  filterChipRow: { display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '12px', paddingBottom: '4px' },
  chipActive: { padding: '6px 12px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '16px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  chipInactive: { padding: '6px 12px', backgroundColor: '#E2E8F0', color: '#475569', border: 'none', borderRadius: '16px', fontSize: '10px', fontWeight: '600', cursor: 'pointer' },
  cardList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  hotlineCard: { backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '12px' },
  cardTopRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  categoryBadge: { fontSize: '9px', fontWeight: '800', color: '#475569', backgroundColor: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' },
  availTag: { fontSize: '10px', fontWeight: '800', color: '#15803D', backgroundColor: '#DCFCE7', padding: '2px 6px', borderRadius: '4px' },
  unitName: { fontSize: '13px', fontWeight: '800', color: '#0F172A', margin: '6px 0 2px 0' },
  unitNumber: { fontSize: '12px', color: '#0F766E', fontWeight: '800', marginBottom: '8px' },
  btnRow: { display: 'flex', gap: '6px' },
  callBtn: { flex: 1, textAlign: 'center', backgroundColor: '#0F766E', color: '#FFFFFF', padding: '8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', textDecoration: 'none' },
  mapTrackerBtn: { flex: 1, backgroundColor: '#CCFBF1', border: '1px solid #99F6E4', color: '#0F766E', padding: '8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }
};
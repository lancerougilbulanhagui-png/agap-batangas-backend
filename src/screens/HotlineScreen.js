import React, { useState, useEffect } from 'react';

export default function HotlinesScreen({ onBack }) {
  const [userLocationText, setUserLocationText] = useState('Detecting current GPS location...');
  const [activeCategory, setActiveCategory] = useState('ALL');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(4);
          const lng = pos.coords.longitude.toFixed(4);
          setUserLocationText(`Live Sector (GPS: ${lat} N, ${lng} E)`);
        },
        () => setUserLocationText('Batangas City Emergency Zone')
      );
    }
  }, []);

  const hotlines = [
    { id: '1', name: 'CDRRMO Batangas Command Center', number: '(043) 723-1511', category: 'RESCUE', distance: '1.2 km (Nearest)' },
    { id: '2', name: 'BFP Alangilan Fire Sub-Station', number: '(043) 723-2333', category: 'FIRE', distance: '1.8 km' },
    { id: '3', name: 'PNP Batangas City Station 2', number: '0998-598-5711', category: 'POLICE', distance: '2.4 km' },
    { id: '4', name: 'Batangas Medical Center ER', number: '(043) 740-8300', category: 'MEDICAL', distance: '3.1 km' }
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
        {['ALL', 'RESCUE', 'FIRE', 'POLICE', 'MEDICAL'].map((cat) => (
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
              <span style={styles.distTag}>{item.distance}</span>
              <span style={styles.categoryBadge}>{item.category}</span>
            </div>

            <h3 style={styles.unitName}>{item.name}</h3>
            <div style={styles.unitNumber}>{item.number}</div>

            <a href={`tel:${item.number.replace(/[^0-9+]/g, '')}`} style={styles.callBtn}>
              Call Department Now
            </a>
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
  distTag: { fontSize: '10px', fontWeight: '800', color: '#15803D', backgroundColor: '#DCFCE7', padding: '2px 6px', borderRadius: '4px' },
  categoryBadge: { fontSize: '9px', fontWeight: '800', color: '#475569', backgroundColor: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' },
  unitName: { fontSize: '13px', fontWeight: '800', color: '#0F172A', margin: '6px 0 2px 0' },
  unitNumber: { fontSize: '12px', color: '#0F766E', fontWeight: '800', marginBottom: '8px' },
  callBtn: { display: 'block', textAlign: 'center', backgroundColor: '#0F766E', color: '#FFFFFF', padding: '8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', textDecoration: 'none' }
};
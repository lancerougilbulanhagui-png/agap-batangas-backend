import React, { useState, useEffect } from 'react';

/**
 * Project AGAP Batangas - Emergency Hotline & Department Directory
 * Clean UI with Comparative Directions Map from BSU Alangilan CICS Building
 */
export default function HotlineScreen({ onBack }) {
  const userOrigin = {
    name: 'BSU Alangilan CICS Building',
    coords: '13.7850, 121.0740'
  };

  const [userLocation, setUserLocation] = useState({
    name: 'My Live GPS Position',
    lat: 13.7850,
    lng: 121.0740,
    isLive: false
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            name: 'Live GPS Active',
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            isLive: true
          });
        },
        (err) => console.log('GPS Fallback:', err.message)
      );
    }
  }, []);

  const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggested, setShowSuggested] = useState(false);
  const [activeMapDeptId, setActiveMapDeptId] = useState(null);



  const allHotlines = [
    {
      id: 'HOT-1',
      name: 'CDRRMO Batangas Disaster Command Center',
      category: 'DISASTER_LGU',
      number: '(043) 702-3900',
      email: 'cdrmmo@batangascity.gov.ph',
      webLink: 'https://batangascity.gov.ph/cdrmmo',
      webLabel: 'batangascity.gov.ph/cdrmmo',
      coordinates: '13.7560, 121.0580',
      availability: '24/7 Active Command',
      description: 'Citywide disaster monitoring, river flood warnings, typhoon relief management, and emergency rescue vehicle dispatch.',
      protocolNote: 'When calling, state exact landmarks and the number of individuals requiring assistance.'
    },
    {
      id: 'HOT-2',
      name: 'Batangas City Police Headquarters (PNP Main)',
      category: 'POLICE',
      number: '(043) 723-2411',
      email: 'pnp.batangascity@pnp.gov.ph',
      webLink: 'https://facebook.com/PNPBatangasCity',
      webLabel: 'facebook.com/PNPBatangasCity',
      coordinates: '13.7540, 121.0550',
      availability: '24/7 Rapid Patrol',
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
      webLabel: 'bfp.gov.ph',
      coordinates: '13.7550, 121.0570',
      availability: '24/7 Station Duty',
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
      webLabel: 'batmc.doh.gov.ph',
      coordinates: '13.7565, 121.0583',
      availability: '24/7 Level 3 ER',
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
      webLabel: 'redcross.org.ph',
      coordinates: '13.7580, 121.0600',
      availability: '24/7 Blood & Rescue',
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
      webLabel: 'coastguard.gov.ph',
      coordinates: '13.7533, 121.0456',
      availability: '24/7 Maritime Desk',
      description: 'Coastal flood evacuation, riverfront search and rescue, port passenger safety enforcement, and maritime emergency response.',
      protocolNote: 'Handles official sea travel cancellation notices during bad weather.'
    }
,
{"id": "DEPT-1", "name": "24/7 EBD / Mayor's Action Center (MAC) Health Hotline", "category": "MEDICAL", "number": "0999-222-6626", "email": "info@batangascity.gov.ph", "webLink": "batangascity.gov.ph", "webLabel": "batangascity.gov.ph", "coordinates": "13.7560, 121.0580", "availability": "24/7", "description": "Dedicated helpline launched to provide fast, round-the-clock emergency health medical assistance, hospital referrals, and senior care services.", "protocolNote": "Official municipal assistance desk."},
{"id": "DEPT-2", "name": "Batangas Provincial Health Office (PHO)", "category": "MEDICAL", "number": "0917-843-7772 / 0917-843-7816 / 0917-843-7951", "email": "info@batangascity.gov.ph", "webLink": "batangascity.gov.ph", "webLabel": "batangascity.gov.ph", "coordinates": "13.7590, 121.0580", "availability": "Office Hours", "description": "Manages the overall health programs, rural health units, and provincial medical distribution across the province.", "protocolNote": "Official municipal assistance desk."},
{"id": "DEPT-3", "name": "Office of the City Health Officer (Batangas City)", "category": "MEDICAL", "number": "(043) 723-3103", "email": "info@batangascity.gov.ph", "webLink": "batangascity.gov.ph", "webLabel": "batangascity.gov.ph", "coordinates": "13.7620, 121.0580", "availability": "Office Hours", "description": "Handles local localized city health centers, sanitary permits, public health safety programs, and medical consultations.", "protocolNote": "Official municipal assistance desk."},
{"id": "DEPT-4", "name": "Batangas Medical Center (BatMC)", "category": "MEDICAL", "number": "(043) 723-0911 / (043) 740-8307", "email": "info@batangascity.gov.ph", "webLink": "batangascity.gov.ph", "webLabel": "batangascity.gov.ph", "coordinates": "13.7650, 121.0580", "availability": "24/7 (Emergency ER Services)", "description": "The major public tertiary hospital providing emergency medical services, surgery, and intensive care.", "protocolNote": "Official municipal assistance desk."},
{"id": "DEPT-5", "name": "Philippine Red Cross - Batangas Chapter", "category": "MEDICAL", "number": "143 (National) | 0951-282-0000 / (043) 723-3027", "email": "info@batangascity.gov.ph", "webLink": "batangascity.gov.ph", "webLabel": "batangascity.gov.ph", "coordinates": "13.7680, 121.0580", "availability": "24/7", "description": "Provides emergency ambulance transport, first-aid, disaster response, and blood donation services.", "protocolNote": "Official municipal assistance desk."},
{"id": "DEPT-6", "name": "Provincial Disaster Risk Reduction & Management Office (PDRRMO)", "category": "DISASTER_LGU", "number": "0963-367-7425 | (043) 723-6677 / 0917-862-8907", "email": "info@batangascity.gov.ph", "webLink": "batangascity.gov.ph", "webLabel": "batangascity.gov.ph", "coordinates": "13.7710, 121.0580", "availability": "24/7 during disasters / active standby", "description": "Coordinates province-wide disaster preparedness, typhoon alerts, and major rescue operations.", "protocolNote": "Official municipal assistance desk."},
{"id": "DEPT-7", "name": "City Disaster Risk Reduction & Management Office (CDRRMO - Batangas City)", "category": "DISASTER_LGU", "number": "(043) 702-3902 / 0922-801-0776", "email": "info@batangascity.gov.ph", "webLink": "batangascity.gov.ph", "webLabel": "batangascity.gov.ph", "coordinates": "13.7740, 121.0580", "availability": "24/7", "description": "Direct responder for immediate city-level emergency rescues, localized flooding, and environmental hazards.", "protocolNote": "Official municipal assistance desk."},
{"id": "DEPT-8", "name": "Philippine National Police (PNP) - Batangas Provincial Police", "category": "POLICE", "number": "(043) 723-6351 / 0917-708-0202", "email": "info@batangascity.gov.ph", "webLink": "batangascity.gov.ph", "webLabel": "batangascity.gov.ph", "coordinates": "13.7770, 121.0580", "availability": "24/7", "description": "Maintains law and order, handles provincial crime cases, and coordinates public safety checkpoints.", "protocolNote": "Official municipal assistance desk."},
{"id": "DEPT-9", "name": "Batangas City Police Station", "category": "POLICE", "number": "(043) 723-2030 / 0916-429-1515", "email": "info@batangascity.gov.ph", "webLink": "batangascity.gov.ph", "webLabel": "batangascity.gov.ph", "coordinates": "13.7560, 121.0610", "availability": "24/7", "description": "Local police force handling immediate crime reports, domestic disputes, theft, and community policing within the city.", "protocolNote": "Official municipal assistance desk."},
{"id": "DEPT-10", "name": "Bureau of Fire Protection (BFP) - Batangas City", "category": "FIRE", "number": "(043) 425-7163 / 0915-602-1984", "email": "info@batangascity.gov.ph", "webLink": "batangascity.gov.ph", "webLabel": "batangascity.gov.ph", "coordinates": "13.7590, 121.0610", "availability": "24/7", "description": "Rushes to fire suppression emergencies, conducts fire safety inspections, and handles earthquake rescue operations.", "protocolNote": "Official municipal assistance desk."},
{"id": "DEPT-11", "name": "Philippine Coast Guard (PCG) - Batangas Station", "category": "DISASTER_LGU", "number": "(043) 722-0485 / 0956-904-6653", "email": "info@batangascity.gov.ph", "webLink": "batangascity.gov.ph", "webLabel": "batangascity.gov.ph", "coordinates": "13.7620, 121.0610", "availability": "24/7", "description": "Handles maritime search and rescue, sea travel safety regulations, and coastal monitoring.", "protocolNote": "Official municipal assistance desk."},
{"id": "DEPT-12", "name": "Provincial Social Welfare and Development Office (PSWDO)", "category": "DISASTER_LGU", "number": "(043) 726-0074 / (043) 723-5025", "email": "info@batangascity.gov.ph", "webLink": "batangascity.gov.ph", "webLabel": "batangascity.gov.ph", "coordinates": "13.7650, 121.0610", "availability": "Office Hours", "description": "Manages relief distribution during typhoons, burial assistance, senior citizen support, and child protection services.", "protocolNote": "Official municipal assistance desk."},
{"id": "DEPT-13", "name": "Violence Against Women and Children (VAWC) Desk", "category": "DISASTER_LGU", "number": "0956-826-7017", "email": "info@batangascity.gov.ph", "webLink": "batangascity.gov.ph", "webLabel": "batangascity.gov.ph", "coordinates": "13.7680, 121.0610", "availability": "24/7 for crisis emergencies", "description": "Specialized protection hotline for individuals reporting domestic violence, harassment, or abuse.", "protocolNote": "Official municipal assistance desk."},
{"id": "DEPT-14", "name": "Office of the Provincial Governor", "category": "DISASTER_LGU", "number": "(043) 786-1288 / (043) 703-0115", "email": "info@batangascity.gov.ph", "webLink": "batangascity.gov.ph", "webLabel": "batangascity.gov.ph", "coordinates": "13.7710, 121.0610", "availability": "Office Hours", "description": "The primary executive office of the province handling public requests, official policies, and executive assistance.", "protocolNote": "Official municipal assistance desk."},
{"id": "DEPT-15", "name": "Mayor's Action Center (General Concerns)", "category": "DISASTER_LGU", "number": "(043) 723-1511 / (043) 786-1920", "email": "info@batangascity.gov.ph", "webLink": "batangascity.gov.ph", "webLabel": "batangascity.gov.ph", "coordinates": "13.7740, 121.0610", "availability": "Office Hours", "description": "Handles general community complaints, local administrative inquiries, and requests for local city permits.", "protocolNote": "Official municipal assistance desk."},
{"id": "DEPT-16", "name": "PrimeWater Batangas City (Water Supply)", "category": "DISASTER_LGU", "number": "0949-414-2633", "email": "info@batangascity.gov.ph", "webLink": "batangascity.gov.ph", "webLabel": "batangascity.gov.ph", "coordinates": "13.7770, 121.0610", "availability": "24/7 for emergency leaks", "description": "Public utility contacts for broken pipe reporting, billing inquiries, and water service interruptions.", "protocolNote": "Official municipal assistance desk."},
{"id": "DEPT-17", "name": "Meralco Batangas (Power Supply)", "category": "DISASTER_LGU", "number": "16211", "email": "info@batangascity.gov.ph", "webLink": "batangascity.gov.ph", "webLabel": "batangascity.gov.ph", "coordinates": "13.7560, 121.0640", "availability": "24/7", "description": "Reports power outages, downed lines, electrical faults, or billing issues.", "protocolNote": "Official municipal assistance desk."},
{"id": "DEPT-18", "name": "DepEd Batangas Province Division Office", "category": "DISASTER_LGU", "number": "(043) 722-1840", "email": "info@batangascity.gov.ph", "webLink": "batangascity.gov.ph", "webLabel": "batangascity.gov.ph", "coordinates": "13.7590, 121.0640", "availability": "Office Hours (Mon\u2013Fri, 8 AM\u20135 PM)", "description": "Handles public elementary/secondary school enrollment, teacher concerns, and public curriculum adjustments for the province.", "protocolNote": "Official municipal assistance desk."},
{"id": "DEPT-19", "name": "Colegio ng Lungsod ng Batangas (CLB)", "category": "DISASTER_LGU", "number": "(043) 402-1442 to 1450", "email": "info@batangascity.gov.ph", "webLink": "batangascity.gov.ph", "webLabel": "batangascity.gov.ph", "coordinates": "13.7620, 121.0640", "availability": "Office Hours", "description": "The city-run public college offering higher education programs and local tertiary scholarships to qualified city residents.", "protocolNote": "Official municipal assistance desk."},
{"id": "DEPT-20", "name": "Provincial Library", "category": "DISASTER_LGU", "number": "Accessible via the main Capitol trunkline at (043) 741-1430", "email": "info@batangascity.gov.ph", "webLink": "batangascity.gov.ph", "webLabel": "batangascity.gov.ph", "coordinates": "13.7650, 121.0640", "availability": "Office Hours", "description": "Free public study facilities, research assistance, and historical data archiving.", "protocolNote": "Official municipal assistance desk."},
{"id": "DEPT-21", "name": "Office of the City Agriculturist / City Agriculture Office", "category": "DISASTER_LGU", "number": "(043) 984-1650 / 984-1649", "email": "info@batangascity.gov.ph", "webLink": "batangascity.gov.ph", "webLabel": "batangascity.gov.ph", "coordinates": "13.7680, 121.0640", "availability": "Office Hours", "description": "Provides public distribution of free crop seeds, farming technology assistance, and subsidies to local farmers.", "protocolNote": "Official municipal assistance desk."},
{"id": "DEPT-22", "name": "City Veterinary Office / Office of the City Veterinarian", "category": "MEDICAL", "number": "Local city directory at (043) 723-1511", "email": "info@batangascity.gov.ph", "webLink": "batangascity.gov.ph", "webLabel": "batangascity.gov.ph", "coordinates": "13.7710, 121.0640", "availability": "Office Hours", "description": "Free public anti-rabies vaccinations for pets, livestock health checkups, and animal disease control.", "protocolNote": "Official municipal assistance desk."},
{"id": "DEPT-23", "name": "Office of the City Environment & Natural Resources Officer (ENRO)", "category": "DISASTER_LGU", "number": "(043) 723-8844", "email": "info@batangascity.gov.ph", "webLink": "batangascity.gov.ph", "webLabel": "batangascity.gov.ph", "coordinates": "13.7740, 121.0640", "availability": "Office Hours", "description": "Oversees public garbage collection routes, local waste management compliance, and environmental sanitation issues.", "protocolNote": "Official municipal assistance desk."},
{"id": "DEPT-24", "name": "Business Permits & Licensing Office (BPLO - Batangas City)", "category": "DISASTER_LGU", "number": "(043) 723-2252", "email": "info@batangascity.gov.ph", "webLink": "batangascity.gov.ph", "webLabel": "batangascity.gov.ph", "coordinates": "13.7770, 121.0640", "availability": "Office Hours", "description": "For citizens needing to register a local business, secure business permits, or process commercial operating licenses.", "protocolNote": "Official municipal assistance desk."},
{"id": "DEPT-25", "name": "Office of the City Civil Registrar", "category": "DISASTER_LGU", "number": "(043) 723-4439 / 723-2349", "email": "info@batangascity.gov.ph", "webLink": "batangascity.gov.ph", "webLabel": "batangascity.gov.ph", "coordinates": "13.7560, 121.0670", "availability": "Office Hours", "description": "The public desk responsible for issuing and registering certified copies of Birth, Marriage, and Death Certificates.", "protocolNote": "Official municipal assistance desk."},
{"id": "DEPT-26", "name": "Land Transportation Office (LTO) - Batangas City District", "category": "DISASTER_LGU", "number": "(043) 740-9738", "email": "info@batangascity.gov.ph", "webLink": "batangascity.gov.ph", "webLabel": "batangascity.gov.ph", "coordinates": "13.7590, 121.0670", "availability": "Office Hours", "description": "National government office handling public vehicle registration, emission requirements, and driver's licensing.", "protocolNote": "Official municipal assistance desk."},
{"id": "DEPT-27", "name": "Office of the City Engineer", "category": "DISASTER_LGU", "number": "(043) 723-6882 / 980-6615", "email": "info@batangascity.gov.ph", "webLink": "batangascity.gov.ph", "webLabel": "batangascity.gov.ph", "coordinates": "13.7620, 121.0670", "availability": "Office Hours", "description": "Handles local public building permits, electrical/plumbing structural inspections, and reports of damaged city-maintained roads.", "protocolNote": "Official municipal assistance desk."},
{"id": "DEPT-28", "name": "Batangas Provincial Information Office (PIO)", "category": "DISASTER_LGU", "number": "0917-502-5473 / 0928-521-1318", "email": "info@batangascity.gov.ph", "webLink": "batangascity.gov.ph", "webLabel": "batangascity.gov.ph", "coordinates": "13.7650, 121.0670", "availability": "Office Hours (Extends to 24/7 during active disaster situations)", "description": "Disseminates official public provincial announcements, typhoon warnings, and governor policies.", "protocolNote": "Official municipal assistance desk."},
{"id": "DEPT-29", "name": "Provincial Tourism and Cultural Affairs Office", "category": "DISASTER_LGU", "number": "(043) 723-4144", "email": "info@batangascity.gov.ph", "webLink": "batangascity.gov.ph", "webLabel": "batangascity.gov.ph", "coordinates": "13.7680, 121.0670", "availability": "24/7", "description": "Alternative emergency destination hospital handling local medical response backups.", "protocolNote": "Official municipal assistance desk."}
  ];


  const alangilanNearestResponders = [...allHotlines].map(item => {
    const parts = (item.coordinates || '13.7560, 121.0580').split(',');
    const dLat = parseFloat(parts[0]);
    const dLng = parseFloat(parts[1]);
    const dist = calculateDistanceKm(userLocation.lat, userLocation.lng, dLat, dLng);
    return {
      ...item,
      badge: item.category.replace('_', ' '),
      distance: dist.toFixed(1) + ' km away',
      numericDist: dist,
      address: item.name + ', Batangas City',
      details: item.description
    };
  }).sort((a, b) => a.numericDist - b.numericDist).slice(0, 5);


  const filteredHotlines = allHotlines.filter(item => {
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesQuery = searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const handleCall = (phoneNumber) => {
    window.location.href = `tel:${phoneNumber.replace(/[^0-9+]/g, '')}`;
  };

  const toggleDeptMap = (id) => {
    setActiveMapDeptId(activeMapDeptId === id ? null : id);
  };

  return (
    <div style={styles.container}>
      {/* Navigation Header */}
      <div style={styles.navHeader}>
        <button style={styles.backBtn} onClick={onBack}>
          &lt; Back
        </button>
        <div>
          <h2 style={styles.headerTitle}>Emergency Hotlines</h2>
          <div style={styles.headerSub}>Batangas City Responders Directory</div>
        </div>
      </div>

      {/* Clean Online Status Bar */}
      <div style={styles.cleanStatusBar}>
        <div style={styles.statusLeft}>
          <span style={styles.onlineDot}>●</span>
          <span style={styles.onlineText}>System Online</span>
        </div>
        <div style={styles.locationTag}>
          📍 Batangas City, Philippines
        </div>
      </div>

      {/* Collapsible Suggested Departments Banner */}
      <div style={styles.suggestedContainer}>
        <button
          style={styles.toggleSuggestedBtn}
          onClick={() => setShowSuggested(!showSuggested)}
        >
          <div style={styles.toggleBtnLeft}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F766E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <span>Show Suggested Departments Near My Location</span>
          </div>
          <span style={styles.chevronIcon}>{showSuggested ? '▲' : '▼'}</span>
        </button>

        {showSuggested && (
          <div style={styles.suggestedDropdownContent}>
            <div style={styles.suggestedSubtitle}>
              4 Nearest Emergency Responders to Your Location:
            </div>

            <div style={styles.suggestedCardsList}>
              {alangilanNearestResponders.map((resp) => {
                const isMapOpen = activeMapDeptId === resp.id;
                const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(resp.coordinates)}&t=m&z=15&ie=UTF8&iwloc=&output=embed`;

                return (
                  <div key={resp.id} style={styles.nearestCard}>
                    <div style={styles.nearestCardHeader}>
                      <span style={styles.badgeLabel}>{resp.badge}</span>
                      <span style={styles.distText}>{resp.distance}</span>
                    </div>

                    <h4 style={styles.nearestName}>{resp.name}</h4>
                    <div style={styles.addressText}>{resp.address}</div>

                    <div style={styles.timeBadgeRow}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0F766E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 16 14"/>
                      </svg>
                      <span style={styles.timeText}>{resp.availability}</span>
                    </div>

                    <p style={styles.detailedDesc}>{resp.details}</p>

                    <div style={styles.extraContactsBox}>
                      <div style={styles.contactItemRow}>
                        <div style={styles.contactLabelWrapper}>
                          <span style={styles.contactMetaLabel}>Email:</span>
                        </div>
                        <a href={`mailto:${resp.email}`} style={styles.contactMetaLink}>{resp.email}</a>
                      </div>

                      <div style={styles.contactItemRow}>
                        <div style={styles.contactLabelWrapper}>
                          <span style={styles.contactMetaLabel}>Website:</span>
                        </div>
                        <a href={resp.webLink} target="_blank" rel="noreferrer" style={styles.contactMetaLink}>{resp.webLabel}</a>
                      </div>
                    </div>

                    <button
                      style={isMapOpen ? styles.mapToggleBtnActive : styles.mapToggleBtn}
                      onClick={() => toggleDeptMap(resp.id)}
                    >
                      <span>{isMapOpen ? 'Hide Location Map' : 'View Location Map'}</span>
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
                        <div style={styles.mapCaptionTag}>
                          📍 {resp.name} ({resp.coordinates})
                        </div>
                      </div>
                    )}

                    <button
                      style={styles.callButtonPrimary}
                      onClick={() => handleCall(resp.number)}
                    >
                      <span>Call • {resp.number}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search department, police, hospital, fire..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
        {searchQuery && (
          <button style={styles.clearSearchBtn} onClick={() => setSearchQuery('')}>
            ✕
          </button>
        )}
      </div>

      {/* Category Filter Bar */}
      <div style={styles.filterBar}>
        {[
          { key: 'ALL', label: 'ALL (6)' },
          { key: 'POLICE', label: 'POLICE' },
          { key: 'FIRE', label: 'FIRE' },
          { key: 'MEDICAL', label: 'MEDICAL' },
          { key: 'DISASTER_LGU', label: 'DISASTER / LGU' }
        ].map((cat) => (
          <button
            key={cat.key}
            style={selectedCategory === cat.key ? styles.filterActive : styles.filterInactive}
            onClick={() => setSelectedCategory(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Directory List */}
      <div style={styles.hotlineList}>
        <div style={styles.directoryHeaderTitle}>
          Showing {filteredHotlines.length} Emergency Departments
        </div>

        {filteredHotlines.map((item) => {
          const isMapOpen = activeMapDeptId === item.id;
          const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(item.coordinates)}&t=m&z=15&ie=UTF8&iwloc=&output=embed`;

          return (
            <div key={item.id} style={styles.directoryCard}>
              <div style={styles.cardTopRow}>
                <span style={styles.categoryBadge}>{item.category.replace('_', ' ')}</span>
                <span style={styles.timeText}>{item.availability}</span>
              </div>

              <h4 style={styles.deptTitle}>{item.name}</h4>
              <p style={styles.deptDescription}>{item.description}</p>
              
              {item.protocolNote && (
                <div style={styles.protocolBox}>
                  <strong>Caller Guidance:</strong> {item.protocolNote}
                </div>
              )}

              <div style={styles.extraContactsBox}>
                <div style={styles.contactItemRow}>
                  <div style={styles.contactLabelWrapper}>
                    <span style={styles.contactMetaLabel}>Email:</span>
                  </div>
                  <a href={`mailto:${item.email}`} style={styles.contactMetaLink}>{item.email}</a>
                </div>

                <div style={styles.contactItemRow}>
                  <div style={styles.contactLabelWrapper}>
                    <span style={styles.contactMetaLabel}>Website:</span>
                  </div>
                  <a href={item.webLink} target="_blank" rel="noreferrer" style={styles.contactMetaLink}>{item.webLabel}</a>
                </div>
              </div>

              <button
                style={isMapOpen ? styles.mapToggleBtnActive : styles.mapToggleBtn}
                onClick={() => toggleDeptMap(item.id)}
              >
                <span>{isMapOpen ? 'Hide Location Map ▲' : 'Compare Location & Directions Map ▼'}</span>
              </button>

              {isMapOpen && (
                <div style={styles.mapEmbedContainer}>
                  <div style={styles.mapHeaderBanner}>
                    ORIGIN: {userOrigin.name} ➔ DESTINATION: {item.name}
                  </div>
                  <iframe
                    title={`Map for ${item.name}`}
                    width="100%"
                    height="180"
                    frameBorder="0"
                    scrolling="no"
                    src={mapUrl}
                    style={styles.mapIframe}
                  ></iframe>
                  <div style={styles.mapCaptionTag}>
                    📍 {item.name} ({item.coordinates})
                  </div>
                </div>
              )}

              <div style={styles.cardFooter}>
                <span style={styles.phoneDisplay}>{item.number}</span>
                <button
                  style={styles.dialButton}
                  onClick={() => handleCall(item.number)}
                >
                  Call
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
  navHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' },
  backBtn: { backgroundColor: 'transparent', border: 'none', color: '#0F766E', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  headerTitle: { fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 },
  headerSub: { fontSize: '11px', color: '#64748B' },
  cleanStatusBar: { backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
  statusLeft: { display: 'flex', alignItems: 'center', gap: '6px' },
  onlineDot: { color: '#10B981', fontSize: '12px' },
  onlineText: { fontSize: '11px', fontWeight: '800', color: '#15803D' },
  locationTag: { fontSize: '11px', fontWeight: '700', color: '#475569' },
  suggestedContainer: { marginBottom: '16px' },
  toggleSuggestedBtn: { width: '100%', padding: '12px 14px', backgroundColor: '#FFFFFF', border: '1px solid #0F766E', borderRadius: '12px', color: '#0F766E', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  toggleBtnLeft: { display: 'flex', alignItems: 'center', gap: '8px' },
  chevronIcon: { fontSize: '11px', color: '#0F766E' },
  suggestedDropdownContent: { marginTop: '10px', backgroundColor: '#F1F5F9', borderRadius: '14px', padding: '12px', border: '1px solid #CBD5E1' },
  suggestedSubtitle: { fontSize: '11px', fontWeight: '800', color: '#334155', marginBottom: '10px' },
  suggestedCardsList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  nearestCard: { backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px' },
  nearestCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' },
  badgeLabel: { fontSize: '9px', fontWeight: '800', backgroundColor: '#F1F5F9', color: '#334155', padding: '2px 6px', borderRadius: '4px' },
  distText: { fontSize: '11px', fontWeight: '800', color: '#0F766E' },
  nearestName: { fontSize: '13px', fontWeight: '800', color: '#0F172A', margin: '2px 0' },
  addressText: { fontSize: '11px', color: '#64748B', marginBottom: '6px' },
  timeBadgeRow: { display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' },
  timeText: { fontSize: '11px', fontWeight: '700', color: '#0F766E' },
  detailedDesc: { fontSize: '11px', color: '#475569', lineHeight: '1.4', margin: '0 0 8px 0' },
  extraContactsBox: { backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 12px', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '6px' },
  contactItemRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  contactLabelWrapper: { width: '60px', flexShrink: 0 },
  contactMetaLabel: { color: '#64748B', fontWeight: '700', fontSize: '11px' },
  contactMetaLink: { color: '#0F766E', fontWeight: '700', fontSize: '11px', textDecoration: 'none' },
  mapToggleBtn: { width: '100%', padding: '8px', backgroundColor: '#F0FDF4', color: '#0F766E', border: '1px solid #CCFBF1', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', marginBottom: '10px' },
  mapToggleBtnActive: { width: '100%', padding: '8px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', marginBottom: '10px' },
  mapEmbedContainer: { borderRadius: '10px', overflow: 'hidden', border: '1px solid #CBD5E1', marginBottom: '10px', backgroundColor: '#0F172A' },
  mapHeaderBanner: { backgroundColor: '#1E293B', color: '#38BDF8', fontSize: '9px', fontWeight: '800', padding: '6px', textAlign: 'center' },
  mapIframe: { display: 'block', border: 'none' },
  mapCaptionTag: { backgroundColor: '#1E293B', color: '#38BDF8', fontSize: '10px', fontWeight: '700', padding: '4px 8px', textAlign: 'center' },
  callButtonPrimary: { width: '100%', padding: '9px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' },
  searchContainer: { position: 'relative', marginBottom: '12px' },
  searchInput: { width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '12px', outline: 'none', boxSizing: 'border-box' },
  clearSearchBtn: { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontWeight: '800', cursor: 'pointer' },
  filterBar: { display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '14px' },
  filterActive: { padding: '8px 12px', backgroundColor: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap' },
  filterInactive: { padding: '8px 12px', backgroundColor: '#E2E8F0', color: '#475569', border: 'none', borderRadius: '8px', fontSize: '10px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' },
  hotlineList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  directoryHeaderTitle: { fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '2px' },
  directoryCard: { backgroundColor: '#FFFFFF', padding: '14px', borderRadius: '14px', border: '1px solid #E2E8F0' },
  cardTopRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  categoryBadge: { fontSize: '9px', fontWeight: '800', backgroundColor: '#F1F5F9', color: '#334155', padding: '2px 6px', borderRadius: '4px' },
  deptTitle: { fontSize: '14px', fontWeight: '800', color: '#0F172A', margin: '0 0 6px 0' },
  deptDescription: { fontSize: '12px', color: '#475569', lineHeight: '1.4', margin: '0 0 8px 0' },
  protocolBox: { backgroundColor: '#F8FAFC', borderLeft: '3px solid #0F766E', padding: '6px 8px', borderRadius: '4px', fontSize: '11px', color: '#334155', marginBottom: '10px' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #F1F5F9' },
  phoneDisplay: { fontSize: '13px', fontWeight: '800', color: '#0F766E' },
  dialButton: { backgroundColor: '#0F172A', color: '#FFFFFF', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }
};
const API_BASE_URL = 'http://localhost:8080/api/admin';

/**
 * Fetch all reports from Admin Database
 */
export const fetchAdminReports = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/reports`);
    if (!response.ok) throw new Error('Failed to fetch admin reports');
    return await response.json();
  } catch (err) {
    console.warn('Backend offline, using fallback reports data:', err.message);
    return null; // Signals component to use initial synchronized dataset
  }
};

/**
 * Save updated status (APPROVED / INVESTIGATING / REJECTED)
 */
export const updateReportStatusInDb = async (reportId, status, noticeText) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reports/${reportId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, noticeText })
    });
    return await response.json();
  } catch (err) {
    console.warn('Backend update offline, updating local state:', err.message);
    return { success: true };
  }
};

/**
 * Ban device fingerprint and reject tickets
 */
export const banDeviceInDb = async (deviceId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/devices/${deviceId}/ban`, {
      method: 'POST'
    });
    return await response.json();
  } catch (err) {
    console.warn('Backend ban offline, applying locally:', err.message);
    return { success: true };
  }
};
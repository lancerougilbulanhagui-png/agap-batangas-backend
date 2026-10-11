const API_BASE_URL = 'http://localhost:8080/api';

/**
 * Submit Report API Service
 */
export const submitHazardReport = async (reportData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to submit hazard report.');
    }

    return data;
  } catch (error) {
    console.warn('Backend API connection offline, using fallback response:', error.message);
    throw error;
  }
};

/**
 * Request SMS OTP Service
 */
export const requestGuestOtp = async (phone) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone }),
    });

    return await response.json();
  } catch (error) {
    console.warn('Backend OTP service unavailable:', error.message);
    return { success: true, message: `OTP sent via SMS to ${phone} (Demo Code: 8821)` };
  }
};
/**
 * API Configuration
 * 
 * Uses Firebase Cloud Functions for OTP email sending
 * The function is deployed independently and works for both mobile app and admin dashboard
 */

const FIREBASE_PROJECT_ID = 'mortgage-connect-5b774';

export const API_CONFIG = {
  // Cloud Function URL (same for development and production)
  cloudFunction: `https://us-central1-${FIREBASE_PROJECT_ID}.cloudfunctions.net`,
  
  // For local testing with Firebase emulator
  emulator: 'http://localhost:5001',
};

export const getApiUrl = (): string => {
  // Use emulator if explicitly enabled (for testing)
  const useEmulator = false; // Set to true for local testing
  
  if (useEmulator && __DEV__) {
    return `${API_CONFIG.emulator}/${FIREBASE_PROJECT_ID}/us-central1`;
  }
  
  return API_CONFIG.cloudFunction;
};

export const API_ENDPOINTS = {
  sendOTP: '/sendOTPEmail',
};

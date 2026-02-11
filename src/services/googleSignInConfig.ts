/**
 * Configure Google Sign-In with the web client ID from google-services.json.
 * Must be called once before any Google Sign-In attempt (e.g., in root layout).
 *
 * Uses a lazy require() so the native module is only loaded at runtime,
 * preventing a crash if the native binary hasn't been rebuilt yet.
 */
export function configureGoogleSignIn() {
  try {
    const { GoogleSignin } = require('@react-native-google-signin/google-signin');
    GoogleSignin.configure({
      // Web client ID from google-services.json (client_type: 3)
      webClientId:
        '571691878268-d6sms22kdbvuuhe5b5f39r1jp8tvegoa.apps.googleusercontent.com',
    });
    console.log('[Google Sign-In] Configured with web client ID');
  } catch (error) {
    console.warn(
      '[Google Sign-In] Native module not available. ' +
        'Run "npx expo prebuild --clean && npx expo run:android" to rebuild.',
      error,
    );
  }
}

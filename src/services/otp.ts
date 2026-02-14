import { db, auth } from './firebase';
import {
  signInWithEmailAndPassword,
  signOut,
} from '@react-native-firebase/auth';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from '@react-native-firebase/firestore';
import { getApiUrl, API_ENDPOINTS } from '../config/api';

interface OTPData {
    code: string;
    email: string;
    createdAt: number;
    expiresAt: number;
    attempts: number;
}

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

/**
 * Generate a 6-digit OTP code
 */
function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Sanitize email for use as Firestore document ID
 */
function sanitizeEmail(email: string): string {
    return email.replace(/[.#$[\]]/g, '_');
}

/**
 * Send OTP to user's email
 * This should be called after successful credential verification
 */
export async function sendOTP(email: string, password: string): Promise<void> {
    try {
        // Verify credentials first
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        // Sign out immediately - they need to verify OTP first
        await signOut(auth);

        // Generate OTP
        const code = generateOTP();
        const now = Date.now();

        const otpData: OTPData = {
            code,
            email,
            createdAt: now,
            expiresAt: now + OTP_EXPIRY_MS,
            attempts: 0,
        };

        // Store OTP in Firestore
        const emailKey = sanitizeEmail(email);
        await setDoc(doc(db, 'otps', emailKey), otpData);

        // Send OTP via Resend API (Cloud Function)
        try {
            const apiUrl = getApiUrl();
            const fullUrl = `${apiUrl}${API_ENDPOINTS.sendOTP}`;
            console.log(`Sending OTP to: ${fullUrl}`);
            
            const response = await fetch(fullUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, code, type: 'login' }),
            });

            console.log(`Response status: ${response.status}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                const errorData = JSON.parse(errorText || '{}');
                throw new Error(errorData.error || `Failed to send OTP email (${response.status})`);
            }

            const result = await response.json();
            console.log(`OTP sent successfully to ${email}`, result);
        } catch (emailError: any) {
            console.error('Failed to send OTP email:', emailError);
            console.error('Error details:', emailError.message);
            // Delete the OTP from Firestore if email fails
            await deleteDoc(doc(db, 'otps', emailKey));
            throw new Error(`Failed to send verification email: ${emailError.message}`);
        }
    } catch (error: any) {
        if (
            error.code === 'auth/user-not-found' ||
            error.code === 'auth/wrong-password' ||
            error.code === 'auth/invalid-credential'
        ) {
            throw new Error('Invalid email or password');
        }
        throw error;
    }
}

/**
 * Send OTP for signup (after account creation)
 */
export async function sendSignupOTP(email: string): Promise<void> {
    try {
        // Generate OTP
        const code = generateOTP();
        const now = Date.now();

        const otpData: OTPData = {
            code,
            email,
            createdAt: now,
            expiresAt: now + OTP_EXPIRY_MS,
            attempts: 0,
        };

        // Store OTP in Firestore
        const emailKey = sanitizeEmail(email);
        await setDoc(doc(db, 'otps', emailKey), otpData);

        // Send OTP via Resend API (Cloud Function)
        try {
            const apiUrl = getApiUrl();
            const fullUrl = `${apiUrl}${API_ENDPOINTS.sendOTP}`;
            console.log(`Sending signup OTP to: ${fullUrl}`);
            
            const response = await fetch(fullUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, code, type: 'signup' }),
            });

            console.log(`Response status: ${response.status}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                const errorData = JSON.parse(errorText || '{}');
                throw new Error(errorData.error || `Failed to send OTP email (${response.status})`);
            }

            const result = await response.json();
            console.log(`Signup OTP sent successfully to ${email}`, result);
        } catch (emailError: any) {
            console.error('Failed to send signup OTP email:', emailError);
            console.error('Error details:', emailError.message);
            // Delete the OTP from Firestore if email fails
            await deleteDoc(doc(db, 'otps', emailKey));
            throw new Error(`Failed to send verification email: ${emailError.message}`);
        }
    } catch (error: any) {
        throw new Error('Failed to send OTP');
    }
}

/**
 * Verify OTP code
 */
export async function verifyOTP(email: string, code: string): Promise<void> {
    try {
        const emailKey = sanitizeEmail(email);
        const otpSnap = await getDoc(doc(db, 'otps', emailKey));

        if (!otpSnap.exists()) {
            throw new Error('OTP not found or expired');
        }

        const otpData = otpSnap.data() as OTPData;
        const now = Date.now();

        // Check if OTP is expired
        if (now > otpData.expiresAt) {
            await deleteDoc(doc(db, 'otps', emailKey));
            throw new Error('OTP has expired. Please request a new one.');
        }

        // Check max attempts
        if (otpData.attempts >= MAX_ATTEMPTS) {
            await deleteDoc(doc(db, 'otps', emailKey));
            throw new Error('Too many failed attempts. Please request a new OTP.');
        }

        // Verify code
        if (otpData.code !== code) {
            // Increment attempts
            await updateDoc(doc(db, 'otps', emailKey), { attempts: otpData.attempts + 1 });
            throw new Error('Invalid OTP code');
        }

        // OTP is valid - delete it
        await deleteDoc(doc(db, 'otps', emailKey));
    } catch (error: any) {
        throw error;
    }
}

/**
 * Resend OTP
 */
export async function resendOTP(email: string): Promise<void> {
    try {
        const emailKey = sanitizeEmail(email);

        // Delete existing OTP
        const otpSnap = await getDoc(doc(db, 'otps', emailKey));
        if (otpSnap.exists()) {
            await deleteDoc(doc(db, 'otps', emailKey));
        }

        // Generate new OTP
        const code = generateOTP();
        const now = Date.now();

        const otpData: OTPData = {
            code,
            email,
            createdAt: now,
            expiresAt: now + OTP_EXPIRY_MS,
            attempts: 0,
        };

        await setDoc(doc(db, 'otps', emailKey), otpData);

        // Send new OTP via Resend API (Cloud Function)
        try {
            const apiUrl = getApiUrl();
            const fullUrl = `${apiUrl}${API_ENDPOINTS.sendOTP}`;
            console.log(`Resending OTP to: ${fullUrl}`);
            
            const response = await fetch(fullUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, code, type: 'resend' }),
            });

            console.log(`Response status: ${response.status}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                const errorData = JSON.parse(errorText || '{}');
                throw new Error(errorData.error || `Failed to send OTP email (${response.status})`);
            }

            const result = await response.json();
            console.log(`New OTP sent successfully to ${email}`, result);
        } catch (emailError: any) {
            console.error('Failed to send new OTP email:', emailError);
            console.error('Error details:', emailError.message);
            // Delete the OTP from Firestore if email fails
            await deleteDoc(doc(db, 'otps', emailKey));
            throw new Error(`Failed to send verification email: ${emailError.message}`);
        }
    } catch (error: any) {
        throw new Error('Failed to resend OTP');
    }
}

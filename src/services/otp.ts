import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

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
        const userCredential = await auth().signInWithEmailAndPassword(email, password);
        const uid = userCredential.user.uid;

        // Sign out immediately - they need to verify OTP first
        await auth().signOut();

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
        await firestore().collection('otps').doc(emailKey).set(otpData);

        // TODO: In production, trigger a Cloud Function to send email
        // For now, log to console (development only)
        console.log(`OTP for ${email}: ${code}`);
        console.log(`This OTP will expire in 10 minutes`);

        // You can implement email sending via:
        // 1. Firebase Cloud Functions with SendGrid/Mailgun
        // 2. A backend API endpoint
        // 3. Firebase Extensions (Trigger Email)
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
        await firestore().collection('otps').doc(emailKey).set(otpData);

        // TODO: In production, trigger a Cloud Function to send email
        console.log(`OTP for ${email}: ${code}`);
        console.log(`This OTP will expire in 10 minutes`);
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
        const otpDoc = await firestore().collection('otps').doc(emailKey).get();

        if (!otpDoc.exists) {
            throw new Error('OTP not found or expired');
        }

        const otpData = otpDoc.data() as OTPData;
        const now = Date.now();

        // Check if OTP is expired
        if (now > otpData.expiresAt) {
            await firestore().collection('otps').doc(emailKey).delete();
            throw new Error('OTP has expired. Please request a new one.');
        }

        // Check max attempts
        if (otpData.attempts >= MAX_ATTEMPTS) {
            await firestore().collection('otps').doc(emailKey).delete();
            throw new Error('Too many failed attempts. Please request a new OTP.');
        }

        // Verify code
        if (otpData.code !== code) {
            // Increment attempts
            await firestore()
                .collection('otps')
                .doc(emailKey)
                .update({ attempts: otpData.attempts + 1 });
            throw new Error('Invalid OTP code');
        }

        // OTP is valid - delete it
        await firestore().collection('otps').doc(emailKey).delete();
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
        const otpDoc = await firestore().collection('otps').doc(emailKey).get();
        if (otpDoc.exists) {
            await firestore().collection('otps').doc(emailKey).delete();
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

        await firestore().collection('otps').doc(emailKey).set(otpData);

        // TODO: Send email with new OTP
        console.log(`New OTP for ${email}: ${code}`);
        console.log(`This OTP will expire in 10 minutes`);
    } catch (error: any) {
        throw new Error('Failed to resend OTP');
    }
}

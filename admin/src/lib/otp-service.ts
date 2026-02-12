import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

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
    return email.replace(/[.#$[\]]/g, "_");
}

/**
 * Send OTP to user's email
 * In production, this should call a Cloud Function that sends the email
 */
export async function sendOTP(email: string, password: string): Promise<void> {
    try {
        // First verify credentials
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        // Check if user is admin
        const userDoc = await getDoc(doc(db, "users", uid));
        if (!userDoc.exists() || userDoc.data()?.role !== "admin") {
            await auth.signOut();
            throw new Error("Access denied. Admin privileges required.");
        }

        // Sign out immediately - they need to verify OTP first
        await auth.signOut();

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

        // Store OTP in Firestore (sanitize email for use as document ID)
        const emailKey = sanitizeEmail(email);
        await setDoc(doc(db, "otps", emailKey), otpData);

        // Send OTP via Cloud Function
        try {
            const FIREBASE_PROJECT_ID = 'mortgage-connect-5b774';
            const cloudFunctionUrl = `https://us-central1-${FIREBASE_PROJECT_ID}.cloudfunctions.net/sendOTPEmail`;
            
            const response = await fetch(cloudFunctionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, code, type: 'admin' }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to send OTP email');
            }

            console.log(`OTP sent successfully to ${email}`);
        } catch (emailError) {
            console.error('Failed to send OTP email:', emailError);
            // Delete the OTP from Firestore if email fails
            await deleteDoc(doc(db, "otps", emailKey));
            throw new Error('Failed to send verification email. Please try again.');
        }

    } catch (error: any) {
        if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
            throw new Error("Invalid email or password");
        }
        throw error;
    }
}

/**
 * Verify OTP code
 */
export async function verifyOTP(email: string, code: string): Promise<void> {
    try {
        // Find OTP document by email (sanitize email for use as document ID)
        const emailKey = sanitizeEmail(email);
        const otpDocRef = doc(db, "otps", emailKey);
        const otpsSnapshot = await getDoc(otpDocRef);

        if (!otpsSnapshot.exists()) {
            throw new Error("OTP not found or expired");
        }

        const otpData = otpsSnapshot.data() as OTPData;
        const now = Date.now();

        // Debug logging
        console.log('OTP Verification Debug:', {
            currentTime: now,
            expiresAt: otpData.expiresAt,
            createdAt: otpData.createdAt,
            timeRemaining: Math.floor((otpData.expiresAt - now) / 1000) + ' seconds',
            isExpired: now > otpData.expiresAt
        });

        // Check if OTP is expired
        if (now > otpData.expiresAt) {
            await deleteDoc(otpDocRef);
            throw new Error("OTP has expired. Please request a new one.");
        }

        // Check max attempts
        if (otpData.attempts >= MAX_ATTEMPTS) {
            await deleteDoc(otpDocRef);
            throw new Error("Too many failed attempts. Please request a new OTP.");
        }

        // Verify code
        if (otpData.code !== code) {
            // Increment attempts
            await setDoc(
                otpDocRef,
                { attempts: otpData.attempts + 1 },
                { merge: true }
            );
            throw new Error("Invalid OTP code");
        }

        // OTP is valid - delete it
        await deleteDoc(otpDocRef);

        // Note: The actual sign-in will happen in the auth context
        // after successful OTP verification
    } catch (error: any) {
        throw error;
    }
}

/**
 * Resend OTP
 */
export async function resendOTP(email: string): Promise<void> {
    try {
        // Delete existing OTP (sanitize email for use as document ID)
        const emailKey = sanitizeEmail(email);
        const otpDocRef = doc(db, "otps", emailKey);
        const otpsSnapshot = await getDoc(otpDocRef);
        if (otpsSnapshot.exists()) {
            await deleteDoc(otpDocRef);
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

        await setDoc(otpDocRef, otpData);

        // Send new OTP via Cloud Function
        try {
            const FIREBASE_PROJECT_ID = 'mortgage-connect-5b774';
            const cloudFunctionUrl = `https://us-central1-${FIREBASE_PROJECT_ID}.cloudfunctions.net/sendOTPEmail`;
            
            const response = await fetch(cloudFunctionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, code, type: 'admin' }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to send OTP email');
            }

            console.log(`New OTP sent successfully to ${email}`);
        } catch (emailError) {
            console.error('Failed to send new OTP email:', emailError);
            // Delete the OTP from Firestore if email fails
            await deleteDoc(otpDocRef);
            throw new Error('Failed to send verification email. Please try again.');
        }
    } catch (error: any) {
        throw new Error("Failed to resend OTP");
    }
}

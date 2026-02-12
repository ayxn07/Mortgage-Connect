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

        // TODO: In production, call a Cloud Function to send email
        // For now, log to console (in development)
        console.log(`OTP for ${email}: ${code}`);
        console.log(`This OTP will expire in 10 minutes`);

        // You can implement email sending via:
        // 1. Firebase Cloud Functions with SendGrid/Mailgun
        // 2. A backend API endpoint
        // 3. Firebase Extensions (Trigger Email)

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

        // TODO: Send email with new OTP
        console.log(`New OTP for ${email}: ${code}`);
        console.log(`This OTP will expire in 10 minutes`);
    } catch (error: any) {
        throw new Error("Failed to resend OTP");
    }
}

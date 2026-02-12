# Admin OTP Email Verification Setup

## Overview

The admin dashboard now requires email verification with a 6-digit OTP (One-Time Password) for enhanced security.

## How It Works

1. **Login Flow**:
   - Admin enters email and password
   - System verifies credentials and admin role
   - OTP is generated and stored in Firestore
   - Admin is redirected to OTP verification page
   - Admin enters the 6-digit OTP
   - Upon successful verification, admin is signed in

2. **Security Features**:
   - OTP expires after 10 minutes
   - Maximum 5 verification attempts per OTP
   - OTP is deleted after successful verification
   - Credentials are temporarily stored in memory during OTP flow

## Current Implementation

### Development Mode

Currently, the OTP is logged to the browser console for testing purposes:

```
OTP for admin@example.com: 123456
This OTP will expire in 10 minutes
```

### Firestore Structure

OTPs are stored in the `otps` collection:

```
otps/
  {sanitized_email}/
    code: "123456"
    email: "admin@example.com"
    createdAt: 1234567890
    expiresAt: 1234567890
    attempts: 0
```

## Production Setup

To enable email sending in production, you need to implement one of these options:

### Option 1: Firebase Cloud Functions (Recommended)

1. Create a Cloud Function to send emails:

```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as sgMail from '@sendgrid/mail';

admin.initializeApp();
sgMail.setApiKey(functions.config().sendgrid.key);

export const sendOTPEmail = functions.firestore
  .document('otps/{emailKey}')
  .onCreate(async (snap, context) => {
    const otpData = snap.data();

    const msg = {
      to: otpData.email,
      from: 'noreply@mortgageconnect.ae',
      subject: 'Your Admin Login OTP',
      text: `Your OTP code is: ${otpData.code}. It will expire in 10 minutes.`,
      html: `
        <h2>Admin Login Verification</h2>
        <p>Your OTP code is: <strong>${otpData.code}</strong></p>
        <p>This code will expire in 10 minutes.</p>
      `,
    };

    await sgMail.send(msg);
  });
```

2. Deploy the function:

```bash
cd functions
npm install @sendgrid/mail
firebase deploy --only functions
```

3. Set SendGrid API key:

```bash
firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"
```

### Option 2: Firebase Extensions

1. Install the "Trigger Email" extension from Firebase Console
2. Configure SMTP settings or email service provider
3. Update `otp-service.ts` to trigger the extension

### Option 3: Custom Backend API

1. Create an API endpoint that sends emails
2. Update `sendOTP()` and `resendOTP()` in `otp-service.ts`:

```typescript
// Call your API
await fetch('https://your-api.com/send-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, code }),
});
```

## Testing

### Development Testing

1. Login with admin credentials
2. Check browser console for OTP code
3. Enter the OTP on verification page
4. You'll be redirected to dashboard

### Production Testing

1. Ensure email service is configured
2. Test with a real email address
3. Verify email delivery
4. Test OTP expiration (wait 10 minutes)
5. Test max attempts (enter wrong OTP 5 times)
6. Test resend functionality

## Security Considerations

- OTPs are stored with sanitized email keys (dots and special chars replaced)
- OTPs automatically expire after 10 minutes
- Failed attempts are tracked and limited to 5
- Credentials are cleared from memory after sign-in
- Admin role is verified before OTP generation

## Firestore Security Rules

Add these rules to your Firestore:

```javascript
match /otps/{emailKey} {
  // Only allow server-side writes
  allow read, write: if false;
}
```

## Troubleshooting

### OTP not received

- Check browser console in development
- Verify email service configuration in production
- Check spam folder
- Verify Firestore rules allow writes

### "OTP not found or expired"

- OTP may have expired (10 minutes)
- Request a new OTP using "Resend code"

### "Too many failed attempts"

- Maximum 5 attempts per OTP
- Request a new OTP using "Resend code"

### "Session expired"

- Credentials cleared from memory
- Return to login page and start over

# Mobile App OTP Email Verification

## Overview

The mobile app now requires email verification with a 6-digit OTP for login and signup flows. Google OAuth users skip OTP verification.

## Features

### Login Flow

1. User enters email and password
2. Credentials are verified
3. OTP is generated and stored in Firestore
4. User is redirected to OTP verification screen
5. User enters 6-digit OTP
6. Upon success, user is signed in and redirected to home

### Signup Flow

1. User fills registration form
2. Account is created in Firebase Auth
3. User is immediately signed out
4. OTP is generated and stored
5. User is redirected to OTP verification screen
6. User enters 6-digit OTP
7. Upon success, user is signed in and redirected to home

### Google OAuth

- No OTP verification required
- Users proceed directly after Google sign-in

## UI/UX Features

- Clean 6-digit OTP input with auto-focus
- Individual input boxes for each digit
- Auto-advance to next input on entry
- Backspace navigation between inputs
- Visual feedback with border colors
- 60-second countdown for resend
- Haptic feedback on interactions
- Dark mode support
- Responsive error handling

## Security Features

- OTP expires after 10 minutes
- Maximum 5 verification attempts per OTP
- OTP is deleted after successful verification
- Credentials temporarily stored in Zustand during OTP flow
- Credentials cleared after sign-in completion

## File Structure

```
app/auth/
  ├── login.tsx              # Updated to redirect to OTP
  ├── signup.tsx             # Updated to redirect to OTP
  └── verify-otp.tsx         # New OTP verification screen

src/
  ├── services/
  │   └── otp.ts             # OTP service functions
  └── store/
      └── authStore.ts       # Updated with OTP flow support
```

## Firestore Structure

OTPs are stored in the `otps` collection:

```
otps/
  {sanitized_email}/
    code: "123456"
    email: "user@example.com"
    createdAt: 1234567890
    expiresAt: 1234567890
    attempts: 0
```

Email addresses are sanitized by replacing `.#$[]` characters with `_` for use as document IDs.

## Development Testing

Currently, OTPs are logged to the console for testing:

```
OTP for user@example.com: 123456
This OTP will expire in 10 minutes
```

Check your Metro bundler console or device logs to see the OTP.

## Production Setup

To enable email sending in production, implement one of these options:

### Option 1: Firebase Cloud Functions (Recommended)

Create a Cloud Function that triggers when an OTP document is created:

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
      subject: 'Your Verification Code',
      text: `Your verification code is: ${otpData.code}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification</h2>
          <p>Your verification code is:</p>
          <h1 style="font-size: 32px; letter-spacing: 8px; color: #000;">${otpData.code}</h1>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    };

    await sgMail.send(msg);
    console.log(`OTP email sent to ${otpData.email}`);
  });
```

Deploy:

```bash
cd functions
npm install @sendgrid/mail
firebase deploy --only functions
firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"
```

### Option 2: Firebase Extensions

1. Install "Trigger Email" extension from Firebase Console
2. Configure SMTP or email service provider
3. The extension will automatically send emails when OTP documents are created

### Option 3: Custom Backend API

Update `src/services/otp.ts` to call your API:

```typescript
// After storing OTP in Firestore
await fetch('https://your-api.com/send-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, code }),
});
```

## Email Template Suggestions

### Subject Line

- "Your MortgageConnect Verification Code"
- "Verify Your Email - Code Inside"

### Email Body

```
Hi there,

Your verification code for MortgageConnect is:

[123456]

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email or contact support if you have concerns.

Best regards,
The MortgageConnect Team
```

## Firestore Security Rules

Add these rules to protect OTP documents:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /otps/{emailKey} {
      // Only allow server-side writes (Cloud Functions)
      allow read, write: if false;
    }
  }
}
```

## Testing Checklist

### Login Flow

- [ ] Valid credentials redirect to OTP screen
- [ ] Invalid credentials show error
- [ ] OTP verification succeeds with correct code
- [ ] OTP verification fails with wrong code
- [ ] Resend OTP works after countdown
- [ ] OTP expires after 10 minutes
- [ ] Max 5 attempts enforced

### Signup Flow

- [ ] Account creation succeeds
- [ ] User redirected to OTP screen
- [ ] OTP verification completes signup
- [ ] User data saved to Firestore
- [ ] User redirected to home

### Google OAuth

- [ ] No OTP verification required
- [ ] Existing users go directly to home
- [ ] New users complete registration form

### UI/UX

- [ ] Auto-focus works correctly
- [ ] Backspace navigation works
- [ ] Countdown timer displays correctly
- [ ] Haptic feedback works
- [ ] Dark mode styling correct
- [ ] Error messages clear and helpful

## Troubleshooting

### OTP not received

- Check console logs in development
- Verify Cloud Function is deployed in production
- Check email spam folder
- Verify Firestore rules allow writes

### "OTP not found or expired"

- OTP expired (10 minutes)
- Request new OTP using "Resend code"

### "Too many failed attempts"

- Maximum 5 attempts per OTP
- Request new OTP using "Resend code"

### "Session expired"

- Credentials cleared from memory
- Return to login/signup and start over

### Navigation issues

- Ensure `expo-router` is properly configured
- Check that route params are passed correctly

## Future Enhancements

- SMS OTP as alternative to email
- Biometric authentication after first login
- Remember device to skip OTP
- Rate limiting on OTP generation
- Admin dashboard to view OTP analytics
- Customizable OTP expiry time
- Multi-language email templates

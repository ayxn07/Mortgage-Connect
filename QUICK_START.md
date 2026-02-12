# Quick Start - Firebase Cloud Functions Setup

## Prerequisites

- Firebase CLI installed: `npm install -g firebase-tools`
- Firebase project created
- Billing enabled on Firebase project (required for Cloud Functions)

## Step-by-Step Setup

### 1. Get Your Firebase Project ID

```bash
firebase login
firebase projects:list
```

Copy your project ID from the list.

### 2. Update `.firebaserc`

Open `.firebaserc` and replace `your-project-id` with your actual project ID:

```json
{
  "projects": {
    "default": "your-actual-project-id-here"
  }
}
```

### 3. Install Function Dependencies

```bash
cd functions
npm install
cd ..
```

### 4. Set Resend API Key in Firebase

Go to Firebase Console:
1. Open https://console.firebase.google.com/
2. Select your project
3. Go to **Build** → **Functions**
4. Click **Configuration** tab
5. Click **Add variable**
6. Set:
   - Name: `RESEND_API_KEY`
   - Value: `re_JaVHXqBR_refrubWTtTWxdhL3Anvoxn8n`
7. Click **Save**

### 5. Deploy the Function

```bash
firebase deploy --only functions
```

Wait for deployment to complete. You'll see:
```
✔  functions[sendOTPEmail(us-central1)] Successful create operation.
Function URL: https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/sendOTPEmail
```

### 6. Update App Configurations

Update your project ID in these files:

**Mobile App** - `src/config/api.ts`:
```typescript
const FIREBASE_PROJECT_ID = 'your-actual-project-id-here';
```

**Admin Dashboard** - `admin/src/lib/otp-service.ts`:
```typescript
const FIREBASE_PROJECT_ID = 'your-actual-project-id-here';
```

### 7. Test It!

Test the function with curl:

```bash
curl -X POST \
  https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/sendOTPEmail \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "your-email@example.com",
    "code": "123456",
    "type": "login"
  }'
```

You should receive:
```json
{
  "success": true,
  "messageId": "...",
  "message": "OTP email sent successfully"
}
```

Check your email inbox!

## Common Issues

### "Not in a Firebase app directory"

Make sure you're in the root `MortgageConnect` directory where `firebase.json` is located.

### "Project not found"

Your project ID in `.firebaserc` is incorrect. Run `firebase projects:list` to see available projects.

### "Billing account not configured"

Cloud Functions require a billing account:
1. Go to Firebase Console
2. Click **Upgrade** or **Modify plan**
3. Add a billing account (Blaze plan)
4. Don't worry - you get 2 million free invocations per month!

### "RESEND_API_KEY not configured"

The environment variable is not set. Follow Step 4 above to set it in Firebase Console.

## Verification Checklist

- [ ] Firebase CLI installed
- [ ] Logged into Firebase
- [ ] Project ID updated in `.firebaserc`
- [ ] Function dependencies installed
- [ ] Resend API key set in Firebase Console
- [ ] Function deployed successfully
- [ ] Project ID updated in mobile app config
- [ ] Project ID updated in admin dashboard config
- [ ] Test curl command works
- [ ] Email received in inbox

## Next Steps

1. Test login flow in mobile app
2. Test login flow in admin dashboard
3. Check Resend dashboard for email analytics
4. Set up monitoring in Firebase Console

## Need Help?

See detailed guides:
- `FIREBASE_SETUP.md` - Complete Firebase setup
- `OTP_RESEND_SETUP.md` - Full OTP system documentation
- `functions/README.md` - Cloud Functions specific docs

# Set Firebase Environment Variable

You need to set the RESEND_API_KEY environment variable in Firebase before deploying.

## Option 1: Using Firebase Console (Easiest)

1. Go to https://console.firebase.google.com/
2. Select your project: **mortgage-connect-5b774**
3. Click on **Build** → **Functions**
4. Click on the **Configuration** tab (or **Environment variables**)
5. Click **Add variable** or **Set environment variable**
6. Enter:
   - **Name**: `RESEND_API_KEY`
   - **Value**: `re_JaVHXqBR_refrubWTtTWxdhL3Anvoxn8n`
7. Click **Save**

## Option 2: Using Firebase CLI

Run this command:

```bash
firebase functions:secrets:set RESEND_API_KEY
```

When prompted, paste: `re_JaVHXqBR_refrubWTtTWxdhL3Anvoxn8n`

## After Setting the Variable

Deploy the function:

```bash
firebase deploy --only functions
```

## Verify It's Set

After deployment, you can test the function:

```bash
curl -X POST \
  https://us-central1-mortgage-connect-5b774.cloudfunctions.net/sendOTPEmail \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "your-email@example.com",
    "code": "123456",
    "type": "login"
  }'
```

You should receive an email with the OTP!

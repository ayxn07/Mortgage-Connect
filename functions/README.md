# Firebase Cloud Functions - MortgageConnect

This directory contains Firebase Cloud Functions for sending OTP emails via Resend.

## Setup

### 1. Install Dependencies

```bash
cd functions
npm install
```

### 2. Configure Resend API Key

Set your Resend API key as a Firebase environment variable:

```bash
firebase functions:config:set resend.api_key="re_JaVHXqBR_refrubWTtTWxdhL3Anvoxn8n"
```

To view your current config:

```bash
firebase functions:config:get
```

### 3. Test Locally (Optional)

Start the Firebase emulator:

```bash
npm run serve
```

The function will be available at:
```
http://localhost:5001/YOUR_PROJECT_ID/us-central1/sendOTPEmail
```

### 4. Deploy to Firebase

Deploy the function to Firebase:

```bash
npm run deploy
```

Or deploy all Firebase resources:

```bash
cd ..
firebase deploy
```

## Function Endpoint

After deployment, your function will be available at:

```
https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/sendOTPEmail
```

Replace `YOUR_PROJECT_ID` with your actual Firebase project ID.

## Usage

### Request

**Method:** POST

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "user@example.com",
  "code": "123456",
  "type": "login" | "signup" | "admin"
}
```

### Response

**Success (200):**
```json
{
  "success": true,
  "messageId": "abc123",
  "message": "OTP email sent successfully"
}
```

**Error (400/500):**
```json
{
  "error": "Error message",
  "details": {}
}
```

## Email Types

- **login**: User login OTP
- **signup**: New user registration OTP
- **admin**: Admin dashboard login OTP

## Security

- CORS is enabled for all origins (adjust in production if needed)
- Input validation for email format and OTP code
- Rate limiting should be implemented in production

## Monitoring

View function logs:

```bash
npm run logs
```

Or in Firebase Console:
- Go to Functions section
- Click on `sendOTPEmail`
- View logs tab

## Troubleshooting

### Function not deploying

1. Check Node.js version (should be 18)
2. Verify Firebase CLI is installed: `firebase --version`
3. Check you're logged in: `firebase login`
4. Verify project: `firebase projects:list`

### Email not sending

1. Check Resend API key is set correctly
2. View function logs for errors
3. Verify Resend dashboard for delivery status
4. Check email is not in spam folder

### CORS errors

If you need to restrict CORS to specific domains:

```typescript
const allowedOrigins = [
  'https://yourdomain.com',
  'https://admin.yourdomain.com'
];

const origin = req.headers.origin;
if (allowedOrigins.includes(origin)) {
  res.set('Access-Control-Allow-Origin', origin);
}
```

## Production Checklist

- [ ] Set Resend API key in Firebase config
- [ ] Deploy function to Firebase
- [ ] Update API URL in mobile app config
- [ ] Update API URL in admin dashboard
- [ ] Test OTP flow end-to-end
- [ ] Verify emails are being delivered
- [ ] Set up monitoring and alerts
- [ ] Implement rate limiting
- [ ] Restrict CORS to your domains
- [ ] Verify your domain in Resend
- [ ] Update sender email address

## Cost Considerations

Firebase Cloud Functions pricing:
- First 2 million invocations/month: Free
- After that: $0.40 per million invocations

Resend pricing:
- Free tier: 100 emails/day
- Pro: $20/month for 50,000 emails

## Support

For issues:
- Firebase: https://firebase.google.com/support
- Resend: https://resend.com/support

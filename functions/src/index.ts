import {onRequest} from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { Resend } from 'resend';

admin.initializeApp();

// AI Chat function
export { aiChat } from './aiChat';

// Initialize Resend with API key
const resend = new Resend('re_JaVHXqBR_refrubWTtTWxdhL3Anvoxn8n');

interface SendOTPRequest {
  email: string;
  code: string;
  type: 'login' | 'signup' | 'resend' | 'admin';
}

/**
 * Cloud Function to send OTP emails via Resend
 */
export const sendOTPEmail = onRequest(
  { 
    cors: true,
    invoker: 'public' // Allow unauthenticated access
  },
  async (request, response) => {
    // Only allow POST requests
    if (request.method !== 'POST') {
      response.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const { email, code, type } = request.body as SendOTPRequest;

      // Validate input
      if (!email || !code || !type) {
        response.status(400).json({ error: 'Missing required fields: email, code, type' });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        response.status(400).json({ error: 'Invalid email format' });
        return;
      }

      // Validate OTP code (6 digits)
      if (!/^\d{6}$/.test(code)) {
        response.status(400).json({ error: 'Invalid OTP code format' });
        return;
      }

      // Determine email content based on type
      const isAdmin = type === 'admin';
      const isSignup = type === 'signup';
      
      let subject: string;
      let welcomeText: string;

      if (isAdmin) {
        subject = 'Your Admin Login Verification Code - MortgageConnect';
        welcomeText = 'Use the following code to complete your admin sign-in.';
      } else if (isSignup) {
        subject = 'Welcome to MortgageConnect - Verify Your Email';
        welcomeText = 'Welcome to MortgageConnect! Use the code below to verify your email and complete your registration.';
      } else {
        subject = 'Your Login Verification Code - MortgageConnect';
        welcomeText = 'Use the following code to complete your sign-in.';
      }

      // Send email via Resend
      // NOTE: Using onboarding@resend.dev for test mode (only sends to verified email)
      // To send to any email, update to use verified domain: noreply@mortgageconnect.ae
      const { data, error } = await resend.emails.send({
        from: isAdmin 
          ? 'MortgageConnect Admin <onboarding@resend.dev>'
          : 'MortgageConnect <onboarding@resend.dev>',
        to: email,
        subject,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Verification Code</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e5e5e5; max-width: 600px;">
                      <tr>
                        <td style="background-color: #000000; padding: 2px 0;"></td>
                      </tr>
                      <tr>
                        <td align="center" style="padding: 50px 40px 30px 40px;">
                          <div style="border: 2px solid #000000; display: inline-block; padding: 15px 40px;">
                            <h1 style="margin: 0; font-size: 20px; font-weight: 600; letter-spacing: 4px; color: #000000;">MORTGAGE CONNECT</h1>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding: 30px 40px 20px 40px;">
                          <h2 style="margin: 0; font-size: 24px; font-weight: 300; letter-spacing: 3px; color: #333333;">VERIFICATION CODE</h2>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding: 0 40px 30px 40px;">
                          <p style="margin: 0; font-size: 14px; color: #666666; line-height: 1.6;">
                            ${welcomeText}<br>
                            This code will expire in <strong style="color: #000000;">10 minutes</strong>.
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding: 0 40px 40px 40px;">
                          <div style="background-color: #000000; padding: 30px; margin: 0 auto; max-width: 400px;">
                            <div style="font-size: 42px; font-weight: 600; letter-spacing: 12px; color: #ffffff; text-align: center; font-family: 'Courier New', monospace;">
                              ${code}
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 40px;">
                          <div style="border-top: 1px solid #e5e5e5;"></div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 30px 40px 20px 40px;">
                          <h3 style="margin: 0 0 15px 0; font-size: 12px; font-weight: 700; letter-spacing: 1px; color: #000000;">SECURITY NOTICE</h3>
                          <p style="margin: 0; font-size: 13px; color: #666666; line-height: 1.6;">
                            If you didn't request this code, someone may be trying to access your account. 
                            <a href="mailto:support@mortgageconnect.ae" style="color: #000000; text-decoration: underline; font-weight: 600;">Secure your account →</a>
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 20px 40px 30px 40px;">
                          <div style="border-left: 3px solid #e5e5e5; padding-left: 20px;">
                            <p style="margin: 0 0 10px 0; font-size: 11px; font-weight: 700; letter-spacing: 1px; color: #999999;">REQUEST DETAILS</p>
                            <p style="margin: 0 0 5px 0; font-size: 13px; color: #666666;">
                              <strong style="color: #000000;">Time:</strong> ${new Date().toLocaleString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric', 
                                hour: 'numeric', 
                                minute: '2-digit',
                                hour12: true,
                                timeZoneName: 'short'
                              })}
                            </p>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding: 30px 40px; background-color: #fafafa;">
                          <p style="margin: 0 0 10px 0; font-size: 12px; color: #999999; line-height: 1.6;">
                            This is an automated message. Please do not reply to this email.<br>
                            Need help? Contact <a href="mailto:support@mortgageconnect.ae" style="color: #000000; text-decoration: underline;">support@mortgageconnect.ae</a>
                          </p>
                          <p style="margin: 15px 0 0 0; font-size: 11px; color: #cccccc;">
                            © ${new Date().getFullYear()} MortgageConnect. All rights reserved.<br>
                            Dubai, United Arab Emirates
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
      });

      if (error) {
        console.error('Resend error:', error);
        
        // Provide helpful error message for common issues
        let errorMessage = 'Failed to send email';
        if (error.message?.includes('testing emails')) {
          errorMessage = 'Email can only be sent to verified addresses in test mode. Please verify a domain at resend.com/domains to send to any email address.';
        }
        
        response.status(500).json({ 
          error: errorMessage, 
          details: error 
        });
        return;
      }

      console.log(`OTP email sent successfully to ${email} (type: ${type})`);
      response.status(200).json({ 
        success: true, 
        messageId: data?.id,
        message: 'OTP email sent successfully'
      });

    } catch (error: any) {
      console.error('Send OTP error:', error);
      response.status(500).json({ 
        error: 'Internal server error', 
        message: error.message 
      });
    }
  }
);

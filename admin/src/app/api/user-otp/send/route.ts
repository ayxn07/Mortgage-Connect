import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email, code, type } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and code are required" },
        { status: 400 }
      );
    }

    const isSignup = type === 'signup';
    const subject = isSignup 
      ? "Welcome to MortgageConnect - Verify Your Email"
      : "Your Login Verification Code - MortgageConnect";

    const { data, error } = await resend.emails.send({
      from: "MortgageConnect <onboarding@resend.dev>",
      to: email,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${isSignup ? 'Welcome' : 'Login'} Verification Code</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e5e5e5; max-width: 600px;">
                    <!-- Black Header Bar -->
                    <tr>
                      <td style="background-color: #000000; padding: 2px 0;"></td>
                    </tr>
                    
                    <!-- Logo/Brand Section -->
                    <tr>
                      <td align="center" style="padding: 50px 40px 30px 40px;">
                        <div style="border: 2px solid #000000; display: inline-block; padding: 15px 40px;">
                          <h1 style="margin: 0; font-size: 20px; font-weight: 600; letter-spacing: 4px; color: #000000;">MORTGAGE CONNECT</h1>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Verification Code Title -->
                    <tr>
                      <td align="center" style="padding: 30px 40px 20px 40px;">
                        <h2 style="margin: 0; font-size: 24px; font-weight: 300; letter-spacing: 3px; color: #333333;">VERIFICATION CODE</h2>
                      </td>
                    </tr>
                    
                    <!-- Description Text -->
                    <tr>
                      <td align="center" style="padding: 0 40px 30px 40px;">
                        <p style="margin: 0; font-size: 14px; color: #666666; line-height: 1.6;">
                          ${isSignup 
                            ? 'Welcome to MortgageConnect! Use the code below to verify your email and complete your registration.'
                            : 'Use the following code to complete your sign-in.'
                          }<br>
                          This code will expire in <strong style="color: #000000;">10 minutes</strong>.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- OTP Code Box -->
                    <tr>
                      <td align="center" style="padding: 0 40px 40px 40px;">
                        <div style="background-color: #000000; padding: 30px; margin: 0 auto; max-width: 400px;">
                          <div style="font-size: 42px; font-weight: 600; letter-spacing: 12px; color: #ffffff; text-align: center; font-family: 'Courier New', monospace;">
                            ${code}
                          </div>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Divider -->
                    <tr>
                      <td style="padding: 0 40px;">
                        <div style="border-top: 1px solid #e5e5e5;"></div>
                      </td>
                    </tr>
                    
                    <!-- Security Notice -->
                    <tr>
                      <td style="padding: 30px 40px 20px 40px;">
                        <h3 style="margin: 0 0 15px 0; font-size: 12px; font-weight: 700; letter-spacing: 1px; color: #000000;">SECURITY NOTICE</h3>
                        <p style="margin: 0; font-size: 13px; color: #666666; line-height: 1.6;">
                          If you didn't request this code, someone may be trying to access your account. 
                          <a href="mailto:support@mortgageconnect.ae" style="color: #000000; text-decoration: underline; font-weight: 600;">Secure your account →</a>
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Request Details -->
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
                    
                    <!-- Footer -->
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
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, messageId: data?.id });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

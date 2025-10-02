# Password Reset Feature Setup

## Overview

The password reset feature allows users to securely reset their passwords via email. This guide explains how the feature works and how to configure email sending for production.

## Features Implemented

✅ **"Forgot Password?" link** on the sign-in page  
✅ **Forgot Password page** where users enter their email  
✅ **Reset Password page** where users set a new password  
✅ **Secure token generation** with 1-hour expiration  
✅ **Email security** - prevents email enumeration attacks  
✅ **Session revocation** - all sessions invalidated after password reset  
✅ **OAuth protection** - only works for password-based accounts  

## How It Works

### User Flow

1. User clicks "Forgot Password?" on sign-in page
2. User enters their email address
3. System generates a secure reset token and sends an email
4. User clicks the link in the email
5. User enters a new password
6. Password is updated and all sessions are revoked
7. User is redirected to sign-in page

### Security Features

- **Token hashing**: Reset tokens are stored hashed (SHA-256)
- **Time-limited**: Tokens expire after 1 hour
- **Single use**: Tokens are deleted after successful use
- **Email enumeration protection**: Same response whether email exists or not
- **Session invalidation**: All user sessions revoked on password reset
- **OAuth check**: Feature only works for password-based accounts

## Email Configuration

### Current State (Development)

Currently, the system logs password reset emails to the console. In development, you'll see:

```
============================================================
PASSWORD RESET EMAIL
============================================================
To: user@example.com
Name: User Name
Reset Link: http://localhost:3000/reset-password?token=...
============================================================
```

### Production Setup

For production, you need to configure an email service. Here are recommended options:

#### Option 1: Resend (Recommended)

1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Install Resend:
```bash
npm install resend
```

4. Add to `.env`:
```env
RESEND_API_KEY=your_api_key_here
```

5. Update `src/app/api/auth/forgot-password/route.ts`:

```typescript
import { Resend } from "resend";

async function sendPasswordResetEmail(
  email: string,
  resetLink: string,
  name: string
) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: "noreply@yourdomain.com",
    to: email,
    subject: "Reset Your Password - EchoNest AI Therapy",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hello ${name},</h2>
        <p>You requested to reset your password for your EchoNest AI Therapy account.</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetLink}" style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Reset Password
        </a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetLink}</p>
        <p><strong>This link will expire in 1 hour.</strong></p>
        <p>If you didn't request this password reset, you can safely ignore this email. Your password will not be changed.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">
          This is an automated email from EchoNest AI Therapy. Please do not reply to this email.
        </p>
      </div>
    `,
  });
}
```

#### Option 2: SendGrid

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Install SendGrid:
```bash
npm install @sendgrid/mail
```

3. Add to `.env`:
```env
SENDGRID_API_KEY=your_api_key_here
```

4. Update the `sendPasswordResetEmail` function accordingly.

#### Option 3: Nodemailer (Gmail/SMTP)

1. Install Nodemailer:
```bash
npm install nodemailer
```

2. Add to `.env`:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

3. Update the `sendPasswordResetEmail` function accordingly.

## Database Schema

The feature uses the existing `verification` table to store password reset tokens:

```sql
-- Table already exists in your schema
CREATE TABLE verification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL UNIQUE,
  value text NOT NULL,
  expires_at timestamp NOT NULL,
  created_at timestamp,
  updated_at timestamp
);
```

Reset tokens are stored with:
- `identifier`: `password_reset:{email}`
- `value`: SHA-256 hash of the reset token
- `expires_at`: Current time + 1 hour

## Testing

### Development Testing

1. Start your development server:
```bash
npm run dev
```

2. Navigate to the sign-in page
3. Click "Forgot Password?"
4. Enter an email address
5. Check the console for the reset link
6. Copy the link and paste it in your browser
7. Enter a new password

### Test Scenarios

- ✅ User exists with password account
- ✅ User doesn't exist (should still show success)
- ✅ User has only OAuth accounts (should still show success)
- ✅ Token expires after 1 hour
- ✅ Token can only be used once
- ✅ Invalid token shows error
- ✅ All sessions revoked after reset

## Translations

Translations are configured in `messages/en.json`. To add more languages:

1. Copy the `ForgotPassword` and `ResetPassword` sections from `messages/en.json`
2. Translate them in other language files (es.json, fr.json, etc.)

## API Endpoints

### POST /api/auth/forgot-password

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "If the email exists, a reset link has been sent"
}
```

### POST /api/auth/reset-password

**Request:**
```json
{
  "token": "reset-token-from-email",
  "password": "NewPassword123!"
}
```

**Response:**
```json
{
  "message": "Password reset successfully"
}
```

## Environment Variables

Add these to your `.env` file:

```env
# Base URL for reset links
NEXT_PUBLIC_BASE_URL=https://yourdomain.com

# Email service configuration (choose one)
RESEND_API_KEY=your_resend_api_key
# OR
SENDGRID_API_KEY=your_sendgrid_api_key
# OR
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

## Troubleshooting

### Email not sending
- Check console logs for errors
- Verify API keys in `.env`
- Ensure email service is configured correctly

### Token invalid or expired
- Tokens expire after 1 hour
- Tokens can only be used once
- Check system time is correct

### User can't reset password
- Verify user has a password account (not OAuth only)
- Check user exists in database
- Verify verification table has the token

## Security Best Practices

✅ **Never expose whether an email exists** - Always return success message  
✅ **Use secure tokens** - 32-byte random tokens, hashed before storage  
✅ **Time-limited tokens** - 1-hour expiration  
✅ **Single-use tokens** - Deleted after successful use  
✅ **Revoke all sessions** - Force re-authentication after password change  
✅ **HTTPS only** - Ensure production uses HTTPS for secure token transmission  

## Support

For issues or questions about the password reset feature, check:
- API logs in the console
- Network tab in browser dev tools
- Database verification table

---

**Note**: Remember to configure email sending before deploying to production!


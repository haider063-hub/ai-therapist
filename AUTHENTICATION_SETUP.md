# Authentication Setup Guide

This guide explains how to set up and configure the enhanced authentication system for EchoNest AI Therapy, including OTP verification and social authentication providers.

## Features

### 1. OTP Email Verification
- **6-digit verification codes** sent via email during signup
- **10-minute expiration** for security
- **Rate limiting** (max 3 attempts per minute)
- **Automatic cleanup** of expired codes
- **Beautiful email templates** with EchoNest branding

### 2. Social Authentication
- **Google OAuth** - Sign in with Google
- **Apple OAuth** - Sign in with Apple
- **GitHub OAuth** - Sign in with GitHub
- **Microsoft OAuth** - Sign in with Microsoft

## Environment Variables

Add these environment variables to your `.env.local` file:

### Email Service (Required for OTP)
```bash
RESEND_API_KEY=your_resend_api_key_here
```

### Google OAuth (Optional)
```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_FORCE_ACCOUNT_SELECTION=true  # Optional: force account selection
```

### Apple OAuth (Optional)
```bash
APPLE_CLIENT_ID=your_apple_client_id
APPLE_CLIENT_SECRET=your_apple_client_secret
```

### Microsoft OAuth (Optional)
```bash
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
MICROSOFT_TENANT_ID=common  # Optional: defaults to "common"
MICROSOFT_FORCE_ACCOUNT_SELECTION=true  # Optional
```

### GitHub OAuth (Optional)
```bash
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

## Database Setup

### 1. Run the OTP Table Migration
Execute the SQL migration to create the OTP verification table:

```bash
# If using PostgreSQL directly
psql -d your_database -f scripts/create-otp-table.sql

# Or run through your database migration tool
```

### 2. Update Drizzle Schema
The schema has been updated to include the new `OtpVerificationSchema`. Make sure to run your database migration if you're using Drizzle migrations.

## OAuth Provider Setup

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

### Apple OAuth Setup
1. Go to [Apple Developer Console](https://developer.apple.com/)
2. Create a new App ID with Sign In with Apple capability
3. Create a Services ID
4. Configure the Services ID with your domain and redirect URL
5. Create a private key for Sign In with Apple

### Microsoft OAuth Setup
1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to Azure Active Directory > App registrations
3. Create a new registration
4. Add redirect URIs:
   - `http://localhost:3000/api/auth/callback/microsoft` (development)
   - `https://yourdomain.com/api/auth/callback/microsoft` (production)

### GitHub OAuth Setup
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set Authorization callback URL:
   - `http://localhost:3000/api/auth/callback/github` (development)
   - `https://yourdomain.com/api/auth/callback/github` (production)

## Email Service Setup

### Resend Setup (Recommended)
1. Sign up at [Resend](https://resend.com/)
2. Create an API key
3. Add the API key to your environment variables
4. The system will automatically use Resend for sending OTP emails

### Email Templates
The system includes beautiful HTML email templates with:
- EchoNest AI Therapy branding
- Professional styling
- Clear verification code display
- Security information

## User Registration Flow

### Enhanced Registration Process
1. **Email Entry** - User enters email address
2. **OTP Verification** - System sends 6-digit code via email
3. **Code Verification** - User enters the verification code
4. **Name Entry** - User enters their full name
5. **Password Creation** - User creates a secure password
6. **Account Creation** - Account is created and user is redirected to profile setup

### Social Authentication Flow
1. User clicks on a social provider button
2. Redirected to provider's OAuth flow
3. After successful authentication, account is created automatically
4. User is redirected to profile setup

## Security Features

### OTP Security
- **Time-limited codes** (10 minutes expiration)
- **Single-use codes** (marked as used after verification)
- **Rate limiting** to prevent abuse
- **Automatic cleanup** of expired codes
- **Secure random generation** using crypto.randomBytes

### Social Authentication Security
- **Secure token handling** with proper secret management
- **Account linking** for existing users
- **Provider validation** to prevent unauthorized access

## API Endpoints

### OTP Endpoints
- `POST /api/auth/send-otp` - Send OTP to email
- `POST /api/auth/verify-otp` - Verify OTP code

### Authentication Endpoints
- `POST /api/auth/sign-up` - Create new account
- `GET /api/auth/callback/[provider]` - OAuth callback handlers

## Testing

### Local Development
1. Set up environment variables
2. Run the database migration
3. Start the development server
4. Navigate to `/sign-up` to test the registration flow

### Production Deployment
1. Configure all environment variables
2. Set up OAuth providers with production URLs
3. Run database migrations
4. Deploy the application

## Troubleshooting

### Common Issues

#### OTP Emails Not Sending
- Check if `RESEND_API_KEY` is set correctly
- Verify Resend account is active
- Check server logs for email sending errors

#### Social Authentication Not Working
- Verify OAuth credentials are correct
- Check redirect URIs match exactly
- Ensure OAuth apps are properly configured

#### Database Errors
- Run the OTP table migration
- Check database connection
- Verify schema is up to date

### Debug Mode
The system includes comprehensive logging for debugging authentication issues. Check server logs for detailed error messages.

## Maintenance

### Cleanup Expired OTPs
The system automatically cleans up expired OTP codes, but you can also run manual cleanup:

```typescript
import { OtpService } from 'lib/services/otp-service';

// Clean up all expired OTPs
await OtpService.cleanupAllExpiredOtps();
```

### Monitoring
Monitor the following metrics:
- OTP send success rates
- OTP verification success rates
- Social authentication success rates
- Email delivery rates

## Support

For issues or questions regarding the authentication system, please check:
1. Server logs for error messages
2. Environment variable configuration
3. OAuth provider setup
4. Database connection and schema

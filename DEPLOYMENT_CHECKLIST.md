# Deployment Checklist for Enhanced Authentication

This checklist will guide you through deploying the enhanced authentication system with OTP verification and social authentication.

## Pre-Deployment Setup

### 1. Environment Variables Configuration

Create or update your `.env.local` file with the following variables:

```bash
# Database Configuration
DATABASE_URL=your_postgresql_connection_string

# Authentication Configuration
BETTER_AUTH_SECRET=your_secret_key_here
BETTER_AUTH_URL=https://yourdomain.com

# Email Service (Required for OTP)
RESEND_API_KEY=your_resend_api_key

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_FORCE_ACCOUNT_SELECTION=true

# Apple OAuth (Optional)
APPLE_CLIENT_ID=your_apple_client_id
APPLE_CLIENT_SECRET=your_apple_client_secret

# Microsoft OAuth (Optional)
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
MICROSOFT_TENANT_ID=common

# GitHub OAuth (Optional)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Other required variables
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### 2. Database Migration

Run the database migration to create the OTP verification table:

```bash
# Option 1: Using psql directly
psql -d your_database_name -f scripts/create-otp-table.sql

# Option 2: Using your database management tool
# Execute the SQL commands from scripts/create-otp-table.sql
```

### 3. OAuth Provider Setup

#### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://yourdomain.com/api/auth/callback/google`

#### Apple OAuth Setup
1. Go to [Apple Developer Console](https://developer.apple.com/)
2. Create App ID with Sign In with Apple capability
3. Create Services ID
4. Configure redirect URL: `https://yourdomain.com/api/auth/callback/apple`
5. Create private key for Sign In with Apple

#### Microsoft OAuth Setup
1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to Azure Active Directory > App registrations
3. Create new registration
4. Add redirect URI: `https://yourdomain.com/api/auth/callback/microsoft`

#### GitHub OAuth Setup
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create new OAuth App
3. Set Authorization callback URL: `https://yourdomain.com/api/auth/callback/github`

### 4. Email Service Setup

#### Resend Setup
1. Sign up at [Resend](https://resend.com/)
2. Create an API key
3. Verify your domain
4. Add the API key to your environment variables

## Deployment Steps

### 1. Build and Deploy

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Deploy to your platform (Vercel, Netlify, etc.)
npm run deploy
```

### 2. Database Connection

Ensure your production database is accessible and the migration has been run.

### 3. Environment Variables

Set all environment variables in your deployment platform.

### 4. Domain Configuration

Update OAuth provider redirect URIs to use your production domain.

## Post-Deployment Testing

### 1. Test OTP Email Verification

1. Navigate to `/sign-up`
2. Enter a valid email address
3. Check that OTP email is received
4. Verify the OTP code works
5. Complete the registration process

### 2. Test Social Authentication

1. Test Google sign-in
2. Test Apple sign-in (if configured)
3. Test Microsoft sign-in (if configured)
4. Test GitHub sign-in (if configured)

### 3. Test Error Handling

1. Try with invalid email formats
2. Try with expired OTP codes
3. Test rate limiting for OTP requests
4. Test with disabled OAuth providers

## Monitoring and Maintenance

### 1. Set Up Monitoring

Monitor the following metrics:
- OTP send success rates
- OTP verification success rates
- Social authentication success rates
- Email delivery rates
- Database performance

### 2. Regular Maintenance

- Monitor OTP table size and clean up expired records
- Check OAuth provider quotas
- Monitor email service usage
- Review authentication logs for suspicious activity

### 3. Security Considerations

- Regularly rotate API keys
- Monitor for failed authentication attempts
- Keep OAuth provider configurations up to date
- Review and update security policies

## Troubleshooting

### Common Issues

#### OTP Emails Not Sending
- Check RESEND_API_KEY configuration
- Verify Resend account status
- Check email sending limits
- Review server logs

#### Social Authentication Failures
- Verify OAuth credentials
- Check redirect URI configuration
- Ensure OAuth apps are active
- Review provider-specific logs

#### Database Connection Issues
- Verify DATABASE_URL configuration
- Check database accessibility
- Ensure migration was run successfully
- Review database connection logs

### Debug Commands

```bash
# Test OTP service
npx tsx scripts/test-otp.ts

# Check database connection
npm run db:check

# View authentication logs
npm run logs:auth
```

## Rollback Plan

If issues arise:

1. **Immediate Rollback**: Revert to previous deployment
2. **Disable OTP**: Set `DISABLE_EMAIL_SIGN_IN=true` to disable OTP temporarily
3. **Disable Social Auth**: Remove OAuth environment variables
4. **Database Rollback**: Drop OTP table if needed

## Success Criteria

✅ OTP emails are sent successfully  
✅ OTP verification works correctly  
✅ Social authentication providers work  
✅ Registration flow is smooth and user-friendly  
✅ Error handling works properly  
✅ Performance is acceptable  
✅ Security measures are in place  

## Support and Documentation

- Review `AUTHENTICATION_SETUP.md` for detailed setup instructions
- Check server logs for debugging information
- Use the test scripts for validation
- Monitor user feedback for UX improvements

---

**Note**: Always test the authentication flow thoroughly in a staging environment before deploying to production.

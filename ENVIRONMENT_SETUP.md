# Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

### Database Configuration
```bash
POSTGRES_URL=postgresql://username:password@host:port/database
DATABASE_URL=postgresql://username:password@host:port/database
```

### Better Auth Configuration
```bash
BETTER_AUTH_SECRET=your-secret-key-here-make-it-long-and-random
BETTER_AUTH_URL=http://localhost:3000
```

### OpenAI Configuration
```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### Stripe Configuration (REQUIRED FOR SUBSCRIPTION SYSTEM)
```bash
# Get these from your Stripe Dashboard (https://dashboard.stripe.com/)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Stripe Price IDs (REQUIRED - Create these in Stripe Dashboard)
```bash
# Chat Only Plan - $19/month
STRIPE_CHAT_ONLY_PRICE_ID=price_chat_only_plan_id_here
# Voice Only Plan - $49/month  
STRIPE_VOICE_ONLY_PRICE_ID=price_voice_only_plan_id_here
# Premium Plan - $99/month
STRIPE_PREMIUM_PRICE_ID=price_premium_plan_id_here
# Voice Top-Ups - $15/1000 credits (one-time payment)
STRIPE_VOICE_TOPUPS_PRICE_ID=price_voice_topups_id_here
```

### Application Configuration
```bash
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Optional Configuration
```bash
# Cron Job Security (for automated credit resets)
CRON_SECRET=your_secure_random_string_for_cron_jobs

# Redis Configuration (if using Redis for caching)
REDIS_URL=redis://localhost:6379
```

## How to Get Stripe Keys

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/
2. **Get API Keys**:
   - Go to Developers → API Keys
   - Copy the "Publishable key" to `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Copy the "Secret key" to `STRIPE_SECRET_KEY`

3. **Create Products and Prices**:
   - Go to Products → Create Product
   - Create these 4 products:
     - **Chat Only Plan**: $19/month recurring
     - **Voice Only Plan**: $49/month recurring  
     - **Premium Plan**: $99/month recurring
     - **Voice Top-Ups**: $15 one-time payment
   - Copy the Price IDs to the corresponding environment variables

4. **Set up Webhook**:
   - Go to Developers → Webhooks
   - Create endpoint: `https://yourdomain.com/api/stripe/webhooks`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy the webhook secret to `STRIPE_WEBHOOK_SECRET`

## Testing

For testing, use Stripe's test mode:
- Use test API keys (start with `sk_test_` and `pk_test_`)
- Use test card numbers:
  - Success: `4242 4242 4242 4242`
  - Decline: `4000 0000 0000 0002`

## Production

For production:
- Use live API keys (start with `sk_live_` and `pk_live_`)
- Update webhook endpoint to your production domain
- Test thoroughly before going live

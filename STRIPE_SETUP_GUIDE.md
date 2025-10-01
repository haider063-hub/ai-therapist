# Stripe Subscription & Credit System Setup Guide

This guide will help you set up the complete Stripe subscription and credit system for EchoNest AI Therapy.

## 🚀 Quick Start

### 1. Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Price IDs (get these from Stripe Dashboard)
STRIPE_CHAT_ONLY_PRICE_ID=price_chat_only_plan
STRIPE_VOICE_ONLY_PRICE_ID=price_voice_only_plan
STRIPE_PREMIUM_PRICE_ID=price_premium_plan
STRIPE_VOICE_TOPUPS_PRICE_ID=price_voice_topups

# Cron Job Security (optional, for automated credit resets)
CRON_SECRET=your_secure_random_string
```

### 2. Stripe Dashboard Setup

#### Create Products and Prices:

1. **Chat Only Plan** - $19/month
   - Product Name: "Chat Only Plan"
   - Price: $19.00/month (recurring)
   - Copy the Price ID to `STRIPE_CHAT_ONLY_PRICE_ID`

2. **Voice Only Plan** - $49/month
   - Product Name: "Voice Only Plan"
   - Price: $49.00/month (recurring)
   - Copy the Price ID to `STRIPE_VOICE_ONLY_PRICE_ID`

3. **Premium Plan** - $99/month
   - Product Name: "Premium Plan"
   - Price: $99.00/month (recurring)
   - Copy the Price ID to `STRIPE_PREMIUM_PRICE_ID`

4. **Voice Top-Ups** - $15/1000 credits
   - Product Name: "Voice Top-Up"
   - Price: $15.00 (one-time payment)
   - Copy the Price ID to `STRIPE_VOICE_TOPUPS_PRICE_ID`

#### Webhook Setup:

1. Go to Stripe Dashboard → Webhooks
2. Create endpoint: `https://yourdomain.com/api/stripe/webhooks`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook secret to `STRIPE_WEBHOOK_SECRET`

### 3. Database Migration

Run the database migration to add subscription tables:

```bash
npm run db:generate
npm run db:migrate
```

### 4. Initialize Subscription Plans

Run the script to populate the subscription plans in your database:

```bash
npm run tsx scripts/init-subscription-plans.ts
```

## 📊 Credit System Overview

### Free Trial Users
- Start with 500 credits
- Chat: 5 credits per message
- Voice: 10 credits per interaction
- Must upgrade when credits are exhausted

### Subscription Plans

#### Chat Only Plan ($19/month)
- ✅ Unlimited chat sessions
- ❌ Voice disabled (unless top-ups purchased)
- Features: Basic mood tracking, progress insights

#### Voice Only Plan ($49/month)
- ❌ Chat disabled
- ✅ 300 daily voice credits (≈30 conversations)
- ✅ 9,000 monthly voice credits (≈900 minutes)
- Features: Advanced mood tracking, personalized insights

#### Premium Plan ($99/month)
- ✅ Unlimited chat sessions
- ✅ Unlimited voice interactions
- ✅ All features from other plans
- Features: Crisis support access, premium insights

#### Voice Top-Ups ($15/1000 credits)
- ✅ Pay-as-you-go voice credits
- ✅ 1000 credits ≈ 100 minutes of voice
- ✅ Available to any user
- ✅ Instant availability

## 🔧 Configuration

### Credit Costs (Configurable)
- Chat message: 5 credits
- Voice interaction: 10 credits
- Free trial starting credits: 500

### Voice Plan Limits (Configurable)
- Daily voice credits: 300 (≈30 conversations)
- Monthly voice credits: 9,000 (≈900 minutes)

### Credit Reset Schedule
- **Daily reset**: 00:00 UTC (resets daily voice usage)
- **Monthly reset**: 1st of every month (resets monthly voice usage)

## 🛠 API Endpoints

### Subscription Management
- `POST /api/stripe/create-checkout-session` - Create checkout session
- `GET /api/stripe/get-subscription-status` - Get user subscription status
- `POST /api/stripe/cancel-subscription` - Cancel subscription
- `POST /api/stripe/purchase-topup` - Purchase voice top-ups

### Webhooks
- `POST /api/stripe/webhooks` - Handle Stripe webhook events

### Cron Jobs
- `POST /api/cron/reset-credits` - Reset daily/monthly credits

## 🎨 Frontend Components

### Pages
- `/subscription` - Subscription management page
- `/subscription/success` - Payment success page
- `/subscription/cancel` - Payment cancellation page

### Components
- `CreditDisplay` - Shows current credits and plan status
- `UsageWarning` - Warns when limits are reached
- `CheckoutButton` - Stripe checkout integration

## 🔄 Credit Reset Automation

### Option 1: External Cron Service
Use services like:
- **Vercel Cron Jobs** (if deployed on Vercel)
- **GitHub Actions** (free option)
- **cron-job.org** (free option)

#### Daily Reset (00:00 UTC):
```bash
curl -X POST https://yourdomain.com/api/cron/reset-credits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_cron_secret" \
  -d '{"type": "daily"}'
```

#### Monthly Reset (1st of month, 00:00 UTC):
```bash
curl -X POST https://yourdomain.com/api/cron/reset-credits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_cron_secret" \
  -d '{"type": "monthly"}'
```

### Option 2: Manual Reset
You can manually trigger resets by calling the cron API endpoint.

## 🧪 Testing

### Test Cards (Stripe Test Mode)
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Requires Authentication**: 4000 0025 0000 3155

### Test Scenarios
1. **Free Trial**: Create account, use 500 credits, verify upgrade prompts
2. **Chat Only**: Subscribe, verify unlimited chat, blocked voice
3. **Voice Only**: Subscribe, verify voice limits, blocked chat
4. **Premium**: Subscribe, verify unlimited access
5. **Top-Ups**: Purchase credits, verify they're added

## 🚨 Important Notes

### Security
- Never expose Stripe secret keys in client-side code
- Use webhook signature verification
- Set up proper CORS for webhook endpoints

### Error Handling
- All credit operations are logged
- Failed payments are tracked
- Users get clear error messages

### Monitoring
- Monitor webhook delivery in Stripe Dashboard
- Check application logs for credit deduction errors
- Set up alerts for failed payments

## 📈 Analytics & Monitoring

### Key Metrics to Track
- Subscription conversion rates
- Credit usage patterns
- Payment success/failure rates
- Feature usage by plan type

### Stripe Dashboard
- Monitor revenue, customers, and subscriptions
- Track failed payments and dunning management
- Analyze customer lifetime value

## 🔧 Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Check webhook URL is accessible
   - Verify webhook secret matches
   - Check Stripe Dashboard for delivery attempts

2. **Credits not deducting**
   - Check database connection
   - Verify user authentication
   - Check application logs for errors

3. **Subscription not activating**
   - Verify webhook is processing `checkout.session.completed`
   - Check database for subscription records
   - Verify Stripe Price IDs match

### Debug Mode
Set `NODE_ENV=development` to enable detailed logging.

## 🎯 Next Steps

1. Set up Stripe products and prices
2. Configure webhook endpoints
3. Test all subscription flows
4. Set up credit reset automation
5. Deploy to production
6. Monitor and optimize

## 📞 Support

For issues with this implementation:
1. Check application logs
2. Verify Stripe Dashboard events
3. Test with Stripe test cards
4. Check database records

---

**Note**: This system is designed to be flexible and configurable. All credit costs, limits, and plan features can be adjusted through the database without code changes.

# Stripe Setup Instructions

## 🚨 **IMPORTANT: Stripe Environment Variables Missing**

The subscription system requires Stripe environment variables to be configured. Currently, the application is failing because these are not set up.

## 📋 **Required Environment Variables**

Create a `.env.local` file in the project root with the following variables:

```bash
# Stripe Configuration
# Get these from your Stripe Dashboard: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe Price IDs (create these in your Stripe Dashboard)
STRIPE_CHAT_ONLY_PRICE_ID=price_your_chat_only_price_id_here
STRIPE_VOICE_ONLY_PRICE_ID=price_your_voice_only_price_id_here
STRIPE_PREMIUM_PRICE_ID=price_your_premium_price_id_here
STRIPE_VOICE_TOPUPS_PRICE_ID=price_your_voice_topups_price_id_here
```

## 🔧 **How to Get Stripe Keys**

### 1. **Create Stripe Account**
- Go to [https://stripe.com](https://stripe.com)
- Sign up for a free account
- Complete account verification

### 2. **Get API Keys**
- Go to [Stripe Dashboard > API Keys](https://dashboard.stripe.com/apikeys)
- Copy your **Publishable key** (starts with `pk_test_`)
- Copy your **Secret key** (starts with `sk_test_`)

### 3. **Create Products and Prices**
- Go to [Stripe Dashboard > Products](https://dashboard.stripe.com/products)
- Create products for each plan:
  - **Chat Only Plan**: $19/month
  - **Voice Only Plan**: $49/month  
  - **Premium Plan**: $99/month
  - **Voice Top-Up**: $15 (one-time)
- Copy the Price IDs (start with `price_`)

### 4. **Set Up Webhooks** (Optional for now)
- Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
- Add endpoint: `https://yourdomain.com/api/stripe/webhooks`
- Select events: `customer.subscription.*`, `invoice.payment_*`
- Copy the webhook secret (starts with `whsec_`)

## 🚀 **Quick Start (Development Only)**

For immediate testing, you can use Stripe's test keys:

```bash
# Create .env.local file
echo 'STRIPE_SECRET_KEY=sk_test_51234567890abcdef' > .env.local
echo 'STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdef' >> .env.local
```

**Note**: Replace with your actual test keys from Stripe Dashboard.

## ✅ **After Setup**

1. **Restart your development server**:
   ```bash
   npm run dev
   ```

2. **Test the subscription system**:
   - Click the subscription button in the header
   - Verify the subscription panel opens
   - Check that plans are displayed

3. **Verify API endpoints**:
   - Visit: `http://localhost:3000/api/test-stripe`
   - Should return success message

## 🔍 **Troubleshooting**

### Error: "Stripe initialization failed"
- ✅ Check that `.env.local` file exists
- ✅ Verify `STRIPE_SECRET_KEY` starts with `sk_test_`
- ✅ Ensure no extra spaces or quotes in the key

### Error: "Module not found"
- ✅ Run `npm install stripe @stripe/stripe-js`
- ✅ Restart development server

### Error: "Invalid API key"
- ✅ Use test keys for development (start with `sk_test_`)
- ✅ Verify key is copied correctly
- ✅ Check Stripe Dashboard for active keys

## 📞 **Need Help?**

- **Stripe Documentation**: [https://stripe.com/docs](https://stripe.com/docs)
- **Test Cards**: [https://stripe.com/docs/testing](https://stripe.com/docs/testing)
- **API Reference**: [https://stripe.com/docs/api](https://stripe.com/docs/api)

---

**Once you've set up the environment variables, the subscription system will work perfectly!** 🎉

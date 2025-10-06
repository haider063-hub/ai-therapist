# Quick Start - Database Reset & Testing

## 🚀 Fastest Way to Apply Fixes (Testing Phase)

### Step 1: Reset Database (3 minutes)
```bash
cd EchoNest-AI-Theraphy
npm run db:reset-full
```

**What this does:**
- ✅ Deletes all test users and data
- ✅ Recreates schema with 200 credit defaults
- ✅ Creates all subscription tables
- ✅ Gives you a clean slate

**Safety:** Automatically blocked in production. Only works in dev/test.

---

### Step 2: Start Dev Server
```bash
npm run dev
```

---

### Step 3: Test (5 minutes)

#### A. Test Credits
1. Go to http://localhost:3000/sign-up
2. Create a new account
3. Check credits:
   - ✅ Should see **200 voice credits**
   - ✅ Should see **200 chat credits**
   - ❌ NOT 50, NOT 250

#### B. Test Voice Chat Flow
1. Click "Voice Chat" button in header
2. ✅ Should go to therapist selection page
3. Select any therapist
4. ✅ Should go to voice chat page
5. Test the voice chat works

#### C. Test Returning User
1. Go back to therapist selection
2. ✅ Should see "Currently Selected" banner
3. Click "Continue to Voice Chat"
4. ✅ Should go directly to voice chat

---

### Step 4: Approve & Deploy

If everything works:
```bash
# Commit and push
git add .
git commit -m "Fix: Credit system (200 default) & voice chat flow"
git push
```

---

## 📋 What Was Fixed

### Issue 1: Credits
- **Before:** New users got 50 credits each
- **After:** New users get 200 credits each
- **How:** Created proper database migration + reset script

### Issue 2: Voice Chat
- **Before:** Randomly selected therapist, bypassed selection page
- **After:** Always shows therapist selection first
- **How:** Fixed navigation logic + added redirect guards

---

## 🆘 Troubleshooting

### Database connection error?
Check your `.env` file has correct database credentials.

### Migration fails?
Run the reset again:
```bash
npm run db:reset-full
```

### Still showing 50 credits?
1. Clear browser cache/localStorage
2. Create a completely new test account
3. Check the database directly:
```sql
SELECT email, chat_credits, voice_credits FROM "user";
```

### Voice chat still bypasses therapist selection?
1. Clear browser localStorage
2. Hard refresh (Ctrl+Shift+R)
3. Create new account to test

---

## 📂 Files Changed

**Created:**
- `scripts/reset-database.ts` - Database reset script
- `src/lib/db/migrations/pg/0005_add_subscription_credit_system.sql` - Migration
- `DATABASE_RESET_GUIDE.md` - Detailed guide
- `QUICK_START.md` - This file

**Updated:**
- `package.json` - Added `db:reset-full` script
- `src/components/layouts/app-header.tsx` - Fixed navigation
- `src/app/voice-chat/page.tsx` - Added redirect guard
- `src/components/therapist-selection.tsx` - Enhanced UX
- `FIXES_APPLIED.md` - Full documentation

---

## ⏱️ Time Estimate

- Reset database: **1 minute**
- Start dev server: **30 seconds**
- Create test account: **1 minute**
- Test all flows: **3 minutes**
- **Total: ~5 minutes**

---

## ✅ Checklist Before Approval

- [ ] Database reset completed successfully
- [ ] New account shows 200 credits (each)
- [ ] Voice chat goes to therapist selection
- [ ] Can select and use a therapist
- [ ] No errors in browser console
- [ ] Ready to push to production

---

**Need more details?** Check:
- `DATABASE_RESET_GUIDE.md` - Comprehensive database reset guide
- `FIXES_APPLIED.md` - Full technical documentation

**Ready to go?** Run `npm run db:reset-full` and start testing! 🎯


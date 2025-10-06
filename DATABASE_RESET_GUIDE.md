# Database Reset Guide - Testing Phase

## Why Reset the Database?

Since you're in the **testing phase** and the **credit system has fundamentally changed**, a complete database reset is the cleanest approach:

✅ **Benefits of Full Reset:**
- No data inconsistencies from old credit system
- Clean slate with correct 200 credit defaults
- All test users removed
- Proper schema from the start
- Faster than debugging migration issues

❌ **Why Not Just Migrate:**
- Old users may have mixed credit states
- Legacy data could cause confusion
- Testing is harder with inconsistent data
- Migration adds complexity for temporary test data

---

## 🔥 How to Reset (Step-by-Step)

### Step 1: Backup (Optional)
If you want to keep any test data for reference:
```bash
# Create a backup (optional)
pg_dump -h localhost -U your_user -d your_database > backup_$(date +%Y%m%d).sql
```

### Step 2: Run the Reset Script
```bash
cd EchoNest-AI-Theraphy
npm run db:reset-full
```

**What happens:**
1. Script displays a warning (3 second countdown)
2. Drops all tables in correct order
3. Recreates schema with migrations
4. Shows success message with next steps

### Step 3: Initialize Subscription Plans (Optional)
```bash
npm run init-subscription-plans
```

This creates the default subscription plans in the database.

### Step 4: Verify
```bash
# Option 1: Use Drizzle Studio
npm run db:studio

# Option 2: Direct SQL query
psql -d your_database -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
```

---

## What Gets Deleted

⚠️ **Everything:**
- ❌ All user accounts
- ❌ All chat threads and messages
- ❌ All therapist selections
- ❌ All subscription data
- ❌ All transaction history
- ❌ All mood tracking data
- ❌ All authentication sessions

✅ **What's Kept:**
- ✅ Database structure (tables will be recreated)
- ✅ Database connection settings
- ✅ Environment variables

---

## After Reset - Testing Checklist

### 1. Create New Test Account
```bash
# Start the dev server
npm run dev
```
- Go to http://localhost:3000/sign-up
- Create a new account with test email

### 2. Verify Credits
- [ ] Check user profile/dashboard
- [ ] Voice credits should show: **200**
- [ ] Chat credits should show: **200**
- [ ] NOT 50, NOT 250, NOT 400

### 3. Test Voice Chat Flow
- [ ] Click "Voice Chat" button
- [ ] Should go to therapist selection page
- [ ] Select a therapist
- [ ] Should navigate to voice chat page
- [ ] Voice chat should work with selected therapist

### 4. Test Therapist Selection
- [ ] Go back to therapist selection page
- [ ] Should see "Currently Selected" banner
- [ ] Click "Continue to Voice Chat" button
- [ ] Should go directly to voice chat
- [ ] Change therapist → verify it updates

### 5. Test Credit Deduction
- [ ] Use some chat messages
- [ ] Use voice chat for a bit
- [ ] Verify credits decrease correctly
- [ ] Check that free trial credits are used first

---

## Safety Features

The reset script has built-in safety features:

1. **Production Block:**
   ```typescript
   if (process.env.NODE_ENV === "production") {
     console.error("❌ BLOCKED: Cannot run in production!");
     process.exit(1);
   }
   ```

2. **3-Second Countdown:**
   - Gives you time to cancel (Ctrl+C)
   - Prevents accidental runs

3. **Clear Warnings:**
   - Lists exactly what will be deleted
   - Shows before/after status

---

## Troubleshooting

### Error: "Cannot drop table - foreign key constraint"
**Solution:** The script drops tables in the correct order. If this fails:
```sql
-- Manually drop with CASCADE
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO your_user;
```

### Error: "Migration failed"
**Solution:**
1. Check database connection in `.env`
2. Verify PostgreSQL is running
3. Check user permissions:
```sql
GRANT ALL PRIVILEGES ON DATABASE your_database TO your_user;
```

### Script Blocked in Production
**Solution:** Change environment:
```bash
NODE_ENV=development npm run db:reset-full
```

### Want to Reset Again
Just run the command again - it's idempotent:
```bash
npm run db:reset-full
```

---

## Migration vs Reset - Quick Comparison

| Feature | Migration (`db:migrate`) | Reset (`db:reset-full`) |
|---------|-------------------------|------------------------|
| Speed | Slower | Faster |
| Data Loss | Preserves data | Deletes everything |
| Consistency | May have issues | Clean slate |
| Testing Phase | Not recommended | ✅ **Recommended** |
| Production | ✅ Use this | ❌ Never use |
| Complexity | Complex | Simple |

---

## When to Use Each Approach

### Use Full Reset When:
- ✅ In testing/development phase
- ✅ Schema has fundamentally changed
- ✅ Don't need to preserve test data
- ✅ Want a clean slate
- ✅ Having migration issues

### Use Migration When:
- ✅ In production with real users
- ✅ Need to preserve user data
- ✅ Making incremental changes
- ✅ Data loss is unacceptable

---

## Quick Reference Commands

```bash
# Full database reset (testing phase)
npm run db:reset-full

# Run migrations only (production)
npm run db:migrate

# Initialize subscription plans
npm run init-subscription-plans

# Delete all users (keep schema)
npm run db:delete-users

# Open database studio
npm run db:studio

# Generate new migration
npm run db:generate

# Check migration status
npm run db:check
```

---

## Summary

For your testing phase with the new credit system:

1. ✅ **Run:** `npm run db:reset-full`
2. ✅ **Test:** Create new account → verify 200 credits
3. ✅ **Test:** Voice chat flow → therapist selection
4. ✅ **Deploy:** Push code after verification

**This is the cleanest approach for testing phase!** 🎯


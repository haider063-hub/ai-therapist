# Voice Credit Deduction System

## How It Works

### Real-Time Credit Deduction ✅

**Credits are deducted every 30 seconds during active voice chat:**

1. **Session Starts:**
   - Timer begins tracking session duration
   - Periodic interval starts (every 30 seconds)

2. **Every 30 Seconds:**
   - Calculates time since last deduction
   - Deducts credits based on actual time
   - Updates UI to show remaining credits
   - User sees credits decrease in real-time

3. **Session Ends:**
   - Deducts credits for any remaining time (even < 30 seconds)
   - Clears interval
   - Final UI update

---

## Credit Calculation Examples

### Exact Calculation (No Rounding)
**Credits deducted based on EXACT time used:**

| Duration | Exact Minutes | Calculation | Credits Deducted |
|----------|---------------|-------------|------------------|
| 30 sec | 0.5 minutes | 0.5 × 10 = 5 | **5 credits** |
| 1 min | 1.0 minutes | 1.0 × 10 = 10 | **10 credits** |
| 1 min 30 sec | 1.5 minutes | 1.5 × 10 = 15 | **15 credits** |
| 2 min 18 sec | 2.3 minutes | 2.3 × 10 = 23 | **23 credits** |
| 2 min 30 sec | 2.5 minutes | 2.5 × 10 = 25 | **25 credits** |
| 2 min 48 sec | 2.8 minutes | 2.8 × 10 = 28 | **28 credits** |
| 4 min | 4.0 minutes | 4.0 × 10 = 40 | **40 credits** |
| 4 min 15 sec | 4.25 minutes | 4.25 × 10 = 42.5 ≈ 43 | **43 credits** |
| 10 min 30 sec | 10.5 minutes | 10.5 × 10 = 105 | **105 credits** |

**Formula:** `Math.round((totalSeconds / 60) × 10)`

**This is FAIR pricing:**
- ✅ User pays for exactly what they use
- ✅ 30 seconds = 5 credits (not 10)
- ✅ No over-charging from rounding up
- ✅ Transparent and accurate

---

## Real-Time Deduction Timeline

**Example: 4 minute 15 second conversation**

| Time | Event | Credits Deducted | Total Deducted | Remaining |
|------|-------|------------------|----------------|-----------|
| 0:00 | Start session | 0 | 0 | 200 |
| 1:00 | First minute (60s) | 10 | 10 | 190 |
| 2:00 | Second minute (60s) | 10 | 20 | 180 |
| 3:00 | Third minute (60s) | 10 | 30 | 170 |
| 4:00 | Fourth minute (60s) | 10 | 40 | 160 |
| 4:15 | End session (15s = 0.25min) | 3* | 43 | 157 |

*15 seconds = 0.25 minutes × 10 = 2.5 ≈ 3 credits (rounded)

**Final: 4m 15s = 4.25 minutes × 10 = 42.5 ≈ 43 credits** ✅

---

**Example: 2 minute 30 second conversation**

| Time | Event | Credits Deducted | Total Deducted | Remaining |
|------|-------|------------------|----------------|-----------|
| 0:00 | Start session | 0 | 0 | 200 |
| 1:00 | First minute (60s) | 10 | 10 | 190 |
| 2:00 | Second minute (60s) | 10 | 20 | 180 |
| 2:30 | End session (30s = 0.5min) | 5 | 25 | 175 |

**Final: 2m 30s = 2.5 minutes × 10 = 25 credits** ✅
</thinking>

Wait, I need to fix the calculation logic! Currently it's rounding UP for each 30-second interval which over-charges. Let me adjust:

<function_calls>
<invoke name="search_replace">
<parameter name="file_path">EchoNest-AI-Theraphy/src/app/voice-chat/page.tsx

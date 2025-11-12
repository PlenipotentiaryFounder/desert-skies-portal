# Aircraft & Instruction Billing Separation Implementation

## Overview
The Desert Skies Portal billing system now **fully separates aircraft costs from instruction costs**, providing transparent itemized billing for students and proper accounting for the flight school.

---

## Database Schema

### Training Events Table - New Columns
```sql
ALTER TABLE training_events
ADD COLUMN aircraft_rental_cents INTEGER DEFAULT 0,
ADD COLUMN fuel_cost_cents INTEGER DEFAULT 0,
ADD COLUMN aircraft_total_cents INTEGER DEFAULT 0;
```

### Billing Breakdown Structure
Each `training_event` now tracks:
- **`student_charge_cents`**: Instruction cost (flight, ground, prebrief, postbrief)
- **`instructor_payout_cents`**: Instructor compensation
- **`aircraft_rental_cents`**: Aircraft rental cost (separate line item)
- **`fuel_cost_cents`**: Fuel cost (if tracked separately)
- **`aircraft_total_cents`**: Total aircraft costs (rental + fuel)
- **`dsa_margin_cents`**: DSA profit margin

### Student Payment Status
- `pending`: Unpaid, shows "Payment Required" banner
- `paid`: Paid, shows confirmation message with payment date

---

## UI Implementation

### 1. Mission Detail Page - Billing Summary Card
**Location**: `app/student/missions/[id]/page.tsx`

**Features**:
- ✅ **Itemized breakdown** for each training event (prebrief, flight, postbrief)
- ✅ **Separate line items** for:
  - Flight Instruction @ $XXX/hr
  - Aircraft Rental (Tail Number)
- ✅ **Cost Summary Section**:
  - Total Instruction
  - Total Aircraft Rental
  - **Grand Total**
- ✅ **Payment Status**:
  - 🟠 **Pending**: Shows orange alert with "Pay Now" and "Add Funds" buttons
  - ✅ **Paid**: Shows green confirmation with payment date

**Example Display**:
```
┌─────────────────────────────────────────────────┐
│ 🧾 Billing Summary                              │
├─────────────────────────────────────────────────┤
│ ✈️  Flight                         $486.00      │
│   Flight Instruction @ $150/hr     $270.00      │
│   Aircraft Rental (N12345)         $216.00      │
├─────────────────────────────────────────────────┤
│ 🕐  Prebrief                       $37.50       │
│   Flight Instruction @ $75/hr      $37.50       │
├─────────────────────────────────────────────────┤
│ 🕐  Postbrief                      $37.50       │
│   Flight Instruction @ $75/hr      $37.50       │
├─────────────────────────────────────────────────┤
│ Total Instruction                  $345.00      │
│ Total Aircraft Rental              $216.00      │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│ 💰 Total                           $561.00      │
├─────────────────────────────────────────────────┤
│ ⚠️  Payment Required: $561.00 is owed          │
│ [Pay Now] [Add Funds]                           │
└─────────────────────────────────────────────────┘
```

### 2. Mission Cards - Total Cost Display
**Location**: `app/student/schedule/student-missions-list.tsx`

**Features**:
- ✅ Shows **Total Cost** on completed mission cards
- ✅ Displays along with flight/ground hours
- ✅ Clean, professional display

**Example**:
```
┌─────────────────────────────────────────┐
│ DSA-PPC-F0 - Introduction to Flight     │
│ Status: Completed                       │
├─────────────────────────────────────────┤
│ ✈️  1.8 hrs    📚 1.0 hrs              │
│ Total Cost: $561.00                     │
└─────────────────────────────────────────┘
```

### 3. Dashboard Calendar Integration
**Location**: `app/student/dashboard/StudentScheduleCalendar.tsx`

**Features**:
- ✅ **Color-coded calendar** showing all missions
- ✅ **Mission types** with distinct colors:
  - 🔵 **Blue**: Flight missions
  - 🟢 **Green**: Ground instruction
  - 🟣 **Purple**: Simulator sessions
- ✅ **Visual indicators** for POA availability
- ✅ **Click to view** mission details
- ✅ **Fully integrated** with dashboard schedule tab

---

## Billing Rates Example

### Current Demo Configuration
```
Flight Instruction: $150/hr
Ground Instruction: $75/hr
Aircraft Rental:    $120/hr
```

### Example Mission Calculation (DSA-PPC-F0)
```
Prebrief:  0.5 hrs × $75/hr  = $37.50  (instruction only)
Flight:    1.8 hrs × $150/hr = $270.00 (instruction)
           1.8 hrs × $120/hr = $216.00 (aircraft)
Postbrief: 0.5 hrs × $75/hr  = $37.50  (instruction only)
───────────────────────────────────────────────────
Total Instruction:  $345.00
Total Aircraft:     $216.00
GRAND TOTAL:        $561.00
```

---

## Payment Workflow

### When Mission is Completed
1. ✅ Both instructor and student enter PINs
2. ✅ Mission status → `completed`
3. ✅ Training events → `completed`
4. ✅ Billing calculated and posted
5. ✅ `student_payment_status` → `pending` (by default)

### Student Payment Options

#### Option 1: Account Balance (Prepaid)
- Student has funds in their wallet
- Payment automatically deducted
- `student_payment_status` → `paid`

#### Option 2: Pay Later
- Student sees "Payment Required" alert
- Can click **"Pay Now"** → `/student/billing/pay-balance`
- Can click **"Add Funds"** → `/student/billing/add-funds`

---

## Aircraft Billing Configuration

### Future Flexibility (Already in Schema)
The system supports multiple aircraft billing models:

```sql
-- From aircraft_billing_config table
billing_model:
  - 'dsa_owned'    → DSA owns, direct rental
  - 'dsa_leased'   → DSA leases, pass-through costs
  - 'third_party'  → External owner, marketplace model
  - 'passthrough'  → Student pays owner directly, DSA takes fee
```

### Current Implementation
- Default: **Bundled** (instruction + aircraft = single student_charge_cents)
- **Now Enhanced**: Separate tracking with `aircraft_rental_cents`
- Can support **unbundled** billing in future

---

## Key Files Modified

1. **Database Migration**: Added aircraft cost columns
   - `training_events.aircraft_rental_cents`
   - `training_events.fuel_cost_cents`
   - `training_events.aircraft_total_cents`

2. **Mission Detail Page**: `app/student/missions/[id]/page.tsx`
   - Enhanced billing summary card
   - Separate instruction and aircraft costs
   - Payment status with action buttons

3. **Mission Cards**: `app/student/schedule/student-missions-list.tsx`
   - Added total cost display for completed missions
   - Integrated with existing hours display

4. **Dashboard Calendar**: `app/student/dashboard/StudentScheduleCalendar.tsx`
   - NEW: Color-coded calendar component
   - Shows all scheduled and in-progress missions
   - Proper mission type mapping (F/G/S)

5. **Dashboard Integration**: `app/student/dashboard/page.tsx`
   - Added calendar to schedule tab
   - Imports missions data properly

6. **Dashboard Data Service**: `components/student/dashboard/StudentDashboardData.tsx`
   - Added missions array to interface
   - Fetches missions for calendar display

---

## Testing with Demo Data

### Current Demo Mission (DSA-PPC-F0)
```sql
-- Mission: DSA-PPC-F0 (Completed)
-- Student: Russ Johnson

Training Events:
1. Prebrief:  $37.50 (instruction)
2. Flight:    $270.00 (instruction) + $216.00 (aircraft) = $486.00
3. Postbrief: $37.50 (instruction)

Total: $561.00
Payment Status: PENDING (demo shows "Payment Required" flow)
```

To test paid status:
```sql
UPDATE training_events 
SET student_payment_status = 'paid' 
WHERE mission_id IN (
  SELECT id FROM missions WHERE mission_code = 'DSA-PPC-F0'
);
```

---

## Benefits

### For Students
✅ **Transparency**: Clear breakdown of what they're paying for
✅ **Flexibility**: Can see instruction vs aircraft costs separately
✅ **Control**: Easy access to payment options when balance owed

### For Instructors
✅ **Accuracy**: Precise tracking of billable instruction time
✅ **Separation**: Aircraft costs don't affect instructor payout calculations

### For Flight School (DSA)
✅ **Accounting**: Proper separation for bookkeeping and tax reporting
✅ **Aircraft Management**: Track aircraft rental revenue separately
✅ **Scalability**: Ready for multiple aircraft billing models (owned, leased, third-party)
✅ **Marketplace Ready**: Can support future third-party aircraft integration

---

## Next Steps (Future Enhancements)

1. **Aircraft Configuration UI**: Admin panel to set aircraft rental rates
2. **Fuel Tracking**: Separate fuel costs from rental (if using Hobbs + fuel receipts)
3. **Third-Party Aircraft**: Support for private aircraft owners on platform
4. **Dynamic Pricing**: Time-of-day, weather-based pricing adjustments
5. **Bundled vs Unbundled**: Toggle for "all-inclusive" vs itemized pricing

---

## Questions Answered

### Q: Does the billing system separate instructor costs from aircraft rental?
**A: YES** ✅ 
- `student_charge_cents`: Instruction cost
- `aircraft_rental_cents`: Aircraft rental cost
- Both displayed separately to students

### Q: Where is the total price shown on completed missions?
**A: Multiple places** ✅
- Mission detail page: Full itemized breakdown
- Mission card: Total cost badge
- Both show payment status (paid vs owed)

### Q: How does the calendar work?
**A: Fully integrated** ✅
- Dashboard schedule tab shows color-coded calendar
- Uses same mission data as schedule page
- Click any mission to view details
- Visual indicators for POA availability

---

## Summary

The Desert Skies Portal now provides:
1. ✅ **Complete cost transparency** with instruction and aircraft separated
2. ✅ **Professional billing UI** with itemized breakdowns
3. ✅ **Payment workflow** with clear status and action buttons
4. ✅ **Integrated calendar** showing all missions with proper color-coding
5. ✅ **Scalable architecture** ready for complex billing scenarios

Students can now see exactly what they're paying for, and the flight school has the flexibility to support multiple aircraft ownership and billing models.


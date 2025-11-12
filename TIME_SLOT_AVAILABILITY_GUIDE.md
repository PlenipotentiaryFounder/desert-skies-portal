# Time Slot Availability Feature

## Overview
Students can now specify **exactly when they're available** during the day, making scheduling more precise and reducing back-and-forth communication with instructors.

---

## ✨ New Time Slot Options

When setting availability to **"Available"**, students now see 5 time slot options:

| Time Slot | Icon | Time Range | Use Case |
|-----------|------|------------|----------|
| **All Day** | ☀️ | Any Time | Flexible, available anytime |
| **Morning** | 🌅 | 6 AM - 11 AM | Early flights, best weather |
| **Afternoon** | ☀️ | 12 PM - 3 PM | Midday training |
| **Evening** | 🌆 | 3 PM - 7 PM | After work/school |
| **Night** | 🌙 | 8 PM - 12 AM | Night training, advanced students |

---

## 🎨 UI Design

### When Student Clicks "Set Availability" → "Available"

```
┌─────────────────────────────────────────────────────┐
│ 📅 Friday, November 15, 2024                        │
│ Request a flight or set your availability           │
├─────────────────────────────────────────────────────┤
│ [Request Flight]  [✓ Set Availability]              │
├─────────────────────────────────────────────────────┤
│ Your Availability                                   │
│ ┌──────────────┐  ┌──────────────┐                 │
│ │✅ Available  │  │ Not Available│                  │
│ └──────────────┘  └──────────────┘                 │
├─────────────────────────────────────────────────────┤
│ When are you available?                             │
│ ┌──────────────┐  ┌──────────────┐                 │
│ │ ☀️ All Day   │  │ 🌅 Morning   │                 │
│ │ Any Time     │  │ 6 AM - 11 AM │                 │
│ └──────────────┘  └──────────────┘                 │
│ ┌──────────────┐  ┌──────────────┐                 │
│ │ ☀️ Afternoon │  │ 🌆 Evening   │                 │
│ │ 12 PM - 3 PM │  │ 3 PM - 7 PM  │                 │
│ └──────────────┘  └──────────────┘                 │
│ ┌──────────────┐                                    │
│ │ 🌙 Night     │                                    │
│ │ 8 PM - 12 AM │                                    │
│ └──────────────┘                                    │
├─────────────────────────────────────────────────────┤
│ Notes (Optional)                                    │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Prefer early morning flights due to work        │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ [Cancel]  [Save Availability]                       │
└─────────────────────────────────────────────────────┘
```

### Visual Indicators

**Selected Time Slot:**
- ✅ Blue border (`border-aviation-sky-500`)
- Blue background (`bg-aviation-sky-50`)
- Checkmark icon on the right
- Box shadow for emphasis

**Unselected Time Slot:**
- Gray border
- White/transparent background
- Hover effect (slightly blue border)

---

## 📊 Database Storage

### Time Ranges Saved

The system converts friendly time slot names to actual time ranges:

```typescript
const timeSlotMap = {
  all_day: { start: null, end: null },          // NULL = available anytime
  morning: { start: '06:00', end: '11:00' },
  afternoon: { start: '12:00', end: '15:00' },
  evening: { start: '15:00', end: '19:00' },
  night: { start: '20:00', end: '23:59' }
}
```

### Database Record Example

```sql
-- Student marks "Morning" availability
INSERT INTO student_availability (
  student_id,
  date,
  status,
  start_time,
  end_time,
  notes
) VALUES (
  'uuid-123',
  '2024-11-15',
  'available',
  '06:00',        -- 6 AM
  '11:00',        -- 11 AM
  'Prefer early morning flights due to work'
);
```

---

## 🔄 User Workflows

### Workflow 1: Mark All Day Availability
1. Click empty day on calendar
2. Modal opens
3. Click **"Set Availability"** tab
4. Click **"Available"** button
5. **"All Day"** is pre-selected ✅
6. Click **"Save Availability"**
7. Toast: "Marked as Available ✅"
8. Calendar day shows **green highlight**

### Workflow 2: Mark Morning-Only Availability
1. Click empty day
2. Select **"Set Availability"**
3. Select **"Available"**
4. Click **"🌅 Morning (6 AM - 11 AM)"** button
5. Optionally add note: "Prefer early flights"
6. Click **"Save Availability"**
7. Toast: "Marked as Available (morning) ✅"
8. Calendar day shows **green highlight**
9. Instructor can see: "Available 6 AM - 11 AM"

### Workflow 3: Mark Not Available
1. Click empty day
2. Select **"Set Availability"**
3. Click **"Not Available"** button
4. Time slots are **hidden** (not relevant)
5. Add note: "Vacation"
6. Click **"Save Availability"**
7. Toast: "Marked as Not Available ❌"
8. Calendar day shows **red highlight**

---

## 💡 UX Improvements

### Progressive Disclosure
- ✅ Time slots **only show** when "Available" is selected
- ❌ Time slots **hidden** when "Not Available" is selected
- 🎯 Reduces cognitive load - only show relevant options

### Smart Defaults
- ✅ **"All Day"** is pre-selected (most common case)
- ✅ Students can quickly save without changing anything
- ✅ One-click for common actions

### Visual Clarity
- ✅ **Icons** for each time slot (🌅 🌆 🌙)
- ✅ **Time ranges** clearly displayed
- ✅ **Selected state** is obvious (checkmark + blue highlight)
- ✅ **Hover effects** for discoverability

### Helpful Feedback
- ✅ Toast shows **which time slot** was selected
  - "Marked as Available ✅" (if all day)
  - "Marked as Available (morning) ✅" (if specific slot)
- ✅ Calendar updates **immediately**
- ✅ Instructor can see **exact availability**

---

## 🎯 Benefits

### For Students
✅ **Precise scheduling**: "I'm only free in the mornings"  
✅ **No back-and-forth**: Instructor knows exact windows  
✅ **Realistic expectations**: Can't be scheduled outside availability  
✅ **Work/school friendly**: Evening slots for busy students  

### For Instructors
✅ **Better planning**: See when students are actually available  
✅ **Fewer conflicts**: Don't schedule outside student's time windows  
✅ **Efficient scheduling**: Match student availability with aircraft/weather  
✅ **Clear communication**: No guessing about student preferences  

### For Flight School
✅ **Higher utilization**: Fill time slots more efficiently  
✅ **Fewer cancellations**: Students set realistic availability  
✅ **Better student experience**: Flexible, accommodating scheduling  
✅ **Competitive advantage**: Modern, intuitive scheduling system  

---

## 📊 Example Scenarios

### Scenario 1: Full-Time Student
**Availability Pattern:**
- Monday-Friday: **All Day** (flexible schedule)
- Saturday-Sunday: **Morning** (family time in afternoons)

**Result:** Instructor can schedule anytime M-F, only mornings on weekends

---

### Scenario 2: Working Professional
**Availability Pattern:**
- Monday-Friday: **Evening** (after 5 PM work)
- Saturday-Sunday: **Morning + Afternoon** (full day weekends)

**Result:** Instructor schedules evening weekday flights, full days on weekends

---

### Scenario 3: Part-Time Student
**Availability Pattern:**
- Tuesday: **Afternoon**
- Thursday: **Afternoon**
- Saturday: **All Day**

**Result:** Instructor knows exact days/times, doesn't ask about unavailable days

---

## 🔮 Future Enhancements

### Phase 2: Enhanced Time Slots
- ✅ **Custom time ranges**: "I'm available 7 AM - 10 AM"
- ✅ **Multiple slots per day**: "Morning OR evening (not afternoon)"
- ✅ **Half-day slots**: "8 AM - 12 PM", "1 PM - 5 PM"

### Phase 3: Recurring Availability
- ✅ **Weekly patterns**: "Every Tuesday morning"
- ✅ **Templates**: "My typical weekly schedule"
- ✅ **Exceptions**: "Not this week due to vacation"

### Phase 4: Smart Scheduling
- ✅ **Automatic suggestions**: "5 students available Saturday morning"
- ✅ **Conflict detection**: "This conflicts with your work hours"
- ✅ **Weather integration**: "Only show morning slots (better weather)"

---

## 📝 Technical Implementation

### API Request Format

```json
POST /api/student/availability
{
  "date": "2024-11-15",
  "status": "available",
  "start_time": "06:00",    // or null for all day
  "end_time": "11:00",       // or null for all day
  "notes": "Prefer early morning flights"
}
```

### Database Query Example

**Find students available in the morning:**
```sql
SELECT s.id, s.first_name, s.last_name, sa.date
FROM student_availability sa
JOIN profiles s ON s.id = sa.student_id
WHERE sa.date = '2024-11-15'
  AND sa.status = 'available'
  AND (
    -- All day availability
    (sa.start_time IS NULL AND sa.end_time IS NULL)
    OR
    -- Morning slot overlaps with 6-11
    (sa.start_time <= '11:00' AND sa.end_time >= '06:00')
  );
```

---

## 🎉 Summary

The **Time Slot Availability** feature makes scheduling **precise, intuitive, and frictionless**:

**Speed:**
- ⚡ 5 pre-defined time slots (no typing required)
- ⚡ One-click selection
- ⚡ Smart defaults (All Day)

**Clarity:**
- 🎨 Icons for each slot
- 🎨 Clear time ranges displayed
- 🎨 Visual feedback (checkmarks, colors)

**Simplicity:**
- ✅ Progressive disclosure (hide when not relevant)
- ✅ Only show 5 most common time ranges
- ✅ No complex time pickers

**Result:**
Students can set precise availability in **3 clicks, 5 seconds**. Instructors get **clear, actionable scheduling information**. Everyone saves time. 🚀


# Flight Time Entry - Flexible Dual-Method System 🎯

## Overview

The Desert Skies Mission Workflow System now supports **TWO methods** for recording flight time, giving instructors maximum flexibility:

### Method 1: Direct Entry (Recommended for Simplicity)
✅ Enter total flight hours as a decimal number (e.g., `1.5` for 1 hour 30 minutes)  
✅ Perfect for quick entry  
✅ No calculation needed  

### Method 2: Hobbs Start/Stop (Traditional)
✅ Enter hobbs meter reading at start (e.g., `1234.5`)  
✅ Enter hobbs meter reading at end (e.g., `1236.0`)  
✅ System automatically calculates flight time: `1.5 hours`  
✅ Provides audit trail of actual meter readings  

---

## How It Works

### Database Schema
```sql
-- training_events table has THREE fields for flight time:
hobbs_start          NUMERIC(10,2)  -- Method 2: Start reading
hobbs_end            NUMERIC(10,2)  -- Method 2: End reading  
total_flight_hours   NUMERIC(5,2)   -- Method 1: Direct entry
```

### Billing Calculation Priority
The system intelligently chooses which method to use:

1. **Direct Entry First** - If `total_flight_hours` has a value > 0
2. **Hobbs Calculation** - If `hobbs_start` and `hobbs_end` are provided
3. **Duration Fallback** - Uses `actual_duration_minutes` if neither method provided

```typescript
// From training-event-service.ts
if (event.billing_category === "flight_instruction") {
  // METHOD 1: Direct total flight hours entry (preferred)
  if (event.total_flight_hours && event.total_flight_hours > 0) {
    billableHours = event.total_flight_hours
  }
  // METHOD 2: Calculate from hobbs start/stop
  else if (event.hobbs_start && event.hobbs_end) {
    billableHours = event.hobbs_end - event.hobbs_start
  }
  // FALLBACK: Use actual duration
  else if (event.actual_duration_minutes) {
    billableHours = event.actual_duration_minutes / 60
  }
}
```

---

## User Interface

### Debrief Form (`/instructor/missions/[id]/debrief`)

The flight time entry UI only appears for **flight missions** (mission_type = 'F'):

```tsx
{/* Flight Time Entry */}
{mission.mission_type === 'F' && (
  <Card>
    <CardHeader>
      <CardTitle>⏱️ Flight Time</CardTitle>
      <CardDescription>
        Choose your preferred method for recording flight time
      </CardDescription>
    </CardHeader>
    <CardContent>
      {/* Toggle between methods */}
      <Button onClick={() => setFlightTimeMethod("direct")}>
        Direct Entry
      </Button>
      <Button onClick={() => setFlightTimeMethod("hobbs")}>
        Hobbs Start/Stop
      </Button>
      
      {/* Conditional fields based on method */}
    </CardContent>
  </Card>
)}
```

#### Direct Entry UI
```
┌──────────────────────────────────────┐
│ Total Flight Time (hours)            │
│ ┌──────────────┐                     │
│ │ 1.5          │ hrs                 │
│ └──────────────┘                     │
│ Enter as decimal (e.g., 1.5 = 1h 30m)│
└──────────────────────────────────────┘
```

#### Hobbs Start/Stop UI
```
┌────────────────────┬────────────────────┐
│ Hobbs Start        │ Hobbs End          │
│ ┌────────────┐     │ ┌────────────┐     │
│ │ 1234.5     │     │ │ 1236.0     │     │
│ └────────────┘     │ └────────────┘     │
└────────────────────┴────────────────────┘
┌──────────────────────────────────────────┐
│ ℹ️ Flight time: 1.5 hours                │
└──────────────────────────────────────────┘
```

---

## Benefits

### For Instructors
✅ **Choose your workflow** - Use what's comfortable  
✅ **Quick debrief completion** - Direct entry when you know the time  
✅ **Audit trail** - Hobbs readings when you need documentation  
✅ **Error prevention** - Auto-calculation reduces math errors  

### For Students
✅ **Accurate billing** - Precise flight time = fair charges  
✅ **Logbook accuracy** - Correct hours for FAA requirements  
✅ **Transparency** - See exactly how time was calculated  

### For Administrators
✅ **Flexibility** - Accommodate different instructor preferences  
✅ **Data integrity** - Multiple validation points  
✅ **Audit capability** - Hobbs readings when needed  

---

## Implementation Files

### Backend
- **`lib/training-event-service.ts`**
  - `TrainingEvent` interface updated with `total_flight_hours`
  - `calculateEventBilling()` supports both methods
  - `completeTrainingEvent()` accepts both input types

### Frontend
- **`components/instructor/debrief-form.tsx`**
  - Method toggle state management
  - Conditional UI rendering
  - Auto-calculation display for hobbs method
  - Form submission includes correct fields

### Database
- **`database/add-total-flight-hours-column.sql`**
  - Migration to add `total_flight_hours` column

---

## Usage Examples

### Example 1: Direct Entry
```typescript
const completionData = {
  total_flight_hours: 1.5,  // 1 hour 30 minutes
  // ... other fields
}

await completeTrainingEvent(eventId, completionData)
// Result: Billable hours = 1.5
```

### Example 2: Hobbs Start/Stop
```typescript
const completionData = {
  hobbs_start: 1234.5,
  hobbs_end: 1236.0,
  // ... other fields
}

await completeTrainingEvent(eventId, completionData)
// Result: Billable hours = 1.5 (calculated: 1236.0 - 1234.5)
```

### Example 3: Mixed Usage (Same Mission, Different Events)
```typescript
// Pre-brief event - uses duration
event1: { actual_duration_minutes: 30 }  // 0.5 hrs ground

// Flight event - uses direct entry
event2: { total_flight_hours: 1.5 }      // 1.5 hrs flight

// Post-brief event - uses hobbs for documentation
event3: { 
  hobbs_start: 1234.5, 
  hobbs_end: 1236.0,
  actual_duration_minutes: 30 
}
```

---

## Validation Rules

### Input Validation
- `total_flight_hours`: Must be between 0.1 and 24.0
- `hobbs_start`: Must be non-negative
- `hobbs_end`: Must be > `hobbs_start`
- Calculated hobbs time: Must be reasonable (< 24 hours)

### Business Logic
- Ground events: Always use `actual_duration_minutes`
- Flight events: Prefer `total_flight_hours` or `hobbs` calculation
- Simulator events: Use `actual_duration_minutes` unless hobbs provided

---

## Migration to New System

### For Existing Implementations

1. **Add Database Column**
   ```sql
   ALTER TABLE training_events 
   ADD COLUMN total_flight_hours NUMERIC(5,2);
   ```

2. **Update Service Layer**
   - Already implemented in `lib/training-event-service.ts`
   - Backwards compatible with existing hobbs-only code

3. **Update UI Components**
   - Already implemented in `components/instructor/debrief-form.tsx`
   - Toggle provides smooth UX

4. **Data Migration** (Optional)
   ```sql
   -- Backfill total_flight_hours from existing hobbs readings
   UPDATE training_events
   SET total_flight_hours = hobbs_end - hobbs_start
   WHERE hobbs_start IS NOT NULL 
     AND hobbs_end IS NOT NULL
     AND total_flight_hours IS NULL;
   ```

---

## API Integration

### Complete Training Event
```typescript
POST /api/instructor/training-events/[id]/complete

// Body with direct entry
{
  "total_flight_hours": 1.5,
  "weather_conditions": {...},
  "notes": "Excellent flight"
}

// OR Body with hobbs
{
  "hobbs_start": 1234.5,
  "hobbs_end": 1236.0,
  "weather_conditions": {...},
  "notes": "Excellent flight"
}
```

### Create Debrief
```typescript
POST /api/instructor/debriefs

{
  "mission_id": "uuid",
  "total_flight_hours": 1.5,  // OR hobbs_start + hobbs_end
  "maneuver_details": [...],
  "key_takeaways": [...]
}
```

---

## Future Enhancements

### Potential Additions
- ✈️ **Tach time support** (similar dual-method for tach meters)
- 📊 **Historical analysis** - Compare hobbs vs direct entry accuracy
- 🔔 **Smart suggestions** - "Based on scheduled time, did you mean 1.5 hrs?"
- 📱 **Mobile optimization** - Quick time entry from mobile devices
- 🤖 **AI estimation** - Suggest flight time based on route and conditions

---

## Best Practices

### When to Use Direct Entry
✅ You know the exact flight time  
✅ Quick debrief needed  
✅ Hobbs meter is inoperative  
✅ Student prefers simplified process  

### When to Use Hobbs Start/Stop
✅ Aircraft rental requires hobbs documentation  
✅ Maintenance tracking needs meter readings  
✅ Audit trail required for billing disputes  
✅ Insurance documentation needed  

---

## Summary

This flexible dual-method system provides the **best of both worlds**:
- Simple when you need speed
- Detailed when you need documentation
- Always accurate for billing
- Always compliant with FAA requirements

🎯 **Result**: Instructors save time, students get accurate billing, and the school maintains professional standards.












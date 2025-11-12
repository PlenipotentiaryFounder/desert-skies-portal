# Mission Time Blocking Specification

## Overview
Desert Skies Portal uses a structured time blocking system for training missions to ensure efficient scheduling and proper resource allocation for both students and instructors.

## Time Block Structure

### Standard Mission Timeline

```
Student Arrival Time (e.g., 7:00 AM)
    ↓
[30 min] PRE-FLIGHT (Student Only)
    - Student inspects aircraft
    - Instructor NOT required
    ↓
[30 min] PRE-BRIEF (Student + Instructor)
    - Review Plan of Action
    - Discuss objectives & maneuvers
    - Weather briefing
    - Safety considerations
    ↓
[Variable] FLIGHT/GROUND/SIM SESSION
    - Duration depends on lesson
    - Both student and instructor
    ↓
[30 min] POST-BRIEF (Student + Instructor)
    - Review performance
    - Debrief maneuvers
    - Record scores
    - Assign homework
```

### Example: 2-Hour Flight Mission at 7:00 AM

| Time Block | Duration | Activity | Student | Instructor |
|------------|----------|----------|---------|------------|
| 7:00-7:30 | 30 min | Pre-flight Inspection | ✅ Outside | ❌ Not needed |
| 7:30-8:00 | 30 min | Pre-brief | ✅ Inside | ✅ Inside |
| 8:00-10:00 | 2 hrs | Flight Training | ✅ Flying | ✅ Flying |
| 10:00-10:30 | 30 min | Post-brief/Debrief | ✅ Inside | ✅ Inside |
| **Total** | **3.5 hrs** | **Student's Day** | | |
| **Instructor Time** | **3 hrs** | **(no pre-flight)** | | |

## Back-to-Back Scheduling

### How It Works
Instructors can schedule students back-to-back by starting the next student's pre-flight during the previous student's post-brief.

### Example: Two Students Back-to-Back

**Student 1:**
- 7:00-7:30: Pre-flight (alone)
- 7:30-8:00: Pre-brief (with instructor)
- 8:00-10:00: Flight (with instructor)
- 10:00-10:30: Post-brief (with instructor)

**Student 2:**
- 10:00-10:30: Pre-flight (alone) ← **Starts during Student 1's post-brief**
- 10:30-11:00: Pre-brief (with instructor) ← **Instructor finishes with Student 1**
- 11:00-1:00: Flight (with instructor)
- 1:00-1:30: Post-brief (with instructor)

### Key Benefits
1. **Maximizes Instructor Time** - No idle time between students
2. **Aircraft Efficiency** - Plane is pre-flighted while previous student debriefs
3. **Flexible Scheduling** - Students can overlap without conflicts

## Availability Checking

### Student Availability
- Student blocked for: Pre-flight + Pre-brief + Flight + Post-brief
- Total time: Flight duration + 90 minutes
- Example: 2hr flight = 3.5hr total block

### Instructor Availability  
- Instructor blocked for: Pre-brief + Flight + Post-brief
- NOT blocked during student's pre-flight
- Total time: Flight duration + 60 minutes
- Example: 2hr flight = 3hr instructor block

### Conflict Detection Rules

1. **Student Conflicts:**
   ```
   Blocked from: Mission Start Time (arrival)
   Blocked until: Mission Start Time + Flight Duration + 90min
   ```

2. **Instructor Conflicts:**
   ```
   Blocked from: Mission Start Time + 30min (after pre-flight)
   Blocked until: Mission Start Time + Flight Duration + 90min
   ```

3. **Aircraft Conflicts:**
   ```
   Blocked from: Mission Start Time + 30min (after pre-flight complete)
   Blocked until: Mission Start Time + Flight Duration + 60min (after debrief)
   ```

## Mission Types & Durations

### Flight Missions (F)
- **Default Duration**: Varies by lesson (1.0 - 2.5 hours typical)
- **Pre-flight**: Always 30 minutes
- **Pre-brief**: 30 minutes
- **Post-brief**: 30 minutes
- **Total Add-on**: +90 minutes for student, +60 for instructor

### Ground Missions (G)
- **Default Duration**: 1-2 hours typical
- **Pre-flight**: None (N/A)
- **Pre-brief**: 15 minutes (shorter)
- **Post-brief**: 15 minutes (shorter)
- **Total Add-on**: +30 minutes

### Simulator Missions (S)
- **Default Duration**: 1-2 hours typical
- **Pre-flight**: 15 minutes (pre-sim setup)
- **Pre-brief**: 30 minutes
- **Post-brief**: 30 minutes
- **Total Add-on**: +75 minutes

## Calendar Display Rules

### Time Slot Availability
When displaying available time slots:

1. **Show as AVAILABLE if:**
   - No student conflicts (check student's calendar)
   - No instructor conflicts (check instructor's calendar)  
   - Aircraft available (if flight mission)

2. **Show as UNAVAILABLE if:**
   - Student has ANY overlapping event
   - Instructor has overlapping event (accounting for 30min offset)
   - Aircraft is in use

3. **Show as WARNING if:**
   - Close to another mission (< 15 min buffer)
   - Weather forecast poor (future enhancement)
   - Maintenance scheduled (future enhancement)

### Visual Indicators
- ✅ Green/Available: Completely free
- 🟡 Yellow/Warning: Possible conflict or tight schedule
- ⛔ Red/Unavailable: Definite conflict
- 🔵 Blue/Selected: Currently selected time

## Implementation Notes

### Database Fields Required
```typescript
interface Mission {
  scheduled_date: string          // Date of mission
  scheduled_start_time: string    // Student arrival time (e.g., "07:00")
  student_start_time: string      // Same as scheduled_start_time
  instructor_start_time: string   // scheduled_start_time + 30min
  estimated_duration: number      // Flight/ground/sim duration in minutes
  pre_flight_duration: number     // Default: 30min (F), 0min (G), 15min (S)
  pre_brief_duration: number      // Default: 30min (F/S), 15min (G)
  post_brief_duration: number     // Default: 30min (F/S), 15min (G)
  total_student_time: number      // Calculated: all durations combined
  total_instructor_time: number   // Calculated: all except pre-flight
}
```

### Calculation Functions
```typescript
function calculateMissionTimes(
  missionType: 'F' | 'G' | 'S',
  startTime: string,
  flightDuration: number
) {
  const blocks = getMissionBlocks(missionType)
  
  return {
    student_start_time: startTime,
    instructor_start_time: addMinutes(startTime, blocks.pre_flight),
    pre_flight_end: addMinutes(startTime, blocks.pre_flight),
    pre_brief_end: addMinutes(startTime, blocks.pre_flight + blocks.pre_brief),
    flight_end: addMinutes(startTime, blocks.pre_flight + blocks.pre_brief + flightDuration),
    post_brief_end: addMinutes(startTime, blocks.pre_flight + blocks.pre_brief + flightDuration + blocks.post_brief),
    total_student_time: blocks.pre_flight + blocks.pre_brief + flightDuration + blocks.post_brief,
    total_instructor_time: blocks.pre_brief + flightDuration + blocks.post_brief
  }
}

function getMissionBlocks(missionType: 'F' | 'G' | 'S') {
  const blocks = {
    F: { pre_flight: 30, pre_brief: 30, post_brief: 30 },
    G: { pre_flight: 0, pre_brief: 15, post_brief: 15 },
    S: { pre_flight: 15, pre_brief: 30, post_brief: 30 }
  }
  return blocks[missionType]
}
```

## Future Enhancements

1. **Dynamic Duration Estimation**
   - Pull estimated duration from syllabus_lessons table
   - Adjust based on student's historical performance
   - Weather-based time adjustments

2. **Automatic Buffer Time**
   - Add 15-minute buffer between missions
   - Prevent back-to-back burnout
   - Allow for aircraft turnaround

3. **Student Calendar Integration**
   - Pull from student's Google/Outlook calendar
   - Show conflicts automatically
   - Request availability before scheduling

4. **Multi-Aircraft Support**
   - Check all aircraft availability
   - Suggest alternative aircraft
   - Track maintenance schedules

5. **Weather Integration**
   - Flag missions on poor weather days
   - Suggest alternate dates
   - Auto-reschedule when weather improves

---

**Status**: Documented (Not yet fully implemented)
**Priority**: High - Core scheduling feature
**Implementation Phase**: Phase 1 (Basic blocking), Phase 2 (Smart conflicts), Phase 3 (Auto-scheduling)


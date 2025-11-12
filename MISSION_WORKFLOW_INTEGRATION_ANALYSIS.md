# Mission Workflow System - Integration Analysis

## 🎯 Executive Summary

**Mission System vs. Flight Sessions: Key Difference**
- **Flight Sessions** = Simple scheduled training sessions (current system)
- **Missions** = Comprehensive pedagogical wrappers that include:
  - Pre-mission Plan of Action
  - Multiple Training Events (pre-brief, flight, ground, post-brief)
  - Post-mission Debrief with AI formatting
  - Longitudinal maneuver progress tracking
  - Granular billing per training event

---

## ✅ **WHAT WE ALREADY HAVE (Existing Infrastructure)**

### **Student Dashboard**
- **Location**: `app/student/dashboard/page.tsx`
- **Status**: ✅ FULLY BUILT
- **Features**:
  - Overview tab with stats
  - Training Progress tab
  - Training Schedule tab
  - Enhanced Training tab
  - Notifications tab
  - Quick Actions (Schedule Flight, View Syllabus, Documents, Progress)
  - Weather integration
  - Aircraft data
  - Flight performance charts
  - Maneuver performance visualization

**Navigation** (from `app/student/layout.tsx`):
- Dashboard
- Logbook
- Syllabus
- **Flight Sessions** ← Current system
- Schedule
- Documents
- Maintenance
- FAA Requirements
- Profile
- Billing
- Settings

### **Instructor Dashboard**
- **Location**: `app/instructor/dashboard/page.tsx`
- **Status**: ✅ FULLY BUILT
- **Features**:
  - Overview tab
  - Student Management tab
  - Reports & Analytics tab
  - Flight Hours tracking
  - Student Progress tracking
  - Weather integration
  - Quick Actions (View Invoices, Manage Rates, Student Accounts, Create Invoice)

**Navigation** (from `app/instructor/layout.tsx`):
- Dashboard
- Students
- Syllabi
- **Flight Sessions** ← Current system
- Schedule
- Documents
- Maintenance
- Endorsements
- Profile
- Settings

### **Flight Sessions System (Current)**
#### Student Side:
- **`/student/flight-sessions`** - List view of all sessions
- **`/student/flight-sessions/[id]`** - Detailed session view with:
  - Session overview (date, time, instructor, aircraft)
  - Lesson information
  - Flight data (Hobbs, duration)
  - Maneuver scores
  - Notes & feedback
  - Weather conditions

#### Instructor Side:
- **`/instructor/schedule`** - Calendar view of flight sessions
- **`/instructor/schedule/new`** - Create new flight session
  - Choose enrollment
  - Select lesson (precreated or custom)
  - Custom lesson builder
  - Maneuver selection
  - Scheduling
- **`/instructor/schedule/[id]/edit`** - Edit existing session
- **`/instructor/schedule/requests`** - Manage student requests

### **Flight Session Service**
- **Location**: `lib/flight-session-service.ts`
- **Features**:
  - CRUD operations for flight sessions
  - Student/instructor queries
  - Maneuver scores retrieval
  - Lesson integration
  - Aircraft/enrollment tracking

### **Database Tables (Existing)**
- `flight_sessions` - Current training sessions
- `student_enrollments` - Student program enrollments
- `syllabi` - Training programs
- `syllabus_lessons` - Lesson templates
- `custom_lessons` - Instructor-created lessons
- `maneuvers` - Flight maneuvers
- `maneuver_scores` - Student performance on maneuvers
- `lesson_feedback` - Post-session feedback
- `aircraft` - Aircraft fleet
- `profiles` - User profiles

---

## 🚧 **WHAT WE NEED TO BUILD (Mission Workflow System)**

### **Phase 1 & 2: Backend** ✅ **COMPLETE**
- ✅ Database schema deployed (`missions`, `training_events`, `plans_of_action`, `debriefs`, `student_maneuver_progress`)
- ✅ `mission-service.ts` - Mission CRUD operations
- ✅ `training-event-service.ts` - Event management + billing
- ✅ `plan-of-action-service.ts` - POA management + AI generation infrastructure
- ✅ `debrief-service.ts` - Debrief management + AI formatting infrastructure
- ✅ `maneuver-progress-service.ts` - Longitudinal tracking & analytics

### **Phase 3: Instructor UI** ⚠️ **TO BUILD**

#### **Option A: Enhance Existing Flight Sessions** (RECOMMENDED)
Since we already have `/instructor/schedule/new` for creating flight sessions, we should **ENHANCE** it to create missions instead:

**Pages to MODIFY:**
1. **`/instructor/schedule/new`** → Enhance to create Missions
   - Keep existing UI flow
   - Add: Mission type selector (Flight/Ground/Sim)
   - Add: Auto-generate mission code (F1, F2, F3...)
   - Add: Plan of Action generation option
   - Add: Training events breakdown preview
   - **Backend**: Call `createMissionFromTemplate()` instead of creating flight_session

2. **`/instructor/schedule/[id]`** → NEW: Mission Detail Page
   - Mission overview (code, type, status)
   - Training events breakdown (pre-brief, flight, ground, post-brief)
   - Billing preview per event
   - Plan of Action display (if exists)
   - Actions:
     - Start Pre-brief
     - Start Flight
     - Complete Mission
     - Cancel/Reschedule
   
3. **`/instructor/schedule/[id]/pre-brief`** → NEW: Pre-Brief Page
   - Display Plan of Action
   - Student acknowledgment checkbox
   - Review objectives
   - Preflight checklist
   - Weather briefing
   - Action: "Start Flight" button

4. **`/instructor/schedule/[id]/debrief`** → NEW: Debrief Page
   - Voice recorder for instructor notes
   - Maneuver scoring interface (1-4 scale)
   - ACS standards checkboxes
   - Areas for improvement notes
   - Key takeaways (strengths/corrections)
   - Next lesson plan
   - Action: "Generate AI Debrief" button
   - Action: "Complete Mission" button

**Components to BUILD:**
- `MissionForm` - Enhanced flight session form
- `MissionCard` - Display mission in list/calendar
- `MissionStatusBadge` - Visual status indicator
- `TrainingEventTimeline` - Show event progression
- `PlanOfActionDisplay` - Read-only POA viewer
- `VoiceRecorderWidget` - Audio recording interface
- `ManeuverScoringGrid` - Interactive scoring UI
- `DebriefFormFields` - Structured debrief input

#### **Option B: New Dedicated Mission Routes** (Alternative)
Create entirely new routes:
- `/instructor/missions` - Mission list
- `/instructor/missions/new` - Create mission
- `/instructor/missions/[id]` - Mission detail
- `/instructor/missions/[id]/pre-brief` - Pre-brief page
- `/instructor/missions/[id]/debrief` - Debrief page

**Recommendation**: Use **Option A** to avoid duplicating UI and maintain consistent UX.

---

### **Phase 4: Student UI** ⚠️ **TO BUILD**

#### **Option A: Enhance Existing Flight Sessions** (RECOMMENDED)
Modify existing student flight sessions pages to show missions:

**Pages to MODIFY:**
1. **`/student/flight-sessions`** → Show Missions Instead
   - Update to query `missions` table instead of `flight_sessions`
   - Show mission code (F1, F2, F3...)
   - Display mission status
   - Show Plan of Action availability
   - Show Debrief completion status
   - Filter: Upcoming, Completed, All

2. **`/student/flight-sessions/[id]`** → Mission Detail for Students
   - Mission overview
   - Plan of Action (read-only)
   - Lesson objectives
   - Scheduled training events
   - Completed debrief (if exists)
   - Maneuver scores from debrief
   - Instructor feedback
   - Next steps

3. **`/student/progress`** → NEW: Maneuver Progress Dashboard
   - **Add to navigation** in `app/student/layout.tsx`
   - Overall progress summary
   - Maneuver proficiency chart (longitudinal)
   - Checkride readiness indicator
   - Recent missions
   - Trending maneuvers (improving/declining)
   - Comparison to cohort average
   - Category breakdown

**Components to BUILD:**
- `MissionListCard` - Student-friendly mission display
- `ManeuverProgressChart` - Line chart showing proficiency over time
- `CheckrideReadinessWidget` - Visual readiness indicator
- `ProgressSummaryCards` - Stats cards for dashboard
- `ManeuverCategoryBreakdown` - Group by category
- `TrendingManeuvversWidget` - Show improving/declining

#### **Option B: New Dedicated Mission Routes** (Alternative)
- `/student/missions` - Mission list
- `/student/missions/[id]` - Mission detail  
- `/student/progress/maneuvers` - Maneuver tracking

**Recommendation**: Use **Option A** and rename "Flight Sessions" to "Missions" in navigation.

---

### **Phase 5: AI Integration** ⚠️ **TO BUILD**

**API Routes to CREATE:**

1. **`/api/ai/generate-poa`** - Plan of Action Generation
   - **Input**: Mission ID, Lesson Template, Prior Debriefs
   - **Process**: Call OpenAI/Claude API with structured prompt
   - **Output**: Generated POA with objectives, prep work, briefing points
   - **Service**: Already has infrastructure in `plan-of-action-service.ts`

2. **`/api/ai/format-debrief`** - Debrief Formatting from Voice
   - **Input**: Raw transcript, Maneuvers practiced, ACS tasks
   - **Process**: Call OpenAI/Claude API for structured extraction
   - **Output**: Formatted debrief with maneuver details, FAR references, key takeaways
   - **Service**: Already has infrastructure in `debrief-service.ts`

3. **Voice-to-Text Integration**
   - Consider: OpenAI Whisper API for transcription
   - Or: Browser Web Speech API for real-time transcription
   - Store raw transcript in `debriefs.raw_transcript`

---

### **Phase 6: Billing Integration** ⚠️ **TO BUILD**

**Current Billing System:**
- Tables: `ledger_entries`, `student_wallets`, `instructor_payouts`
- Services: `billing-service.ts`, `ledger-service.ts`, `invoice-service.ts`

**Integration Points:**

1. **When Training Event Completes**:
   ```typescript
   // In training-event-service.ts (already has calculateBilling)
   
   // After marking event as completed:
   await createLedgerEntry({
     student_id: event.student_id,
     transaction_type: 'flight_charge',
     amount_cents: event.student_charge_cents,
     description: `${event.event_type} - Mission ${mission.mission_code}`,
     related_mission_id: event.mission_id,
     related_training_event_id: event.id,
   })
   
   // Create instructor payout entry
   await createLedgerEntry({
     instructor_id: mission.assigned_instructor_id,
     transaction_type: 'instructor_payout',
     amount_cents: event.instructor_payout_cents,
     description: `Payout - ${event.event_type} - Mission ${mission.mission_code}`,
     related_mission_id: event.mission_id,
     related_training_event_id: event.id,
   })
   ```

2. **Student Wallet Deduction**:
   - Check wallet balance before allowing mission start
   - Deduct funds when training event completes
   - Show pending charges for in-progress missions

3. **Invoicing**:
   - Generate invoice per mission (includes all training events)
   - Or: Generate invoice per training event
   - Show breakdown: Pre-brief ($X), Flight ($Y), Post-brief ($Z)

4. **Admin Billing Dashboard**:
   - Show missions with billing status
   - Show pending instructor payouts
   - DSA margin tracking per mission

**Files to MODIFY:**
- `lib/training-event-service.ts` - Add ledger integration
- `lib/ledger-service.ts` - Add mission-related entry types
- `app/admin/billing/page.tsx` - Add mission billing view
- `app/student/billing/page.tsx` - Show mission charges
- `app/instructor/billing/page.tsx` - Show mission payouts

---

## 🔄 **MIGRATION STRATEGY**

### **Approach: Parallel Systems (Recommended)**

**Phase 1: Build Mission System Alongside Flight Sessions**
- Keep existing `flight_sessions` system operational
- Build new mission workflow pages/routes
- Add "Missions" to navigation (alongside "Flight Sessions")
- Allow instructors to create either missions or flight sessions

**Phase 2: Gradual Transition**
- Encourage instructors to use mission system for new training
- Keep flight sessions for historical data
- Update dashboards to show both systems

**Phase 3: Full Migration (Future)**
- Migrate existing flight_sessions to missions (optional)
- Deprecate flight session creation
- Keep read-only access for historical flight sessions

### **Navigation Changes**

**Student Navigation:**
```diff
- Flight Sessions → /student/flight-sessions
+ Missions → /student/missions
+ Progress Tracking → /student/progress
```

**Instructor Navigation:**
```diff
  Schedule → /instructor/schedule (keep as is)
- Flight Sessions → (remove from nav)
+ Missions → /instructor/missions (new)
```

---

## 📊 **RECOMMENDED BUILD ORDER**

### **Sprint 1: Core Mission Creation (Week 1)**
1. ✅ Backend complete (Phase 1 & 2)
2. Modify `/instructor/schedule/new` to create missions
3. Update `/instructor/schedule` to display missions
4. Build basic mission detail page

### **Sprint 2: Mission Execution (Week 2)**
5. Build pre-brief page with POA display
6. Build debrief page with manual input
7. Integrate training event completion workflow
8. Update student mission list view

### **Sprint 3: Student Progress (Week 3)**
9. Build student progress dashboard
10. Implement maneuver tracking visualization
11. Build checkride readiness widget
12. Update student mission detail page

### **Sprint 4: AI & Billing (Week 4)**
13. Implement AI POA generation API
14. Implement AI debrief formatting API
15. Integrate billing system with training events
16. Add billing views to admin dashboard

---

## ✅ **FINAL RECOMMENDATION**

**DO:**
- ✅ **Enhance existing pages** (`/instructor/schedule`, `/student/flight-sessions`)
- ✅ **Add new mission-specific routes** (`/[role]/missions/[id]/debrief`)
- ✅ **Keep flight sessions** for backward compatibility
- ✅ **Add "Missions" and "Progress" to navigation**
- ✅ **Build progressively** (manual first, AI later)

**DON'T:**
- ❌ Delete existing flight sessions system
- ❌ Duplicate dashboard pages
- ❌ Create entirely separate mission UI from scratch
- ❌ Force immediate migration of historical data

---

## 🎯 **NEXT STEPS**

**Ready to proceed with:**
1. **Phase 3A**: Enhance `/instructor/schedule/new` to create missions
2. **Phase 3B**: Build mission detail page with training event timeline
3. **Phase 3C**: Build pre-brief and debrief pages

**Would you like me to:**
- A) Start building the instructor mission creation UI (enhance existing schedule/new)
- B) Create the mission detail page first
- C) Build the student progress dashboard
- D) Another approach?

Let me know which component you'd like to tackle first! 💪


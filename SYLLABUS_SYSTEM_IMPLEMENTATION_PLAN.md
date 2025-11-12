pnpm # 🎓 Desert Skies Aviation - Enhanced Syllabus System Implementation Plan

## 📋 Executive Summary

This document outlines the complete implementation plan for the enhanced syllabus management system across all three user types: Admin, Instructor, and Student.

---

## 🎯 System Overview

### Core Concept
Create an intelligent, ACS-driven syllabus system that:
- Ties every lesson to specific ACS standards and FAR regulations
- Tracks student progress granularly through each lesson
- Integrates with the existing Mission Workflow System
- Provides AI-assisted lesson planning and preparation
- Offers comprehensive resources for student preparation

### Key Features by User Type

#### 👨‍💼 **ADMIN - Syllabus Command Center**
**Goal:** Complete control over syllabus creation, editing, and management

**Features:**
1. **Syllabus Dashboard**
   - View all syllabi with statistics (lessons, enrollments, hours)
   - Filter by certificate type, active/inactive status
   - Quick actions: Create, Edit, Duplicate, Archive
   
2. **Syllabus Detail Page** `/admin/syllabi/[id]`
   - Overview: Stats, ACS document, FAR references
   - Lessons List: Drag-and-drop reordering
   - Quick edit inline for lesson details
   - Bulk actions: Reorder, Duplicate, Delete lessons
   
3. **Lesson Builder/Editor** `/admin/syllabi/[id]/lessons/[lessonId]/edit`
   - **Tab 1: Basic Info**
     - Title, description, type, estimated hours
     - Order index, prerequisites
     - Completion standards
   
   - **Tab 2: Learning Objectives**
     - Objective statement
     - Performance standards
     - Proficiency requirements
   
   - **Tab 3: ACS Standards**
     - Search and link ACS tasks
     - Mark primary focus tasks
     - Set proficiency targets (1-4 scale)
   
   - **Tab 4: Maneuvers**
     - Add/remove maneuvers from library
     - Mark as required/optional
     - Set proficiency expectations
   
   - **Tab 5: FAR References**
     - Add regulation references
     - Categorize by relevance (required/supplemental)
     - Description field for context
   
   - **Tab 6: Resources**
     - Add videos (YouTube verification)
     - Add documents/PDFs
     - Add FAA references
     - Add external links
     - Reorder resources
     - Mark as required/optional
   
   - **Tab 7: Briefing Materials**
     - Pre-flight briefing template
     - Post-flight briefing template
     - Student prep checklist items
   
   - **Tab 8: Email Templates**
     - Email subject/body for scheduling
     - Variables: student name, date, lesson details

4. **Syllabus Creation Wizard** `/admin/syllabi/new`
   - Step 1: Basic Info (name, description, certificate type)
   - Step 2: ACS Document Selection
   - Step 3: FAR Part Selection (61, 91, 67, etc.)
   - Step 4: Experience Requirements (hours breakdown)
   - Step 5: Knowledge Requirements
   - Step 6: Review and Create

#### 👨‍✈️ **INSTRUCTOR - Syllabus Training Hub**
**Goal:** View students, track progress, plan lessons, integrate with POA

**Features:**
1. **Syllabi Overview** `/instructor/syllabi`
   - Card view of all active syllabi
   - For each syllabus:
     - Syllabus details
     - Enrolled students count
     - Average progress percentage
     - Recent activity
   
2. **Syllabus Detail** `/instructor/syllabi/[id]`
   - **Tab 1: Overview**
     - Syllabus info, ACS document, requirements
     - Statistics: Total students, avg progress, completion rate
   
   - **Tab 2: Students**
     - List of enrolled students
     - Progress bar for each student (% complete)
     - Current lesson indicator
     - Quick actions: View details, Schedule lesson
     - Filter/sort by progress, name, enrollment date
   
   - **Tab 3: Lessons**
     - List view of all lessons
     - For each lesson:
       - Lesson info
       - ACS standards
       - Maneuvers
       - Resources
       - Number of students currently on this lesson
       - Average proficiency score
     - Click to view lesson detail
   
3. **Student Progress Detail** `/instructor/syllabi/[id]/students/[studentId]`
   - Student info and enrollment details
   - Lesson-by-lesson progress grid:
     - Status: Not started, In progress, Completed, Mastered
     - Sessions completed
     - Flight hours logged
     - Average maneuver score
     - Proficiency level (1-4)
   - Quick action: Schedule next lesson
   
4. **Lesson Detail** `/instructor/syllabi/[id]/lessons/[lessonId]`
   - Complete lesson information
   - ACS standards with checkboxes for "covered"
   - Maneuvers list
   - Resources (videos, PDFs, FAA refs)
   - Pre-brief template
   - **Action: Create Mission with POA**
     - Button to create a new mission
     - Pre-fills lesson data into mission
     - Opens Plan of Action creator with:
       - Lesson objectives auto-filled
       - Maneuvers pre-selected
       - ACS standards pre-loaded
       - Resources linked
     - Voice-to-text for custom POA notes
   
5. **Plan of Action Integration**
   - When creating a mission from a syllabus lesson:
     - Automatically populate training objectives from lesson
     - Pre-select maneuvers
     - Include ACS standards
     - Link to resources
     - Instructor can then:
       - Record voice POA (mic button)
       - Edit auto-generated content
       - Add custom notes (departure direction, destination, focus areas)
       - Generate with AI assistance

#### 👨‍🎓 **STUDENT - Syllabus Learning Portal**
**Goal:** Preview entire syllabus, track progress, prepare for lessons

**Features:**
1. **My Syllabus** `/student/syllabus`
   - Enrollment overview card:
     - Syllabus name and description
     - Instructor info
     - Start date, target completion
     - Overall progress bar
   
   - **Progress Timeline**
     - Visual timeline of all lessons
     - Color-coded status indicators:
       - Gray: Not started
       - Yellow: Scheduled
       - Blue: In progress
       - Green: Completed
       - Gold: Mastered
   
   - **Lessons Grid**
     - Card view of all lessons
     - Each card shows:
       - Lesson number and title
       - Type badge (Ground, Flight, Solo)
       - Estimated hours
       - Status indicator
       - Progress ring (0-100%)
       - Maneuver proficiency count (e.g., "5/8 proficient")
       - Quick preview button
   
2. **Lesson Detail** `/student/syllabus/lessons/[lessonId]`
   - **Hero Section**
     - Lesson title, number, type
     - Status badge
     - Progress metrics
   
   - **Tab 1: Overview**
     - Lesson description
     - Learning objectives
     - Estimated time
     - Prerequisites (if any)
   
   - **Tab 2: ACS Standards**
     - List of ACS tasks covered
     - For each task:
       - Code (e.g., PA.VII.A)
       - Title
       - Objective
       - Your proficiency level (if attempted)
       - Progress indicator
   
   - **Tab 3: Maneuvers**
     - List of maneuvers to practice
     - For each maneuver:
       - Name and description
       - Your best score (if attempted)
       - Required vs Optional badge
       - Link to reference materials
   
   - **Tab 4: Preparation**
     - Pre-flight briefing info
     - Study materials:
       - Videos (embedded or linked)
       - Documents/PDFs
       - FAA references
       - External resources
     - Prep checklist (checkboxes for student)
   
   - **Tab 5: Performance**
     - Your sessions on this lesson
     - Session history:
       - Date, instructor, aircraft
       - Maneuver scores
       - Feedback/notes
     - Progress chart over time
   
3. **Upcoming Lesson Preview**
   - Before a scheduled flight:
     - Display lesson details
     - Show Plan of Action (if instructor created one)
     - Pre-brief materials
     - Study resources
     - Checklist to prepare
   
4. **Post-Flight Review**
   - After completing a session:
     - View debrief notes
     - See maneuver scores
     - Review ACS standards progress
     - View instructor feedback
     - See what's next

---

## 🔄 Integration with Existing Systems

### Mission Workflow Integration
- When instructor creates a mission from a syllabus lesson:
  - Lesson ID is linked to mission
  - POA auto-populates with lesson content
  - Maneuvers from lesson are pre-selected for debrief
  - ACS standards are tracked through mission
  - Student lesson progress is updated after debrief

### ACS Standards Tracking
- Every lesson is tied to specific ACS tasks
- During debrief, instructor marks ACS standards as covered
- Student ACS progress is updated in `student_lesson_progress`
- Overall ACS readiness calculated across all lessons

### Enrollment System
- Student enrollments tied to specific syllabus
- Progress tracked through `student_lesson_progress` table
- Can switch syllabi if program changes
- History preserved even after completion

---

## 🎨 UI/UX Principles

### Design Language
- **Admin**: Command center feel - data dense, powerful tools
- **Instructor**: Workflow-focused - quick actions, student-centric
- **Student**: Learning-focused - clear progress, motivating visuals

### Color Coding
- **Not Started**: Gray/Neutral
- **Scheduled**: Yellow/Warning
- **In Progress**: Blue/Info
- **Completed**: Green/Success
- **Mastered**: Gold/Premium

### Progress Indicators
- Circular progress rings for overall completion
- Linear progress bars for lesson-specific progress
- Step indicators for lesson sequences
- Badge system for achievements (Proficient, Mastered, etc.)

---

## 🚀 Implementation Phases

### Phase 1: Admin Interface (Current Priority)
1. Enhanced Syllabus List Page
2. Syllabus Creation Wizard
3. Syllabus Detail/Command Center Page
4. Lesson Builder/Editor (all tabs)

### Phase 2: Instructor Interface
1. Syllabi Overview Page
2. Syllabus Detail with Student List
3. Student Progress Detail View
4. Lesson Detail with POA Creator
5. Mission Integration

### Phase 3: Student Interface
1. My Syllabus Overview
2. Lesson Preview/Detail Pages
3. Preparation Materials Display
4. Progress Tracking Dashboard

### Phase 4: AI Enhancements
1. AI-assisted POA generation from lesson content
2. Smart resource recommendations
3. Personalized study plans
4. Predictive progress analytics

---

## 📊 Data Flow

```
Admin creates/edits Syllabus
  ↓
Admin creates Lessons with ACS/FAR/Resources
  ↓
Student enrolls in Syllabus (Enrollment created)
  ↓
Instructor views Student progress on Syllabus
  ↓
Instructor creates Mission from Lesson
  ↓
Plan of Action auto-generated from Lesson content
  ↓
Student views POA and prepares using Lesson resources
  ↓
Flight/Training occurs (Mission)
  ↓
Instructor completes Debrief with maneuver scores
  ↓
Student Lesson Progress updated automatically
  ↓
Student views progress and prepares for next Lesson
```

---

## 🔐 Security & Permissions

### Admin
- Full CRUD on all syllabi and lessons
- Can view all student progress
- Can assign syllabi to students

### Instructor
- Read-only access to syllabi and lessons
- Can view progress of their own students
- Can create missions/POAs for their students
- Can update student lesson progress through debriefs

### Student
- Read-only access to their enrolled syllabus
- Can view their own progress
- Can access preparation materials
- Can view but not edit lesson content

---

## 📱 Responsive Design

- **Desktop**: Full multi-column layouts, drag-and-drop, rich interactions
- **Tablet**: Adapted layouts, touch-friendly controls
- **Mobile**: Stacked layouts, simplified views, core functionality preserved

---

## 🎯 Success Metrics

### For Admins
- Time to create complete syllabus: < 2 hours
- Lesson editing efficiency: < 5 minutes per lesson
- ACS coverage: 100% of required tasks linked

### For Instructors
- Student progress visibility: Instant overview
- POA creation time: < 5 minutes with AI assistance
- Mission planning efficiency: 3x faster with lesson integration

### For Students
- Lesson preparation clarity: 100% of students know what to study
- Progress transparency: Real-time visibility into their training
- Resource accessibility: All materials one click away

---

## 🛠️ Technical Notes

### Performance Optimizations
- Use database views for complex queries
- Cache syllabus data (rarely changes)
- Lazy load resources and ACS details
- Optimize for read-heavy operations

### Database Indexing
- All foreign keys indexed
- Compound indexes on frequently queried columns
- Full-text search on lesson titles/descriptions

### API Design
- Server actions for all mutations
- Optimistic UI updates where appropriate
- Error boundaries and fallbacks
- Loading states for better UX

---

## 📝 Next Immediate Tasks

1. ✅ Database schema created
2. ✅ Service layer built
3. 🚧 Admin Syllabus List page enhancement
4. 🚧 Admin Syllabus Detail/Command Center
5. 🚧 Admin Lesson Builder (enhanced)
6. ⏳ Instructor Syllabi pages
7. ⏳ Instructor POA integration
8. ⏳ Student syllabus pages
9. ⏳ Student lesson detail pages
10. ⏳ AI integration features

---

**This is a comprehensive, intelligent, and highly integrated syllabus system that will transform your flight training management. Every piece is designed to work together seamlessly while providing exactly what each user type needs.**


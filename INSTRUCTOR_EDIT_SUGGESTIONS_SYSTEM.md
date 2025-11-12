# 📝 Instructor Edit Suggestions System

## 🎯 Overview

A complete **suggestion/approval workflow** that allows instructors to propose changes to lessons without directly modifying them. Admins review and approve all suggestions before they're applied to the syllabus.

---

## ✨ Key Features

### **For Instructors:**
- ✅ **Suggest Edits** to any lesson field
- ✅ **Non-Destructive** - original content stays intact
- ✅ **Track Status** - see pending, approved, and rejected suggestions
- ✅ **Provide Context** - explain why you're suggesting changes
- ✅ **No Direct Access** - prevents accidental syllabus corruption

### **For Admins:**
- ✅ **Review Queue** - see all pending suggestions in one place
- ✅ **Approve/Reject** - control what changes make it into syllabi
- ✅ **Track Changes** - full audit trail of who suggested what
- ✅ **Quality Control** - maintain syllabus standards

---

## 📊 What's Been Built

### **1. Database Schema** (`database/lesson-edit-suggestions-schema.sql`)

#### **`lesson_edit_suggestions` Table**
Stores all instructor suggestions for lesson edits:
- `lesson_id` - Which lesson to edit
- `instructor_id` - Who suggested the change
- `field_name` - What field to edit (objective, performance_standards, etc.)
- `current_value` - Original value (for reference)
- `suggested_value` - Proposed new value
- `reason` - Why this change is being suggested
- `status` - `pending`, `approved`, `rejected`, or `implemented`
- `reviewed_by` - Admin who reviewed it
- `reviewed_at` - When it was reviewed
- `review_notes` - Admin feedback

#### **`lesson_performance_standards` Table**
**Individual performance standards** (not one blob of text):
- `lesson_id` - Which lesson
- `standard_text` - The standard itself
- `order_index` - Display order
- `acs_reference` - Link to ACS task (optional)
- `is_required` - Required vs optional

#### **`lesson_maneuver_expectations` Table**
**Maneuvers with expected proficiency levels**:
- `lesson_id` - Which lesson
- `maneuver_id` - Which maneuver
- `expected_proficiency` - **1-4 scale** (1=Beginner, 2=Developing, 3=Proficient, 4=Advanced)
- `is_required` - Required vs optional
- `emphasis_level` - `introduction`, `practice`, `review`, `mastery`
- `instructor_notes` - Lesson-specific notes

#### **`lesson_resources` Table**
**Structured resources** with proper types:
- **Video** - YouTube, Vimeo, direct links (`duration_minutes`)
- **Web Link** - External websites and articles
- **FAA Resource** - PHAK, FAR/AIM chapters (`faa_chapter`)
- **Lesson Plan** - Rich text/markdown content (`content` field)
- **PDF** - Uploaded documents (`file_path`, `file_name`)
- **PowerPoint** - Presentations (`file_path`, `file_name`)
- **Markdown** - Embedded formatted content

---

## 🔧 Technical Implementation

### **Service Layer** (`lib/lesson-suggestions-service.ts`)

```typescript
// Create a suggestion
createEditSuggestion({
  lesson_id: "...",
  field_name: "objective",
  current_value: "Old text",
  suggested_value: "New improved text",
  reason: "This is clearer for students"
})

// Get all suggestions for a lesson
getLessonSuggestions(lessonId)

// Approve a suggestion (admin only)
approveSuggestion(suggestionId, reviewNotes)

// Reject a suggestion (admin only)
rejectSuggestion(suggestionId, reviewNotes)

// Get structured data
getPerformanceStandards(lessonId) // Returns array of standards
getManeuverExpectations(lessonId) // Returns maneuvers with proficiency levels
getLessonResources(lessonId) // Returns organized resources
```

### **React Component** (`components/instructor/suggest-edit-dialog.tsx`)

A reusable dialog for suggesting edits to any field:

```tsx
<SuggestEditDialog
  lessonId={lessonId}
  fieldName="objective"
  fieldLabel="Learning Objectives"
  currentValue={lesson.objective}
  onSuggestionCreated={() => refreshPage()}
/>
```

Features:
- Shows current value for reference
- Text editor for suggestions
- Reason field (optional but encouraged)
- Real-time validation
- Toast notifications
- Optimistic UI updates

### **API Route** (`app/api/instructor/suggest-edit/route.ts`)

Handles suggestion submissions:
- ✅ Authentication check
- ✅ Role verification (instructor-only)
- ✅ Validation
- ✅ Database insertion
- ✅ Error handling

---

## 🎨 User Experience

### **Instructor Workflow:**

1. **View Lesson** - Navigate to any lesson detail page
   ```
   /instructor/syllabi/[id]/lessons/[lessonId]
   ```

2. **See Pending Alert** - If you have suggestions pending review:
   ```
   ⚠️ You have 3 pending edit suggestions awaiting admin review.
   ```

3. **Click "Suggest Edit"** - Each editable section has a button:
   - Learning Objectives → "Suggest Edit"
   - Performance Standards → "Suggest Edit"
   - Maneuvers → "Suggest Edit"
   - Resources → "Suggest Edit"
   - Pre-Brief Content → "Suggest Edit"

4. **Make Your Changes** - Dialog opens showing:
   - **Current Value** (read-only reference)
   - **Suggested Changes** (editable text area)
   - **Reason for Change** (optional explanation)

5. **Submit** - Suggestion goes to admin review queue

6. **Get Notified** - (Future: Email notification when reviewed)

### **Admin Workflow:**

1. **Review Queue** - Navigate to admin suggestions dashboard
   ```
   /admin/suggestions (TO BE BUILT)
   ```

2. **See All Pending** - List of all suggestions from all instructors

3. **Review Details**:
   - Who suggested it
   - What lesson
   - Current value vs suggested value
   - Reason provided
   - When submitted

4. **Approve or Reject**:
   - **Approve** → Changes are applied to the lesson immediately
   - **Reject** → Instructor is notified (optionally with feedback)

5. **Track History** - All suggestions kept for audit trail

---

## 📐 Data Structure Changes

### **Performance Standards - NOW A LIST!**

**Before (❌ Bad):**
```typescript
lesson.performance_standards = "Standard 1\nStandard 2\nStandard 3"
```

**After (✅ Good):**
```typescript
[
  { id: "1", standard_text: "Maintain altitude ±100 ft", acs_reference: "PA.I.D.S3" },
  { id: "2", standard_text: "Maintain heading ±10°", acs_reference: "PA.I.D.S4" },
  { id: "3", standard_text: "Maintain airspeed ±5 kts", acs_reference: "PA.I.D.S5" }
]
```

Benefits:
- ✅ Each standard is individually editable
- ✅ Can reorder via drag-drop
- ✅ Can link to specific ACS tasks
- ✅ Can mark as required/optional
- ✅ Better data integrity

### **Maneuver Expectations - WITH PROFICIENCY!**

**Now includes expected proficiency level (1-4):**

```typescript
{
  maneuver_id: "slow-flight",
  expected_proficiency: 3, // 1=Beginner, 2=Developing, 3=Proficient, 4=Advanced
  is_required: true,
  emphasis_level: "practice"
}
```

This tells students: "By the end of this lesson, you should be at proficiency level 3 for slow flight."

### **Resources - PROPERLY TYPED!**

```typescript
{
  resource_type: "video",
  title: "Slow Flight Technique",
  url: "https://youtube.com/watch?v=...",
  duration_minutes: 12,
  is_required: true
}

{
  resource_type: "faa_resource",
  title: "Airplane Flying Handbook",
  faa_chapter: "Chapter 4: Slow Flight",
  url: "https://faa.gov/...",
  is_required: true
}

{
  resource_type: "lesson_plan",
  title: "Pre-Solo Ground Lesson",
  content: "# Lesson Plan\n\n## Objectives\n...",
  is_required: false
}
```

---

## 🔒 Security & Permissions

### **Row Level Security (RLS)**

**Instructors can:**
- ✅ Create edit suggestions
- ✅ View their own suggestions
- ✅ View all lesson data (read-only)
- ❌ Cannot directly edit lessons
- ❌ Cannot approve/reject suggestions

**Admins can:**
- ✅ View all suggestions
- ✅ Approve/reject suggestions
- ✅ Edit lessons directly
- ✅ Manage performance standards
- ✅ Manage maneuver expectations
- ✅ Manage resources

**Students can:**
- ✅ View lesson data (read-only)
- ✅ View resources
- ❌ Cannot see suggestions
- ❌ Cannot edit anything

---

## 🚀 To Apply & Use

### **Step 1: Run Database Migration**

```bash
# In Supabase SQL Editor or via MCP
\i database/lesson-edit-suggestions-schema.sql
```

This creates:
- `lesson_edit_suggestions` table
- `lesson_performance_standards` table
- `lesson_maneuver_expectations` table
- `lesson_resources` table
- All necessary indexes
- RLS policies

### **Step 2: Test as Instructor**

1. **Navigate to a lesson**:
   ```
   http://localhost:3000/instructor/syllabi/11111111-1111-1111-1111-111111111111/lessons/[lessonId]
   ```

2. **Click "Suggest Edit"** on Learning Objectives

3. **Make a change** and submit

4. **See the pending alert** appear at the top

### **Step 3: Test as Admin** (Future)

1. Navigate to admin suggestions dashboard
2. Review the suggestion
3. Approve or reject it

---

## 📋 What Still Needs to be Built

### **Admin Review Interface** (CRITICAL)
- [ ] **`/admin/suggestions` page** - List all pending suggestions
- [ ] **Suggestion detail view** - Show full context
- [ ] **Approve/Reject buttons** - One-click actions
- [ ] **Bulk actions** - Approve/reject multiple at once
- [ ] **Filters** - By instructor, lesson, date, field type

### **Notification System** (IMPORTANT)
- [ ] **Email notifications** - Alert admins of new suggestions
- [ ] **Email notifications** - Alert instructors when reviewed
- [ ] **In-app notifications** - Bell icon with count

### **More Editable Fields** (NICE TO HAVE)
- [ ] **Add maneuvers** - Suggest adding/removing maneuvers
- [ ] **Add resources** - Suggest new learning resources
- [ ] **Edit pre-brief** - Suggest pre-brief content changes
- [ ] **Edit ACS standards** - Suggest linking different ACS tasks

### **Migration of Old Data** (NEEDED)
- [ ] **Migrate `performance_standards`** - Convert blob text to list
- [ ] **Populate `maneuver_expectations`** - Create expected proficiency records
- [ ] **Populate `lesson_resources`** - Move existing resources to new table

---

## 🎯 Benefits Summary

### **Quality Control:**
- ✅ All changes reviewed by admins
- ✅ Prevents accidental syllabus corruption
- ✅ Maintains consistency across programs

### **Collaboration:**
- ✅ Instructors can contribute improvements
- ✅ Admins retain final approval
- ✅ Full audit trail of all changes

### **Better Data:**
- ✅ Performance standards as structured list
- ✅ Maneuver proficiency expectations tracked
- ✅ Resources properly categorized
- ✅ Enables better reporting and analytics

### **Instructor Empowerment:**
- ✅ Feel heard and valued
- ✅ Can suggest improvements based on real teaching experience
- ✅ Don't need admin intervention for every small tweak idea

---

## 📞 Next Steps

1. **Apply the database migration**
2. **Test the suggestion system** as an instructor
3. **Build the admin review interface** (critical!)
4. **Migrate existing data** to new structure
5. **Add notification system**
6. **Train instructors** on how to use it

---

**The foundation is rock-solid. Now we just need to build the admin review interface!** 🚀

Let me know when you're ready to tackle that next piece!


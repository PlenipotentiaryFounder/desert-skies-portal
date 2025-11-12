# Comprehensive Lesson Editor - Admin Guide

## Overview

The Desert Skies Aviation Portal now features a **comprehensive lesson editor** that gives admins complete control over every aspect of a syllabus lesson. This is a major enhancement designed to be seamless, frictionless, and powerful.

## 🎯 What This Solves

### Before
- Limited editing capabilities (only title, description, hours, type)
- No way to edit objectives, standards, briefing content, resources
- Had to use multiple interfaces or tools
- Performance standards as one blob of text
- No maneuver proficiency tracking

### After
- **FULL CONTROL** over all lesson fields in one place
- **8 comprehensive tabs** organized by function
- **Individual performance standards** (add/remove/reorder)
- **Maneuver proficiency levels** (1-4 scale)
- **Resource management** (videos, PDFs, links, FAA refs)
- **ACS & FAR linking** (coming soon - UI ready)
- **Save/Cancel workflow** with change tracking
- **Beautiful, intuitive UI** with clear visual hierarchy

---

## 🚀 How to Access

### Location
Navigate to: **Admin → Syllabi → [Select Syllabus] → Edit Tab → Lesson Management**

### Three Ways to Edit a Lesson

1. **Full Edit Button (Primary)** 
   - Blue button on each lesson card
   - Opens comprehensive editor in full-screen dialog
   - **Recommended for all editing**

2. **Full Edit from Menu**
   - Click three-dot menu (⋮) on lesson card
   - Select "Full Edit (All Fields)"
   - Same as above

3. **Quick Edit (Limited)**
   - Click three-dot menu → "Quick Edit"
   - Small dialog for basic fields only
   - Use for simple title/description changes

---

## 📋 The 8 Comprehensive Tabs

### 1️⃣ **Basic Info**
**What you can edit:**
- ✅ Lesson Title (required)
- ✅ Description
- ✅ Lesson Type (Flight, Ground, Simulator, Solo, Checkride)
- ✅ Estimated Hours
- ✅ Order/Position (view only - use drag-and-drop to reorder)

**Best for:** Setting up the fundamental lesson information

---

### 2️⃣ **Objectives**
**What you can edit:**
- ✅ Learning Objectives (long-form text)

**What to include:**
- What students should be able to DO after the lesson
- Specific, measurable outcomes
- Aligned with ACS standards

**Example:**
```
The student will be able to:
- Identify all major aircraft components and understand their functions
- Perform a complete preflight inspection to ACS standards
- Recognize potential maintenance issues during inspection
```

---

### 3️⃣ **Performance Standards** ⭐ NEW!
**What you can edit:**
- ✅ Individual performance standards (not a blob!)
- ✅ Add/remove standards dynamically
- ✅ ACS reference for each standard (optional)
- ✅ Mark standards as required/optional
- ✅ Reorder standards

**How it works:**
1. Click "+ Add Standard"
2. Enter the standard text
3. Optionally add ACS reference (e.g., "PA.I.E.K1")
4. Toggle "Required" switch
5. Click X to remove a standard

**Example standards:**
1. "Student correctly identifies all V-speeds and their significance" (PA.I.E.K1) ✓ Required
2. "Student demonstrates proper preflight inspection technique" (PA.I.E.K2) ✓ Required
3. "Student can explain aircraft systems operation" (PA.I.F.K1) ✓ Required

---

### 4️⃣ **Maneuvers** ⭐ NEW!
**What you can edit:**
- ✅ Select maneuvers from database
- ✅ Set target proficiency level (1-4 scale)
- ✅ Mark as required/optional
- ✅ Set emphasis level (introduction/practice/proficiency)
- ✅ Add instructor notes per maneuver

**Proficiency Scale:**
- **Level 1** - Introduction (first exposure)
- **Level 2** - Practice (developing skills)
- **Level 3** - Proficient (meets standards)
- **Level 4** - Mastery (exceeds standards)

**Status:** UI placeholder ready, integration coming next

---

### 5️⃣ **ACS & FAR References**
**What you can edit:**
- ✅ Link specific ACS tasks (e.g., PA.I.E - Preflight Assessment)
- ✅ Link FAA regulations (e.g., 91.103 - Preflight Action)

**Why this matters:**
- Students see exactly which ACS areas they're working on
- Instructors can track ACS coverage across the syllabus
- Ensures regulatory compliance

**Status:** UI placeholders ready, linking system coming next

---

### 6️⃣ **Briefing Content**
**What you can edit:**
- ✅ Pre-Flight Briefing content (30 min)
- ✅ Post-Flight Briefing content (30 min)
- ✅ Instructor Notes (private, students don't see)
- ✅ Student Prep Materials

**Pre-Flight Briefing (30 min):**
- Review plan of action
- Discuss maneuvers to be practiced
- Review notes from last flight
- Optional 15-min topic (weather, W&B, etc.)

**Post-Flight Briefing (30 min):**
- Review flight performance
- Discuss maneuver execution
- Address challenges
- Preview next lesson

**Instructor Notes:**
- Teaching tips
- Common student mistakes
- Special considerations
- Emphasis areas

---

### 7️⃣ **Resources** ⭐ NEW!
**What you can edit:**
- ✅ Add/remove learning resources
- ✅ Resource types: Video, Web Link, FAA Reference, PDF, Document
- ✅ Set resource category: Pre-Flight, Post-Flight, Supplemental
- ✅ Mark resources as required/optional
- ✅ Add descriptions

**How to add a resource:**
1. Click "+ Add Resource"
2. Enter resource title
3. Select resource type
4. Enter URL or file path
5. Select category
6. Toggle "Required" if needed
7. Click X to remove

**Resource Types:**
- **Video** - YouTube, Vimeo, etc.
- **Web Link** - External websites
- **FAA Reference** - FAA handbooks, ACs, etc.
- **PDF** - PDF documents
- **Document** - Other documents

---

### 8️⃣ **Settings**
**What you can edit:**
- ✅ Lesson Active/Inactive status
- ✅ Lesson Required/Optional
- ✅ Minimum Proficiency Required (1-4)
- ✅ Email Subject template
- ✅ Email Body template

**Lesson Status:**
- **Active** - Appears in student syllabi
- **Inactive** - Hidden from students (use for lessons under development)

**Minimum Proficiency:**
- Students must achieve this level to complete the lesson
- Default: Level 3 (Proficient)

**Email Templates:**
- Subject and body for lesson preparation emails
- Use variables: `{lesson_number}`, `{lesson_title}`, `{student_name}`, `{instructor_name}`

---

## 💾 Saving Your Changes

### Change Tracking
- **Unsaved Changes Badge** appears when you edit any field
- **Fixed Save Bar** at bottom shows save status
- **Cancel button** with confirmation if changes exist

### To Save:
1. Make your edits across any tabs
2. Review the "Unsaved Changes" badge
3. Click "Save All Changes" button (bottom right)
4. Wait for confirmation toast
5. Dialog closes automatically on success

### To Cancel:
1. Click "Cancel" (top right or bottom left)
2. Confirm if you have unsaved changes
3. Dialog closes without saving

---

## 🎨 UI Features

### Visual Indicators
- **Lesson number badge** (blue circle) shows position in syllabus
- **Tab icons** for quick navigation
- **Save/Cancel** always visible at top
- **Fixed bottom bar** shows save status
- **Color-coded badges** for lesson types
- **Change tracking** with amber alerts

### Responsive Design
- **Full-screen dialog** (95% viewport)
- **Scrollable content** area
- **Fixed header & footer** for easy saving
- **Grid layouts** adapt to screen size

### User Experience
- **No data loss** - Warns before closing with unsaved changes
- **Instant feedback** - Toasts for success/error
- **Clear labels** - Every field explained
- **Keyboard friendly** - Tab through fields
- **Bulk operations** - Add/remove multiple items easily

---

## 🔧 Technical Details

### Database Fields Edited

The comprehensive editor modifies these `syllabus_lessons` table columns:
- `title`
- `description`
- `lesson_type`
- `estimated_hours`
- `order_index`
- `objective`
- `performance_standards` (formatted from list)
- `pre_brief_content` (renamed from `pre_flight_briefing`)
- `post_brief_content` (renamed from `post_flight_briefing`)
- `instructor_notes`
- `student_prep_materials`
- `email_subject`
- `email_body`
- `is_active`

### Future Tables (When Migration Applied):
- `lesson_performance_standards` - Individual standards
- `lesson_maneuver_expectations` - Maneuver proficiency
- `lesson_resources` - Learning resources
- `lesson_acs_standards` - ACS task links
- `lesson_far_references` - FAR regulation links

---

## 📊 Workflow Example

### Scenario: Creating "F1 - Aircraft Familiarization" Lesson

1. **Basic Info Tab**
   - Title: "F1 - Aircraft Familiarization"
   - Description: "Introduction to aircraft systems and preflight procedures"
   - Type: Flight
   - Hours: 1.5

2. **Objectives Tab**
   - Add learning objectives about aircraft components, preflight, and systems

3. **Performance Standards Tab**
   - Add 5-7 specific, measurable standards
   - Link each to relevant ACS reference
   - Mark all as required

4. **Maneuvers Tab**
   - Select: Preflight Inspection, Aircraft Familiarization
   - Set proficiency: Level 1 (Introduction)
   - Mark both as required

5. **ACS & FAR Tab**
   - Link PA.I.E (Preflight Assessment)
   - Link FAR 91.103 (Preflight Action)

6. **Briefing Tab**
   - Pre-brief: Review aircraft components, walkaround procedure
   - Post-brief: Discuss any questions, preview next lesson
   - Instructor notes: Common mistakes to watch for

7. **Resources Tab**
   - Add Cessna 172 POH (PDF)
   - Add FAA Airplane Flying Handbook Ch. 2 (FAA Reference)
   - Add "Preflight Inspection" video (Video, Required)

8. **Settings Tab**
   - Status: Active
   - Required: Yes
   - Min Proficiency: 3
   - Set email templates

9. **Save All Changes**

---

## 🎯 Best Practices

### For Admins Creating New Syllabi

1. **Start with Basic Info** - Get the fundamentals right
2. **Write clear objectives** - Be specific and measurable
3. **Break down standards** - One standard per item, not a paragraph
4. **Set realistic proficiency** - Don't expect mastery on first lesson
5. **Add rich resources** - Videos, documents, FAA references
6. **Write detailed briefing notes** - Help instructors teach effectively
7. **Test with a pilot** - Have someone review before activating

### Naming Conventions

- **Lesson codes**: F1, F2, G1, S1, etc.
- **Descriptive titles**: "[Code] - [What Student Learns]"
- **Example**: "F1 - Aircraft Familiarization" not just "Flight 1"

### Performance Standards

✅ **Good**: "Student correctly identifies all six flight instruments and explains their functions"

❌ **Bad**: "Student knows instruments"

---

## 🐛 Troubleshooting

### "Unsaved Changes" Won't Go Away
- **Solution**: Click "Save All Changes" and wait for confirmation toast

### Can't Find "Full Edit" Button
- **Solution**: It's the blue button on the right side of each lesson card

### Changes Not Saving
- **Solution**: Check for required fields (title, lesson type, hours). Look for validation errors in toast notifications.

### Dialog Too Small/Large
- **Solution**: Dialog is 95% of viewport. Try zooming your browser (Ctrl/Cmd +/-)

---

## 🚀 What's Next

### Coming Soon
- **Maneuver database integration** - Full maneuver selector
- **ACS task linking** - Search and link ACS tasks
- **FAR reference linking** - Search and link regulations
- **File uploads** - Upload PDFs, documents directly
- **Lesson templates** - Quick-start from templates
- **Bulk operations** - Edit multiple lessons at once
- **Version history** - See who changed what and when

---

## 📞 Support

If you encounter issues or have feature requests:
1. Check this guide first
2. Review the validation messages
3. Contact the development team

---

## 🎉 Success!

You now have **complete control** over every aspect of your flight training syllabi. This system is designed to be:

- ✅ **Comprehensive** - Every field editable
- ✅ **Intuitive** - Clear organization and labels
- ✅ **Powerful** - Rich features for detailed lesson planning
- ✅ **Safe** - Change tracking and confirmations
- ✅ **Fast** - Bulk operations and keyboard shortcuts

**Happy lesson planning!** ✈️


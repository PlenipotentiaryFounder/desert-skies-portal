# 🚀 Enhanced Syllabus System - Quick Start Guide

## For Administrators

### Creating Your First Syllabus

1. **Navigate to Syllabi**
   - Go to **Admin Dashboard** → **Syllabi**
   - Or directly to `/admin/syllabi`

2. **Create New Syllabus**
   - Click **"New Syllabus"** button
   - Fill in:
     - Name (e.g., "Private Pilot Syllabus - Part 61")
     - Description
     - Target Certificate (Private, Instrument, Commercial, etc.)
     - Version (e.g., "1.0")
   - Click **Save**

3. **Add Lessons**
   - Click into your new syllabus
   - Go to **"Lessons"** tab
   - Click **"Add Lesson"**
   - Fill in basic details and save
   - Repeat for all lessons

4. **Configure Each Lesson**
   - Click **"Edit"** on any lesson
   - Work through the 8 tabs:

   **Tab 1: Basic Info**
   - Title, description, type (Flight/Ground/etc.)
   - Estimated hours
   - Active status

   **Tab 2: Objectives**
   - Add learning objectives (what students will learn)
   - Use bullet points for clarity

   **Tab 3: ACS Standards**
   - Search for relevant ACS tasks
   - Mark as Required or Optional
   - Link multiple standards per lesson

   **Tab 4: Maneuvers**
   - Add maneuvers from your library
   - Specify if required or optional
   - Performance standards auto-populated

   **Tab 5: FAR References**
   - Add relevant regulations (e.g., 61.87, 91.119)
   - Include description for context

   **Tab 6: Resources**
   - Add video links (YouTube, Vimeo)
   - Add external links (FAA resources, articles)
   - Upload PDFs (stored in Supabase Storage)

   **Tab 7: Briefing**
   - Pre-brief content (what to cover before)
   - Post-brief content (debrief points)
   - Student prep materials

   **Tab 8: Email Templates**
   - Customize lesson notification emails
   - Use merge tags for personalization

5. **Reorder Lessons**
   - In the Lessons tab, drag and drop to reorder
   - Changes save automatically

6. **Publish**
   - Set syllabus to **Active** in Settings tab
   - Assign to students via enrollments

---

## For Instructors

### Viewing Your Students' Progress

1. **Access Syllabi**
   - Go to **Instructor Dashboard** → **Syllabi**
   - Or directly to `/instructor/syllabi`

2. **Select a Syllabus**
   - Click on any syllabus card
   - View quick stats at the top

3. **Check Student Progress**
   - Go to **"Students"** tab
   - See list of your enrolled students
   - Progress bars show their current position
   - Click **"View Profile"** for detailed history

4. **Browse Lessons**
   - Go to **"Lessons"** tab
   - Click **"View Details"** on any lesson
   - Review objectives, maneuvers, ACS standards

### Creating a Plan of Action

1. **Navigate to Lesson**
   - From syllabus detail, click into a lesson
   - Click **"Create Plan of Action"**

2. **Use Voice Input** (Recommended)
   - Click **"Start Recording"** 🎤
   - Speak naturally: 
     > "For flight 13, we'll be heading east to the practice area to work on steep turns, slow flight, and power-off stalls. We'll depart to the east and work in the area between Coolidge and Florence."
   - Click **"Stop Recording"** when done

3. **Generate with AI**
   - Review your transcript
   - Click **"Generate POA with AI"** ✨
   - AI extracts:
     - Flight number, tail number
     - Departure direction, destination
     - Training objectives
     - Student focus notes
     - Video resources
     - FAR references
     - Pre-flight checklist

4. **Review and Edit**
   - Verify all fields
   - Make any necessary adjustments
   - Add custom notes

5. **Save**
   - Click **"Save Plan of Action"**
   - POA is now linked to the lesson
   - Use when creating the actual mission

### Using the AI Teaching Assistant

1. **From Lesson Detail Page**
   - Click **"AI Teaching Assistant"** ✨

2. **Ask Questions**
   - "How do I teach steep turns?"
   - "What are common mistakes in slow flight?"
   - "How should I debrief this lesson?"
   - "What ACS standards apply here?"

3. **Get Structured Guidance**
   - Teaching strategies
   - Common student errors and corrections
   - ACS breakdown with tips
   - Debrief techniques

---

## For Students

### Viewing Your Training Progress

1. **Access Your Syllabus**
   - Go to **Student Dashboard** → **My Syllabus**
   - Or directly to `/student/syllabus`

2. **Understand Your Dashboard**
   - **Progress Bar**: Shows overall completion
   - **Statistics**: Lessons completed, hours, progress %
   - **Current Lesson**: Highlighted with blue border
   - **Locked Lessons**: 🔒 Unlock as you progress

3. **Navigate Lessons**
   - ✅ **Completed**: Green checkmark, can review
   - 🎯 **Current**: Blue border, click "Continue"
   - 🔒 **Locked**: Must complete prerequisites first

### Preparing for Your Next Lesson

1. **Click into Your Current Lesson**
   - From syllabus page, click **"Continue"** on current lesson

2. **Review Pre-Brief Tab** 📚
   - Read **"What to Study"** section
   - Review **FAR References** (click links to eCFR)
   - Understand what to expect

3. **Watch Resources** 🎬
   - Go to **"Resources"** tab
   - Watch recommended videos
   - Read articles and FAA materials

4. **Study ACS Standards** 🏆
   - Go to **"Standards"** tab
   - Review skill elements (what you'll demonstrate)
   - Review knowledge elements (what you'll explain)
   - Review risk management (what hazards to identify)

5. **Check Maneuvers** 🎮
   - Go to **"Maneuvers"** tab
   - Review each maneuver's performance standards
   - Know what "satisfactory" looks like

6. **Come Prepared**
   - Complete ground study
   - Bring questions to instructor
   - Be ready to demonstrate knowledge

### After Your Lesson

1. **Lesson Automatically Updates**
   - Instructor records your performance
   - Progress bar updates
   - Proficiency badge may change (Beginner → Developing → Proficient → Mastered)

2. **Review Your Debrief**
   - Access from student dashboard
   - Read instructor's notes
   - Identify areas to improve

3. **Next Lesson Unlocks**
   - When ready, next lesson becomes available
   - Continue progressing through syllabus

---

## 💡 Pro Tips

### For Admins
- ✅ **Start Simple**: Create 3-5 lessons first, refine later
- ✅ **Use Templates**: Duplicate similar lessons and modify
- ✅ **Link ACS Early**: Makes instructor/student experience better
- ✅ **Add Resources**: Students appreciate video links
- ✅ **Preview as Student**: Check student view to ensure clarity

### For Instructors
- ✅ **Voice POA**: Faster than typing, AI extracts key info
- ✅ **Review Previous Debriefs**: AI uses them for student focus notes
- ✅ **Use Teaching Assistant**: Get fresh ideas and strategies
- ✅ **Update Resources**: Share great videos you find
- ✅ **Track Proficiency**: Note when students master maneuvers

### For Students
- ✅ **Study Pre-Brief**: Don't skip preparation materials
- ✅ **Watch Videos**: Visual learning accelerates understanding
- ✅ **Know ACS Standards**: You'll be evaluated on these
- ✅ **Ask Questions**: Use instructor meetings to clarify
- ✅ **Review After Flights**: Debrief while fresh in memory

---

## 🎨 Understanding Visual Indicators

### Lesson Type Colors
- 🔵 **Blue**: Flight lessons
- 🟢 **Green**: Ground lessons
- 🟡 **Yellow**: Stage checks (evaluations)
- 🟣 **Purple**: Progress checks
- 🔴 **Red**: Simulator sessions
- 🟦 **Indigo**: Briefings

### Proficiency Levels (Students)
- **Beginner**: Just introduced to skill
- **Developing**: Practicing, inconsistent
- **Proficient**: Meets ACS standards consistently
- **Mastered**: Exceeds standards, ready to teach

### Progress Indicators
- ✅ **Green checkmark**: Lesson completed
- 🎯 **"Current" badge**: Currently working on
- 🔒 **Lock icon**: Not yet available
- 📊 **Progress bar**: Visual completion status

---

## 🆘 Common Questions

### Admin

**Q: How do I reorder lessons?**  
A: Go to syllabus detail → Lessons tab → Drag and drop lessons

**Q: Can I copy lessons between syllabi?**  
A: Yes, use the "Duplicate" button, then move to another syllabus

**Q: What if I don't have ACS data yet?**  
A: Lessons work without ACS, but it's recommended for full functionality

### Instructor

**Q: Can students see my Plan of Action?**  
A: Currently, POA is instructor-only. Students see pre-brief content from lesson.

**Q: How do I create a mission from a lesson?**  
A: From lesson detail, click "Create Mission from Lesson" - pre-populates maneuvers and objectives

**Q: Does voice input work on mobile?**  
A: Yes, if browser supports Web Speech API (Chrome recommended)

### Student

**Q: Why are some lessons locked?**  
A: You must complete prerequisites first. Talk to your instructor if you think a lesson should be unlocked.

**Q: Can I access lessons offline?**  
A: Not currently. You need internet to view materials.

**Q: How do I know what to study?**  
A: Click into your current lesson → Pre-Brief tab → "What to Study" section

---

## 📞 Need Help?

### Administrators
- Check documentation: `SYLLABUS_SYSTEM_COMPLETE.md`
- Review implementation plan: `SYLLABUS_SYSTEM_IMPLEMENTATION_PLAN.md`
- Database issues: `MIGRATION_GUIDE.md`

### All Users
- Contact your administrator
- Submit feedback through user portal
- Check FAA resources for aviation-specific questions

---

## 🎯 Next Steps

### For Admins
1. ✅ Create your first syllabus
2. ✅ Add 3-5 lessons
3. ✅ Link ACS standards
4. ✅ Add resources
5. ✅ Enroll a test student
6. ✅ Get feedback from instructors

### For Instructors
1. ✅ Browse available syllabi
2. ✅ Review lessons you'll teach
3. ✅ Create a test Plan of Action
4. ✅ Try the AI Teaching Assistant
5. ✅ Provide feedback to admin

### For Students
1. ✅ View your syllabus
2. ✅ Click into your current lesson
3. ✅ Watch recommended videos
4. ✅ Review ACS standards
5. ✅ Come prepared to your next flight!

---

## 🎉 Welcome to the Enhanced Syllabus System!

This system is designed to make flight training more structured, transparent, and effective for everyone. Take your time exploring the features, and don't hesitate to provide feedback.

**Happy Flying!** ✈️


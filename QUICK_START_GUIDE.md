# Quick Start Guide - Student Mission Experience Demo

## 🚀 Quick Setup (5 Minutes)

### Step 1: Run Demo Data Script

Use MCP Supabase tool to execute the demo data:

```typescript
// The SQL script is in: database/demo-mission-data.sql
// It will create:
// - 2 demo missions (1 upcoming, 1 completed)
// - Plan of Action for upcoming mission
// - Debrief for completed mission
// - Training events
// - Maneuver scores
// - Progress tracking
```

### Step 2: Log in as Student

```
User ID: ecf47875-0204-4859-865f-1d310d022231
Navigate to: /student/missions
```

### Step 3: Test the Experience

#### View Missions
- Go to `/student/missions`
- You should see 2 missions:
  - **DSA-PPC-F1** (Upcoming) - 2 days from now
  - **DSA-PPC-F0** (Completed) - 7 days ago

#### Review Plan of Action
- Click "Review POA" on DSA-PPC-F1
- OR navigate to `/student/missions/[mission-id]/poa`
- Review the mission overview, objectives, videos, and checklist
- Click "I've Reviewed This POA" to acknowledge

#### View Debrief
- Click "View Debrief" on DSA-PPC-F0
- OR navigate to `/student/missions/[mission-id]/debrief`
- See instructor feedback, maneuver scores, and next steps

---

## 📋 What You'll See

### Mission 1: DSA-PPC-F1 (Upcoming)
**Plan of Action Includes:**
- Mission overview paragraph
- 5 training objectives
- 3 personalized focus areas
- 3 video resources (with links)
- 3 FAA references
- 8-item pre-flight checklist
- Acknowledgment button

**Training Events:**
- Pre-brief: 30 minutes
- Flight: 2 hours
- Post-brief: 30 minutes

### Mission 2: DSA-PPC-F0 (Completed)
**Debrief Includes:**
- General overview
- 5 key takeaways (2 strengths, 2 improvements, 1 correction)
- 3 maneuvers with scores:
  - **Steep Turns**: 3/4 (Proficient) ✅
  - **Slow Flight**: 2/4 (Progressing) ⚠️
  - **Power-Off Stalls**: 3/4 (Proficient) ✅
- 2 FAR references discussed
- Next lesson plan
- Performance summary

**Flight Details:**
- Flight hours: 1.8
- Ground hours: 1.0
- Assessment: Satisfactory

---

## 🎯 Key Features to Test

### Student POA Page
✅ Read-only view  
✅ Interactive checklist  
✅ Video resources with external links  
✅ FAA references  
✅ Acknowledgment tracking  
✅ Print/download buttons  
✅ Mobile responsive  

### Student Debrief Page
✅ Maneuver performance cards  
✅ Score visualization (1-4 scale)  
✅ Key takeaways by category  
✅ FAR references discussed  
✅ Next lesson plan  
✅ Performance summary  
✅ Print/download buttons  
✅ Mobile responsive  

---

## 🔧 Troubleshooting

### "Plan of Action not found"
- Ensure demo data script ran successfully
- Check that POA was created and linked to mission
- Verify student has access (RLS policy)

### "Debrief not found"
- Ensure demo data script ran successfully
- Check that debrief was created and linked to mission
- Verify student has access (RLS policy)

### "Instructor not found"
- Verify instructor exists with email: thomas@desertskiesaviationaz.com
- Check profiles table
- Ensure instructor has correct role

### "Student not found"
- Verify student ID: ecf47875-0204-4859-865f-1d310d022231
- Check profiles table
- Ensure student has correct role

---

## 📊 Database Verification

### Check if demo data was created:

```sql
-- Check missions
SELECT mission_code, status, scheduled_date 
FROM missions 
WHERE student_id = 'ecf47875-0204-4859-865f-1d310d022231'
ORDER BY scheduled_date DESC;

-- Check POA
SELECT id, status, shared_with_student_at 
FROM plans_of_action 
WHERE student_id = 'ecf47875-0204-4859-865f-1d310d022231';

-- Check debrief
SELECT id, ai_formatted, created_at 
FROM debriefs 
WHERE student_id = 'ecf47875-0204-4859-865f-1d310d022231';

-- Check maneuver scores
SELECT maneuver_name, numeric_score, performance_level 
FROM maneuver_scores 
WHERE student_id = 'ecf47875-0204-4859-865f-1d310d022231';
```

---

## 🎨 UI Elements to Verify

### POA Page
- [ ] Mission code in header (DSA-PPC-F1)
- [ ] "Reviewed" badge (after acknowledgment)
- [ ] Print and Download buttons
- [ ] Mission overview section
- [ ] Training objectives list (5 items)
- [ ] Focus areas (3 items in yellow boxes)
- [ ] Pre-flight checklist (8 items with checkboxes)
- [ ] Video resources (3 items with external link icons)
- [ ] FAA references (3 items)
- [ ] Quick info sidebar (mission details)
- [ ] Actions sidebar (acknowledgment button)
- [ ] AI-assisted badge (if POA was AI-generated)

### Debrief Page
- [ ] Mission code in header (DSA-PPC-F0)
- [ ] Assessment badge ("Satisfactory")
- [ ] Print and Download buttons
- [ ] General overview section
- [ ] Key takeaways (5 items with color-coded categories)
- [ ] Maneuver performance (3 items with scores)
- [ ] FAR references (2 items)
- [ ] Next steps section
- [ ] Flight details sidebar
- [ ] Actions sidebar
- [ ] Performance summary (3 maneuvers, 2 proficient, 1 needs practice)
- [ ] AI-assisted badge (if debrief was AI-formatted)

---

## 📱 Mobile Testing

### Responsive Breakpoints
- **Desktop**: 1024px+ (3-column layout)
- **Tablet**: 768px-1023px (2-column layout)
- **Mobile**: <768px (1-column stacked layout)

### Touch Targets
- Buttons: Minimum 44x44px
- Checkboxes: Minimum 24x24px
- Links: Minimum 44x44px

### Mobile-Specific Features
- Swipe gestures (future)
- Touch-friendly checkboxes
- Collapsible sections (future)
- Bottom navigation (future)

---

## 🎯 Success Criteria

### POA Page
✅ Student can view all POA content  
✅ Student can check off prep items  
✅ Student can acknowledge POA  
✅ Acknowledgment is tracked in database  
✅ Instructor can see acknowledgment status  
✅ Page is mobile-responsive  
✅ External links open in new tab  

### Debrief Page
✅ Student can view all debrief content  
✅ Maneuver scores are clearly displayed  
✅ Performance levels are color-coded  
✅ Key takeaways are categorized  
✅ Next steps are clearly outlined  
✅ Page is mobile-responsive  
✅ Performance summary is accurate  

---

## 🔄 Next Steps After Testing

### If Everything Works
1. ✅ Mark demo as successful
2. ✅ Deploy to production
3. ✅ Train instructors on POA creation
4. ✅ Train students on POA review
5. ✅ Monitor usage and feedback

### If Issues Found
1. 🔍 Document the issue
2. 🔍 Check browser console for errors
3. 🔍 Verify database state
4. 🔍 Test with different users
5. 🔍 Review RLS policies

---

## 📚 Additional Resources

- **Complete Audit**: `STUDENT_MISSION_EXPERIENCE_AUDIT.md`
- **Summary**: `MISSION_EXPERIENCE_SUMMARY.md`
- **Demo Data**: `database/demo-mission-data.sql`

---

## 🎉 You're Ready!

The student mission experience is now fully functional. Students can:
1. ✅ View their missions
2. ✅ Review Plan of Action before flights
3. ✅ Acknowledge preparation
4. ✅ View debrief after flights
5. ✅ Track their progress

**Happy flying! ✈️**


# 🚀 Sporty's Private Pilot Syllabus - Deployment Guide

## 📋 Quick Start Checklist

### Prerequisites
- ✅ Desert Skies Portal system running
- ✅ Database access (Supabase or PostgreSQL)
- ✅ Admin account credentials
- ✅ ACS standards already loaded in database

### Deployment Steps

#### Step 1: Deploy Main Syllabus (REQUIRED)
```bash
# Run the main syllabus creation script
psql -h YOUR_HOST -U postgres -d postgres -f database/create-sportys-part61-syllabus.sql
```

**What this creates**:
- ✅ 1 Syllabus record: "Sporty's Private Pilot Course - Part 61"
- ✅ 59 Lesson records (Stage I: 32, Stage II: 15, Stage III: 12)
- ✅ Complete lesson content with objectives, standards, briefings

**Expected Output**:
```
NOTICE:  Created Sporty's Syllabus with ID: <uuid>
NOTICE:  Created first 5 lessons of Stage I
NOTICE:  Successfully created Sporty's Private Pilot Part 61 Syllabus with all 59 lessons!
```

**Verification**:
Check the query results at the end of the script:
- Total lessons: **59**
- Ground lessons: **~28**
- Flight lessons: **~27**
- Solo lessons: **~4**
- Total hours: **~87 hours**

---

#### Step 2: Link ACS Standards (RECOMMENDED)
```bash
# Run the ACS standards linking script
psql -h YOUR_HOST -U postgres -d postgres -f database/sportys-syllabus-acs-standards.sql
```

**What this creates**:
- ✅ ACS task links for key maneuver lessons
- ✅ Stage check comprehensive evaluations
- ✅ Proficiency target assignments

**Expected Output**:
```
NOTICE:  Linking ACS standards to Sporty's syllabus: <uuid>
NOTICE:  Successfully linked ACS standards to Sporty's syllabus lessons!
```

**Lessons with ACS Links**:
- Lesson 2: Normal takeoffs/landings
- Lessons 5, 7, 9, 11, 15, 21: Slow flight and stalls
- Lesson 13: Ground reference maneuvers
- Lesson 17: Go-arounds and emergency approaches
- Lesson 19: Crosswind operations and slips
- Lesson 27: **Stage I Check** (comprehensive)
- Lesson 34: Short/soft field operations
- Lessons 40, 42: Cross-country operations
- Lessons 50-51: Instrument flight
- Lessons 54-55: Night operations
- Lesson 59: **Stage III Check** (comprehensive final)

---

#### Step 3: Add FAR References (RECOMMENDED)
```bash
# Run the FAR references script
psql -h YOUR_HOST -U postgres -d postgres -f database/sportys-syllabus-far-references.sql
```

**What this creates**:
- ✅ Regulatory references for applicable lessons
- ✅ Required vs. supplemental classification
- ✅ AIM chapter references

**Expected Output**:
```
NOTICE:  Adding FAR references to Sporty's syllabus: <uuid>
NOTICE:  Successfully added FAR references to Sporty's syllabus lessons!
```

**Key Lessons with FAR References**:
- Lesson 1: 91.103 (Preflight action), 91.203 (Documents)
- Lesson 3: 91.113 (Right of way), 91.126 (Non-towered airports)
- Lesson 18: **Comprehensive FAR review** (61.51, 61.87, 61.113, NTSB 830)
- Lesson 26: **Airspace regulations** (91.155, 91.129-131)
- Lesson 30: **Aeromedical** (61.23, 61.53, 91.17)
- Lessons 22, 24: **Maintenance** (91.409, 91.417)

---

#### Step 4: Verify Deployment
```bash
# Check syllabus exists
psql -c "SELECT id, title, version, total_ground_hours, total_flight_hours FROM syllabi WHERE title LIKE 'Sporty%';"

# Count lessons
psql -c "SELECT COUNT(*) FROM syllabus_lessons WHERE syllabus_id = (SELECT id FROM syllabi WHERE title LIKE 'Sporty%');"

# Count ACS links
psql -c "SELECT COUNT(*) FROM lesson_acs_standards WHERE lesson_id IN (SELECT id FROM syllabus_lessons WHERE syllabus_id = (SELECT id FROM syllabi WHERE title LIKE 'Sporty%'));"

# Count FAR references
psql -c "SELECT COUNT(*) FROM lesson_far_references WHERE lesson_id IN (SELECT id FROM syllabus_lessons WHERE syllabus_id = (SELECT id FROM syllabi WHERE title LIKE 'Sporty%'));"
```

---

## 🎯 Post-Deployment Tasks

### Immediate (Admin Portal)

1. **Verify Syllabus in UI**
   - Navigate to `/admin/syllabi`
   - Locate "Sporty's Private Pilot Course - Part 61"
   - Click to view details
   - Verify 59 lessons are displayed

2. **Review Lesson Content**
   - Click into key lessons (2, 5, 13, 27)
   - Verify objectives and performance standards are populated
   - Check that briefing content displays properly

3. **Test Stage Checks**
   - Review Lesson 27 (Stage I Check)
   - Review Lesson 47 (Stage II Check)
   - Review Lesson 59 (Stage III Check)
   - Ensure comprehensive evaluation criteria are present

### Short Term (Within 1 Week)

4. **Add Learning Resources**
   - Add Sporty's Learn to Fly video links to lessons
   - Link FAA Airplane Flying Handbook chapters
   - Link Pilot's Handbook of Aeronautical Knowledge chapters
   - Add Chart Supplement and sectional chart references

5. **Configure Maneuver Links**
   - Link maneuvers from your maneuver library
   - Associate with appropriate lessons
   - Mark as required/optional

6. **Test Student Enrollment**
   - Enroll a test student
   - Verify lesson progression
   - Test stage advancement logic
   - Validate completion tracking

### Medium Term (Within 1 Month)

7. **Customize for Your Operation**
   - Adjust estimated hours based on your experience
   - Modify briefing content to match your teaching style
   - Add aircraft-specific notes and limitations
   - Insert local airport procedures and practices

8. **Build Resource Library**
   - Upload supplemental training materials
   - Create video briefings (optional)
   - Develop lesson-specific handouts
   - Build quiz/test question banks

9. **Train Instructors**
   - Review syllabus structure with CFI team
   - Explain grading system (1-5 scale, S/U/I)
   - Train on stage check procedures
   - Establish consistency in instruction

---

## 📊 Syllabus Structure Reference

### Stage I: Pre-Solo Training (Lessons 1-32)
**Hours**: 19.3 dual + 0.6 solo + 24.0 ground = **43.9 hours**

**Key Milestones**:
- Lesson 25: Pre-solo evaluation + written exam
- Lesson 27: **Stage I Check** (3.0 hrs)
- Lesson 32: **First Solo Flight** (1.6 hrs)

**Topics Covered**:
- Aircraft familiarization and systems
- Basic flight maneuvers (climbs, descents, turns)
- Slow flight and stalls
- Steep turns
- Ground reference maneuvers
- Traffic pattern operations
- Normal and crosswind takeoffs/landings
- Emergency procedures
- Weather fundamentals
- FARs and regulations
- Airspace classification

### Stage II: Cross-Country & Performance (Lessons 33-47)
**Hours**: 7.9 dual + 2.5 solo + 10.9 ground = **21.3 hours**

**Key Milestones**:
- Lesson 40: First dual cross-country (pilotage)
- Lesson 44: Solo cross-country (local)
- Lesson 47: **Stage II Check** (2.7 hrs)

**Topics Covered**:
- Navigation principles (pilotage, dead reckoning)
- Short-field and soft-field operations
- Cross-country flight planning
- Wind triangle and flight computer
- Diversions and lost procedures
- Electronic navigation (VOR, GPS)
- Towered airport operations
- Advanced communications

### Stage III: Night & Advanced Operations (Lessons 48-59)
**Hours**: 10.2 dual + 2.0 solo + 3.3 instrument + 3.0 night + 7.5 ground = **26.0 hours**

**Key Milestones**:
- Lesson 52: **Solo Long Cross-Country** (150nm+, 2.0 hrs)
- Lesson 54: Night flight with 5 takeoffs/landings
- Lesson 55: **Night Cross-Country** (100nm+, 4.7 hrs)
- Lesson 57: FAA Knowledge Test
- Lesson 59: **Stage III Check / Mock Checkride** (2.7 hrs)

**Topics Covered**:
- Basic attitude instrument flight
- Unusual attitude recovery
- VOR and GPS navigation
- Long cross-country operations
- Night flying theory and physiology
- Night takeoffs and landings
- Night cross-country navigation
- Checkride preparation
- Final polish and proficiency development

---

## 💡 Best Practices

### For Administrators

1. **Regular Reviews**: Review syllabus content quarterly and update as needed
2. **Track Metrics**: Monitor lesson completion rates and average times
3. **Gather Feedback**: Collect input from instructors and students
4. **Stay Current**: Update for ACS changes and new regulations

### For Instructors

1. **Prepare Thoroughly**: Review lesson objectives before each session
2. **Use Briefing Content**: Reference pre/post-flight briefing notes
3. **Grade Consistently**: Apply 1-5 scale uniformly across students
4. **Document Progress**: Note specific areas needing improvement
5. **Stage Check Readiness**: Ensure students meet standards before checks

### For Students

1. **Study Ahead**: Complete assigned video lessons before flights
2. **Ask Questions**: Clarify objectives and standards with instructor
3. **Track Progress**: Use the portal to monitor lesson completion
4. **Prepare for Stage Checks**: Review all previous lessons in the stage
5. **Stay Current**: Maintain consistent training schedule

---

## 🔧 Troubleshooting

### Syllabus Doesn't Appear in Admin Panel

**Possible Causes**:
- Database migration not run successfully
- RLS policies blocking access
- Cached data in browser

**Solutions**:
```bash
# Check if syllabus exists
psql -c "SELECT * FROM syllabi WHERE title LIKE 'Sporty%';"

# Check RLS policies
psql -c "SELECT * FROM pg_policies WHERE tablename = 'syllabi';"

# Refresh browser cache (Ctrl+Shift+R)
```

### Lessons Not Displaying

**Possible Causes**:
- Foreign key constraint issues
- Lessons not linked to correct syllabus_id
- is_active flag set to false

**Solutions**:
```bash
# Check lesson count
psql -c "SELECT COUNT(*) FROM syllabus_lessons WHERE syllabus_id = 'YOUR_SYLLABUS_ID';"

# Check is_active status
psql -c "SELECT order_index, title, is_active FROM syllabus_lessons WHERE syllabus_id = 'YOUR_SYLLABUS_ID' ORDER BY order_index;"
```

### ACS Standards Not Linking

**Possible Causes**:
- ACS standards not loaded in database
- Incorrect ACS task codes in migration
- Foreign key constraints failing

**Solutions**:
```bash
# Check if ACS standards exist
psql -c "SELECT COUNT(*) FROM acs_tasks;"

# Check failed links
# Review error messages from migration script
```

---

## 📞 Support

### Database Issues
- Review error messages from SQL migrations
- Check Supabase dashboard for RLS policy issues
- Verify foreign key relationships

### Content Issues
- Reference `SPORTYS_SYLLABUS_IMPLEMENTATION_GUIDE.md`
- Review original Sporty's syllabus PDF
- Consult FAA ACS and regulations

### System Issues
- Check Desert Skies Portal documentation
- Review MCP tool integration
- Verify user role permissions

---

## 📚 Related Documentation

- `create-sportys-part61-syllabus.sql` - Main syllabus creation script
- `sportys-syllabus-acs-standards.sql` - ACS standards linking
- `sportys-syllabus-far-references.sql` - FAR references
- `SPORTYS_SYLLABUS_IMPLEMENTATION_GUIDE.md` - Comprehensive implementation guide
- `Resources/Syllabi/Private_Pilot/SportysPPC_part61.md` - Original source material

---

## ✅ Deployment Checklist

- [ ] Step 1: Run main syllabus creation script
- [ ] Step 2: Verify 59 lessons created
- [ ] Step 3: Run ACS standards linking script
- [ ] Step 4: Run FAR references script
- [ ] Step 5: Verify in admin portal
- [ ] Step 6: Test lesson viewing
- [ ] Step 7: Review stage check lessons (27, 47, 59)
- [ ] Step 8: Enroll test student
- [ ] Step 9: Add learning resources
- [ ] Step 10: Train instructor team
- [ ] Step 11: Begin using with actual students

---

**Deployed**: [DATE]  
**Version**: 1.0  
**Status**: Production Ready ✅

This deployment guide provides everything needed to successfully implement the Sporty's Private Pilot Part 61 syllabus in your Desert Skies Portal system.


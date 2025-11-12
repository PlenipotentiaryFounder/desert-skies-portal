# Maneuver Selector - Quick Start Guide 🚀

## How to Use the New Maneuver Selector

### 1. Open the Comprehensive Lesson Editor

**Navigation:**
```
Admin Dashboard → Syllabi → [Select a Syllabus] → Edit → [Select a Lesson] → Comprehensive Edit
```

### 2. Go to the "Maneuvers" Tab

You'll see:
- FOI (Fundamentals of Instruction) reference guide at the top
- List of currently selected maneuvers (if any)
- "Add Maneuver" button

### 3. Understanding FOI Levels

The FAA defines 4 levels of learning proficiency:

| Level | Name | Icon | Meaning |
|-------|------|------|---------|
| **1** | **Rote** | 📝 | Student can memorize and repeat |
| **2** | **Understanding** | 💡 | Student comprehends the concept |
| **3** | **Application** | ✈️ | Student can perform with guidance |
| **4** | **Correlation** | 🎯 | Student has mastered and can relate to other concepts |

### 4. Adding a Maneuver

**Steps:**
1. Click "Add Maneuver" button
2. Search for the maneuver (e.g., "Steep Turns")
3. Filter by category if needed (e.g., "Ground Reference")
4. Click on the maneuver card to add it

### 5. Configuring the Maneuver

For each maneuver, set:

#### Target Proficiency (Required)
Choose the FOI level you expect students to reach by the end of this lesson:
- **Level 1 (Rote)**: First introduction, theory only
- **Level 2 (Understanding)**: Student understands why/how
- **Level 3 (Application)**: Student can perform with coaching
- **Level 4 (Correlation)**: Student demonstrates mastery

#### Emphasis Level (Required)
How much focus this maneuver gets:
- **Introduction**: Brief overview, first exposure
- **Standard**: Normal practice session
- **Proficiency**: Building to certification standard
- **Mastery**: Advanced refinement

#### Additional Settings
- **Required**: Toggle on if maneuver is mandatory for lesson completion
- **First Exposure**: Toggle on if this is the student's first time seeing this maneuver

### 6. Adding Teaching Notes

Click "Add Notes & Details" on any maneuver to add:

**Instructor Notes** (Private)
- Teaching tips
- Common errors to watch for
- Safety considerations
- Specific callouts for this lesson

**Student Prep Notes** (Visible to Students)
- What to study beforehand
- Videos or reading to review
- Prerequisites or concepts to understand

### 7. Reordering Maneuvers

- Grab the handle (⋮⋮) on the left side
- Drag the maneuver up or down
- Release to set new order
- Order reflects the sequence they'll be practiced

### 8. Saving

1. Click "Save Changes" in the editor header
2. Both lesson data and maneuvers save together
3. Success message confirms save
4. All configurations persist to the database

---

## Example Workflow: Adding Steep Turns to Lesson 5

### Scenario
You're creating "Lesson 5: Performance Maneuvers" and want to introduce steep turns.

### Steps:

1. **Add the Maneuver**
   - Click "Add Maneuver"
   - Search: "steep turns"
   - Click the "Steep Turns" card

2. **Configure for First Introduction**
   - Target Proficiency: **Level 2 (Understanding)** 💡
     - *Students will understand the concepts but only begin applying them*
   - Emphasis Level: **Introduction**
   - Toggle ON: **First Exposure** ✓
   - Toggle ON: **Required** ✓

3. **Add Teaching Notes**
   - Click "Add Notes & Details"
   - Instructor Notes:
     ```
     First exposure to steep turns. Focus on:
     - Outside visual references
     - Coordinated turn entry
     - Altitude maintenance within ±200'
     - Recognize overbanking tendency
     Safety: Clear the area first. Start at 3000' AGL minimum.
     ```
   - Student Prep Notes:
     ```
     Before this lesson:
     - Review PHAK Chapter 5 (Maintaining Aircraft Control)
     - Watch: "Steep Turns Technique" video
     - Understand load factor and overbanking tendency
     - Know PTS standards: ±100' altitude, ±10° bank, ±10 kts
     ```

4. **Save**
   - Click "Save Changes"
   - Confirm success ✓

### Later Lessons: Building Proficiency

**Lesson 8: Refining Performance Maneuvers**
- Target Proficiency: **Level 3 (Application)** ✈️
- Emphasis Level: **Proficiency**
- First Exposure: OFF (they've seen it before)
- Notes: "Building to ACS standards. Focus on precision."

**Lesson 15: Checkride Prep**
- Target Proficiency: **Level 4 (Correlation)** 🎯
- Emphasis Level: **Mastery**
- Notes: "Student should demonstrate mastery and explain how steep turns relate to traffic patterns, canyon turns, and other scenarios."

---

## Tips & Best Practices

### 🎯 Setting Target Proficiency

**Early in Training:**
- Use Level 1 (Rote) for pure ground instruction
- Use Level 2 (Understanding) for first flight exposures

**Mid Training:**
- Use Level 3 (Application) for building skills
- Most maneuvers will be practiced at this level

**Pre-Checkride:**
- Use Level 4 (Correlation) for final refinement
- Student should demonstrate deep understanding

### 📚 Writing Good Notes

**Instructor Notes Should Include:**
- ✅ Common errors and how to correct them
- ✅ Safety considerations specific to this lesson
- ✅ Teaching techniques that work well
- ✅ Expected student performance for this lesson

**Student Prep Notes Should Include:**
- ✅ Specific chapters or videos to review
- ✅ Prerequisites or concepts to understand
- ✅ What they'll be expected to demonstrate
- ✅ Standards they'll be working toward

### 🔄 Typical FOI Progression

For most maneuvers, follow this pattern across multiple lessons:

```
Lesson N:   Level 2 (Understanding) + Introduction
Lesson N+2: Level 3 (Application) + Standard  
Lesson N+5: Level 3 (Application) + Proficiency
Lesson N+8: Level 4 (Correlation) + Mastery
```

### ⚠️ Common Mistakes to Avoid

❌ **Don't** set Level 4 (Correlation) on first exposure  
✅ **Do** use Level 1-2 for introductions

❌ **Don't** skip levels (Level 1 → Level 4)  
✅ **Do** progress naturally through levels

❌ **Don't** leave all maneuvers at Level 3  
✅ **Do** vary based on lesson objectives

❌ **Don't** forget to mark "First Exposure"  
✅ **Do** mark it so you can track progression

---

## Keyboard Shortcuts

- `Cmd/Ctrl + S`: Save changes (when editor is focused)
- `Escape`: Close dialog
- `Tab`: Navigate between fields
- Click outside dialog: Close (with confirmation if unsaved)

---

## Troubleshooting

### Maneuver doesn't appear in search
- Check if it's already added to the lesson
- Verify spelling
- Try searching by category
- Check if maneuver exists in database

### Changes not saving
- Ensure you click "Save Changes" in the main editor
- Check for validation errors (red text)
- Verify your role is admin or instructor
- Check browser console for errors

### Drag-and-drop not working
- Make sure you're grabbing the handle (⋮⋮)
- Try refreshing the page
- Check that JavaScript is enabled

---

## Need Help?

- See full documentation: `MANEUVER_SELECTOR_IMPLEMENTATION.md`
- Check API documentation: `app/api/admin/lesson-maneuvers/route.ts`
- Review service layer: `lib/maneuver-service.ts`

---

**Ready to get started? Head to the Admin Dashboard and open any lesson for editing!** 🎉




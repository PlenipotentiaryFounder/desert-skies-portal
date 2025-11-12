# Pre-Flight Risk Assessment System

## Overview

The Pre-Flight Risk Assessment System is a comprehensive safety tool that helps students evaluate flight risks before each flight. Based on aviation best practices including the PAVE (Pilot, Aircraft, enVironment, External pressures) and IMSAFE (Illness, Medication, Stress, Alcohol, Fatigue, Eating) frameworks, this system provides a structured way to identify and quantify risk factors.

## Key Features

### ✅ For Students
- **20 Comprehensive Questions** covering all major risk categories
- **Automatic Risk Scoring** with transparent point system
- **GO/NO-GO Decision** based on total risk score
- **Disqualifying Conditions** that automatically prevent flight
- **Assessment History** to track safety patterns over time
- **Dashboard Widget** for quick access and status view

### ✅ For Instructors
- **Student Assessment Monitoring** to review all student risk assessments
- **NO-GO Alerts** to identify students who shouldn't fly
- **Override Capability** to modify assessments when appropriate
- **Statistics Dashboard** showing overall safety trends
- **Student-specific Views** to track individual progress

## System Architecture

### Database Schema

#### Core Tables
1. **risk_assessment_categories** - PAVE framework categories
2. **risk_assessment_questions** - Individual assessment questions
3. **risk_assessment_answer_options** - Multiple choice answers with scores
4. **risk_assessment_numeric_ranges** - Scoring ranges for numeric questions
5. **risk_assessment_config** - System configuration and thresholds
6. **risk_assessments** - Completed student assessments
7. **risk_assessment_responses** - Individual question responses

### Question Categories (PAVE Framework)

#### 1. Pilot (7 questions)
Based on IMSAFE checklist:
- Illness
- Medication
- Stress
- Alcohol
- Fatigue/Sleep
- Eating/Nutrition
- Currency/Experience

#### 2. Aircraft (4 questions)
- Maintenance status
- Known squawks
- Fuel reserves
- Weight & Balance

#### 3. Environment (6 questions)
- Weather conditions
- Thunderstorms
- Winds/Crosswinds
- Density altitude
- Airport familiarity
- Terrain

#### 4. External Pressures (3 questions)
- Schedule pressure
- Passengers
- Time of day

## Risk Scoring System

### Score Assignment
- Each answer has a risk score (0-8 points)
- Some conditions are automatically disqualifying (regardless of score)
- Total score is sum of all individual answers

### Default Configuration
- **Maximum Allowed Score:** 15 points
- **GO:** Score ≤ 15 (no disqualifying conditions)
- **CAUTION:** Score 12-15 (approaching limit, review carefully)
- **NO-GO:** Score > 15 OR any disqualifying condition

### Disqualifying Conditions
Examples of automatic NO-GO conditions:
- Illness (significant symptoms)
- Non-approved medication
- Alcohol within 8 hours
- Overdue maintenance
- Insufficient fuel
- IMC conditions (for VFR flight)
- Thunderstorms on route
- Night flight (for student pilots)

## User Workflows

### Student Workflow

1. **Navigate to Risk Assessment**
   - From dashboard widget or menu: `/student/risk-assessment`

2. **Complete Assessment**
   - Answer all 20 questions honestly
   - Questions organized by category
   - Help text provided for each question
   - Risk scores visible for transparency

3. **Review Result**
   - Immediate GO/NO-GO decision
   - Visual indicators (green/yellow/red)
   - Detailed score breakdown
   - Safety recommendations

4. **Take Action**
   - GO: Proceed with flight planning
   - CAUTION: Consult instructor or implement mitigation
   - NO-GO: Do not fly, address conditions

5. **View History**
   - Access past assessments from dashboard
   - Track safety patterns over time
   - Review specific assessment details

### Instructor Workflow

1. **Monitor Assessments**
   - View all student assessments: `/instructor/risk-assessments`
   - Filter by result type (All, NO-GO)
   - Review statistics and trends

2. **Review NO-GO Assessments**
   - Identify students who shouldn't fly
   - Review their specific risk factors
   - Follow up with students as needed

3. **Apply Overrides (if necessary)**
   - Review assessment details
   - Add override with reason
   - Modify GO/NO-GO decision

## API Endpoints

### POST /api/risk-assessments
Create a new risk assessment

**Request Body:**
```json
{
  "student_id": "uuid",
  "flight_session_id": "uuid (optional)",
  "responses": [
    {
      "question_id": "uuid",
      "answer_option_id": "uuid (for multiple choice)",
      "numeric_value": 5000 (for numeric questions)
    }
  ],
  "notes": "Optional notes"
}
```

**Response:**
```json
{
  "assessment_id": "uuid",
  "total_score": 8,
  "max_allowed_score": 15,
  "result": "go",
  "has_disqualifying_answers": false,
  "message": "✅ GO - Your risk score (8) is within acceptable limits..."
}
```

### GET /api/risk-assessments
Get assessments (filtered by user role)

**Query Parameters:**
- `student_id` - Filter by student (instructors only)
- `limit` - Number of results (default: 10)

## Service Layer Functions

Located in `lib/risk-assessment-service.ts`:

### Read Operations
- `getCategories()` - Get all categories
- `getQuestionsWithOptions()` - Get questions with answers
- `getActiveConfig()` - Get system configuration
- `getAssessment(id)` - Get specific assessment
- `getAssessmentResponses(id)` - Get assessment answers
- `getStudentAssessments(studentId, limit)` - Student's history
- `getRecentAssessments(limit)` - Recent assessments (instructors)
- `getNoGoAssessments(limit)` - NO-GO assessments

### Write Operations
- `createAssessment(input)` - Create new assessment
- `instructorOverride(assessmentId, instructorId, reason, newResult)` - Apply override

## Components

### Student Components
- **RiskAssessmentForm** (`components/student/risk-assessment-form.tsx`)
  - Complete assessment interface
  - Real-time validation
  - Result display
  
- **RiskAssessmentWidget** (`components/student/risk-assessment-widget.tsx`)
  - Dashboard widget
  - Quick access to new assessment
  - Recent history summary

### Shared Components
- **RiskAssessmentHistory** (`components/shared/risk-assessment-history.tsx`)
  - Assessment list view
  - Filterable/sortable
  - Works for students and instructors

## Pages

### Student Pages
- `/student/risk-assessment` - Take new assessment
- `/student/risk-assessments/[id]` - View assessment details

### Instructor Pages
- `/instructor/risk-assessments` - View all assessments with statistics

## Safety Best Practices

### For Students
1. **Be Honest** - The system only works if you answer truthfully
2. **Complete Before Every Flight** - Conditions change daily
3. **Don't Override Your Judgment** - If you feel unsafe, don't fly
4. **Consult Instructors** - When CAUTION or unsure
5. **Document Concerns** - Use notes field for additional context

### For Instructors
1. **Review NO-GO Assessments** - Follow up with students
2. **Look for Patterns** - Identify recurring risk factors
3. **Use as Teaching Tool** - Discuss risk management
4. **Override Judiciously** - Document reasons clearly
5. **Encourage Honesty** - Create safe reporting culture

## Customization

### Modifying Score Thresholds
Update `risk_assessment_config` table:
```sql
UPDATE risk_assessment_config
SET max_allowed_score = 12
WHERE is_active = true;
```

### Adding Questions
1. Add to appropriate category
2. Define answer options with risk scores
3. Set disqualifying conditions if applicable
4. Test with sample assessments

### Modifying Questions
Update via database or future admin interface:
- Question text
- Help text
- Risk scores
- Disqualifying status
- Active/inactive status

## Future Enhancements

### Planned Features
- [ ] SMS/Email alerts for NO-GO assessments
- [ ] Integration with flight scheduling (required before flight)
- [ ] Trend analysis and reporting
- [ ] Machine learning risk prediction
- [ ] Mobile app for quick assessments
- [ ] Weather data integration (auto-populate conditions)
- [ ] Admin interface for question management
- [ ] Export assessments to PDF
- [ ] Instructor comments on assessments
- [ ] Risk mitigation recommendations

## Technical Details

### Security
- Row Level Security (RLS) policies enforce access control
- Students can only view/create own assessments
- Instructors can view all, modify via override
- Authentication required for all operations

### Performance
- Indexed foreign keys for fast queries
- Efficient joins for assessment details
- Pagination support for large datasets

### Data Integrity
- Foreign key constraints
- Check constraints on enums
- Automatic timestamp updates
- Cascade deletes where appropriate

## Support & Troubleshooting

### Common Issues

**Assessment won't submit**
- Ensure all questions are answered
- Check network connection
- Verify authentication

**Scores seem incorrect**
- Review answer options and their scores
- Check numeric range definitions
- Verify configuration is active

**Can't see assessments**
- Check RLS policies
- Verify user role
- Ensure proper authentication

## References

### Aviation Safety Standards
- FAA PAVE Checklist
- FAA IMSAFE Checklist
- FAA Risk Management Handbook
- Personal Minimums Checklist

### Implementation
- Next.js 14 App Router
- Supabase PostgreSQL
- Row Level Security
- Server Components
- TypeScript

---

**Version:** 1.0  
**Last Updated:** 2025-11-11  
**Contact:** thomas@desertskiesaviationaz.com


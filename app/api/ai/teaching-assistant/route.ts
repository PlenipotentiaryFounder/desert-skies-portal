import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient(await cookies())
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { question, lessonId, context } = await request.json()

    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 })
    }

    // Get lesson context if provided
    let lessonData = null
    if (lessonId) {
      const { data: lesson } = await supabase
        .from('syllabus_lessons')
        .select(`
          *,
          maneuvers(*),
          lesson_acs_standards(
            acs_tasks(
              code,
              title,
              skill_elements,
              knowledge_elements
            )
          ),
          lesson_far_references(*)
        `)
        .eq('id', lessonId)
        .single()
      
      lessonData = lesson
    }

    // Generate AI response based on question type
    const response = await generateTeachingResponse(question, lessonData, context)

    return NextResponse.json({ response })
  } catch (error) {
    console.error("Error in teaching assistant:", error)
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    )
  }
}

async function generateTeachingResponse(
  question: string,
  lessonData: any,
  additionalContext?: string
) {
  const questionLower = question.toLowerCase()

  // Determine question type and generate appropriate response
  if (questionLower.includes('how to teach') || questionLower.includes('teaching strategy')) {
    return generateTeachingStrategy(question, lessonData)
  } else if (questionLower.includes('common mistake') || questionLower.includes('error')) {
    return generateCommonMistakes(question, lessonData)
  } else if (questionLower.includes('acs') || questionLower.includes('standard')) {
    return generateACSGuidance(question, lessonData)
  } else if (questionLower.includes('debrief') || questionLower.includes('feedback')) {
    return generateDebriefGuidance(question, lessonData)
  } else {
    return generateGeneralResponse(question, lessonData)
  }
}

function generateTeachingStrategy(question: string, lessonData: any) {
  if (!lessonData) {
    return {
      type: 'teaching_strategy',
      title: 'General Teaching Strategy',
      content: `Here's a recommended approach:

1. **Pre-Brief (15-20 minutes)**
   - Review lesson objectives with student
   - Discuss key concepts and techniques
   - Address student questions and concerns
   - Brief safety procedures and emergency protocols

2. **Demonstration Phase**
   - Demonstrate maneuver at normal speed
   - Break down into component parts
   - Emphasize key control inputs and visual references
   - Allow student to observe multiple iterations

3. **Practice Phase**
   - Student performs with instructor guidance
   - Provide real-time feedback on technique
   - Use positive reinforcement for correct actions
   - Allow student to self-identify errors when safe

4. **Refinement**
   - Reduce instructor input progressively
   - Focus on consistency and precision
   - Encourage self-critique and analysis
   - Build student confidence through successful repetition

5. **Post-Flight Debrief**
   - Student self-assessment first
   - Instructor provides constructive feedback
   - Celebrate successes, identify areas for improvement
   - Set goals for next lesson`,
      tips: [
        "Use the 'tell, show, do, review' method",
        "Adapt teaching pace to student's learning style",
        "Focus on one major concept per flight",
        "Build complexity gradually"
      ]
    }
  }

  const maneuvers = lessonData.maneuvers?.map((m: any) => m.name) || []
  
  return {
    type: 'teaching_strategy',
    title: `Teaching Strategy for ${lessonData.title}`,
    content: `**Lesson Objective**: ${lessonData.objective || 'Build proficiency in key maneuvers'}

**Recommended Approach for This Lesson**:

1. **Pre-Brief Focus**
   - Review ${maneuvers.length > 0 ? maneuvers.join(', ') : 'lesson maneuvers'}
   - Emphasize performance standards and common errors
   - Discuss airspace and safety considerations
   - Set clear success criteria

2. **In-Flight Sequence**
${maneuvers.map((m: string, i: number) => `   ${i + 1}. ${m} - Demonstrate, then coach`).join('\n')}

3. **Key Teaching Points**
   - Focus on fundamental skills before refinement
   - Use outside visual references when possible
   - Encourage smooth, coordinated control inputs
   - Build situational awareness throughout

4. **Student Success Indicators**
   - Can verbalize procedures before execution
   - Shows improving consistency across attempts
   - Recognizes and corrects own errors
   - Maintains safety margins

5. **Debrief Emphasis**
   - What went well and why
   - Specific areas for improvement
   - Student's own assessment and insights
   - Clear goals for next session`,
    tips: [
      "Allow adequate time for each maneuver",
      "Don't overload - quality over quantity",
      "Positive reinforcement drives learning",
      "Make it challenging but achievable"
    ]
  }
}

function generateCommonMistakes(question: string, lessonData: any) {
  const maneuverMatch = question.match(/(steep turns?|stalls?|slow flight|landing|takeoff|ground reference)/i)
  const maneuver = maneuverMatch ? maneuverMatch[1] : 'this maneuver'

  return {
    type: 'common_mistakes',
    title: `Common Mistakes - ${maneuver}`,
    content: `**Common Student Errors and Corrections**:

**Most Frequent Mistakes**:
1. **Inadequate Clearing Turns**
   - Student may rush into maneuver without proper clearing
   - Correction: Emphasize safety culture, make clearing mandatory

2. **Poor Altitude/Airspeed Management**
   - Fixation on one parameter while neglecting others
   - Correction: Teach scan pattern, use outside references

3. **Uncoordinated Flight**
   - Ball out of center, skidding or slipping turns
   - Correction: "Step on the ball", constant reminder to check

4. **Inadequate Power Management**
   - Not anticipating power changes needed
   - Correction: Teach power settings for each configuration

5. **Rushing Through Procedures**
   - Skipping checklist items or briefings
   - Correction: Emphasize proper habit patterns from day one

**Prevention Strategies**:
- Set the standard early and maintain it consistently
- Use positive examples from previous flights
- Allow student to discover some errors (when safe)
- Break complex maneuvers into manageable parts
- Ensure understanding before adding complexity

**When to Intervene**:
- Safety of flight compromised
- Student shows signs of task saturation
- Persistent error pattern developing
- ACS minimums consistently not met`,
    tips: [
      "Students often rush - slow them down",
      "One major correction at a time",
      "Let them succeed before adding challenges",
      "Debrief errors constructively"
    ]
  }
}

function generateACSGuidance(question: string, lessonData: any) {
  if (!lessonData?.lesson_acs_standards || lessonData.lesson_acs_standards.length === 0) {
    return {
      type: 'acs_guidance',
      title: 'ACS Standards Guidance',
      content: `**Understanding ACS Standards**:

The FAA Airman Certification Standards (ACS) define what an applicant must know, do, and consider for each pilot certification level.

**Three Key Elements**:

1. **Knowledge Elements**
   - What the student must understand conceptually
   - Regulations, aerodynamics, systems, weather
   - Tested through oral questioning and scenario-based discussions

2. **Skill Elements**
   - What the student must demonstrate physically
   - Maneuvers, procedures, and aircraft control
   - Evaluated through practical demonstration

3. **Risk Management**
   - Hazards the student must identify and mitigate
   - Decision-making and aeronautical judgment
   - Demonstrated through scenario discussions and real-world application

**Teaching to the ACS**:
- Each lesson should map to specific ACS tasks
- Students should know which standards apply
- Practice should meet or exceed minimums
- Build habits that ensure consistent ACS performance`,
      tips: [
        "Reference ACS explicitly in briefings",
        "Show students where standards come from",
        "Practice to proficiency, not just minimums",
        "Document ACS task completion"
      ]
    }
  }

  const acsTasks = lessonData.lesson_acs_standards.map((s: any) => s.acs_tasks)

  return {
    type: 'acs_guidance',
    title: `ACS Standards for ${lessonData.title}`,
    content: `**Applicable ACS Tasks**:

${acsTasks.map((task: any, i: number) => `
${i + 1}. **${task.code}: ${task.title}**

   **Skill Elements**:
${task.skill_elements?.map((s: string) => `   • ${s}`).join('\n') || '   (Refer to ACS document)'}

   **Knowledge Elements**:
${task.knowledge_elements?.map((k: string) => `   • ${k}`).join('\n') || '   (Refer to ACS document)'}
`).join('\n')}

**Teaching Guidance**:
- Ensure student can articulate the "why" behind each element
- Practice until student consistently meets standards
- Document proficiency for each ACS task
- Use scenario-based training to integrate risk management

**Evaluation Tips**:
- Standards are performance minimums, not targets
- Teach to proficiency (consistent, confident execution)
- Ensure student can perform under various conditions
- Verify understanding through questioning and demonstration`,
    tips: [
      "Students should reference ACS themselves",
      "Build knowledge before skill demonstration",
      "Risk management is evaluated throughout",
      "Document each ACS task as completed"
    ]
  }
}

function generateDebriefGuidance(question: string, lessonData: any) {
  return {
    type: 'debrief_guidance',
    title: 'Effective Debrief Techniques',
    content: `**Conducting Effective Debriefs**:

**1. Student Self-Assessment First (5 minutes)**
   - "How do you think that went?"
   - "What went well? What would you do differently?"
   - Allow student to process their experience
   - Listen more than you speak initially

**2. Positive Reinforcement (3 minutes)**
   - Start with what went well and why
   - Be specific: "Your altitude control during steep turns was excellent"
   - Reinforce correct techniques and good decisions
   - Build confidence and motivation

**3. Areas for Improvement (5 minutes)**
   - Frame as opportunities for growth
   - Be specific with examples from the flight
   - Focus on 1-2 major areas, not everything
   - Provide actionable steps for improvement

**4. Collaborative Planning (2 minutes)**
   - "What should we focus on next time?"
   - Set clear, achievable goals for next lesson
   - Ensure student understands and agrees
   - Document in student record

**Debrief Best Practices**:
- Conduct while fresh (immediately post-flight)
- Use objective data (performance records, ACS standards)
- Balance honesty with encouragement
- Make it a conversation, not a lecture
- End on a positive, forward-looking note

**Red Flags to Address**:
- Consistently missing ACS standards
- Unsafe attitudes or behaviors
- Lack of progress across multiple lessons
- Student frustration or loss of confidence

**Documentation**:
- Record lesson objectives and completion status
- Note specific strengths and areas for improvement
- Track ACS task proficiency
- Set clear goals for next lesson`,
    tips: [
      "Students remember how you made them feel",
      "Specific feedback is better than general",
      "Focus on behavior, not personality",
      "Always end with encouragement and next steps"
    ]
  }
}

function generateGeneralResponse(question: string, lessonData: any) {
  return {
    type: 'general',
    title: 'Teaching Assistant Response',
    content: `Based on your question, here are some key considerations:

**General Guidance**:
- Every student learns differently - adapt your approach
- Safety is always the first priority in flight training
- Build complexity progressively - don't rush
- Use the "explain, demonstrate, practice, review" cycle
- Encourage questions and student engagement

**For This Lesson**:
${lessonData ? `
- **Objective**: ${lessonData.objective || 'Build proficiency in lesson skills'}
- **Estimated Duration**: ${lessonData.estimated_hours || 'Variable'} hours
- **Key Focus**: Ensure student understanding before building complexity
` : 'Focus on clear communication, safety, and building student confidence.'}

**Resources**:
- Review FAA Aviation Instructor's Handbook
- Reference applicable ACS standards
- Consult with senior instructors for specific situations
- Use scenario-based training when applicable

Feel free to ask more specific questions about teaching techniques, common student challenges, or lesson planning strategies.`,
    tips: [
      "Every teaching moment is unique",
      "Learn from each experience",
      "Stay current with best practices",
      "Collaborate with other instructors"
    ]
  }
}


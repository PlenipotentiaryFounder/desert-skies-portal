import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// ==================== TYPES ====================

export interface RiskAssessmentCategory {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface RiskAssessmentQuestion {
  id: string;
  category_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'numeric' | 'range' | 'boolean';
  is_disqualifying: boolean;
  display_order: number;
  help_text: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  answer_options?: RiskAssessmentAnswerOption[];
  numeric_ranges?: RiskAssessmentNumericRange[];
}

export interface RiskAssessmentAnswerOption {
  id: string;
  question_id: string;
  answer_text: string;
  risk_score: number;
  is_disqualifying: boolean;
  display_order: number;
  created_at: string;
}

export interface RiskAssessmentNumericRange {
  id: string;
  question_id: string;
  min_value: number | null;
  max_value: number | null;
  risk_score: number;
  is_disqualifying: boolean;
  range_label: string | null;
  display_order: number;
  created_at: string;
}

export interface RiskAssessmentConfig {
  id: string;
  name: string;
  description: string | null;
  max_allowed_score: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RiskAssessment {
  id: string;
  student_id: string;
  config_id: string | null;
  flight_session_id: string | null;
  total_score: number;
  max_allowed_score: number;
  result: 'go' | 'no_go' | 'caution';
  has_disqualifying_answers: boolean;
  completed_at: string;
  notes: string | null;
  instructor_override: boolean;
  instructor_override_by: string | null;
  instructor_override_at: string | null;
  instructor_override_reason: string | null;
  created_at: string;
  student?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  flight_session?: {
    scheduled_start: string;
    scheduled_end: string;
  };
}

export interface RiskAssessmentResponse {
  id: string;
  assessment_id: string;
  question_id: string;
  answer_option_id: string | null;
  numeric_value: number | null;
  risk_score: number;
  is_disqualifying: boolean;
  created_at: string;
  question?: RiskAssessmentQuestion;
  answer_option?: RiskAssessmentAnswerOption;
}

export interface QuestionWithOptions extends RiskAssessmentQuestion {
  category: RiskAssessmentCategory;
}

export interface CreateAssessmentInput {
  student_id: string;
  flight_session_id?: string;
  mission_id?: string;
  responses: {
    question_id: string;
    answer_option_id?: string;
    numeric_value?: number;
  }[];
  notes?: string;
}

export interface AssessmentResult {
  assessment_id: string;
  total_score: number;
  max_allowed_score: number;
  result: 'go' | 'no_go' | 'caution';
  has_disqualifying_answers: boolean;
  message: string;
}

// ==================== SERVICE FUNCTIONS ====================

/**
 * Get all active risk assessment categories
 */
export async function getCategories(): Promise<RiskAssessmentCategory[]> {
  const supabase = await createClient(await cookies());

  const { data, error } = await supabase
    .from('risk_assessment_categories')
    .select('*')
    .order('display_order');

  if (error) {
    console.error('Error fetching risk assessment categories:', error);
    throw new Error('Failed to fetch risk assessment categories');
  }

  return data || [];
}

/**
 * Get all active questions with their options, grouped by category
 */
export async function getQuestionsWithOptions(): Promise<QuestionWithOptions[]> {
  const supabase = await createClient(await cookies());

  const { data: questions, error: questionsError } = await supabase
    .from('risk_assessment_questions')
    .select(`
      *,
      category:risk_assessment_categories(*),
      answer_options:risk_assessment_answer_options(*),
      numeric_ranges:risk_assessment_numeric_ranges(*)
    `)
    .eq('is_active', true)
    .order('display_order');

  if (questionsError) {
    console.error('Error fetching questions:', questionsError);
    throw new Error('Failed to fetch risk assessment questions');
  }

  // Sort answer options and numeric ranges by display_order
  const processedQuestions = (questions || []).map(q => ({
    ...q,
    answer_options: (q.answer_options || []).sort((a, b) => a.display_order - b.display_order),
    numeric_ranges: (q.numeric_ranges || []).sort((a, b) => a.display_order - b.display_order)
  }));

  return processedQuestions as QuestionWithOptions[];
}

/**
 * Get active risk assessment configuration
 */
export async function getActiveConfig(): Promise<RiskAssessmentConfig | null> {
  const supabase = await createClient(await cookies());

  const { data, error } = await supabase
    .from('risk_assessment_config')
    .select('*')
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching config:', error);
    throw new Error('Failed to fetch risk assessment configuration');
  }

  return data;
}

/**
 * Calculate risk score for a numeric answer
 */
function calculateNumericScore(
  numericValue: number,
  ranges: RiskAssessmentNumericRange[]
): { score: number; isDisqualifying: boolean } {
  for (const range of ranges) {
    const minValue = range.min_value ?? -Infinity;
    const maxValue = range.max_value ?? Infinity;

    if (numericValue >= minValue && numericValue <= maxValue) {
      return {
        score: range.risk_score,
        isDisqualifying: range.is_disqualifying
      };
    }
  }

  return { score: 0, isDisqualifying: false };
}

/**
 * Create a new risk assessment with responses
 */
export async function createAssessment(
  input: CreateAssessmentInput
): Promise<AssessmentResult> {
  const supabase = await createClient(await cookies());

  try {
    // Get active config
    const config = await getActiveConfig();
    if (!config) {
      throw new Error('No active risk assessment configuration found');
    }

    // Get all questions with their scoring info
    const questions = await getQuestionsWithOptions();
    const questionMap = new Map(questions.map(q => [q.id, q]));

    // Calculate scores for each response
    let totalScore = 0;
    let hasDisqualifying = false;
    const processedResponses: Array<{
      question_id: string;
      answer_option_id: string | null;
      numeric_value: number | null;
      risk_score: number;
      is_disqualifying: boolean;
    }> = [];

    for (const response of input.responses) {
      const question = questionMap.get(response.question_id);
      if (!question) {
        throw new Error(`Question ${response.question_id} not found`);
      }

      let riskScore = 0;
      let isDisqualifying = false;

      if (response.answer_option_id) {
        // Multiple choice answer
        const option = question.answer_options?.find(
          o => o.id === response.answer_option_id
        );
        if (option) {
          riskScore = option.risk_score;
          isDisqualifying = option.is_disqualifying;
        }
      } else if (response.numeric_value !== undefined && response.numeric_value !== null) {
        // Numeric answer
        const { score, isDisqualifying: numericDisqualifying } = calculateNumericScore(
          response.numeric_value,
          question.numeric_ranges || []
        );
        riskScore = score;
        isDisqualifying = numericDisqualifying;
      }

      totalScore += riskScore;
      if (isDisqualifying) {
        hasDisqualifying = true;
      }

      processedResponses.push({
        question_id: response.question_id,
        answer_option_id: response.answer_option_id || null,
        numeric_value: response.numeric_value || null,
        risk_score: riskScore,
        is_disqualifying: isDisqualifying
      });
    }

    // Determine result
    let result: 'go' | 'no_go' | 'caution';
    let message: string;

    if (hasDisqualifying) {
      result = 'no_go';
      message = '⛔ NO GO - You have one or more disqualifying conditions. Do not fly today.';
    } else if (totalScore > config.max_allowed_score) {
      result = 'no_go';
      message = `⛔ NO GO - Your risk score (${totalScore}) exceeds the maximum allowed (${config.max_allowed_score}). Consider postponing this flight.`;
    } else if (totalScore >= config.max_allowed_score * 0.75) {
      result = 'caution';
      message = `⚠️ CAUTION - Your risk score (${totalScore}) is approaching the limit (${config.max_allowed_score}). Review your answers carefully and consider mitigation strategies or instructor consultation.`;
    } else {
      result = 'go';
      message = `✅ GO - Your risk score (${totalScore}) is within acceptable limits (max: ${config.max_allowed_score}). Safe flying!`;
    }

    // Create assessment
    const { data: assessment, error: assessmentError } = await supabase
      .from('risk_assessments')
      .insert({
        student_id: input.student_id,
        config_id: config.id,
        flight_session_id: input.flight_session_id || null,
        mission_id: input.mission_id || null,
        total_score: totalScore,
        max_allowed_score: config.max_allowed_score,
        result,
        has_disqualifying_answers: hasDisqualifying,
        notes: input.notes || null,
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (assessmentError) {
      console.error('Error creating assessment:', assessmentError);
      throw new Error('Failed to create risk assessment');
    }

    // Insert all responses
    const responsesWithAssessmentId = processedResponses.map(r => ({
      ...r,
      assessment_id: assessment.id
    }));

    const { error: responsesError } = await supabase
      .from('risk_assessment_responses')
      .insert(responsesWithAssessmentId);

    if (responsesError) {
      console.error('Error creating responses:', responsesError);
      throw new Error('Failed to save assessment responses');
    }

    return {
      assessment_id: assessment.id,
      total_score: totalScore,
      max_allowed_score: config.max_allowed_score,
      result,
      has_disqualifying_answers: hasDisqualifying,
      message
    };
  } catch (error) {
    console.error('Error in createAssessment:', error);
    throw error;
  }
}

/**
 * Get a specific assessment with all its details
 */
export async function getAssessment(assessmentId: string): Promise<RiskAssessment | null> {
  const supabase = await createClient(await cookies());

  const { data, error } = await supabase
    .from('risk_assessments')
    .select(`
      *,
      student:profiles!risk_assessments_student_id_fkey(first_name, last_name, email),
      flight_session:flight_sessions(scheduled_start, scheduled_end)
    `)
    .eq('id', assessmentId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching assessment:', error);
    throw new Error('Failed to fetch risk assessment');
  }

  return data;
}

/**
 * Get assessment responses with question and answer details
 */
export async function getAssessmentResponses(
  assessmentId: string
): Promise<RiskAssessmentResponse[]> {
  const supabase = await createClient(await cookies());

  const { data, error } = await supabase
    .from('risk_assessment_responses')
    .select(`
      *,
      question:risk_assessment_questions(*),
      answer_option:risk_assessment_answer_options(*)
    `)
    .eq('assessment_id', assessmentId)
    .order('created_at');

  if (error) {
    console.error('Error fetching responses:', error);
    throw new Error('Failed to fetch assessment responses');
  }

  return data || [];
}

/**
 * Get all assessments for a student
 */
export async function getStudentAssessments(
  studentId: string,
  limit: number = 10
): Promise<RiskAssessment[]> {
  const supabase = await createClient(await cookies());

  const { data, error } = await supabase
    .from('risk_assessments')
    .select(`
      *,
      flight_session:flight_sessions(scheduled_start, scheduled_end)
    `)
    .eq('student_id', studentId)
    .order('completed_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching student assessments:', error);
    throw new Error('Failed to fetch student assessments');
  }

  return data || [];
}

/**
 * Get recent assessments for instructor review
 */
export async function getRecentAssessments(limit: number = 20): Promise<RiskAssessment[]> {
  const supabase = await createClient(await cookies());

  const { data, error } = await supabase
    .from('risk_assessments')
    .select(`
      *,
      student:profiles!risk_assessments_student_id_fkey(first_name, last_name, email),
      flight_session:flight_sessions(scheduled_start, scheduled_end)
    `)
    .order('completed_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent assessments:', error);
    throw new Error('Failed to fetch recent assessments');
  }

  return data || [];
}

/**
 * Instructor override for an assessment
 */
export async function instructorOverride(
  assessmentId: string,
  instructorId: string,
  reason: string,
  newResult: 'go' | 'no_go' | 'caution'
): Promise<void> {
  const supabase = await createClient(await cookies());

  const { error } = await supabase
    .from('risk_assessments')
    .update({
      instructor_override: true,
      instructor_override_by: instructorId,
      instructor_override_at: new Date().toISOString(),
      instructor_override_reason: reason,
      result: newResult
    })
    .eq('id', assessmentId);

  if (error) {
    console.error('Error updating assessment override:', error);
    throw new Error('Failed to apply instructor override');
  }
}

/**
 * Get assessments that resulted in NO GO
 */
export async function getNoGoAssessments(limit: number = 50): Promise<RiskAssessment[]> {
  const supabase = await createClient(await cookies());

  const { data, error } = await supabase
    .from('risk_assessments')
    .select(`
      *,
      student:profiles!risk_assessments_student_id_fkey(first_name, last_name, email),
      flight_session:flight_sessions(scheduled_start, scheduled_end)
    `)
    .eq('result', 'no_go')
    .order('completed_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching no-go assessments:', error);
    throw new Error('Failed to fetch no-go assessments');
  }

  return data || [];
}


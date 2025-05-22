export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      aircraft: {
        Row: {
          category: string
          class: string
          created_at: string | null
          hobbs_time: number
          id: string
          is_active: boolean | null
          is_complex: boolean | null
          is_high_performance: boolean | null
          is_tailwheel: boolean | null
          last_inspection_date: string
          make: string
          model: string
          tail_number: string
          updated_at: string | null
          year: number
        }
        Insert: {
          category: string
          class: string
          created_at?: string | null
          hobbs_time: number
          id?: string
          is_active?: boolean | null
          is_complex?: boolean | null
          is_high_performance?: boolean | null
          is_tailwheel?: boolean | null
          last_inspection_date: string
          make: string
          model: string
          tail_number: string
          updated_at?: string | null
          year: number
        }
        Update: {
          category?: string
          class?: string
          created_at?: string | null
          hobbs_time?: number
          id?: string
          is_active?: boolean | null
          is_complex?: boolean | null
          is_high_performance?: boolean | null
          is_tailwheel?: boolean | null
          last_inspection_date?: string
          make?: string
          model?: string
          tail_number?: string
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      availability_blocks: {
        Row: {
          created_at: string | null
          end_time: string
          id: string
          reason: string | null
          recurrence_rule: string | null
          start_time: string
          updated_at: string | null
          user_id: string
          user_type: string
        }
        Insert: {
          created_at?: string | null
          end_time: string
          id?: string
          reason?: string | null
          recurrence_rule?: string | null
          start_time: string
          updated_at?: string | null
          user_id: string
          user_type: string
        }
        Update: {
          created_at?: string | null
          end_time?: string
          id?: string
          reason?: string | null
          recurrence_rule?: string | null
          start_time?: string
          updated_at?: string | null
          user_id?: string
          user_type?: string
        }
        Relationships: []
      }
      calendar_integrations: {
        Row: {
          access_token: string
          created_at: string | null
          expires_at: string | null
          id: string
          provider: string
          refresh_token: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          provider: string
          refresh_token?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          provider?: string
          refresh_token?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          first_name: string
          last_name: string
          role: string
          avatar_url: string | null
          phone: string | null
          bio: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          email: string
          first_name: string
          last_name: string
          role: string
          avatar_url?: string | null
          phone?: string | null
          bio?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          first_name?: string
          last_name?: string
          role?: string
          avatar_url?: string | null
          phone?: string | null
          bio?: string | null
        }
      }
      syllabi: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          description: string
          faa_type: string
          version: string
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          description: string
          faa_type: string
          version: string
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          description?: string
          faa_type?: string
          version?: string
          is_active?: boolean
        }
      }
      syllabus_lessons: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          syllabus_id: string
          title: string
          description: string
          order_index: number
          lesson_type: string
          estimated_hours: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          syllabus_id: string
          title: string
          description: string
          order_index: number
          lesson_type: string
          estimated_hours: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          syllabus_id?: string
          title?: string
          description?: string
          order_index?: number
          lesson_type?: string
          estimated_hours?: number
        }
      }
      maneuvers: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          description: string
          faa_reference: string
          category: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          description: string
          faa_reference: string
          category: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          description?: string
          faa_reference?: string
          category?: string
        }
      }
      lesson_maneuvers: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          lesson_id: string
          maneuver_id: string
          is_required: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          lesson_id: string
          maneuver_id: string
          is_required?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          lesson_id?: string
          maneuver_id?: string
          is_required?: boolean
        }
      }
      student_enrollments: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          student_id: string
          syllabus_id: string
          instructor_id: string
          start_date: string
          target_completion_date: string | null
          completion_date: string | null
          status: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          student_id: string
          syllabus_id: string
          instructor_id: string
          start_date: string
          target_completion_date?: string | null
          completion_date?: string | null
          status?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          student_id?: string
          syllabus_id?: string
          instructor_id?: string
          start_date?: string
          target_completion_date?: string | null
          completion_date?: string | null
          status?: string
        }
      }
      flight_sessions: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          enrollment_id: string
          lesson_id: string
          instructor_id: string
          aircraft_id: string
          date: string
          start_time: string
          end_time: string
          hobbs_start: number
          hobbs_end: number
          status: string
          notes: string | null
          weather_conditions: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          enrollment_id: string
          lesson_id: string
          instructor_id: string
          aircraft_id: string
          date: string
          start_time: string
          end_time: string
          hobbs_start: number
          hobbs_end: number
          status?: string
          notes?: string | null
          weather_conditions?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          enrollment_id?: string
          lesson_id?: string
          instructor_id?: string
          aircraft_id?: string
          date?: string
          start_time?: string
          end_time?: string
          hobbs_start?: number
          hobbs_end?: number
          status?: string
          notes?: string | null
          weather_conditions?: Json | null
        }
      }
      maneuver_scores: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          flight_session_id: string
          maneuver_id: string
          score: number
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          flight_session_id: string
          maneuver_id: string
          score: number
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          flight_session_id?: string
          maneuver_id?: string
          score?: number
          notes?: string | null
        }
      }
      documents: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          title: string
          description: string | null
          file_path: string
          file_type: string
          document_type: string
          expiration_date: string | null
          is_verified: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          title: string
          description?: string | null
          file_path: string
          file_type: string
          document_type: string
          expiration_date?: string | null
          is_verified?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          title?: string
          description?: string | null
          file_path?: string
          file_type?: string
          document_type?: string
          expiration_date?: string | null
          is_verified?: boolean
        }
      }
      endorsements: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          student_id: string
          instructor_id: string
          endorsement_type: string
          description: string
          date_issued: string
          expiration_date: string | null
          reference: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          student_id: string
          instructor_id: string
          endorsement_type: string
          description: string
          date_issued: string
          expiration_date?: string | null
          reference?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          student_id?: string
          instructor_id?: string
          endorsement_type?: string
          description?: string
          date_issued?: string
          expiration_date?: string | null
          reference?: string | null
        }
      }
      faa_requirements: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          certificate_type: string
          requirement_type: string
          description: string
          reference: string
          minimum_value: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          certificate_type: string
          requirement_type: string
          description: string
          reference: string
          minimum_value?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          certificate_type?: string
          requirement_type?: string
          description?: string
          reference?: string
          minimum_value?: number | null
        }
      }
      student_requirements: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          student_id: string
          requirement_id: string
          current_value: number
          is_complete: boolean
          completion_date: string | null
          verified_by: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          student_id: string
          requirement_id: string
          current_value?: number
          is_complete?: boolean
          completion_date?: string | null
          verified_by?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          student_id?: string
          requirement_id?: string
          current_value?: number
          is_complete?: boolean
          completion_date?: string | null
          verified_by?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

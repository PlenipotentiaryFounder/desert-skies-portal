export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      acs_areas: {
        Row: {
          area_code: string | null
          certificate_type: string
          code: string
          created_at: string | null
          description: string | null
          id: string
          order_index: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          area_code?: string | null
          certificate_type: string
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          order_index?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          area_code?: string | null
          certificate_type?: string
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          order_index?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      acs_tasks: {
        Row: {
          area_id: string
          code: string
          created_at: string | null
          description: string | null
          id: string
          knowledge_elements: Json | null
          objective: string | null
          order_index: number | null
          risk_management: Json | null
          risk_management_elements: Json | null
          skill_elements: Json | null
          skills: Json | null
          task_code: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          area_id: string
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          knowledge_elements?: Json | null
          objective?: string | null
          order_index?: number | null
          risk_management?: Json | null
          risk_management_elements?: Json | null
          skill_elements?: Json | null
          skills?: Json | null
          task_code?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          area_id?: string
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          knowledge_elements?: Json | null
          objective?: string | null
          order_index?: number | null
          risk_management?: Json | null
          risk_management_elements?: Json | null
          skill_elements?: Json | null
          skills?: Json | null
          task_code?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acs_tasks_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "acs_areas"
            referencedColumns: ["id"]
          },
        ]
      }
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
      core_topics: {
        Row: {
          description: string | null
          id: string
          name: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      custom_lessons: {
        Row: {
          based_on_lesson_id: string | null
          created_at: string | null
          description: string
          email_body: string | null
          email_subject: string | null
          estimated_hours: number
          final_thoughts: string | null
          id: string
          instructor_id: string
          is_shared: boolean
          last_used_at: string | null
          lesson_type: string
          notes: string | null
          objective: string | null
          performance_standards: string | null
          target_student_id: string | null
          title: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          based_on_lesson_id?: string | null
          created_at?: string | null
          description: string
          email_body?: string | null
          email_subject?: string | null
          estimated_hours: number
          final_thoughts?: string | null
          id?: string
          instructor_id: string
          is_shared?: boolean
          last_used_at?: string | null
          lesson_type: string
          notes?: string | null
          objective?: string | null
          performance_standards?: string | null
          target_student_id?: string | null
          title: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          based_on_lesson_id?: string | null
          created_at?: string | null
          description?: string
          email_body?: string | null
          email_subject?: string | null
          estimated_hours?: number
          final_thoughts?: string | null
          id?: string
          instructor_id?: string
          is_shared?: boolean
          last_used_at?: string | null
          lesson_type?: string
          notes?: string | null
          objective?: string | null
          performance_standards?: string | null
          target_student_id?: string | null
          title?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_lessons_based_on_lesson_id_fkey"
            columns: ["based_on_lesson_id"]
            isOneToOne: false
            referencedRelation: "syllabus_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_lessons_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_lessons_target_student_id_fkey"
            columns: ["target_student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_types: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          requires_expiration: boolean | null
          requires_verification: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          requires_expiration?: boolean | null
          requires_verification?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          requires_expiration?: boolean | null
          requires_verification?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          id: string
          user_id: string
          bucket: string
          path: string
          type: string | null
          title: string | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          bucket: string
          path: string
          type?: string | null
          title?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          bucket?: string
          path?: string
          type?: string | null
          title?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      endorsement_templates: {
        Row: {
          category: string | null
          code: string
          created_at: string
          ecfr_link: string | null
          explanation: string | null
          faa_reference: string | null
          id: string
          tags: string[] | null
          template_text: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string
          ecfr_link?: string | null
          explanation?: string | null
          faa_reference?: string | null
          id?: string
          tags?: string[] | null
          template_text: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string
          ecfr_link?: string | null
          explanation?: string | null
          faa_reference?: string | null
          id?: string
          tags?: string[] | null
          template_text?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      endorsements: {
        Row: {
          created_at: string | null
          date_issued: string
          description: string
          endorsement_type: string
          expiration_date: string | null
          id: string
          instructor_id: string
          reference: string | null
          status: string
          student_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_issued: string
          description: string
          endorsement_type: string
          expiration_date?: string | null
          id?: string
          instructor_id: string
          reference?: string | null
          status?: string
          student_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_issued?: string
          description?: string
          endorsement_type?: string
          expiration_date?: string | null
          id?: string
          instructor_id?: string
          reference?: string | null
          status?: string
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "endorsements_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "endorsements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      errors: {
        Row: {
          description: string | null
          id: string
          name: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      faa_requirements: {
        Row: {
          certificate_type: string
          created_at: string | null
          description: string
          id: string
          minimum_value: number | null
          reference: string
          requirement_type: string
          updated_at: string | null
        }
        Insert: {
          certificate_type: string
          created_at?: string | null
          description: string
          id?: string
          minimum_value?: number | null
          reference: string
          requirement_type: string
          updated_at?: string | null
        }
        Update: {
          certificate_type?: string
          created_at?: string | null
          description?: string
          id?: string
          minimum_value?: number | null
          reference?: string
          requirement_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      flight_log_entries: {
        Row: {
          aircraft_id: string
          complex_time: number | null
          created_at: string | null
          cross_country_time: number | null
          date: string
          dual_given: number | null
          dual_received: number | null
          flight_session_id: string | null
          high_performance_time: number | null
          id: string
          instructor_id: string | null
          instrument_time: number | null
          landings_day: number | null
          landings_night: number | null
          multi_engine_time: number | null
          night_time: number | null
          pic_time: number | null
          remarks: string | null
          sic_time: number | null
          simulator_time: number | null
          solo_time: number | null
          status: string
          student_id: string
          tailwheel_time: number | null
          total_time: number
          updated_at: string | null
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          aircraft_id: string
          complex_time?: number | null
          created_at?: string | null
          cross_country_time?: number | null
          date: string
          dual_given?: number | null
          dual_received?: number | null
          flight_session_id?: string | null
          high_performance_time?: number | null
          id?: string
          instructor_id?: string | null
          instrument_time?: number | null
          landings_day?: number | null
          landings_night?: number | null
          multi_engine_time?: number | null
          night_time?: number | null
          pic_time?: number | null
          remarks?: string | null
          sic_time?: number | null
          simulator_time?: number | null
          solo_time?: number | null
          status?: string
          student_id: string
          tailwheel_time?: number | null
          total_time: number
          updated_at?: string | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          aircraft_id?: string
          complex_time?: number | null
          created_at?: string | null
          cross_country_time?: number | null
          date?: string
          dual_given?: number | null
          dual_received?: number | null
          flight_session_id?: string | null
          high_performance_time?: number | null
          id?: string
          instructor_id?: string | null
          instrument_time?: number | null
          landings_day?: number | null
          landings_night?: number | null
          multi_engine_time?: number | null
          night_time?: number | null
          pic_time?: number | null
          remarks?: string | null
          sic_time?: number | null
          simulator_time?: number | null
          solo_time?: number | null
          status?: string
          student_id?: string
          tailwheel_time?: number | null
          total_time?: number
          updated_at?: string | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_instructor"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flight_log_entries_aircraft_id_fkey"
            columns: ["aircraft_id"]
            isOneToOne: false
            referencedRelation: "aircraft"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flight_log_entries_flight_session_id_fkey"
            columns: ["flight_session_id"]
            isOneToOne: false
            referencedRelation: "flight_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flight_log_entries_flight_session_id_fkey"
            columns: ["flight_session_id"]
            isOneToOne: false
            referencedRelation: "student_lesson_history"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "flight_log_entries_voided_by_fkey"
            columns: ["voided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flight_log_entry_audit: {
        Row: {
          action: string
          entry_id: string
          id: string
          notes: string | null
          performed_at: string
          performed_by: string
        }
        Insert: {
          action: string
          entry_id: string
          id?: string
          notes?: string | null
          performed_at?: string
          performed_by: string
        }
        Update: {
          action?: string
          entry_id?: string
          id?: string
          notes?: string | null
          performed_at?: string
          performed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "flight_log_entry_audit_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "flight_log_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flight_log_entry_audit_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flight_log_entry_signatures: {
        Row: {
          entry_id: string
          id: string
          is_current: boolean
          pin_hash: string
          role: string
          signed_at: string
          user_id: string
        }
        Insert: {
          entry_id: string
          id?: string
          is_current?: boolean
          pin_hash: string
          role: string
          signed_at?: string
          user_id: string
        }
        Update: {
          entry_id?: string
          id?: string
          is_current?: boolean
          pin_hash?: string
          role?: string
          signed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flight_log_entry_signatures_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "flight_log_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flight_log_entry_signatures_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flight_sessions: {
        Row: {
          aircraft_id: string
          created_at: string | null
          custom_lesson_id: string | null
          date: string
          end_time: string | null
          enrollment_id: string
          hobbs_end: number
          hobbs_start: number
          id: string
          instructor_id: string
          lesson_id: string
          location_id: string | null
          notes: string | null
          postbrief_minutes: number | null
          prebrief_minutes: number | null
          recurrence_rule: string | null
          request_status: string | null
          requested_by: string | null
          session_type: string | null
          start_time: string | null
          status: string
          updated_at: string | null
          weather_conditions: Json | null
        }
        Insert: {
          aircraft_id: string
          created_at?: string | null
          custom_lesson_id?: string | null
          date: string
          end_time?: string | null
          enrollment_id: string
          hobbs_end: number
          hobbs_start: number
          id?: string
          instructor_id: string
          lesson_id: string
          location_id?: string | null
          notes?: string | null
          postbrief_minutes?: number | null
          prebrief_minutes?: number | null
          recurrence_rule?: string | null
          request_status?: string | null
          requested_by?: string | null
          session_type?: string | null
          start_time?: string | null
          status?: string
          updated_at?: string | null
          weather_conditions?: Json | null
        }
        Update: {
          aircraft_id?: string
          created_at?: string | null
          custom_lesson_id?: string | null
          date?: string
          end_time?: string | null
          enrollment_id?: string
          hobbs_end?: number
          hobbs_start?: number
          id?: string
          instructor_id?: string
          lesson_id?: string
          location_id?: string | null
          notes?: string | null
          postbrief_minutes?: number | null
          prebrief_minutes?: number | null
          recurrence_rule?: string | null
          request_status?: string | null
          requested_by?: string | null
          session_type?: string | null
          start_time?: string | null
          status?: string
          updated_at?: string | null
          weather_conditions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "flight_sessions_aircraft_id_fkey"
            columns: ["aircraft_id"]
            isOneToOne: false
            referencedRelation: "aircraft"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flight_sessions_custom_lesson_id_fkey"
            columns: ["custom_lesson_id"]
            isOneToOne: false
            referencedRelation: "custom_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flight_sessions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "student_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flight_sessions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flight_sessions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "syllabus_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flight_sessions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_core_topics: {
        Row: {
          lesson_id: string
          topic_id: string
        }
        Insert: {
          lesson_id: string
          topic_id: string
        }
        Update: {
          lesson_id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_core_topics_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "syllabus_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_core_topics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "core_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_errors: {
        Row: {
          error_id: string
          lesson_id: string
        }
        Insert: {
          error_id: string
          lesson_id: string
        }
        Update: {
          error_id?: string
          lesson_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_errors_error_id_fkey"
            columns: ["error_id"]
            isOneToOne: false
            referencedRelation: "errors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_errors_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "syllabus_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_feedback: {
        Row: {
          created_at: string | null
          custom_lesson_id: string | null
          flight_session_id: string | null
          id: string
          instructor_id: string | null
          instructor_notes: string | null
          lesson_id: string | null
          student_id: string | null
          student_notes: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_lesson_id?: string | null
          flight_session_id?: string | null
          id?: string
          instructor_id?: string | null
          instructor_notes?: string | null
          lesson_id?: string | null
          student_id?: string | null
          student_notes?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_lesson_id?: string | null
          flight_session_id?: string | null
          id?: string
          instructor_id?: string | null
          instructor_notes?: string | null
          lesson_id?: string | null
          student_id?: string | null
          student_notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_feedback_custom_lesson_id_fkey"
            columns: ["custom_lesson_id"]
            isOneToOne: false
            referencedRelation: "custom_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_feedback_flight_session_id_fkey"
            columns: ["flight_session_id"]
            isOneToOne: false
            referencedRelation: "flight_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_feedback_flight_session_id_fkey"
            columns: ["flight_session_id"]
            isOneToOne: false
            referencedRelation: "student_lesson_history"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "lesson_feedback_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_feedback_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "syllabus_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_feedback_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_maneuvers: {
        Row: {
          created_at: string | null
          id: string
          is_required: boolean | null
          lesson_id: string
          maneuver_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          lesson_id: string
          maneuver_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          lesson_id?: string
          maneuver_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_maneuvers_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "syllabus_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_maneuvers_maneuver_id_fkey"
            columns: ["maneuver_id"]
            isOneToOne: false
            referencedRelation: "active_maneuvers_with_standards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_maneuvers_maneuver_id_fkey"
            columns: ["maneuver_id"]
            isOneToOne: false
            referencedRelation: "maneuvers"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_requirements: {
        Row: {
          contributes_hours: number | null
          created_at: string | null
          custom_lesson_id: string | null
          id: string
          is_primary: boolean | null
          lesson_id: string | null
          notes: string | null
          requirement_id: string
          updated_at: string | null
        }
        Insert: {
          contributes_hours?: number | null
          created_at?: string | null
          custom_lesson_id?: string | null
          id?: string
          is_primary?: boolean | null
          lesson_id?: string | null
          notes?: string | null
          requirement_id: string
          updated_at?: string | null
        }
        Update: {
          contributes_hours?: number | null
          created_at?: string | null
          custom_lesson_id?: string | null
          id?: string
          is_primary?: boolean | null
          lesson_id?: string | null
          notes?: string | null
          requirement_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_requirements_custom_lesson_id_fkey"
            columns: ["custom_lesson_id"]
            isOneToOne: false
            referencedRelation: "custom_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_requirements_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "syllabus_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_requirements_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "faa_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_resources: {
        Row: {
          lesson_id: string
          resource_id: string
        }
        Insert: {
          lesson_id: string
          resource_id: string
        }
        Update: {
          lesson_id?: string
          resource_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_resources_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "syllabus_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_resources_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_schedule_overview: {
        Row: {
          flight_block: string | null
          id: string
          lesson_id: string | null
          location_id: string | null
          meet_time: string | null
          post_brief: string | null
          pre_brief: string | null
        }
        Insert: {
          flight_block?: string | null
          id?: string
          lesson_id?: string | null
          location_id?: string | null
          meet_time?: string | null
          post_brief?: string | null
          pre_brief?: string | null
        }
        Update: {
          flight_block?: string | null
          id?: string
          lesson_id?: string | null
          location_id?: string | null
          meet_time?: string | null
          post_brief?: string | null
          pre_brief?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_schedule_overview_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "syllabus_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_schedule_overview_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_skills: {
        Row: {
          lesson_id: string
          skill_id: string
        }
        Insert: {
          lesson_id: string
          skill_id: string
        }
        Update: {
          lesson_id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_skills_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "syllabus_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_what_to_bring: {
        Row: {
          item_id: string
          lesson_id: string
        }
        Insert: {
          item_id: string
          lesson_id: string
        }
        Update: {
          item_id?: string
          lesson_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_what_to_bring_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "what_to_bring"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_what_to_bring_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "syllabus_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      maneuver_acs_tasks: {
        Row: {
          acs_task_id: string
          created_at: string | null
          id: string
          is_primary: boolean | null
          maneuver_id: string
        }
        Insert: {
          acs_task_id: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          maneuver_id: string
        }
        Update: {
          acs_task_id?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          maneuver_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maneuver_acs_tasks_acs_task_id_fkey"
            columns: ["acs_task_id"]
            isOneToOne: false
            referencedRelation: "acs_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maneuver_acs_tasks_maneuver_id_fkey"
            columns: ["maneuver_id"]
            isOneToOne: false
            referencedRelation: "active_maneuvers_with_standards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maneuver_acs_tasks_maneuver_id_fkey"
            columns: ["maneuver_id"]
            isOneToOne: false
            referencedRelation: "maneuvers"
            referencedColumns: ["id"]
          },
        ]
      }
      maneuver_scores: {
        Row: {
          acs_task_id: string | null
          areas_for_improvement: Json | null
          attempt_number: number | null
          certificate_type: string | null
          created_at: string | null
          flight_session_id: string
          id: string
          is_required: boolean | null
          maneuver_id: string
          meets_acs_standard: boolean | null
          notes: string | null
          performance_details: Json | null
          private_notes: string | null
          score: number
          scored_by: string | null
          student_id: string | null
          student_notes: string | null
          updated_at: string | null
        }
        Insert: {
          acs_task_id?: string | null
          areas_for_improvement?: Json | null
          attempt_number?: number | null
          certificate_type?: string | null
          created_at?: string | null
          flight_session_id: string
          id?: string
          is_required?: boolean | null
          maneuver_id: string
          meets_acs_standard?: boolean | null
          notes?: string | null
          performance_details?: Json | null
          private_notes?: string | null
          score: number
          scored_by?: string | null
          student_id?: string | null
          student_notes?: string | null
          updated_at?: string | null
        }
        Update: {
          acs_task_id?: string | null
          areas_for_improvement?: Json | null
          attempt_number?: number | null
          certificate_type?: string | null
          created_at?: string | null
          flight_session_id?: string
          id?: string
          is_required?: boolean | null
          maneuver_id?: string
          meets_acs_standard?: boolean | null
          notes?: string | null
          performance_details?: Json | null
          private_notes?: string | null
          score?: number
          scored_by?: string | null
          student_id?: string | null
          student_notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maneuver_scores_acs_task_id_fkey"
            columns: ["acs_task_id"]
            isOneToOne: false
            referencedRelation: "acs_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maneuver_scores_flight_session_id_fkey"
            columns: ["flight_session_id"]
            isOneToOne: false
            referencedRelation: "flight_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maneuver_scores_flight_session_id_fkey"
            columns: ["flight_session_id"]
            isOneToOne: false
            referencedRelation: "student_lesson_history"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "maneuver_scores_maneuver_id_fkey"
            columns: ["maneuver_id"]
            isOneToOne: false
            referencedRelation: "active_maneuvers_with_standards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maneuver_scores_maneuver_id_fkey"
            columns: ["maneuver_id"]
            isOneToOne: false
            referencedRelation: "maneuvers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maneuver_scores_scored_by_fkey"
            columns: ["scored_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maneuver_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      maneuver_standards: {
        Row: {
          acs_task_id: string | null
          airspeed_tolerance: number | null
          altitude_tolerance: number | null
          certificate_type: string
          common_errors: Json | null
          created_at: string | null
          heading_tolerance: number | null
          id: string
          is_checkride_required: boolean | null
          maneuver_id: string
          minimum_altitude: number | null
          notes: string | null
          performance_standards: Json | null
          updated_at: string | null
        }
        Insert: {
          acs_task_id?: string | null
          airspeed_tolerance?: number | null
          altitude_tolerance?: number | null
          certificate_type: string
          common_errors?: Json | null
          created_at?: string | null
          heading_tolerance?: number | null
          id?: string
          is_checkride_required?: boolean | null
          maneuver_id: string
          minimum_altitude?: number | null
          notes?: string | null
          performance_standards?: Json | null
          updated_at?: string | null
        }
        Update: {
          acs_task_id?: string | null
          airspeed_tolerance?: number | null
          altitude_tolerance?: number | null
          certificate_type?: string
          common_errors?: Json | null
          created_at?: string | null
          heading_tolerance?: number | null
          id?: string
          is_checkride_required?: boolean | null
          maneuver_id?: string
          minimum_altitude?: number | null
          notes?: string | null
          performance_standards?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maneuver_standards_acs_task_id_fkey"
            columns: ["acs_task_id"]
            isOneToOne: false
            referencedRelation: "acs_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maneuver_standards_maneuver_id_fkey"
            columns: ["maneuver_id"]
            isOneToOne: false
            referencedRelation: "active_maneuvers_with_standards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maneuver_standards_maneuver_id_fkey"
            columns: ["maneuver_id"]
            isOneToOne: false
            referencedRelation: "maneuvers"
            referencedColumns: ["id"]
          },
        ]
      }
      maneuvers: {
        Row: {
          category: string
          created_at: string | null
          description: string
          faa_reference: string
          id: string
          is_deprecated: boolean | null
          name: string
          replaced_by_id: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          faa_reference: string
          id?: string
          is_deprecated?: boolean | null
          name: string
          replaced_by_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          faa_reference?: string
          id?: string
          is_deprecated?: boolean | null
          name?: string
          replaced_by_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maneuvers_replaced_by_id_fkey"
            columns: ["replaced_by_id"]
            isOneToOne: false
            referencedRelation: "active_maneuvers_with_standards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maneuvers_replaced_by_id_fkey"
            columns: ["replaced_by_id"]
            isOneToOne: false
            referencedRelation: "maneuvers"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          created_at: string | null
          document_expiration: boolean | null
          email_enabled: boolean | null
          flight_reminders: boolean | null
          id: string
          in_app_enabled: boolean | null
          new_documents: boolean | null
          push_enabled: boolean | null
          syllabus_updates: boolean | null
          system_announcements: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          document_expiration?: boolean | null
          email_enabled?: boolean | null
          flight_reminders?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          new_documents?: boolean | null
          push_enabled?: boolean | null
          syllabus_updates?: boolean | null
          system_announcements?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          document_expiration?: boolean | null
          email_enabled?: boolean | null
          flight_reminders?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          new_documents?: boolean | null
          push_enabled?: boolean | null
          syllabus_updates?: boolean | null
          system_announcements?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          category: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          related_entity_id: string | null
          related_entity_type: string | null
          title: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          title: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          metadata: Json | null
          phone: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          metadata?: Json | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          metadata?: Json | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      resources: {
        Row: {
          description: string | null
          id: string
          link: string | null
          title: string
          type: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          link?: string | null
          title: string
          type?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          link?: string | null
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission_id: string | null
          role_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_id?: string | null
          role_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_id?: string | null
          role_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: Database["public"]["Enums"]["role_type"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: Database["public"]["Enums"]["role_type"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: Database["public"]["Enums"]["role_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      skills: {
        Row: {
          description: string | null
          id: string
          name: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      student_acs_progress: {
        Row: {
          acs_task_id: string
          checkride_ready: boolean | null
          created_at: string | null
          evaluator_id: string | null
          id: string
          instructor_notes: string | null
          last_evaluated: string | null
          last_practiced_date: string | null
          notes: string | null
          proficiency_level: number | null
          student_id: string
          student_notes: string | null
          updated_at: string | null
        }
        Insert: {
          acs_task_id: string
          checkride_ready?: boolean | null
          created_at?: string | null
          evaluator_id?: string | null
          id?: string
          instructor_notes?: string | null
          last_evaluated?: string | null
          last_practiced_date?: string | null
          notes?: string | null
          proficiency_level?: number | null
          student_id: string
          student_notes?: string | null
          updated_at?: string | null
        }
        Update: {
          acs_task_id?: string
          checkride_ready?: boolean | null
          created_at?: string | null
          evaluator_id?: string | null
          id?: string
          instructor_notes?: string | null
          last_evaluated?: string | null
          last_practiced_date?: string | null
          notes?: string | null
          proficiency_level?: number | null
          student_id?: string
          student_notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_acs_progress_acs_task_id_fkey"
            columns: ["acs_task_id"]
            isOneToOne: false
            referencedRelation: "acs_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_acs_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_enrollments: {
        Row: {
          completion_date: string | null
          created_at: string | null
          id: string
          instructor_id: string
          start_date: string
          status: string
          student_id: string
          syllabus_id: string
          target_completion_date: string | null
          updated_at: string | null
        }
        Insert: {
          completion_date?: string | null
          created_at?: string | null
          id?: string
          instructor_id: string
          start_date: string
          status?: string
          student_id: string
          syllabus_id: string
          target_completion_date?: string | null
          updated_at?: string | null
        }
        Update: {
          completion_date?: string | null
          created_at?: string | null
          id?: string
          instructor_id?: string
          start_date?: string
          status?: string
          student_id?: string
          syllabus_id?: string
          target_completion_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_enrollments_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_syllabus_id_fkey"
            columns: ["syllabus_id"]
            isOneToOne: false
            referencedRelation: "syllabi"
            referencedColumns: ["id"]
          },
        ]
      }
      student_requirements: {
        Row: {
          completion_date: string | null
          created_at: string | null
          current_value: number | null
          id: string
          is_complete: boolean | null
          requirement_id: string
          student_id: string
          updated_at: string | null
          verified_by: string | null
        }
        Insert: {
          completion_date?: string | null
          created_at?: string | null
          current_value?: number | null
          id?: string
          is_complete?: boolean | null
          requirement_id: string
          student_id: string
          updated_at?: string | null
          verified_by?: string | null
        }
        Update: {
          completion_date?: string | null
          created_at?: string | null
          current_value?: number | null
          id?: string
          is_complete?: boolean | null
          requirement_id?: string
          student_id?: string
          updated_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_requirements_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "faa_requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_requirements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_requirements_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      syllabi: {
        Row: {
          created_at: string | null
          description: string
          faa_type: string
          id: string
          is_active: boolean | null
          title: string
          updated_at: string | null
          version: string
        }
        Insert: {
          created_at?: string | null
          description: string
          faa_type: string
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string | null
          version: string
        }
        Update: {
          created_at?: string | null
          description?: string
          faa_type?: string
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string | null
          version?: string
        }
        Relationships: []
      }
      syllabus_lessons: {
        Row: {
          created_at: string | null
          description: string
          email_body: string | null
          email_subject: string | null
          estimated_hours: number
          final_thoughts: string | null
          id: string
          lesson_type: string
          notes: string | null
          objective: string | null
          order_index: number
          performance_standards: string | null
          syllabus_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          email_body?: string | null
          email_subject?: string | null
          estimated_hours: number
          final_thoughts?: string | null
          id?: string
          lesson_type: string
          notes?: string | null
          objective?: string | null
          order_index: number
          performance_standards?: string | null
          syllabus_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          email_body?: string | null
          email_subject?: string | null
          estimated_hours?: number
          final_thoughts?: string | null
          id?: string
          lesson_type?: string
          notes?: string | null
          objective?: string | null
          order_index?: number
          performance_standards?: string | null
          syllabus_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "syllabus_lessons_syllabus_id_fkey"
            columns: ["syllabus_id"]
            isOneToOne: false
            referencedRelation: "syllabi"
            referencedColumns: ["id"]
          },
        ]
      }
      syllabus_requirements: {
        Row: {
          created_at: string | null
          id: string
          is_required: boolean | null
          notes: string | null
          requirement_id: string
          syllabus_id: string
          target_hours: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          notes?: string | null
          requirement_id: string
          syllabus_id: string
          target_hours?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          notes?: string | null
          requirement_id?: string
          syllabus_id?: string
          target_hours?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "syllabus_requirements_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "faa_requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "syllabus_requirements_syllabus_id_fkey"
            columns: ["syllabus_id"]
            isOneToOne: false
            referencedRelation: "syllabi"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          created_at: string | null
          id: number
          permission: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          permission: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          permission?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      what_to_bring: {
        Row: {
          description: string | null
          id: string
          name: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      student_onboarding: {
        Row: {
          user_id: string
          current_step: string | null
          completed_steps: Json | null
          last_activity_at: string | null
          desired_program: string | null
          syllabus_id: string | null
          completed_at: string | null
          // Add any other fields as needed
        }
        Insert: {
          user_id: string
          current_step?: string | null
          completed_steps?: Json | null
          last_activity_at?: string | null
          desired_program?: string | null
          syllabus_id?: string | null
          completed_at?: string | null
          // Add any other fields as needed
        }
        Update: {
          user_id?: string
          current_step?: string | null
          completed_steps?: Json | null
          last_activity_at?: string | null
          desired_program?: string | null
          syllabus_id?: string | null
          completed_at?: string | null
          // Add any other fields as needed
        }
        Relationships: [
          {
            foreignKeyName: "student_onboarding_user_id_fkey",
            columns: ["user_id"],
            isOneToOne: true,
            referencedRelation: "profiles",
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_onboarding_syllabus_id_fkey",
            columns: ["syllabus_id"],
            isOneToOne: false,
            referencedRelation: "syllabi",
            referencedColumns: ["id"]
          }
        ]
      },
    }
    Views: {
      active_maneuvers_with_standards: {
        Row: {
          acs_task_code: string | null
          acs_task_title: string | null
          airspeed_tolerance: number | null
          altitude_tolerance: number | null
          category: string | null
          certificate_type: string | null
          common_errors: Json | null
          description: string | null
          faa_reference: string | null
          heading_tolerance: number | null
          id: string | null
          is_checkride_required: boolean | null
          minimum_altitude: number | null
          name: string | null
          performance_standards: Json | null
        }
        Relationships: []
      }
      student_lesson_history: {
        Row: {
          acs_tasks_practiced: string[] | null
          estimated_hours: number | null
          flight_time: number | null
          instructor_first_name: string | null
          instructor_last_name: string | null
          instructor_notes: string | null
          lesson_description: string | null
          lesson_title: string | null
          lesson_type: string | null
          maneuver_scores: Json[] | null
          requirements_addressed: string[] | null
          session_date: string | null
          session_id: string | null
          session_status: string | null
          student_id: string | null
          student_notes: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_logbook_progress: {
        Row: {
          acs_tasks_checkride_ready: number | null
          acs_tasks_started: number | null
          average_maneuver_score: number | null
          average_proficiency_level: number | null
          certificate_type: string | null
          completed_sessions: number | null
          enrollment_status: string | null
          first_name: string | null
          last_name: string | null
          maneuvers_meeting_acs: number | null
          recent_flight_time: number | null
          recent_sessions: number | null
          requirements_completed: number | null
          requirements_tracked: number | null
          start_date: string | null
          student_id: string | null
          syllabus_title: string | null
          target_completion_date: string | null
          total_flight_time: number | null
          total_sessions: number | null
          unique_custom_lessons_attempted: number | null
          unique_lessons_attempted: number | null
          unique_maneuvers_practiced: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_user_with_role: {
        Args: {
          p_user_id: string
          p_email: string
          p_first_name: string
          p_last_name: string
          p_phone: string
          p_bio: string
          p_status: string
          p_initial_role: Database["public"]["Enums"]["role_type"]
        }
        Returns: Json
      }
      get_lesson_details: {
        Args: { p_lesson_id?: string; p_custom_lesson_id?: string }
        Returns: {
          id: string
          title: string
          description: string
          lesson_type: string
          estimated_hours: number
          objective: string
          performance_standards: string
          final_thoughts: string
          notes: string
          email_subject: string
          email_body: string
          is_custom: boolean
          instructor_id: string
          based_on_lesson_id: string
          is_shared: boolean
          target_student_id: string
        }[]
      }
      get_student_acs_progress: {
        Args: { p_student_id: string; p_certificate_type?: string }
        Returns: {
          area_code: string
          area_title: string
          task_code: string
          task_title: string
          proficiency_level: number
          last_practiced_date: string
          checkride_ready: boolean
          total_sessions: number
          recent_sessions: number
        }[]
      }
      get_student_requirement_progress: {
        Args: { p_student_id: string; p_certificate_type?: string }
        Returns: {
          requirement_type: string
          description: string
          reference: string
          minimum_value: number
          current_value: number
          is_complete: boolean
          completion_percentage: number
        }[]
      }
      get_user_permissions: {
        Args: { p_user_id: string }
        Returns: {
          permission_name: string
        }[]
      }
      get_user_profile_and_roles: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_user_profile_with_roles: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_user_roles: {
        Args: { p_user_id: string }
        Returns: {
          role_name: Database["public"]["Enums"]["role_type"]
        }[]
      }
      get_user_roles_for_middleware: {
        Args: { p_user_id: string }
        Returns: {
          role_name: Database["public"]["Enums"]["role_type"]
        }[]
      }
      handle_auth_user_roles: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      has_permission: {
        Args: { p_user_id: string; p_permission: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          p_user_id: string
          p_role: Database["public"]["Enums"]["role_type"]
        }
        Returns: boolean
      }
      increment_custom_lesson_usage: {
        Args: { lesson_id: string }
        Returns: undefined
      }
      update_user_role: {
        Args: {
          p_user_id: string
          p_role_name: Database["public"]["Enums"]["role_type"]
        }
        Returns: Json
      }
    }
    Enums: {
      role_type: "admin" | "instructor" | "student"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      role_type: ["admin", "instructor", "student"],
    },
  },
} as const

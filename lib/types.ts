/**
 * Shared TypeScript types for the AlwaysReady platform.
 *
 * The Database type mirrors the Supabase schema and is used to
 * type the Supabase clients (giving autocompletion on .from() calls).
 *
 * IMPORTANT: Every table entry must include `Relationships: []` —
 * the @supabase/supabase-js GenericTable type requires this field.
 * Without it, the Database type fails the GenericSchema constraint
 * and every query result is typed as `never`.
 *
 * Run `supabase gen types typescript --linked` to regenerate this
 * file automatically from the live schema once migrations are stable.
 */

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

      // ── Static reference tables ────────────────────────────────────────

      key_questions: {
        Row: {
          id: string
          name: string
          display_order: number
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          display_order: number
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_order?: number
          description?: string | null
          created_at?: string
        }
        Relationships: []
      }

      service_types: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }

      klo_items: {
        Row: {
          id: string
          key_question_id: string
          title: string
          wording: string
          scope: string | null
          rating_outstanding: string | null
          rating_good: string | null
          rating_ri: string | null
          rating_inadequate: string | null
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          key_question_id: string
          title: string
          wording: string
          scope?: string | null
          rating_outstanding?: string | null
          rating_good?: string | null
          rating_ri?: string | null
          rating_inadequate?: string | null
          display_order: number
          created_at?: string
        }
        Update: {
          id?: string
          key_question_id?: string
          title?: string
          wording?: string
          scope?: string | null
          rating_outstanding?: string | null
          rating_good?: string | null
          rating_ri?: string | null
          rating_inadequate?: string | null
          display_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'klo_items_key_question_id_fkey'
            columns: ['key_question_id']
            isOneToOne: false
            referencedRelation: 'key_questions'
            referencedColumns: ['id']
          }
        ]
      }

      // ── Tenant tables ─────────────────────────────────────────────────

      organisations: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          cqc_location_id: string | null
          cqc_location_name: string | null
          cqc_rating: string | null
          cqc_last_inspection_date: string | null
          cqc_rating_fetched_at: string | null
          service_type_id: string
          subscription_tier: 'trial' | 'active' | 'past_due' | 'canceled'
          is_beta: boolean
          is_charity: boolean
          charity_number: string | null
          trial_expires_at: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscribed_at: string | null
          terms_accepted_at: string | null
          terms_version: string | null
          holiday_unit: 'days' | 'hours'
          data_deletion_due_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          cqc_location_id?: string | null
          cqc_location_name?: string | null
          cqc_rating?: string | null
          cqc_last_inspection_date?: string | null
          cqc_rating_fetched_at?: string | null
          service_type_id: string
          subscription_tier?: 'trial' | 'active' | 'past_due' | 'canceled'
          is_beta?: boolean
          is_charity?: boolean
          charity_number?: string | null
          trial_expires_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscribed_at?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          holiday_unit?: 'days' | 'hours'
          data_deletion_due_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string | null
          cqc_location_id?: string | null
          cqc_location_name?: string | null
          cqc_rating?: string | null
          cqc_last_inspection_date?: string | null
          cqc_rating_fetched_at?: string | null
          service_type_id?: string
          subscription_tier?: 'trial' | 'active' | 'past_due' | 'canceled'
          is_beta?: boolean
          is_charity?: boolean
          charity_number?: string | null
          trial_expires_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscribed_at?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          holiday_unit?: 'days' | 'hours'
          data_deletion_due_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'organisations_service_type_id_fkey'
            columns: ['service_type_id']
            isOneToOne: false
            referencedRelation: 'service_types'
            referencedColumns: ['id']
          }
        ]
      }

      organisation_sub_services: {
        Row: {
          id: string
          organisation_id: string
          sub_service: string
          created_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          sub_service: string
          created_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          sub_service?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'organisation_sub_services_organisation_id_fkey'
            columns: ['organisation_id']
            isOneToOne: false
            referencedRelation: 'organisations'
            referencedColumns: ['id']
          }
        ]
      }

      users: {
        Row: {
          id: string
          organisation_id: string
          email: string
          full_name: string | null
          username: string | null
          role: 'admin' | 'user' | 'viewer'
          viewer_expires_at: string | null
          marketing_consent: boolean | null
          marketing_consent_at: string | null
          onboarding_complete: boolean
          personal_email: string | null
          mobile_number: string | null
          marketing_opt_out: boolean
          created_at: string
        }
        Insert: {
          id: string
          organisation_id: string
          email: string
          full_name?: string | null
          username?: string | null
          role?: 'admin' | 'user' | 'viewer'
          viewer_expires_at?: string | null
          marketing_consent?: boolean | null
          marketing_consent_at?: string | null
          onboarding_complete?: boolean
          personal_email?: string | null
          mobile_number?: string | null
          marketing_opt_out?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          email?: string
          full_name?: string | null
          username?: string | null
          role?: 'admin' | 'user' | 'viewer'
          viewer_expires_at?: string | null
          marketing_consent?: boolean | null
          marketing_consent_at?: string | null
          onboarding_complete?: boolean
          personal_email?: string | null
          mobile_number?: string | null
          marketing_opt_out?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'users_organisation_id_fkey'
            columns: ['organisation_id']
            isOneToOne: false
            referencedRelation: 'organisations'
            referencedColumns: ['id']
          }
        ]
      }

      // ── Compliance sub-checklist tables ───────────────────────────────

      kloe_evidence: {
        Row: {
          id: string
          organisation_id: string
          klo_item_id: string
          uploaded_by: string
          file_name: string
          storage_path: string
          file_size: number | null
          mime_type: string | null
          uploaded_at: string
          scan_status: string
          /** NULL = manually uploaded; DSCR slug when pushed by an integration (e.g. 'pcs', 'nourish'). */
          integration_source: string | null
        }
        Insert: {
          id?: string
          organisation_id: string
          klo_item_id: string
          uploaded_by: string
          file_name: string
          storage_path: string
          file_size?: number | null
          mime_type?: string | null
          uploaded_at?: string
          scan_status?: string
          integration_source?: string | null
        }
        Update: {
          id?: string
          organisation_id?: string
          klo_item_id?: string
          uploaded_by?: string
          file_name?: string
          storage_path?: string
          file_size?: number | null
          mime_type?: string | null
          uploaded_at?: string
          scan_status?: string
          integration_source?: string | null
        }
        Relationships: []
      }
      klo_checklist_items: {
        Row: {
          id: string
          klo_item_id: string
          service_type_id: string | null
          item_type: 'Core' | 'Dementia Care'
          ref: string
          sub_service: 'Residential' | 'Nursing' | 'Joint' | 'Dementia' | 'Autism' | 'Learning Disabilities' | 'Mental Health' | 'End of Life' | 'Acquired Brain Injury' | 'Physical Disabilities' | 'Bariatric Care' | 'Sensory Impairment' | 'Epilepsy' | null
          checklist_item: string
          regulation: string | null
          evidence_notes: string | null
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          klo_item_id: string
          service_type_id?: string | null
          item_type: 'Core' | 'Dementia Care'
          ref: string
          sub_service?: 'Residential' | 'Nursing' | 'Joint' | 'Dementia' | 'Autism' | 'Learning Disabilities' | 'Mental Health' | 'End of Life' | 'Acquired Brain Injury' | 'Physical Disabilities' | 'Bariatric Care' | 'Sensory Impairment' | 'Epilepsy' | null
          checklist_item: string
          regulation?: string | null
          evidence_notes?: string | null
          display_order: number
          created_at?: string
        }
        Update: {
          id?: string
          klo_item_id?: string
          service_type_id?: string | null
          item_type?: 'Core' | 'Dementia Care'
          ref?: string
          sub_service?: 'Residential' | 'Nursing' | 'Joint' | 'Dementia' | 'Autism' | 'Learning Disabilities' | 'Mental Health' | 'End of Life' | 'Acquired Brain Injury' | 'Physical Disabilities' | 'Bariatric Care' | 'Sensory Impairment' | 'Epilepsy' | null
          checklist_item?: string
          regulation?: string | null
          evidence_notes?: string | null
          display_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'klo_checklist_items_klo_item_id_fkey'
            columns: ['klo_item_id']
            isOneToOne: false
            referencedRelation: 'klo_items'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'klo_checklist_items_service_type_id_fkey'
            columns: ['service_type_id']
            isOneToOne: false
            referencedRelation: 'service_types'
            referencedColumns: ['id']
          }
        ]
      }

      klo_checklist_completions: {
        Row: {
          id: string
          organisation_id: string
          checklist_item_id: string
          is_complete: boolean
          evidence_location: string | null
          notes: string | null
          completed_by: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          checklist_item_id: string
          is_complete?: boolean
          evidence_location?: string | null
          notes?: string | null
          completed_by?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          checklist_item_id?: string
          is_complete?: boolean
          evidence_location?: string | null
          notes?: string | null
          completed_by?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'klo_checklist_completions_organisation_id_fkey'
            columns: ['organisation_id']
            isOneToOne: false
            referencedRelation: 'organisations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'klo_checklist_completions_checklist_item_id_fkey'
            columns: ['checklist_item_id']
            isOneToOne: false
            referencedRelation: 'klo_checklist_items'
            referencedColumns: ['id']
          }
        ]
      }

      // ── Compliance tracking tables ─────────────────────────────────────

      compliance_records: {
        Row: {
          id: string
          organisation_id: string
          klo_item_id: string
          status: 'not_started' | 'in_progress' | 'completed'
          priority: number
          date_reviewed: string | null
          next_review_due: string | null
          review_frequency_days: number
          evidence_location: string | null
          notes: string | null
          last_updated_by: string | null
          assigned_to: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          klo_item_id: string
          status?: 'not_started' | 'in_progress' | 'completed'
          priority?: number
          date_reviewed?: string | null
          next_review_due?: string | null
          review_frequency_days?: number
          evidence_location?: string | null
          notes?: string | null
          last_updated_by?: string | null
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          klo_item_id?: string
          status?: 'not_started' | 'in_progress' | 'completed'
          priority?: number
          date_reviewed?: string | null
          next_review_due?: string | null
          review_frequency_days?: number
          evidence_location?: string | null
          notes?: string | null
          last_updated_by?: string | null
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'compliance_records_organisation_id_fkey'
            columns: ['organisation_id']
            isOneToOne: false
            referencedRelation: 'organisations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'compliance_records_klo_item_id_fkey'
            columns: ['klo_item_id']
            isOneToOne: false
            referencedRelation: 'klo_items'
            referencedColumns: ['id']
          }
        ]
      }

      /**
       * Append-only — the app only INSERTs rows here.
       * The DB trigger (sync_compliance_record_from_history) updates compliance_records.
       * RLS has no UPDATE policy so updates are rejected at the database layer.
       */
      compliance_record_history: {
        Row: {
          id: string
          organisation_id: string
          klo_item_id: string
          status: 'not_started' | 'in_progress' | 'completed' | null
          priority: number | null
          date_reviewed: string | null
          next_review_due: string | null
          review_frequency_days: number | null
          evidence_location: string | null
          notes: string | null
          changed_by: string
          system_recorded_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          klo_item_id: string
          status?: 'not_started' | 'in_progress' | 'completed' | null
          priority?: number | null
          date_reviewed?: string | null
          next_review_due?: string | null
          review_frequency_days?: number | null
          evidence_location?: string | null
          notes?: string | null
          changed_by: string
          system_recorded_at?: string
        }
        Update: { id?: string } // append-only — RLS blocks actual updates
        Relationships: [
          {
            foreignKeyName: 'compliance_record_history_organisation_id_fkey'
            columns: ['organisation_id']
            isOneToOne: false
            referencedRelation: 'organisations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'compliance_record_history_klo_item_id_fkey'
            columns: ['klo_item_id']
            isOneToOne: false
            referencedRelation: 'klo_items'
            referencedColumns: ['id']
          }
        ]
      }

      /** Append-only audit log of review frequency changes. */
      review_frequency_history: {
        Row: {
          id: string
          organisation_id: string
          klo_item_id: string
          old_frequency_days: number | null
          new_frequency_days: number
          changed_by: string
          changed_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          klo_item_id: string
          old_frequency_days?: number | null
          new_frequency_days: number
          changed_by: string
          changed_at?: string
        }
        Update: { id?: string } // append-only — RLS blocks actual updates
        Relationships: [
          {
            foreignKeyName: 'review_frequency_history_organisation_id_fkey'
            columns: ['organisation_id']
            isOneToOne: false
            referencedRelation: 'organisations'
            referencedColumns: ['id']
          }
        ]
      }

      /** Append-only audit log of priority changes. */
      priority_history: {
        Row: {
          id: string
          organisation_id: string
          klo_item_id: string
          old_priority: number | null
          new_priority: number
          changed_by: string
          changed_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          klo_item_id: string
          old_priority?: number | null
          new_priority: number
          changed_by: string
          changed_at?: string
        }
        Update: { id?: string } // append-only — RLS blocks actual updates
        Relationships: [
          {
            foreignKeyName: 'priority_history_organisation_id_fkey'
            columns: ['organisation_id']
            isOneToOne: false
            referencedRelation: 'organisations'
            referencedColumns: ['id']
          }
        ]
      }

      // ── Notification log ──────────────────────────────────────────────

      notification_log: {
        Row: {
          id:                string
          organisation_id:   string
          notification_type: 'due_soon' | 'overdue' | 'trial_day' | 'onboarding_week' | 'user_onboarding' | 'weekly_digest' | 'data_deletion_warning'
          entity_type:       'kloe' | 'hr_dbs' | 'hr_supervision' | 'hr_appraisal' | 'hr_training' | 'trial' | 'onboarding' | 'user' | 'governance_digest' | 'organisation'
          entity_id:         string
          due_date:          string
          recipient_email:   string
          sent_at:           string
        }
        Insert: {
          id?:               string
          organisation_id:   string
          notification_type: 'due_soon' | 'overdue' | 'trial_day' | 'onboarding_week' | 'user_onboarding' | 'weekly_digest' | 'data_deletion_warning'
          entity_type:       'kloe' | 'hr_dbs' | 'hr_supervision' | 'hr_appraisal' | 'hr_training' | 'trial' | 'onboarding' | 'user' | 'governance_digest' | 'organisation'
          entity_id:         string
          due_date:          string
          recipient_email:   string
          sent_at?:          string
        }
        Update: {
          id?:               string
          organisation_id?:  string
          notification_type?: 'due_soon' | 'overdue' | 'trial_day' | 'onboarding_week' | 'user_onboarding' | 'weekly_digest' | 'data_deletion_warning'
          entity_type?:      'kloe' | 'hr_dbs' | 'hr_supervision' | 'hr_appraisal' | 'hr_training' | 'trial' | 'onboarding' | 'user' | 'governance_digest' | 'organisation'
          entity_id?:        string
          due_date?:         string
          recipient_email?:  string
          sent_at?:          string
        }
        Relationships: [
          {
            foreignKeyName: 'notification_log_organisation_id_fkey'
            columns: ['organisation_id']
            isOneToOne: false
            referencedRelation: 'organisations'
            referencedColumns: ['id']
          }
        ]
      }

      // ── Support tickets ────────────────────────────────────────────────

      support_tickets: {
        Row: {
          id: string
          organisation_id: string | null
          submitted_by: string | null
          reference: string
          subject: string
          message: string
          status: 'open' | 'in_progress' | 'resolved'
          staff_initiated: boolean
          source: string
          external_email: string | null
          external_name: string | null
          draft_reply: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id?: string | null
          submitted_by?: string | null
          reference?: string
          subject: string
          message: string
          status?: 'open' | 'in_progress' | 'resolved'
          staff_initiated?: boolean
          source?: string
          external_email?: string | null
          external_name?: string | null
          draft_reply?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string | null
          submitted_by?: string | null
          reference?: string
          subject?: string
          message?: string
          status?: 'open' | 'in_progress' | 'resolved'
          staff_initiated?: boolean
          source?: string
          external_email?: string | null
          external_name?: string | null
          draft_reply?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'support_tickets_organisation_id_fkey'
            columns: ['organisation_id']
            isOneToOne: false
            referencedRelation: 'organisations'
            referencedColumns: ['id']
          }
        ]
      }

      support_ticket_replies: {
        Row: {
          id: string
          ticket_id: string
          sent_by: string | null
          message: string
          is_staff_reply: boolean
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          sent_by?: string | null
          message: string
          is_staff_reply?: boolean
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          sent_by?: string | null
          message?: string
          is_staff_reply?: boolean
          read_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'support_ticket_replies_ticket_id_fkey'
            columns: ['ticket_id']
            isOneToOne: false
            referencedRelation: 'support_tickets'
            referencedColumns: ['id']
          }
        ]
      }

      // ── Waitlist leads ─────────────────────────────────────────────────

      waitlist_leads: {
        Row: {
          id: string
          first_name: string
          last_name: string | null
          email: string
          marketing_opt_in: boolean
          nurture_opt_in: boolean
          nurture_emails_sent: number
          nurture_last_sent_at: string | null
          source: string
          created_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name?: string | null
          email: string
          marketing_opt_in?: boolean
          nurture_opt_in?: boolean
          nurture_emails_sent?: number
          nurture_last_sent_at?: string | null
          source?: string
          created_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string | null
          email?: string
          marketing_opt_in?: boolean
          nurture_opt_in?: boolean
          nurture_emails_sent?: number
          nurture_last_sent_at?: string | null
          source?: string
          created_at?: string
        }
        Relationships: []
      }

      // ── Blog subscribers ───────────────────────────────────────────────

      blog_subscribers: {
        Row: {
          id: string
          email: string
          full_name: string | null
          source: string
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          source?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          source?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }

      // ── People's Voice ───────────────────────────────────────────────

      i_statements: {
        Row: {
          id: string
          key_question: string
          statement_order: number
          statement_text: string
          created_at: string
        }
        Insert: {
          id?: string
          key_question: string
          statement_order: number
          statement_text: string
          created_at?: string
        }
        Update: {
          id?: string
          key_question?: string
          statement_order?: number
          statement_text?: string
          created_at?: string
        }
        Relationships: []
      }

      i_statement_evidence: {
        Row: {
          id: string
          organisation_id: string
          i_statement_id: string
          confidence: 'green' | 'amber' | 'red' | 'not_assessed'
          evidence_summary: string | null
          action_needed: string | null
          date_reviewed: string | null
          next_review_due: string | null
          last_updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          organisation_id: string
          i_statement_id: string
          confidence?: 'green' | 'amber' | 'red' | 'not_assessed'
          evidence_summary?: string | null
          action_needed?: string | null
          date_reviewed?: string | null
          next_review_due?: string | null
          last_updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          organisation_id?: string
          i_statement_id?: string
          confidence?: 'green' | 'amber' | 'red' | 'not_assessed'
          evidence_summary?: string | null
          action_needed?: string | null
          date_reviewed?: string | null
          next_review_due?: string | null
          last_updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'i_statement_evidence_organisation_id_fkey'
            columns: ['organisation_id']
            isOneToOne: false
            referencedRelation: 'organisations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'i_statement_evidence_i_statement_id_fkey'
            columns: ['i_statement_id']
            isOneToOne: false
            referencedRelation: 'i_statements'
            referencedColumns: ['id']
          }
        ]
      }

      // ── HR Module ─────────────────────────────────────────────────────

      hr_staff_profiles: {
        Row: {
          id: string
          organisation_id: string
          user_id: string
          ni_number: string | null
          job_title: string | null
          department: string | null
          employee_type: 'full_time' | 'part_time' | 'zero_hours' | 'bank' | 'agency' | 'volunteer' | null
          contracted_hours: number | null
          employment_start: string | null
          leaving_date: string | null
          employment_status: 'active' | 'inactive' | 'on_leave'
          date_of_birth: string | null
          gender: string | null
          ethnic_origin: string | null
          disability: boolean | null
          marital_status: string | null
          next_of_kin_name: string | null
          next_of_kin_phone: string | null
          dbs_review_date: string | null
          dbs_next_review_due: string | null
          dbs_frequency_days: number | null
          right_to_work_verified: boolean
          references_obtained: boolean
          supervision_review_date: string | null
          supervision_next_due: string | null
          supervision_frequency_days: number | null
          appraisal_review_date: string | null
          appraisal_next_due: string | null
          appraisal_frequency_days: number | null
          appraisal_notes: string | null
          mandatory_training_complete: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          user_id: string
          ni_number?: string | null
          job_title?: string | null
          department?: string | null
          employee_type?: 'full_time' | 'part_time' | 'zero_hours' | 'bank' | 'agency' | 'volunteer' | null
          contracted_hours?: number | null
          employment_start?: string | null
          leaving_date?: string | null
          employment_status?: 'active' | 'inactive' | 'on_leave'
          date_of_birth?: string | null
          gender?: string | null
          ethnic_origin?: string | null
          disability?: boolean | null
          marital_status?: string | null
          next_of_kin_name?: string | null
          next_of_kin_phone?: string | null
          dbs_review_date?: string | null
          dbs_next_review_due?: string | null
          dbs_frequency_days?: number | null
          right_to_work_verified?: boolean
          references_obtained?: boolean
          supervision_review_date?: string | null
          supervision_next_due?: string | null
          supervision_frequency_days?: number | null
          appraisal_review_date?: string | null
          appraisal_next_due?: string | null
          appraisal_frequency_days?: number | null
          appraisal_notes?: string | null
          mandatory_training_complete?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          user_id?: string
          ni_number?: string | null
          job_title?: string | null
          department?: string | null
          employee_type?: 'full_time' | 'part_time' | 'zero_hours' | 'bank' | 'agency' | 'volunteer' | null
          contracted_hours?: number | null
          employment_start?: string | null
          leaving_date?: string | null
          employment_status?: 'active' | 'inactive' | 'on_leave'
          date_of_birth?: string | null
          gender?: string | null
          ethnic_origin?: string | null
          disability?: boolean | null
          marital_status?: string | null
          next_of_kin_name?: string | null
          next_of_kin_phone?: string | null
          dbs_review_date?: string | null
          dbs_next_review_due?: string | null
          dbs_frequency_days?: number | null
          right_to_work_verified?: boolean
          references_obtained?: boolean
          supervision_review_date?: string | null
          supervision_next_due?: string | null
          supervision_frequency_days?: number | null
          appraisal_review_date?: string | null
          appraisal_next_due?: string | null
          appraisal_frequency_days?: number | null
          appraisal_notes?: string | null
          mandatory_training_complete?: boolean
          updated_at?: string
        }
        Relationships: []
      }

      hr_training_types: {
        Row: {
          id: string
          organisation_id: string
          name: string
          is_mandatory: boolean
          default_frequency_days: number
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          name: string
          is_mandatory?: boolean
          default_frequency_days?: number
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          name?: string
          is_mandatory?: boolean
          default_frequency_days?: number
          display_order?: number
        }
        Relationships: []
      }

      hr_training_records: {
        Row: {
          id: string
          organisation_id: string
          user_id: string
          training_type_id: string
          date_completed: string | null
          next_due: string | null
          frequency_days: number
          notes: string | null
          created_at: string
          updated_at: string
          /** NULL = manually entered; DSCR slug when pushed by an integration (e.g. 'pcs', 'nourish'). */
          integration_source: string | null
        }
        Insert: {
          id?: string
          organisation_id: string
          user_id: string
          training_type_id: string
          date_completed?: string | null
          next_due?: string | null
          frequency_days?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
          integration_source?: string | null
        }
        Update: {
          id?: string
          date_completed?: string | null
          next_due?: string | null
          frequency_days?: number
          notes?: string | null
          updated_at?: string
          integration_source?: string | null
        }
        Relationships: []
      }

      hr_training_certificates: {
        Row: {
          id: string
          organisation_id: string
          training_record_id: string
          file_name: string
          file_path: string
          file_size: number | null
          mime_type: string | null
          scan_status: 'pending' | 'clean' | 'infected' | 'error'
          uploaded_by: string | null
          uploaded_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          training_record_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          mime_type?: string | null
          scan_status?: 'pending' | 'clean' | 'infected' | 'error'
          uploaded_by?: string | null
          uploaded_at?: string
        }
        Update: {
          scan_status?: 'pending' | 'clean' | 'infected' | 'error'
        }
        Relationships: []
      }

      hr_absence_records: {
        Row: {
          id: string
          organisation_id: string
          user_id: string
          absence_type: 'sick' | 'other'
          start_date: string
          end_date: string | null
          absence_days: number | null
          reason_category: 'Musculoskeletal' | 'Respiratory / Cold / Flu' | 'Mental health / Stress / Anxiety' | 'Gastrointestinal' | 'Injury' | 'Other' | null
          notes: string | null
          rtw_interview_completed: boolean
          rtw_interview_date: string | null
          rtw_notes: string | null
          recorded_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          user_id: string
          absence_type?: 'sick' | 'other'
          start_date: string
          end_date?: string | null
          absence_days?: number | null
          reason_category?: 'Musculoskeletal' | 'Respiratory / Cold / Flu' | 'Mental health / Stress / Anxiety' | 'Gastrointestinal' | 'Injury' | 'Other' | null
          notes?: string | null
          rtw_interview_completed?: boolean
          rtw_interview_date?: string | null
          rtw_notes?: string | null
          recorded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          absence_type?: 'sick' | 'other'
          start_date?: string
          end_date?: string | null
          absence_days?: number | null
          reason_category?: 'Musculoskeletal' | 'Respiratory / Cold / Flu' | 'Mental health / Stress / Anxiety' | 'Gastrointestinal' | 'Injury' | 'Other' | null
          notes?: string | null
          rtw_interview_completed?: boolean
          rtw_interview_date?: string | null
          rtw_notes?: string | null
          recorded_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }

      hr_holiday_allowances: {
        Row: {
          id: string
          organisation_id: string
          user_id: string
          leave_year_start: string
          total_allowance: number
          taken: number
          carry_over: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          user_id: string
          leave_year_start: string
          total_allowance: number
          taken?: number
          carry_over?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          total_allowance?: number
          taken?: number
          carry_over?: number
          updated_at?: string
        }
        Relationships: []
      }

      mock_inspections: {
        Row: {
          id: string
          organisation_id: string
          type: 'full' | 'partial'
          status: 'in_progress' | 'completed'
          key_question_id: string | null
          conducted_by: string
          started_at: string
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          type: 'full' | 'partial'
          status?: 'in_progress' | 'completed'
          key_question_id?: string | null
          conducted_by: string
          started_at?: string
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          type?: 'full' | 'partial'
          status?: 'in_progress' | 'completed'
          key_question_id?: string | null
          conducted_by?: string
          started_at?: string
          completed_at?: string | null
          created_at?: string
        }
        Relationships: []
      }

      mock_inspection_findings: {
        Row: {
          id: string
          mock_inspection_id: string
          klo_item_id: string
          rating: 'outstanding' | 'good' | 'requires_improvement' | 'inadequate'
          notes: string | null
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          mock_inspection_id: string
          klo_item_id: string
          rating: 'outstanding' | 'good' | 'requires_improvement' | 'inadequate'
          notes?: string | null
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          mock_inspection_id?: string
          klo_item_id?: string
          rating?: 'outstanding' | 'good' | 'requires_improvement' | 'inadequate'
          notes?: string | null
          updated_at?: string
          created_at?: string
        }
        Relationships: []
      }

      mock_inspection_checklist_responses: {
        Row: {
          id: string
          mock_inspection_id: string
          checklist_item_id: string
          response: 'met' | 'partial' | 'not_met'
          note: string | null
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          mock_inspection_id: string
          checklist_item_id: string
          response: 'met' | 'partial' | 'not_met'
          note?: string | null
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          mock_inspection_id?: string
          checklist_item_id?: string
          response?: 'met' | 'partial' | 'not_met'
          note?: string | null
          updated_at?: string
          created_at?: string
        }
        Relationships: []
      }

      newsletter_generations: {
        Row: {
          id: string
          organisation_id: string
          generated_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          generated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          generated_at?: string
        }
        Relationships: []
      }

      // ── Action Items ──────────────────────────────────────────────────

      action_items: {
        Row: {
          id: string
          organisation_id: string
          klo_item_id: string
          title: string
          description: string | null
          due_date: string | null
          priority: 'high' | 'medium' | 'low'
          status: 'open' | 'in_progress' | 'completed'
          assigned_to: string | null
          completion_notes: string | null
          completed_at: string | null
          completed_by: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          klo_item_id: string
          title: string
          description?: string | null
          due_date?: string | null
          priority?: 'high' | 'medium' | 'low'
          status?: 'open' | 'in_progress' | 'completed'
          assigned_to?: string | null
          completion_notes?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          klo_item_id?: string
          title?: string
          description?: string | null
          due_date?: string | null
          priority?: 'high' | 'medium' | 'low'
          status?: 'open' | 'in_progress' | 'completed'
          assigned_to?: string | null
          completion_notes?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // ── Incidents ─────────────────────────────────────────────────────

      incidents: {
        Row: {
          id: string
          organisation_id: string
          title: string
          incident_type: 'safety' | 'safeguarding' | 'near_miss' | 'complaint' | 'other'
          date_of_incident: string
          description: string
          immediate_action: string | null
          people_involved: string | null
          reported_externally: boolean
          external_ref: string | null
          status: 'open' | 'under_review' | 'closed'
          learning_outcome: string | null
          reported_by: string | null
          closed_by: string | null
          closed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          title: string
          incident_type: 'safety' | 'safeguarding' | 'near_miss' | 'complaint' | 'other'
          date_of_incident: string
          description: string
          immediate_action?: string | null
          people_involved?: string | null
          reported_externally?: boolean
          external_ref?: string | null
          status?: 'open' | 'under_review' | 'closed'
          learning_outcome?: string | null
          reported_by?: string | null
          closed_by?: string | null
          closed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          title?: string
          incident_type?: 'safety' | 'safeguarding' | 'near_miss' | 'complaint' | 'other'
          date_of_incident?: string
          description?: string
          immediate_action?: string | null
          people_involved?: string | null
          reported_externally?: boolean
          external_ref?: string | null
          status?: 'open' | 'under_review' | 'closed'
          learning_outcome?: string | null
          reported_by?: string | null
          closed_by?: string | null
          closed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // ── Governance Meetings ───────────────────────────────────────────

      governance_meetings: {
        Row: {
          id: string
          organisation_id: string
          title: string
          meeting_date: string
          attendees: string | null
          agenda: string | null
          key_decisions: string | null
          actions_arising: string | null
          status: 'draft' | 'signed_off'
          signed_off_by: string | null
          signed_off_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          title: string
          meeting_date: string
          attendees?: string | null
          agenda?: string | null
          key_decisions?: string | null
          actions_arising?: string | null
          status?: 'draft' | 'signed_off'
          signed_off_by?: string | null
          signed_off_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          title?: string
          meeting_date?: string
          attendees?: string | null
          agenda?: string | null
          key_decisions?: string | null
          actions_arising?: string | null
          status?: 'draft' | 'signed_off'
          signed_off_by?: string | null
          signed_off_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // ── Feedback Records ──────────────────────────────────────────────

      feedback_records: {
        Row: {
          id: string
          organisation_id: string
          feedback_type: 'complaint' | 'compliment' | 'suggestion' | 'concern'
          received_date: string
          source: 'person_using_service' | 'family_or_carer' | 'professional' | 'anonymous' | 'other'
          source_detail: string | null
          summary: string
          action_taken: string | null
          outcome: string | null
          status: 'open' | 'actioned' | 'closed'
          related_key_question: string | null
          reported_to_cqc: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          feedback_type: 'complaint' | 'compliment' | 'suggestion' | 'concern'
          received_date: string
          source: 'person_using_service' | 'family_or_carer' | 'professional' | 'anonymous' | 'other'
          source_detail?: string | null
          summary: string
          action_taken?: string | null
          outcome?: string | null
          status?: 'open' | 'actioned' | 'closed'
          related_key_question?: string | null
          reported_to_cqc?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          feedback_type?: 'complaint' | 'compliment' | 'suggestion' | 'concern'
          received_date?: string
          source?: 'person_using_service' | 'family_or_carer' | 'professional' | 'anonymous' | 'other'
          source_detail?: string | null
          summary?: string
          action_taken?: string | null
          outcome?: string | null
          status?: 'open' | 'actioned' | 'closed'
          related_key_question?: string | null
          reported_to_cqc?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // ── Post-Inspection Reviews ───────────────────────────────────────

      post_inspection_reviews: {
        Row: {
          id: string
          organisation_id: string
          inspection_date: string
          draft_received_date: string | null
          final_report_date: string | null
          overall_rating: 'outstanding' | 'good' | 'requires_improvement' | 'inadequate' | 'not_rated'
          safe_rating: 'outstanding' | 'good' | 'requires_improvement' | 'inadequate' | 'not_rated'
          effective_rating: 'outstanding' | 'good' | 'requires_improvement' | 'inadequate' | 'not_rated'
          caring_rating: 'outstanding' | 'good' | 'requires_improvement' | 'inadequate' | 'not_rated'
          responsive_rating: 'outstanding' | 'good' | 'requires_improvement' | 'inadequate' | 'not_rated'
          well_led_rating: 'outstanding' | 'good' | 'requires_improvement' | 'inadequate' | 'not_rated'
          inspector_name: string | null
          key_findings: string | null
          staff_briefing: string | null
          status: 'draft_received' | 'fac_submitted' | 'final_report' | 'action_plan_active' | 'closed'
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          inspection_date: string
          draft_received_date?: string | null
          final_report_date?: string | null
          overall_rating?: 'outstanding' | 'good' | 'requires_improvement' | 'inadequate' | 'not_rated'
          safe_rating?: 'outstanding' | 'good' | 'requires_improvement' | 'inadequate' | 'not_rated'
          effective_rating?: 'outstanding' | 'good' | 'requires_improvement' | 'inadequate' | 'not_rated'
          caring_rating?: 'outstanding' | 'good' | 'requires_improvement' | 'inadequate' | 'not_rated'
          responsive_rating?: 'outstanding' | 'good' | 'requires_improvement' | 'inadequate' | 'not_rated'
          well_led_rating?: 'outstanding' | 'good' | 'requires_improvement' | 'inadequate' | 'not_rated'
          inspector_name?: string | null
          key_findings?: string | null
          staff_briefing?: string | null
          status?: 'draft_received' | 'fac_submitted' | 'final_report' | 'action_plan_active' | 'closed'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          inspection_date?: string
          draft_received_date?: string | null
          final_report_date?: string | null
          overall_rating?: 'outstanding' | 'good' | 'requires_improvement' | 'inadequate' | 'not_rated'
          safe_rating?: 'outstanding' | 'good' | 'requires_improvement' | 'inadequate' | 'not_rated'
          effective_rating?: 'outstanding' | 'good' | 'requires_improvement' | 'inadequate' | 'not_rated'
          caring_rating?: 'outstanding' | 'good' | 'requires_improvement' | 'inadequate' | 'not_rated'
          responsive_rating?: 'outstanding' | 'good' | 'requires_improvement' | 'inadequate' | 'not_rated'
          well_led_rating?: 'outstanding' | 'good' | 'requires_improvement' | 'inadequate' | 'not_rated'
          inspector_name?: string | null
          key_findings?: string | null
          staff_briefing?: string | null
          status?: 'draft_received' | 'fac_submitted' | 'final_report' | 'action_plan_active' | 'closed'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      fac_items: {
        Row: {
          id: string
          organisation_id: string
          review_id: string
          key_question: 'Safe' | 'Effective' | 'Caring' | 'Responsive' | 'Well-led'
          inspector_finding: string
          dispute_type: 'factual_error' | 'subjective_judgment'
          our_position: string
          evidence_reference: string | null
          status: 'pending' | 'submitted' | 'upheld' | 'rejected'
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          review_id: string
          key_question: 'Safe' | 'Effective' | 'Caring' | 'Responsive' | 'Well-led'
          inspector_finding: string
          dispute_type: 'factual_error' | 'subjective_judgment'
          our_position: string
          evidence_reference?: string | null
          status?: 'pending' | 'submitted' | 'upheld' | 'rejected'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          review_id?: string
          key_question?: 'Safe' | 'Effective' | 'Caring' | 'Responsive' | 'Well-led'
          inspector_finding?: string
          dispute_type?: 'factual_error' | 'subjective_judgment'
          our_position?: string
          evidence_reference?: string | null
          status?: 'pending' | 'submitted' | 'upheld' | 'rejected'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // ── I Statement Evidence History ──────────────────────────────────

      i_statement_evidence_history: {
        Row: {
          id: string
          organisation_id: string
          i_statement_id: string
          confidence: string
          evidence_summary: string | null
          action_needed: string | null
          recorded_by: string | null
          recorded_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          i_statement_id: string
          confidence: string
          evidence_summary?: string | null
          action_needed?: string | null
          recorded_by?: string | null
          recorded_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          i_statement_id?: string
          confidence?: string
          evidence_summary?: string | null
          action_needed?: string | null
          recorded_by?: string | null
          recorded_at?: string
        }
        Relationships: []
      }

      // ── I Statement Actions ───────────────────────────────────────────

      i_statement_actions: {
        Row: {
          id: string
          organisation_id: string
          i_statement_id: string
          title: string
          description: string | null
          due_date: string | null
          priority: 'high' | 'medium' | 'low'
          status: 'open' | 'in_progress' | 'completed'
          assigned_to: string | null
          completion_notes: string | null
          completed_at: string | null
          completed_by: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          i_statement_id: string
          title: string
          description?: string | null
          due_date?: string | null
          priority?: 'high' | 'medium' | 'low'
          status?: 'open' | 'in_progress' | 'completed'
          assigned_to?: string | null
          completion_notes?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          i_statement_id?: string
          title?: string
          description?: string | null
          due_date?: string | null
          priority?: 'high' | 'medium' | 'low'
          status?: 'open' | 'in_progress' | 'completed'
          assigned_to?: string | null
          completion_notes?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      saved_report_views: {
        Row: {
          id:         string
          org_id:     string | null
          name:       string
          config:     Record<string, unknown>
          is_system:  boolean
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?:        string
          org_id?:    string | null
          name:       string
          config?:    Record<string, unknown>
          is_system?: boolean
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?:        string
          org_id?:    string | null
          name?:      string
          config?:    Record<string, unknown>
          is_system?: boolean
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }

      report_snapshots: {
        Row: {
          id:              string
          organisation_id: string
          view_key:        string
          green:           number
          amber:           number
          red:             number
          grey:            number
          total:           number
          open_actions:    number
          overdue_actions: number
          captured_date:   string
          captured_at:     string
        }
        Insert: {
          id?:              string
          organisation_id:  string
          view_key:         string
          green?:           number
          amber?:           number
          red?:             number
          grey?:            number
          total?:           number
          open_actions?:    number
          overdue_actions?: number
          captured_date?:   string
          captured_at?:     string
        }
        Update: {
          id?:              string
          organisation_id?: string
          view_key?:        string
          green?:           number
          amber?:           number
          red?:             number
          grey?:            number
          total?:           number
          open_actions?:    number
          overdue_actions?: number
          captured_date?:   string
          captured_at?:     string
        }
        Relationships: []
      }

    }
    Views: Record<string, never>
    Functions: {
      get_user_org_id: {
        Args: Record<string, never>
        Returns: string
      }
      get_user_role: {
        Args: Record<string, never>
        Returns: string
      }
      seed_default_training_types: {
        Args: { p_organisation_id: string }
        Returns: void
      }
    }
    Enums: Record<string, never>
  }
}

// ─────────────────────────────────────────────
// Convenience row types (use these in components)
// ─────────────────────────────────────────────
export type KeyQuestion             = Database['public']['Tables']['key_questions']['Row']
export type ServiceType             = Database['public']['Tables']['service_types']['Row']
export type Organisation            = Database['public']['Tables']['organisations']['Row']
export type User                    = Database['public']['Tables']['users']['Row']
export type KloItem                 = Database['public']['Tables']['klo_items']['Row']
export type ComplianceRecord        = Database['public']['Tables']['compliance_records']['Row']
export type ComplianceRecordHistory = Database['public']['Tables']['compliance_record_history']['Row']
export type ReviewFrequencyHistory  = Database['public']['Tables']['review_frequency_history']['Row']
export type PriorityHistory         = Database['public']['Tables']['priority_history']['Row']

export type UserRole         = User['role']
export type ComplianceStatus = ComplianceRecord['status']
export type OrganisationSubService = Database['public']['Tables']['organisation_sub_services']['Row']
export type KloChecklistItem       = Database['public']['Tables']['klo_checklist_items']['Row']
export type KloChecklistCompletion = Database['public']['Tables']['klo_checklist_completions']['Row']
export type SupportTicket          = Database['public']['Tables']['support_tickets']['Row']
export type SupportTicketReply     = Database['public']['Tables']['support_ticket_replies']['Row']
export type SubscriptionTier       = Organisation['subscription_tier']
export type KloeEvidence           = Database['public']['Tables']['kloe_evidence']['Row']
export type HrStaffProfile         = Database['public']['Tables']['hr_staff_profiles']['Row']
export type HrTrainingType         = Database['public']['Tables']['hr_training_types']['Row']
export type HrTrainingRecord       = Database['public']['Tables']['hr_training_records']['Row']
export type HrTrainingCertificate  = Database['public']['Tables']['hr_training_certificates']['Row']
export type HrHolidayAllowance     = Database['public']['Tables']['hr_holiday_allowances']['Row']
export type HrAbsenceRecord        = Database['public']['Tables']['hr_absence_records']['Row']
export type HolidayUnit            = Organisation['holiday_unit']
export type IStatement             = Database['public']['Tables']['i_statements']['Row']
export type IStatementEvidence     = Database['public']['Tables']['i_statement_evidence']['Row']
export type IStatementConfidence   = IStatementEvidence['confidence']

// ── Mock Inspections ──────────────────────────────────────────────────────────
export type MockInspectionType   = 'full' | 'partial'
export type MockInspectionStatus = 'in_progress' | 'completed'
export type MockInspectionRating = 'outstanding' | 'good' | 'requires_improvement' | 'inadequate'
export type MockChecklistResponse = 'met' | 'partial' | 'not_met'

export interface MockInspection {
  id: string
  organisation_id: string
  type: MockInspectionType
  key_question_id: string | null
  status: MockInspectionStatus
  conducted_by: string | null
  started_at: string
  completed_at: string | null
  created_at: string
}

export interface MockInspectionFinding {
  id: string
  mock_inspection_id: string
  klo_item_id: string
  rating: MockInspectionRating
  notes: string | null
  created_at: string
  updated_at: string
}

export type NotificationLog         = Database['public']['Tables']['notification_log']['Row']
export type ActionItem              = Database['public']['Tables']['action_items']['Row']
export type Incident                = Database['public']['Tables']['incidents']['Row']
export type GovernanceMeeting       = Database['public']['Tables']['governance_meetings']['Row']
export type FeedbackRecord          = Database['public']['Tables']['feedback_records']['Row']
export type PostInspectionReview    = Database['public']['Tables']['post_inspection_reviews']['Row']
export type FacItem                 = Database['public']['Tables']['fac_items']['Row']
export type IStatementEvidenceHistory = Database['public']['Tables']['i_statement_evidence_history']['Row']
export type IStatementAction          = Database['public']['Tables']['i_statement_actions']['Row']
export type ReportSnapshot            = Database['public']['Tables']['report_snapshots']['Row']
export type IStatementActionPriority  = IStatementAction['priority']
export type IStatementActionStatus    = IStatementAction['status']

export type ActionItemPriority      = ActionItem['priority']
export type ActionItemStatus        = ActionItem['status']
export type IncidentType            = Incident['incident_type']
export type IncidentStatus          = Incident['status']
export type GovernanceMeetingStatus = GovernanceMeeting['status']
export type FeedbackType            = FeedbackRecord['feedback_type']
export type FeedbackSource          = FeedbackRecord['source']
export type FeedbackStatus          = FeedbackRecord['status']
export type PostInspectionStatus    = PostInspectionReview['status']
export type InspectionRating        = PostInspectionReview['overall_rating']
export type FacItemStatus           = FacItem['status']
export type FacDisputeType          = FacItem['dispute_type']

export interface MockInspectionChecklistResponse {
  id: string
  mock_inspection_id: string
  checklist_item_id: string
  response: MockChecklistResponse
  note: string | null
  created_at: string
  updated_at: string
}

// ── Report views ──────────────────────────────────────────────────────────────

export interface ReportViewConfig {
  selectedKQs:      string[] | 'all'   // key question names, or 'all'
  showKloes:        boolean
  showActions:      boolean
  showHr:           boolean
  showAnnualReview: boolean
  actionStatus:     'all' | 'open' | 'in_progress' | 'completed'
}

export interface SavedReportView {
  id:         string
  org_id:     string | null
  name:       string
  config:     ReportViewConfig
  is_system:  boolean
  created_by: string | null
  created_at: string
}

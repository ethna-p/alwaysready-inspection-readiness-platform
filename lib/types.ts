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
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          display_order: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_order?: number
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
          cqc_location_id: string | null
          service_type_id: string
          subscription_tier: 'trial' | 'starter' | 'pro'
          is_demo: boolean
          demo_expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          cqc_location_id?: string | null
          service_type_id: string
          subscription_tier?: 'trial' | 'starter' | 'pro'
          is_demo?: boolean
          demo_expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          cqc_location_id?: string | null
          service_type_id?: string
          subscription_tier?: 'trial' | 'starter' | 'pro'
          is_demo?: boolean
          demo_expires_at?: string | null
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

      users: {
        Row: {
          id: string
          organisation_id: string
          email: string
          role: 'admin' | 'user' | 'viewer'
          viewer_expires_at: string | null
          created_at: string
        }
        Insert: {
          id: string
          organisation_id: string
          email: string
          role?: 'admin' | 'user' | 'viewer'
          viewer_expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          email?: string
          role?: 'admin' | 'user' | 'viewer'
          viewer_expires_at?: string | null
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
      create_demo_session: {
        Args: { p_user_id: string }
        Returns: string   // returns the new org_id (UUID)
      }
      cleanup_expired_demo_orgs: {
        Args: Record<string, never>
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

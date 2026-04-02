export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      deal_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          deal_id: string
          id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          deal_id: string
          id?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          deal_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_comments_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_votes: {
        Row: {
          created_at: string
          deal_id: string
          id: string
          user_id: string
          vote: Database["public"]["Enums"]["deal_vote_type"]
        }
        Insert: {
          created_at?: string
          deal_id: string
          id?: string
          user_id: string
          vote: Database["public"]["Enums"]["deal_vote_type"]
        }
        Update: {
          created_at?: string
          deal_id?: string
          id?: string
          user_id?: string
          vote?: Database["public"]["Enums"]["deal_vote_type"]
        }
        Relationships: [
          {
            foreignKeyName: "deal_votes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          created_at: string
          description: string
          expected_return: string | null
          id: string
          investment_required: number
          risk_factors: string | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          status: Database["public"]["Enums"]["deal_status"]
          submitted_by: string
          supporting_docs: string | null
          title: string
          updated_at: string
          vote_deadline: string | null
        }
        Insert: {
          created_at?: string
          description: string
          expected_return?: string | null
          id?: string
          investment_required?: number
          risk_factors?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          status?: Database["public"]["Enums"]["deal_status"]
          submitted_by: string
          supporting_docs?: string | null
          title: string
          updated_at?: string
          vote_deadline?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          expected_return?: string | null
          id?: string
          investment_required?: number
          risk_factors?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          status?: Database["public"]["Enums"]["deal_status"]
          submitted_by?: string
          supporting_docs?: string | null
          title?: string
          updated_at?: string
          vote_deadline?: string | null
        }
        Relationships: []
      }
      disclaimer_acceptances: {
        Row: {
          accepted_at: string
          full_name: string
          id: string
          ip_address: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          full_name: string
          id?: string
          ip_address?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          full_name?: string
          id?: string
          ip_address?: string | null
          user_id?: string
        }
        Relationships: []
      }
      document_acknowledgments: {
        Row: {
          acknowledged_at: string
          document_id: string
          id: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string
          document_id: string
          id?: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string
          document_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_acknowledgments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "startup_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_notes: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          meeting_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          meeting_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          meeting_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_notes_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          agenda: string | null
          created_at: string
          created_by: string
          id: string
          location: string | null
          meeting_date: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          agenda?: string | null
          created_at?: string
          created_by: string
          id?: string
          location?: string | null
          meeting_date: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          agenda?: string | null
          created_at?: string
          created_by?: string
          id?: string
          location?: string | null
          meeting_date?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      member_contributions: {
        Row: {
          amount: number
          contribution_date: string
          created_at: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          amount: number
          contribution_date?: string
          created_at?: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          contribution_date?: string
          created_at?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profile_startup_links: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          startup_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          startup_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          startup_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_startup_links_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_startup_links_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string
          email: string | null
          facebook: string | null
          full_name: string | null
          id: string
          instagram: string | null
          linkedin: string | null
          phone: string | null
          photo_url: string | null
          twitter: string | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          email?: string | null
          facebook?: string | null
          full_name?: string | null
          id: string
          instagram?: string | null
          linkedin?: string | null
          phone?: string | null
          photo_url?: string | null
          twitter?: string | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          email?: string | null
          facebook?: string | null
          full_name?: string | null
          id?: string
          instagram?: string | null
          linkedin?: string | null
          phone?: string | null
          photo_url?: string | null
          twitter?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      startup_documents: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          document_type: string
          file_url: string | null
          id: string
          startup_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          document_type?: string
          file_url?: string | null
          id?: string
          startup_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          document_type?: string
          file_url?: string | null
          id?: string
          startup_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "startup_documents_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      startup_info_requests: {
        Row: {
          created_at: string
          id: string
          startup_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          startup_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          startup_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "startup_info_requests_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      startup_investors: {
        Row: {
          amount_invested: number
          archived: boolean
          created_at: string
          email: string | null
          equity_percentage: number
          id: string
          investment_date: string
          investor_name: string
          notes: string | null
          startup_id: string
          updated_at: string
        }
        Insert: {
          amount_invested: number
          archived?: boolean
          created_at?: string
          email?: string | null
          equity_percentage: number
          id?: string
          investment_date?: string
          investor_name: string
          notes?: string | null
          startup_id: string
          updated_at?: string
        }
        Update: {
          amount_invested?: number
          archived?: boolean
          created_at?: string
          email?: string | null
          equity_percentage?: number
          id?: string
          investment_date?: string
          investor_name?: string
          notes?: string | null
          startup_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "startup_investors_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      startup_revenue: {
        Row: {
          created_at: string
          entry_date: string
          gross_sales: number
          id: string
          notes: string | null
          profit: number
          profit_margin: number
          startup_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          entry_date: string
          gross_sales?: number
          id?: string
          notes?: string | null
          profit?: number
          profit_margin?: number
          startup_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          entry_date?: string
          gross_sales?: number
          id?: string
          notes?: string | null
          profit?: number
          profit_margin?: number
          startup_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "startup_revenue_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      startups: {
        Row: {
          created_at: string
          current_value: number
          description: string | null
          founded: string | null
          funding_goal: number
          id: string
          invested: number
          name: string
          progress: number
          sector: string
          stage: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_value?: number
          description?: string | null
          founded?: string | null
          funding_goal?: number
          id?: string
          invested: number
          name: string
          progress?: number
          sector: string
          stage: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_value?: number
          description?: string | null
          founded?: string | null
          funding_goal?: number
          id?: string
          invested?: number
          name?: string
          progress?: number
          sector?: string
          stage?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      deal_status: "pending" | "approved" | "rejected"
      deal_vote_type: "approve" | "decline"
      risk_level: "low" | "medium" | "high" | "very_high"
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
      app_role: ["admin", "moderator", "user"],
      deal_status: ["pending", "approved", "rejected"],
      deal_vote_type: ["approve", "decline"],
      risk_level: ["low", "medium", "high", "very_high"],
    },
  },
} as const

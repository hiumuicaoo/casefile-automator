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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cases: {
        Row: {
          cap_bac_lanh_dao: string
          chuc_vu_lanh_dao: string
          co_quan_trung_cau: string
          co_quan_trung_cau_khac: string | null
          created_at: string
          folder_path: string | null
          giam_dinh_vien: Json
          ho_ten_lanh_dao: string
          id: string
          linh_vuc: string
          ngay_bat_dau: string
          ngay_bat_dau_la_ngay_mo: boolean
          ngay_ket_thuc: string
          ngay_nhan: string
          ngay_nhan_la_ngay_mo: boolean
          nhap_phan_mem: string
          nop_luu: string
          quyet_dinh_lap_so: number
          quyet_dinh_trung_cau: string
          scan: string
          so_dang_ky_a: number
          so_dang_ky_full: string
          so_hoa: string
          so_luu: string | null
          tinh_trang_giao: string
          trich_yeu: string
          tro_ly: Json
          updated_at: string
          vu_so_full: string
          vu_so_x: number
          vu_so_yy: string
        }
        Insert: {
          cap_bac_lanh_dao: string
          chuc_vu_lanh_dao: string
          co_quan_trung_cau: string
          co_quan_trung_cau_khac?: string | null
          created_at?: string
          folder_path?: string | null
          giam_dinh_vien?: Json
          ho_ten_lanh_dao: string
          id?: string
          linh_vuc: string
          ngay_bat_dau: string
          ngay_bat_dau_la_ngay_mo?: boolean
          ngay_ket_thuc: string
          ngay_nhan: string
          ngay_nhan_la_ngay_mo?: boolean
          nhap_phan_mem?: string
          nop_luu?: string
          quyet_dinh_lap_so: number
          quyet_dinh_trung_cau: string
          scan?: string
          so_dang_ky_a: number
          so_dang_ky_full: string
          so_hoa?: string
          so_luu?: string | null
          tinh_trang_giao?: string
          trich_yeu: string
          tro_ly?: Json
          updated_at?: string
          vu_so_full: string
          vu_so_x: number
          vu_so_yy: string
        }
        Update: {
          cap_bac_lanh_dao?: string
          chuc_vu_lanh_dao?: string
          co_quan_trung_cau?: string
          co_quan_trung_cau_khac?: string | null
          created_at?: string
          folder_path?: string | null
          giam_dinh_vien?: Json
          ho_ten_lanh_dao?: string
          id?: string
          linh_vuc?: string
          ngay_bat_dau?: string
          ngay_bat_dau_la_ngay_mo?: boolean
          ngay_ket_thuc?: string
          ngay_nhan?: string
          ngay_nhan_la_ngay_mo?: boolean
          nhap_phan_mem?: string
          nop_luu?: string
          quyet_dinh_lap_so?: number
          quyet_dinh_trung_cau?: string
          scan?: string
          so_dang_ky_a?: number
          so_dang_ky_full?: string
          so_hoa?: string
          so_luu?: string | null
          tinh_trang_giao?: string
          trich_yeu?: string
          tro_ly?: Json
          updated_at?: string
          vu_so_full?: string
          vu_so_x?: number
          vu_so_yy?: string
        }
        Relationships: []
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
    Enums: {},
  },
} as const

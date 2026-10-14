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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      actividades: {
        Row: {
          actualizado_en: string
          codigo_referencia: string
          creado_en: string
          descripcion: string | null
          estado_reporte: string
          fecha_operacion: string
          id: string
          responsable_id: string | null
          responsable_nombre: string
          tipo_actividad: string
          ubicacion: string
        }
        Insert: {
          actualizado_en?: string
          codigo_referencia: string
          creado_en?: string
          descripcion?: string | null
          estado_reporte?: string
          fecha_operacion: string
          id?: string
          responsable_id?: string | null
          responsable_nombre: string
          tipo_actividad: string
          ubicacion: string
        }
        Update: {
          actualizado_en?: string
          codigo_referencia?: string
          creado_en?: string
          descripcion?: string | null
          estado_reporte?: string
          fecha_operacion?: string
          id?: string
          responsable_id?: string | null
          responsable_nombre?: string
          tipo_actividad?: string
          ubicacion?: string
        }
        Relationships: []
      }
      auditoria: {
        Row: {
          creado_en: string
          entidad_id: string
          id: number
          operacion: string
          payload_anterior: Json | null
          payload_nuevo: Json | null
          tabla: string
          usuario_email: string | null
          usuario_id: string | null
        }
        Insert: {
          creado_en?: string
          entidad_id: string
          id?: never
          operacion: string
          payload_anterior?: Json | null
          payload_nuevo?: Json | null
          tabla: string
          usuario_email?: string | null
          usuario_id?: string | null
        }
        Update: {
          creado_en?: string
          entidad_id?: string
          id?: never
          operacion?: string
          payload_anterior?: Json | null
          payload_nuevo?: Json | null
          tabla?: string
          usuario_email?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      evidencias: {
        Row: {
          estado: string
          fecha_captura: string | null
          fecha_ingesta: string
          hash_sha256: string
          id: string
          metadatos_json: Json | null
          mime_type: string
          nombre_archivo: string
          ruta_storage: string
          ruta_thumb: string | null
          subido_por: string | null
          tamano_bytes: number
        }
        Insert: {
          estado?: string
          fecha_captura?: string | null
          fecha_ingesta?: string
          hash_sha256: string
          id?: string
          metadatos_json?: Json | null
          mime_type: string
          nombre_archivo: string
          ruta_storage: string
          ruta_thumb?: string | null
          subido_por?: string | null
          tamano_bytes: number
        }
        Update: {
          estado?: string
          fecha_captura?: string | null
          fecha_ingesta?: string
          hash_sha256?: string
          id?: string
          metadatos_json?: Json | null
          mime_type?: string
          nombre_archivo?: string
          ruta_storage?: string
          ruta_thumb?: string | null
          subido_por?: string | null
          tamano_bytes?: number
        }
        Relationships: []
      }
      identificaciones: {
        Row: {
          apellido_materno: string
          apellido_paterno: string
          cargo: string | null
          confirmado_en: string
          confirmado_por: string | null
          confirmador_email: string | null
          evidencia_id: string
          nivel_confianza: number | null
          nombres: string
          texto_crudo_ocr: string | null
        }
        Insert: {
          apellido_materno: string
          apellido_paterno: string
          cargo?: string | null
          confirmado_en?: string
          confirmado_por?: string | null
          confirmador_email?: string | null
          evidencia_id: string
          nivel_confianza?: number | null
          nombres: string
          texto_crudo_ocr?: string | null
        }
        Update: {
          apellido_materno?: string
          apellido_paterno?: string
          cargo?: string | null
          confirmado_en?: string
          confirmado_por?: string | null
          confirmador_email?: string | null
          evidencia_id?: string
          nivel_confianza?: number | null
          nombres?: string
          texto_crudo_ocr?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "identificaciones_evidencia_id_fkey"
            columns: ["evidencia_id"]
            isOneToOne: true
            referencedRelation: "evidencias"
            referencedColumns: ["id"]
          },
        ]
      }
      vinculos: {
        Row: {
          actividad_id: string
          evidencia_id: string
          notas: string | null
          vinculado_en: string
          vinculado_por: string | null
        }
        Insert: {
          actividad_id: string
          evidencia_id: string
          notas?: string | null
          vinculado_en?: string
          vinculado_por?: string | null
        }
        Update: {
          actividad_id?: string
          evidencia_id?: string
          notas?: string | null
          vinculado_en?: string
          vinculado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vinculos_actividad_id_fkey"
            columns: ["actividad_id"]
            isOneToOne: false
            referencedRelation: "actividades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vinculos_evidencia_id_fkey"
            columns: ["evidencia_id"]
            isOneToOne: true
            referencedRelation: "evidencias"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      vincular_evidencia_atomica:
        | {
            Args: {
              p_actividad_id: string
              p_evidencia_id: string
              p_notas?: string
            }
            Returns: boolean
          }
        | {
            Args: {
              p_actividad_id: string
              p_evidencia_id: string
              p_notas?: string
              p_revisor: string
            }
            Returns: boolean
          }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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

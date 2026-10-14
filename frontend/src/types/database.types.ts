export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      perfiles: {
        Row: {
          id: string
          nombres_completos: string
          cargo: string
          rol: 'inspector' | 'supervisor' | 'administrador'
          telefono: string | null
          creado_en: string
          actualizado_en: string
        }
        Insert: {
          id: string
          nombres_completos: string
          cargo?: string
          rol?: 'inspector' | 'supervisor' | 'administrador'
          telefono?: string | null
          creado_en?: string
          actualizado_en?: string
        }
        Update: {
          id?: string
          nombres_completos?: string
          cargo?: string
          rol?: 'inspector' | 'supervisor' | 'administrador'
          telefono?: string | null
          creado_en?: string
          actualizado_en?: string
        }
        Relationships: []
      }
      actividades: {
        Row: {
          id: string
          codigo_referencia: string
          tipo_actividad: 'INSPECCION' | 'CAPACITACION' | 'AUDITORIA' | 'AMONESTACION'
          fecha_operacion: string
          responsable_id: string | null
          responsable_nombre: string
          ubicacion: string
          descripcion: string | null
          estado_reporte: 'pendiente' | 'exportada' | 'publicada'
          datos_formato_json: Json | null
          creado_en: string
          actualizado_en: string
        }
        Insert: {
          id?: string
          codigo_referencia: string
          tipo_actividad: 'INSPECCION' | 'CAPACITACION' | 'AUDITORIA' | 'AMONESTACION'
          fecha_operacion: string
          responsable_id?: string | null
          responsable_nombre: string
          ubicacion: string
          descripcion?: string | null
          estado_reporte?: 'pendiente' | 'exportada' | 'publicada'
          datos_formato_json?: Json | null
          creado_en?: string
          actualizado_en?: string
        }
        Update: {
          id?: string
          codigo_referencia?: string
          tipo_actividad?: 'INSPECCION' | 'CAPACITACION' | 'AUDITORIA' | 'AMONESTACION'
          fecha_operacion?: string
          responsable_id?: string | null
          responsable_nombre?: string
          ubicacion?: string
          descripcion?: string | null
          estado_reporte?: 'pendiente' | 'exportada' | 'publicada'
          datos_formato_json?: Json | null
          creado_en?: string
          actualizado_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "actividades_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          }
        ]
      }
      auditoria: {
        Row: {
          id: number
          operacion: string
          tabla: string
          entidad_id: string
          usuario_id: string | null
          usuario_email: string | null
          payload_anterior: Json | null
          payload_nuevo: Json | null
          creado_en: string
        }
        Insert: {
          id?: never
          operacion: string
          tabla: string
          entidad_id: string
          usuario_id?: string | null
          usuario_email?: string | null
          payload_anterior?: Json | null
          payload_nuevo?: Json | null
          creado_en?: string
        }
        Update: {
          id?: never
          operacion?: string
          tabla?: string
          entidad_id?: string
          usuario_id?: string | null
          usuario_email?: string | null
          payload_anterior?: Json | null
          payload_nuevo?: Json | null
          creado_en?: string
        }
        Relationships: []
      }
      evidencias: {
        Row: {
          id: string
          nombre_archivo: string
          ruta_storage: string
          ruta_thumb: string | null
          hash_sha256: string
          tamano_bytes: number
          mime_type: string
          fecha_captura: string | null
          fecha_ingesta: string
          estado: 'pendiente' | 'vinculada' | 'archivada' | 'error'
          metadatos_json: Json | null
          subido_por: string | null
        }
        Insert: {
          id?: string
          nombre_archivo: string
          ruta_storage: string
          ruta_thumb?: string | null
          hash_sha256: string
          tamano_bytes: number
          mime_type: string
          fecha_captura?: string | null
          fecha_ingesta?: string
          estado?: 'pendiente' | 'vinculada' | 'archivada' | 'error'
          metadatos_json?: Json | null
          subido_por?: string | null
        }
        Update: {
          id?: string
          nombre_archivo?: string
          ruta_storage?: string
          ruta_thumb?: string | null
          hash_sha256?: string
          tamano_bytes?: number
          mime_type?: string
          fecha_captura?: string | null
          fecha_ingesta?: string
          estado?: 'pendiente' | 'vinculada' | 'archivada' | 'error'
          metadatos_json?: Json | null
          subido_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evidencias_subido_por_fkey"
            columns: ["subido_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          }
        ]
      }
      identificaciones: {
        Row: {
          evidencia_id: string
          apellido_paterno: string
          apellido_materno: string
          nombres: string
          cargo: string | null
          texto_crudo_ocr: string | null
          nivel_confianza: number | null
          confirmado_por: string | null
          confirmador_email: string | null
          confirmado_en: string
        }
        Insert: {
          evidencia_id: string
          apellido_paterno: string
          apellido_materno: string
          nombres: string
          cargo?: string | null
          texto_crudo_ocr?: string | null
          nivel_confianza?: number | null
          confirmado_por?: string | null
          confirmador_email?: string | null
          confirmado_en?: string
        }
        Update: {
          evidencia_id?: string
          apellido_paterno?: string
          apellido_materno?: string
          nombres?: string
          cargo?: string | null
          texto_crudo_ocr?: string | null
          nivel_confianza?: number | null
          confirmado_por?: string | null
          confirmador_email?: string | null
          confirmado_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "identificaciones_evidencia_id_fkey"
            columns: ["evidencia_id"]
            isOneToOne: true
            referencedRelation: "evidencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identificaciones_confirmado_por_fkey"
            columns: ["confirmado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          }
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
              {
                foreignKeyName: "vinculos_vinculado_por_fkey"
                columns: ["vinculado_por"]
                isOneToOne: false
                referencedRelation: "perfiles"
                referencedColumns: ["id"]
              }
            ]
          }
      }
    Views: {
      [_ in never]: never
    }
    Functions: {
      guardar_actividad_hse_completa: {
        Args: {
          p_id?: string | null
          p_datos_generales?: Json
          p_datos_formato_json?: Json
          p_estado_reporte?: string | null
        }
        Returns: Json
      }
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

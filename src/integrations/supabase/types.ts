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
      analisi: {
        Row: {
          cliente_id: string
          contenuto: string
          created_at: string
          generato_il: string
          updated_at: string
        }
        Insert: {
          cliente_id: string
          contenuto: string
          created_at?: string
          generato_il?: string
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          contenuto?: string
          created_at?: string
          generato_il?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analisi_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: true
            referencedRelation: "clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisi_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: true
            referencedRelation: "vista_clienti"
            referencedColumns: ["id"]
          },
        ]
      }
      aura_usage: {
        Row: {
          created_at: string
          id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: never
          user_id: string
        }
        Update: {
          created_at?: string
          id?: never
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aura_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      chiamate: {
        Row: {
          cliente_id: string | null
          created_at: string
          fathom_recording_id: string | null
          id: string
          registrata_il: string | null
          riassunto: string | null
          riassunto_originale: string | null
          share_url: string | null
          titolo: string | null
          updated_at: string
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          fathom_recording_id?: string | null
          id?: string
          registrata_il?: string | null
          riassunto?: string | null
          riassunto_originale?: string | null
          share_url?: string | null
          titolo?: string | null
          updated_at?: string
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          fathom_recording_id?: string | null
          id?: string
          registrata_il?: string | null
          riassunto?: string | null
          riassunto_originale?: string | null
          share_url?: string | null
          titolo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chiamate_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chiamate_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vista_clienti"
            referencedColumns: ["id"]
          },
        ]
      }
      chiamate_azioni: {
        Row: {
          chiamata_id: string
          completata: boolean
          created_at: string
          id: string
          ordine: number
          testo: string
          updated_at: string
        }
        Insert: {
          chiamata_id: string
          completata?: boolean
          created_at?: string
          id?: string
          ordine?: number
          testo: string
          updated_at?: string
        }
        Update: {
          chiamata_id?: string
          completata?: boolean
          created_at?: string
          id?: string
          ordine?: number
          testo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chiamate_azioni_chiamata_id_fkey"
            columns: ["chiamata_id"]
            isOneToOne: false
            referencedRelation: "chiamate"
            referencedColumns: ["id"]
          },
        ]
      }
      clienti: {
        Row: {
          created_at: string
          data_inizio: string | null
          fase: string
          hub_creato_il: string | null
          id: string
          instagram: string | null
          note: string | null
          notion_hub_url: string | null
          onboarding_completato_il: string | null
          ore_operative: number | null
          profilo: string | null
          prossima_call: string | null
          prossima_call_source: string | null
          stato_onboarding: string
          telefono: string | null
          tiktok: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_inizio?: string | null
          fase?: string
          hub_creato_il?: string | null
          id: string
          instagram?: string | null
          note?: string | null
          notion_hub_url?: string | null
          onboarding_completato_il?: string | null
          ore_operative?: number | null
          profilo?: string | null
          prossima_call?: string | null
          prossima_call_source?: string | null
          stato_onboarding?: string
          telefono?: string | null
          tiktok?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_inizio?: string | null
          fase?: string
          hub_creato_il?: string | null
          id?: string
          instagram?: string | null
          note?: string | null
          notion_hub_url?: string | null
          onboarding_completato_il?: string | null
          ore_operative?: number | null
          profilo?: string | null
          prossima_call?: string | null
          prossima_call_source?: string | null
          stato_onboarding?: string
          telefono?: string | null
          tiktok?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clienti_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      clienti_tags: {
        Row: {
          cliente_id: string
          created_at: string
          tag_id: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          tag_id: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clienti_tags_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clienti_tags_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vista_clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clienti_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      error_log: {
        Row: {
          context: Json | null
          created_at: string
          id: number
          message: string
          scope: string
        }
        Insert: {
          context?: Json | null
          created_at?: string
          id?: never
          message: string
          scope: string
        }
        Update: {
          context?: Json | null
          created_at?: string
          id?: never
          message?: string
          scope?: string
        }
        Relationships: []
      }
      f24: {
        Row: {
          created_at: string
          descrizione: string | null
          id: string
          importo: number | null
          pagato: boolean
          pagato_il: string | null
          pdf_path: string
          scadenza: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          descrizione?: string | null
          id?: string
          importo?: number | null
          pagato?: boolean
          pagato_il?: string | null
          pdf_path: string
          scadenza?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          descrizione?: string | null
          id?: string
          importo?: number | null
          pagato?: boolean
          pagato_il?: string | null
          pdf_path?: string
          scadenza?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      fathom_webhook_log: {
        Row: {
          emails: string[] | null
          id: number
          matched_email: string | null
          payload: Json | null
          received_at: string
        }
        Insert: {
          emails?: string[] | null
          id?: never
          matched_email?: string | null
          payload?: Json | null
          received_at?: string
        }
        Update: {
          emails?: string[] | null
          id?: never
          matched_email?: string | null
          payload?: Json | null
          received_at?: string
        }
        Relationships: []
      }
      fatture: {
        Row: {
          cliente_id: string
          created_at: string
          descrizione: string | null
          emessa_il: string
          id: string
          importo: number
          note: string | null
          pagata: boolean
          pagata_il: string | null
          pdf_path: string | null
          prossimo_pagamento: string | null
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          descrizione?: string | null
          emessa_il?: string
          id?: string
          importo?: number
          note?: string | null
          pagata?: boolean
          pagata_il?: string | null
          pdf_path?: string | null
          prossimo_pagamento?: string | null
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          descrizione?: string | null
          emessa_il?: string
          id?: string
          importo?: number
          note?: string | null
          pagata?: boolean
          pagata_il?: string | null
          pdf_path?: string | null
          prossimo_pagamento?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fatture_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fatture_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vista_clienti"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_board: {
        Row: {
          call_n: number
          cliente_id: string
          created_at: string
          id: string
          notion_db_id: string
          synced_at: string
          updated_at: string
        }
        Insert: {
          call_n: number
          cliente_id: string
          created_at?: string
          id?: string
          notion_db_id: string
          synced_at?: string
          updated_at?: string
        }
        Update: {
          call_n?: number
          cliente_id?: string
          created_at?: string
          id?: string
          notion_db_id?: string
          synced_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hub_board_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hub_board_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vista_clienti"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_compiti: {
        Row: {
          assegnato_a: string
          board_id: string
          created_at: string
          id: string
          link_utile: string | null
          notion_page_id: string
          ordine: number
          scadenza: string | null
          stato: string
          titolo: string
          updated_at: string
        }
        Insert: {
          assegnato_a?: string
          board_id: string
          created_at?: string
          id?: string
          link_utile?: string | null
          notion_page_id: string
          ordine?: number
          scadenza?: string | null
          stato?: string
          titolo: string
          updated_at?: string
        }
        Update: {
          assegnato_a?: string
          board_id?: string
          created_at?: string
          id?: string
          link_utile?: string | null
          notion_page_id?: string
          ordine?: number
          scadenza?: string | null
          stato?: string
          titolo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hub_compiti_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "hub_board"
            referencedColumns: ["id"]
          },
        ]
      }
      lead: {
        Row: {
          contatto: string | null
          created_at: string
          fonte: string | null
          id: string
          nome: string
          note: string | null
          prossima_azione: string | null
          prossima_azione_il: string | null
          stage: string
          updated_at: string
          valore: number
        }
        Insert: {
          contatto?: string | null
          created_at?: string
          fonte?: string | null
          id?: string
          nome: string
          note?: string | null
          prossima_azione?: string | null
          prossima_azione_il?: string | null
          stage?: string
          updated_at?: string
          valore?: number
        }
        Update: {
          contatto?: string | null
          created_at?: string
          fonte?: string | null
          id?: string
          nome?: string
          note?: string | null
          prossima_azione?: string | null
          prossima_azione_il?: string | null
          stage?: string
          updated_at?: string
          valore?: number
        }
        Relationships: []
      }
      lezioni: {
        Row: {
          attiva: boolean
          corso: string | null
          created_at: string
          descrizione: string | null
          id: string
          key: string
          keywords: string[]
          ordine: number | null
          titolo: string
          updated_at: string
          url: string | null
          vista_la_prima_volta: string
        }
        Insert: {
          attiva?: boolean
          corso?: string | null
          created_at?: string
          descrizione?: string | null
          id?: string
          key: string
          keywords?: string[]
          ordine?: number | null
          titolo: string
          updated_at?: string
          url?: string | null
          vista_la_prima_volta?: string
        }
        Update: {
          attiva?: boolean
          corso?: string | null
          created_at?: string
          descrizione?: string | null
          id?: string
          key?: string
          keywords?: string[]
          ordine?: number | null
          titolo?: string
          updated_at?: string
          url?: string | null
          vista_la_prima_volta?: string
        }
        Relationships: []
      }
      note_clienti: {
        Row: {
          autore_id: string | null
          cliente_id: string
          created_at: string
          id: string
          testo: string
          updated_at: string
        }
        Insert: {
          autore_id?: string | null
          cliente_id: string
          created_at?: string
          id?: string
          testo: string
          updated_at?: string
        }
        Update: {
          autore_id?: string | null
          cliente_id?: string
          created_at?: string
          id?: string
          testo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_clienti_autore_id_fkey"
            columns: ["autore_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_clienti_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_clienti_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vista_clienti"
            referencedColumns: ["id"]
          },
        ]
      }
      questionario_allegati: {
        Row: {
          created_at: string
          dimensione: number
          domanda_id: string
          id: string
          invio_id: string
          nome: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          dimensione: number
          domanda_id: string
          id?: string
          invio_id: string
          nome: string
          storage_path: string
        }
        Update: {
          created_at?: string
          dimensione?: number
          domanda_id?: string
          id?: string
          invio_id?: string
          nome?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "questionario_allegati_invio_id_fkey"
            columns: ["invio_id"]
            isOneToOne: false
            referencedRelation: "questionario_invii"
            referencedColumns: ["id"]
          },
        ]
      }
      questionario_invii: {
        Row: {
          cliente_id: string
          created_at: string
          id: string
          inviato_il: string | null
          questionario_id: string
          schermata: string | null
          sezione_indice: number | null
          stato: string
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          id?: string
          inviato_il?: string | null
          questionario_id: string
          schermata?: string | null
          sezione_indice?: number | null
          stato?: string
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          id?: string
          inviato_il?: string | null
          questionario_id?: string
          schermata?: string | null
          sezione_indice?: number | null
          stato?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questionario_invii_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questionario_invii_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vista_clienti"
            referencedColumns: ["id"]
          },
        ]
      }
      questionario_risposte: {
        Row: {
          created_at: string
          domanda_id: string
          id: string
          invio_id: string
          ordine: number
          updated_at: string
          valore: string
        }
        Insert: {
          created_at?: string
          domanda_id: string
          id?: string
          invio_id: string
          ordine?: number
          updated_at?: string
          valore: string
        }
        Update: {
          created_at?: string
          domanda_id?: string
          id?: string
          invio_id?: string
          ordine?: number
          updated_at?: string
          valore?: string
        }
        Relationships: [
          {
            foreignKeyName: "questionario_risposte_invio_id_fkey"
            columns: ["invio_id"]
            isOneToOne: false
            referencedRelation: "questionario_invii"
            referencedColumns: ["id"]
          },
        ]
      }
      spese: {
        Row: {
          attiva: boolean
          created_at: string
          data: string
          descrizione: string
          id: string
          importo: number
          ricevuta_path: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          attiva?: boolean
          created_at?: string
          data?: string
          descrizione: string
          id?: string
          importo: number
          ricevuta_path?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          attiva?: boolean
          created_at?: string
          data?: string
          descrizione?: string
          id?: string
          importo?: number
          ricevuta_path?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      sync_stati: {
        Row: {
          chiave: string
          dettaglio: string | null
          esito: string | null
          nuove: number
          synced_at: string | null
          totale: number
          updated_at: string
        }
        Insert: {
          chiave: string
          dettaglio?: string | null
          esito?: string | null
          nuove?: number
          synced_at?: string | null
          totale?: number
          updated_at?: string
        }
        Update: {
          chiave?: string
          dettaglio?: string | null
          esito?: string | null
          nuove?: number
          synced_at?: string | null
          totale?: number
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          label: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          email: string
          id: string
          nombre: string
          rol: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          nombre: string
          rol?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nombre?: string
          rol?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      vista_clienti: {
        Row: {
          call_corrente: number | null
          created_at: string | null
          data_inizio: string | null
          di_wesley_aperti: number | null
          email: string | null
          fase: string | null
          fatti: number | null
          fatture_da_pagare: number | null
          fatture_prossima_scadenza: string | null
          fatture_totali: number | null
          hub_creato_il: string | null
          id: string | null
          in_corso: number | null
          instagram: string | null
          nombre: string | null
          notion_hub_url: string | null
          prossima_call: string | null
          prossima_call_source: string | null
          stato_onboarding: string | null
          tag_labels: string[] | null
          telefono: string | null
          tiktok: string | null
          totale: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clienti_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      vista_finanza_mensile: {
        Row: {
          f24: number | null
          fatturato: number | null
          incassato: number | null
          mese: string | null
          spese_fisse: number | null
          spese_variabili: number | null
        }
        Relationships: []
      }
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

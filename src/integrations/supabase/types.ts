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
      aura_conoscenza: {
        Row: {
          ambito: string
          attivo: boolean
          contenuto: string
          created_at: string
          id: string
          ordine: number
          titolo: string
          updated_at: string
        }
        Insert: {
          ambito?: string
          attivo?: boolean
          contenuto: string
          created_at?: string
          id?: string
          ordine?: number
          titolo: string
          updated_at?: string
        }
        Update: {
          ambito?: string
          attivo?: boolean
          contenuto?: string
          created_at?: string
          id?: string
          ordine?: number
          titolo?: string
          updated_at?: string
        }
        Relationships: []
      }
      aura_consumi: {
        Row: {
          cache_lettura_tokens: number
          cache_scrittura_tokens: number
          created_at: string
          funzione: string
          id: number
          input_tokens: number
          modello: string
          output_tokens: number
          user_id: string | null
        }
        Insert: {
          cache_lettura_tokens?: number
          cache_scrittura_tokens?: number
          created_at?: string
          funzione: string
          id?: never
          input_tokens?: number
          modello: string
          output_tokens?: number
          user_id?: string | null
        }
        Update: {
          cache_lettura_tokens?: number
          cache_scrittura_tokens?: number
          created_at?: string
          funzione?: string
          id?: never
          input_tokens?: number
          modello?: string
          output_tokens?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aura_consumi_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      aura_usage: {
        Row: {
          created_at: string
          id: number
          scope: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: never
          scope?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: never
          scope?: string
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
      avatar: {
        Row: {
          chi_segue: string[]
          cliente_id: string
          completato_il: string | null
          contesto: string | null
          created_at: string
          credenze_limitanti: string[]
          desiderio_emotivo: string | null
          desiderio_pratico: string | null
          dolori_profondi: string[]
          dolori_superficie: string[]
          dove_cerca: string | null
          eta: string | null
          frase: string | null
          genere: string | null
          id: string
          linguaggio: string[]
          modello: string | null
          momento: string | null
          nome: string | null
          obiezioni: string[]
          origine: string | null
          piattaforme: string[]
          settore: string | null
          situazione: string | null
          snapshot: string | null
          stato: string
          trigger_acquisto: string[]
          updated_at: string
        }
        Insert: {
          chi_segue?: string[]
          cliente_id: string
          completato_il?: string | null
          contesto?: string | null
          created_at?: string
          credenze_limitanti?: string[]
          desiderio_emotivo?: string | null
          desiderio_pratico?: string | null
          dolori_profondi?: string[]
          dolori_superficie?: string[]
          dove_cerca?: string | null
          eta?: string | null
          frase?: string | null
          genere?: string | null
          id?: string
          linguaggio?: string[]
          modello?: string | null
          momento?: string | null
          nome?: string | null
          obiezioni?: string[]
          origine?: string | null
          piattaforme?: string[]
          settore?: string | null
          situazione?: string | null
          snapshot?: string | null
          stato?: string
          trigger_acquisto?: string[]
          updated_at?: string
        }
        Update: {
          chi_segue?: string[]
          cliente_id?: string
          completato_il?: string | null
          contesto?: string | null
          created_at?: string
          credenze_limitanti?: string[]
          desiderio_emotivo?: string | null
          desiderio_pratico?: string | null
          dolori_profondi?: string[]
          dolori_superficie?: string[]
          dove_cerca?: string | null
          eta?: string | null
          frase?: string | null
          genere?: string | null
          id?: string
          linguaggio?: string[]
          modello?: string | null
          momento?: string | null
          nome?: string | null
          obiezioni?: string[]
          origine?: string | null
          piattaforme?: string[]
          settore?: string | null
          situazione?: string | null
          snapshot?: string | null
          stato?: string
          trigger_acquisto?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "avatar_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avatar_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vista_clienti"
            referencedColumns: ["id"]
          },
        ]
      }
      avatar_diagnosi: {
        Row: {
          avatar_id: string
          come_usarlo: string | null
          created_at: string
          criticita: string[]
          da_validare: string[]
          punti_forza: string[]
          quadro: string | null
          quanto_ristretto: string | null
          updated_at: string
        }
        Insert: {
          avatar_id: string
          come_usarlo?: string | null
          created_at?: string
          criticita?: string[]
          da_validare?: string[]
          punti_forza?: string[]
          quadro?: string | null
          quanto_ristretto?: string | null
          updated_at?: string
        }
        Update: {
          avatar_id?: string
          come_usarlo?: string | null
          created_at?: string
          criticita?: string[]
          da_validare?: string[]
          punti_forza?: string[]
          quadro?: string | null
          quanto_ristretto?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "avatar_diagnosi_avatar_id_fkey"
            columns: ["avatar_id"]
            isOneToOne: true
            referencedRelation: "avatar"
            referencedColumns: ["id"]
          },
        ]
      }
      avatar_messaggi: {
        Row: {
          avatar_id: string
          contenuto: string
          created_at: string
          errore: string | null
          id: string
          modello: string | null
          ruolo: string
          stato: string
          updated_at: string
        }
        Insert: {
          avatar_id: string
          contenuto?: string
          created_at?: string
          errore?: string | null
          id?: string
          modello?: string | null
          ruolo: string
          stato?: string
          updated_at?: string
        }
        Update: {
          avatar_id?: string
          contenuto?: string
          created_at?: string
          errore?: string | null
          id?: string
          modello?: string | null
          ruolo?: string
          stato?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "avatar_messaggi_avatar_id_fkey"
            columns: ["avatar_id"]
            isOneToOne: false
            referencedRelation: "avatar"
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
          da_attivare: boolean
          data_inizio: string | null
          fase: string
          hub_creato_il: string | null
          id: string
          instagram: string | null
          instagram_sync_errore: string | null
          instagram_sync_il: string | null
          note: string | null
          notion_hub_url: string | null
          onboarding_completato_il: string | null
          ore_operative: number | null
          profilo: string | null
          prossima_call: string | null
          prossima_call_source: string | null
          stato_onboarding: string
          tags: string[]
          telefono: string | null
          tiktok: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          da_attivare?: boolean
          data_inizio?: string | null
          fase?: string
          hub_creato_il?: string | null
          id: string
          instagram?: string | null
          instagram_sync_errore?: string | null
          instagram_sync_il?: string | null
          note?: string | null
          notion_hub_url?: string | null
          onboarding_completato_il?: string | null
          ore_operative?: number | null
          profilo?: string | null
          prossima_call?: string | null
          prossima_call_source?: string | null
          stato_onboarding?: string
          tags?: string[]
          telefono?: string | null
          tiktok?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          da_attivare?: boolean
          data_inizio?: string | null
          fase?: string
          hub_creato_il?: string | null
          id?: string
          instagram?: string | null
          instagram_sync_errore?: string | null
          instagram_sync_il?: string | null
          note?: string | null
          notion_hub_url?: string | null
          onboarding_completato_il?: string | null
          ore_operative?: number | null
          profilo?: string | null
          prossima_call?: string | null
          prossima_call_source?: string | null
          stato_onboarding?: string
          tags?: string[]
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
      coach_messaggi: {
        Row: {
          cliente_id: string
          contenuto: string
          created_at: string
          errore: string | null
          id: string
          lezioni_capitoli: string[]
          lezioni_ids: string[]
          modello: string | null
          ruolo: string
          stato: string
          updated_at: string
        }
        Insert: {
          cliente_id: string
          contenuto?: string
          created_at?: string
          errore?: string | null
          id?: string
          lezioni_capitoli?: string[]
          lezioni_ids?: string[]
          modello?: string | null
          ruolo: string
          stato?: string
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          contenuto?: string
          created_at?: string
          errore?: string | null
          id?: string
          lezioni_capitoli?: string[]
          lezioni_ids?: string[]
          modello?: string | null
          ruolo?: string
          stato?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_messaggi_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_messaggi_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vista_clienti"
            referencedColumns: ["id"]
          },
        ]
      }
      compiti: {
        Row: {
          cliente_id: string
          completato_il: string | null
          created_at: string
          creato_da: string | null
          id: string
          link_skool: string | null
          nota_skool: string | null
          ordine: number
          padre_id: string | null
          stato: string
          testo: string
          updated_at: string
        }
        Insert: {
          cliente_id: string
          completato_il?: string | null
          created_at?: string
          creato_da?: string | null
          id?: string
          link_skool?: string | null
          nota_skool?: string | null
          ordine?: number
          padre_id?: string | null
          stato?: string
          testo: string
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          completato_il?: string | null
          created_at?: string
          creato_da?: string | null
          id?: string
          link_skool?: string | null
          nota_skool?: string | null
          ordine?: number
          padre_id?: string | null
          stato?: string
          testo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compiti_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compiti_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vista_clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compiti_creato_da_fkey"
            columns: ["creato_da"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compiti_padre_id_fkey"
            columns: ["padre_id"]
            isOneToOne: false
            referencedRelation: "compiti"
            referencedColumns: ["id"]
          },
        ]
      }
      concorrenti: {
        Row: {
          cliente_id: string
          cosa_fa: string | null
          created_at: string
          id: string
          nome: string
          social: string[]
          updated_at: string
        }
        Insert: {
          cliente_id: string
          cosa_fa?: string | null
          created_at?: string
          id?: string
          nome: string
          social?: string[]
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          cosa_fa?: string | null
          created_at?: string
          id?: string
          nome?: string
          social?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "concorrenti_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concorrenti_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vista_clienti"
            referencedColumns: ["id"]
          },
        ]
      }
      concorrenti_video: {
        Row: {
          concorrente_id: string
          created_at: string
          descrizione: string | null
          id: string
          ordine: number
          url: string
        }
        Insert: {
          concorrente_id: string
          created_at?: string
          descrizione?: string | null
          id?: string
          ordine?: number
          url: string
        }
        Update: {
          concorrente_id?: string
          created_at?: string
          descrizione?: string | null
          id?: string
          ordine?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "concorrenti_video_concorrente_id_fkey"
            columns: ["concorrente_id"]
            isOneToOne: false
            referencedRelation: "concorrenti"
            referencedColumns: ["id"]
          },
        ]
      }
      contenuti: {
        Row: {
          cliente_id: string
          created_at: string
          creato_da: string | null
          drive_url: string | null
          id: string
          note: string | null
          ordine: number
          pubblicato_il: string | null
          pubblicazione_prevista: string | null
          riferimenti: string[]
          script: string | null
          stato: string
          tipologia: string | null
          titolo: string
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          creato_da?: string | null
          drive_url?: string | null
          id?: string
          note?: string | null
          ordine?: number
          pubblicato_il?: string | null
          pubblicazione_prevista?: string | null
          riferimenti?: string[]
          script?: string | null
          stato?: string
          tipologia?: string | null
          titolo: string
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          creato_da?: string | null
          drive_url?: string | null
          id?: string
          note?: string | null
          ordine?: number
          pubblicato_il?: string | null
          pubblicazione_prevista?: string | null
          riferimenti?: string[]
          script?: string | null
          stato?: string
          tipologia?: string | null
          titolo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contenuti_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contenuti_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vista_clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contenuti_creato_da_fkey"
            columns: ["creato_da"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      contratti: {
        Row: {
          annullato_il: string | null
          aperto_il: string | null
          attivato_il: string | null
          attivazione_consegne: string[]
          cliente_email: string | null
          cliente_id: string | null
          cliente_nome: string | null
          compilato_il: string | null
          created_at: string
          creato_da: string | null
          dati: Json
          documento: Json | null
          durata_mesi: number
          fattura_id: string | null
          firma_clausole: Json | null
          firma_contratto: Json | null
          firma_fornitore: Json | null
          firma_ip: string | null
          firma_user_agent: string | null
          firmato_il: string | null
          id: string
          informativa_letta_il: string | null
          modello: string | null
          modello_contratto: string
          note: string | null
          offerta_id: string | null
          offerta_nome: string | null
          pagato_il: string | null
          pdf_path: string | null
          pdf_sha256: string | null
          prezzo: number
          programma: string
          recesso_fino_al: string | null
          scade_il: string | null
          stato: string
          testo_sha256: string | null
          tipo: string | null
          token: string
          updated_at: string
        }
        Insert: {
          annullato_il?: string | null
          aperto_il?: string | null
          attivato_il?: string | null
          attivazione_consegne?: string[]
          cliente_email?: string | null
          cliente_id?: string | null
          cliente_nome?: string | null
          compilato_il?: string | null
          created_at?: string
          creato_da?: string | null
          dati?: Json
          documento?: Json | null
          durata_mesi: number
          fattura_id?: string | null
          firma_clausole?: Json | null
          firma_contratto?: Json | null
          firma_fornitore?: Json | null
          firma_ip?: string | null
          firma_user_agent?: string | null
          firmato_il?: string | null
          id?: string
          informativa_letta_il?: string | null
          modello?: string | null
          modello_contratto: string
          note?: string | null
          offerta_id?: string | null
          offerta_nome?: string | null
          pagato_il?: string | null
          pdf_path?: string | null
          pdf_sha256?: string | null
          prezzo: number
          programma: string
          recesso_fino_al?: string | null
          scade_il?: string | null
          stato?: string
          testo_sha256?: string | null
          tipo?: string | null
          token: string
          updated_at?: string
        }
        Update: {
          annullato_il?: string | null
          aperto_il?: string | null
          attivato_il?: string | null
          attivazione_consegne?: string[]
          cliente_email?: string | null
          cliente_id?: string | null
          cliente_nome?: string | null
          compilato_il?: string | null
          created_at?: string
          creato_da?: string | null
          dati?: Json
          documento?: Json | null
          durata_mesi?: number
          fattura_id?: string | null
          firma_clausole?: Json | null
          firma_contratto?: Json | null
          firma_fornitore?: Json | null
          firma_ip?: string | null
          firma_user_agent?: string | null
          firmato_il?: string | null
          id?: string
          informativa_letta_il?: string | null
          modello?: string | null
          modello_contratto?: string
          note?: string | null
          offerta_id?: string | null
          offerta_nome?: string | null
          pagato_il?: string | null
          pdf_path?: string | null
          pdf_sha256?: string | null
          prezzo?: number
          programma?: string
          recesso_fino_al?: string | null
          scade_il?: string | null
          stato?: string
          testo_sha256?: string | null
          tipo?: string | null
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contratti_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratti_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vista_clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratti_creato_da_fkey"
            columns: ["creato_da"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratti_fattura_id_fkey"
            columns: ["fattura_id"]
            isOneToOne: false
            referencedRelation: "fatture"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratti_offerta_id_fkey"
            columns: ["offerta_id"]
            isOneToOne: false
            referencedRelation: "offerte"
            referencedColumns: ["id"]
          },
        ]
      }
      contratti_impostazioni: {
        Row: {
          firma: Json | null
          firma_salvata_il: string | null
          id: boolean
          istruzioni_pagamento: string | null
          telefono_fornitore: string | null
          updated_at: string
        }
        Insert: {
          firma?: Json | null
          firma_salvata_il?: string | null
          id?: boolean
          istruzioni_pagamento?: string | null
          telefono_fornitore?: string | null
          updated_at?: string
        }
        Update: {
          firma?: Json | null
          firma_salvata_il?: string | null
          id?: boolean
          istruzioni_pagamento?: string | null
          telefono_fornitore?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      crm_accessi_assistenza: {
        Row: {
          accesso_il: string
          cliente_id: string
          contatti_visti: number
          id: string
          motivo: string
          operatore_id: string
          operatore_nome: string | null
          operatore_ruolo: string | null
        }
        Insert: {
          accesso_il?: string
          cliente_id: string
          contatti_visti?: number
          id?: string
          motivo: string
          operatore_id: string
          operatore_nome?: string | null
          operatore_ruolo?: string | null
        }
        Update: {
          accesso_il?: string
          cliente_id?: string
          contatti_visti?: number
          id?: string
          motivo?: string
          operatore_id?: string
          operatore_nome?: string | null
          operatore_ruolo?: string | null
        }
        Relationships: []
      }
      crm_accettazioni: {
        Row: {
          accettato_il: string
          accettazione_id: string
          documento: string
          documento_id: string
          email: string | null
          id: string
          testo_caselle: string[]
          user_id: string
          versione: number
          versione_documento: number
        }
        Insert: {
          accettato_il?: string
          accettazione_id: string
          documento: string
          documento_id: string
          email?: string | null
          id?: string
          testo_caselle: string[]
          user_id: string
          versione: number
          versione_documento: number
        }
        Update: {
          accettato_il?: string
          accettazione_id?: string
          documento?: string
          documento_id?: string
          email?: string | null
          id?: string
          testo_caselle?: string[]
          user_id?: string
          versione?: number
          versione_documento?: number
        }
        Relationships: [
          {
            foreignKeyName: "crm_accettazioni_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documenti_legali"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_accettazioni_versione_fkey"
            columns: ["versione"]
            isOneToOne: false
            referencedRelation: "crm_versioni"
            referencedColumns: ["versione"]
          },
        ]
      }
      crm_impostazioni: {
        Row: {
          giorni_cancellazione_account: number
          giorni_preavviso: number
          id: boolean
          updated_at: string
        }
        Insert: {
          giorni_cancellazione_account?: number
          giorni_preavviso?: number
          id?: boolean
          updated_at?: string
        }
        Update: {
          giorni_cancellazione_account?: number
          giorni_preavviso?: number
          id?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      crm_lead: {
        Row: {
          arrivato_il: string
          cliente_id: string
          created_at: string
          email: string | null
          fonte: string
          id: string
          nome: string
          offerta_id: string | null
          stato: string
          telefono: string | null
          updated_at: string
          valore: number | null
        }
        Insert: {
          arrivato_il?: string
          cliente_id: string
          created_at?: string
          email?: string | null
          fonte: string
          id?: string
          nome: string
          offerta_id?: string | null
          stato?: string
          telefono?: string | null
          updated_at?: string
          valore?: number | null
        }
        Update: {
          arrivato_il?: string
          cliente_id?: string
          created_at?: string
          email?: string | null
          fonte?: string
          id?: string
          nome?: string
          offerta_id?: string | null
          stato?: string
          telefono?: string | null
          updated_at?: string
          valore?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_lead_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_lead_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vista_clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_lead_offerta_id_fkey"
            columns: ["offerta_id"]
            isOneToOne: false
            referencedRelation: "offerta"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_versioni: {
        Row: {
          accordo_id: string
          casella_1: string
          casella_2: string
          casella_3: string
          efficace_dal: string
          informativa_id: string
          pubblicata_il: string
          sintesi_modifiche: string | null
          termini_id: string
          versione: number
        }
        Insert: {
          accordo_id: string
          casella_1: string
          casella_2: string
          casella_3: string
          efficace_dal: string
          informativa_id: string
          pubblicata_il?: string
          sintesi_modifiche?: string | null
          termini_id: string
          versione: number
        }
        Update: {
          accordo_id?: string
          casella_1?: string
          casella_2?: string
          casella_3?: string
          efficace_dal?: string
          informativa_id?: string
          pubblicata_il?: string
          sintesi_modifiche?: string | null
          termini_id?: string
          versione?: number
        }
        Relationships: [
          {
            foreignKeyName: "crm_versioni_accordo_id_fkey"
            columns: ["accordo_id"]
            isOneToOne: false
            referencedRelation: "documenti_legali"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_versioni_informativa_id_fkey"
            columns: ["informativa_id"]
            isOneToOne: false
            referencedRelation: "documenti_legali"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_versioni_termini_id_fkey"
            columns: ["termini_id"]
            isOneToOne: false
            referencedRelation: "documenti_legali"
            referencedColumns: ["id"]
          },
        ]
      }
      data_onboarding: {
        Row: {
          abbonamenti: Json | null
          acquirente_utente: string | null
          anti_cliente: string | null
          attivita_breve: string | null
          attivita_pesanti: Json | null
          avatar_ipotesi: string | null
          blocco_partenza: Json | null
          blocco_partenza_testo: string | null
          camera_agio: number | null
          canali_acquisizione: Json | null
          capacita: string | null
          chiarimenti_fatti: boolean
          ciclo_vendita: string | null
          cliente_migliore: string | null
          clienti: string | null
          clienti_da_social: number | null
          collo_bottiglia: string | null
          competenza_obiettivo: string | null
          consegna: string | null
          contenuti_migliori: string | null
          conversione: number | null
          created_at: string
          da_evitare: string | null
          decisore: string | null
          diagnosi_cliente: string | null
          disponibilita_call: Json | null
          dispositivo: string | null
          domande_ricevute: string | null
          esperienze_prova: string | null
          fatturato_fascia: string | null
          follower: number | null
          frequenza: number | null
          ia_uso: string | null
          id: string
          inviato_il: string | null
          lettura_errore: string | null
          link_profili: Json | null
          margine: number | null
          materiali_testo: string | null
          mercato: string | null
          messaggi_tipici: string | null
          nome: string | null
          nome_attivita: string | null
          non_delegabile: string | null
          obiettivo_6_mesi: string | null
          obiezioni: string | null
          offerta_attuale: string | null
          offerta_secondaria: string | null
          ordini_mese: number | null
          ore_per_attivita: Json | null
          ore_percorso: string | null
          ore_social: string | null
          parole: Json | null
          paure: string | null
          perche_ora: string | null
          presentazione: string | null
          priorita_crescita: string | null
          processo_vendita: string | null
          processo_vendita_canali: Json | null
          prove: Json | null
          prove_testo: string | null
          riepilogo: string | null
          riepilogo_correzione: string | null
          riferimenti: string | null
          ritorno: string | null
          schermata: string | null
          sezione_indice: number | null
          social: string | null
          spesa_media: number | null
          stato: string
          tentativi_passati: string | null
          tipo: string | null
          tipo_principale: string | null
          updated_at: string
          views_medie: number | null
          vincoli_camera: string | null
        }
        Insert: {
          abbonamenti?: Json | null
          acquirente_utente?: string | null
          anti_cliente?: string | null
          attivita_breve?: string | null
          attivita_pesanti?: Json | null
          avatar_ipotesi?: string | null
          blocco_partenza?: Json | null
          blocco_partenza_testo?: string | null
          camera_agio?: number | null
          canali_acquisizione?: Json | null
          capacita?: string | null
          chiarimenti_fatti?: boolean
          ciclo_vendita?: string | null
          cliente_migliore?: string | null
          clienti?: string | null
          clienti_da_social?: number | null
          collo_bottiglia?: string | null
          competenza_obiettivo?: string | null
          consegna?: string | null
          contenuti_migliori?: string | null
          conversione?: number | null
          created_at?: string
          da_evitare?: string | null
          decisore?: string | null
          diagnosi_cliente?: string | null
          disponibilita_call?: Json | null
          dispositivo?: string | null
          domande_ricevute?: string | null
          esperienze_prova?: string | null
          fatturato_fascia?: string | null
          follower?: number | null
          frequenza?: number | null
          ia_uso?: string | null
          id: string
          inviato_il?: string | null
          lettura_errore?: string | null
          link_profili?: Json | null
          margine?: number | null
          materiali_testo?: string | null
          mercato?: string | null
          messaggi_tipici?: string | null
          nome?: string | null
          nome_attivita?: string | null
          non_delegabile?: string | null
          obiettivo_6_mesi?: string | null
          obiezioni?: string | null
          offerta_attuale?: string | null
          offerta_secondaria?: string | null
          ordini_mese?: number | null
          ore_per_attivita?: Json | null
          ore_percorso?: string | null
          ore_social?: string | null
          parole?: Json | null
          paure?: string | null
          perche_ora?: string | null
          presentazione?: string | null
          priorita_crescita?: string | null
          processo_vendita?: string | null
          processo_vendita_canali?: Json | null
          prove?: Json | null
          prove_testo?: string | null
          riepilogo?: string | null
          riepilogo_correzione?: string | null
          riferimenti?: string | null
          ritorno?: string | null
          schermata?: string | null
          sezione_indice?: number | null
          social?: string | null
          spesa_media?: number | null
          stato?: string
          tentativi_passati?: string | null
          tipo?: string | null
          tipo_principale?: string | null
          updated_at?: string
          views_medie?: number | null
          vincoli_camera?: string | null
        }
        Update: {
          abbonamenti?: Json | null
          acquirente_utente?: string | null
          anti_cliente?: string | null
          attivita_breve?: string | null
          attivita_pesanti?: Json | null
          avatar_ipotesi?: string | null
          blocco_partenza?: Json | null
          blocco_partenza_testo?: string | null
          camera_agio?: number | null
          canali_acquisizione?: Json | null
          capacita?: string | null
          chiarimenti_fatti?: boolean
          ciclo_vendita?: string | null
          cliente_migliore?: string | null
          clienti?: string | null
          clienti_da_social?: number | null
          collo_bottiglia?: string | null
          competenza_obiettivo?: string | null
          consegna?: string | null
          contenuti_migliori?: string | null
          conversione?: number | null
          created_at?: string
          da_evitare?: string | null
          decisore?: string | null
          diagnosi_cliente?: string | null
          disponibilita_call?: Json | null
          dispositivo?: string | null
          domande_ricevute?: string | null
          esperienze_prova?: string | null
          fatturato_fascia?: string | null
          follower?: number | null
          frequenza?: number | null
          ia_uso?: string | null
          id?: string
          inviato_il?: string | null
          lettura_errore?: string | null
          link_profili?: Json | null
          margine?: number | null
          materiali_testo?: string | null
          mercato?: string | null
          messaggi_tipici?: string | null
          nome?: string | null
          nome_attivita?: string | null
          non_delegabile?: string | null
          obiettivo_6_mesi?: string | null
          obiezioni?: string | null
          offerta_attuale?: string | null
          offerta_secondaria?: string | null
          ordini_mese?: number | null
          ore_per_attivita?: Json | null
          ore_percorso?: string | null
          ore_social?: string | null
          parole?: Json | null
          paure?: string | null
          perche_ora?: string | null
          presentazione?: string | null
          priorita_crescita?: string | null
          processo_vendita?: string | null
          processo_vendita_canali?: Json | null
          prove?: Json | null
          prove_testo?: string | null
          riepilogo?: string | null
          riepilogo_correzione?: string | null
          riferimenti?: string | null
          ritorno?: string | null
          schermata?: string | null
          sezione_indice?: number | null
          social?: string | null
          spesa_media?: number | null
          stato?: string
          tentativi_passati?: string | null
          tipo?: string | null
          tipo_principale?: string | null
          updated_at?: string
          views_medie?: number | null
          vincoli_camera?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_onboarding_id_fkey1"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_onboarding_id_fkey1"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "vista_clienti"
            referencedColumns: ["id"]
          },
        ]
      }
      data_onboarding_v2_old: {
        Row: {
          abbonamenti: Json | null
          anti_cliente: string | null
          attivita_odiata: string | null
          auto_diagnosi: string | null
          business_descrizione: string | null
          cliente_migliore: string | null
          comfort_camera: string | null
          competenza_desiderata: string | null
          contenuti_top: string | null
          cosa_evitare: string | null
          created_at: string
          disponibilita: string | null
          dispositivo: string | null
          dove_si_blocca: string | null
          fatturato_mensile: string | null
          follower_e_views: string | null
          id: string
          inviato_il: string | null
          messaggi_tipici: string | null
          obiettivo_6_mesi: string | null
          offerta_attuale: string | null
          ore_admin: number | null
          ore_clienti: number | null
          ore_dm: number | null
          ore_editing: number | null
          ore_idee: number | null
          ore_pubblicazione: number | null
          ore_riprese: number | null
          ore_scrittura: number | null
          perche_adesso: string | null
          profili_social: Json | null
          provenienza_clienti: Json | null
          riferimenti: string | null
          schermata: string | null
          sezione_indice: number | null
          stato: string
          strumenti_ia: string | null
          tentativi_passati: string | null
          updated_at: string
          vendita_processo: string | null
        }
        Insert: {
          abbonamenti?: Json | null
          anti_cliente?: string | null
          attivita_odiata?: string | null
          auto_diagnosi?: string | null
          business_descrizione?: string | null
          cliente_migliore?: string | null
          comfort_camera?: string | null
          competenza_desiderata?: string | null
          contenuti_top?: string | null
          cosa_evitare?: string | null
          created_at?: string
          disponibilita?: string | null
          dispositivo?: string | null
          dove_si_blocca?: string | null
          fatturato_mensile?: string | null
          follower_e_views?: string | null
          id: string
          inviato_il?: string | null
          messaggi_tipici?: string | null
          obiettivo_6_mesi?: string | null
          offerta_attuale?: string | null
          ore_admin?: number | null
          ore_clienti?: number | null
          ore_dm?: number | null
          ore_editing?: number | null
          ore_idee?: number | null
          ore_pubblicazione?: number | null
          ore_riprese?: number | null
          ore_scrittura?: number | null
          perche_adesso?: string | null
          profili_social?: Json | null
          provenienza_clienti?: Json | null
          riferimenti?: string | null
          schermata?: string | null
          sezione_indice?: number | null
          stato?: string
          strumenti_ia?: string | null
          tentativi_passati?: string | null
          updated_at?: string
          vendita_processo?: string | null
        }
        Update: {
          abbonamenti?: Json | null
          anti_cliente?: string | null
          attivita_odiata?: string | null
          auto_diagnosi?: string | null
          business_descrizione?: string | null
          cliente_migliore?: string | null
          comfort_camera?: string | null
          competenza_desiderata?: string | null
          contenuti_top?: string | null
          cosa_evitare?: string | null
          created_at?: string
          disponibilita?: string | null
          dispositivo?: string | null
          dove_si_blocca?: string | null
          fatturato_mensile?: string | null
          follower_e_views?: string | null
          id?: string
          inviato_il?: string | null
          messaggi_tipici?: string | null
          obiettivo_6_mesi?: string | null
          offerta_attuale?: string | null
          ore_admin?: number | null
          ore_clienti?: number | null
          ore_dm?: number | null
          ore_editing?: number | null
          ore_idee?: number | null
          ore_pubblicazione?: number | null
          ore_riprese?: number | null
          ore_scrittura?: number | null
          perche_adesso?: string | null
          profili_social?: Json | null
          provenienza_clienti?: Json | null
          riferimenti?: string | null
          schermata?: string | null
          sezione_indice?: number | null
          stato?: string
          strumenti_ia?: string | null
          tentativi_passati?: string | null
          updated_at?: string
          vendita_processo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_onboarding_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_onboarding_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "vista_clienti"
            referencedColumns: ["id"]
          },
        ]
      }
      documenti_legali: {
        Row: {
          bozza: boolean
          documento: string
          id: string
          pubblicato_il: string
          testo: string
          titolo: string
          versione: number
        }
        Insert: {
          bozza?: boolean
          documento: string
          id?: string
          pubblicato_il?: string
          testo: string
          titolo: string
          versione: number
        }
        Update: {
          bozza?: boolean
          documento?: string
          id?: string
          pubblicato_il?: string
          testo?: string
          titolo?: string
          versione?: number
        }
        Relationships: []
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
      files_onboarding: {
        Row: {
          created_at: string
          dimensione: number
          id: string
          nome: string
          onboarding_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          dimensione: number
          id?: string
          nome: string
          onboarding_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          dimensione?: number
          id?: string
          nome?: string
          onboarding_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_onboarding_onboarding_id_fkey1"
            columns: ["onboarding_id"]
            isOneToOne: false
            referencedRelation: "data_onboarding"
            referencedColumns: ["id"]
          },
        ]
      }
      files_onboarding_v2_old: {
        Row: {
          created_at: string
          dimensione: number
          id: string
          nome: string
          onboarding_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          dimensione: number
          id?: string
          nome: string
          onboarding_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          dimensione?: number
          id?: string
          nome?: string
          onboarding_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_onboarding_onboarding_id_fkey"
            columns: ["onboarding_id"]
            isOneToOne: false
            referencedRelation: "data_onboarding_v2_old"
            referencedColumns: ["id"]
          },
        ]
      }
      follower_rilevazioni: {
        Row: {
          cliente_id: string
          created_at: string
          follower: number
          id: string
          origine: string
          piattaforma: string
          post_totali: number | null
          profilo: string | null
          rilevata_il: string
          seguiti: number | null
        }
        Insert: {
          cliente_id: string
          created_at?: string
          follower: number
          id?: string
          origine?: string
          piattaforma?: string
          post_totali?: number | null
          profilo?: string | null
          rilevata_il?: string
          seguiti?: number | null
        }
        Update: {
          cliente_id?: string
          created_at?: string
          follower?: number
          id?: string
          origine?: string
          piattaforma?: string
          post_totali?: number | null
          profilo?: string | null
          rilevata_il?: string
          seguiti?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "follower_rilevazioni_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follower_rilevazioni_cliente_id_fkey"
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
      idee: {
        Row: {
          cliente_id: string
          contenuto_id: string | null
          created_at: string
          hook: string | null
          id: string
          messaggio_id: string | null
          origine: string
          riferimenti: string[]
          script: string | null
          sessione_id: string | null
          stato: string
          tipologia: string | null
          titolo: string
          updated_at: string
        }
        Insert: {
          cliente_id: string
          contenuto_id?: string | null
          created_at?: string
          hook?: string | null
          id?: string
          messaggio_id?: string | null
          origine?: string
          riferimenti?: string[]
          script?: string | null
          sessione_id?: string | null
          stato?: string
          tipologia?: string | null
          titolo: string
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          contenuto_id?: string | null
          created_at?: string
          hook?: string | null
          id?: string
          messaggio_id?: string | null
          origine?: string
          riferimenti?: string[]
          script?: string | null
          sessione_id?: string | null
          stato?: string
          tipologia?: string | null
          titolo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "idee_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idee_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vista_clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idee_contenuto_id_fkey"
            columns: ["contenuto_id"]
            isOneToOne: false
            referencedRelation: "contenuti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idee_messaggio_id_fkey"
            columns: ["messaggio_id"]
            isOneToOne: false
            referencedRelation: "idee_messaggi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idee_sessione_id_fkey"
            columns: ["sessione_id"]
            isOneToOne: false
            referencedRelation: "idee_sessioni"
            referencedColumns: ["id"]
          },
        ]
      }
      idee_messaggi: {
        Row: {
          contenuto: string
          created_at: string
          errore: string | null
          id: string
          modello: string | null
          ricerca_id: string | null
          ruolo: string
          sessione_id: string
          stato: string
          stile_id: string | null
          updated_at: string
        }
        Insert: {
          contenuto?: string
          created_at?: string
          errore?: string | null
          id?: string
          modello?: string | null
          ricerca_id?: string | null
          ruolo: string
          sessione_id: string
          stato?: string
          stile_id?: string | null
          updated_at?: string
        }
        Update: {
          contenuto?: string
          created_at?: string
          errore?: string | null
          id?: string
          modello?: string | null
          ricerca_id?: string | null
          ruolo?: string
          sessione_id?: string
          stato?: string
          stile_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "idee_messaggi_ricerca_id_fkey"
            columns: ["ricerca_id"]
            isOneToOne: false
            referencedRelation: "ricerche_tiktok"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idee_messaggi_sessione_id_fkey"
            columns: ["sessione_id"]
            isOneToOne: false
            referencedRelation: "idee_sessioni"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idee_messaggi_stile_id_fkey"
            columns: ["stile_id"]
            isOneToOne: false
            referencedRelation: "stili"
            referencedColumns: ["id"]
          },
        ]
      }
      idee_sessioni: {
        Row: {
          cliente_id: string
          created_at: string
          id: string
          stato: string
          titolo: string
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          id?: string
          stato?: string
          titolo: string
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          id?: string
          stato?: string
          titolo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "idee_sessioni_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idee_sessioni_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vista_clienti"
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
      offerta: {
        Row: {
          ancora: string | null
          avatar_id: string | null
          bonus: string[]
          buchi_credibilita: string[]
          cliente_id: string
          clienti_attuali: string | null
          completato_il: string | null
          created_at: string
          da_confermare: string[]
          erogazione: string | null
          frase_presentazione: string | null
          garanzia: string | null
          id: string
          incluso: string[]
          lettura: string | null
          modello: string | null
          modello_prezzo_attuale: string | null
          nome: string | null
          nomi_alternativi: string[]
          non_incluso: string[]
          obiezioni_risposte: string[]
          ostacoli_soluzioni: string[]
          per_chi: string | null
          permanenza_uscita: string | null
          piano_validazione: string | null
          posizionamento: string | null
          prezzo: string | null
          prezzo_precedente: string | null
          prove: string[]
          ragionamento_prezzo: string | null
          riferimenti_mercato: string[]
          rischio: string | null
          scala_cuore: string | null
          scala_entrata: string | null
          scala_gratis: string | null
          scala_vetta: string | null
          scarsita_urgenza: string | null
          snapshot: string | null
          stack: string[]
          stato: string
          stato_partenza: string | null
          tipo: string | null
          trasformazione: string | null
          unita: string | null
          updated_at: string
          valore_risultato: string | null
        }
        Insert: {
          ancora?: string | null
          avatar_id?: string | null
          bonus?: string[]
          buchi_credibilita?: string[]
          cliente_id: string
          clienti_attuali?: string | null
          completato_il?: string | null
          created_at?: string
          da_confermare?: string[]
          erogazione?: string | null
          frase_presentazione?: string | null
          garanzia?: string | null
          id?: string
          incluso?: string[]
          lettura?: string | null
          modello?: string | null
          modello_prezzo_attuale?: string | null
          nome?: string | null
          nomi_alternativi?: string[]
          non_incluso?: string[]
          obiezioni_risposte?: string[]
          ostacoli_soluzioni?: string[]
          per_chi?: string | null
          permanenza_uscita?: string | null
          piano_validazione?: string | null
          posizionamento?: string | null
          prezzo?: string | null
          prezzo_precedente?: string | null
          prove?: string[]
          ragionamento_prezzo?: string | null
          riferimenti_mercato?: string[]
          rischio?: string | null
          scala_cuore?: string | null
          scala_entrata?: string | null
          scala_gratis?: string | null
          scala_vetta?: string | null
          scarsita_urgenza?: string | null
          snapshot?: string | null
          stack?: string[]
          stato?: string
          stato_partenza?: string | null
          tipo?: string | null
          trasformazione?: string | null
          unita?: string | null
          updated_at?: string
          valore_risultato?: string | null
        }
        Update: {
          ancora?: string | null
          avatar_id?: string | null
          bonus?: string[]
          buchi_credibilita?: string[]
          cliente_id?: string
          clienti_attuali?: string | null
          completato_il?: string | null
          created_at?: string
          da_confermare?: string[]
          erogazione?: string | null
          frase_presentazione?: string | null
          garanzia?: string | null
          id?: string
          incluso?: string[]
          lettura?: string | null
          modello?: string | null
          modello_prezzo_attuale?: string | null
          nome?: string | null
          nomi_alternativi?: string[]
          non_incluso?: string[]
          obiezioni_risposte?: string[]
          ostacoli_soluzioni?: string[]
          per_chi?: string | null
          permanenza_uscita?: string | null
          piano_validazione?: string | null
          posizionamento?: string | null
          prezzo?: string | null
          prezzo_precedente?: string | null
          prove?: string[]
          ragionamento_prezzo?: string | null
          riferimenti_mercato?: string[]
          rischio?: string | null
          scala_cuore?: string | null
          scala_entrata?: string | null
          scala_gratis?: string | null
          scala_vetta?: string | null
          scarsita_urgenza?: string | null
          snapshot?: string | null
          stack?: string[]
          stato?: string
          stato_partenza?: string | null
          tipo?: string | null
          trasformazione?: string | null
          unita?: string | null
          updated_at?: string
          valore_risultato?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offerta_avatar_id_fkey"
            columns: ["avatar_id"]
            isOneToOne: false
            referencedRelation: "avatar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offerta_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offerta_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vista_clienti"
            referencedColumns: ["id"]
          },
        ]
      }
      offerta_diagnosi: {
        Row: {
          created_at: string
          credibilita_erogabilita: string | null
          da_validare: string[]
          equazione_valore: string | null
          nodo_centrale: string | null
          offerta_id: string
          priorita_operativa: string | null
          quadro: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          credibilita_erogabilita?: string | null
          da_validare?: string[]
          equazione_valore?: string | null
          nodo_centrale?: string | null
          offerta_id: string
          priorita_operativa?: string | null
          quadro?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          credibilita_erogabilita?: string | null
          da_validare?: string[]
          equazione_valore?: string | null
          nodo_centrale?: string | null
          offerta_id?: string
          priorita_operativa?: string | null
          quadro?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offerta_diagnosi_offerta_id_fkey"
            columns: ["offerta_id"]
            isOneToOne: true
            referencedRelation: "offerta"
            referencedColumns: ["id"]
          },
        ]
      }
      offerta_messaggi: {
        Row: {
          contenuto: string
          created_at: string
          errore: string | null
          id: string
          modello: string | null
          offerta_id: string
          ruolo: string
          stato: string
          updated_at: string
        }
        Insert: {
          contenuto?: string
          created_at?: string
          errore?: string | null
          id?: string
          modello?: string | null
          offerta_id: string
          ruolo: string
          stato?: string
          updated_at?: string
        }
        Update: {
          contenuto?: string
          created_at?: string
          errore?: string | null
          id?: string
          modello?: string | null
          offerta_id?: string
          ruolo?: string
          stato?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offerta_messaggi_offerta_id_fkey"
            columns: ["offerta_id"]
            isOneToOne: false
            referencedRelation: "offerta"
            referencedColumns: ["id"]
          },
        ]
      }
      offerte: {
        Row: {
          attiva: boolean
          created_at: string
          id: string
          modello: string
          nome: string
          prezzo: number
          updated_at: string
        }
        Insert: {
          attiva?: boolean
          created_at?: string
          id?: string
          modello: string
          nome: string
          prezzo: number
          updated_at?: string
        }
        Update: {
          attiva?: boolean
          created_at?: string
          id?: string
          modello?: string
          nome?: string
          prezzo?: number
          updated_at?: string
        }
        Relationships: []
      }
      onboarding_chiarimenti: {
        Row: {
          campo: string
          cliente_id: string
          created_at: string
          domanda: string
          id: string
          ordine: number
          risposta: string | null
          updated_at: string
        }
        Insert: {
          campo: string
          cliente_id: string
          created_at?: string
          domanda: string
          id?: string
          ordine: number
          risposta?: string | null
          updated_at?: string
        }
        Update: {
          campo?: string
          cliente_id?: string
          created_at?: string
          domanda?: string
          id?: string
          ordine?: number
          risposta?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_chiarimenti_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "data_onboarding"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_lettura: {
        Row: {
          chiarezza_offerta: string | null
          collo_bottiglia: string | null
          created_at: string
          criticita: string[]
          da_validare_in_call: string[]
          domande_chiarimento: Json
          fase_economica: string | null
          giro: number
          gruppo_ia: string | null
          id: string
          modello: string | null
          nodo_centrale: string | null
          note_avatar: string | null
          note_offerta: string | null
          opinioni_vs_fatti: Json
          perche_nodo_centrale: string | null
          priorita_operativa: string | null
          punti_di_forza: string[]
          snapshot: string | null
          updated_at: string
          urgenza: string | null
        }
        Insert: {
          chiarezza_offerta?: string | null
          collo_bottiglia?: string | null
          created_at?: string
          criticita?: string[]
          da_validare_in_call?: string[]
          domande_chiarimento?: Json
          fase_economica?: string | null
          giro?: number
          gruppo_ia?: string | null
          id: string
          modello?: string | null
          nodo_centrale?: string | null
          note_avatar?: string | null
          note_offerta?: string | null
          opinioni_vs_fatti?: Json
          perche_nodo_centrale?: string | null
          priorita_operativa?: string | null
          punti_di_forza?: string[]
          snapshot?: string | null
          updated_at?: string
          urgenza?: string | null
        }
        Update: {
          chiarezza_offerta?: string | null
          collo_bottiglia?: string | null
          created_at?: string
          criticita?: string[]
          da_validare_in_call?: string[]
          domande_chiarimento?: Json
          fase_economica?: string | null
          giro?: number
          gruppo_ia?: string | null
          id?: string
          modello?: string | null
          nodo_centrale?: string | null
          note_avatar?: string | null
          note_offerta?: string | null
          opinioni_vs_fatti?: Json
          perche_nodo_centrale?: string | null
          priorita_operativa?: string | null
          punti_di_forza?: string[]
          snapshot?: string | null
          updated_at?: string
          urgenza?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_lettura_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "data_onboarding"
            referencedColumns: ["id"]
          },
        ]
      }
      pubblicazioni: {
        Row: {
          cliente_id: string
          codice_esterno: string | null
          contenuto_id: string | null
          created_at: string
          id: string
          note: string | null
          origine: string
          piattaforme: string[]
          pubblicata_il: string | null
          sincronizzata_il: string | null
          titolo: string
          updated_at: string
          url: string | null
        }
        Insert: {
          cliente_id: string
          codice_esterno?: string | null
          contenuto_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          origine?: string
          piattaforme?: string[]
          pubblicata_il?: string | null
          sincronizzata_il?: string | null
          titolo: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          cliente_id?: string
          codice_esterno?: string | null
          contenuto_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          origine?: string
          piattaforme?: string[]
          pubblicata_il?: string | null
          sincronizzata_il?: string | null
          titolo?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pubblicazioni_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pubblicazioni_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vista_clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pubblicazioni_contenuto_id_fkey"
            columns: ["contenuto_id"]
            isOneToOne: true
            referencedRelation: "contenuti"
            referencedColumns: ["id"]
          },
        ]
      }
      pubblicazioni_metriche: {
        Row: {
          commenti: number | null
          created_at: string
          creato_da: string | null
          id: string
          mi_piace: number | null
          origine: string
          piattaforma: string
          pubblicazione_id: string
          rilevata_il: string
          visualizzazioni: number | null
        }
        Insert: {
          commenti?: number | null
          created_at?: string
          creato_da?: string | null
          id?: string
          mi_piace?: number | null
          origine?: string
          piattaforma: string
          pubblicazione_id: string
          rilevata_il?: string
          visualizzazioni?: number | null
        }
        Update: {
          commenti?: number | null
          created_at?: string
          creato_da?: string | null
          id?: string
          mi_piace?: number | null
          origine?: string
          piattaforma?: string
          pubblicazione_id?: string
          rilevata_il?: string
          visualizzazioni?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pubblicazioni_metriche_creato_da_fkey"
            columns: ["creato_da"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pubblicazioni_metriche_pubblicazione_id_fkey"
            columns: ["pubblicazione_id"]
            isOneToOne: false
            referencedRelation: "pubblicazioni"
            referencedColumns: ["id"]
          },
        ]
      }
      ricerche_tiktok: {
        Row: {
          apify_run_id: string | null
          avviso: string | null
          cliente_id: string
          completata_il: string | null
          created_at: string
          errore: string | null
          id: string
          keyword: string[]
          lingua_target: string
          lingue: string[]
          metodo: string
          modello: string | null
          osservazioni: string[]
          quanti: number
          raccolti: number | null
          recenti: number | null
          soglia_dal: string | null
          stato: string
          tema: string
          updated_at: string
        }
        Insert: {
          apify_run_id?: string | null
          avviso?: string | null
          cliente_id: string
          completata_il?: string | null
          created_at?: string
          errore?: string | null
          id?: string
          keyword: string[]
          lingua_target?: string
          lingue?: string[]
          metodo?: string
          modello?: string | null
          osservazioni?: string[]
          quanti?: number
          raccolti?: number | null
          recenti?: number | null
          soglia_dal?: string | null
          stato?: string
          tema: string
          updated_at?: string
        }
        Update: {
          apify_run_id?: string | null
          avviso?: string | null
          cliente_id?: string
          completata_il?: string | null
          created_at?: string
          errore?: string | null
          id?: string
          keyword?: string[]
          lingua_target?: string
          lingue?: string[]
          metodo?: string
          modello?: string | null
          osservazioni?: string[]
          quanti?: number
          raccolti?: number | null
          recenti?: number | null
          soglia_dal?: string | null
          stato?: string
          tema?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ricerche_tiktok_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ricerche_tiktok_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vista_clienti"
            referencedColumns: ["id"]
          },
        ]
      }
      ricerche_tiktok_video: {
        Row: {
          autore: string | null
          created_at: string
          da_non_replicare: boolean
          di_cosa_parla: string | null
          didascalia: string | null
          fuori_tema: boolean
          id: string
          lingua: string | null
          mi_piace: number | null
          posizione: number
          pubblicato_il: string | null
          query: string | null
          ricerca_id: string
          senza_didascalia: boolean
          sezione: string
          solo_hashtag: boolean
          sponsorizzato: boolean
          url: string
          visualizzazioni: number | null
        }
        Insert: {
          autore?: string | null
          created_at?: string
          da_non_replicare?: boolean
          di_cosa_parla?: string | null
          didascalia?: string | null
          fuori_tema?: boolean
          id?: string
          lingua?: string | null
          mi_piace?: number | null
          posizione: number
          pubblicato_il?: string | null
          query?: string | null
          ricerca_id: string
          senza_didascalia?: boolean
          sezione: string
          solo_hashtag?: boolean
          sponsorizzato?: boolean
          url: string
          visualizzazioni?: number | null
        }
        Update: {
          autore?: string | null
          created_at?: string
          da_non_replicare?: boolean
          di_cosa_parla?: string | null
          didascalia?: string | null
          fuori_tema?: boolean
          id?: string
          lingua?: string | null
          mi_piace?: number | null
          posizione?: number
          pubblicato_il?: string | null
          query?: string | null
          ricerca_id?: string
          senza_didascalia?: boolean
          sezione?: string
          solo_hashtag?: boolean
          sponsorizzato?: boolean
          url?: string
          visualizzazioni?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ricerche_tiktok_video_ricerca_id_fkey"
            columns: ["ricerca_id"]
            isOneToOne: false
            referencedRelation: "ricerche_tiktok"
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
      stili: {
        Row: {
          cliente_id: string
          created_at: string
          descrizione: string | null
          errore: string | null
          id: string
          istruzioni: string
          modello: string | null
          note: string | null
          script_fonte: string[]
          stato: string
          titolo: string
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          descrizione?: string | null
          errore?: string | null
          id?: string
          istruzioni?: string
          modello?: string | null
          note?: string | null
          script_fonte?: string[]
          stato?: string
          titolo: string
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          descrizione?: string | null
          errore?: string | null
          id?: string
          istruzioni?: string
          modello?: string | null
          note?: string | null
          script_fonte?: string[]
          stato?: string
          titolo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stili_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stili_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vista_clienti"
            referencedColumns: ["id"]
          },
        ]
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
          da_attivare: boolean | null
          data_inizio: string | null
          di_wesley_aperti: number | null
          email: string | null
          fase: string | null
          fase_economica: string | null
          fatti: number | null
          fatture_da_pagare: number | null
          fatture_prossima_scadenza: string | null
          fatture_totali: number | null
          hub_creato_il: string | null
          id: string | null
          in_corso: number | null
          instagram: string | null
          nodo_centrale: string | null
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
      aura_help_allowed:
        | {
            Args: { p_max: number; p_user: string; p_window_secs: number }
            Returns: boolean
          }
        | {
            Args: {
              p_max: number
              p_scope: string
              p_user: string
              p_window_secs: number
            }
            Returns: boolean
          }
      crm_accetta: {
        Args: { p_caselle: boolean[]; p_versione: number }
        Returns: string
      }
      crm_contatti_assistenza: {
        Args: { p_cliente: string; p_motivo: string }
        Returns: {
          arrivato_il: string
          canale: string
          email: string
          nome: string
          offerta: string
          stato: string
          telefono: string
          valore: number
        }[]
      }
      crm_esporta_contatti: {
        Args: never
        Returns: {
          arrivato_il: string
          canale: string
          email: string
          nome: string
          offerta: string
          stato: string
          telefono: string
          valore: number
        }[]
      }
      crm_stato: {
        Args: never
        Returns: {
          accettata_il: string
          attivo: boolean
          versione_accettata: number
          versione_corrente: number
        }[]
      }
      salva_concorrente: {
        Args: {
          p_cosa_fa: string
          p_id: string
          p_nome: string
          p_social: string[]
          p_video_descrizione: string[]
          p_video_url: string[]
        }
        Returns: string
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

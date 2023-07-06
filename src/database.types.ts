export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string | null
          description: string | null
          discord_channel_id: string | null
          id: number
          max_players: number | null
          min_players: number
          name: string
          platforms: string[]
          price: number | null
          price_type: string | null
          recommended_players: number | null
          storage_required: string | null
          summary: string | null
          tags: string[]
          thumbnail_urls: string[]
          type: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          discord_channel_id?: string | null
          id?: number
          max_players?: number | null
          min_players?: number
          name: string
          platforms: string[]
          price?: number | null
          price_type?: string | null
          recommended_players?: number | null
          storage_required?: string | null
          summary?: string | null
          tags?: string[]
          thumbnail_urls?: string[]
          type: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          discord_channel_id?: string | null
          id?: number
          max_players?: number | null
          min_players?: number
          name?: string
          platforms?: string[]
          price?: number | null
          price_type?: string | null
          recommended_players?: number | null
          storage_required?: string | null
          summary?: string | null
          tags?: string[]
          thumbnail_urls?: string[]
          type?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string | null
          end_at: string | null
          id: number
          start_at: string
        }
        Insert: {
          created_at?: string | null
          end_at?: string | null
          id?: number
          start_at: string
        }
        Update: {
          created_at?: string | null
          end_at?: string | null
          id?: number
          start_at?: string
        }
        Relationships: []
      }
      player_activity_metadata: {
        Row: {
          activity_id: number
          created_at: string | null
          id: number
          is_favorite: boolean
          is_setup: boolean | null
          player_id: string
        }
        Insert: {
          activity_id: number
          created_at?: string | null
          id?: number
          is_favorite?: boolean
          is_setup?: boolean | null
          player_id: string
        }
        Update: {
          activity_id?: number
          created_at?: string | null
          id?: number
          is_favorite?: boolean
          is_setup?: boolean | null
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_activity_metadata_activity_id_fkey"
            columns: ["activity_id"]
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_activity_metadata_player_id_fkey"
            columns: ["player_id"]
            referencedRelation: "players"
            referencedColumns: ["id"]
          }
        ]
      }
      players: {
        Row: {
          created_at: string | null
          id: string
          is_verified: boolean
          name: string | null
          platforms: string[]
          steam_profile_url: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          is_verified?: boolean
          name?: string | null
          platforms?: string[]
          steam_profile_url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_verified?: boolean
          name?: string | null
          platforms?: string[]
          steam_profile_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      rsvps: {
        Row: {
          created_at: string | null
          event_id: number
          id: number
          player_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: number
          id?: number
          player_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: number
          id?: number
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rsvps_event_id_fkey"
            columns: ["event_id"]
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsvps_player_id_fkey"
            columns: ["player_id"]
            referencedRelation: "players"
            referencedColumns: ["id"]
          }
        ]
      }
      votes: {
        Row: {
          activity_id: number
          created_at: string | null
          event_id: number
          id: number
          player_id: string
        }
        Insert: {
          activity_id: number
          created_at?: string | null
          event_id: number
          id?: number
          player_id: string
        }
        Update: {
          activity_id?: number
          created_at?: string | null
          event_id?: number
          id?: number
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_activity_id_fkey"
            columns: ["activity_id"]
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_event_id_fkey"
            columns: ["event_id"]
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_player_id_fkey"
            columns: ["player_id"]
            referencedRelation: "players"
            referencedColumns: ["id"]
          }
        ]
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
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buckets_owner_fkey"
            columns: ["owner"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          path_tokens: string[] | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objects_owner_fkey"
            columns: ["owner"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: {
          bucketid: string
          name: string
          owner: string
          metadata: Json
        }
        Returns: undefined
      }
      extension: {
        Args: {
          name: string
        }
        Returns: string
      }
      filename: {
        Args: {
          name: string
        }
        Returns: string
      }
      foldername: {
        Args: {
          name: string
        }
        Returns: unknown
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          size: number
          bucket_id: string
        }[]
      }
      search: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
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

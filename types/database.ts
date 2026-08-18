/**
 * Tipos do banco.
 *
 * Escrito à mão porque a CLI do Supabase ainda não está linkada. Assim que
 * estiver, este arquivo passa a ser gerado por
 * `npx supabase gen types typescript --linked > types/database.ts`
 * e não deve mais ser editado na mão.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PapelOperador = "coordenacao" | "operador";
export type MacroRegiao = "R1" | "R2" | "R3";

export type Database = {
  public: {
    Tables: {
      operadores: {
        Row: {
          id: string;
          nome: string;
          papel: PapelOperador;
          criado_em: string;
        };
        Insert: {
          id: string;
          nome: string;
          papel?: PapelOperador;
          criado_em?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          papel?: PapelOperador;
          criado_em?: string;
        };
        Relationships: [];
      };
      bairros: {
        Row: {
          id: string;
          nome: string;
          eleitores: number;
          regiao: MacroRegiao;
        };
        Insert: {
          id?: string;
          nome: string;
          eleitores: number;
          regiao: MacroRegiao;
        };
        Update: {
          id?: string;
          nome?: string;
          eleitores?: number;
          regiao?: MacroRegiao;
        };
        Relationships: [];
      };
      locais_votacao: {
        Row: {
          id: string;
          nome: string;
          endereco: string | null;
          bairro_id: string;
          eleitores: number;
          secoes: number;
          regiao: MacroRegiao;
        };
        Insert: {
          id?: string;
          nome: string;
          endereco?: string | null;
          bairro_id: string;
          eleitores: number;
          secoes: number;
          regiao: MacroRegiao;
        };
        Update: {
          id?: string;
          nome?: string;
          endereco?: string | null;
          bairro_id?: string;
          eleitores?: number;
          secoes?: number;
          regiao?: MacroRegiao;
        };
        Relationships: [
          {
            foreignKeyName: "locais_votacao_bairro_id_fkey";
            columns: ["bairro_id"];
            referencedRelation: "bairros";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      validar_seed: {
        Args: Record<PropertyKey, never>;
        Returns: {
          verificacao: string;
          ok: boolean;
          esperado: string;
          encontrado: string;
          detalhe: string;
        }[];
      };
    };
    Enums: {
      papel_operador: PapelOperador;
      macro_regiao: MacroRegiao;
    };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Operador = Database["public"]["Tables"]["operadores"]["Row"];
export type Bairro = Database["public"]["Tables"]["bairros"]["Row"];
export type LocalVotacao = Database["public"]["Tables"]["locais_votacao"]["Row"];
export type CheckSeed =
  Database["public"]["Functions"]["validar_seed"]["Returns"][number];

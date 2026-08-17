/**
 * Tipos do banco.
 *
 * Escrito à mão no Bloco 1 porque a CLI do Supabase ainda não está linkada.
 * Assim que estiver, este arquivo passa a ser gerado por
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
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      papel_operador: PapelOperador;
    };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Operador = Database["public"]["Tables"]["operadores"]["Row"];

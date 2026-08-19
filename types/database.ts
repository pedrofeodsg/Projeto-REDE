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
export type NivelPessoa = "coordenacao" | "lideranca" | "apoiador";
export type OrigemPessoa = "link" | "admin";
export type TemperaturaCadastro =
  | "aguardando"
  | "afastado"
  | "frio"
  | "quente"
  | "muito_quente"
  | "engajado";

type LinhaPessoa = {
  id: string;
  nome: string;
  telefone: string;
  nivel: NivelPessoa;
  indicado_por: string | null;
  bairro_moradia_id: string | null;
  local_votacao_id: string | null;
  fora_do_municipio: boolean;
  instagram_handle: string | null;
  slug: string | null;
  meta: number;
  linha_pessoal: string | null;
  secao: string | null;
  origem: OrigemPessoa;
  ativo: boolean;
  criado_em: string;
};

export type Database = {
  public: {
    Tables: {
      operadores: {
        Row: { id: string; nome: string; papel: PapelOperador; criado_em: string };
        Insert: { id: string; nome: string; papel?: PapelOperador; criado_em?: string };
        Update: { id?: string; nome?: string; papel?: PapelOperador; criado_em?: string };
        Relationships: [];
      };
      bairros: {
        Row: { id: string; nome: string; eleitores: number; regiao: MacroRegiao };
        Insert: { id?: string; nome: string; eleitores: number; regiao: MacroRegiao };
        Update: { id?: string; nome?: string; eleitores?: number; regiao?: MacroRegiao };
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
      pessoas: {
        Row: LinhaPessoa;
        // Só nome e telefone são obrigatórios na escrita: o resto tem default
        // no banco. Telefone entra sempre pela normalizarTelefone().
        Insert: Partial<Omit<LinhaPessoa, "nome" | "telefone">> &
          Pick<LinhaPessoa, "nome" | "telefone">;
        Update: Partial<LinhaPessoa>;
        Relationships: [
          {
            foreignKeyName: "pessoas_indicado_por_fkey";
            columns: ["indicado_por"];
            referencedRelation: "pessoas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pessoas_bairro_moradia_id_fkey";
            columns: ["bairro_moradia_id"];
            referencedRelation: "bairros";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pessoas_local_votacao_id_fkey";
            columns: ["local_votacao_id"];
            referencedRelation: "locais_votacao";
            referencedColumns: ["id"];
          },
        ];
      };
      conflitos_cadastro: {
        Row: {
          id: string;
          telefone: string;
          nome_tentado: string;
          lideranca_tentou_id: string | null;
          pessoa_existente_id: string | null;
          resolvido: boolean;
          criado_em: string;
        };
        Insert: {
          id?: string;
          telefone: string;
          nome_tentado: string;
          lideranca_tentou_id?: string | null;
          pessoa_existente_id?: string | null;
          resolvido?: boolean;
          criado_em?: string;
        };
        Update: {
          resolvido?: boolean;
        };
        Relationships: [];
      };
      templates_mensagem: {
        Row: {
          id: string;
          chave: string | null;
          nome: string;
          corpo: string;
          ativo: boolean;
          ordem: number;
        };
        Insert: {
          id?: string;
          chave?: string | null;
          nome: string;
          corpo: string;
          ativo?: boolean;
          ordem?: number;
        };
        Update: {
          chave?: string | null;
          nome?: string;
          corpo?: string;
          ativo?: boolean;
          ordem?: number;
        };
        Relationships: [];
      };
      envios: {
        Row: {
          id: string;
          pessoa_id: string;
          template_id: string | null;
          operador: string | null;
          enviado_em: string;
          confirmado: boolean;
        };
        Insert: {
          id?: string;
          pessoa_id: string;
          template_id?: string | null;
          operador?: string | null;
          enviado_em?: string;
          confirmado?: boolean;
        };
        Update: { confirmado?: boolean };
        Relationships: [];
      };
      tentativas_cadastro: {
        Row: { id: number; ip_hash: string; criado_em: string };
        Insert: { ip_hash: string; criado_em?: string };
        Update: { ip_hash?: string };
        Relationships: [];
      };
      tags: {
        Row: { id: string; nome: string; cor: string | null };
        Insert: { id?: string; nome: string; cor?: string | null };
        Update: { id?: string; nome?: string; cor?: string | null };
        Relationships: [];
      };
      pessoa_tags: {
        Row: { pessoa_id: string; tag_id: string };
        Insert: { pessoa_id: string; tag_id: string };
        Update: { pessoa_id?: string; tag_id?: string };
        Relationships: [
          {
            foreignKeyName: "pessoa_tags_pessoa_id_fkey";
            columns: ["pessoa_id"];
            referencedRelation: "pessoas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pessoa_tags_tag_id_fkey";
            columns: ["tag_id"];
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      v_liderancas: {
        Row: {
          id: string;
          nome: string;
          telefone: string;
          slug: string | null;
          meta: number;
          ativo: boolean;
          linha_pessoal: string | null;
          instagram_handle: string | null;
          local_votacao_id: string | null;
          local_nome: string | null;
          regiao: MacroRegiao | null;
          bairro_id: string | null;
          bairro_nome: string | null;
          cadastros: number;
          ultimo_cadastro: string | null;
          enviado_em: string | null;
          faltam: number;
          dias_parada: number | null;
          estado: TemperaturaCadastro;
        };
        Relationships: [];
      };
    };
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
      papel_atual: {
        Args: Record<PropertyKey, never>;
        Returns: PapelOperador;
      };
      calcular_temperatura: {
        Args: { p_pessoa_id: string };
        Returns: TemperaturaCadastro;
      };
    };
    Enums: {
      papel_operador: PapelOperador;
      macro_regiao: MacroRegiao;
      nivel_pessoa: NivelPessoa;
      origem_pessoa: OrigemPessoa;
      temperatura_cadastro: TemperaturaCadastro;
    };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Operador = Database["public"]["Tables"]["operadores"]["Row"];
export type Bairro = Database["public"]["Tables"]["bairros"]["Row"];
export type LocalVotacao = Database["public"]["Tables"]["locais_votacao"]["Row"];
export type Pessoa = Database["public"]["Tables"]["pessoas"]["Row"];
export type Tag = Database["public"]["Tables"]["tags"]["Row"];
export type TemplateMensagem =
  Database["public"]["Tables"]["templates_mensagem"]["Row"];
export type Envio = Database["public"]["Tables"]["envios"]["Row"];
export type LiderancaNaLista = Database["public"]["Views"]["v_liderancas"]["Row"];
export type CheckSeed =
  Database["public"]["Functions"]["validar_seed"]["Returns"][number];

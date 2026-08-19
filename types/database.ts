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
export type TipoEngajamento = "comentario" | "curtida" | "story_mention";
export type OrigemEngajamento = "api" | "importacao_manual";
export type TemperaturaDigital = "ativo" | "irregular" | "ausente";
export type TipoInteracao = "ligacao" | "visita" | "conversa" | "mensagem";
export type StatusDemanda =
  | "aberta"
  | "em_andamento"
  | "resolvida"
  | "sem_solucao";
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
      interacoes: {
        Row: {
          id: string;
          pessoa_id: string;
          tipo: TipoInteracao;
          canal: string | null;
          descricao: string;
          autor: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          pessoa_id: string;
          tipo: TipoInteracao;
          canal?: string | null;
          descricao: string;
          autor?: string | null;
          criado_em?: string;
        };
        Update: {
          tipo?: TipoInteracao;
          canal?: string | null;
          descricao?: string;
        };
        Relationships: [];
      };
      demandas: {
        Row: {
          id: string;
          pessoa_id: string;
          titulo: string;
          descricao: string | null;
          categoria: string | null;
          status: StatusDemanda;
          responsavel: string | null;
          aberta_em: string;
          resolvida_em: string | null;
        };
        Insert: {
          id?: string;
          pessoa_id: string;
          titulo: string;
          descricao?: string | null;
          categoria?: string | null;
          status?: StatusDemanda;
          responsavel?: string | null;
          aberta_em?: string;
          resolvida_em?: string | null;
        };
        Update: {
          titulo?: string;
          descricao?: string | null;
          categoria?: string | null;
          status?: StatusDemanda;
          responsavel?: string | null;
          resolvida_em?: string | null;
        };
        Relationships: [];
      };
      reatribuicoes: {
        Row: {
          id: string;
          pessoa_id: string;
          de_pessoa_id: string | null;
          para_pessoa_id: string | null;
          operador: string | null;
          motivo: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          pessoa_id: string;
          de_pessoa_id?: string | null;
          para_pessoa_id?: string | null;
          operador?: string | null;
          motivo?: string | null;
          criado_em?: string;
        };
        Update: { motivo?: string | null };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          url: string;
          publicado_em: string;
          legenda: string | null;
          curtidas_total: number | null;
          comentarios_total: number | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          url: string;
          publicado_em?: string;
          legenda?: string | null;
          curtidas_total?: number | null;
          comentarios_total?: number | null;
        };
        Update: {
          url?: string;
          publicado_em?: string;
          legenda?: string | null;
          curtidas_total?: number | null;
          comentarios_total?: number | null;
        };
        Relationships: [];
      };
      post_roster: {
        Row: { post_id: string; pessoa_id: string };
        Insert: { post_id: string; pessoa_id: string };
        Update: never;
        Relationships: [];
      };
      engajamentos: {
        Row: {
          id: string;
          post_id: string;
          handle_cru: string;
          pessoa_id: string | null;
          tipo: TipoEngajamento;
          texto: string | null;
          origem: OrigemEngajamento;
          capturado_em: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          handle_cru: string;
          pessoa_id?: string | null;
          tipo: TipoEngajamento;
          texto?: string | null;
          origem?: OrigemEngajamento;
          capturado_em?: string;
        };
        // handle_cru fora do Update de propósito: o trigger recusa a troca.
        Update: { pessoa_id?: string | null; texto?: string | null };
        Relationships: [];
      };
      recrutamento: {
        Row: { handle: string; operador: string | null; criado_em: string };
        Insert: { handle: string; operador?: string | null };
        Update: never;
        Relationships: [];
      };
      temperatura_historico: {
        Row: {
          id: string;
          pessoa_id: string;
          estado: TemperaturaCadastro;
          cadastros: number;
          calculado_em: string;
        };
        Insert: {
          id?: string;
          pessoa_id: string;
          estado: TemperaturaCadastro;
          cadastros?: number;
          calculado_em?: string;
        };
        Update: { cadastros?: number };
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
          selo: number;
        };
        Relationships: [];
      };
      v_penetracao_bairro: {
        Row: {
          id: string;
          nome: string;
          regiao: MacroRegiao;
          eleitores: number;
          cadastros: number;
          penetracao_pct: number | null;
          liderancas: number;
          locais: number;
        };
        Relationships: [];
      };
      v_penetracao_local: {
        Row: {
          id: string;
          nome: string;
          endereco: string | null;
          regiao: MacroRegiao;
          eleitores: number;
          secoes: number;
          bairro_id: string;
          bairro_nome: string;
          cadastros: number;
          penetracao_pct: number | null;
          liderancas_ancora: number;
          buraco: boolean;
          sobreposicao: boolean;
        };
        Relationships: [];
      };
      v_cobertura_regiao: {
        Row: {
          regiao: MacroRegiao;
          eleitores: number;
          eleitorado_pct: number | null;
          cadastros: number;
          cadastros_pct: number | null;
          desvio_pp: number | null;
        };
        Relationships: [];
      };
      v_demandas: {
        Row: {
          id: string;
          titulo: string;
          descricao: string | null;
          categoria: string | null;
          status: StatusDemanda;
          responsavel: string | null;
          aberta_em: string;
          resolvida_em: string | null;
          dias_aberta: number;
          pessoa_id: string;
          pessoa_nome: string;
          pessoa_telefone: string;
          pessoa_nivel: NivelPessoa;
          bairro_nome: string | null;
          responsavel_nome: string | null;
        };
        Relationships: [];
      };
      v_lideranca_digital: {
        Row: {
          pessoa_id: string;
          nome: string;
          telefone: string;
          slug: string | null;
          instagram_handle: string | null;
          janela: number;
          presencas: number;
          faltas: number;
          estado_digital: TemperaturaDigital | null;
        };
        Relationships: [];
      };
      v_handles_sem_vinculo: {
        Row: {
          handle_cru: string;
          engajamentos: number;
          posts: number;
          ultimo: string;
          marcado: boolean;
        };
        Relationships: [];
      };
      v_ranking_semanal: {
        Row: {
          id: string;
          nome: string;
          novos_na_semana: number;
          cadastros: number;
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
      calcular_temperatura_digital: {
        Args: { p_pessoa_id: string };
        Returns: TemperaturaDigital | null;
      };
      gravar_snapshot_temperatura: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
    };
    Enums: {
      papel_operador: PapelOperador;
      macro_regiao: MacroRegiao;
      nivel_pessoa: NivelPessoa;
      origem_pessoa: OrigemPessoa;
      temperatura_cadastro: TemperaturaCadastro;
      tipo_interacao: TipoInteracao;
      status_demanda: StatusDemanda;
      tipo_engajamento: TipoEngajamento;
      origem_engajamento: OrigemEngajamento;
      temperatura_digital: TemperaturaDigital;
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
export type PenetracaoBairro =
  Database["public"]["Views"]["v_penetracao_bairro"]["Row"];
export type PenetracaoLocal =
  Database["public"]["Views"]["v_penetracao_local"]["Row"];
export type CoberturaRegiao =
  Database["public"]["Views"]["v_cobertura_regiao"]["Row"];
export type Interacao = Database["public"]["Tables"]["interacoes"]["Row"];
export type Demanda = Database["public"]["Tables"]["demandas"]["Row"];
export type DemandaNaFila = Database["public"]["Views"]["v_demandas"]["Row"];
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type Engajamento = Database["public"]["Tables"]["engajamentos"]["Row"];
export type LiderancaDigital =
  Database["public"]["Views"]["v_lideranca_digital"]["Row"];
export type HandleSemVinculo =
  Database["public"]["Views"]["v_handles_sem_vinculo"]["Row"];
export type Reatribuicao = Database["public"]["Tables"]["reatribuicoes"]["Row"];
export type RankingSemanal =
  Database["public"]["Views"]["v_ranking_semanal"]["Row"];
export type CheckSeed =
  Database["public"]["Functions"]["validar_seed"]["Returns"][number];

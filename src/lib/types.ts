// Hand-written types matching supabase/migrations/0001_init.sql.
// If the schema changes, prefer regenerating with:
//   npx supabase gen types typescript --project-id <ref> > src/lib/types.ts
// and re-adding the convenience aliases below.

// Real IUCN Red List categories (Phase 2 — see migrations/0002). Least
// Concern is the lowest-weight tier through Critically Endangered, the
// heaviest — see RARITY_TIER_STYLES in src/lib/design.ts for color coding.
export type RarityTier =
  | "Least Concern"
  | "Near Threatened"
  | "Vulnerable"
  | "Endangered"
  | "Critically Endangered";
export type TransactionType = "INITIAL_GRANT" | "MINING_REWARD" | "TRANSFER" | "PLEDGE";
export type TransactionStatus = "CONFIRMED" | "FAILED";
export type MiningSessionStatus = "ACTIVE" | "SETTLED";
export type AvatarId =
  | "octopus"
  | "turtle"
  | "seahorse"
  | "fish"
  | "crab"
  | "shrimp"
  | "jellyfish"
  | "starfish"
  | "seal";
export type ThemePreference = "light" | "dark" | "system";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          leaderboard_opt_in: boolean;
          avatar_id: AvatarId;
          theme_preference: ThemePreference;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string; email: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      species: {
        Row: {
          id: string;
          name: string;
          symbol: string;
          total_supply: number;
          circulating_supply: number;
          rarity_tier: RarityTier;
          initial_grant_amount: number;
          description: string | null;
          learn_more_url: string | null;
          scientific_name: string | null;
          image_url: string | null;
          worms_aphia_id: number | null;
          gbif_key: number | null;
          is_active: boolean;
          source_note: string | null;
          last_synced_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["species"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["species"]["Row"]>;
      };
      wallets: {
        Row: {
          id: string;
          user_id: string;
          species_id: string;
          balance: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["wallets"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["wallets"]["Row"]>;
      };
      transactions: {
        Row: {
          id: string;
          idempotency_key: string | null;
          from_wallet_id: string | null;
          to_wallet_id: string | null;
          species_id: string;
          amount: number;
          type: TransactionType;
          status: TransactionStatus;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["transactions"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["transactions"]["Row"]>;
      };
      mining_sessions: {
        Row: {
          id: string;
          user_id: string;
          species_id: string;
          started_at: string;
          ended_at: string | null;
          contribution_score: number | null;
          reward_amount: number | null;
          status: MiningSessionStatus;
        };
        Insert: Partial<Database["public"]["Tables"]["mining_sessions"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["mining_sessions"]["Row"]>;
      };
      pledges: {
        Row: {
          id: string;
          user_id: string;
          species_id: string;
          amount: number;
          cause_label: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["pledges"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["pledges"]["Row"]>;
      };
      impact_fund_log: {
        Row: {
          id: string;
          total_coins_pledged_at_time: number;
          amount_donated_inr: number;
          recipient_org: string;
          receipt_url: string | null;
          donated_at: string;
          note: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["impact_fund_log"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["impact_fund_log"]["Row"]>;
      };
      public_profiles: {
        Row: {
          id: string;
          display_name: string | null;
        };
        Insert: never;
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: {
      find_user_by_email: {
        Args: { p_email: string };
        Returns: string | null;
      };
      transfer_coins: {
        Args: {
          p_from_user_id: string;
          p_to_user_id: string;
          p_species_id: string;
          p_amount: number;
          p_idempotency_key: string;
        };
        Returns: string;
      };
      settle_mining_session: {
        Args: { p_session_id: string; p_contribution_score: number };
        Returns: number;
      };
      pledge_coins: {
        Args: {
          p_user_id: string;
          p_species_id: string;
          p_amount: number;
          p_cause_label: string;
        };
        Returns: string;
      };
      start_mining_session: {
        Args: { p_species_id: string };
        Returns: string;
      };
      get_leaderboard: {
        Args: Record<string, never>;
        Returns: { user_id: string; display_name: string; avatar_id: AvatarId; total_balance: number }[];
      };
      get_public_profile: {
        Args: { p_user_id: string };
        Returns: {
          display_name: string;
          avatar_id: AvatarId;
          species_name: string;
          species_symbol: string;
          rarity_tier: RarityTier;
          balance: number;
        }[];
      };
    };
  };
}

export type Species = Database["public"]["Tables"]["species"]["Row"];
export type Wallet = Database["public"]["Tables"]["wallets"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type MiningSession = Database["public"]["Tables"]["mining_sessions"]["Row"];
export type Pledge = Database["public"]["Tables"]["pledges"]["Row"];
export type ImpactFundLogEntry = Database["public"]["Tables"]["impact_fund_log"]["Row"];

export type WalletWithSpecies = Wallet & { species: Species };

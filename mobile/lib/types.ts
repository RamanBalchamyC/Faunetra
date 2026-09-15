// Trimmed mirror of the web app's src/lib/types.ts — same schema (see
// supabase/migrations/0001-0004 in the repo root), just the fields this
// app actually reads/writes. Keep in sync manually; this is a separate
// codebase from the Next.js app, not a shared package.

export type RarityTier =
  | "Least Concern"
  | "Near Threatened"
  | "Vulnerable"
  | "Endangered"
  | "Critically Endangered";

export type TransactionType = "INITIAL_GRANT" | "MINING_REWARD" | "TRANSFER" | "PLEDGE";
export type ThemePreference = "light" | "dark" | "system";

export type Species = {
  id: string;
  name: string;
  symbol: string;
  scientific_name: string | null;
  total_supply: number;
  circulating_supply: number;
  rarity_tier: RarityTier;
  image_url: string | null;
  is_active: boolean;
};

export type Wallet = {
  id: string;
  user_id: string;
  species_id: string;
  balance: number;
};

export type WalletWithSpecies = Wallet & { species: Species };

export type Transaction = {
  id: string;
  from_wallet_id: string | null;
  to_wallet_id: string | null;
  species_id: string;
  amount: number;
  type: TransactionType;
  created_at: string;
};

export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  country_code: string | null;
  theme_preference: ThemePreference;
  leaderboard_opt_in: boolean;
  current_streak: number;
  longest_streak: number;
  last_mined_date: string | null;
};

export type LeaderboardRow = {
  user_id: string;
  display_name: string;
  country_code: string | null;
  total_balance: number;
};

export type PublicProfileRow = {
  display_name: string;
  country_code: string | null;
  species_name: string;
  species_symbol: string;
  rarity_tier: RarityTier;
  balance: number;
};

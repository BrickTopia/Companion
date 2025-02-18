export type IngredientStatus = 'safe' | 'unsafe' | 'caution' | 'unknown';

export type IngredientCategory = 'grain' | 'dairy' | 'protein' | 'additive' | 'other';

export interface Ingredient {
  id: string;
  name: string;
  status: IngredientStatus;
  description: string;
  alternateNames: string[];
  scientificName?: string;
  category: IngredientCategory;
  tags: string[];
  lastUpdated: string;
  history?: {
    date: string;
    change: string;
  }[];
  aliases?: string[];
}

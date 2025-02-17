import { IngredientStatus } from './ingredients';

export interface ScannedLabel {
  id: string;
  dateScanned: string;
  originalText: string;
  ingredients: Array<{
    name: string;
    status: IngredientStatus;
  }>;
  imageData?: string;
} 
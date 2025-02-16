
import type { IngredientStatus } from "@/types/ingredients";

export const statusConfig: Record<IngredientStatus, { color: string; description: string }> = {
  safe: { 
    color: 'bg-green-500',
    description: 'Safe for celiac consumption'
  },
  risky: { 
    color: 'bg-yellow-500',
    description: 'May contain traces of gluten - verify source'
  },
  risk: { 
    color: 'bg-red-500',
    description: 'Contains gluten - unsafe for celiac consumption'
  },
  unknown: { 
    color: 'bg-gray-400',
    description: 'Status unknown - further verification needed'
  }
};

export const getStatusColor = (status: IngredientStatus) => statusConfig[status].color;

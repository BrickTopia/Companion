
import { Card } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Ingredient } from "@/types/ingredients";
import { getStatusColor, statusConfig } from "./config/statusConfig";

interface IngredientCardProps {
  ingredient: Ingredient;
  isFavorite: boolean;
  onToggleFavorite: (ingredient: Ingredient) => void;
  onClick: () => void;
}

export const IngredientCard = ({
  ingredient,
  isFavorite,
  onToggleFavorite,
  onClick,
}: IngredientCardProps) => {
  return (
    <Card 
      className="w-full hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between w-full p-4">
        <div className="flex items-center space-x-3 min-w-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${getStatusColor(ingredient.status)}`} />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm font-medium">{statusConfig[ingredient.status].description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-gray-800 text-left truncate">{ingredient.name}</h3>
            <p className="text-sm text-gray-600 text-left truncate">{ingredient.description}</p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(ingredient);
          }}
          className={`p-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0 ml-4 ${
            isFavorite ? 'text-red-500' : 'text-gray-400'
          }`}
          aria-label={`${isFavorite ? 'Remove from' : 'Add to'} favorites`}
        >
          <Heart 
            size={20} 
            fill={isFavorite ? "currentColor" : "none"}
          />
        </button>
      </div>
    </Card>
  );
};

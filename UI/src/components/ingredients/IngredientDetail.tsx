
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, MessageSquare } from "lucide-react";
import { useState } from "react";
import { FeedbackForm } from "./FeedbackForm";
import type { Ingredient } from "@/types/ingredients";

interface IngredientDetailProps {
  ingredient: Ingredient | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (ingredient: Ingredient) => void;
}

export const IngredientDetail = ({
  ingredient,
  isOpen,
  onClose,
  isFavorite,
  onToggleFavorite,
}: IngredientDetailProps) => {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  if (!ingredient) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{ingredient.name}</DialogTitle>
          {ingredient.scientificName && (
            <p className="text-sm italic text-gray-500">{ingredient.scientificName}</p>
          )}
          <DialogDescription className="text-sm text-gray-500">
            Detailed information about this ingredient
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
              ${ingredient.status === 'safe' ? 'bg-green-100 text-green-800' :
                ingredient.status === 'risky' ? 'bg-yellow-100 text-yellow-800' :
                ingredient.status === 'risk' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'}`}
            >
              {ingredient.status.charAt(0).toUpperCase() + ingredient.status.slice(1)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className={`${isFavorite ? 'text-red-500' : 'text-gray-400'}`}
              onClick={() => onToggleFavorite(ingredient)}
            >
              <Heart className="h-5 w-5" fill={isFavorite ? "currentColor" : "none"} />
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-600">{ingredient.description}</p>
            
            <div className="flex flex-wrap gap-1 mt-2">
              {ingredient.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="text-sm text-gray-500 mt-4">
              <p>Category: {ingredient.category.charAt(0).toUpperCase() + ingredient.category.slice(1)}</p>
              <p>Last Updated: {new Date(ingredient.lastUpdated).toLocaleDateString()}</p>
            </div>

            {ingredient.history && (
              <div className="mt-4 border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">History</h4>
                <div className="space-y-2">
                  {ingredient.history.map((entry, index) => (
                    <div key={index} className="text-sm">
                      <span className="text-gray-500">{entry.date}: </span>
                      <span className="text-gray-700">{entry.change}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowFeedbackForm(true)}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Provide Feedback
            </Button>
          </div>
        </div>
      </DialogContent>

      <FeedbackForm
        isOpen={showFeedbackForm}
        onClose={() => setShowFeedbackForm(false)}
        ingredientName={ingredient.name}
        ingredientId={ingredient.id}
      />
    </Dialog>
  );
};

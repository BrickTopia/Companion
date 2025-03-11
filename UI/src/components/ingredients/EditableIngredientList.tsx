import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useCallback } from 'react';

interface EditableIngredientListProps {
  initialText: string;
  onUpdate: (ingredients: string[]) => void;
}

export const EditableIngredientList = ({
  initialText,
  onUpdate,
}: EditableIngredientListProps) => {
  // Split initial text into ingredients, handling various separators
  const parseIngredients = (text: string): string[] => {
    return text
      .split(/[,;()]/)
      .map((i) => i.trim())
      .filter((i) => i.length > 0);
  };

  const [ingredients, setIngredients] = useState<string[]>(() =>
    parseIngredients(initialText)
  );
  const [newIngredient, setNewIngredient] = useState('');

  const addIngredient = useCallback(() => {
    if (newIngredient.trim()) {
      const updated = [...ingredients, newIngredient.trim()];
      setIngredients(updated);
      setNewIngredient('');
      onUpdate(updated);
    }
  }, [ingredients, newIngredient, onUpdate]);

  const removeIngredient = useCallback(
    (index: number) => {
      const updated = ingredients.filter((_, i) => i !== index);
      setIngredients(updated);
      onUpdate(updated);
    },
    [ingredients, onUpdate]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {ingredients.map((ingredient, index) => (
          <div
            key={index}
            className="group flex items-center gap-1 bg-white/80 px-3 py-1 rounded-full
                     border border-pastel-blue/20 shadow-sm"
          >
            <span className="text-sm text-gray-700">{ingredient}</span>
            <button
              onClick={() => removeIngredient(index)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-red-400" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={newIngredient}
          onChange={(e) => setNewIngredient(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addIngredient();
            }
          }}
          placeholder="Add ingredient..."
          className="flex-1"
        />
        <Button
          size="icon"
          variant="outline"
          onClick={addIngredient}
          disabled={!newIngredient.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

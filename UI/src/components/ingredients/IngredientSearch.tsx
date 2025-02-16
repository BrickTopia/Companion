
import { Input } from "@/components/ui/input";
import { Search, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IngredientSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  showOnlyFavorites: boolean;
  onToggleFavorites: () => void;
}

export const IngredientSearch = ({
  searchTerm,
  onSearchChange,
  showOnlyFavorites,
  onToggleFavorites
}: IngredientSearchProps) => {
  return (
    <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
      <div className="relative flex-1">
        <Input
          type="text"
          placeholder="Search ingredients..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
      </div>
      <Button
        variant={showOnlyFavorites ? "default" : "outline"}
        onClick={onToggleFavorites}
        className="w-full sm:w-auto"
      >
        <Heart className="mr-2 h-4 w-4" />
        {showOnlyFavorites ? "Show All" : "Show Favorites"}
      </Button>
    </div>
  );
};

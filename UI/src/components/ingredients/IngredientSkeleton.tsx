
import { Card } from "@/components/ui/card";

export const IngredientSkeleton = () => {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, index) => (
        <Card key={index} className="p-4 animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-gray-200" />
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-3 w-48 bg-gray-200 rounded" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

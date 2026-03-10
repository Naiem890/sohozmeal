import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterOptionsProps {
  transactionType: string;
  mealType: string;
  toggleTransactionType: () => void;
  setMealType: (v: string) => void;
}

const FilterOptions = ({ transactionType, mealType, toggleTransactionType, setMealType }: FilterOptionsProps) => {
  return (
    <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Type</span>
        <Button size="sm" variant="outline" onClick={toggleTransactionType} className="min-w-16">
          {transactionType}
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Meal</span>
        <Select value={mealType} onValueChange={setMealType}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="BREAKFAST">Breakfast</SelectItem>
            <SelectItem value="LUNCH">Lunch</SelectItem>
            <SelectItem value="DINNER">Dinner</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default FilterOptions;

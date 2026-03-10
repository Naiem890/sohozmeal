import { cn } from "@/lib/utils";

interface MealLocksProps {
  feasts: Record<string, boolean>;
  locks: Record<string, boolean>;
  handleMealLock: (type: string) => void;
}

export const MealLocks = ({ feasts, locks, handleMealLock }: MealLocksProps) => {
  const Btn = ({ type, label }: { type: string; label: string }) => {
    const isFeast = feasts[type];
    const isLock = locks[type];
    return (
      <button
        onClick={() => handleMealLock(type)}
        title={isFeast ? `${type} feast on — click to remove` : `Set ${type} feast`}
        className={cn(
          "w-7 h-7 rounded text-xs font-bold transition-all duration-150",
          isFeast
            ? "bg-amber-400 text-white shadow-sm ring-1 ring-amber-200"
            : isLock
            ? "bg-red-500 text-white"
            : "bg-muted text-muted-foreground hover:bg-muted/70"
        )}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex items-center gap-1.5">
      <Btn type="breakfast" label="B" />
      <Btn type="lunch" label="L" />
      <Btn type="dinner" label="D" />
    </div>
  );
};

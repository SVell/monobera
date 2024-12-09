import { cn } from "@bera/ui";
import { Icons } from "@bera/ui/icons";

const ProcessSteps = ({
  /**
   * Array of titles for each step
   */
  titles,
  /**
   * Index of the selected step
   */
  selectedIndex,
  /**
   * Indexes of the completed steps
   */
  completedIndexes,
}: { titles: string[]; selectedIndex: number; completedIndexes: number[] }) => {
  return (
    <div className="flex flex-col items-start gap-8">
      {titles.map((title, index) => (
        <div key={index} className="relative">
          {index < titles.length - 1 && (
            <div className="absolute left-4 top-full w-0.5 h-8 bg-[#373332]" />
          )}
          <div
            className={cn(
              "relative rounded-sm shadow-md border w-64 flex overflow-hidden",
              selectedIndex === index && "bg-[#373332] bg-opacity-55",
            )}
          >
            {selectedIndex === index && (
              <div className="bg-blue-500 w-[4px] flex-shrink-0" />
            )}
            <div className="p-4 flex justify-between w-full">
              <h3 className="font-normal">{title}</h3>
              {completedIndexes.includes(index) && (
                <Icons.checkCircle color={"#4ade80"} />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProcessSteps;

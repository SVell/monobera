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
  selectedStep,
  /**
   * Indexes of the completed steps
   */
  completedSteps,
  /**
   * Function to set the selected step
   */
  setCurrentStep,
  currentStep,
}: {
  titles: string[];
  selectedStep: number;
  completedSteps: number[];
  setCurrentStep: (arg0: number) => void;
  currentStep: number;
}) => {
  return (
    <div className={cn("flex flex-col items-start gap-8")}>
      {titles.map((title, index) => (
        <div
          key={index}
          className={cn(
            "relative",
            completedSteps.includes(index) && "cursor-pointer",
          )}
          onClick={() => {
            completedSteps.includes(index) && setCurrentStep(index);
          }}
        >
          {index < titles.length - 1 && (
            <div className="absolute left-4 top-full w-0.5 h-8 bg-[#373332]" />
          )}
          <div
            className={cn(
              "relative rounded-sm shadow-md border w-64 flex overflow-hidden",
              selectedStep === index && "bg-[#373332] bg-opacity-55",
            )}
          >
            {selectedStep === index && (
              <div className="bg-blue-500 w-[4px] flex-shrink-0" />
            )}
            <div className="p-4 flex justify-between w-full">
              <h3 className="font-normal">{title}</h3>
              {completedSteps.includes(index) && (
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

import { cn } from "@bera/ui";
import { Icons } from "@bera/ui/icons";

export interface VerifiedSteps {
  steps: boolean[];
  errors: (string | null)[];
}

const ProcessSteps = ({
  /**
   * Array of titles for each step
   * @type {string[]}
   */
  titles,
  /**
   * Index of the selected step
   * @type {number}
   */
  selectedStep,
  /**
   * Indexes of the completed steps
   * @type {number[]}
   */
  completedSteps,
  /**
   * Function to set the selected step
   * @type {(arg0: number) => void}
   */
  setCurrentStep,
  /**
   * Object containing the verification status of each step
   * @type {VerifiedSteps}
   */
  verifiedSteps,
  className,
}: {
  titles: string[];
  selectedStep: number;
  completedSteps: number[];
  setCurrentStep: (arg0: number) => void;
  verifiedSteps: VerifiedSteps;
  className?: string;
}) => {
  function isStepSelectable(index: number) {
    // NOTE: we check -1 to allow you to go back to the current (partially-completed) step
    return completedSteps.includes(index) || completedSteps.includes(index - 1);
  }

  return (
    <div
      className={cn(
        "flex flex-wrap text-sm items-start gap-4 overflow-visible py-2 xl:flex-col xl:gap-6",
        className,
      )}
    >
      {titles.map((title, index) => (
        <div
          key={index}
          title={(isStepSelectable(index) && verifiedSteps.errors[index]) || ""}
          className={cn(
            "relative w-full",
            isStepSelectable(index) ? "cursor-pointer" : "cursor-not-allowed",
          )}
          onClick={() => {
            isStepSelectable(index) && setCurrentStep(index);
          }}
        >
          {index < titles.length - 1 && (
            <div className="absolute left-1.5 top-full hidden h-6 w-0.5 bg-processStepBackground xl:block" />
          )}
          <div
            className={cn(
              "relative flex w-fit md:w-full overflow-hidden rounded-sm border shadow-md ",
              selectedStep === index &&
                "bg-processStepBackground bg-opacity-55",
            )}
          >
            {selectedStep === index && (
              <div className="w-1 absolute top-0 left-0 bottom-0 flex-shrink-0 bg-info-foreground" />
            )}
            <div className="flex w-full justify-between p-4 items-center">
              <h3 className="text-nowrap pr-2 font-normal">{title}</h3>
              {completedSteps.includes(index) &&
                (verifiedSteps.steps[index] ? (
                  <Icons.checkCircle
                    size={16}
                    className="text-semanticSuccessForeground -mr-2"
                  />
                ) : (
                  <Icons.xCircle
                    size={16}
                    className="text-destructive-foreground -mr-2"
                  />
                ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProcessSteps;

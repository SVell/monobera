import { cn } from "@bera/ui";
import { Icons } from "@bera/ui/icons";

export interface VerifiedSteps {
  steps: Record<string, boolean>;
  errors: Record<string, string | null>;
}

type EnumType = { [key: string]: string };

const ProcessSteps = <T extends EnumType>({
  stepEnum,
  selectedStep,
  completedSteps,
  setCurrentStep,
  verifiedSteps,
  className,
}: {
  stepEnum: T;
  selectedStep: T[keyof T];
  completedSteps: T[keyof T][];
  setCurrentStep: (arg0: T[keyof T]) => void;
  verifiedSteps: VerifiedSteps;
  className?: string;
}) => {
  const stepKeys = Object.keys(stepEnum) as (keyof T)[];
  const stepTitles = Object.values(stepEnum);

  function isStepSelectable(stepKey: T[keyof T]) {
    const currentIndex = stepKeys.findIndex((key) => stepEnum[key] === stepKey);
    const previousStep = stepKeys[currentIndex - 1];
    return (
      completedSteps.includes(stepKey) ||
      (previousStep && completedSteps.includes(stepEnum[previousStep]))
    );
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-start gap-4 overflow-visible py-2 text-sm xl:flex-col xl:gap-6",
        className,
      )}
    >
      {stepTitles.map((title, index) => {
        const stepKey = stepEnum[stepKeys[index]];
        return (
          <div
            key={String(stepKey)}
            title={
              (isStepSelectable(stepKey) &&
                verifiedSteps.errors[stepKey as string]) ||
              ""
            }
            className={cn(
              "relative w-full",
              isStepSelectable(stepKey)
                ? "cursor-pointer"
                : "cursor-not-allowed",
            )}
            onClick={() => {
              isStepSelectable(stepKey) && setCurrentStep(stepKey);
            }}
          >
            {index < stepTitles.length - 1 && (
              <div className="absolute left-1.5 top-full hidden h-6 w-0.5 bg-processStepBackground xl:block" />
            )}
            <div
              className={cn(
                "relative flex w-fit overflow-hidden rounded-sm border shadow-md md:w-full ",
                selectedStep === stepKey &&
                  "bg-processStepBackground bg-opacity-55",
              )}
            >
              {selectedStep === stepKey && (
                <div className="absolute bottom-0 left-0 top-0 w-1 flex-shrink-0 bg-info-foreground" />
              )}
              <div className="flex w-full items-center justify-between p-4">
                <h3 className="text-nowrap pr-2 font-normal">{title}</h3>
                {completedSteps.includes(stepKey) &&
                  (verifiedSteps.steps[stepKey as string] ? (
                    <Icons.checkCircle
                      size={16}
                      className="-mr-2 text-green-500"
                    />
                  ) : (
                    <Icons.xCircle
                      size={16}
                      className="-mr-2 text-destructive-foreground"
                    />
                  ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProcessSteps;

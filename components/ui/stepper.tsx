"use client";

import * as React from "react";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  title: string;
  description?: string;
}

interface StepperContextValue {
  currentStep: number;
  totalSteps: number;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

const StepperContext = React.createContext<StepperContextValue | null>(null);

export function useStepper() {
  const context = React.useContext(StepperContext);
  if (!context) {
    throw new Error("useStepper must be used within a Stepper component");
  }
  return context;
}

interface StepperProps {
  children: React.ReactNode;
  initialStep?: number;
  onStepChange?: (step: number) => void;
  className?: string;
}

export function Stepper({
  children,
  initialStep = 0,
  onStepChange,
  className,
}: StepperProps) {
  const [currentStep, setCurrentStep] = React.useState(initialStep);
  const childArray = React.Children.toArray(children);
  const totalSteps = childArray.length;

  const goToStep = React.useCallback(
    (step: number) => {
      if (step >= 0 && step < totalSteps) {
        setCurrentStep(step);
        onStepChange?.(step);
      }
    },
    [totalSteps, onStepChange]
  );

  const nextStep = React.useCallback(() => {
    goToStep(currentStep + 1);
  }, [currentStep, goToStep]);

  const prevStep = React.useCallback(() => {
    goToStep(currentStep - 1);
  }, [currentStep, goToStep]);

  const value = React.useMemo(
    () => ({
      currentStep,
      totalSteps,
      goToStep,
      nextStep,
      prevStep,
      isFirstStep: currentStep === 0,
      isLastStep: currentStep === totalSteps - 1,
    }),
    [currentStep, totalSteps, goToStep, nextStep, prevStep]
  );

  return (
    <StepperContext.Provider value={value}>
      <div className={cn("flex flex-col gap-4", className)}>{children}</div>
    </StepperContext.Provider>
  );
}

interface StepperHeaderProps {
  steps: Step[];
  className?: string;
}

export function StepperHeader({ steps, className }: StepperHeaderProps) {
  const { currentStep, goToStep } = useStepper();

  return (
    <div className={cn("flex items-center justify-between", className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isClickable = index <= currentStep;

        return (
          <React.Fragment key={step.id}>
            <button
              type="button"
              onClick={() => isClickable && goToStep(index)}
              disabled={!isClickable}
              className={cn(
                "flex flex-col items-center gap-2",
                isClickable && "cursor-pointer",
                !isClickable && "cursor-not-allowed opacity-50"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                  isCompleted &&
                    "border-primary bg-primary text-primary-foreground",
                  isCurrent && "border-primary text-primary",
                  !isCompleted && !isCurrent && "border-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "text-sm font-medium",
                    isCurrent && "text-primary",
                    !isCurrent && !isCompleted && "text-muted-foreground"
                  )}
                >
                  {step.title}
                </span>
                {step.description && (
                  <span className="text-xs text-muted-foreground">
                    {step.description}
                  </span>
                )}
              </div>
            </button>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-4",
                  index < currentStep ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

interface StepperContentProps {
  children: React.ReactNode;
  className?: string;
}

export function StepperContent({ children, className }: StepperContentProps) {
  const { currentStep } = useStepper();
  const childArray = React.Children.toArray(children);

  return (
    <div className={cn("min-h-[200px]", className)}>
      {childArray[currentStep]}
    </div>
  );
}

interface StepProps {
  children: React.ReactNode;
  className?: string;
}

export function Step({ children, className }: StepProps) {
  return <div className={cn("animate-in fade-in-50", className)}>{children}</div>;
}

interface StepperFooterProps {
  children?: React.ReactNode;
  className?: string;
  nextLabel?: string;
  prevLabel?: string;
  finishLabel?: string;
  onFinish?: () => void;
  showDefaultButtons?: boolean;
}

export function StepperFooter({
  children,
  className,
  nextLabel = "Next",
  prevLabel = "Previous",
  finishLabel = "Finish",
  onFinish,
  showDefaultButtons = true,
}: StepperFooterProps) {
  const { nextStep, prevStep, isFirstStep, isLastStep } = useStepper();

  if (children) {
    return <div className={cn("flex justify-between", className)}>{children}</div>;
  }

  if (!showDefaultButtons) {
    return null;
  }

  return (
    <div className={cn("flex justify-between", className)}>
      <button
        type="button"
        onClick={prevStep}
        disabled={isFirstStep}
        className={cn(
          "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors",
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
          isFirstStep && "cursor-not-allowed opacity-50"
        )}
      >
        {prevLabel}
      </button>
      {isLastStep ? (
        <button
          type="button"
          onClick={onFinish}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {finishLabel}
        </button>
      ) : (
        <button
          type="button"
          onClick={nextStep}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {nextLabel}
        </button>
      )}
    </div>
  );
}

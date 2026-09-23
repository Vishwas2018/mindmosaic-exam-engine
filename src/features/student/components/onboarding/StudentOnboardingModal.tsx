"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { useOnboardingStore } from "@/features/student/onboarding/onboarding-store";
import { OnboardingStepWelcome } from "./OnboardingStepWelcome";
import { OnboardingStepInterests } from "./OnboardingStepInterests";
import { OnboardingStepGoal } from "./OnboardingStepGoal";
import { OnboardingDiagnosticRunner } from "./OnboardingDiagnosticRunner";
import { OnboardingDiagnosticSummary } from "./OnboardingDiagnosticSummary";

export interface StudentOnboardingModalProps {
  firstName: string | null;
  yearLevel: number | null;
  onboardingCompleted: boolean;
  interests?: readonly string[];
  weeklyGoalMinutes?: number;
}

export function StudentOnboardingModal({
  firstName,
  yearLevel,
  onboardingCompleted,
  interests,
  weeklyGoalMinutes,
}: StudentOnboardingModalProps) {
  const router = useRouter();
  const { isOpen, step, setStep, open, close, reset } = useOnboardingStore();
  const initialisedRef = useRef(false);

  // Auto-open on first render if onboarding is not completed
  useEffect(() => {
    if (!initialisedRef.current && !onboardingCompleted) {
      initialisedRef.current = true;
      open({
        initialYearLevel: yearLevel,
        initialInterests: interests,
        initialWeeklyGoal: weeklyGoalMinutes,
      });
    }
  }, [onboardingCompleted, yearLevel, interests, weeklyGoalMinutes, open]);

  const handleFinish = () => {
    reset();
    router.refresh();
  };

  const getStepTitle = () => {
    switch (step) {
      case "welcome":
        return "Welcome to MindMosaic";
      case "interests":
        return "Focus Areas";
      case "goal":
        return "Weekly Practice Target";
      case "warmup_questions":
        return "Diagnostic Warmup";
      case "warmup_summary":
        return "Warmup Complete";
      default:
        return "Student Onboarding";
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={close}
      title={getStepTitle()}
      className="max-w-xl"
      hideCloseButton={step === "warmup_summary"}
    >
      {step === "welcome" && (
        <OnboardingStepWelcome
          firstName={firstName}
          onNext={() => setStep("interests")}
        />
      )}

      {step === "interests" && (
        <OnboardingStepInterests
          onBack={() => setStep("welcome")}
          onNext={() => setStep("goal")}
        />
      )}

      {step === "goal" && (
        <OnboardingStepGoal
          onBack={() => setStep("interests")}
          onStartWarmup={() => setStep("warmup_questions")}
        />
      )}

      {step === "warmup_questions" && <OnboardingDiagnosticRunner />}

      {step === "warmup_summary" && (
        <OnboardingDiagnosticSummary onFinish={handleFinish} />
      )}
    </Modal>
  );
}
